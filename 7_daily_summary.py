"""
Daily Summary Scheduler — envia resumo diário às 23:59 via Telegram
Corre em background: python 7_daily_summary.py &
"""

import importlib
import logging
import os
import sys
import time
from datetime import datetime

import schedule

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
logger = logging.getLogger("daily_summary")


def send_daily_summary():
    """
    Calcula as métricas do dia e envia resumo via Telegram.
    Chamado automaticamente pelo scheduler às 23:59.
    """
    logger.info("A calcular e enviar resumo diário...")
    try:
        tg = importlib.import_module("6_telegram_notify")

        # Calcula métricas do dia
        summary = tg.get_daily_summary(CONFIG.get("STATE_FILE", "bot_state.json"))

        # Envia via Telegram
        sent = tg.telegram_notify("RESUMO_DIARIO", summary)

        if sent:
            logger.info(
                "Resumo diário enviado — Trades: %d | PnL: %+.2f USD",
                summary["total_trades"], summary["pnl_usd"]
            )
        else:
            logger.warning("Resumo diário calculado mas Telegram não respondeu")

        # Também imprime no terminal
        print("\n" + "="*50)
        print("  RESUMO DO DIA")
        print("="*50)
        print(f"  Data:          {datetime.now().strftime('%Y-%m-%d')}")
        print(f"  Trades:        {summary['total_trades']} ({summary['wins']} ✅ {summary['losses']} ❌)")
        print(f"  PnL:           {'+' if summary['pnl_usd'] >= 0 else ''}{summary['pnl_usd']:.2f} USD")
        print(f"  Melhor trade:  {'+' if summary['best_trade'] >= 0 else ''}{summary['best_trade']:.2f} USD")
        print(f"  Pior trade:    {'+' if summary['worst_trade'] >= 0 else ''}{summary['worst_trade']:.2f} USD")
        print(f"  Saldo actual:  {summary['saldo_sol']:.4f} SOL")
        print("="*50 + "\n")

    except Exception as exc:
        logger.error("Erro ao enviar resumo diário: %s", exc)


def setup_scheduler():
    """Configura o scheduler para correr às 23:59 todos os dias."""
    schedule.every().day.at("23:59").do(send_daily_summary)
    logger.info("Scheduler configurado — resumo diário às 23:59")


def run_now_if_requested():
    """
    Se o script for chamado com argumento --now, envia o resumo imediatamente.
    Útil para testar sem esperar pela meia-noite.
    """
    if "--now" in sys.argv or "-n" in sys.argv:
        logger.info("Argumento --now detectado — a enviar resumo imediatamente")
        send_daily_summary()
        sys.exit(0)


# ─── Loop principal ──────────────────────────────────────────
if __name__ == "__main__":
    logger.info("=== Daily Summary Scheduler a arrancar ===")

    # Verifica se deve enviar imediatamente
    run_now_if_requested()

    # Configura o scheduler
    setup_scheduler()

    logger.info("Scheduler activo — a correr em background. Ctrl+C para parar.")
    logger.info("Próximo resumo: hoje às 23:59 (ou usa --now para testar)")

    # Loop principal
    try:
        while True:
            schedule.run_pending()
            # Verifica tarefas pendentes a cada 30 segundos
            time.sleep(30)
    except KeyboardInterrupt:
        logger.info("Scheduler parado pelo utilizador")
        sys.exit(0)
