"""
Webhook Server — recebe alertas do TradingView via HTTP POST
Flask server com validação de chave secreta, logging e health check
"""

import importlib
import json
import logging
import os
import sys
from datetime import datetime

from flask import Flask, request, jsonify

# ─── Importação de módulos com nomes numéricos ───────────────
# Python não suporta "import 4_config" directamente — usa importlib
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
logger = logging.getLogger("webhook_server")

# ─── Flask App ───────────────────────────────────────────────
app = Flask(__name__)

# ─── Campos obrigatórios no payload ─────────────────────────
REQUIRED_FIELDS = {"action", "symbol", "strength", "wt1", "rsi", "mfi", "price", "time"}


def validate_payload(data: dict) -> tuple:
    """Valida os campos obrigatórios e os valores do payload."""
    # Verifica campos em falta
    missing = REQUIRED_FIELDS - set(data.keys())
    if missing:
        return False, f"Campos em falta: {missing}"

    # Valida acção
    if data["action"] not in ("BUY", "SELL"):
        return False, f"Acção inválida: {data['action']}"

    # Valida força do sinal
    try:
        strength = int(data["strength"])
        if strength not in (1, 2, 3):
            return False, f"Força inválida: {strength} (deve ser 1, 2 ou 3)"
    except (ValueError, TypeError):
        return False, "Campo 'strength' deve ser inteiro"

    # Valida preço
    try:
        price = float(data["price"])
        if price <= 0:
            return False, f"Preço inválido: {price}"
    except (ValueError, TypeError):
        return False, "Campo 'price' deve ser numérico"

    return True, "OK"


@app.route("/webhook", methods=["POST"])
def webhook():
    """
    Endpoint principal para receber alertas do TradingView.
    Requer parâmetro ?key=SECRET_KEY
    """
    # ── Validação da chave secreta ────────────────────────────
    key = request.args.get("key", "")
    if key != CONFIG["WEBHOOK_SECRET"]:
        logger.warning(
            "Tentativa de acesso com chave inválida: '%s' | IP: %s",
            key, request.remote_addr
        )
        return jsonify({"error": "Chave inválida"}), 401

    # ── Parse do corpo JSON ───────────────────────────────────
    try:
        raw_body = request.get_data(as_text=True)
        logger.info("Payload recebido: %s", raw_body)
        data = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        logger.error("JSON inválido recebido: %s | Erro: %s", raw_body, exc)
        return jsonify({"error": "JSON inválido", "detail": str(exc)}), 400

    # ── Validação dos campos ──────────────────────────────────
    valid, reason = validate_payload(data)
    if not valid:
        logger.error("Payload inválido: %s | Razão: %s", data, reason)
        return jsonify({"error": "Payload inválido", "detail": reason}), 422

    # ── Regista o sinal com detalhe ───────────────────────────
    logger.info(
        "Sinal válido recebido — Acção: %s | Símbolo: %s | Força: %s/3 | Preço: $%s",
        data["action"], data["symbol"], data["strength"], data["price"]
    )

    # ── Processa o sinal no bot engine ────────────────────────
    try:
        engine = importlib.import_module("3_bot_engine")
        result = engine.process_signal(data)
        logger.info("Resultado do engine: %s", result)
        return jsonify({"status": "ok", "result": result}), 200
    except Exception as exc:
        logger.exception("Erro ao processar sinal no bot engine: %s", exc)
        # Notifica via Telegram sem bloquear a resposta
        try:
            tg = importlib.import_module("6_telegram_notify")
            tg.telegram_notify("ERRO", {
                "evento": "Falha no bot engine",
                "detalhe": str(exc),
            })
        except Exception:
            pass
        return jsonify({"error": "Erro interno no bot engine", "detail": str(exc)}), 500


@app.route("/status", methods=["GET"])
def status():
    """
    Health check endpoint.
    Devolve estado do servidor e informações básicas.
    """
    try:
        engine = importlib.import_module("3_bot_engine")
        state = engine.load_state()
        position = state.get("position", {})
        has_position = bool(position.get("open", False))
        daily_pnl = state.get("daily_pnl_usd", 0.0)
        total_trades = len(state.get("trade_history", []))
    except Exception:
        has_position = False
        daily_pnl = 0.0
        total_trades = 0

    return jsonify({
        "status": "online",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "dry_run": CONFIG["DRY_RUN"],
        "has_open_position": has_position,
        "daily_pnl_usd": round(daily_pnl, 4),
        "total_trades_today": total_trades,
        "version": "1.0.0",
    }), 200


@app.route("/", methods=["GET"])
def index():
    """Página raiz — redireciona para /status."""
    return jsonify({
        "mensagem": "Market Cypher Pro Bot — use /status para health check"
    }), 200


# ─── Arranque ────────────────────────────────────────────────
if __name__ == "__main__":
    porta = int(os.environ.get("PORT", 5000))
    logger.info(
        "A arrancar webhook server na porta %d | DRY_RUN=%s",
        porta, CONFIG["DRY_RUN"]
    )
    logger.info("URL do webhook: http://localhost:%d/webhook?key=<SECRET>", porta)
    app.run(host="0.0.0.0", port=porta, debug=False)
