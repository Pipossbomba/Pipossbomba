"""
Telegram Notifier — envia notificações formatadas para o Telegram
Usa a API REST directamente (sem biblioteca externa)
Falha silenciosamente — nunca bloqueia o fluxo principal do bot
"""

import json
import logging
import os
import sys
import importlib
from datetime import datetime, date

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
config_mod = importlib.import_module("4_config")
CONFIG = config_mod.CONFIG

logger = logging.getLogger("telegram_notify")

# URL base da API do Telegram
TELEGRAM_API_BASE = "https://api.telegram.org/bot{token}/sendMessage"


def _send_message(text: str) -> bool:
    """
    Envia uma mensagem formatada via Telegram.
    Retorna True se enviou com sucesso, False caso contrário.
    Nunca levanta excepções — falha silenciosa.
    """
    token = CONFIG.get("TELEGRAM_BOT_TOKEN", "")
    chat_id = CONFIG.get("TELEGRAM_CHAT_ID", "")

    if not token or not chat_id:
        logger.debug("Telegram não configurado (TOKEN ou CHAT_ID em falta)")
        return False

    url = TELEGRAM_API_BASE.format(token=token)
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": False,
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            logger.debug("Telegram: mensagem enviada com sucesso")
            return True
        else:
            logger.warning(
                "Telegram: resposta inesperada %d — %s",
                response.status_code, response.text[:200]
            )
            return False
    except requests.exceptions.Timeout:
        logger.warning("Telegram: timeout ao enviar mensagem")
        return False
    except requests.exceptions.ConnectionError as exc:
        logger.warning("Telegram: erro de ligação — %s", exc)
        return False
    except Exception as exc:
        logger.warning("Telegram: erro inesperado — %s", exc)
        return False


def _stars(strength: int) -> str:
    """Converte força numérica em estrelas (ex: 2 → ★★☆)."""
    filled = "★" * strength
    empty  = "☆" * (3 - strength)
    return filled + empty


def telegram_notify(event: str, data: dict) -> bool:
    """
    Envia notificação Telegram formatada para o evento indicado.

    Eventos suportados:
        SINAL_BUY     — sinal de compra recebido
        SINAL_SELL    — sinal de venda recebido
        BLOQUEADO     — sinal bloqueado pelas regras de risco
        TRADE_EXEC    — trade executado com sucesso
        POSICAO_FECHADA — posição fechada com PnL
        ERRO          — erro / falha no sistema
        RESUMO_DIARIO — resumo diário automático
    """
    event = event.upper()
    msg = None

    try:
        if event == "SINAL_BUY":
            strength = int(data.get("strength", 1))
            msg = (
                f"🟢 *SINAL BUY* — {data.get('symbol', '?')}\n"
                f"💪 Força: {_stars(strength)} ({strength}/3)\n"
                f"💰 Preço: ${float(data.get('price', 0)):.2f}\n"
                f"📊 RSI: {data.get('rsi', '?')} | "
                f"WT1: {data.get('wt1', '?')} | "
                f"MFI: {data.get('mfi', '?')}\n"
                f"⏰ {data.get('time', datetime.utcnow().strftime('%Y-%m-%d %H:%M'))}"
            )

        elif event == "SINAL_SELL":
            strength = int(data.get("strength", 1))
            msg = (
                f"🔴 *SINAL SELL* — {data.get('symbol', '?')}\n"
                f"💪 Força: {_stars(strength)} ({strength}/3)\n"
                f"💰 Preço: ${float(data.get('price', 0)):.2f}\n"
                f"📊 RSI: {data.get('rsi', '?')} | "
                f"WT1: {data.get('wt1', '?')} | "
                f"MFI: {data.get('mfi', '?')}\n"
                f"⏰ {data.get('time', datetime.utcnow().strftime('%Y-%m-%d %H:%M'))}"
            )

        elif event == "BLOQUEADO":
            msg = (
                f"🛑 *Sinal Bloqueado*\n"
                f"Motivo: {data.get('motivo', 'Regra de risco activa')}\n"
                f"Acção: {data.get('action', '?')} | "
                f"Força: {data.get('strength', '?')}"
            )

        elif event == "TRADE_EXEC":
            action   = data.get("action", "?")
            amount   = float(data.get("amount_sol", 0))
            price    = float(data.get("price", 0))
            tx_hash  = data.get("tx_hash", "")
            dry_run  = data.get("dry_run", False)

            solscan_url = f"https://solscan.io/tx/{tx_hash}" if tx_hash else ""
            link_text   = f"\n🔗 Solscan: [ver transacção]({solscan_url})" if solscan_url else ""
            dry_tag     = " *(DRY RUN)*" if dry_run else ""

            msg = (
                f"⚡ *Trade Executado*{dry_tag}\n"
                f"Acção: {action}\n"
                f"Quantidade: {amount:.4f} SOL\n"
                f"Preço: ${price:.2f}"
                f"{link_text}"
            )

        elif event == "POSICAO_FECHADA":
            action    = data.get("action", "SELL")
            pnl       = float(data.get("pnl_usd", 0))
            daily_pnl = float(data.get("daily_pnl_usd", 0))
            tx_hash   = data.get("tx_hash", "")
            dry_run   = data.get("dry_run", False)

            pnl_emoji     = "✅" if pnl >= 0 else "❌"
            pnl_sign      = "+" if pnl >= 0 else ""
            daily_sign    = "+" if daily_pnl >= 0 else ""
            solscan_url   = f"https://solscan.io/tx/{tx_hash}" if tx_hash else ""
            link_text     = f"\n🔗 Solscan: [ver transacção]({solscan_url})" if solscan_url else ""
            dry_tag       = " *(DRY RUN)*" if dry_run else ""

            msg = (
                f"💵 *Posição Fechada*{dry_tag}\n"
                f"Acção: {action}\n"
                f"PnL: {pnl_sign}${pnl:.2f} {pnl_emoji}\n"
                f"Total hoje: {daily_sign}${daily_pnl:.2f}"
                f"{link_text}"
            )

        elif event == "ERRO":
            msg = (
                f"⚠️ *Erro no Bot*\n"
                f"Evento: {data.get('evento', 'Erro desconhecido')}\n"
                f"Detalhe: {str(data.get('detalhe', ''))[:300]}"
            )

        elif event == "RESUMO_DIARIO":
            total      = int(data.get("total_trades", 0))
            wins       = int(data.get("wins", 0))
            losses     = int(data.get("losses", 0))
            pnl        = float(data.get("pnl_usd", 0))
            best       = float(data.get("best_trade", 0))
            worst      = float(data.get("worst_trade", 0))
            saldo      = float(data.get("saldo_sol", 0))
            pnl_sign   = "+" if pnl >= 0 else ""
            best_sign  = "+" if best >= 0 else ""
            worst_sign = "+" if worst >= 0 else ""

            msg = (
                f"📊 *Resumo do Dia*\n"
                f"Trades: {total} ({wins} ✅ {losses} ❌)\n"
                f"PnL: {pnl_sign}${pnl:.2f}\n"
                f"Melhor trade: {best_sign}${best:.2f}\n"
                f"Pior trade: {worst_sign}${worst:.2f}\n"
                f"Saldo actual: {saldo:.4f} SOL"
            )

        else:
            # Evento genérico
            msg = (
                f"ℹ️ *Bot — {event}*\n"
                f"{json.dumps(data, ensure_ascii=False, indent=2)[:500]}"
            )

    except Exception as exc:
        logger.warning("Erro ao formatar mensagem Telegram (%s): %s", event, exc)
        return False

    if msg:
        return _send_message(msg)
    return False


