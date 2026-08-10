# Piano operativo - Vertical slice Deep Sleep 432

Stato: gate repository e compilazione EAS Android chiusi; gate device aperto; iOS in attesa di approvazione
Data: 10 agosto 2026

## Risultato finale

Una development build Expo installabile su telefono reale che permetta Home -> Sleep -> `Deep Sleep 432` -> player e riproduca una sola sessione composta da tre stem placeholder, binaural beat e brown noise, con mix, timer, fade e persistenza minima.

La milestone termina al gate `AUDIO TEST PACK 01`; non integra ancora i WAV reali.

## Vincoli

- Stack: Expo SDK 57, React Native 0.86.2, Expo Router, TypeScript strict, `expo-dev-client`.
- Motore primario: `react-native-audio-api` 0.13.2 dietro `AudioEngine`.
- Nessun claim medico e nessuna falsa validazione scientifica di 432 Hz o binaural beat.
- Nessun backend, account prodotto, pagamento o catalogo esteso.
- Nessun nuovo hardware come prerequisito.
- Nessun login, project linking, upload, cloud build, registrazione device, push o pubblicazione senza autorizzazione separata.
- I percorsi paralleli `output/strategia-app-audio/` e `tmp/strategia-app-audio/` sono fuori scope.

## Sequenza e stato

### WP0 - Baseline e documentazione — completato

Inventario toolchain, istruzioni, stato e sette documenti richiesti. Prova: file presenti e decisioni aggiornate.

### WP1 - Bootstrap applicativo — completato

SDK 57, Router, strict TypeScript, dev client, AsyncStorage, RNAA e config plugin. Prova: install frozen, peer check, Expo Doctor.

### WP2 - Dominio e preset — completato

Schema versionato, unico preset, tuning/carrier/beat separati e mix conservativo. Prova: unit test.

### WP3 - Motore audio placeholder — completato a livello repository

Tre buffer loopabili, oscillatori stereo, brown noise, gain per sorgente, master fade, stop schedulato sul clock audio e cleanup transazionale. Prova: test fake/DSP, validator WAV, bundle Metro e prebuild config plugin.

[F] La compilazione nativa Android di RNAA 0.13.2 con RN 0.86.2 e dimostrata dalla build EAS `FINISHED`. [U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: avvio, playback e lifecycle audio fino allo smoke test su telefono reale; iOS resta non compilato.

### WP4 - Esperienza verticale — completato a livello repository

Home con quattro categorie, lista Sleep, empty state per le altre categorie, player, mix, timer, Settings e Legal. Prova: test UI e bundle Metro.

### WP5 - Timer, persistenza e lifecycle — completato a livello repository

Deadline assoluta, fade terminale, stop audio nativo, persistenza senza autoplay, pause manuali separate dalle interruzioni e fault handling. Prova: test automatici con clock e driver fake.

### Gate A - Verifiche locali non native — completato

- install frozen e peer dependency;
- lint e typecheck;
- 30 test in 8 suite, inclusi 19 test audio;
- validatori audio e progetto;
- Expo Doctor 20/20;
- export Hermes iOS e Android;
- prebuild isolato senza installazioni native.

### Gate B - EAS cloud Android — completato

Profilo `development-android`, SDK 57 e APK internal distribution verificati nella build `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7`, stato `FINISHED`. APK integro e checksum registrato; quota Free dopo build `1/15`, costo zero. Il gate di compilazione nativa Android e verde, mentre l'esecuzione audio richiede Gate C.

### Gate C - Telefono Android reale — non determinato

Installare l'APK e provare navigazione, cinque sorgenti, timer, speaker, cuffie/Bluetooth, background, lock-screen e interruzioni. Disponibilita device: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

### Gate D - EAS cloud iOS — in attesa di approvazione e prerequisiti Apple

Profilo `development-ios` gia configurato. Richiede account Expo, Apple Developer Program attivo, credenziali di firma e registrazione iPhone. Non richiede un nuovo Mac.

### Gate E - AUDIO TEST PACK 01 — bloccato

Aprire solo dopo una development build placeholder funzionante e il primo smoke test su telefono reale. Chiedere esclusivamente i tre WAV gia elencati in `docs/AUDIO_REQUESTS.md`.

## Condizione di arresto

Il Gate B e stato autorizzato e completato. Il lavoro autonomo si arresta ora prima dell'installazione fisica se non e disponibile un telefono Android e prima di qualunque seconda build, iOS o submission, che richiedono nuova approvazione. Nessuna richiesta audio viene anticipata.
