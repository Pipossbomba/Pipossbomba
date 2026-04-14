"""
Bot Engine — núcleo de decisão e execução de trades
Gere estado persistente, regras de risco, cálculo de posição e integração Jupiter DEX
"""

import importlib
import json
import logging
import os
import sys
import time
import uuid
from datetime import datetime, date, timedelta

import requests

# ─── Configuração ────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
config_mod = importlib.import_module("4_config")
CONFIG = config_mod.CONFIG

logger = logging.getLogger("bot_engine")

# ─── Constantes Jupiter API v6 ───────────────────────────────
JUPITER_QUOTE_URL = "https://quote-api.jup.ag/v6/quote"
JUPITER_SWAP_URL  = "https://quote-api.jup.ag/v6/swap"
LAMPORTS_PER_SOL  = 1_000_000_000  # 1 SOL = 10^9 lamports
USDC_DECIMALS     = 6              # USDC tem 6 decimais

# ─── Carrega o notificador Telegram (importação tardia) ──────
def _tg_notify(event: str, data: dict):
    """Envia notificação Telegram sem bloquear o fluxo principal."""
    try:
        tg = importlib.import_module("6_telegram_notify")
        tg.telegram_notify(event, data)
    except Exception as exc:
        logger.warning("Falha silenciosa no Telegram: %s", exc)


# ════════════════════════════════════════════════════════════
# GESTÃO DE ESTADO
# ════════════════════════════════════════════════════════════

def _default_state() -> dict:
    """Estado inicial do bot."""
    return {
        "position": {
            "open":         False,
            "entry_price":  0.0,
            "amount_sol":   0.0,
            "entry_time":   "",
            "entry_signal": {},
        },
        "last_trade_time":   "",
        "daily_pnl_usd":     0.0,
        "daily_date":        date.today().isoformat(),
        "last_sol_balance":  0.0,
        "trade_history":     [],
    }


def load_state() -> dict:
    """Carrega o estado do ficheiro JSON. Cria estado novo se não existir."""
    state_file = CONFIG["STATE_FILE"]
    if os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                state = json.load(f)
            # Garante que todos os campos existem (migração)
            defaults = _default_state()
            for key, val in defaults.items():
                state.setdefault(key, val)
            return state
        except (json.JSONDecodeError, IOError) as exc:
            logger.error("Erro ao carregar estado: %s — a usar estado novo", exc)

    return _default_state()


def save_state(state: dict):
    """Persiste o estado no ficheiro JSON."""
    state_file = CONFIG["STATE_FILE"]
    try:
        with open(state_file, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2, ensure_ascii=False, default=str)
    except IOError as exc:
        logger.error("Erro ao guardar estado: %s", exc)


def _reset_daily_state_if_new_day(state: dict) -> dict:
    """Reinicia métricas diárias se for um novo dia."""
    today = date.today().isoformat()
    if state.get("daily_date") != today:
        logger.info("Novo dia detectado — a reiniciar métricas diárias")
        state["daily_pnl_usd"] = 0.0
        state["daily_date"]    = today
    return state


# ════════════════════════════════════════════════════════════
# CONSULTA DE SALDO SOL VIA RPC
# ════════════════════════════════════════════════════════════

def get_sol_balance(wallet_address: str) -> float:
    """
    Consulta o saldo SOL de uma carteira via RPC Solana.
    Retorna o saldo em SOL (float). Retorna 0.0 em caso de erro.
    """
    rpc_url = CONFIG["SOLANA_RPC_URL"]
    payload = {
        "jsonrpc": "2.0",
        "id":      1,
        "method":  "getBalance",
        "params":  [wallet_address],
    }
    try:
        response = requests.post(rpc_url, json=payload, timeout=10)
        response.raise_for_status()
        result = response.json()
        lamports = result["result"]["value"]
        sol = lamports / LAMPORTS_PER_SOL
        logger.info("Saldo SOL: %.6f SOL (%d lamports)", sol, lamports)
        return sol
    except requests.exceptions.RequestException as exc:
        logger.error("Erro ao consultar saldo RPC: %s", exc)
        return 0.0
    except (KeyError, TypeError) as exc:
        logger.error("Resposta RPC inesperada: %s", exc)
        return 0.0