def get_daily_summary(state_file: str = None) -> dict:
    """
    Calcula as métricas do dia a partir do bot_state.json.
    Retorna dicionário pronto para passar a telegram_notify("RESUMO_DIARIO", ...)
    """
    if state_file is None:
        state_file = CONFIG.get("STATE_FILE", "bot_state.json")

    today_str = date.today().isoformat()

    summary = {
        "total_trades": 0,
        "wins": 0,
        "losses": 0,
        "pnl_usd": 0.0,
        "best_trade": 0.0,
        "worst_trade": 0.0,
        "saldo_sol": 0.0,
    }

    try:
        with open(state_file, "r", encoding="utf-8") as f:
            state = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return summary

    history = state.get("trade_history", [])

    # Filtra apenas trades de hoje
    today_trades = [
        t for t in history
        if str(t.get("timestamp", "")).startswith(today_str)
    ]

    if not today_trades:
        summary["saldo_sol"] = float(state.get("last_sol_balance", 0.0))
        return summary

    pnl_values = []
    for trade in today_trades:
        pnl = float(trade.get("pnl_usd", 0.0))
        pnl_values.append(pnl)
        summary["total_trades"] += 1
        if pnl >= 0:
            summary["wins"] += 1
        else:
            summary["losses"] += 1

    summary["pnl_usd"]      = sum(pnl_values)
    summary["best_trade"]   = max(pnl_values) if pnl_values else 0.0
    summary["worst_trade"]  = min(pnl_values) if pnl_values else 0.0
    summary["saldo_sol"]    = float(state.get("last_sol_balance", 0.0))

    return summary


# ─── Teste rápido ────────────────────────────────────────────
if __name__ == "__main__":
    # Testa todos os tipos de notificação com dados de exemplo
    print("A testar notificações Telegram...")

    telegram_notify("SINAL_BUY", {
        "symbol": "SOLUSDT", "strength": 3, "price": 150.0,
        "rsi": 28, "wt1": -55, "mfi": -10,
        "time": "2024-01-01 10:00"
    })
    telegram_notify("SINAL_SELL", {
        "symbol": "SOLUSDT", "strength": 2, "price": 160.0,
        "rsi": 72, "wt1": 58, "mfi": 12,
        "time": "2024-01-01 14:00"
    })
    telegram_notify("BLOQUEADO", {
        "motivo": "Cooldown activo — espera 8 min",
        "action": "BUY", "strength": 1
    })
    telegram_notify("TRADE_EXEC", {
        "action": "BUY", "amount_sol": 0.15, "price": 150.0,
        "tx_hash": "5KtPn1L...", "dry_run": True
    })
    telegram_notify("POSICAO_FECHADA", {
        "action": "SELL", "pnl_usd": 4.20, "daily_pnl_usd": 8.50,
        "tx_hash": "5KtPn1L...", "dry_run": True
    })
    telegram_notify("ERRO", {
        "evento": "Falha ao obter quote Jupiter",
        "detalhe": "Connection timeout"
    })
    telegram_notify("RESUMO_DIARIO", {
        "total_trades": 5, "wins": 3, "losses": 2,
        "pnl_usd": 12.30, "best_trade": 8.20, "worst_trade": -3.10,
        "saldo_sol": 2.45
    })
    print("Testes enviados (verifica o Telegram).")
