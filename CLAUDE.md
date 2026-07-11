# Life OS

Dashboard pessoal de Filipe Lemos (prostético dentário, Faial, Açores) — single-file PWA + APK Android nativo via Capacitor. Cobre Hoje, Agenda (+Tarefas), Emails, Laboratório, Finanças, Hábitos, Projetos.

## Arquitetura

- **Um único ficheiro**: `dashboard/index.html` — todo o HTML/CSS/JS. Sem build step, sem framework, sem bundler.
- **Persistência**: 100% `localStorage`, chaves prefixadas `fl_` (ver objeto `K` no topo do `<script>`). Sem backend, sem base de dados.
- **Sem dados inventados**: nunca semear dados de exemplo/demo — é uma regra explícita do utilizador. Uma instalação nova arranca vazia com um card de boas-vindas.
- **Wrapper nativo**: Capacitor 6 (`capacitor.config.json`, `appId: pt.filipel.lifeos`). O `dashboard/` é o `webDir`.
- **CI**: `.github/workflows/build-android.yml` (gera APK debug assinado e publica em release rolling `apk-latest`) e `pages.yml` (PWA no GitHub Pages).
- **Vendorizado localmente** (não usar CDN — offline-first, sem FOUT): `dashboard/vendor/chart.umd.js` (Chart.js), `dashboard/vendor/fonts.css` + `dashboard/vendor/fonts/*.woff2` (Inter + Doto via fontsource). `sw.js` faz precache de tudo isto — bump a versão `CACHE` sempre que se adiciona/remove algo do vendor.

## Design system — "Nothing OS"

Minimalista, monocromático, matriz de pontos no fundo, `Doto` (fonte pontilhada) para números, `Inter` para texto. Variáveis CSS em `:root`/`[data-theme="light"]`. Paleta de acento: verde `--green`, azul `--blue`, roxo `--purple`, laranja `--orange`, vermelho `--red`. Animações só com `transform`+`opacity` (nunca `filter:blur()` animado — mata o fps no WebView Android). Cards com `box-shadow: var(--elev)` e gradiente subtil para profundidade.

## Decisões e armadilhas já resolvidas (não repetir)

- **Login Google nativo dentro do APK requer o Web Client ID, não o Android Client ID.** `requestIdToken()` do plugin `@codetrix-studio/capacitor-google-auth` falha com `DEVELOPER_ERROR` (code 10) se se usar o ID errado. O Web ID está em `GOOGLE_WEB_CLIENT_ID` no `index.html`, replicado em `capacitor.config.json` e no workflow (`google.xml`).
- **Assinatura do APK tem de ser estável** (mesmo SHA-1 sempre) para o OAuth Android funcionar — o AGP gera a sua própria debug key se não for forçada. Ver o passo "Force stable debug signing" no workflow, que injeta `signingConfigs` no `build.gradle` a partir de `keys/lifeos-debug.keystore` (committed).
- **Release "rolling"**: nunca apagar antes de publicar (`gh release delete` seguido de falha mata o link). Usar `gh release upload --clobber` num release existente, só criar se não existir, com retry.
- **Google Calendar/Gmail**: token renovado silenciosamente no arranque (`autoSync()`) via `GoogleAuth.refresh()` nativo. Cache persistente em `localStorage` (`fl_cal_cache_v1`, `fl_mail_cache_v1`) para a Agenda/Emails mostrarem dados reais antes mesmo de re-sincronizar.
- **Insight IA**: chamadas à API Anthropic (`askClaude`) tentam uma cadeia de modelos com fallback (`aiModels()`) e mostram o erro real da API, não só o código HTTP — importante distinguir "falta de créditos API" (conta paga à parte, `console.anthropic.com`) de "Claude Plus" (subscrição do chat) — são carteiras diferentes, confusão comum do utilizador.
- **Nunca deixar os "Orçamentos" das Finanças mostrarem categorias a zero** — funde orçamento+categoria num só cartão que só lista o que teve gasto real.

## Fluxo de trabalho / CI

Depois de qualquer alteração a `dashboard/**`, `resources/**`, `capacitor.config.json` ou o próprio workflow, o push dispara o build. Leva ~5 min. Confirmar sempre via `mcp__github__get_release_by_tag` (owner `pipossbomba`, repo `pipossbomba`, tag `apk-latest`) antes de dizer ao utilizador que está pronto — o `created_at`/`digest` do asset confirmam que é build novo.

## Estilo de trabalho preferido pelo utilizador

- Feedback direto e crítico é bem-vindo — não suavizar avaliações quando pedido.
- Prefere ver as coisas testadas (screenshots headless, verificação funcional) antes de reportar "feito".
- Gosta de decidir só o essencial (ex.: "toma as tuas próprias decisões" ao dar direção geral) — não pedir confirmação excessiva em detalhes de implementação.
- Já reverteu alterações duas vezes por não gostar visualmente — ao propor mudanças de layout grandes, considerar mostrar/descrever antes de ir a fundo, ou manter mudanças mais incrementais.
