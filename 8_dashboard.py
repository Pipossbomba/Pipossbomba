"""
Dashboard Web — interface gráfica para o Market Cypher Pro Bot
Corre na porta 5001 (separado do webhook server na porta 5000)
Funcionalidades:
  - Configuração do .env via formulário seguro
  - Dashboard em tempo real com trades, PnL e posição actual
  - Auto-refresh a cada 5 segundos
  - Painel de teste de sinais (DRY RUN)
"""

import importlib
import json
import logging
import os
import sys
from datetime import date, datetime

import requests as http_requests
from flask import Flask, jsonify, render_template, request

# ─── Configuração ────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
config_mod = importlib.import_module("4_config")
CONFIG = config_mod.CONFIG

# ─── Logging ────────────────────────────────────────────────
log_format = "%(asctime)s [%(levelname)s] %(name)s — %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=log_format,
    handlers=[
        logging.FileHandler("bot.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("dashboard")

# ─── Flask App ───────────────────────────────────────────────
app = Flask(__name__, template_folder="templates")

# Caminho absoluto do ficheiro .env
ENV_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")

# Chaves que nunca são devolvidas ao frontend (apenas indicam se estão configuradas)
SENSITIVE_KEYS = {"SOLANA_PRIVATE_KEY", "TELEGRAM_BOT_TOKEN", "WEBHOOK_SECRET"}

# Chaves permitidas no formulário (whitelist de segurança)
ALLOWED_CONFIG_KEYS = {
    "WALLET_PUBLIC_KEY", "SOLANA_RPC_URL",
    "SOLANA_PRIVATE_KEY", "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID", "WEBHOOK_SECRET",
    "MIN_SIGNAL_STRENGTH", "RISK_PER_TRADE_PCT",
    "MIN_TRADE_SOL", "MAX_TRADE_SOL",
    "MAX_DAILY_LOSS_USD", "COOLDOWN_MINUTES",
    "SLIPPAGE_BPS", "PRIORITY_FEE", "DRY_RUN",
}


# ════════════════════════════════════════════════════════════
# UTILITÁRIOS DO FICHEIRO .ENV
# ════════════════════════════════════════════════════════════

def read_env_file() -> dict:
    """Lê o ficheiro .env e retorna dicionário chave→valor."""
    env_data = {}
    if not os.path.exists(ENV_FILE):
        return env_data
    try:
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, _, value = line.partition("=")
                    env_data[key.strip()] = value.strip()
    except IOError as exc:
        logger.error("Erro ao ler .env: %s", exc)
    return env_data


def write_env_file(updates: dict):
    """
    Actualiza o ficheiro .env com os novos valores.
    Preserva comentários e linhas existentes.
    Adiciona chaves novas no final do ficheiro.
    """
    lines = []
    existing_keys = set()

    # Lê conteúdo actual
    if os.path.exists(ENV_FILE):
        try:
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                lines = f.readlines()
        except IOError:
            lines = []

    # Substitui valores nas linhas existentes
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("#") and "=" in stripped:
            key = stripped.split("=", 1)[0].strip()
            if key in updates:
                new_lines.append(f"{key}={updates[key]}\n")
                existing_keys.add(key)
                continue
        new_lines.append(line)

    # Adiciona chaves que ainda não existiam no ficheiro
    for key, value in updates.items():
        if key not in existing_keys:
            new_lines.append(f"{key}={value}\n")

    try:
        with open(ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        logger.info("Ficheiro .env actualizado com %d chaves: %s", len(updates), list(updates.keys()))
    except IOError as exc:
        logger.error("Erro ao escrever .env: %s", exc)
        raise


# ════════════════════════════════════════════════════════════
# ROTAS DO DASHBOARD
# ════════════════════════════════════════════════════════════

@app.route("/")
def index():
    """Serve a página principal do dashboard."""
    return render_template("dashboard.html")


@app.route("/api/state")
def api_state():
    """
    Retorna o estado actual do bot em JSON.
    Lido directamente do bot_state.json para reflectir dados em tempo real.
    """
    state_file = CONFIG.get("STATE_FILE", "bot_state.json")
    state_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), state_file)
    state = {}

    if os.path.exists(state_path):
        try:
            with open(state_path, "r", encoding="utf-8") as f:
                state = json.load(f)
        except (json.JSONDecodeError, IOError) as exc:
            logger.warning("Erro ao ler bot_state.json: %s", exc)

    # Métricas do dia actual
    today_str = date.today().isoformat()
    history = state.get("trade_history", [])
    today_trades = [t for t in history if str(t.get("timestamp", "")).startswith(today_str)]

    wins   = sum(1 for t in today_trades if float(t.get("pnl_usd", 0)) >= 0 and t.get("action") == "SELL")
    losses = sum(1 for t in today_trades if float(t.get("pnl_usd", 0)) < 0  and t.get("action") == "SELL")

    position = state.get("position", {})

    # Verifica se o webhook server (porta 5000) está online
    bot_online = False
    try:
        r = http_requests.get("http://localhost:5000/status", timeout=2)
        bot_online = r.status_code == 200
    except Exception:
        bot_online = False

    # Lê DRY_RUN directamente do .env para reflectir valor guardado
    env_data  = read_env_file()
    dry_run_str = env_data.get("DRY_RUN", "True")
    dry_run   = dry_run_str.lower() not in ("false", "0", "no")

    return jsonify({
        "bot_online":         bot_online,
        "dry_run":            dry_run,
        "has_position":       bool(position.get("open", False)),
        "position":           position,
        "daily_pnl_usd":      round(float(state.get("daily_pnl_usd", 0.0)), 4),
        "total_trades_today": len(today_trades),
        "wins_today":         wins,
        "losses_today":       losses,
        "last_sol_balance":   float(state.get("last_sol_balance", 0.0)),
        "trade_history":      list(reversed(history[-50:])),  # últimas 50 trades
        "last_updated":       datetime.utcnow().isoformat() + "Z",
    })


@app.route("/api/config", methods=["GET"])
def get_config():
    """
    Retorna a configuração actual do ficheiro .env.
    Chaves sensíveis (private key, tokens) apenas indicam se estão configuradas.
    Nunca envia o valor real de chaves sensíveis ao frontend.
    """
    env_data = read_env_file()
    result = {}

    for key, value in env_data.items():
        if key in SENSITIVE_KEYS:
            # Considera configurada se não estiver vazia nem for placeholder
            is_configured = (
                bool(value)
                and "COLOCA_AQUI" not in value
                and len(value) > 10
            )
            result[key] = {"configured": is_configured, "value": ""}
        else:
            result[key] = value

    # Garante que chaves sensíveis aparecem mesmo se ausentes do .env
    for key in SENSITIVE_KEYS:
        if key not in result:
            result[key] = {"configured": False, "value": ""}

    return jsonify(result)


@app.route("/api/config", methods=["POST"])
def save_config():
    """
    Actualiza o ficheiro .env com os valores submetidos pelo formulário.
    Apenas aceita chaves da whitelist ALLOWED_CONFIG_KEYS.
    Chaves sensíveis vazias são ignoradas (mantém o valor existente).
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "JSON inválido"}), 400

    updates = {}
    for key, value in data.items():
        # Só aceita chaves conhecidas
        if key not in ALLOWED_CONFIG_KEYS:
            logger.warning("Chave não permitida ignorada: %s", key)
            continue
        # Para chaves sensíveis, ignora se o valor estiver vazio
        if key in SENSITIVE_KEYS and (not value or str(value).strip() == ""):
            continue
        updates[key] = str(value).strip()

    if not updates:
        return jsonify({"error": "Nenhuma chave válida para actualizar"}), 400

    try:
        write_env_file(updates)
        return jsonify({"status": "ok", "updated": list(updates.keys())}), 200
    except Exception as exc:
        logger.error("Erro ao guardar configuração: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/test-signal", methods=["POST"])
def test_signal():
    """
    Envia um sinal de teste ao webhook server (porta 5000).
    Útil para verificar o fluxo completo em DRY_RUN.
    """
    data   = request.get_json() or {}
    action = data.get("action", "BUY").upper()
    price  = float(data.get("price", 150.0))

    # Payload de teste com valores típicos de BUY/SELL
    test_payload = {
        "action":   action,
        "symbol":   "SOLUSDT",
        "strength": 3,
        "wt1":      -55.0 if action == "BUY" else 58.0,
        "rsi":      28.0  if action == "BUY" else 72.0,
        "mfi":      -10.0 if action == "BUY" else 12.0,
        "price":    price,
        "time":     datetime.utcnow().strftime("%Y-%m-%d %H:%M"),
    }

    # Lê o secret actual do .env
    env_data = read_env_file()
    secret   = env_data.get("WEBHOOK_SECRET", CONFIG.get("WEBHOOK_SECRET", ""))

    try:
        logger.info("A enviar sinal de teste: %s @ $%.2f", action, price)
        r = http_requests.post(
            f"http://localhost:5000/webhook?key={secret}",
            json=test_payload,
            timeout=5,
        )
        return jsonify({"status": "ok", "response": r.json()}), 200
    except Exception as exc:
        logger.error("Erro ao enviar sinal de teste: %s", exc)
        return jsonify({"error": str(exc)}), 500


@app.route("/api/clear-history", methods=["POST"])
def clear_history():
    """Limpa o histórico de trades (útil após testes DRY RUN)."""
    state_file = CONFIG.get("STATE_FILE", "bot_state.json")
    state_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), state_file)
    try:
        if os.path.exists(state_path):
            with open(state_path, "r", encoding="utf-8") as f:
                state = json.load(f)
            state["trade_history"] = []
            state["daily_pnl_usd"] = 0.0
            state["position"]      = {"open": False, "entry_price": 0.0,
                                      "amount_sol": 0.0, "entry_time": "", "entry_signal": {}}
            with open(state_path, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2, ensure_ascii=False, default=str)
        return jsonify({"status": "ok"}), 200
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ─── Arranque ────────────────────────────────────────────────
if __name__ == "__main__":
    porta = int(os.environ.get("DASHBOARD_PORT", 5001))
    logger.info("Dashboard a arrancar em http://localhost:%d", porta)
    app.run(host="0.0.0.0", port=porta, debug=False)
