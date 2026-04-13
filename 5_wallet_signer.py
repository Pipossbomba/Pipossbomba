"""
Wallet Signer — lê transacções pendentes, assina e envia à blockchain Solana
ATENÇÃO: A chave privada é lida EXCLUSIVAMENTE do ficheiro .env
Nunca hardcodar chaves privadas no código!
"""

import base64
import glob
import importlib
import json
import logging
import os
import sys
import time
from datetime import datetime

import requests
from dotenv import load_dotenv

# ─── Bibliotecas Solana ──────────────────────────────────────
try:
    from solders.keypair import Keypair
    from solders.transaction import VersionedTransaction
    from solders.message import to_bytes_versioned
except ImportError:
    print("ERRO: Instala as dependências: pip install solders")
    sys.exit(1)

# ─── Configuração ────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
config_mod = importlib.import_module("4_config")
CONFIG = config_mod.CONFIG

# Carrega .env (chave privada)
load_dotenv()

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
logger = logging.getLogger("wallet_signer")

# ─── Constantes ──────────────────────────────────────────────
SOLSCAN_TX_URL = "https://solscan.io/tx/{signature}"


def _tg_notify(event: str, data: dict):
    """Notificação Telegram silenciosa."""
    try:
        tg = importlib.import_module("6_telegram_notify")
        tg.telegram_notify(event, data)
    except Exception as exc:
        logger.warning("Falha silenciosa no Telegram: %s", exc)


def load_keypair() -> Keypair:
    """
    Carrega o Keypair da chave privada guardada no .env.
    Suporta formato base58 (padrão Phantom/Solflare).
    Nunca imprime nem loga a chave privada.
    """
    private_key_b58 = os.environ.get("SOLANA_PRIVATE_KEY", "")
    if not private_key_b58:
        raise ValueError(
            "Chave privada não encontrada. "
            "Define SOLANA_PRIVATE_KEY no ficheiro .env"
        )

    try:
        # solders aceita bytes directamente
        keypair = Keypair.from_base58_string(private_key_b58)
        logger.info("Keypair carregado — Chave pública: %s", keypair.pubkey())
        return keypair
    except Exception as exc:
        raise ValueError(f"Chave privada inválida (base58): {exc}") from exc


def decode_versioned_transaction(swap_tx_b64: str) -> VersionedTransaction:
    """
    Descodifica uma VersionedTransaction de base64 (formato Jupiter).
    """
    try:
        tx_bytes = base64.b64decode(swap_tx_b64)
        tx = VersionedTransaction.from_bytes(tx_bytes)
        logger.debug("Transacção descodificada: %d bytes", len(tx_bytes))
        return tx
    except Exception as exc:
        raise ValueError(f"Erro ao descodificar transacção base64: {exc}") from exc


def sign_transaction(tx: VersionedTransaction, keypair: Keypair) -> VersionedTransaction:
    """
    Assina a VersionedTransaction com o Keypair fornecido.
    Retorna a transacção assinada.
    """
    try:
        # Obtém os bytes da mensagem para assinar
        msg_bytes = to_bytes_versioned(tx.message)
        signature  = keypair.sign_message(msg_bytes)

        # Substitui assinatura na transacção
        signed_tx = VersionedTransaction(tx.message, [signature])
        logger.info("Transacção assinada com sucesso")
        return signed_tx
    except Exception as exc:
        raise RuntimeError(f"Erro ao assinar transacção: {exc}") from exc


