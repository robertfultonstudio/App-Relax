# App Relax - Deep Sleep 432 vertical slice

App mobile consumer iOS/Android costruita con Expo SDK 57, React Native 0.86, Expo Router e TypeScript strict. La prima slice contiene un solo preset con i tre stem reali di `AUDIO TEST PACK 01`, binaural beat generato, brown noise, timer, fade, mix e persistenza locale.

Il Test Pack e integrato e validato automaticamente; ascolto, master finale e comportamento su telefono reale restano da approvare. I WAV placeholder deterministici rimangono soltanto come fixture tecniche e non sono referenziati dal preset.

## Runtime

- Node target: 22.23.1 (`.nvmrc`, `.node-version`, Volta).
- pnpm: 11.16.0.
- Non usare il Node di sistema 18 presente sulla macchina auditata.
- React Native Audio API contiene codice nativo: Expo Go non e sufficiente.

Con un version manager gia installato:

```bash
nvm use
pnpm install --frozen-lockfile
```

Non installare globalmente Expo o EAS CLI per questo progetto.

## Verifica locale

```bash
pnpm peers check
pnpm exec expo install --check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:audio
pnpm audio:validate-placeholders
pnpm audio:validate-test-pack
pnpm security:audit
pnpm config:validate
pnpm expo:doctor
```

Bundle JavaScript/Hermes:

```bash
pnpm exec expo export --platform ios --output-dir dist/ios-bundle
pnpm exec expo export --platform android --output-dir dist/android-bundle
```

Rigenerare i placeholder, se necessario:

```bash
pnpm audio:generate-placeholders
pnpm audio:validate-placeholders
```

## Avvio

Per sviluppo, il development client Android puo caricare JavaScript e Test Pack tramite Metro:

```bash
pnpm start
```

La preview Android standalone e disponibile nella build EAS `c3a39414-d156-4373-810a-0011296b51f8`: incorpora bundle e Test Pack e non richiede Metro. L'APK locale verificato e `dist/eas/app-relax-preview-android-c3a39414.apk`; la pagina stabile e documentata nel decision log. Le build native locali non sono disponibili sull'host auditato. Qualunque nuova build Android/iOS, upload o submission richiede una nuova autorizzazione. Vedere `docs/runbooks/NATIVE_AND_EAS_GATES.md`.

Il progetto EAS collegato e `@robert-fulton-studio/app-relax` (`e1d77255-66f4-45c1-b1fa-c503a088b30f`). L'account e l'organizzazione sono sul piano Free; nessuna credenziale e salvata nel repository.

`.easignore` esclude credenziali, Git metadata, dipendenze, output generati, documentazione/test/tooling e i flussi paralleli `output/`/`tmp/` dall'archivio cloud. La build usa `EAS_NO_VCS=1` per evitare il bug EAS che reintroduce `.git`; stato Git, diff e contenuto esatto dell'archivio vengono verificati esplicitamente prima dell'upload, senza assumere una worktree pulita. L'archivio si valida con `pnpm eas:validate-archive <directory>`.

## Struttura

- `src/app/`: route e schermate.
- `src/audio/`: controller, graph driver e adapter RNAA.
- `src/domain/`, `src/presets/`: schema e preset.
- `assets/audio/test-pack-01/`: i tre WAV reali autorizzati e il manifest verificabile.
- `assets/audio/placeholders/`: fixture tecniche deterministiche escluse dal preset e dagli archivi EAS.
- `tests/`: dominio, DSP, controller, persistenza, UI e contract test.
- `docs/`: specifiche, decisioni, test plan e runbook.

## Confini

- Nessun backend, login, billing o catalogo esteso.
- Nessun claim medico o terapeutico.
- Gli asset ICNS/JXL/HEIF/AVIF sono vietati e controllati anche per signature binaria.
- Il commit locale della milestone e il gate EAS Android sono autorizzati; push, EAS iOS, submission, pubblicazione e costi richiedono una nuova approvazione.
- `output/` e `tmp/` sono flussi paralleli/generati fuori scope e sono esclusi da Git/EAS.