# ════════════════════════════════════════════════════════════
# CÁLCULO DO TAMANHO DE POSIÇÃO
# ════════════════════════════════════════════════════════════

def calculate_position_size(sol_balance: float, signal_strength: int) -> float:
    """
    Calcula o tamanho da posição em SOL baseado no saldo e força do sinal.
    - Força 1: 50% do risco calculado
    - Força 2: 100% do risco calculado
    - Força 3: 150% do risco calculado (max do configurado)
    Respeita MIN_TRADE_SOL e MAX_TRADE_SOL.
    """
    risk_pct  = CONFIG["RISK_PER_TRADE_PCT"] / 100.0
    base_size = sol_balance * risk_pct

    # Ajusta por força do sinal
    multipliers = {1: 0.5, 2: 1.0, 3: 1.5}
    multiplier = multipliers.get(signal_strength, 1.0)
    size = base_size * multiplier

    # Aplica limites
    size = max(size, CONFIG["MIN_TRADE_SOL"])
    size = min(size, CONFIG["MAX_TRADE_SOL"])

    logger.info(
        "Tamanho calculado: %.4f SOL (saldo=%.4f, risco=%.1f%%, força=%d, mult=%.1f)",
        size, sol_balance, CONFIG["RISK_PER_TRADE_PCT"], signal_strength, multiplier
    )
    return round(size, 6)


# ════════════════════════════════════════════════════════════
# VERIFICAÇÃO DE REGRAS DE RISCO
# ════════════════════════════════════════════════════════════

def check_risk_rules(signal: dict, state: dict) -> tuple:
    """
    Verifica todas as regras de risco antes de executar um trade.
    Retorna (permitido: bool, motivo: str).
    """
    action   = signal["action"]
    strength = int(signal["strength"])

    # 1. Força mínima do sinal
    if strength < CONFIG["MIN_SIGNAL_STRENGTH"]:
        motivo = f"Força insuficiente: {strength} < {CONFIG['MIN_SIGNAL_STRENGTH']}"
        logger.info("Sinal bloqueado — %s", motivo)
        return False, motivo

    # 2. Limite de perda diária
    if state["daily_pnl_usd"] <= -CONFIG["MAX_DAILY_LOSS_USD"]:
        motivo = f"Limite de perda diária atingido: ${state['daily_pnl_usd']:.2f}"
        logger.warning("Sinal bloqueado — %s", motivo)
        return False, motivo

    # 3. Sem dupla compra (posição já aberta)
    if action == "BUY" and state["position"]["open"]:
        motivo = "Já há uma posição LONG aberta — sem dupla compra"
        logger.info("Sinal bloqueado — %s", motivo)
        return False, motivo

    # 4. Sem SELL sem posição aberta
    if action == "SELL" and not state["position"]["open"]:
        motivo = "Nenhuma posição aberta para fechar"
        logger.info("Sinal bloqueado — %s", motivo)
        return False, motivo

    # 5. Cooldown entre trades
    last_trade_str = state.get("last_trade_time", "")
    if last_trade_str:
        try:
            last_trade_dt = datetime.fromisoformat(last_trade_str)
            elapsed = (datetime.utcnow() - last_trade_dt).total_seconds() / 60
            cooldown = CONFIG["COOLDOWN_MINUTES"]
            if elapsed < cooldown:
                minutos_restantes = round(cooldown - elapsed, 1)
                motivo = f"Cooldown activo — espera {minutos_restantes} min"
                logger.info("Sinal bloqueado — %s", motivo)
                return False, motivo
        except (ValueError, TypeError):
            pass

    return True, "OK"


# ════════════════════════════════════════════════════════════
# JUPITER DEX — QUOTE E SWAP
# ════════════════════════════════════════════════════════════

