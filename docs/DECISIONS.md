# Decision log

## D-001 - Milestone singola

Data: 10 agosto 2026
Stato: superata da D-020 per autorizzazione esplicita dell'utente

[F] Il brief originario definiva la vertical slice placeholder e il gate `AUDIO TEST PACK 01`. D-020 registra la successiva autorizzazione esplicita a integrare i tre WAV reali; il limite a un preset e tre file resta invariato.

## D-002 - Expo SDK 57 come baseline

Data: 10 agosto 2026
Stato: accettata; sostituisce la precedente ipotesi SDK 56

[F] Su decisione esplicita dell'utente, si mantiene Expo SDK 57 salvo blocker tecnico dimostrato. I metadata ufficiali correnti associano SDK 57 a React Native 0.86, React 19.2.3, Node 22.13.x, iOS 16.4+, Xcode 26.4+ e Android API 36. Il progetto usa Expo 57.0.12 e RN 0.86.2, allineati al template ufficiale corrente.

[F] I gate locali eseguiti con Node 24.14.0 sono verdi. Il target riproducibile e Node 22.23.1, presente nelle immagini EAS SDK 57 e registrato nei file di versione.

[F] La build EAS Android `FINISHED` dimostra la compilazione di RNAA 0.13.2 con RN 0.86.2 per le quattro ABI previste. L'emulatore API 34 ha inoltre dimostrato bundle Metro, cache dei tre stem, Ready e almeno un avvio AAudio sul percorso streaming. [U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: affidabilita Play sul bundle finale, comportamento su telefono e compatibilita iOS fino a una build autorizzata. Il package RNAA usa peer aperti ma la sua matrice pubblica arriva a RN 0.85; questa assenza non e da sola un blocker dimostrato.

