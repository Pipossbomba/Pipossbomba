# Market Cypher Pro — Solana Trading Bot

Bot de trading automatizado para a rede Solana, integrado com o indicador Market Cypher Pro no TradingView.

---

## Arquitectura do Sistema

```
TradingView (Pine Script)
        │
        │  Alerta webhook (JSON)
        ▼
┌─────────────────────┐
│  2_webhook_server   │  Flask — valida e recebe alertas
│  (porta 5000)       │
└────────┬────────────┘
         │ process_signal()
         ▼
┌─────────────────────┐
│   3_bot_engine      │  Regras de risco, cálculo de posição
│                     │  Jupiter DEX API v6 (quote + swap)
└────────┬────────────┘
         │                           ┌──────────────────────┐
         ├──── pending_tx_*.json ───▶│  5_wallet_signer     │
         │                           │  Assina + envia RPC  │
         │                           └──────────┬───────────┘
         │                                      │
         │                              Solana Blockchain
         │                              (Jupiter DEX)
         │
         ▼
┌─────────────────────┐
│  6_telegram_notify  │  Notificações em tempo real
└─────────────────────┘
         ▲
         │
┌─────────────────────┐
│  7_daily_summary    │  Resumo diário às 23:59
└─────────────────────┘
```

---

## Passo a Passo de Instalação

### 1. Clonar o repositório e criar ambiente virtual

```bash
git clone <url-do-repositorio>
cd <nome-do-repositorio>

# Criar ambiente virtual
python3 -m venv venv

# Activar (Linux/Mac)
source venv/bin/activate

# Activar (Windows)
venv\Scripts\activate
```

### 2. Instalar dependências

```bash
pip install -r requirements.txt
```

### 3. Configurar o ficheiro .env

```bash
# Copia o template
cp .env.example .env

# Edita o .env com os teus dados
nano .env   # ou usa o teu editor preferido
```

Preenche obrigatoriamente:
- `SOLANA_PRIVATE_KEY` — chave privada da carteira (base58)
- `WALLET_PUBLIC_KEY` — chave pública da carteira
- `TELEGRAM_BOT_TOKEN` — token do bot Telegram
- `TELEGRAM_CHAT_ID` — ID do teu chat
- `WEBHOOK_SECRET` — chave secreta para o webhook

---

## Como Criar um Bot Telegram

### Obter o TOKEN do Bot

1. Abre o Telegram e procura `@BotFather`
2. Envia `/newbot`
3. Escolhe um nome para o bot (ex: "MyCypherBot")
4. Escolhe um username (ex: "mycypher_sol_bot")
5. O BotFather dará um token no formato `123456:ABC-DEF...`
6. Copia este token para `TELEGRAM_BOT_TOKEN` no `.env`

### Obter o CHAT_ID

1. Procura `@userinfobot` no Telegram
2. Envia qualquer mensagem
3. Ele responde com o teu ID (ex: `123456789`)
4. Copia para `TELEGRAM_CHAT_ID` no `.env`

**Alternativa:** Envia uma mensagem ao teu bot e acede a:
`https://api.telegram.org/bot<TOKEN>/getUpdates`
O `chat.id` aparece na resposta JSON.

---

## Como Instalar o Pine Script no TradingView