def get_jupiter_quote(input_mint: str, output_mint: str, amount_lamports: int) -> dict:
    """
    Obtém cotação de swap da Jupiter API v6.
    amount_lamports: quantidade do token de entrada em unidades base.
    Retorna o dicionário de quote ou lança excepção em caso de erro.
    """
    params = {
        "inputMint":      input_mint,
        "outputMint":     output_mint,
        "amount":         str(amount_lamports),
        "slippageBps":    str(CONFIG["SLIPPAGE_BPS"]),
        "onlyDirectRoutes": "false",
    }
    try:
        logger.info("A obter quote Jupiter: %s → %s, %d unidades", input_mint, output_mint, amount_lamports)
        response = requests.get(JUPITER_QUOTE_URL, params=params, timeout=15)
        response.raise_for_status()
        quote = response.json()
        in_amount  = int(quote.get("inAmount",  0))
        out_amount = int(quote.get("outAmount", 0))
        logger.info(
            "Quote obtido: entrada=%d, saída=%d, preço de impacto=%s%%",
            in_amount, out_amount, quote.get("priceImpactPct", "?")
        )
        return quote
    except requests.exceptions.RequestException as exc:
        msg = f"Erro ao obter quote Jupiter: {exc}"
        logger.error(msg)
        raise RuntimeError(msg) from exc
    except (KeyError, ValueError) as exc:
        msg = f"Resposta Jupiter inválida: {exc}"
        logger.error(msg)
        raise RuntimeError(msg) from exc


def build_jupiter_swap_transaction(quote: dict, wallet_public_key: str) -> str:
    """
    Constrói a transacção de swap via Jupiter API v6.
    Retorna swapTransaction em base64.
    """
    payload = {
        "quoteResponse":               quote,
        "userPublicKey":               wallet_public_key,
        "wrapAndUnwrapSol":            True,
        "prioritizationFeeLamports":   CONFIG["PRIORITY_FEE"],
        "dynamicComputeUnitLimit":     True,
    }
    try:
        logger.info("A construir transacção de swap Jupiter para %s", wallet_public_key)
        response = requests.post(JUPITER_SWAP_URL, json=payload, timeout=15)
        response.raise_for_status()
        result = response.json()
        swap_tx = result.get("swapTransaction")
        if not swap_tx:
            raise RuntimeError(f"Jupiter não devolveu swapTransaction: {result}")
        logger.info("swapTransaction obtido (%d bytes base64)", len(swap_tx))
        return swap_tx
    except requests.exceptions.RequestException as exc:
        msg = f"Erro ao construir swap Jupiter: {exc}"
        logger.error(msg)
        raise RuntimeError(msg) from exc


def save_pending_transaction(swap_tx_b64: str, signal: dict, amount_sol: float, action: str) -> str:
    """
    Guarda a transacção pendente em ficheiro JSON para o wallet signer.
    Retorna o caminho do ficheiro criado.
    """
    tx_id     = str(uuid.uuid4())[:8]
    filename  = f"{CONFIG['PENDING_TX_PREFIX']}{tx_id}.json"
    tx_data   = {
        "tx_id":           tx_id,
        "action":          action,
        "amount_sol":      amount_sol,
        "price":           float(signal.get("price", 0)),
        "symbol":          signal.get("symbol", ""),
        "strength":        int(signal.get("strength", 0)),
        "swapTransaction": swap_tx_b64,
        "timestamp":       datetime.utcnow().isoformat(),
    }
    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(tx_data, f, indent=2)
        logger.info("Transacção pendente guardada: %s", filename)
        return filename
    except IOError as exc:
        logger.error("Erro ao guardar transacção pendente: %s", exc)
        raise


# ════════════════════════════════════════════════════════════
# EXECUÇÃO DE TRADE (BUY / SELL)
# ════════════════════════════════════════════════════════════