Fonti primarie: [tabella versioni Expo](https://docs.expo.dev/versions/latest/), [metadata SDK Expo](https://github.com/expo/expo/blob/main/docs/ui/components/SDKTables/sdk-versions.json), [template SDK 57](https://github.com/expo/expo/blob/sdk-57/templates/expo-template-default/package.json), [compatibilita RNAA](https://docs.swmansion.com/react-native-audio-api/docs/other/compatibility/), [package RNAA 0.13.2](https://github.com/software-mansion/react-native-audio-api/blob/0.13.2/packages/react-native-audio-api/package.json).

## D-003 - Motore audio primario

Data: 10 agosto 2026
Stato: implementazione streaming verificata staticamente; runtime emulatore parziale

[F] `react-native-audio-api` 0.13.2 offre AudioContext, buffer source, oscillator, gain, stereo panner, decoding, session management, playback notifications e config Expo per background. E il motore primario dietro `AudioGraphDriver`.

[F] Il precedente percorso full-buffer con tre WAV da 180 secondi ha riprodotto un `OutOfMemoryError` Android. E stato sostituito da download su file locale e tre file source incrementali distinti, instradati tramite media-element prima dello start per evitare il bypass del gain. La versione RNAA resta fissata a 0.13.2 e l'adapter ha un contract test dedicato. [U] Memoria, stabilita e qualita su telefono reale restano aperte.

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
Stato: Android completata; iOS esclusa

[F] EAS Build e un servizio hosted che produce binari Android e iOS senza toolchain native locali. I profili sono separati: Android usa `ubuntu-26.04-jdk-17-ndk-r27b-sdk-57`; iOS usa `macos-tahoe-26.5-xcode-26.6`; entrambi Node 22.23.1. Il primo gate Android e stato completato; iOS resta separato e non autorizzato.

[F] `.easignore` prevale su `.gitignore` durante la preparazione dell'upload. Il file replica le esclusioni essenziali e rimuove dall'archivio `.git`, dipendenze, output nativi/generati, credenziali locali, documentazione, test e i flussi paralleli `output/`/`tmp/`. Il validator config rende obbligatorie le regole di sicurezza critiche.

[F] Il piano EAS Free corrente include una quantita limitata di build a bassa priorita. La CLI ha verificato sull'organizzazione `robert-fulton-studio` quota Android `0/15`, quota totale `0/30`, nessun add-on, overage e costo stimato pari a zero prima della build. Dopo l'unica build autorizzata la quota e `1/15` Android e `1/30` totale, con overage e costo ancora pari a zero.

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

[F] Install frozen e peer check verdi; lint e typecheck verdi; 9 suite/37 test verdi (subset audio 26/26); placeholder, Test Pack, asset safety e project config verdi; Expo Doctor 20/20; export Hermes iOS/Android completati; prebuild isolato config plugin completato. La successiva EAS Android ha compilato con successo il progetto e le librerie native; l'accettazione runtime resta separata e richiede un telefono reale.

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

## D-018 - Archivio EAS senza Git metadata

Data: 10 agosto 2026
Stato: mitigazione verificata sull'archivio locale

[F] `eas build:inspect --stage archive` con `cli.requireCommit: true` ha reintrodotto un repository `.git` shallow nonostante la regola `/.git/` in `.easignore`. Il relativo `.git/config` conteneva un remote `file://` con il path locale del workspace. Non conteneva credenziali, ma la divulgazione del path e inutile.

[F] Il comportamento corrisponde a un bug aperto nel repository ufficiale `expo/eas-cli`: le varianti `.git`, `.git/**` e `/.git/**` non rimuovono i metadata nel flusso osservato. Anche `requireCommit: false` da solo non e stato sufficiente. La mitigazione verificata e `EAS_NO_VCS=1` insieme a `requireCommit: false`, con worktree pulita, commit e hash controllati esplicitamente prima della build; `.easignore` resta il confine dell'upload.

[F] L'ispezione no-VCS finale ha prodotto 49 file per 6.143.075 byte, manifest SHA-256 `4c8769a5608b328a45c0ac55be4e8a84a6d835769dc8149866366843cbef8fd4`: nessun `.git`, path locale, segreto, symlink, docs, test, tooling o flusso parallelo; presenti esattamente i tre WAV placeholder e tutti i file essenziali di build. `scripts/validate-eas-archive.mjs` rende ripetibile il controllo.

Fonte primaria: [issue Expo EAS CLI #2875](https://github.com/expo/eas-cli/issues/2875), [documentazione `.easignore`](https://docs.expo.dev/build-reference/easignore/).

## D-019 - Prima build Android EAS

Data: 10 agosto 2026
Stato: completata e verificata; smoke test fisico aperto

[F] L'unica build cloud autorizzata, profilo `development-android`, e terminata `FINISHED`: ID `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7`, Expo SDK 57.0.0, app 1.0.0 (1), fingerprint `0d061b3ea48ae2044f80a75a232326e3cf6eee7b`, completata il 10 agosto 2026 alle 21:00:58 UTC. La coda Free e durata circa 68 minuti e la build circa 24 minuti. Nessun retry, iOS, submit o upgrade e stato avviato.

[F] L'APK scaricato misura 299.803.135 byte e ha SHA-256 `d54a5333b40574baeb6560879a743ad1722619df6f6c676669e62bf7feff4ae7`. `unzip -t` e verde; sono presenti `AndroidManifest.xml`, otto DEX e librerie per `arm64-v8a`, `armeabi-v7a`, `x86` e `x86_64`. Lo scan mirato non rileva path locali, traversal, file credenziali o token evidenti. Il file e in `dist/eas/`, ignorato da Git.

[F] Il completamento della build dimostra che RNAA 0.13.2 e il config plugin compilano con Expo 57 / RN 0.86.2 su Android. L'APK e stato installato su emulatore API 34 x86_64 e ha caricato il bundle e gli asset correnti via Metro. [U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: affidabilita playback, background, lock-screen, Bluetooth, interruzioni, latenza, batteria e qualita fino allo smoke test su telefono reale.

Evidenza primaria: [build EAS Android](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7).

## Attivita aperte

- Riverificare `security:audit` e rimuovere l'allowlist `image-size` non appena esiste una release corretta.
- Installare la development build su un telefono Android gia disponibile e svolgere lo smoke test.
- Autorizzare EAS iOS solo con programma Apple e iPhone disponibili.
- Misurare headroom, memoria e loop dopo il gate `AUDIO TEST PACK 01`.
- Confermare bundle identifier e naming commerciale prima della distribuzione.
- Ottenere revisione legale/store prima del rilascio pubblico.

## D-020 - Integrazione AUDIO TEST PACK 01

Data: 10 agosto 2026
Stato: integrato localmente; ascolto e runtime device aperti

[F] L'utente ha fornito e autorizzato per l'uso nell'app esattamente tre WAV: drone A=432, ambience river e texture air. L'istruzione esplicita sblocca la loro validazione e integrazione locale nonostante lo smoke test placeholder non fosse ancora documentato; non autorizza una nuova build cloud, pubblicazione o ulteriori asset.

[F] I tre file sono PCM WAV stereo 24 bit / 48 kHz, lunghi esattamente 180 secondi. La validazione non rileva clipping, campioni non finiti, DC problematico, silenzi anomali o raccordi superiori ai transienti interni. Hash, metriche e punti di loop sono registrati in `assets/audio/test-pack-01/manifest.json` e verificati da `pnpm audio:validate-test-pack`.

[F] `Deep Sleep 432` usa ora tre chiavi reali distinte. I placeholder non sono piu referenziati e vengono esclusi dagli archivi EAS. Binaural beat e brown noise restano generati a runtime e non sono incorporati negli stem.

[F] Lint, typecheck, 9 suite/37 test, subset audio 26/26, validatori audio/config/asset safety, audit dipendenze con residui accettati ed Expo Doctor 20/20 sono verdi. Gli export Metro locali iOS e Android contengono esattamente i tre WAV reali con SHA-256 identici al manifest e nessun placeholder audio.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: startup e memoria su hardware ARM, loop percepito, bilanciamento, speaker, cuffie/Bluetooth e background fino al test su telefono.

## D-021 - Smoke Android emulatore e confine di prova

Data: 11 agosto 2026
Stato: ascolto base emulatore completato; qualita device aperta

[F] Su autorizzazione esplicita sono stati installati Platform Tools 37.0.1, Emulator 37.1.11, una system image API 34 x86_64 e l'AVD `AppRelax_API_34_x86_64`. L'APK EAS esistente e stato installato e ha caricato da Metro il bundle corrente e i tre WAV reali. Home -> Sleep -> player, copy corrente, cache di esattamente tre WAV, SHA-256 attesi, Ready e timer 15 minuti sono stati verificati.

[F] Dopo la sostituzione del full decode, un'esecuzione ha raggiunto Play con AAudio attivo senza riprodurre l'OOM; RSS osservato circa 602-605 MB in Ready e 631-695 MB in Play. Il blocco UI successivo era nel setup asincrono della notifica Android, accessorio al graph: rendendolo best-effort e non bloccante, il rerun ha mostrato `RITUAL IN PROGRESS`, timer in decremento e AAudio stereo 48 kHz. Un test impedisce che una notifica pendente blocchi di nuovo l'avvio udibile.

[F] L'utente ha confermato di sentire il suono dagli altoparlanti interni del Mac e ha segnalato molti glitch. La diagnosi live ha mantenuto AAudio `started`, frame e potenza HAL continui, zero underrun mixer/track e nessun errore RNAA o decoder. CoreAudio ha invece chiuso e riaperto `AppleHDAEngineOutput` due volte durante Play, con gap di circa 22 ms e 11 ms. Il difetto osservato e quindi localizzato dopo l'HAL Android, nel ponte QEMU -> CoreAudio; il trigger preciso delle riaperture resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: presenza dei glitch su hardware ARM, navigazione mixer completa, gain, pausa/stop, lifecycle e tutte le proprieta audio reali. Emulator, Metro e server ADB sono stati spenti a fine test. Il gate di prodotto resta un telefono Android reale; l'emulatore non certifica speaker, cuffie/Bluetooth, background/lock-screen, interruzioni, latenza, batteria o qualita.

## D-022 - Preview Android standalone e link condivisibile

Data: 11 agosto 2026
Stato: build e smoke autonomo completati; telefono reale aperto

[F] Su autorizzazione esplicita e stata eseguita una sola build EAS `preview-android`, senza development client, retry, iOS o submit. La build `c3a39414-d156-4373-810a-0011296b51f8` e terminata `FINISHED` alle `2026-08-11T19:56:53.613Z`: Expo SDK 57.0.0, app 1.0.0 (1), fingerprint `92f6d62d3eb36db3d9eef3db223d6552c86af6f6`. La coda Free e durata circa 87 minuti e la compilazione circa 28 minuti.

[F] L'APK misura 289.861.086 byte e ha SHA-256 `47a6603108f6aee3464f6a63ae00f0b0fdb287d375a391d1a9210043e6b0a2a6`. `unzip -t` e verde; contiene 1.328 entry, `assets/index.android.bundle` da 3.216.244 byte, quattro DEX e 27 librerie per ciascuna ABI `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`. I tre WAV incorporati hanno esattamente gli SHA-256 del Test Pack. Nessun placeholder, traversal, path locale, filename credenziale o pattern segreto mirato e stato rilevato.

[F] Dopo installazione con dati app puliti su emulatore API 34, Metro e porta 8081 sono rimasti spenti. La preview ha mostrato Home, player `READY WHEN YOU ARE`, `RITUAL IN PROGRESS`, timer 28:55 e Pause; AAudio ha completato `requestStart`. App, emulatore e ADB sono stati spenti. APK e screenshot sono in `dist/eas/`, ignorati da Git; lo screenshot ha SHA-256 `3b1852e346ce7cfbc9121b925e03f239959bf4e4bd441f2384fae6f4d8948b7a`.

[F] Il piano resta Free: Android `2/15`, iOS `0/15`, totale `2/30`, overage 0, nessun add-on e costo totale stimato 0 centesimi. Nessun commit, push, PR, pubblicazione store o spesa e stato eseguito in questo gate.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: installazione sul telefono dell'amico, glitch su hardware ARM, speaker/cuffie/Bluetooth, background/lock-screen, interruzioni, latenza, batteria, memoria e qualita. Questi punti richiedono lo smoke su telefono reale.

Evidenza primaria: [build EAS Android preview](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/c3a39414-d156-4373-810a-0011296b51f8).

## D-023 - M2 Quiet by Design e registro dei quattro rituali

Data: 12 agosto 2026
Stato: implementazione locale; visual gate aperto

[F] M2 separa contenuto editoriale e temi dal motore audio. I quattro rituali
sono `Moon Current`, `Quiet Tide`, `Cedar Light` e `Aquarian Sky`; soltanto il
primo ha `audioPresetId` e usa l'identificativo tecnico `deep-sleep-432`.

[F] Le tre card `IN PRODUCTION` sono disabilitate e non caricano il player. La
Home non usa onboarding o catalogo; il player non espone Hz nella vista
principale e mantiene mixer e dettagli tecnici facoltativi, separati e chiusi.

[F] AudioEngine, AudioSessionController, timer, fade, persistenza, `carrierHz` e
`beatHz` non sono stati modificati. `beatHz` è documentato come differenza tra i
due toni stereo, non come frequenza cerebrale. Nessun nuovo audio è stato
integrato.

[F] Quattro immagini originali `stylized-concept` sono state generate senza
reference image, ispezionate e normalizzate a JPEG 1080x1440 sotto 1,2 MB. Gli
hash sono registrati in `assets/images/rituals/manifest.json`. Il sistema usa
Newsreader e Manrope locali e rispetta Reduce Motion.

[U] Chiarezza entro cinque secondi e preferenza estetica restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al concept test. Retention, WTP
ed efficacia percepita richiedono invece prove di prodotto/mercato successive e
non sono misurate dal concept test M2.

## D-024 - Evidenza del precedente test Android reale

Data: 12 agosto 2026
Stato: confine di prova registrato

[F] L'utente ha dichiarato che il precedente APK è stato installato e avviato su
un telefono Android reale e che Play ha prodotto suono. Questa evidenza chiude
soltanto installazione, launch e Play del vecchio APK.

[U] Modello telefono, versione OS, Bluetooth, background, lock-screen,
interruzioni, latenza, batteria, sessione lunga, seam, bilanciamento e qualità
restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Il nuovo APK M2 richiederà un
nuovo smoke strutturato.

## D-025 - Gate EAS M2

Data: 12 agosto 2026
Stato: autorizzazione condizionata, non ancora eseguita

[F] Il piano autorizza una sola nuova EAS `preview-android`, ma soltanto dopo
gate locali verdi, screenshot runtime approvati dall'utente, quota Free
riverificata e assenza di costi. Nessuna build iOS, submission, pubblicazione,
push o PR è inclusa.

## D-026 - M3 Product Shell e confine Audio Test

Data: 15 agosto 2026
Stato: implementazione locale; visual gate aperto

[F] L'istruzione M3 sostituisce operativamente il percorso consumer M2 senza
trasformare il Test Pack in contenuto pubblicato. La navigazione primaria usa i
tab `RITUALS`, `YOGA` e `SOUNDSCAPES`; tutte le card consumer sono
`IN PRODUCTION`, disabilitate e prive di `audioPresetId` o asset audio.

[F] Yoga espone soltanto strutture future da 20/30/45/60 minuti. Soundscapes
predispone opere autonome, `Elemental Worlds`, field recording,
`Cosmic / Zen ambient` ed `Esoteric Series`. Queste entità sono famiglie
editoriali e formati pianificati, non sessioni o registrazioni disponibili.

[F] `Moon Current`, `deep-sleep-432`, i tre WAV ATP01, binaural, brown noise e
mixer multilayer appartengono esclusivamente a `AUDIO TEST / TEST ONLY`, fuori
dai tab consumer e raggiungibile da Settings. Il motore, timer, fade,
persistenza e regressioni audio restano preservati.

[F] M3 non autorizza EAS, commit, push, PR, pubblicazione, backend, login,
billing, analytics o nuovo audio. La task si arresta agli screenshot runtime e
alla richiesta di approvazione umana.

## D-027 - Identità cosmica e differenziazione da Anima

Data: 15 agosto 2026
Stato: direzione vincolante accettata

[F] La differenziazione da Anima riguarda esclusivamente linguaggio e gerarchie
di interfaccia; non richiede l'abbandono dell'immaginario cosmico o new age.
M3 combina, in modo direzionale, circa 60% impressionismo/pastello meditativo e
40% cosmic new age raffinato.

[F] Sono parte dell'identità: cieli pittorici, campi stellari rarefatti,
nebulose ad acquerello, luce lunare, aurora, polvere d'oro discreta, blu
minerale, lavanda, rosa polvere e giada. `Aquarian Sky`, Cosmic/Zen Ambient,
Esoteric Series ed Elemental Worlds restano famiglie editoriali future.

[F] Restano vietate imitazioni riconoscibili di sfere o pianeti neri luminosi,
waveform/neuro-grafiche protagoniste, gerarchie frequency-first, mandala,
chakra, Buddha e torii. Il cosmo è ammesso come tema originale, mai come
supporto a claim medici, scientifici o pseudoscientifici.

## D-028 - Functionality e time-to-sound prima del catalogo

Data: 15 agosto 2026
Stato: direzione vincolante implementata localmente

[F] Functionality and time-to-sound first; evocative naming is secondary
metadata. La Home M3 mette in ordine Yoga, Massage, Relax, Meditation, Sleep e
Focus e mostra prima la funzione, poi la CTA, quindi durata/formato e solo dopo
il titolo evocativo futuro.

[F] Il caso guida Yoga espone `Start your yoga session` in apertura e prepara
formati 20/30/45/60 minuti. Le altre CTA sono `Set the room for massage`,
`Relax now`, `Begin meditation`, `Prepare for sleep` e `Focus`.

[F] In M3 tutte le sei azioni restano `IN PRODUCTION`, disabilitate e prive di
preset, asset audio e route player. L'architettura predispone un futuro avvio in
uno o due tap senza promettere contenuto oggi inesistente. Cosmic, Aquarian ed
Elemental restano naming e famiglie editoriali successive alla funzione.

## D-029 - Sei artwork outcome originali M3

Data: 15 agosto 2026
Stato: asset finali presenti; provenance e hash verificati

[F] Yoga, Massage, Relax, Meditation, Sleep e Focus hanno ciascuno un artwork
quadrato originale creato espressamente per App Relax con OpenAI image
generation built-in. Cinque asset restano text-only; Yoga v2 deriva da un unico
edit del precedente sorgente Yoga originale del progetto, senza reference
esterne. I PNG sorgente 1254×1254 sono stati convertiti in JPEG 720×720 qualità 80. File, byte e SHA-256 sono registrati in
`docs/M3_OUTCOME_ARTWORK_PROVENANCE.md`.

[F] La direzione comune è contemporary minimal Japanese impressionism:
pigmento minerale nihonga, sumi libero, gouache asciutta, washi tattile,
asimmetria e `ma`, combinati con refined cosmic new age dove coerente con la
funzione. La differenziazione da Anima resta limitata al linguaggio e alla
gerarchia dell'interfaccia; non elimina l'immaginario cosmico.

[F] Restano vietati torii, pagode, kanji, mandala, chakra, Buddha,
sfere/pianeti neri luminosi, neon, waveform, neuro-grafiche, gerarchie
frequency-first e claim medici, terapeutici, scientifici o pseudoscientifici.
Functionality e time-to-sound restano primari: immagine e naming non precedono
funzione, CTA o durata/formato e non sbloccano audio/player consumer.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: esclusività legale,
registrabilità e assenza di somiglianze sostanziali fino a una revisione IP/store
dedicata. Il fatto verificato è il processo documentato di generazione interna,
incluso l'edit Yoga v2 basato esclusivamente sul precedente sorgente originale
del progetto; non è una certificazione legale automatica.

## D-030 - Consumer paper shell e rifiuto del template wellness

Data: 15 agosto 2026
Stato: direzione visiva approvata; leggibilità raffinata in D-031

[F] L'utente ha approvato i sei artwork ma ha respinto il linguaggio UI
precedente perché card arrotondate, pillole, blob e barra scura rendevano la
shell riconoscibile come grafica generica. Questi primitivi non appartengono più
alla direzione consumer.

[F] La nuova shell `consumer-paper` usa carta washi calda, inchiostro ad alto
contrasto, composizioni asimmetriche, immagini editoriali, hairline e molto
`ma`. Le sezioni sono aperte: nessuna card-gabbia, pillola di stato o blob
decorativo. `IN PRODUCTION` resta una nota tipografica, non un bottone.

[F] `technical-dark` resta separata per Audio Test e player: il ridisegno non
trasforma ATP01 o il mixer in contenuto consumer. Funzione, CTA e formato
continuano a precedere artwork e naming evocativo.

[F] Il primo screenshot Android 1080×2400 del nuovo layout è stato approvato
dall'utente con `Design ok`. Nessuna EAS, commit, push o pubblicazione è stata
eseguita.

## D-031 - Leggibilità della microtipografia consumer

Data: 15 agosto 2026
Stato: implementata e verificata su Android Emulator

[F] Dopo l'approvazione della direzione visiva, l'utente ha richiesto scritte
piccole leggermente più intelligibili. La gerarchia e la composizione restano
invariate: micro-label, kicker, caption, note, formati e navigazione aumentano
di circa 1 px, con tracking ridotto e interlinea più comoda.

[F] Nessun testo della shell `consumer-paper` resta sotto 11 px. Gli stati
pressed di header, tab e Settings non riducono più l'opacità del testo: usano
un fondo carta più profondo e una traslazione di 1 px, mantenendo il contrasto.

[F] Prettier, lint, TypeScript e 15 suite / 59 test sono verdi. Lo screenshot
Android aggiornato è stato acquisito senza overlay; Audio Test, motore e asset
audio non sono stati modificati. Emulator, Metro e ADB sono stati spenti.

## D-032 - Promessa guida della Home

Data: 15 agosto 2026
Stato: implementata come copy editoriale provvisoria

[F] La Home usa `Choose your moment. Press start. Leave the phone behind.` come
promessa guida del flusso futuro: scegliere il bisogno, avviare rapidamente e
lasciare che il telefono torni in secondo piano.

[F] Non è una tagline commerciale finale né un claim legalmente validato. Per
non promettere funzionalità inesistenti in M3, una riga distinta dichiara subito
che le sessioni consumer sono ancora in produzione e senza audio disponibile.

## D-033 - Direzione visiva Yoga sole-luna

Data: 15 agosto 2026
Stato: approvato dall'utente

[F] L'artwork Yoga conserva campo avorio, palette pastello e materia washi ma
reinterpreta il gesto botanico come susuki stilizzato. Una grande luna avorio,
incompleta e decentrata, è bilanciata da una lavatura solare pesca/zafferano
minima. La simbologia resta implicita, senza testo o tecnicismi.

[F] L'asset deriva da una sola chiamata built-in di edit del precedente sorgente
Yoga originale del progetto. Il JPEG finale resta `yoga.jpg`, 720×720, 99.211
byte, SHA-256
`3c252aca78b72c510337b980d4cfda21352ec69229b04e7c780610aa99ffdb2f`;
gli altri cinque outcome, UI, navigazione e audio non cambiano.

[F] Sono assenti luna/pianeta nero, sequenze di fasi, astrologia, zodiaco, carte
celesti, Om, loto-logo, mandala, chakra, Buddha, torii, pagode, kanji, persone e
pose yoga.

[F] Evidenza runtime: `dist/m3-screenshots/02-yoga-consumer-paper.png`,
1080×2400, 583.172 byte, SHA-256
`45eebbc619a71c218476445e69dc7bca02890e69e2913b80a030e577feda6495`.

[F] Il 15 agosto 2026 l'utente ha approvato Yoga v2 rispondendo `ok` alla
richiesta esplicita di giudizio sullo screenshot. Nessun altro intervento
visivo, build o rilascio è implicato da questa approvazione.

## D-034 - Home a sei box funzionali equivalenti

Data: 15 agosto 2026
Stato: implementata e approvata dall'utente

[F] L'utente ha rilevato che la Home full-width faceva apparire Yoga come il
contenuto dominante e che lo screenshot precedente non mostrava i nuovi
artwork. Ha confermato che la struttura a box era valida: il problema erano il
linguaggio visivo precedente e i nomi privi di funzione esplicita.

[F] La Home usa ora una griglia 2×3 con sei box dello stesso peso per Yoga,
Massage, Relax, Meditation, Sleep e Focus. Ogni box mostra il proprio artwork
finale e rispetta la gerarchia funzione → CTA → formato → titolo futuro. Nessun
box usa una variante hero; `Cedar Ascent`, `Quiet Tide`, `Soft Horizon`,
`Aquarian Sky`, `Night Garden` e `Cedar Light` restano metadati secondari.

[F] Tutti i box restano disabilitati e marcati `IN PRODUCTION`; non sono stati
aggiunti preset, audio o route player. La schermata Yoga separata, il motore e
gli altri cinque outcome non sono stati modificati.

[F] L'export web locale renderizza i sei controlli disabilitati e i sei artwork.
Le prove visive 390×844 sono
`dist/m3-screenshots/01-home-grid-painterly-background-approved-candidate.jpg`
e `dist/m3-screenshots/01-home-grid-painterly-background-cards-detail.jpg`,
ottenute senza Android Emulator. Non sostituiscono il futuro screenshot runtime
mobile.

## D-035 - Fondale pittorico Home-only

Data: 15 agosto 2026
Stato: integrato e approvato dall'utente

[F] Su richiesta dell'utente la Home non usa più soltanto il gradiente carta:
un fondale originale text-only introduce washi avorio, pigmenti pastello
minerali, una luce lunare parziale, acqua/nebbia e vegetazione rada in uno stile
di impressionismo minimale giapponese contemporaneo.

[F] L'asset `assets/images/backgrounds/rituals-home-v1.jpg` è applicato tramite
una prop opzionale di `EditorialScreen`, usata soltanto dalla route Home. Yoga,
Soundscapes, Settings, Audio Test, navigazione e motore restano invariati.

[F] Una velatura carta graduata mantiene leggibile la testata; i sei box hanno
fondo carta al 90% e la nota finale al 92%. Il fondale è decorativo,
`accessible=false`, non intercetta azioni e non altera l'ordine TalkBack.

[F] Dimensioni, byte, SHA-256, prompt e confine di provenienza sono registrati
in `docs/M3_HOME_BACKGROUND_PROVENANCE.md`; il validatore richiede esattamente
un JPEG di sfondo registrato. Due screenshot web 390×844, uno iniziale e uno
scrollato sui box, documentano la resa senza Android Emulator. L'approvazione
estetica è stata ricevuta dall'utente con `bravo` il 15 agosto 2026.

## D-036 - Chiusura visual gate e autorizzazione del commit locale M3

Data: 15 agosto 2026
Stato: autorizzato dall'utente

[F] Dopo avere approvato la Home con il fondale pittorico, l'utente ha richiesto
esplicitamente `commit poi screenshot home page`. Questa istruzione autorizza
un solo commit locale della milestone M3 e un nuovo screenshot Home successivo
al commit.

[F] L'autorizzazione non comprende push, pull request, EAS, build cloud,
pubblicazione o deploy. Queste azioni restano gate distinti e richiedono una
nuova istruzione esplicita.