def send_transaction(signed_tx: VersionedTransaction) -> str:
    """
    Envia a transacção assinada via RPC Solana.
    Retorna a assinatura (hash) da transacção.
    """
    rpc_url = CONFIG["SOLANA_RPC_URL"]

    # Serializa para base64 para envio via JSON-RPC
    tx_bytes = bytes(signed_tx)
    tx_b64   = base64.b64encode(tx_bytes).decode("utf-8")

    payload = {
        "jsonrpc": "2.0",
        "id":      1,
        "method":  "sendTransaction",
        "params":  [
            tx_b64,
            {
                "encoding":              "base64",
                "skipPreflight":         False,
                "preflightCommitment":   "confirmed",
                "maxRetries":            3,
            }
        ],
    }

    try:
        logger.info("A enviar transacção via RPC: %s", rpc_url)
        response = requests.post(rpc_url, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()

        if "error" in result:
            raise RuntimeError(f"RPC devolveu erro: {result['error']}")

        signature = result.get("result", "")
        if not signature:
            raise RuntimeError(f"RPC não devolveu assinatura: {result}")

        logger.info("Transacção enviada — Assinatura: %s", signature)
        return signature

    except requests.exceptions.RequestException as exc:
        raise RuntimeError(f"Erro de rede ao enviar transacção: {exc}") from exc


def wait_for_confirmation(signature: str, max_retries: int = 20, delay: float = 3.0) -> bool:
    """
    Aguarda confirmação da transacção via RPC (polling).
    Retorna True se confirmada, False se expirar o timeout.
    """
    rpc_url = CONFIG["SOLANA_RPC_URL"]
    payload = {
        "jsonrpc": "2.0",
        "id":      1,
        "method":  "getSignatureStatuses",
        "params":  [[signature], {"searchTransactionHistory": True}],
    }

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(
                "A verificar confirmação (%d/%d): %s",
                attempt, max_retries, signature[:20] + "..."
            )
            response = requests.post(rpc_url, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
            statuses = result.get("result", {}).get("value", [None])
            status = statuses[0] if statuses else None

            if status is not None:
                confirmation_status = status.get("confirmationStatus", "")
                err = status.get("err")
                if err:
                    logger.error("Transacção falhou na blockchain: %s", err)
                    return False
                if confirmation_status in ("confirmed", "finalized"):
                    logger.info("Transacção confirmada! Status: %s", confirmation_status)
                    return True

        except Exception as exc:
            logger.warning("Erro ao verificar confirmação: %s", exc)

        time.sleep(delay)

    logger.warning("Timeout a aguardar confirmação de %s", signature)
    return False


def save_confirmed_transaction(pending_data: dict, signature: str, confirmed: bool):
    """
    Guarda o registo da transacção confirmada.
    Remove o ficheiro pendente após envio.
    """
    tx_id          = pending_data.get("tx_id", "unknown")
    confirmed_file = f"{CONFIG['CONFIRMED_TX_PREFIX']}{tx_id}.json"

    record = {
        **pending_data,
        "signature":    signature,
        "confirmed":    confirmed,
        "confirmed_at": datetime.utcnow().isoformat(),
        "solscan_url":  SOLSCAN_TX_URL.format(signature=signature),
    }

    try:
        with open(confirmed_file, "w", encoding="utf-8") as f:
            json.dump(record, f, indent=2)
        logger.info("Confirmação guardada: %s", confirmed_file)
    except IOError as exc:
        logger.error("Erro ao guardar confirmação: %s", exc)


def process_pending_file(filepath: str, keypair: Keypair) -> bool:
    """
    Processa um ficheiro de transacção pendente:
    1. Lê o ficheiro JSON
    2. Descodifica a swapTransaction
    3. Assina com o Keypair
    4. Envia via RPC
    5. Aguarda confirmação
    6. Guarda confirmação
    7. Remove ficheiro pendente
    8. Notifica via Telegram

    Retorna True se processado com sucesso.
    """
    logger.info("A processar ficheiro pendente: %s", filepath)

    # Lê dados da transacção pendente
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            pending_data = json.load(f)
    except (IOError, json.JSONDecodeError) as exc:
        logger.error("Erro ao ler ficheiro pendente %s: %s", filepath, exc)
        return False

    swap_tx_b64 = pending_data.get("swapTransaction", "")
    action      = pending_data.get("action", "?")
    amount_sol  = float(pending_data.get("amount_sol", 0))
    price       = float(pending_data.get("price", 0))

    if not swap_tx_b64:
        logger.error("swapTransaction em falta em %s", filepath)
        return False

    # Assina e envia
    signature = None
    confirmed = False
    try:
        tx        = decode_versioned_transaction(swap_tx_b64)
        signed_tx = sign_transaction(tx, keypair)
        signature = send_transaction(signed_tx)
        confirmed = wait_for_confirmation(signature)

        solscan_url = SOLSCAN_TX_URL.format(signature=signature)
        logger.info("Transacção %s | Confirmada: %s", signature, confirmed)
        logger.info("Solscan: %s", solscan_url)

        # Mostra link no terminal
        print(f"\n{'='*60}")
        print(f"  Transacção {'CONFIRMADA' if confirmed else 'ENVIADA (aguarda confirmação)'}")
        print(f"  Acção:     {action}")
        print(f"  Quantidade: {amount_sol:.4f} SOL @ ${price:.2f}")
        print(f"  Assinatura: {signature}")
        print(f"  Solscan:   {solscan_url}")
        print(f"{'='*60}\n")

        # Notifica via Telegram com link Solscan
        _tg_notify("TRADE_EXEC", {
            "action":     action,
            "amount_sol": amount_sol,
            "price":      price,
            "tx_hash":    signature,
            "dry_run":    False,
        })

    except RuntimeError as exc:
        logger.error("Falha ao processar transacção: %s", exc)
        _tg_notify("ERRO", {
            "evento":  f"Falha ao enviar transacção ({action})",
            "detalhe": str(exc),
        })
        return False

    # Guarda registo confirmado
    save_confirmed_transaction(pending_data, signature or "FAILED", confirmed)

    # Remove ficheiro pendente
    try:
        os.remove(filepath)
        logger.info("Ficheiro pendente removido: %s", filepath)
    except OSError as exc:
        logger.warning("Não foi possível remover ficheiro pendente %s: %s", filepath, exc)

    return confirmed


def process_all_pending(keypair: Keypair) -> int:
    """
    Processa todos os ficheiros pending_tx_*.json encontrados.
    Retorna o número de transacções processadas com sucesso.
    """
    pattern   = f"{CONFIG['PENDING_TX_PREFIX']}*.json"
    files     = sorted(glob.glob(pattern))

    if not files:
        logger.info("Nenhuma transacção pendente encontrada (%s)", pattern)
        return 0

    logger.info("Encontradas %d transacções pendentes", len(files))
    success_count = 0

    for filepath in files:
        ok = process_pending_file(filepath, keypair)
        if ok:
            success_count += 1
        # Pequena pausa entre transacções para não sobrecarregar o RPC
        time.sleep(1)

    logger.info(
        "Processamento concluído: %d/%d transacções confirmadas",
        success_count, len(files)
    )
    return success_count


# ─── Ponto de entrada ────────────────────────────────────────
if __name__ == "__main__":
    logger.info("=== Wallet Signer a arrancar ===")

    # Carrega chave privada do .env
    try:
        keypair = load_keypair()
    except ValueError as exc:
        logger.error("Erro crítico: %s", exc)
        sys.exit(1)

    # Verifica se foi passado um ficheiro específico como argumento
    if len(sys.argv) > 1:
        target_file = sys.argv[1]
        if not os.path.exists(target_file):
            logger.error("Ficheiro não encontrado: %s", target_file)
            sys.exit(1)
        logger.info("A processar ficheiro específico: %s", target_file)
        ok = process_pending_file(target_file, keypair)
        sys.exit(0 if ok else 1)
    else:
        # Processa todos os pendentes
        count = process_all_pending(keypair)
        logger.info("Total processado: %d transacções", count)
        sys.exit(0)