1. Abre o [TradingView](https://www.tradingview.com) e vai a um gráfico (ex: SOLUSDT)
2. Clica em **"Pine Editor"** (botão na barra inferior)
3. Apaga o código existente
4. Copia todo o conteúdo de `1_MarketCypher_Pro.pine`
5. Cola no editor e clica **"Add to chart"** (botão azul)
6. O indicador aparece no gráfico com triângulos de sinal

### Parâmetros configuráveis no indicador

| Parâmetro | Padrão | Descrição |
|-----------|--------|-----------|
| Canal WT | 9 | Período do canal Wave Trend |
| Média WT | 12 | Período da média Wave Trend |
| Período RSI | 14 | Período do RSI |
| RSI OB/OS | 70/30 | Níveis overbought/oversold |
| Período MFI | 60 | Período do Money Flow Index |
| MACD Rápido/Lento | 12/26 | Parâmetros MACD |
| Força Mínima | 2 | Força mínima para mostrar sinal |
| Símbolo Webhook | SOLUSDT | Símbolo incluído no JSON do alerta |

---

## Como Configurar Alertas com Webhook no TradingView

### Pré-requisito: expor o servidor com ngrok (ver secção seguinte)

1. No gráfico com o indicador activo, clica no **ícone de relógio** (Alertas)
2. Clica **"Create Alert"**
3. Em **Condition**, escolhe `Market Cypher Pro` → `Qualquer Sinal MCP`
4. Em **Actions**, activa **"Webhook URL"**
5. Coloca a URL: `https://<ID>.ngrok.io/webhook?key=<WEBHOOK_SECRET>`
6. Em **Message**, coloca apenas: `{{strategy.order.comment}}`
   - O Pine Script já gera o JSON completo na mensagem do alerta
7. Clica **"Create"**

> **Dica:** Cria alertas separados para "STRONG BUY", "BUY", "STRONG SELL", "SELL" com a mesma URL webhook para controlo granular.

---

## Como Usar ngrok para Expor o Servidor Localmente

O TradingView precisa de uma URL pública para enviar webhooks. O ngrok cria um túnel da internet para o teu servidor local.

### Instalação do ngrok

```bash
# Linux
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Mac
brew install ngrok/ngrok/ngrok

# Ou download directo: https://ngrok.com/download
```

### Configurar conta gratuita

```bash
# Regista em https://ngrok.com e obtém o token
ngrok config add-authtoken <SEU_TOKEN>
```

### Usar o ngrok

```bash
# Numa terminal separada, expõe a porta 5000
ngrok http 5000
```

O ngrok mostrará uma URL como `https://abc123.ngrok.io`.
Usa esta URL no TradingView: `https://abc123.ngrok.io/webhook?key=<WEBHOOK_SECRET>`

> **Nota:** Com a conta gratuita, a URL muda cada vez que reiniciar o ngrok. Para URL fixa, usa a conta paga ou um VPS.

---

## Como Correr Todos os Processos em Paralelo

### Terminal 1 — Webhook Server
```bash
source venv/bin/activate
python 2_webhook_server.py
```

### Terminal 2 — Daily Summary Scheduler (background)
```bash
source venv/bin/activate
python 7_daily_summary.py &
```

### Terminal 3 — ngrok (se usares localmente)
```bash
ngrok http 5000
```

### Ou tudo em background de uma vez
```bash
source venv/bin/activate
python 2_webhook_server.py &
python 7_daily_summary.py &
echo "Servicos activos. PIDs: $(jobs -p)"
```

### Assinar transacções manualmente (modo real)
```bash
# Processar todas as transacções pendentes
python 5_wallet_signer.py

# Processar ficheiro específico
python 5_wallet_signer.py pending_tx_abc12345.json
```

### Ver logs em tempo real
```bash
tail -f bot.log
```

---

## Como Testar com DRY_RUN

O bot vem com `DRY_RUN=True` por defeito — **nenhuma transacção real é executada**.

### Testar o webhook manualmente

```bash
# Com o servidor a correr (python 2_webhook_server.py)
curl -X POST "http://localhost:5000/webhook?key=muda_esta_chave_secreta_urgente" \
  -H "Content-Type: application/json" \
  -d '{"action":"BUY","symbol":"SOLUSDT","strength":3,"wt1":-55,"rsi":28,"mfi":-10,"price":150.0,"time":"2024-01-01 10:00"}'
```

### Verificar o estado do bot

```bash
curl http://localhost:5000/status
```

### Testar notificações Telegram

```bash
python 6_telegram_notify.py
```

### Testar resumo diário

```bash
python 7_daily_summary.py --now
```

### Activar trading real

Edita o `.env` e define:
```
DRY_RUN=False
```
Ou comenta a linha `DRY_RUN` (o padrão é `True` no código).

---

## Tabela de Parâmetros de Risco Recomendados

| Perfil | MIN_SIGNAL_STRENGTH | RISK_PER_TRADE_PCT | MAX_TRADE_SOL | MAX_DAILY_LOSS_USD | COOLDOWN_MINUTES |
|--------|--------------------|--------------------|---------------|-------------------|-----------------|
| **Conservador** | 3 | 1.0% | 0.5 SOL | 10 USD | 30 min |
| **Moderado** (padrão) | 2 | 2.0% | 1.0 SOL | 20 USD | 15 min |
| **Agressivo** | 2 | 3.0% | 2.0 SOL | 50 USD | 10 min |
| **Muito Agressivo** | 1 | 5.0% | 5.0 SOL | 100 USD | 5 min |

> **Recomendação:** Começa sempre com o perfil Conservador e DRY_RUN=True durante pelo menos 1-2 semanas.

---

## Avisos de Segurança

### Chave Privada

> **PERIGO:** A tua chave privada Solana da acesso TOTAL aos fundos da carteira. Quem a tiver pode transferir todos os teus SOL em segundos.

- **NUNCA** guardar a chave privada directamente no código
- **NUNCA** fazer `git add .env` ou `git commit .env`
- **NUNCA** partilhar o ficheiro `.env` com ninguém
- **NUNCA** colocar a chave privada no TradingView, ngrok ou qualquer serviço externo
- Usar uma **carteira dedicada exclusivamente para o bot** com apenas os fundos necessários
- Guardar backup da seed phrase/chave privada em local físico seguro (papel, cofre)

### Verificação do .gitignore

```bash
# Confirma que .env não está a ser seguido pelo git
git status  # .env não deve aparecer

# Se acidentalmente adicionaste .env:
git rm --cached .env
git commit -m "Remove .env do tracking"
```

### RPC Público vs Privado

O RPC público (`api.mainnet-beta.solana.com`) tem **limites de taxa** e pode falhar em momentos de alta utilização. Para trading a sério, usa um RPC privado:

- **Helius** — helius.dev (recomendado, plano gratuito generoso)
- **QuickNode** — quicknode.com
- **Triton** — triton.one

### Responsabilidade

Este software e fornecido **"tal como esta"** para fins educativos. Trading de criptomoedas envolve **risco de perda total do capital**. Testa extensivamente com DRY_RUN=True antes de usar dinheiro real. O autor nao se responsabiliza por perdas financeiras.

---

## Estrutura de Ficheiros

```
.
├── 1_MarketCypher_Pro.pine    # Pine Script v5 para TradingView
├── 2_webhook_server.py        # Servidor Flask — recebe alertas
├── 3_bot_engine.py            # Motor de decisao e execucao
├── 4_config.py                # Configuracao central
├── 5_wallet_signer.py         # Assina e envia transaccoes
├── 6_telegram_notify.py       # Notificacoes Telegram
├── 7_daily_summary.py         # Resumo diario automatico
├── requirements.txt           # Dependencias Python
├── .env.example               # Template de configuracao
├── .gitignore                 # Ficheiros a ignorar no git
└── README.md                  # Esta documentacao
```

**Ficheiros gerados em runtime** (nao incluidos no git):
```
├── bot_state.json             # Estado persistente do bot
├── bot.log                    # Log de eventos
├── pending_tx_*.json          # Transaccoes aguardando assinatura
└── confirmed_tx_*.json        # Registo de transaccoes confirmadas
```
