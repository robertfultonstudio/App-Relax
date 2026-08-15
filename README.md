# App Relax - Product Shell M3

App mobile consumer iOS/Android costruita con Expo SDK 57, React Native 0.86, Expo Router e TypeScript strict. M3 introduce la shell consumer con i tab `RITUALS`, `YOGA` e `SOUNDSCAPES`. La Home mette prima le azioni Yoga, Massage, Relax, Meditation, Sleep e Focus; durata/formato e naming evocativo vengono dopo. Tutti i contenuti consumer sono curati ma dichiarati `IN PRODUCTION`: non caricano audio e non aprono il player.

Le sei azioni hanno artwork originali quadrati, generati text-only senza
reference image e documentati con SHA-256 in
[`docs/M3_OUTCOME_ARTWORK_PROVENANCE.md`](docs/M3_OUTCOME_ARTWORK_PROVENANCE.md).
La direzione unisce contemporary minimal Japanese impressionism materico e
refined cosmic new age senza spostare la gerarchia da funzione e CTA.

`Moon Current`, il preset `deep-sleep-432`, il mixer multilayer e i tre WAV di `AUDIO TEST PACK 01` vivono esclusivamente nel percorso separato `AUDIO TEST / TEST ONLY`, raggiungibile da Settings. Restano strumenti di validazione del motore, non contenuto consumer.

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
pnpm assets:validate-safety
pnpm assets:validate-rituals
pnpm security:audit
pnpm config:validate
pnpm expo:doctor
```

Bundle JavaScript/Hermes:

```bash
pnpm exec expo export --platform ios --output-dir dist/m3-final-export-ios
pnpm exec expo export --platform android --output-dir dist/m3-final-export-android
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

Per un telefono Android fisico via USB, usare il wrapper che risolve ADB,
Dev Client, reverse della porta e runtime locale senza cambiare il `PATH`
globale. La procedura completa e in
[`docs/runbooks/ANDROID_PHYSICAL_DEVICE.md`](docs/runbooks/ANDROID_PHYSICAL_DEVICE.md).

```bash
bash scripts/android-physical-device.sh check
```

Le preview Android esistenti appartengono a UI precedenti e non provano M3. La task M3 si ferma agli screenshot runtime e non autorizza EAS. Le build native locali non sono disponibili sull'host auditato. Vedere `docs/runbooks/NATIVE_AND_EAS_GATES.md`.

Il progetto EAS collegato e `@robert-fulton-studio/app-relax` (`e1d77255-66f4-45c1-b1fa-c503a088b30f`). L'account e l'organizzazione sono sul piano Free; nessuna credenziale e salvata nel repository.

`.easignore` esclude credenziali, Git metadata, dipendenze, output generati, documentazione/test/tooling e i flussi paralleli `output/`/`tmp/` dall'archivio cloud. La build usa `EAS_NO_VCS=1` per evitare il bug EAS che reintroduce `.git`; stato Git, diff e contenuto esatto dell'archivio vengono verificati esplicitamente prima dell'upload, senza assumere una worktree pulita. L'archivio si valida con `pnpm eas:validate-archive <directory>`.

## Struttura

- `src/app/`: route e schermate.
- `src/audio/`: controller, graph driver e adapter RNAA.
- `src/content/`: tab, famiglie editoriali future, rituali e temi.
- `src/domain/`, `src/presets/`: schema e preset.
- `assets/images/outcomes/`: sei artwork outcome M3 JPEG 720×720 con provenance verificabile.
- `assets/images/rituals/`: quattro artwork M2 e manifest verificabile.
- `assets/audio/test-pack-01/`: i tre WAV reali autorizzati e il manifest verificabile.
- `assets/audio/placeholders/`: fixture tecniche deterministiche escluse dal preset e dagli archivi EAS.
- `tests/`: dominio, DSP, controller, persistenza, UI e contract test.
- `docs/`: specifiche, decisioni, test plan e runbook.

## Confini

- Functionality and time-to-sound first; evocative naming is secondary metadata.
- Nessun backend, login, analytics, billing o catalogo remoto.
- Nessun claim medico o terapeutico.
- Differenziazione da Anima nell'interfaccia, non abbandono dell'immaginario cosmico. M3 combina contemporary minimal Japanese impressionism (nihonga, sumi, gouache asciutta, washi, asimmetria e `ma`) e cosmic new age originale senza cliché giapponesi/spirituali, sfere o pianeti neri luminosi, waveform/neuro-grafiche o gerarchie frequency-first.
- Gli asset ICNS/JXL/HEIF/AVIF sono vietati e controllati anche per signature binaria.
- EAS, commit locale, push, PR, submission, pubblicazione e costi restano azioni separate e non autorizzate da M3.
- `output/` e `tmp/` sono flussi paralleli/generati fuori scope e sono esclusi da Git/EAS.
