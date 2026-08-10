# Decision log

## D-001 - Milestone singola

Data: 10 agosto 2026
Stato: accettata

[F] Il brief definisce la vertical slice placeholder e il gate `AUDIO TEST PACK 01`. La milestone copre solo questo risultato e si arresta prima dell'integrazione dei WAV reali.

## D-002 - Expo SDK 57 come baseline

Data: 10 agosto 2026
Stato: accettata; sostituisce la precedente ipotesi SDK 56

[F] Su decisione esplicita dell'utente, si mantiene Expo SDK 57 salvo blocker tecnico dimostrato. I metadata ufficiali correnti associano SDK 57 a React Native 0.86, React 19.2.3, Node 22.13.x, iOS 16.4+, Xcode 26.4+ e Android API 36. Il progetto usa Expo 57.0.12 e RN 0.86.2, allineati al template ufficiale corrente.

[F] I gate locali eseguiti con Node 24.14.0 sono verdi. Il target riproducibile e Node 22.23.1, presente nelle immagini EAS SDK 57 e registrato nei file di versione.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: compatibilita nativa di RNAA 0.13.2 con RN 0.86 fino alla prima build iOS/Android e allo smoke test. Il package RNAA usa peer aperti ma il suo sviluppo e la matrice pubblica arrivano a RN 0.85; questa assenza non e un blocker dimostrato.