def execute_buy(signal: dict, state: dict) -> dict:
    """
    Executa um trade de compra (BUY).
    Em DRY_RUN, simula sem enviar à blockchain.
    Retorna dicionário com resultado.
    """
    price      = float(signal.get("price", 0))
    sol_balance = get_sol_balance(CONFIG["WALLET_PUBLIC_KEY"])
    state["last_sol_balance"] = sol_balance

    amount_sol = calculate_position_size(sol_balance, int(signal.get("strength", 1)))

    if CONFIG["DRY_RUN"]:
        # ── Modo simulação ────────────────────────────────────
        logger.info("[DRY RUN] Simulando BUY: %.4f SOL @ $%.2f", amount_sol, price)
        tx_hash = f"DRY_RUN_BUY_{uuid.uuid4().hex[:16].upper()}"

        state["position"] = {
            "open":         True,
            "entry_price":  price,
            "amount_sol":   amount_sol,
            "entry_time":   datetime.utcnow().isoformat(),
            "entry_signal": signal,
        }
        state["last_trade_time"] = datetime.utcnow().isoformat()
        save_state(state)

        _tg_notify("TRADE_EXEC", {
            "action": "BUY", "amount_sol": amount_sol, "price": price,
            "tx_hash": tx_hash, "dry_run": True
        })
        return {"status": "dry_run", "action": "BUY", "amount_sol": amount_sol,
                "price": price, "tx_hash": tx_hash}

    # ── Modo real — obtém quote e constrói transacção ─────────
    try:
        tokens = CONFIG["TOKENS"]
        # Comprar SOL com USDC: input=USDC, output=SOL
        # Converte amount_sol em USDC: approximadamente price * amount_sol
        usdc_amount = int(price * amount_sol * (10 ** USDC_DECIMALS))

        quote = get_jupiter_quote(
            input_mint   = tokens[CONFIG["INPUT_TOKEN"]],
            output_mint  = tokens[CONFIG["OUTPUT_TOKEN"]],
            amount_lamports = usdc_amount,
        )
        swap_tx_b64 = build_jupiter_swap_transaction(quote, CONFIG["WALLET_PUBLIC_KEY"])
        pending_file = save_pending_transaction(swap_tx_b64, signal, amount_sol, "BUY")

        state["position"] = {
            "open":         True,
            "entry_price":  price,
            "amount_sol":   amount_sol,
            "entry_time":   datetime.utcnow().isoformat(),
            "entry_signal": signal,
            "pending_file": pending_file,
        }
        state["last_trade_time"] = datetime.utcnow().isoformat()
        save_state(state)

        _tg_notify("TRADE_EXEC", {
            "action": "BUY", "amount_sol": amount_sol, "price": price,
            "tx_hash": "", "dry_run": False
        })
        logger.info("Transacção BUY guardada em %s — aguarda assinatura", pending_file)
        return {"status": "pending_signature", "action": "BUY",
                "pending_file": pending_file, "amount_sol": amount_sol}

    except RuntimeError as exc:
        logger.error("Falha no BUY: %s", exc)
        _tg_notify("ERRO", {"evento": "Falha ao executar BUY", "detalhe": str(exc)})
        return {"status": "error", "detail": str(exc)}


