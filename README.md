# App Relax - Deep Sleep 432 vertical slice

App mobile consumer iOS/Android costruita con Expo SDK 57, React Native 0.86, Expo Router e TypeScript strict. La prima slice contiene un solo preset con tre stem placeholder, binaural beat generato, brown noise, timer, fade, mix e persistenza locale.

I WAV inclusi sono placeholder tecnici deterministici, non audio creativo approvato. `AUDIO TEST PACK 01` resta bloccato fino allo smoke test della development build su telefono reale.

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
pnpm audio:validate-placeholders
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

Una development build nativa deve essere gia installata:

```bash
pnpm start
```

Le build locali non sono disponibili sull'host auditato. I profili EAS sono pronti in `eas.json`; per questa milestone sono autorizzati login Expo, linking, upload e una build cloud Android `development-android` entro la quota Free. iOS, submission e spese restano esclusi. Vedere `docs/runbooks/NATIVE_AND_EAS_GATES.md`.

Il progetto EAS collegato e `@robert-fulton-studio/app-relax` (`e1d77255-66f4-45c1-b1fa-c503a088b30f`). L'account e l'organizzazione sono sul piano Free; nessuna credenziale e salvata nel repository.

`.easignore` esclude credenziali, dipendenze, output generati, documentazione/test e i flussi paralleli `output/`/`tmp/` dall'archivio cloud.

## Struttura

- `src/app/`: route e schermate.
- `src/audio/`: controller, graph driver e adapter RNAA.
- `src/domain/`, `src/presets/`: schema e preset.
- `assets/audio/placeholders/`: tre WAV tecnici e manifest.
- `tests/`: dominio, DSP, controller, persistenza, UI e contract test.
- `docs/`: specifiche, decisioni, test plan e runbook.

## Confini

- Nessun backend, login, billing o catalogo esteso.
- Nessun claim medico o terapeutico.
- Gli asset ICNS/JXL/HEIF/AVIF sono vietati e controllati anche per signature binaria.
- Il commit locale della milestone e il gate EAS Android sono autorizzati; push, EAS iOS, submission, pubblicazione e costi richiedono una nuova approvazione.
- `output/` e `tmp/` sono flussi paralleli/generati fuori scope e sono esclusi da Git/EAS.
