# App Relax - Istruzioni operative

## Ambito

Questo repository contiene una vera app mobile consumer iOS/Android basata su React Native ed Expo. La milestone attiva e M3 `Product Shell & Impressionist UI Foundation`: tre tab consumer `RITUALS`, `YOGA` e `SOUNDSCAPES`, tutti strutturati ma senza audio disponibile. La Home e outcome-first e rende immediatamente visibili Yoga, Massage, Relax, Meditation, Sleep e Focus; funzione e futura azione precedono durata/formato e naming evocativo. `Moon Current`, il preset tecnico `deep-sleep-432` e i tre stem reali di `AUDIO TEST PACK 01` restano confinati nel percorso separato `AUDIO TEST / TEST ONLY`.

Il materiale in `output/strategia-app-audio/` e `tmp/strategia-app-audio/` appartiene a un flusso parallelo e non va modificato, spostato, cancellato, staged o assorbito senza istruzione esplicita.

## Ordine delle fonti

1. Istruzioni dell'utente e policy globale della sessione.
2. Questo file.
3. `STATO.md` e `docs/DECISIONS.md`.
4. Specifiche in `docs/`.
5. Codice e test verificati.

In caso di conflitto, fermarsi, registrare il conflitto e non inventare una soluzione.

## Regole non negoziabili

- Consumer first, mobile first; nessuna PWA o web demo come sostituto del prodotto.
- TypeScript strict, Expo SDK 57, React Native 0.86, Expo Router e development build con `expo-dev-client`.
- La UI parla con `AudioSessionController`; non usa direttamente API audio native.
- La shell consumer usa il linguaggio `consumer-paper`: layout editoriale
  asimmetrico, carta washi, immagini integrate e hairline. Sono vietati card
  arrotondate generiche, pillole di stato e blob decorativi; Audio Test resta
  deliberatamente nella shell tecnica scura separata.
- `AudioEngine` resta indipendente dall'implementazione.
- `tuningLabel`, `carrierHz` e `beatHz` sono concetti distinti.
- Nessun claim medico, terapeutico o clinico.
- Nessun backend, login, billing, analytics, community o marketplace in M3.
- Nessun file audio reale oltre i tre stem di `AUDIO TEST PACK 01` durante M3.
- Le sezioni consumer non possono referenziare preset, asset audio o route player.
- Il mixer multilayer resta soltanto nel percorso tecnico `AUDIO TEST`.
- Functionality and time-to-sound first; evocative naming is secondary metadata.
- Gli artwork outcome seguono un contemporary minimal Japanese impressionism
  materico (pigmento minerale nihonga, sumi, gouache asciutta, washi,
  asimmetria e `ma`) insieme a refined cosmic new age; functionality e
  time-to-sound restano primari.
- Differenziare l'interfaccia da Anima senza abbandonare l'immaginario cosmico: sono ammessi cieli pittorici, campi stellari rarefatti, luce lunare e famiglie Cosmic/Aquarian originali; sono vietate imitazioni riconoscibili di sfere o pianeti neri luminosi, waveform/neuro-grafiche, frequency-first, mandala, chakra, Buddha, torii, pagode e kanji.
- Non dichiarare background audio o qualita sonora validati senza prove su telefono reale.
- Usare le etichette `[F]`, `[I]`, `[U]`; quando manca evidenza scrivere `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- Nessun nuovo Mac o altro acquisto hardware e un prerequisito di progetto.

## Workflow

Prima di cambiare file, leggere `STATO.md`, `docs/DECISIONS.md` e `git status --short --branch`. Mantenere modifiche piccole e reversibili. Non usare staging globale: aggiungere solo percorsi confermati.

Runtime riproducibile: Node `22.23.1` e pnpm `11.16.0`, registrati in `.nvmrc`, `.node-version`, `package.json` ed `eas.json`. Il Node di sistema non va usato. I controlli in questo ambiente possono usare il runtime Node isolato fornito da Codex.

Comandi locali autorizzabili senza toolchain nativa:

```bash
pnpm install --frozen-lockfile
pnpm peers check
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
pnpm exec expo install --check
pnpm exec expo export --platform ios
pnpm exec expo export --platform android
```

`expo run:*`, `eas login`, `eas init`, `eas device:create`, `eas build`, upload, submission e registrazione dispositivi richiedono approvazione esplicita. Android e iOS sono gate cloud separati; non usare `--platform all`.

## Definition of Done

Il gate repository/non nativo M3 e chiuso solo quando:

- i tab `RITUALS`, `YOGA` e `SOUNDSCAPES`, Settings e Legal sono implementati;
- Yoga espone formati futuri 20/30/45/60 minuti, tutti `IN PRODUCTION` e privi di audio;
- Soundscapes espone opere autonome, Elemental Worlds, field recording, Cosmic/Zen Ambient ed Esoteric Series, tutti `IN PRODUCTION` e privi di audio;
- la Home espone i sei bisogni Yoga, Massage, Relax, Meditation, Sleep e Focus,
  tutti `IN PRODUCTION`, bloccati e privi di audio;
- `Moon Current` e il solo preset tecnico riproducibile sono visibili esclusivamente in `AUDIO TEST / TEST ONLY`;
- i quattro artwork rituali e i font locali sono validati;
- i sei artwork outcome originali sono presenti uno per funzione, documentati in
  `docs/M3_OUTCOME_ARTWORK_PROVENANCE.md` e verificati con SHA-256;
- tre stem reali separati, binaural e brown noise sono cablati senza playback duplicato;
- gain, mute, loading, error e fade sono esposti per ogni sorgente;
- timer assoluto, fade, stop nativo schedulato e persistenza minima sono coperti da test;
- lint, typecheck, test, validatori, Expo Doctor ed export Metro iOS/Android sono verdi;
- `eas.json`, config plugin e identificativi sono validati offline;
- nessun segreto o asset audio reale oltre `AUDIO TEST PACK 01` e presente.

M3 non e completa finche gli screenshot runtime non sono approvati. La task corrente si ferma prima di EAS, commit, push o PR. I test su telefono reale restano obbligatori per memoria/startup, speaker, cuffie/Bluetooth, background/lock-screen, interruzioni, latenza, batteria e qualita sonora. Nessun asset audio ulteriore e autorizzato in M3.

## Autorizzazioni

Sono richieste istruzioni esplicite prima di installazioni globali o di sistema, credenziali/account, acquisti, project linking EAS, build cloud, upload, registrazione dispositivi, deploy, pubblicazione, push, invii esterni, cancellazioni o migrazioni irreversibili. Commit locale, push e pull request sono azioni distinte; non inferire l'una dall'altra.
