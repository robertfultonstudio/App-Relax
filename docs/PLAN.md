# Piano operativo - Vertical slice Deep Sleep 432

Stato: gate repository e compilazione EAS Android chiusi; gate device aperto; iOS in attesa di approvazione
Data: 10 agosto 2026

## Risultato finale

Una development build Expo installabile che permetta Home -> Sleep -> `Deep Sleep 432` -> player e riproduca una sola sessione composta dai tre stem reali di `AUDIO TEST PACK 01`, binaural beat e brown noise, con mix, timer, fade e persistenza minima.

Il Test Pack e integrato localmente su autorizzazione esplicita. La milestone termina ora al gate device/ascolto, senza ampliare catalogo o richiedere altri asset.

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

### WP3 - Motore audio streaming — completato a livello repository; runtime Android parziale verificato

Tre file source incrementali e distinti, instradati via media-element verso gain separati, oscillatori stereo, brown noise, master fade, stop schedulato sul clock audio e cleanup transazionale. Prova: test fake/DSP, validator WAV, bundle Metro e avvio su emulatore Android.

[F] La compilazione nativa Android di RNAA 0.13.2 con RN 0.86.2 e dimostrata dalla build EAS `FINISHED`. [F] L'emulatore API 34 x86_64 ha raggiunto Ready e Play con i tre hash reali e AAudio attivo senza riprodurre il precedente OOM. [U] Telefono reale e iOS restano aperti.

### WP4 - Esperienza verticale — completato a livello repository

Home con quattro categorie, lista Sleep, empty state per le altre categorie, player, mix, timer, Settings e Legal. Prova: test UI e bundle Metro.

### WP5 - Timer, persistenza e lifecycle — completato a livello repository

Deadline assoluta, fade terminale, stop audio nativo, persistenza senza autoplay, pause manuali separate dalle interruzioni e fault handling. Prova: test automatici con clock e driver fake.

### Gate A - Verifiche locali non native — completato

- install frozen e peer dependency;
- lint e typecheck;
- 37 test in 9 suite, inclusi 26 test audio;
- validatori audio e progetto;
- Expo Doctor 20/20;
- export Hermes iOS e Android;
- prebuild isolato senza installazioni native.

### Gate B1 - EAS cloud Android development client — completato

Profilo `development-android`, SDK 57 e APK internal distribution verificati nella build `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7`, stato `FINISHED`. APK integro e checksum registrato; quota Free dopo build `1/15`, costo zero. Il gate di compilazione nativa Android e verde, mentre l'esecuzione audio richiede Gate C.

### Gate B2 - EAS cloud Android standalone preview — completato

Profilo `preview-android`, bundle e Test Pack incorporati nella build `c3a39414-d156-4373-810a-0011296b51f8`, stato `FINISHED`. APK 289.861.086 byte, SHA-256 `47a6603108f6aee3464f6a63ae00f0b0fdb287d375a391d1a9210043e6b0a2a6`; ZIP, quattro ABI, bundle e tre WAV verificati. Quota Free dopo build `2/15` Android, costo zero.

### Gate C1 - Emulatore Android API 34 — completato entro i confini emulatore

Il development client ha caricato via Metro il bundle corrente: navigazione, cache dei tre stem, hash, Ready e timer sono verificati. Dopo aver reso la notifica Android best-effort e non bloccante, il rerun ha raggiunto `RITUAL IN PROGRESS`, timer in decremento e AAudio stereo 48 kHz; l'utente ha confermato suono udibile. La preview standalone e stata poi reinstallata con dati app puliti e Metro spento: Home, Ready, Play e timer 28:55 sono verdi. Durante un ascolto successivo AAudio e AudioFlinger sono rimasti continui e senza underrun, mentre QEMU ha riaperto due volte l'output CoreAudio con gap di circa 22 ms e 11 ms: i glitch osservati sono quindi localizzati nel ponte emulatore/host. Trigger preciso e comportamento su telefono restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

### Gate C2 - Telefono Android reale — non determinato

Installare l'APK e provare navigazione, cinque sorgenti, timer, speaker, cuffie/Bluetooth, background, lock-screen e interruzioni. Disponibilita device: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

### Gate D - EAS cloud iOS — in attesa di approvazione e prerequisiti Apple

Profilo `development-ios` gia configurato. Richiede account Expo, Apple Developer Program attivo, credenziali di firma e registrazione iPhone. Non richiede un nuovo Mac.

### Gate E - AUDIO TEST PACK 01 — integrato localmente

Ricevuti e cablati esclusivamente i tre WAV elencati in `docs/AUDIO_REQUESTS.md`. Nessun asset ulteriore prima dell'approvazione umana del preset.

## Condizione di arresto

I Gate B1/B2 e l'ascolto base su emulatore sono completati. Il lavoro si arresta prima di qualunque ulteriore build, iOS, submission o richiesta di altri asset. Il prossimo gate di prodotto e il telefono Android reale.
