# Pipossbomba

Two apps live here.

## `dashboard/` — Life OS
Personal dashboard (PWA + Android APK via Capacitor). The whole app is `dashboard/index.html`, with no build step.

Supporting files, all needed for the Android build and GitHub Pages:

| Path | Purpose |
|---|---|
| `capacitor.config.json`, `package.json` | Capacitor config (`webDir: dashboard`) and dependencies |
| `resources/` | App icon and splash sources |
| `keys/lifeos-debug.keystore` | Fixed signing key; keep it or Google login breaks |
| `.github/workflows/build-android.yml` | Builds the APK and publishes release `apk-latest` |
| `.github/workflows/pages.yml` | Deploys `dashboard/` to GitHub Pages |

See `CLAUDE.md` for development rules.

## `little-light/` — Little Light
A 3-minute daily happiness app: reach someone, breathe, notice the good. Then close it and go live.
Single file (`little-light/index.html`), works offline, stores data only on the device. Open it in any browser.