def execute_sell(signal: dict, state: dict) -> dict:
    """
    Executa um trade de venda (SELL) para fechar posição existente.
    Em DRY_RUN, simula sem enviar à blockchain.
    Retorna dicionário com resultado.
    """
    position = state["position"]
    if not position["open"]:
        return {"status": "error", "detail": "Nenhuma posição aberta"}

    exit_price  = float(signal.get("price", 0))
    entry_price = float(position["entry_price"])
    amount_sol  = float(position["amount_sol"])

    # Calcula PnL em USD
    pnl_usd = (exit_price - entry_price) * amount_sol
    state["daily_pnl_usd"] = state.get("daily_pnl_usd", 0.0) + pnl_usd

    if CONFIG["DRY_RUN"]:
        # ── Modo simulação ────────────────────────────────────
        logger.info(
            "[DRY RUN] Simulando SELL: %.4f SOL @ $%.2f | PnL: %+.2f USD",
            amount_sol, exit_price, pnl_usd
        )
        tx_hash = f"DRY_RUN_SELL_{uuid.uuid4().hex[:16].upper()}"

        # Regista na história
        trade_record = {
            "action":      "SELL",
            "amount_sol":  amount_sol,
            "entry_price": entry_price,
            "exit_price":  exit_price,
            "pnl_usd":     round(pnl_usd, 4),
            "timestamp":   datetime.utcnow().isoformat(),
            "tx_hash":     tx_hash,
            "dry_run":     True,
        }
        state["trade_history"].append(trade_record)
        state["position"] = {"open": False, "entry_price": 0.0, "amount_sol": 0.0,
                             "entry_time": "", "entry_signal": {}}
        state["last_trade_time"] = datetime.utcnow().isoformat()
        save_state(state)

        _tg_notify("POSICAO_FECHADA", {
            "action": "SELL", "pnl_usd": pnl_usd,
            "daily_pnl_usd": state["daily_pnl_usd"],
            "tx_hash": tx_hash, "dry_run": True
        })
        return {"status": "dry_run", "action": "SELL", "pnl_usd": round(pnl_usd, 4),
                "tx_hash": tx_hash}

    # ── Modo real — obtém quote e constrói transacção ─────────
    try:
        tokens = CONFIG["TOKENS"]
        # Vender SOL por USDC: input=SOL, output=USDC
        amount_lamports = int(amount_sol * LAMPORTS_PER_SOL)

        quote = get_jupiter_quote(
            input_mint      = tokens["SOL"],
            output_mint     = tokens[CONFIG["INPUT_TOKEN"]],
            amount_lamports = amount_lamports,
        )
        swap_tx_b64 = build_jupiter_swap_transaction(quote, CONFIG["WALLET_PUBLIC_KEY"])
        pending_file = save_pending_transaction(swap_tx_b64, signal, amount_sol, "SELL")

        # Regista na história (PnL provisório até confirmação)
        trade_record = {
            "action":       "SELL",
            "amount_sol":   amount_sol,
            "entry_price":  entry_price,
            "exit_price":   exit_price,
            "pnl_usd":      round(pnl_usd, 4),
            "timestamp":    datetime.utcnow().isoformat(),
            "pending_file": pending_file,
            "dry_run":      False,
        }
        state["trade_history"].append(trade_record)
        state["position"] = {"open": False, "entry_price": 0.0, "amount_sol": 0.0,
                             "entry_time": "", "entry_signal": {}}
        state["last_trade_time"] = datetime.utcnow().isoformat()
        save_state(state)

        _tg_notify("POSICAO_FECHADA", {
            "action": "SELL", "pnl_usd": pnl_usd,
            "daily_pnl_usd": state["daily_pnl_usd"],
            "tx_hash": "", "dry_run": False
        })
        logger.info("Transacção SELL guardada em %s — aguarda assinatura", pending_file)
        return {"status": "pending_signature", "action": "SELL",
                "pending_file": pending_file, "pnl_usd": round(pnl_usd, 4)}

    except RuntimeError as exc:
        logger.error("Falha no SELL: %s", exc)
        _tg_notify("ERRO", {"evento": "Falha ao executar SELL", "detalhe": str(exc)})
        return {"status": "error", "detail": str(exc)}


# ════════════════════════════════════════════════════════════
# FUNÇÃO PRINCIPAL — PROCESSA SINAL
# ════════════════════════════════════════════════════════════

def process_signal(signal: dict) -> dict:
    """
    Ponto de entrada principal: recebe sinal do webhook e decide o que fazer.
    Retorna dicionário com resultado da operação.
    """
    action   = signal.get("action", "").upper()
    symbol   = signal.get("symbol", "?")
    strength = int(signal.get("strength", 0))
    price    = float(signal.get("price", 0))

    logger.info(
        "=== PROCESSANDO SINAL: %s | %s | Força %d/3 | $%.2f ===",
        action, symbol, strength, price
    )

    # Notifica recepção do sinal via Telegram
    if action == "BUY":
        _tg_notify("SINAL_BUY", signal)
    elif action == "SELL":
        _tg_notify("SINAL_SELL", signal)

    # Carrega e actualiza estado
    state = load_state()
    state = _reset_daily_state_if_new_day(state)

    # Verifica regras de risco
    permitido, motivo = check_risk_rules(signal, state)
    if not permitido:
        logger.info("Trade bloqueado: %s", motivo)
        _tg_notify("BLOQUEADO", {
            "motivo": motivo, "action": action, "strength": strength
        })
        save_state(state)
        return {"status": "blocked", "reason": motivo}

    # Executa o trade
    if action == "BUY":
        result = execute_buy(signal, state)
    elif action == "SELL":
        result = execute_sell(signal, state)
    else:
        logger.error("Acção desconhecida: %s", action)
        return {"status": "error", "detail": f"Acção desconhecida: {action}"}

    logger.info("Resultado: %s", result)
    return result
