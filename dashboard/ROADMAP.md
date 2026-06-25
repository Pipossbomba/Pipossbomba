# Roadmap — Filipe · Life OS

## Estado atual
- **PWA single-file**: `dashboard/index.html` + `manifest.json` + `sw.js`.
- Tudo funciona offline (localStorage) **exceto** o foto-calorias (precisa de internet
  + chave da Anthropic, guardada só no device em `localStorage` → `fl_anthropic_key`).
- Estética Nothing OS, modo claro/escuro, sheets, timers ao vivo, gestos, streaks.

## Decisão tomada — app FINAL será nativa
Quando esta base estiver pronta, embrulhar este mesmo HTML/JS numa **app nativa Android**
(wrapper tipo **TWA** ou **Capacitor**) — era o objetivo inicial do Filipe.

### Razão principal: tempo de redes sociais automático
- O tempo de ecrã do Bem-Estar Digital **não é acessível a partir de uma PWA/browser**
  (não há API web; o Google não expõe o Bem-Estar Digital por API na cloud).
- Só uma **app nativa** consegue, via `UsageStatsManager` + permissão especial
  `PACKAGE_USAGE_STATS` ("Acesso aos dados de utilização", autorizada nas definições).

### Como implementar na finalização
1. Wrapper **Capacitor** (recomendado — mantém o HTML, permite plugins nativos) à volta
   de `dashboard/`.
2. Plugin nativo (Kotlin) que:
   - pede a permissão `PACKAGE_USAGE_STATS`;
   - lê `UsageStatsManager.queryUsageStats(...)` (ou agrega por app: TikTok, Instagram, etc.);
   - devolve os minutos de hoje à WebView (bridge), que grava em `fl_social_v1[hoje]`.
3. A UI das redes sociais já está pronta (barra que fica vermelha > 60 min) — só passa a
   ser alimentada automaticamente em vez de pelos botões +15/+30/+1h.

### Alternativa intermédia (se quisermos automático sem app nativa)
- Ponte por automação: Tasker (com plugin de usage stats) abre a app com `?social=NN`;
  a app lê `location.search` no arranque e grava. Sem backend, mas configuração chata.
  (Descartado a favor da app nativa.)

## Outras tarefas para a finalização da app
- **Strava**: corridas/treinos automáticos (OAuth Strava API → `fl_workouts_v2`).
  Numa app nativa o fluxo OAuth é mais limpo.
- **Notificações**: lembretes de água e da janela de jejum (push local nativo;
  em PWA instalada no iOS 16.4+ também dá, mas no Android nativo é trivial).
- **Ícones / splash / assinatura** do APK e distribuição (sideload ou Play Store).
- **Foto-calorias**: na app nativa, podemos guardar a chave de forma mais segura
  (Android Keystore) em vez de localStorage.

## Próximos passos imediatos (ainda na base PWA)
- Continuar a refinar UX e features a pedido do Filipe.
- Só avançar para o wrapper nativo quando a base estiver "pronta".
