"""
Configuração central do bot de trading Solana
Todas as variáveis sensíveis são lidas de variáveis de ambiente (ficheiro .env)
Nunca guardar chaves privadas ou tokens neste ficheiro
"""

import os
from dotenv import load_dotenv

# Carrega variáveis do ficheiro .env (se existir)
load_dotenv()

CONFIG = {
    # ── Carteira Solana (apenas chave pública aqui) ──────────
    # A chave privada é carregada APENAS em 5_wallet_signer.py via .env
    "WALLET_PUBLIC_KEY": os.environ.get(
        "WALLET_PUBLIC_KEY",
        "COLOCA_AQUI_A_TUA_CHAVE_PUBLICA_BASE58"
    ),

    # ── RPC Solana ───────────────────────────────────────────
    # Recomendado: usar RPC privado (Helius, QuickNode, Triton) para produção
    "SOLANA_RPC_URL": os.environ.get(
        "SOLANA_RPC_URL",
        "https://api.mainnet-beta.solana.com"
    ),

    # ── Gestão de risco ──────────────────────────────────────
    # Força mínima do sinal para executar trade (1 = fraco, 2 = médio, 3 = forte)
    "MIN_SIGNAL_STRENGTH": int(os.environ.get("MIN_SIGNAL_STRENGTH", "2")),

    # Percentagem do saldo a arriscar por trade (2.0 = 2%)
    "RISK_PER_TRADE_PCT": float(os.environ.get("RISK_PER_TRADE_PCT", "2.0")),

    # Quantidade mínima de SOL por trade
    "MIN_TRADE_SOL": float(os.environ.get("MIN_TRADE_SOL", "0.05")),

    # Quantidade máxima de SOL por trade
    "MAX_TRADE_SOL": float(os.environ.get("MAX_TRADE_SOL", "1.0")),

    # Perda máxima diária em USD (o bot para se atingir este valor)
    "MAX_DAILY_LOSS_USD": float(os.environ.get("MAX_DAILY_LOSS_USD", "20.0")),

    # Tempo mínimo entre trades (em minutos)
    "COOLDOWN_MINUTES": int(os.environ.get("COOLDOWN_MINUTES", "15")),

    # ── Jupiter DEX ─────────────────────────────────────────
    # Slippage em basis points (50 bps = 0.5%)
    "SLIPPAGE_BPS": int(os.environ.get("SLIPPAGE_BPS", "50")),

    # Priority fee em microlamports (aumentar em congestionamento da rede)
    "PRIORITY_FEE": int(os.environ.get("PRIORITY_FEE", "1000")),

    # ── Endereços de tokens (mainnet Solana) ─────────────────
    "TOKENS": {
        "SOL":  "So11111111111111111111111111111111111111112",
        "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
        "WIF":  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
        "JUP":  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    },

    # Par de trading padrão (comprar SOL com USDC)
    "INPUT_TOKEN":  "USDC",   # token que gastamos
    "OUTPUT_TOKEN": "SOL",    # token que recebemos

    # ── Modo de simulação ────────────────────────────────────
    # DRY_RUN=True: simula trades sem executar na blockchain
    # ATENÇÃO: Muda para False apenas quando estiveres confiante!
    "DRY_RUN": os.environ.get("DRY_RUN", "True").lower() in ("true", "1", "yes"),

    # ── Webhook Server ───────────────────────────────────────
    # Chave secreta para autenticar alertas do TradingView
    # Usar uma string aleatória longa e difícil de adivinhar
    "WEBHOOK_SECRET": os.environ.get("WEBHOOK_SECRET", "muda_esta_chave_secreta_urgente"),

    # ── Telegram ─────────────────────────────────────────────
    "TELEGRAM_BOT_TOKEN": os.environ.get("TELEGRAM_BOT_TOKEN", ""),
    "TELEGRAM_CHAT_ID":   os.environ.get("TELEGRAM_CHAT_ID",   ""),

    # ── Ficheiros de estado ──────────────────────────────────
    "STATE_FILE":          "bot_state.json",
    "PENDING_TX_PREFIX":   "pending_tx_",
    "CONFIRMED_TX_PREFIX": "confirmed_tx_",
}