Fonti primarie: [tabella versioni Expo](https://docs.expo.dev/versions/latest/), [metadata SDK Expo](https://github.com/expo/expo/blob/main/docs/ui/components/SDKTables/sdk-versions.json), [template SDK 57](https://github.com/expo/expo/blob/sdk-57/templates/expo-template-default/package.json), [compatibilita RNAA](https://docs.swmansion.com/react-native-audio-api/docs/other/compatibility/), [package RNAA 0.13.2](https://github.com/software-mansion/react-native-audio-api/blob/0.13.2/packages/react-native-audio-api/package.json).

## D-003 - Motore audio primario

Data: 10 agosto 2026
Stato: accettata, da provare nativamente

[F] `react-native-audio-api` 0.13.2 offre AudioContext, buffer source, oscillator, gain, stereo panner, decoding, session management, playback notifications e config Expo per background. E il motore primario dietro `AudioGraphDriver`.

[I] I tre stem brevi placeholder possono essere decodificati in memoria. I futuri WAV stereo da circa 180 secondi potrebbero usare circa 207 MB come float32 complessivi, escluso overhead; memoria e startup sono gate del pack. Se emerge un blocker riproducibile, `expo-audio` puo essere un fallback solo-stem dietro la stessa interfaccia. Nessun cambio silenzioso.

## D-004 - Sintesi e peer worklets

Data: 10 agosto 2026
Stato: accettata

Il binaural usa due oscillator node pannati; il brown noise usa un buffer generato a runtime e loopato. `react-native-worklets` 0.10.1 e installato per soddisfare il peer dichiarato da RNAA ed e coerente con SDK 57; non viene implementato un worklet DSP custom in questa slice.

## D-005 - Parametri Deep Sleep 432

Data: 10 agosto 2026
Stato: decisione tecnica iniziale, rivedibile dopo ascolto

- `tuningLabel`: `432 Hz`.
- `carrierHz`: 180 Hz.
- `beatHz`: 3.5 Hz.
- Durate: 15, 30, 60 minuti.
- Fade-in: 8 secondi; fade-out: 12 secondi.

Questi valori sono design sonoro e metadati, non indicazioni terapeutiche. `432 Hz` non viene usato per derivare carrier o beat.

## D-006 - Stato persistito

Data: 10 agosto 2026
Stato: accettata

Si salvano versione schema, ultimo preset, durata, gain e mute. L'idratazione precede il load; non si salva lo stato nativo ne si attiva autoplay.

## D-007 - Background audio

Data: 10 agosto 2026
Stato: configurato, validazione device aperta

[F] Il prebuild isolato ha generato `UIBackgroundModes=audio`, permessi Android e foreground service `mediaPlayback`. Il driver pianifica fade e stop dei nodi sul clock audio, gestisce permesso notification, nasconde sempre i controlli best-effort, conserva l'osservazione durante interruzioni e rilascia/riacquisisce il focus nelle pause manuali.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: stabilita reale, lock-screen, notifica immediatamente rimossa con JS sospeso, Bluetooth e sessioni lunghe fino ai test su telefoni.

## D-008 - Superfici esterne

Data: 10 agosto 2026
Stato: accettata

- Zoom: nessuna superficie applicabile; il prodotto non e meeting, video, event delivery, Phone o Contact Center.
- OpenAI API: fuori scope; nessuna feature AI richiesta.
- GitHub: repository canonica `https://github.com/robertfultonstudio/App-Relax`; `origin` configurato localmente dopo verifica read-only. Nessun push o PR senza autorizzazione.
- Plugin management: nessuna installazione aggiuntiva necessaria.
- DOCX/PDF: non richiesti; la documentazione resta Markdown versionata.

## D-009 - Lavoro parallelo

Data: 10 agosto 2026
Stato: accettata

[F] `output/` e `tmp/` contengono artefatti paralleli comparsi dopo l'audit iniziale, inclusi strategia e render PDF non appartenenti alla vertical slice. Non sono stati modificati o assorbiti; le directory complete sono escluse da staging e upload EAS.

## D-010 - Repository canonica

Data: 10 agosto 2026
Stato: accettata

[F] Owner GitHub `robertfultonstudio`; repository pubblica `App-Relax`, branch predefinito `main`, vuota al controllo read-only. Il remote `origin` punta a `https://github.com/robertfultonstudio/App-Relax.git`. La milestone e preparata sul branch locale `codex/deep-sleep-432-mvp`; il commit locale e autorizzato, mentre push e PR restano non autorizzati.

## D-011 - EAS cloud al posto della toolchain locale

Data: 10 agosto 2026
Stato: configurato; esecuzione Android autorizzata, iOS esclusa

[F] EAS Build e un servizio hosted che produce binari Android e iOS senza toolchain native locali. I profili sono separati: Android usa `ubuntu-26.04-jdk-17-ndk-r27b-sdk-57`; iOS usa `macos-tahoe-26.5-xcode-26.6`; entrambi Node 22.23.1. L'Android APK e il primo gate proposto.

[F] `.easignore` prevale su `.gitignore` durante la preparazione dell'upload. Il file replica le esclusioni essenziali e rimuove dall'archivio `.git`, dipendenze, output nativi/generati, credenziali locali, documentazione, test e i flussi paralleli `output/`/`tmp/`. Il validator config rende obbligatorie le regole di sicurezza critiche.

[F] Il piano EAS Free corrente include una quantita limitata di build a bassa priorita. La CLI ha verificato sull'organizzazione `robert-fulton-studio` quota Android `0/15`, quota totale `0/30`, nessun add-on, overage e costo stimato pari a zero nel ciclo corrente. Quota e condizioni vanno riconfermate subito prima della build.

Fonti primarie: [EAS Build](https://docs.expo.dev/build/), [infrastruttura EAS](https://docs.expo.dev/build-reference/infrastructure/), [regole `.easignore`](https://docs.expo.dev/build-reference/easignore/), [piani EAS](https://docs.expo.dev/billing/plans/), [pricing Expo](https://expo.dev/pricing).

## D-012 - Account Apple, costi e hardware

Data: 10 agosto 2026
Stato: accettata

[F] Una development build EAS installata su iPhone richiede un abbonamento attivo all'Apple Developer Program, firma e registrazione device. La distribuzione App Store richiede il programma Apple; la quota ufficiale e 99 USD/anno o equivalente locale, salvo esenzioni. Nessun acquisto, login Apple o registrazione dispositivo e autorizzato ora. Il solo login Expo necessario al gate Android e autorizzato.

[F] Un telefono reale e necessario per il gate audio, ma non serve acquistare un nuovo Mac. La disponibilita di iPhone/Android dell'utente e `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

Fonti primarie: [setup development build iOS](https://docs.expo.dev/get-started/set-up-your-environment/?device=physical&mode=development-build&platform=ios), [ruoli Apple per EAS](https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/), [membership Apple](https://developer.apple.com/support/compare-memberships/).

## D-013 - Identificativi e project linking

Data: 10 agosto 2026
Stato: collegato e verificato

[F] `com.robertfultonstudio.apprelax` e sintatticamente valido e condiviso tra iOS/Android. [U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: disponibilita negli account Apple/Google per la distribuzione store. Il progetto EAS e `@robert-fulton-studio/app-relax`, owner `robert-fulton-studio`, project ID `e1d77255-66f4-45c1-b1fa-c503a088b30f`; `eas project:info` ha confermato entrambi dopo il linking.

## D-014 - Evidenze locali

Data: 10 agosto 2026
Stato: verificata

[F] Install frozen e peer check verdi; lint e typecheck verdi; 8 suite/30 test verdi (subset audio 19/19); placeholder, asset safety e project config verdi; Expo Doctor 20/20; export Hermes iOS/Android completati; prebuild isolato config plugin completato. Nessuna compilazione nativa o build cloud e stata eseguita.

## D-015 - Audit dipendenze e asset non fidati

Data: 10 agosto 2026
Stato: mitigato con residuo upstream accettato per i gate locali

[F] Gli advisory moderati di `joi` e `uuid` sono stati risolti nel lockfile con override a `joi` 17.13.4 e `uuid` 11.1.1. Config validator, prebuild isolato e gate Expo devono restare verdi per coprire la compatibilita degli override.

[F] `metro` 0.84.4 dipende da `image-size` 1.2.1. L'audit segnala due DoS high per parser ICNS e JXL/HEIF. Al controllo corrente il registry npm pubblica al massimo 2.0.2 e gli advisory GitHub dichiarano nessuna versione corretta, quindi non esiste un upgrade risolutivo pubblicato.

[F] Il prodotto non accetta immagini remote o upload utente. `assets:validate-safety` esclude ICNS, JXL, HEIF, HEIC e AVIF nell'intero sorgente, sia per estensione sia per signature binaria; `security:audit` fallisce per qualsiasi advisory diverso dai due residui esatti o se modulo/versione cambiano.

[U] Residuo: `pnpm audit --audit-level high` termina con exit 1 finche l'advisory upstream resta aperto. La policy locale termina verde con `PASS WITH ACCEPTED RESIDUALS`; va rieseguita immediatamente prima di ogni upload EAS e l'allowlist va rimossa appena Expo/Metro espone una dipendenza corretta.

Fonti primarie: [ICNS DoS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [JXL/HEIF DoS](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), [package npm image-size](https://www.npmjs.com/package/image-size).

## D-016 - Sblocco operativo Android

Data: 10 agosto 2026
Stato: autorizzato entro confini espliciti

[F] Dopo l'elenco puntuale dei gate residui, l'utente ha autorizzato lo sblocco operativo. Il perimetro copre staging e commit locali della milestone, login Expo sicuro via browser, creazione o collegamento del progetto EAS, upload del solo archivio validato e una build Android `development-android` entro la quota Free.

[F] Restano esclusi: push o PR GitHub, build iOS, login Apple, registrazione dispositivi, submission store, pubblicazione, acquisti e upgrade di piano. Un prompt che richieda un costo o una scelta di account non dimostrabile interrompe il gate.

## D-017 - Account Expo e organizzazione

Data: 10 agosto 2026
Stato: creati e verificati

[F] Su autorizzazione esplicita dell'utente e stato completato l'onboarding Expo tramite l'account Google indicato dall'utente. Sono stati creati il profilo personale `robertfultonstudio`, l'organizzazione commerciale `Robert Fulton Studio` con slug `robert-fulton-studio` e il progetto `App Relax` con slug `app-relax`. Non sono stati invitati membri, caricati avatar, aggiunti metodi di pagamento o attivati piani a pagamento.

[F] La CLI `eas whoami` conferma il ruolo Owner su profilo e organizzazione. Nessuna password, token o credenziale e stata letta, stampata o aggiunta al repository.

## Attivita aperte

- Ispezionare l'archivio e avviare una build EAS Android gia autorizzata entro quota Free.
- Riverificare `security:audit` e rimuovere l'allowlist `image-size` non appena esiste una release corretta.
- Installare la development build su un telefono Android gia disponibile e svolgere lo smoke test.
- Autorizzare EAS iOS solo con programma Apple e iPhone disponibili.
- Misurare headroom, memoria e loop dopo il gate `AUDIO TEST PACK 01`.
- Confermare bundle identifier e naming commerciale prima della distribuzione.
- Ottenere revisione legale/store prima del rilascio pubblico.
