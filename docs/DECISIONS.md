# Decision log

## D-105 — correggere la review privata dopo il test negativo sul telefono

14 settembre 2026. Robert segnala silenzio, controlli sviluppatore assenti
e mostra l'errore di registrazione service worker; autorizza Play/timeline
nel browser integrato di Codex. Continua soltanto la correzione della PWA
owner-only, senza nuova APK, upload audio o commit/push canonico.

[F] Private update online-first: rimuovere soltanto una registrazione root
esistente dello stesso origin, tollerare la rimozione concorrente, aprire Home.
Mai registrare/aggiornare un service worker su questo hostname privato e mai
cancellare audio salvati, cache contenuti o impostazioni per risolvere l'update.

[F] Supera la precedente scelta D-074 di pannello sempre chiuso soltanto nella
PWA di review: apertura predefinita sia single-track sia adattiva/natura;
`review=0` resta una scelta esplicita. Nessun controllo tecnico viene aggiunto
al consumer nativo. Catalogo, musica e livelli rimangono invariati.

[I] Per iOS si richiede la categoria opzionale `playback` dentro il gesto Play,
prima del contesto audio. WebKit documenta il rapporto fra categoria ambient
e silenzioso. L'ipotesi spiega un possibile caso, non identifica con certezza
il silenzio riferito dall'utente. Nessuna API microfono o suono fittizio.

[F] PLAYER-REVIEW.23 / Sites34 pubblicata; sorgente isolato
`9f736d35e00ed31e722b8ab0f9bf997bf55b1e67`. 667 test app, 17 hosting e
184 risorse online verificate. Accesso owner-only ed environment revision6
preservati. Prove complete: `PWA_PRIVATE_D105_FIX.md`.

[U] Ascolto, ringer mode, loop/crossfade e latenza su iPhone della nuova
versione: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`, richiedono nuova prova.

## D-104 — aggiornare soltanto la PWA privata

14 settembre 2026. Mandato: «aggiornare la PWA privata, devo provarla sul telefono».
Supera il limite D-103 sulla PWA soltanto per questa pubblicazione del sito
già esistente; nessuna nuova build APK, audio remoto, modifica di accesso o
commit/push della repository canonica.

[F] Export corrente PLAYER-REVIEW.22: mantiene consumer-paper, Hatha
30/45/60/90, ambiente Rain/Ocean e pannello review/loop individuali. Pubblica
i cambi reader/decoder già verificati D-091/D-093, non nuove funzioni.
I 45 FLAC online restano invariati; Field Ambience/Night Birds sono local-only.
Gli 8 Hatha restano listening-pending nella review owner-only, non approvati.

[F] Sito versione 33 pubblicato con successo; source commit isolato
`38a7676f91eb75c098596d84f5d4bd0d0af95fbf`. 653 test app, 10 decoder e 17
hosting PASS; 79 HTML e 105 asset della pubblicazione corrispondono all'export.
Policy privata revision 1 e environment revision 6 invariati. Nessun nuovo
servizio, risorsa a pagamento, upload audio o consumo di build APK.

[U] Il token Sites senza identità permette il controllo dell'interfaccia,
non sostituisce l'account autenticato richiesto dal worker audio: il catalogo
risponde 401. Protezione preservata; nessuna falsa prova di playback remoto.
Ascolto e latenza sul telefono rimangono gate umano. `PWA_PRIVATE_D104.md`.

## D-103 — una nuova APK autorizzata solo a costo zero

14 settembre 2026. Mandato: «autorizzo una nuova build APK, ma solo a costo
zero». Supera il gate di autorizzazione D-102 per una sola build Android
consumer interna, non per retry, iOS, PWA, commit/push, store o costi.

[F] Versione locale 1.0.3 / versionCode 4. Includere il fix D-102 già provato
con il development client; nessun ulteriore cambiamento al motore o agli
audio. Firma e progetto EAS esistenti, catalogo esterno importabile invariato.

[F] Preflight 653/653, Doctor 20/20, archivio e kit 47/47 PASS. Prima
dell'invio: Free Android 2/15, 13 residue, overage e totale stimato zero.
Inviato un solo job alle 00:08:47 UTC:
`11e48eab-81b1-4134-8077-244e173512ab`. Nessun cambio della firma.

[F] Job FINISHED alle 00:31:08 UTC; costo finale 0 centesimi, Free Android
3/15 usate e 12 residue. APK 1.0.3/4 scaricata e installata in aggiornamento;
47/47 audio conservati. Identità e integrità verificate. Dettagli e hash:
`ANDROID_APK_D103_PREFLIGHT.md`. Nessun ulteriore job avviato.

[F] L'audit stretto trova soltanto il marker tecnico legacy Audio Test,
già presente/documentato in 1.0.2 e separato dal consumer. Il relativo FAIL
non viene cancellato: addendum distingue inclusione nel bundle da esposizione
in Home/Settings. Workbench e PWA review sono esclusi.

[F] Nuova istruzione dell'utente: selezione dinamica degli strumenti/skill
in base al compito, non uso esclusivo/obbligatorio di Expo. Registrata in
AGENTS.md; Expo deployment/dev-client applicate dove pertinenti, CLI Android
per i controlli nativi. Nessuna nuova integrazione o costo implicito.

[F] APK esatta senza Metro: Hatha90+Ocean supera avvio, pausa/ripresa,
volumi/mute separati e prima giunzione (Playing81:24, 516s). Segnale musicale
ancora presente con ambiente muto. Rain→Stop→Ocean→Stop riusciti.

[U] L'ascolto umano, loop/crossfade inudibili e long-run su telefono non
sono dedotti da questi controlli. È un'APK interna per prova, non release store.

## D-102 — correggere Ocean waves senza consumare altre build

14 settembre 2026. Stato: correzione locale e regressioni verdi; sul client
nativo passano avvio, prima giunzione e cambio Rain → Stop → Ocean.
Mandato esplicito: «Correggi Ocean waves tutto ciò che è
da correggere». Non autorizza una seconda build, pubblicazione o commit.

[F] Il development client riproduce il timeout della conferma posizione
con decoder Hatha02 già a4,936s e durata corretta. Non è un audio Ocean
mancante. Nuove prove RED→GREEN coprono stallo JS, Stop, overshoot e recovery.

[F] Barriera di allocazione prima dell'avvio dei decoder; una sola recovery
di seek condivisa anche nel caso near-EOF. Tolleranza100ms e deadline5s
invariate, niente retry illimitati o accettazione di posizioni errate.
Se il decoder non conferma la posizione, l'errore rimane esplicito.

[F] Nessun master, byte del kit, catalogo, guadagno o crossfade modificato.
653 test generali e257 audio passano. Prova Ocean oltre la fine della prima
giunzione (493s), pausa/ripresa, mute ambiente e Stop osservati senza errori
decoder. Diagnostica rimossa, caso Rain → Stop → Ocean ripetuto sul sorgente
pulito. Emulatore/Metro/ADB spenti. Rapporto: `ANDROID_OCEAN_D102_FIX.md`.

[U] D-101 resta prova dell'APK precedente non accettata, non viene riscritta
come PASS. Nuovo artefatto standalone e telefono reale richiedono i gate
successivi. Nessun job EAS, costo o pubblicazione da questa correzione.

## D-101 — nuova autorizzazione per una APK Android interna

[F] Esecuzione: preflight647/647 e archivio177 file verificati; kit47/47
SHA-256 corretto. Una sola build1.0.2/3,
`71e00fbe-bc05-4a61-ab70-13a2dc7d75a3`, FINISHED il13settembre21:50:55UTC.
APK scaricata, audit statico PASS, firma accettata nell'installazione in
aggiornamento. Quota finale Free2/15 Android utilizzate,13 residue, costo0.
Rapporto e hash: `ANDROID_APK_D101_PREFLIGHT.md`.

Data: 13 settembre 2026; esito aggiornato il14 settembre2026
Stato: APK compilata; gate di consegna FAIL, Ocean waves non parte

[F] L'istruzione diretta «autorizzo APK» supera la sospensione Android
D-098/D-100, non autorizza pubblicazione PWA, iOS, commit, push, store o costi.
Procedere con una sola APK consumer aggiornata dopo verifica della correzione
Hatha e dei rischi nativi già registrati. Nessun retry cloud automatico.

[F] Check live EAS: piano Free, Android 1/15, 14 residue, periodo
1 settembre–1 ottobre 2026, costo stimato e overage zero. Controllo
ripetuto immediatamente prima dell'invio. Catalogo invariato: 47 registrazioni
nel kit separato già approvato, non incorporate nell'archivio EAS.

[U] Test pre-build via development client esistente e prova successiva
dell'APK sono gate distinti. Nessuna promessa di qualità sonora o comportamento
su telefono viene ricavata dal solo emulatore. Non cambiare credenziali/firma.

[F] APK1.0.2/3 senza Metro: Hatha90+Rain supera avvio, pausa/ripresa,
volumi/mute e Stop; segnale presente oltre l'istante della prima giunzione.
Ocean waves fallisce invece l'avvio dopo Stop, al Retry loading e anche
da processo riavviato. Non si promuove il candidato come completamente
funzionante sulla base dei647 test o del solo caso Rain riuscito.

[I] L'audit read-only individua una possibile finestra persa: un decoder
già partito può avanzare oltre100ms mentre JS crea quello successivo;
il controllo posizione può quindi attendere fino al timeout5000ms.
Il tempo osservato è compatibile, ma il log release non espone la causa:
NON DETERMINATO — EVIDENZA INSUFFICIENTE. Nessuna patch speculativa applicata.

[F] Arresto dopo ripetizione circoscritta e raccolta prove. Nessun nuovo job
EAS, commit, upload audio o modifica PWA. Emulatore/Metro/ADB spenti, dati
privati importati conservati. Una nuova build richiede approvazione separata,
dopo diagnosi e regressione locale, non un retry alla cieca.

## D-100 — verificare la PWA corrente senza riprendere Android

Data: 13 settembre 2026
Stato: candidato locale verificato, nessuna pubblicazione

[F] D-099 provava il vecchio export D-093, non il sorgente dopo le patch
SDK/native. Preparato un nuovo export soltanto web, con due worker e nessun
emulatore, EAS o upload. I controlli del pacchetto, del precache HTTP e del
player nel browser Codex sono passati; evidenze in `PWA_CURRENT_SOURCE_D100.md`.

[F] Nessun nuovo fix al motore: l'audit indipendente su copia ha confermato
che le factory PWA usano il driver web, mentre l'import comune del wrapper
nativo è TypeScript puro e protetto dal controllo piattaforma. Il bundle
non contiene i marcatori dello storage Android verificati. La segnalazione
precedente sulla cancellazione non giustifica una modifica ridondante.

[U] Il divieto di nuove build Android rimane attivo. Questo controllo locale
non aggiorna il sito privato, non promuove le due texture local-only e non
certifica ascolto, latenza acustica o comportamento prolungato su telefono.
Nessun commit/push. Pubblicazione e prova umana restano gate separati.

## D-099 — correggere il launcher PWA senza consumare altre build

Data:13 settembre2026
Stato: correzione locale verificata; nessuna pubblicazione o build nuova

[F] La richiesta «Niente build per il momento, risparmiamo» prevale sul goal
generale. Verifiche/correzioni PWA soltanto locali, nessuna azione EAS.
Riprodotti23 audio404 nel launcher legacy e un404 precache SHA-256.
Il primo difetto nascondeva le musiche FLAC; il secondo impediva l'attivazione
della shell nuova. Entrambi corretti con regressioni RED→GREEN.

[F] Nuovo helper legge registri esistenti, controlla identità concordanti,
usa soltanto una cartella derivata esplicita senza copie. Il server resta
loopback e fail-closed su symlink, file cambiati, path, host e URL precache
non servibili. Vecchi URL WAV conservati per compatibilità, non nuovi master.

[F] Controverifica dell'audit PWA su copia isolata: la mancata cancellazione
segnalata nel solo AdaptiveWebPlayback non dimostra un difetto del percorso
reale. WebAudioDriver cancella già su Stop/Seek/Resume e il controller abortisce
la preparazione prima dei comandi. Nessuna modifica ridondante al motore.

[F] Test e prove runtime in `PWA_LOCAL_PREVIEW_D099.md`. Il candidatoD-093
resta distinto dal sorgente aggiornato e dalla .21 online. Nessun byte audio,
file Strategia, credential, commit/push, emulatore o cloud modificato/avviato.
La qualità percepita del loop resta un gate umano; non è dedotta da Playing.

## D-098 — controllo indipendente e sospensione Android a favore della PWA

Data:13 settembre2026
Stato: nessuna nuova build; priorità PWA su richiesta di Robert

[F] Dopo la richiesta di verificare tre volte prima della consegna, avviati
audit indipendenti su una copia isolata in `/tmp/app-relax-d098-audit.GZCJBx`,
senza scritture parallele nel checkout. La vera ParamControlQueue C++ rifiuta
l'overlap precedente di1ULP e accetta gli intervalli corretti; prove clang
ottimizzate e ASan/UBSan PASS. Nessuna installazione/toolchain Android nuova.
Questa prova è circoscritta alla coda C++/aritmetica, non al bridge o al decoder.

[F] Installato sull'AVD il development client già esistente con la stessa
firma, dati conservati, per tentare il test via Metro senza EAS. Home corrente
avviata; collegamento diagnostico non concluso e nessun esito Hatha col fix.
Robert ha poi chiesto di tornare alla PWA: prova interrotta ordinatamente,
release precedente ripristinata con `install -r Success`, nessuna rimozione
del catalogo, Metro/emulatore spenti. Nessuna modifica ai sorgenti dell'app
in D-098; solo evidenze ignorate e checkpoint documentale.

[F] Verifica live `account:usage`: Free, Android1/15, iOS0/15, totale1/30,
overage0, costo stimato totale0 centesimi; periodo1 settembre–1 ottobre2026.
La build completata consuma una unità anche se il nostro gate funzionale
la respinge. La PWA non richiede EAS Build. Nessuna seconda build, costo,
commit/push o pubblicazione PWA effettuati.

[U] La prima APK resta bloccata dalle sessioni Hatha. L'audit secondario ha
segnalato possibili difetti di teardown a contesto sospeso, falsa conferma di
seek negli ultimi100ms e overflow della coda seek nativa. Non sono stati
riprodotti né corretti dopo lo stop richiesto: registrarli per il prossimo
gate Android, senza dedurre che causino l'errore Hatha osservato.

## D-097 - Catalogo offline reale e APK consumer Android autorizzati

Data: 13 settembre 2026
Stato: import completo; prima APK respinta dal gate sessioni, correzione locale

[F] Robert conferma: «L'importante è che hai comunque caricato già tutti gli
audio, consegnami una APK completamente funzionante». Si procede con la
proposta D-095: APK più cartella audio separata, importata una volta nello
spazio privato Android. Non occorrono account o servizi nuovi. Questa risposta
chiude la scelta di delivery rimasta aperta in D-096.

[F] Il kit comprende i45 FLAC della review e le due texture naturali locali,
senza duplicare i riferimenti consumer ai file ATP01 già incorporati. Nessun
audio respinto viene reinserito. Field Ambience e Night Birds restano manuali,
senza attribuire loro famiglie o attività non approvate. Gli otto Hatha sono
ammessi nell'APK interno di prova, senza falsificare l'approvazione delle
transizioni. Guided resta privo di registrazioni e indisponibile.

[F] Import da cartella scelta dall'utente, SHA-256 a blocchi, pubblicazione
atomica nello storage privato, attestazione e controlli di identità prima del
playback. File mancanti/corrotti non risultano disponibili. L'import può
riprendere conservando soltanto file già verificati; niente download remoto
inventato e niente rilettura di GiB a ogni Play.

[F] Gate finali: 643/643 test in 89 suite (`dist/d097-prebuild-jest.json`),
lint/typecheck/peer check, asset/audio/config/boundary PASS; Expo Doctor
20/20 e Expo install check PASS. Security policy PASS WITH ACCEPTED RESIDUALS
per i due advisory image-size già registrati, nessuna nuova eccezione.
Export finali `dist/d097-final-android`: 53 file / 163.940.172 byte;
`dist/d097-final-ios`: 49 file / 162.783.374 byte. Entrambi conservano solo
i tre WAV ATP01 (155.520.132 byte), senza il catalogo pesante.

[F] Archivio `dist/d097-final-eas-archive`: 177 file / 160.156.690 byte,
confrontato byte per byte con i sorgenti finali. SHA-256 inventario:
`fbe20f70ea6f99ccfd3b8da6c66e29ae1957b51e01baab73d44d64c57c278c07`.
Kit audio separato: 47 file / 2.434.210.564 byte, manifest SHA-256
`70c026c7e8ad8c8bae6e7711382420a43df9bbdae55e0a6e035f2e2055bdfcac`.
HEAD invariato `6549f0117f2d7623fe20816cbf2c687385af6b8d`, index vuoto.

[F] Preflight ripetuto prima dell'upload: piano Free robert-fulton-studio,
Android 0/15, overage e costo stimato zero. Una sola build avviata con
profilo preview-android, firma esistente e `--freeze-credentials`, nessuna
variabile remota preview aggiunta. Job:
`dde27cac-c2b3-476a-b0af-92cc6b8e214e`, versione 1.0.1 / versionCode 2.
[EAS](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/dde27cac-c2b3-476a-b0af-92cc6b8e214e).

[F] Build FINISHED alle 18:27:01 UTC, Gradle SUCCESS in 28m23s. Artifact
293.082.242 byte, SHA-256
`bdc6c20019ee9a04486d4ec25d2920384682a9f2fdf539ca826dcadadffc2ea3`.
Audit ZIP integrale e identità PASS; versione release, quattro ABI, servizio
RNAA mediaPlayback e permessi corretti, 3 WAV ATP01 / 155.520.132 byte,
zero FLAC nel pacchetto. Firma v2: certificato SHA-256
`999dde4a534448fffd5f94fd92412471c380d6e83dc74ff8d03b22026a3cf2e0`.
Installazione Android `-r Success` senza cancellare dati conferma accettazione
della firma da Package Manager; non è una verifica separata con apksigner.

[F] Residuo d'isolamento rilevato dall'audit indipendente: la route legacy
ATP01 `/audio-test` resta nel bundle, senza link nella navigazione consumer
ma raggiungibile via deep link. Workbench/PWA sono esclusi; il vecchio
validatore verificava questi ultimi, non l'assenza di ogni route tecnica.
`single-loop-review` è un seed della factory condivisa, non un player QA.
Restano anche i permessi legacy overlay/storage da riesaminare per lo store.

[F] Primo avvio COLD 1.247 ms sull'AVD, non una misura del primo suono.
Import SAF completo entro19:19:54 UTC: 47/47 in Settings e Home consumer
aperta. Dopo cancellazione e riavvio erano stati conservati9 file/0,59GB;
il retry ha riusato quelle verifiche. Nessun errore di integrità. Il primo
import dura decine di minuti sul vecchio AVD, non viene dichiarato rapido.
Quota post-job: Free Android1/15, overage zero, costo stimato zero.

[F] Runtime singole opere: Night Birds (WAV) e Astral Thread (FLAC) passano
al playback effettivo, AudioFlinger mostra segnale non nullo e una traccia
attiva stereo48kHz diretta allo speaker. Play/Pausa/ripresa/Stop sul WAV,
servizio media presente durante playback e assente dopo Stop. Audio host
disabilitato: nessuna approvazione sonora o certificazione gapless.

[F] Gate FAIL: Hatha90 con Rain e con ambiente Off fallisce sull'APK1.0.1/2
con errore consumer di preparazione. Non viene consegnata come funzionante.
Il test precedente usava un AudioParam mock senza esclusione delle curve.
Applicando la regola reale di RNAA0.13.2 ParamControlQueue, due casi falliscono
con `1453.9571458333332 < 1453.9571458333335`: overlap di arrotondamento.
Correzione locale: durata/inizio assoluti concatenati al termine effettivo
della curva precedente, senza tolleranza che aggiri il rifiuto nativo.
Il piano e i byte audio non cambiano. Aggiunta regressione a sei clock
non interi, 22 test nativi e 644/644 complessivi PASS; report
`dist/d097-post-runtime-jest.json`. L'APK già compilata non contiene il fix.

[U] Il runtime non espone il messaggio tecnico originale: l'overlap è un
difetto dimostrato localmente, ma la sua causalità rispetto all'errore Hatha
rimane NON DETERMINATO — EVIDENZA INSUFFICIENTE fino alla nuova build/prova.
Nessun secondo job, commit/push/store o pubblicazione PWA. Processi di test,
emulatore e ADB spenti; dati importati conservati per il prossimo test.
Telefono reale, qualità sonora, loop, latenza e background restano gate aperti.

## D-096 - Preflight EAS Free e chiusura dei residui tooling

Data: 13 settembre 2026
Stato: aggiornamento locale; nessuna build/upload

[F] La continuazione dell'obiettivo non è una risposta alla scelta di delivery
D-095. È possibile chiudere i prerequisiti indipendenti: account/quota in
lettura e aggiornamenti locali compatibili con il mandato APK.

[F] CLI21.7.1 già presente, senza login/installazioni: `whoami` conferma
robertfultonstudio owner dell'organizzazione `robert-fulton-studio`;
`account:usage robert-fulton-studio --json --non-interactive` riporta Free,
Android0 usate/15 incluse, overage0, stima totale0 centesimi. Periodo1
settembre–1 ottobre2026. Non prova una build effettuata o una quota futura.

[F] Preflight iniziale: Doctor19/20, dieci patch Expo fuori allineamento,
audit FAIL per due advisory Joi e js-yaml su due major. Aggiornati soltanto
patch SDK57 (Expo57.0.22, Router57.0.21 e moduli raccomandati), senza cambio
React/RN/audio API. Registro lockfile rigenerato e installato congelato con
Node22.23.1/pnpm11.16.0, `--ignore-scripts`. Nessuna modifica alla policy di
anzianità delle release, nessuna installazione globale o nativa.

[F] Override Joi corretto sull'intero intervallo `>=17.2.0 <17.13.6`, non
soltanto17.11.0: il primo tentativo lasciava17.13.4 in `@expo/config` ed è
stato respinto dall'audit. Versione finale17.13.6; js-yaml3.15.2 e4.3.2
mantengono separate le major. Nessuna allowlist di sicurezza aggiunta.
Fonti primarie: [Joi messaggi](https://github.com/advisories/GHSA-6w3j-5fw6-r9vr),
[Joi rename](https://github.com/advisories/GHSA-gg4h-3hg2-grpc),
[js-yaml merge](https://github.com/advisories/GHSA-2883-xcg3-v3hh).

[F] `allowBuilds.esbuild` conteneva il placeholder testuale «set this to true
or false»: impostato esplicitamente false, senza concedere nuovi script.
La libreria usa il binario optional dependency già distribuito: esbuild0.28.2
esegue la trasformazione TypeScript senza postinstall; PWA invariata online.
Il validatore di configurazione ora controlla il nuovo pin Expo esatto.

[F] Security policy PASS WITH ACCEPTED RESIDUALS per i soli due parser DoS
image-size1.2.1 già documentati e mitigati dall'asset gate. Il raw audit high
resta non verde per questi residui: non si dichiara assenza di vulnerabilità.
Expo install check PASS, Doctor20/20. Il bump Expo da solo non prova la
chiusura: sono state verificate le copie risolte nel lockfile e l'audit.

[F] Dopo installazione:624/624 test in85 suite, report
`dist/d096-jest.json`; lint/typecheck/peer check PASS. Validator config,
asset safety510 file,11 artwork, placeholder/ATP01/catalogo/Hatha/texture
locali e confini QA/PWA PASS. Prettier e git diff-check PASS. I comandi EAS
di questa verifica sono solo lettura e `build:inspect --stage archive`:
quest'ultimo copia localmente, non crea un job cloud e non effettua upload.

[F] Export con `public-mobile`, cache pulita e due worker massimi:

- `dist/d096-android`:53 file,163.840.278 byte;
- `dist/d096-ios`:49 file,162.683.439 byte;
- `dist/d096-eas-archive`:166 file,160.107.694 byte.

[F] Entrambi gli export conservano esattamente i tre WAV ATP01,
155.520.132 byte complessivi, hash verificati. Zero catalogo localhost
aggiunto; archivio senza metadata Git, path sorgente privati, credenziali
o superfici QA/PWA. Sono prove del perimetro attuale, non un APK completo
o una promessa di leggerezza dell'APK finale. Nessun audio è stato rimosso.

[F] Hash inventario SHA-256 (path relativo, dimensione e SHA file in ordine):
Android `5b5f66ae4a8cd39d2f7db853796ca7bab224489e2af5b66fe452d9ad665721f5`;
iOS `dfaa6ce3d58ed56937b8945b5692f5443127031b8ef916f19923ec7260324645`;
archivio `82d948e5ed9cd108ce6d843ca5ca39afccd8a3343c69b68f2ca4bcd24425d9db`.
HEAD rimasto `6549f0117f2d7623fe20816cbf2c687385af6b8d`, index vuoto;
93 modifiche tracciate e71 voci non tracciate complessive, inclusi gli
interventi ereditati. Sette file toccati in D-096: package, lockfile,
workspace pnpm, validator config, STATO, DECISIONS e A01_NATIVE_GATE.

[U] Factory/storage/UI Android e adattamento Hatha preview restano da
completare dopo la scelta di delivery. Nessun nuovo byte audio, APK, upload,
commit, push/store, modifica PWA pubblicata o prova sonora nativa.

## D-095 - Ponte catalogo Android e scelta di delivery prima dell'APK

Data: 13 settembre 2026
Stato: implementazione nativa parziale verificabile; build non avviata

[F] Nuovo ordine: completare catalogo/sessioni Android e poi avviare APK.
Autorizza il gate build Android, non costi, store, commit, PWA o nuove
infrastrutture. La build resta subordinata a integrazione, archivio sicuro
e verifica live di quota Free/costo zero.

[F] `ReactNativeAudioDriver` ora risolve anche opere non incorporate mediante
`NativeAudioSourceResolver`, controlla la lease e la libera a Stop, compresi
risultati tardivi o errati. Aggiunte invalidazione delle operazioni pendenti
e cancellazione degli avvii dopo Stop. Volume zero effettivamente silenzioso.
`AdaptiveNativePlayback` non crea decoder dopo uno Stop durante resume e
applica due bus con guadagni massimi 0,5/0,5, come il percorso Web. Nessuna
modifica dei file audio o del preset tecnico.

[F] Verifiche locali: 624 test/85 suite, inclusi30 nelle due suite native;
typecheck/lint/Prettier/diff-check PASS. Asset-safety510 file, configurazione,
confine QA/PWA e catalogo (inclusi Hatha e le due texture locali) PASS.
Nessun byte audio, dipendenza, staging o commit introdotto. Sei file toccati
in questo passo: i due driver nativi, i due test relativi, STATO e DECISIONS.
Non sono stati eseguiti nuovi export, Expo Doctor o audit dipendenze: il gate
completo di build verrà ripetuto dopo la scelta e l'integrazione dello storage.

[F] Il catalogo lossless corrente della PWA contiene 45 FLAC per
2.371.806.490 byte, di cui 750.323.352 negli otto Hatha; 8 file oltre100 MiB.
Non può entrare automaticamente in APK/EAS/Git. Il sito attuale è owner-only:
la sua accessibilità nel browser autenticato non prova accesso nativo senza
account/cookie. Non sono stati copiati cookie o inventati URL pubblici.

[I] Proposta a Robert: APK separato da un pacchetto audio da importare una
volta nello spazio privato Android, poi offline. Alternativa richiesta nella
domanda: download nell'app, che necessita di un canale di delivery realmente
autorizzato. Nessun adapter fittizio o factory abilitata prima della scelta.

[F] SDK locale al preflight iniziale: Expo57.0.20 raccomanda `expo-file-system~57.0.6`; la57.0.6 era già
transitiva, non ancora aggiunta come dipendenza diretta. La documentazione
SDK57 corrente riporta `~57.0.7`. Sono disponibili selezione file/directory,
copia nativa da content URI a document storage e letture a blocchi; SHA-256
richiede il nostro hasher incrementale, non MD5 o hash dei singoli blocchi.
Fonti: [Expo FileSystem57](https://docs.expo.dev/versions/v57.0.0/sdk/filesystem/),
[sorgente File57](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-file-system/src/File.ts).

[U] Rimangono da implementare storage concreto, import/download verificato,
collegamento factory/UI e comportamento del ciclo Hatha nel solo APK test,
senza falsificare l'approvazione musicale. Il test fisico chiude loop,
interruzioni, latenza, Bluetooth e background, non i test software.

## D-094 - APK consumer di prova dopo la chiusura corrente

Data: 13 settembre 2026
Stato: richiesta registrata e preflight locale; build non avviata

[F] L'utente ha a disposizione un telefono Android e richiede «Quando hai
finito mi prepari un APK di prova, versione consumer». Interpretazione:
prossimo deliverable installabile e autonomo, UI consumer-paper, nessuna
dipendenza da Metro/Mac e nessun pannello sviluppatore visibile. I controlli
di review richiesti restano nel percorso PWA separato.

[F] Il profilo `preview-android` genera APK internal senza development client.
Non basta a fornire la parità audio: `createAudioDriver.ts` costruisce il
driver senza resolver nativo; `loadAdaptiveSession` rifiuta questo stato e
`loadSingleTrack` accetta solo asset incorporati o generatori. Esiste uno
scheduler adattivo preparato con test software, ma non collegato al catalogo.
I limiti nativi di `A01_NATIVE_GATE.md` restano da verificare prima di abilitarlo.

[I] Ordine del gate APK:

1. Chiudere il lavoro audio corrente; mantenere separato l'eventuale rilascio PWA.
2. Collegare file verificati e storage reale al driver Android; risolvere i
   limiti nativi, incluso il margine di livello musica+natura, prima di abilitarli.
3. Verificare la superficie consumer e le funzioni realmente disponibili;
   non sostituire l'app completa con una shell o un wrapper PWA non richiesto.
4. Determinare peso e accesso agli audio, senza incorporare alla cieca il
   catalogo di GiB; nuove infrastrutture, accessi o spese richiedono decisione.
5. Prima di una build: preflight dell'archivio esatto, segreti/asset, toolchain
   e quota/costo live. Nessuna spesa senza consenso. Niente push/store/PR.
6. Ispezionare l'APK prodotto e consegnarlo con versione/hash e istruzioni
   essenziali; modello/Android del telefono saranno registrati nel test fisico.
7. Misurare sul dispositivo loop, primo suono, transizioni, Stop/Pausa/ripresa,
   background/lock-screen e risorse. Nessun test Web chiude questi gate.

[U] Quota/costo non interrogati ora, poiché la build è successiva al gate di
integrazione; non dichiarati gratuiti o disponibili. Nessun APK nuovo esiste
ancora. La richiesta APK non autorizza implicitamente la pubblicazione .22.

## D-093 - Prima finestra FLAC senza doppia inizializzazione

Data: 13 settembre 2026
Stato: codice locale verificato; candidato PLAYER-REVIEW.22 non pubblicato

[F] Il worker attendeva ready e chiamava subito reset: la libreria installata
0.2.11 inizializzava due volte libFLAC prima della prima finestra. Il test sul
worker minificato reale è passato da RED (2 invece di 1) a GREEN (1). Reset
obbligatorio fra tutte le finestre successive, anche dopo frame corrotti;
nessuna modifica dei campioni, cache, corsie, numero di worker o timeout.

[F] Dieci test del worker PASS, incluse richieste simultanee, oversized,
annullamento, protocollo e stato degli errori. Browser reale con worker nuovo
su pioggia/mare/Hatha: PCM identico a D-091, tre render di EOF e giunzione
finestre con errore massimo zero. Il primo avvio osservato resta variabile,
95–180 ms circa in locale: nessuna promessa di riduzione percentuale o iPhone.

[U] La pubblicazione privata di queste correzioni e il nuovo ascolto sul
telefono restano gate distinti. Field Ambience e Night Birds non sono stati
caricati online. Dettagli e perimetro in `PWA_REVIEW_LATENCY_CACHE.md`.

## D-092 - Night Birds, seconda texture naturale soltanto locale

Data: 13 settembre 2026
Stato: integrazione e runtime locali verificati, ascolto/delivery aperti

[F] Una sola copia PCM-identica del WAV Editing, 1.616.645 frame/33,680104 s,
9.699.972 B, titolo Night Birds / ID night-birds-b1. Riusato il catalogo D-090,
preservando Field Ambience; famiglia naturale non classificata, outcome null,
nessuna assegnazione Rain/Ocean/Hatha/Continuum. Titolo da filename, non prova
di specie/luogo/orario. Solo Settings → catalogo manuale → QA singolo.

[F] Play/Pausa/Stop e tre ritorni EOF→zero osservati in oltre101 s nel browser
locale. Nessun errore media/browser; non sono prova di ascolto o gaplessness.
Hash e validatori PASS; export consumer con soli tre WAV ATP01 precedenti.
Prove in `NIGHT_BIRDS_B1_INTEGRATION.md`. Nessun upload, commit o build nativa.

[U] Ascolto della cucitura e riconoscibilità della ripetizione ancora aperti.
Il nuovo asset non è nella PWA privata, che resta sui45 file della .21.

## D-091 - Pausa senza ricreare il decoder già inattivo

Data: 13 settembre 2026
Stato: correzione locale verificata, non pubblicata

[F] Conservato il reader solo se open/read sono conclusi e la URL resta uguale.
Operazioni pendenti, Stop, cambio sorgente ed errore mantengono teardown sicuro;
nessuna cache/deck aggiuntivo o modifica PCM/scheduling. RED→GREEN sul riuso;
test dei due decoder adattivi, annullamento e release.

[F] Browser con worker reale su Rain/Sea/Hatha: 3→1 aperture, stessi hash PCM,
giunzioni renderizzate con massimo errore0 rispetto al riferimento. Seek
successivi locali30–97 ms, non dati iPhone o promessa sul primo caricamento.
Dettagli/riproduzione/limiti in `PWA_REVIEW_LATENCY_CACHE.md`.

[U] La latenza globale online e i loop ascoltati su iPhone restano aperti.
Più lunga residenza del worker inattivo da valutare su device low-end.

## D-090 - Field Ambience, natura non classificata in review locale

Data: 13 settembre 2026
Stato: integrazione locale verificata; pubblicazione/ascolto non approvati

[F] Una sola nuova texture Editing, PCM24/48k/stereo,183 s e52.704.102 B.
Copia/hash/file/PCM identici; nessun nuovo editing o derivato. Metadata
`primaryOutcome:null` e famiglia manuale unclassified-nature, niente Rain/Ocean,
Hatha, musica o assegnazione automatica. Accesso QA singolo dal sottomenu
manuale Settings, nessun link tecnico nella root consumer o route PWA nuova.

[F] Jest612/85 suite, lint/typecheck, validatori e prova browser locale PASS;
EOF superato dal player non equivale ad assenza di click ascoltata. Sorgente,
master e vecchio catalogo invariati. Dettagli in `FIELD_RECORDING_01_INTEGRATION.md`.

[U] Classificazione ambientale, titolo finale, ascolto e iPhone da confermare.
Nessun upload/deploy del nuovo asset, commit, push o build nativa.

## D-089 - Misure del seek nel player sviluppatore

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.21 privata pubblicata; nessuna nuova modifica audio

[F] Aggiunte metriche effimere dietro il controller: tentativi HTTP/hit per
Range FLAC online, tempi open/read/decode per FLAC indicizzati. Esclusioni
Blob/indici/worker e WAV offline dichiarate; somme concorrenti non additive.
Nessuna telemetria, identificatore sorgente, cache o worker aggiuntivo.
Revisione read-only indipendente e test di risultati/errori/scope/snapshot.

[F] Sites32/env6 owner-only; 609 test e 229 audio PASS. Prova online
Hatha90+Rain: salto13:12 in3368ms, 0 HTTP audio, 4hit, decode4894ms sommati
fra due worker concorrenti. Il residuo è nella fase worker/decode, non nel
trasferimento delle finestre audio. Non isolati bootstrap/WASM/CPU interna.

[U] Non dichiarare quasi-zero o loop puliti da queste misure. Inventario dei
45 file separati e test EOF→zero invariati; serve ascolto iPhone. Dettagli in
`PWA_REVIEW_LATENCY_CACHE.md`; nessun commit canonico.

## D-088 - Range del seek coerente con PCM parziale e offline

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.20 privata pubblicata; latenza residua esplicita

[F] Il test RED riproduce lo scarto: con vecchio PCM 0–8, seek 5 richiedeva
8–16 anziché il range preparato 5–13. Il primo range freddo ora resta ancorato
al target; una riserva interamente PCM, anche su più finestre, resta riutilizzata.
Budget, frequenza, campioni e scheduler invariati.

[F] Le lease offline verificate non bloccano più la preparazione della corsia
online. Nessuna copia extra del Blob e annullamento rispettato. Settings della
controprova conferma Rain starter scaricato, compresa Sheltered Rain.

[F] 606 test PASS, audio 226; estensione EOF e store/resolver 24 test PASS.
Revisione indipendente read-only senza blocker loop=true; non generalizzare
al caso loop=false a EOF, preesistente e fuori dai player consumer in loop.
Il percorso store→resolver verifica le lease; il prefisso Blob non è una prova
generalizzabile per futuri resolver. Dettagli in `PWA_REVIEW_LATENCY_CACHE.md`.

[F] Sites 31/env6 owner-only. Browser online: primo salto con pioggia offline
280 ms; secondo con natura online 1006 ms; loop Wave and Ground 154 ms.
Zero nuovi byte audio e nessun commit app. [U] Non è latenza quasi-zero su
tutti i percorsi; ascolto iPhone e gate release separati restano aperti.

## D-087 - Punti QA preparati in pausa senza competere con il playback

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.19 privata pubblicata; latenza globale ancora aperta

[F] La latenza fredda D-084 resta aperta. Introdotta cache PWA effimera dei
soli byte compressi, 8 MiB totali, per UN prossimo punto della review in Paused.
Fine file richiede coda e testa; giunzioni usano le sorgenti effettive e gli
ingressi entro8s. Funzione range condivisa con il decoder, zero modifica PCM.

[F] Ammissione dopo la coda foreground, senza bloccarla durante il fetch.
Start/Resume/Stop/seek annullano; Playing non prepara; le risposte tardive
non possono diventare Ready. Header autenticati riusati, copia dei byte
su consumo, controlli Range/SHA/ETag mantenuti. Nessun nuovo decoder/audio.

[U] La riserva non rende istantaneo il primo trasferimento o un salto
arbitrario non preparato. Gate e prove in `PWA_REVIEW_LATENCY_CACHE.md`.
Nessun commit canonico, costo, cambio audience o build nativa.

[F] 601 test, 221 audio, controlli statici e artefatto PASS. Inventario 45 online;
loop singolo preparato 159 ms e ritorno EOF→zero in Playing. Controprova sessione
Hatha 90 + Rain: 3615 ms primo target non preparato, 2011 ms target seguente preparato.
Nessuna deduzione di latenza quasi-zero generale o approvazione sonora.
Sites 30/env6 owner-only, stessa audience; cache 8 MiB riguarda solo byte trattenuti,
non RAM totale. Stop e chiusura processi locali verificati.

## D-086 - Continuità UI dopo l'audit Work

Data: 13 settembre 2026
Stato: correzioni verificate localmente e nella PWA privata .18

[F] Audit Work ricevuto e letto integralmente: UI-01/UI-02 riprodotti su .17,
UI-03…08 e DOC-01 separati per prova. Ritorno alla stessa attività preserva
la selezione, nuova sessione esplicita; variazione timer prepara una candidata
senza privare la precedente di Resume/Stop. Query, famiglia naturale e fallback
route incompleta sono allineati. HATHA distingue la pratica completa; i titoli
non dicono più Start durante l'ascolto. Guardia Ultima sessione e Hatha Starting,
factory natura fail-closed, errori consumer e tastiera ambiente consolidati.
DoD aggiornata a D-074 senza wizard obbligatorio o Guided fittizio.

[F] 587 test PASS; P1 replay browser Return e timer, Space/Enter verificati.
La protezione della stessa attività include il passaggio daily/Hatha/natura;
route incomplete usano l'outcome attivo anche se non primario dell'opera.
Matrice per rilievo, test e gate in `PWA_INDIVIDUAL_LOOP_AND_UI_REVIEW.md`.
Il mandato locale non aggiunge autorizzazioni esterne; eventuale aggiornamento
della PWA usa soltanto il perimetro privato già autorizzato. Nessun commit app.

## D-085 - Accesso diretto ai test dei loop individuali

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.18 privata pubblicata, ascolto loop ancora da approvare

[F] Robert richiede tutti i file separati per giudicare click/gap a EOF→zero.
Inventario PWA-only 45/45, player consumer con controlli review aperti e
isolamento da Rain/Ocean; Stop confermato prima di aprire il test, Play
volontario. Ultimi 5 o 15 s, entry e seam espliciti. Nessun nuovo audio.

[F] Risolto un difetto: seek PCM Playing preparava il target senza riprendere.
Ripresa condizionata a stato/generazione; Pausa preservata. Seek singolo
annullabile da Stop/dispose e timeout 15 s, senza riavvio tardivo. Clock UI
corretto per non contare la preparazione del salto come posizione nel file.

[F] Due ritorni Hatha e uno naturale superati nel browser senza fermarsi;
si tratta di stato/runtime e richieste FLAC, non giudizio sonoro. PWA senza
nuovo audio, 45 registrazioni accessibili online; Sites29/env6 owner-only,
nessun nuovo costo, audience invariata, nessun commit canonico.

[U] Copia offline verificata eventualmente preferita dichiarata; il nome FLAC
online non certifica il backend effettivo. Loop audio ascoltati e long-run
iPhone restano gate umani; non confondere pausa del seek e cucitura naturale.

## D-084 - Eliminazione delle attese duplicate nel player PWA

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.17 privata pubblicata; latenza fredda ancora aperta

[F] Robert segnala skip ≥3 s e avvio 1,5–2 s. Cause nel codice: clear audition
più seek ricostruivano due volte; prime a zero precedeva il seek al target;
Ready attendeva anche i deck futuri; pausa chiudeva metadata e decoder anche
con PCM già verificato; il master applicava un ingresso di 2–3 s.

[F] Seek con uscita audition atomica; configure(null) già null idempotente;
audition non esegue un secondo seek. Porta PCM prepareAt prepara direttamente
il target con abort e protezione delle generazioni; percorso HTML invariato.
Preload futuro PCM dopo Start, pool invariato; preferenza al deck dello stesso
URL. Metadati immutabili e PCM cache restano utilizzabili dopo pausa, decoder
riaperto solo su cache miss con le stesse verifiche SHA/ETag/frame. Si
conservano i buffer già schedulati vicini al punto di pausa entro quattro
finestre, senza duplicazione. Indici autenticati condivisi fra driver:
18 risultati completati al massimo, nessuna cache dei fallimenti.

[F] Primo blocco FLAC 8 s anziché due richieste 2+8 s. Restano 8 s startup,
32 s lookahead, richieste ≤8 s/4 MiB e campioni identici. Attacco anti-click
PWA 80 ms; nessun cambiamento ai crossfade editoriali o alle uscite native.
Cronometro seek solo nel pannello review, nessuna telemetria esterna.

[F] Il caricamento futuro attende la conferma del primo refill 32 s delle
corsie udibili, senza ritardare Play; generazione e revisione ignorano le
conferme supersedute. Un ingresso entro 8 s viene preparato prima di Ready.
Test con entrambi i refill sospesi: nessuna apertura futura finché non vengono
rilasciati. Il timer assoluto viene aggiornato nell'operazione audition unica;
cleanup di un vecchio pannello non interrompe una nuova selezione single-track.

[F] Controprova online .16: 36 ms sul target pronto ma fino a 3614 ms su
due sorgenti nuove. .17 aggancia quindi ogni finestra FLAC fredda direttamente
al campione richiesto: 8 s per sorgente in una sola lettura, niente preroll
scartato né seconda richiesta seriale alla griglia successiva. Il test sul
seek 100 s con due corsie conferma due letture totali anziché quattro.

[F] .17 online conferma 46 ms sul punto pronto, ma 1366–2897 ms sui nuovi
target: il gate quasi-zero a cache fredda resta esplicitamente aperto. Nessuna
percentuale di miglioramento rivendicata tra seed/reti/corsie diversi.
Prossimo passo tecnico distinto: prefetch QA mirato dei marker adiacenti,
con budget RAM e priorità del refill attivo, non catalogo precaricato in massa.

[U] La latenza a dati nuovi resta vincolata a rete/decoder. Il riuso dei dati
può rendere i comandi rapidi, ma non rende istantaneo un trasferimento ancora
da eseguire. Le misure del browser Mac non certificano Safari/iPhone o telefoni
economici. Restano gate ascolto/long-run; nessun nuovo audio, costo, build
nativa, commit canonico o modifica dell'audience.

## D-083 - Hatha90 e accesso esplicito alla playlist di revisione

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.15 pubblicata owner-only; ascolto iPhone aperto

[F] Robert segnala dalla PWA iPhone l'assenza dei 90 minuti e del player
sviluppatore, mentre considera Rain/Ocean funzionanti. Cause nel codice:
durate complete fissate a 30/45/60; planner whole-file rifiuta 90; anteprima
playlist nascosta nella pratica completa; controlli di revisione solo nel
player e chiusi, senza accesso diretto dalla preparazione.

[I] Interpretazione operativa della richiesta di 90 minuti: riutilizzare i
loop esistenti, senza inventare contenuti. Gli otto file sommano 4.669,25 s;
un solo giro aggiuntivo non basta con sette raccordi di almeno 60 s.
Soluzione review-only: tutte le otto opere nell'ordine originale, una sola
iterazione extra in Flow e una in Deepening. Scelta deterministica fra
varianti tecnicamente ammissibili; ingresso zero/uscita alla fine del file,
nessun taglio, stretch o duplicazione di asset/ID. Raccordi equal-power
60–300 s; picco conservativo <−1 dBTP; esattamente 259.200.000 frame a 48 kHz.

[F] `extended-loop-boundary-review-only` distingue questa eccezione dalla
D-073 senza modificare i piani 30/45/60 o rilassare il planner production.
L'estensione non autorizza altre ripetizioni. Il pool resta quattro decoder;
il limite di riferimenti ammette le otto musiche, con nature variabili della
sola famiglia scelta e giunzioni sfalsate. I due marker loop sono derivati
dai frame effettivi. A/B durata resta bloccato per non distruggere l'esattezza
della pratica; seek, punti loop/giunzione e ascolto outgoing/incoming restano.

[F] La preparazione PWA offre 30/45/60/90 e un link alla playlist/player
sviluppatore, senza titoli musicali nella Home e senza avvio implicito.
`review=1` apre i controlli e porta alla loro posizione: il normale player
mantiene il pannello chiuso. La barra corrente riporta la durata della sessione
realmente attiva, non quella selezionata per una nuova prova.

[U] Qualità sonora delle ripetizioni/transizioni, long-run e background iPhone
non sono provati dai test automatici; nuova approvazione umana necessaria.
Nessun nuovo file audio, master modificato, commit canonico, EAS o costo.

[F] Lint/typecheck e 77 suite/556 test PASS (audio dedicati 199); export e
validatori pertinenti PASS. Sites26/env6 pubblicata, stato succeeded. Browser
locale verifica i due loop dopo seek, pausa/ripresa e chiusura a 90:00;
report e limiti in `PWA_REVIEW_COMPLETION_AUDIT.md`.

## D-082 - Sostituzione musicale lossless nella stessa PWA privata

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.14 pubblicata owner-only; ascolto iPhone aperto

[F] L'utente autorizza i 21 FLAC verificati sullo stesso Site owner-only,
arresto prima di qualunque costo. Nessun allargamento audience o servizio.
Musica 3.653.766.432 → 2.023.381.325 byte; catalogo attivo previsto
2.371.806.490 byte. Nessuna nuova composizione, normalizzazione o cancellazione.

[F] Mapping PWA-only conserva asset originali e download WAV già verificati.
Gli indici musicali sono on-demand. Stage/import/activate separati: la .12
resta utilizzabile fino a verifica di tutti i nuovi file; i vecchi URL WAV
sono preservati anche dopo .13. Temporanei multipart limitati per SHA,
cleanup autenticato e gate pronto versionato impediscono attivazioni parziali.

[F] Test e limiti, inclusa distinzione peso attivo/storage storico e quota
numerica non esposta, in `PWA_MUSIC_FLAC_DELIVERY.md`. Nessun commit canonico,
EAS, acquisto o approvazione sonora iPhone dedotta dalle prove browser.

[F] Import concluso 21/21, catalogo 45/45, `pending:0`. .13 online ha fallito
a 01:05 per underrun. .14 mantiene finestre 8 s e cache quattro, ma riempie
in anticipo fino a 32 s: stallo 20 s dopo warmup coperto senza aumentare startup.
548 test PASS, 197 audio; Site 25 / env 6. Poiché la rimozione env non bastava
nella controprova immediata, il catalogo attivo chiude anche l'import nel
codice; vecchia chiave rifiutata online. .14 ha superato 02:32 e il loop
musicale dopo seek, ancora Playing a 16:38; non è certificazione iPhone.

[F] Prova online conclusiva Hatha60 + Ocean waves: primo raccordo completo
superato fino a 10:07. Stop → Ready/60:00, scheda utente pronta, nessun
processo locale di prova rimasto. Seed e limiti registrati nell'audit D-082.

## D-081 - Correzione delle giunzioni e variazione della natura

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.12 pubblicata e verificata nel browser; gate iPhone aperto

[F] Dopo D-080, il browser remoto .11 è arrivato a 07:44 in Hatha60, poi
`setValueCurveAtTime(..., 220.5913333333333, 180) overlaps setValueAtTime(0.0001, 220.5913333333334)`.
La forma `(now + start) - position` perdeva un ulp. Ora la differenza è
parentetizzata, i termini degli intervalli adiacenti sono condivisi e la
durata viene ricalcolata dopo il vincolo di monotonia. Nessun epsilon musicale,
ritardo intenzionale o modifica dei campioni. Mock severo senza tolleranza
sugli overlap copre tre clock frazionari e inviluppi compositi.

[F] Il vecchio helper imponeva due nature e un solo cambio: in Hatha60 la
seconda restava da 07:45.75 fino a 60:00. Nuova politica: circa una registrazione
per dieci minuti, distribuita nelle finestre libere dai raccordi musicali;
60 s di stabilità fra raccordi della stessa corsia, inizio/fine protetti e
crossfade preesistente 180 s. Nessuna ripetizione di registrazioni nella
sessione; il ciclo interno del file resta un loop. In 90 min le onde usano
tutte le sette registrazioni disponibili, non nove inventate. Se le finestre
sono insufficienti, errore esplicito senza cambi veloci/simultanei.

[F] Trim conservativo unico per la corsia naturale; tre sorgenti simultanee
massime, quattro decoder riutilizzati. Limite dei riferimenti distinto dai
buffer: Hatha60 ammette otto musiche + sei nature; altri programmi mantengono
un limite esplicito legato a durata e corsie. Nessuna nuova approvazione musicale.

[F] .12 pubblicata privatamente come Sites 21 / env 4. Sorgente isolata
`9533ec6b318ac2868d753a330402daf612f99f42`; deployment
`appgdep_6aa631cfbf8c8191b49e98ca35ef0138` succeeded. Nessun commit canonico
o nuovo byte audio. Suite consolidata: 75 / 543 test PASS. Browser locale
oltre primo raccordo completo, pausa/ripresa interna e seek al terzo cambio
naturale oltre 31:30. Nessuna approvazione sonora dedotta da questi controlli.

[F] Online .12 Hatha60 + Ocean waves: primo raccordo intero superato fino
a 10:09 e seek al terzo cambio natura, ancora Playing a 31:49 oltre fine
31:30. Mute ambiente autonomo verificato. Stop e cleanup completati.

[U] Gate iPhone e FLAC musicali ancora aperti; nessuna approvazione sonora.
Audit del perimetro completo in `docs/PWA_REVIEW_COMPLETION_AUDIT.md`.

## D-080 - FLAC a finestre nel player PWA e clock unico musica/natura

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.11 pubblicata e verificata online; ascolto iPhone aperto

[F] Decoder pubblico FLAC 0.2.11 compilato con esbuild 0.28.2, versioni
devDependency esatte e installazione locale senza script/globali. Il worker
conserva il contratto errors senza property mangling: 76.166 byte. Dipendenza
transitiva codec-parser LGPL dichiarata, testi licenze, sorgente originale e
integrazione/relink distribuiti separatamente dalla musica. Nessun claim di
certificazione legale o assenza di obblighi.

[F] Indici dei 24 FLAC esistenti autenticati tramite hash nel registro;
risposte Range esatte e bounded vincolate a ETag/If-Range e SHA sorgente.
L'eccezione blob è riservata al resolver offline già verificato. Pool PCM
unico fino a quattro deck, anchoring futuro anticipato di un secondo senza
saltare frasi quando è troppo tardi. Pausa invalida preparazioni pendenti e
non riprende segmenti futuri già schedulati.

[F] Controlli e prove in `docs/PWA_FLAC_PLAYER_INTEGRATION.md`: 526 test,
14 HTTP, 8 worker, browser minificato 1.728.000 campioni identici. Review
indipendente su snapshot senza P0/P1 concreto; aggiunti i due test all-PCM
Hatha+Rain/Sea perché i mock misti storici provano soltanto il fallback legacy.

[F] Incidente operativo recuperato: un helper ha usato apply_patch relativo
nel checkout canonico invece che nel laboratorio. README ripristinato al
contenuto pulito HEAD; package al contenuto preincidente con la sola aggiunta
audio:validate-hatha, confermata dalla cronologia, prima delle nuove dipendenze
intenzionali. Otto file accidentali agent-created, identici alla copia nel
laboratorio, spostati recuperabilmente in `/tmp/app-relax-accidental-staging.MbU4M9`.
Nessun audio, modifica preesistente o PWA online perso/modificato dall'incidente.

[U] I master e i 45 oggetti audio remoti restano invariati: 24 FLAC natura,
21 WAV musica. I derivati musicali lossless esterni non sono autorizzati a
un nuovo upload in questa fase. Doctor/security D-069 ancora rossi, non
release nativa. Nessun commit app, EAS, acquisto o modifica degli accessi.

[F] Prova sul Site dopo deploy .10: Play ha inizialmente funzionato, poi
errore `Audio buffer ran out` a circa due secondi. La riserva iniziale di
due secondi non copriva il tempo necessario alla successiva richiesta remota.
Nessuna consegna dichiarata pronta: nuova prova negativa con risposta lenta
e riserva minima di otto secondi prima di Ready (finestre ancora bounded).
Questo aumenta la preparazione iniziale, non il peso dei master, e non
certifica una banda minima sufficiente su tutte le reti.

[F] .11 / Sites 20 / env 4 pubblicata sullo stesso URL owner-only. Browser
online: Rain oltre il loop a 00:43, mute 50→0→50 con main 80, pausa/ripresa;
poi Ocean waves e seek 08:00, attraversato l'avvio del raccordo 08:30 fino
a 09:01 senza errore visibile. Audio fermato. Non equivale ad ascolto o
validazione dell'intero crossfade su iPhone. Identificativi e prove nel rapporto
D-080; index canonico vuoto e server diagnostici spenti, conferma indipendente.

## D-079 - Lettore indicizzato sul clock PCM e regressioni di seek/ripresa

Data: 13 settembre 2026
Stato: codice e verifica locali; NON pubblicato

[F] Estratto il contratto del lettore PCM iniettabile e implementato
`FlacWindowReader`: finestre serializzate, HTTP Range finiti, controllo
formato/indici/frame e ricostruzione della scala PCM24. Nessuna dipendenza
aggiunta alla distribuzione. Worker ESM soltanto nel laboratorio D-078.

[F] Audit indipendente ha individuato richieste di seek obsolete, coda troppo
corta vicino ai confini e drift da clock separati. Correzioni e test aggiunti;
il test di sessione mista ora fa avanzare anche i media HTML e impedisce che
200 ms di preparazione diventino preroll udibile o ritardo accumulato.

[F] Browser reale: scheduler dell'app + lettore FLAC + worker ESM,
tre render di sei secondi ai punti EOF/inizio e finestra/finestra. Zero errore
su 1.728.000 campioni contro finestre con hash D-078 verificati. Nessun suono
emesso, nessun audio copiato o caricato. Protocollo e report in
`docs/FLAC_CLOCK_INTEGRATION.md`.

[U] Non estendere la prova a PWA minificata, iPhone o rete lenta. Restano
attivazione delle tracce successive sullo stesso anchor, limite HTML legacy,
vincolo di revisione HTTP, packaging/licenze e indici autenticati. Il goal
resta aperto; online rimane PLAYER-REVIEW.9. Nessun commit app o pubblicazione.

## D-078 - Fattibilità locale della decodifica FLAC a finestre

Data: 13 settembre 2026
Stato: spike locale verificato, NON integrato nella PWA

[F] Proseguimento del goal oltre D-077: decoder 0.2.11 verificato in un
laboratorio temporaneo, nessuna dipendenza aggiunta al repository. Tutti i
45 FLAC locali passano identità PCM completa contro MD5 STREAMINFO e hash
file approvato, 225 finestre deterministiche e 4.500 reset alternati. Su
21 musiche, 105 finestre coincidono anche col WAV. Browser worker ESM:
15/15 finestre e Range finiti, rapporto verificato anche lato server.

[F] Trovati e documentati: scala float del wrapper differente da quella PCM
canonica e contratto `errors` alterato nel bundle preminificato esaminato.
ESM originale passa; il bundle non è accettato tramite alias o gate allentati.
Indici derivati: 4.585.392 byte, da mantenere separati/caricati a richiesta.
Nessun master modificato, nessun upload o nuova versione PWA pubblicata.

[F] Protocollo, fonti, misure, limiti e prossimi passi in
`docs/FLAC_WINDOW_DECODER_SPIKE.md`. Revisione indipendente ha distinto
finestre deterministiche, decodifica, scheduling, ascolto e memoria. Non
estendere questi risultati a iPhone, loop udibili o delivery già operativa.

[U] Packaging/licenze transitive, lettore nell'app, cache/abort/clock,
vero export minificato e ascolto su telefono restano aperti. PLAYER-REVIEW.9
rimane invariata online. Nessun commit app; residui Doctor/security invariati.

## D-077 - Musica a finestre anche con ambiente naturale FLAC

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.9 pubblicata privatamente, ascolto iPhone aperto

[F] Audit successivo a D-076: il pool sceglieva il decoder controllando
TUTTI gli URL insieme. Un solo FLAC naturale disattivava ClockedWavSource
anche per le musiche WAV. Quindi l'aggiunta di Rain/Ocean waves annullava
il caricamento PCM a finestre D-073/D-075. Era un difetto effettivo del codice,
non prova della causa unica dei glitch riferiti sul telefono.

[F] Pool fisso separato per formato, sempre massimo quattro decoder:
ascolto singolo musica+natura = un PCM WAV e due elementi FLAC; Hatha+natura
= due PCM WAV e due elementi FLAC. Ogni sorgente prende soltanto il tipo
corretto, anche durante seek/replay. Nessuna istanza nuova ai raccordi.
Precaricamento distinto per tipo: un ambiente futuro già pronto non può
bloccare il caricamento della musica seguente. Nessun master o URL modificato.

[F] Secondo difetto trovato nella revisione indipendente: un gesto Play
confermato sulla vecchia posizione poteva essere riutilizzato dopo seek e
ripreparazione, lasciando sorgenti in pausa con stato playing. Ora posizione
e generazione sono vincolate alla conferma; il reset annulla quella pendente.
Una conferma obsoleta fallisce esplicitamente con cleanup, mai con audio
silenzioso dichiarato avviato. Il flusso corretto prepara il seek prima del
nuovo gesto. Coperti mismatch e seek → gesto → resume a ogni raccordo Hatha.

[F] Revisione indipendente su snapshot isolato: difetto precedente chiuso,
nessun altro P0/P1 concreto rilevato. Test selezionati 24/24 PASS; non sono
una prova del comportamento Safari o dell'udibilità sul telefono.

[U] I FLAC naturali conservano il decoder HTML: questa correzione NON prova
loop naturali senza gap. I derivati FLAC musicali D-073 rimangono esterni,
non integrati/uploadati. Nessuna dipendenza o costo introdotti. Migrazione
streaming lossless richiede un decoder con seek sample-accurate verificato,
letture Range limitate, confronto PCM, prova di wrap e memoria su iPhone;
non si assume supporto universale da una lista di codec. Prima di adottare
nuove dipendenze vanno verificati versione, licenza e dipendenze transitive.
Approvazione sonora/low-end: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
Residui Doctor/security D-069 invariati, nessun commit app autorizzato.

[F] Tre verifiche distinte: 72 suite / 502 test PASS con lint/typecheck e
Prettier; revisione indipendente su snapshot; browser reale dell'export finale.
Nel browser: Home → Meditation → Rain → Play; mute ambiente 50→0→50%, main
80% invariato; pausa → seek 10:00 → Play. Hatha 60 + Ocean waves: otto musiche,
due nature e otto giunzioni mostrate; salto 56:09 → Play e ambiente 50→40%.
Non sono misure di udibilità o latenza su iPhone.

[F] Traccia HTTP locale dell'export effettivo in
`dist/audio-continuity-audit/mixed-format-requests.json`: 45 richieste WAV,
tutte con Range finito, HTTP 206 e massimo 2.304.000 byte (8 s PCM). Sono
presenti anche 25 richieste FLAC gestite dal browser; alcune interrotte al
seek/Stop e quindi non marcate finished. Nessuna verifica di continuità FLAC
dedotta dal report. Il processo dedicato è terminato e porta 8251 libera.

[F] Validatori PWA/asset/config/boundary, 13 test HTTP e 12 Worker PASS.
Export 122 file / 7.761.029 byte, zero audio; 86 file testuali scansionati,
nessun pattern di segreto/path sorgente RF. Catalogo 45 file / 4.002.191.597
byte invariato; nessun audio nell'archivio shell e nessun upload nuovo audio.

[F] Sites 18 / env 4, accesso owner-only invariato (un account, nessun ospite
o gruppo). Sorgente isolata `a41d9baa5eecbecc5685ff859721185cae273afc`;
versione `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_91121980456481918663b04712f86946`;
deploy `appgdep_6aa60c43bc988191b0f2b98303ff942f` succeeded.
Archivio 124 file / 7.895.040 byte, SHA-256
`fcda01128a456caec38384d64a08dcebb84a1b8d36837bf98aad47c1eaf244c7`.
HEAD canonico `6549f01` e index vuoto preservati; solo la sorgente Sites
isolata è stata salvata/pubblicata secondo il workflow autorizzato.

[F] Verifica successiva sul Site autenticato: Home → Meditation → Rain →
Ready → Play su Aquarian Drift; PLAYER-REVIEW.9, inventario musica/natura,
punti di loop e giunzione visibili nella Development review. Audio fermato
con Stop, screenshot del normale setup online ispezionato: scelta Off/Rain/
Ocean waves visibile, grafica impressionista conservata. Non viene dichiarata
continuità udibile né un test iPhone da questo controllo browser.

## D-076 - Scelta natura prima di Play in ogni attività

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.8 pubblicata privatamente; percorso Home verificato

[F] Robert segnala ancora assente la possibilità di integrare un suono
naturale. Verifica del percorso reale: ImmediateSessionSetup creava soltanto
un programma single e la route outcome PWA iniettava soltanto la factory
Hatha. I controlli D-075 nei player non chiudevano il flusso Home → attività.

[F] La PWA ora passa la factory single-loop+natura esistente anche al setup
immediato delle sei attività. Off / Rain / Ocean waves è visibile prima
dell'azione Play; Off predefinito conserva il percorso single originale.
La scelta dell'ambiente e della durata non pesca un'altra musica. La richiesta
salvata mantiene listeningWorkId, includeNatureBed e famiglia; la navigazione
raggiunge il medesimo player con i controlli ambiente e la Development review.

[F] Il controller resta il solo confine audio della UI. La factory è iniettata
soltanto dalla radice PWA e assente dalle route native; nessuna dipendenza,
nuovo asset o modifica ai decoder. Volume/mute ambiente disponibili nel
player; cambio famiglia da fermo, senza stop nascosto durante l'ascolto.

[F] Test aggiunti sulla route PWA vera per tutti e sei gli outcome e su
identità del brano, natura della famiglia corretta, Off, durata, errori con
retry, cancellazione delle preparazioni obsolete e blocco dei controlli
durante Starting. Nessun autoplay prodotto dalla sola selezione.

[U] Nessuna nuova evidenza d'ascolto su iPhone. I limiti audio/lossless D-075
restano invariati. Nessun commit nel repository canonico richiesto/eseguito.

[F] Consolidamento: lint, typecheck, Prettier, 71 suite / 496 test, 13 HTTP,
12 Worker e asset/config/PWA/boundary PASS; scansione 85 artefatti testuali
senza pattern di segreti o path sorgente. Export PWA 122 file / 7.759.665 byte,
zero audio; catalogo invariato 45 file / 4.002.191.597 byte. I residui Doctor
e security D-069 non sono stati rivalidati né modificati da questa correzione.

[F] Browser locale: Home → tutte le sei attività, Off predefinito e Rain
selezionabile prima di Play. Meditation+Rain e Focus+Ocean waves arrivano a
Playing; mute Rain 50→0%, volume onde 50→40%, main resta 80%. Browser online:
percorso Home → Meditation → Rain → Play e mute indipendente verificati;
identificativo PLAYER-REVIEW.8 e timeline completa presenti nella review.
La scheda già aperta conservava inizialmente la .7; nuova apertura `/?review=8`
verificata, senza cancellare preferenze o audio. Non si deduce un test iPhone.
La successiva riapertura della Home canonica senza query mantiene il nuovo
setup. Audio fermato a fine test; processo locale dedicato terminato e porta
8218 verificata libera; tab locale chiusa, PWA privata lasciata disponibile.

[F] Sorgente Sites isolata: `cb8f13629ca892f333133cb85de19cd27d388adc`;
versione 17 `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_abf12d1efacc8191a863cb9340284958`;
deploy `appgdep_6aa604cab09c81919988247f22ada36a` succeeded / env 4.
Archivio 124 file / 7.895.040 byte, SHA-256
`c9ece0ef769b68e2d4170fbcc7e3a1fc046cb663de59e4f82ba75b1688c098f1`.
Accesso custom: un solo account owner, zero ospiti/gruppi; nessuna modifica
di accesso, binding, audio remoto o servizi a pagamento.

## D-075 - Review completa e natura ripristinate; clock PCM coerente

Data: 13 settembre 2026
Stato: PLAYER-REVIEW.7 pubblicata privatamente; gate d'ascolto iPhone aperto

[F] Feedback Robert: review con punti loop/giunzioni e ambiente miscelabile
assenti nel percorso semplificato. D-074 non autorizzava questa perdita.
La review resta nello stesso player consumer-paper, dietro un controllo
esplicito «Development review», con descrizione dei punti disponibili.
Inventario di tutte le sorgenti e nomi file, entry/exit, ciascun wrap da frame
reali, ogni estremo del crossfade e audition sono collegati al controller.
L'indice loopCount non è usato per inventare raccordi: il calcolo deriva da
frameCount, sourceEntryFrame e durata effettiva del segmento.

[F] Off / Rain / Ocean waves in Hatha setup/player e player musicale PWA.
Default Off; famiglia modificabile da fermo, volume/mute indipendenti durante
Play. Il programma single-loop con ambiente mantiene una sola musica e due
registrazioni naturali in successione lenta; non è presentato come playlist
musicale. Hatha conserva i file interi. La transizione natura viene collocata
fuori da TUTTI i crossfade musicali, non soltanto dopo il primo. Massimo tre
sorgenti simultanee, pool invariato di quattro deck. Hatha 60 può risolvere
dieci URL (8+2), non dieci decoder contemporanei; limite maggiore confinato
ai piani whole-file con due sorgenti natura. Nessun nuovo byte audio.

[F] Richiesta salvata mantiene opera autonoma/famiglia natura e Off esplicito
in Hatha; «Play your last session» non trasforma l'ascolto singolo con pioggia
in un'altra playlist. Barra corrente non duplicata nel relativo player.

[F] Audit audio silenzioso con OfflineAudioContext reale: prima della
correzione, 3/8 confronti falliscono quando finestre PCM 48 kHz sono giuntate
su un contesto 44,1 kHz (errore massimo 0,20000005, −13,98 dBFS). I quattro
confronti a 48 kHz sono già numericamente continui. La PWA richiede quindi
AudioContext({sampleRate:48000}); ClockedWavSource rifiuta altri clock invece
di produrre seam frazionali. Specifica primaria: [Web Audio, AudioContextOptions](https://www.w3.org/TR/webaudio-1.0/#dom-audiocontext-audiocontext)
prevede conversione dell'uscita al sample rate hardware. Nessun resampling
o modifica dei master. Prima/dopo in dist/audio-continuity-audit/, harness
locale scripts/verify-clocked-render.mjs, mai incluso nella PWA o in EAS.

[U] Questo test sintetico non verifica iPhone, Bluetooth, decoder FLAC HTML,
carico prolungato o qualità musicale. Il report lossless D-073 resta valido
ma non costituisce integrazione dei derivati: nessun upload nuovi audio,
dipendenza decoder o costo. Gate udibile: NON DETERMINATO — EVIDENZA INSUFFICIENTE.

[F] Consolidamento: 71 suite / 485 test; lint/typecheck, PWA/asset safety/config/
boundary, 13 test HTTP e 12 Worker PASS. Audit corretto 8/8, massimo errore
1,8189894e−12 confrontando con loop nativo AudioBuffer e conversione continua
finale a 48/44,1 kHz. I tre fallimenti originari restano nel report before.
Nessun nuovo stato verde attribuito ai residui Doctor/security D-069.

[F] Sites 16 / env 4 owner-only (un account, zero visitatori esterni/gruppi),
sorgente isolata `437e067e68e2052694c1dcc501b0df95d2f41aac`, versione
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_4c4279a73cfc81918c50330d3b5dbc03`,
deployment `appgdep_6aa600c01b4c81919c065b1a7bf99d44` succeeded.
Shell 122 file / 7.744.564 byte; 45 audio / 4.002.191.597 byte invariati.
Scansione dei bundle: nessun path sorgente RF o pattern credenziale rilevato.
Nessun commit app: HEAD canonico `6549f01`, index vuoto; commit/push soltanto
nel checkout isolato necessario alla pubblicazione Sites autorizzata.
Browser remoto verifica Ready → Play con Rain e pannello PLAYER-REVIEW.7.
Nella prova localhost una shell precedente in cache mostrava la barra duplicata;
dopo aggiornamento esplicito con la pagina update, la versione finale mostra
un solo trasporto. Nessuna cancellazione di audio o preferenze. Server locali
8217/8250 e finestre di prova chiusi; nessun emulatore o Metro.

## D-074 - Attività → Play; musica invisibile e Hatha completo separato

Data: 13 settembre 2026
Stato: QUIET-REVIEW.6 pubblicata privatamente; verifica funzionale completata

[F] Robert corregge la semantica del prodotto: l'ascolto quotidiano non è una
libreria da esplorare né una sequenza obbligatoria. Scelta silenziosa di una
sola opera adatta da ripetere; durata facoltativa con default per attività.
`automaticListening` usa solo file realmente disponibili, senza opere respinte
o frammenti dei cicli Hatha; priorità alle musiche mappate all'attività per non
ricadere nelle onde ovunque. Campione casuale limitato, nessuna ripetizione
immediata rispetto all'opera attiva se il pool contiene alternative. La scelta
resta stabile nella visita, anche con timer/rerender/retry; non è shuffle al wrap.

[F] Titoli dei brani assenti da attività, player singolo/adattivo e barra
corrente. Catalogo conservato integralmente nel sottomenu Settings → Listening
preferences → Choose a recording manually. Nessuna tab Sounds. Identità visiva,
artwork e controlli grandi già approvati conservati. In PWA il pannello
Development review resta apribile ma parte chiuso; nomi tecnici solo lì.

[F] Yoga completo è un ramo esplicito (`practice=complete`), non il default
dell'attività Yoga. Conserva la factory D-073, durate fattibili 30/45/60 e file
interi ordinati. Senza adapter/factory non finge il ciclo con un singolo file.
Guided, voce e download non vengono presentati come disponibili.

[F] Nessun cambio ad AudioEngine/controller/driver, master, mapping, audio
remoto o dipendenze per D-074. Nessun commit canonico, EAS o upload nuovi audio.
[U] Restano i gate D-073: glitch udibile su iPhone/low-end, adozione FLAC,
approvazione dei raccordi Hatha. Le verifiche UI non sostituiscono ascolto.

[F] Test browser successivo alla prima pubblicazione D-074: il range impostato
tramite accessibilità cambiava il cursore ma non la posizione audio perché il
commit dipendeva solo da pointer-up/key-up. Correzione UI: durante trascinamento
si mostra la preview e si committa al rilascio; un change senza pointer attivo
(tastiera/accessibilità) committa subito. Test dedicato, senza doppio seek al
key-up. Riprovato nella versione finale: 15:00 in Play → 15:02/14:58 residui,
10:00 in pausa → 20:00 residui, stato Paused preservato; quindi Stop → Ready.
Il setter dell'automazione segnala il valore transitorio durante il seek, ma
la successiva lettura UI conferma tempo, posizione e messaggio di seek coerenti.

[F] Verifiche finali: 70 suite / 472 test PASS, lint/typecheck/Prettier PASS,
13 test HTTP su tutti i 45 file locali (HEAD/Range estremi byte-identici),
12 Worker test, PWA validator, asset safety, config e confine QA/PWA PASS.
Simulazione locale `.easignore`: 157 file / 160.013.098 byte; esattamente 3
WAV ATP01, nessun catalogo consumer/segreto/path sorgente. Il primo richiamo
del validatore archivio senza argomento ha restituito l'errore d'uso previsto;
verifica poi eseguita sull'archivio simulato, non dichiarata come EAS build.
Doctor/security D-069 non rilanciati: nessun upgrade né nuovo stato verde.

[F] Ultima pubblicazione owner-only: Sites 15 / env 4, sorgente isolata
`54099af3ca44c9306f91443db9c2fc2ca359b508`, versione
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_eacb9f15507c8191b85144a73bcdf61c`,
deployment `appgdep_6aa5f6c8f4488191af5fb465bc587f3b` succeeded.
La Sites 14 intermedia è stata sostituita dopo aver trovato il difetto range.
Shell 122 file / 7.659.099 byte, nessun audio; 45 audio remoti invariati.
Browser privato verificato: Home senza Sounds/catalogo, attività senza titoli,
Play/Pausa/Stop, barra per funzione, Settings → disclosure → libreria completa,
Yoga completo e controlli QA apribili. Il countdown non è prova d'ascolto.
HEAD canonico `6549f0117f2d7623fe20816cbf2c687385af6b8d` invariato, index vuoto;
due commit solo nel checkout isolato di pubblicazione. Modifiche pregresse
preservate, nessun intervento sulle cartelle Strategia o sui master.

## D-073 - Session-first; feedback loop negativo e caricamento a finestre

Data: 13 settembre 2026
Stato: SESSION-REVIEW.5 pubblicata privatamente; gate d'ascolto iPhone aperto

[F] Screenshot MUSIC-REVIEW.4 confermato: supersede l'incertezza D-072 sulla
versione vista da Robert. Il suo loop test fallisce con interruzione/glitch;
non si confonde un test DOM con ascolto. Nella prima foto coesistono errore di
preparazione Yoga e sessione Wave and Ground attiva. Audit del codice: un solo
candidate controller, hook di preparazione ancora attivi nelle route nascoste,
Ready mantenuto localmente. La correzione usa focus/blur e ri-preparazione;
test dedicato impedisce riuso Ready dopo refocus. Non sostituisce il driver
attivo durante navigazione.

[F] Home senza «Listen to your music». Titoli dei brani secondari; elenco
individuale chiuso sotto «Review individual sounds». Nessuna rimozione di file.
Scelta funzione → durata → Start. Il ramo PWA Music non finge più una sessione
evolvente ripetendo solo la prima opera; niente fallback silenzioso alle onde.

[F] Factory di review separata in `src/pwa-review/`, iniettata soltanto dalle
route PWA e assente dal pacchetto EAS. Per Hatha considera sottosequenze in
ordine documentale, tutte le fasi, file interi, ingressi 0/uscite fine file,
crossfade equal-power 60–300 s, massimo due sorgenti, picco conservativo < −1
dBTP. Durata esatta mediante overlap ripartito in frame interi; envelope finale
tecnico di 3 s, non una chiusura musicale approvata. Nessuna analisi armonica
inventata: tutti i raccordi restano PROVISIONAL QA e visibili nel pannello.
30/45/60 minuti fattibili; 20/90 no, senza tagli o ripetizioni. Cronologia
preferisce materiale meno recente, ma non può escludere ogni opera recente
(un solo brano Return); limite non nascosto. Seed riproducibile, ordine mai
shuffle. A/B durata bloccato su questi piani perché violerebbe file interi o
durata; restano seek, previous/next, finestre e outgoing/incoming/both.
Il planner release continua a rifiutare `CYCLE_TRANSITIONS_UNREVIEWED`.

[F] Nuovo ClockedWavSource solo per URI WAV della PWA: probe 64 KiB, finestra
iniziale 2 s (576.000 byte PCM), successive 8 s, cache massima 4 finestre,
lookahead 16 s. Float32 preserva esattamente i campioni PCM24; nodi consecutivi
programmati con frame accounting sul clock AudioContext, anche al wrap.
Range diverso da 206/esatto o underrun produce errore e pausa, non download
intero o salto nascosto. Nove test coprono PCM, formato, range, wrap, seek,
cancellazione, file non-loop e underrun. Test browser ha scoperto e corretto
la chiamata fetch non associata al contesto Window (`Illegal invocation`).
[I] Un candidato Hatha a quattro deck richiede circa 2,57 MB iniziali invece
di una decodifica integrale di quattro WAV. È calcolo dal contratto Range,
non una misura della latenza/rete/RAM del telefono. FLAC e blob offline NON
usano questo caricatore; la continuità in quei percorsi resta da verificare.

[F] Conversione read-only dei 21 WAV con ffmpeg già presente in RipX
(N-102067-gb06082d1d5), FLAC level 8, stereo/48 kHz/24-bit, nessun limiter o
normalizzazione. SHA-256 sorgente verificato e PCM decodificato identico per
21/21. WAV 3.653.766.432 byte, FLAC 2.023.381.325: −44,6220%. Gli altri 24
FLAC invariati porterebbero il totale a 2.371.806.490 byte. Derivati fuori repo,
non caricati nel Site, non ancora integrati. FLAC riduce il trasporto ma non
la RAM del PCM completamente decodificato: non promettere avvio istantaneo.
Fonti primarie: [FLAC features](https://www.xiph.org/flac/features.html),
[FLAC tools](https://www.xiph.org/flac/documentation_tools_flac.html),
[AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode).

[F] Misurato anche il salto tra ultimo/primo campione, senza alterarlo: negli
Hatha da −67,61 a −36,61 dBFS. Non basta per attribuire l'interruzione udita al
master anziché al ritorno media/browser. Identità lossless conserva anche
eventuali discontinuità presenti nella sorgente; non è un restauro del loop.

[F] 68 suite / 463 test, lint/typecheck PASS, 13 test HTTP e asset/config/QA
boundary PASS. Browser integrato locale: Yoga 30 con quattro opere, cambio
178,25 s, Start e seek al cambio; Hatha 01 Last 15 seconds → posizione 00:10
con Playing e nessun errore console, quindi Stop. Solo prova funzionale,
NON approvazione udibile. Nessun emulatore, master o asset consumer Git.
[U] Musical compatibility, iPhone audible loop, low-end memory/latency,
background e adozione dei FLAC: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
Prima dei nuovi FLAC remoti: decoder/loop streaming iPhone e perimetro costo
verificati. Non si caricano altri 2 GB alla cieca. Gate tooling D-069 invariati.

[F] Pubblicazione owner-only verificata, Sites 13 / env 4, sorgente isolata
`3cab4d08d62c90789c24faa97d5ec861d31ba4c6`, versione
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_c794978ed1808191a3459fb192501c12`,
deployment `appgdep_6aa5eae204348191b4ccd1c50f46f422` succeeded.
122 file PWA / 7.894.272 byte, nessun audio nell'artefatto. 12 Worker test
PASS. Catalogo remoto invariato 45 file / 4.002.191.597 byte. Nessuna nuova
importazione audio, modifica costi/accesso o commit canonico.

[F] Verifica sul Site autenticato: Home senza link biblioteca; Yoga 30
prepara quattro opere (Air Between Hands, Quiet Expanse, Earth in Motion,
Space Unfolding), Start in Playing, review SESSION-REVIEW.5, Jump to change
completato a 06:14 e avanzamento a 06:30, poi Stop → Ready. Non equivale ad
ascolto iPhone o prova sonora dell'intero passaggio. Derivati FLAC conservati
in `Documents/App Relax Audio Derivatives/session-review-5`, fuori repository.
Archivio EAS simulato: 154 file, soli tre WAV ATP01, niente catalogo consumer,
path sorgente o segreti; secret scan mirato PASS. Server locale 8201 spento
con SIGTERM, porta libera; audio di prova fermato, nessun emulatore avviato.

## D-072 - Correggere la proposta musicale, non ripetere la consegna precedente

Data: 13 settembre 2026
Stato: MUSIC-REVIEW.4 pubblicata privatamente; ascolto iPhone da confermare

[F] Robert riferisce PWA identica e solo onde ripetute: D-071 non chiude il
suo problema. Il codice effettivamente conservava default naturali in cinque
categorie; Home non aveva un ingresso diretto ai nuovi brani. Lo stato del
suo browser iPhone non è disponibile, quindi «è solo cache» resta un'ipotesi,
non una diagnosi conclusiva. Richiesto screenshot senza bloccare la correzione.

[F] Music ora default in tutti i sei outcome quando disponibile; nessuna
sostituzione implicita con Rain/Ocean waves. Cronologia invariata ma ultimo
ascolto naturale etichettato per famiglia. Home PWA con link `/music`, revisione
visibile; `/music` è una vera route Expo con gli stessi 21 record e player,
non una demo o riproduzione alternativa. Non esisteva nelle shell precedenti:
il loro cache-first non contiene quella route e deve recuperarla dalla rete.
Accesso privato conservato, nessun meccanismo di autenticazione aggirato.

[F] Le 21 opere sono 8 Respiro Hatha e 13 precedenti musicali, senza file
naturali/generatori, Eclypsis, Nirvana o Soft Air. La modalità music-only riusa
Soundscapes, non duplica il catalogo; filename originale visibile soltanto nel
pannello di sviluppo privato. Non autorizza o finge nuovi piani musicali
evolventi, né crea nuovi byte audio.

[U] Se il telefono resta muto aprendo un Hatha identificato, servirà una
diagnosi playback specifica: countdown e file selezionato non provano l'uscita
sonora. Rimangono i gate offline privato D-071 e nativi/tooling D-069.

[F] Riprodotto durante D-072: `/music` nuovo mostra correttamente 21 opere,
ma una navigazione documentale a `/` sotto worker precedente restituisce
la vecchia Home senza link musica. L'anteprima sull'esatto hostname privato
è pertanto online-first: il bootstrap del documento ritira soltanto la
registrazione root di quell'origine, senza cancellare cache/OPFS/preferenze,
senza reload o claim degli altri client. Non reinstalla un worker su quel
solo hostname. Localhost/altri deployment conservano il flusso offline.
Quattro test verificano hostname/scope; nessun allentamento di auth o integrità
audio. Il primo ingresso `/music`, assente nelle copie vecchie, fornisce il
documento aggiornato e il bootstrap. Il blocco offline privato resta esplicito.

[F] Il controllo live ha rilevato un'ulteriore incoerenza: Meditation con
Music selezionata continuava a proporre Open Tide/Tidal Breath come primi due
brani alternativi. Corretto l'ordinamento nella libreria outcome: musica prima,
ordine interno preservato, Hatha sempre tutti visibili. Test sui sei outcome
verificano la priorità musicale e l'accessibilità del catalogo completo;
nessuna riclassificazione delle registrazioni naturali in musica.

[F] Consolidamento finale: 65 suite / 445 test PASS; lint e typecheck PASS;
13 test HTTP (45 file reali, Range iniziale/finale byte-identico), 12 Worker,
asset safety, config e confine QA/PWA PASS. Export PWA 122 file / 7.899.384
byte, 53 player predisposti e zero audio. Catalogo remoto invariato:
45 file / 4.002.191.597 byte; nessuna importazione o modifica dei master.
Doctor e audit dipendenze non rieseguiti né dichiarati verdi: residui D-069.

[F] Sorgente isolata Sites finale `b87533430583b34a9d6d213a5dace0d38a71f43c`,
versione 12 `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_105eea4e50408191a8b89d10b2c390f5`,
deployment `appgdep_6aa5ddf0f6148191919975b21b80add4` succeeded, env 4.
Accesso owner-only invariato. Le versioni generate precedenti sono preservate
in `tmp/pwa-public-before-music4/`, `tmp/pwa-public-music4-before-bootstrap/`
e `tmp/pwa-public-music4-before-order/`; nessuna cancellazione dei dati utente.
Nessun commit o staging canonico: i commit isolati Sites servono solo a
pubblicare la revisione privata già autorizzata, non a GitHub.

[F] Verifica live finale: ingresso `/music`, riapertura completa `/` con
Home nuova, Music iniziale in Meditation e primi suggerimenti Celestial
Current/Distant Garden. Libreria 21 opere, otto Hatha in testa. Hatha 02
mostra `02_aria_tra_le_mani_LOOP_48K24.wav`, Play e seek +30 s completato
(messaggio Position 00:34, avanzamento a 00:51); poi Stop. Mineral Drift
verificato in Play sulla versione 11 con stesso player/file mapping.
Nessun errore console osservato. Browser lasciato su `/music`, senza audio;
server 8198 PID 98292 terminato con SIGTERM e porta verificata libera.
[U] Uscita audio, qualità e copia realmente vista da Robert su iPhone non
certificate da questa prova browser. Non si attribuisce approvazione sonora.

## D-071 - Music visibile e recupero esplicito della PWA non aggiornata

Data: 13 settembre 2026
Stato: HATHA-REVIEW.3 pubblicata privatamente; ascolto iPhone da confermare

[F] Segnalazione Robert: musiche caricate non trovate/sentite e indicazione
«sessioni natura» non corrispondente a una voce dell'app. Browser remoto e
sorgenti confermano che Start Yoga proponeva Ocean waves; sei degli otto
Hatha richiedevano una disclosure sotto il flusso principale.

[F] Scelta visibile Music / Ocean waves / Rain, una selezione musicale avvia
una vera opera autonoma, mai una sessione di onde sostitutiva. Yoga propone
il primo Hatha, gli otto numerati sono visibili integralmente e Music è prima
nell'indice Sounds. Le categorie Meditation/Sleep/Focus conservano la loro
precedente preferenza naturale iniziale. Nessun nuovo abbinamento approvato,
nessuna modifica al motore, ai master, al volume o alle curve.

[F] Riprodotta anche una shell vecchia in localhost: export HATHA-REVIEW.3
ma navigazione sotto worker precedente mostrava ancora «Or choose one sound»
e nessun selettore Music. Il nuovo `/update.html` resta fuori dalla risposta
cache del worker e gestisce un update esplicito. `skipWaiting` è ammesso solo
dal sender same-origin di quella pagina e senza altre finestre App Relax;
altrimenti risponde BLOCKED. Nessun `clients.claim`, cancellazione dei dati
audio o refresh di altre finestre. Test negativi per origine/sender/altro client.

[F] Riferimenti API primari consultati: [MDN update](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update)
e [MDN skipWaiting](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting).
La protezione dei client è una regola applicativa aggiunta, non una garanzia
automatica dell'API. I controlli sviluppo del player rimangono presenti.

[U] La prova browser con countdown non prova che l'iPhone emetta suono.
La domanda di distinzione «non trovo i brani / Play resta muto» è stata posta
senza bloccare la correzione dei difetti già riprodotti. Nessun risultato
di ascolto nuovo viene attribuito all'utente.

[F] 64 suite / 438 test PASS; lint e typecheck PASS. PWA: 121 file,
7.797.048 byte, 53 route player, zero audio. 13 test HTTP, 12 Worker,
asset safety e configurazione PASS. Archivio `.easignore` simulato:
153 file / 159.987.608 byte, soltanto ATP01; secret scan mirato PASS.
Doctor/audit dipendenze non rieseguiti: i residui tooling D-069 rimangono.

[F] Sorgente isolata Sites `6b84e3ecd6408349958d1c1a36dd5133c2219d1a`,
versione `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_738839a928cc8191b40a44a00162e892`,
deployment `appgdep_6aa5d6416d50819180f9c30da43828ac` succeeded, env 4.
Accesso invariato owner-only, nessun upload audio o riapertura import.
Checkout canonico non staged e non committato. Il vecchio public generato
del Site è preservato in `tmp/pwa-public-before-review3/`.

[F] Il test remoto di Sites 9 ha riprodotto worker `redundant` in due
tentativi: l'aggiornamento della shell privata non è provato, a differenza
del percorso locale. Sites 10 aggiunge un recupero online esplicito dopo
errore: un secondo click rilascia soltanto la registrazione worker con
origine/scope verificati, poi naviga alla nuova Yoga. Non cancella cache,
OPFS o preferenze; non usa `clients.claim` e non ricarica altri client.
Il fallimento offline non viene nascosto né aggirato abbassando integrità o
controlli di accesso. Due nuovi test coprono click volontario e scope errato.

[F] Sorgente finale Sites `2761a888b73f9da616b44a9d9be9a99835030f4a`,
versione `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_f8647e798e408191838603c61b7dfa43`,
deployment `appgdep_6aa5d7a8a56c8191b8563ae9196b15cd` succeeded, env 4.
[U] Causa del fallimento precache privato: NON DETERMINATO — EVIDENZA
INSUFFICIENTE. Non è un esito di decoding/ascolto dei WAV su iPhone.

[F] Prova remota finale Sites 10: il recupero «Open latest online version»
porta alla Yoga nuova con Music selezionata e tutti gli otto Hatha visibili;
Start apre Threshold of Breath con countdown e pannello sviluppo, zero errori
console. Stop eseguito e pagina lasciata su Yoga. Server locale 8197 spento
e porta libera; nessun emulatore/Metro avviato. Resta da confermare l'ascolto
sul telefono, non deducibile dalla sola prova DOM.

## D-070 - Controlli di sviluppo nel player della PWA privata

Data: 13 settembre 2026
Stato: HATHA-REVIEW.2 pubblicata privatamente, attesa test iPhone

[F] Durante la consegna Hatha, Robert ricorda che la sua PWA deve contenere
i controlli di sviluppo nel player per verificare le transizioni. Eccezione
limitata alla review privata: stessa UI consumer, pannello richiudibile
`DEVELOPMENT REVIEW`; nessuna route scura Workbench o Audio Test aggiunta.

[F] Sui file: barra posizione cliccabile/trascinabile e tastiera, ±30 secondi,
salto agli ultimi 15 secondi per il raccordo circolare. Sulle sessioni:
inizio/fine dei cambi, precedente/successivo, loop ±30/60 secondi,
uscente/entrante/entrambi, A/B con 60/120/180/240/300 secondi e curva
equal-power/linear. I controlli passano da AudioSessionController; nessun
accesso audio diretto dalla UI. La variante è verificata, ferma il player
e richiede un nuovo Play volontario; non si avvia da sola.

[F] Picco indicato come stima conservativa, non falso meter live; seed e
regole visibili, controllo accelerato del piano. Il pannello non abilita
coppie Hatha non revisionate. Gli otto file restano ascoltabili singolarmente.

[F] Codice in `src/pwa-review/`, importato solo dalle due route PWA ed escluso
esplicitamente da EAS; consumer/native export verificati senza stringhe o
controlli di review. Corretto anche il mismatch di hydration del link con
query: shell statica stabile prima di creare il piano nel client.

[F] 64 suite / 422 test, lint/typecheck, 13 test HTTP, 12 Worker, export e
validatori PASS. Prova browser reale: salto dalla barra, coda file, due
transizioni, loop/ascolto selettivo e variante B da 240 secondi pronta in
stato fermo; pacchetto finale senza errori console. Non è validazione iPhone.
Nuova revisione PWA `HATHA-REVIEW.2`; niente nuovo audio oltre agli otto D-069.

[F] Sites 8 pubblicata: source isolata
`21322522d0b75063f673ab9b2d832cb2c85789a1`, versione
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_03b97b7d4d0c8191ba030832676aea8a`,
deployment `appgdep_6aa5cf26d6348191b848d9a26b302827` succeeded, env 4.
Stesso link https://app-relax-private-review.robfulton.chatgpt.site/,
owner-only (un account, nessun gruppo/ospite). Otto WAV trasferiti senza
alterare i 37 precedenti; complete verificato dal Worker con 45 file ready.
Import a scadenza richiuso: chiavi eliminate prima della consegna.

[F] PWA remota nel browser autenticato: Settings mostra HATHA-REVIEW.2, Yoga
contiene gli otto titoli, Space Unfolding passa a Playing con countdown e
controlli sviluppo; console senza errori. Non è prova iPhone. Il normale
audit HTTP senza identità browser riceve 401: non sono stati falsificati
header d'identità per aggirarlo. Controllo anonimo/vecchia chiave import negato.
Il report catalogo aperto nel browser autenticato, dopo la chiusura import,
conferma 45/45 ready e gli otto hash Hatha esatti (4.002.191.597 byte totali).

[F] Nessun commit nel checkout canonico (HEAD resta `6549f01`), nessun push
GitHub, build EAS o acquisto. Soltanto il checkout isolato Sites è stato
committato e inviato secondo il workflow di pubblicazione autorizzato.

## D-069 - Respiro Hatha 1: opere autonome e PWA privata in review

Data: 12 settembre 2026
Stato: integrazione locale verificata; pubblicazione privata autorizzata

[F] La delega da App Relax — Editing audio autorizza precisamente gli otto
WAV correnti Respiro Hatha 1, preservando originali, ordine 1–8 interno e titoli
pubblici inglesi. Il successivo «quando finisci, pwa» autorizza il loro invio
al Site privato esistente. Non autorizza GitHub, commit canonico, build o costi.

[F] Il registro separa la struttura documentata dalla compatibilità sonora:
ruoli della timeline Respiro verificati; contratti di Centro comune esclusi
perché appartenenti a un altro ciclo. La sola richiesta di sessione Hatha
fallisce esplicitamente finché non esistono finestre/coppie revisionate sui
WAV finali. Nessun fallback musicale/natura spacciato per ciclo Hatha.

[F] Localhost/PWA espongono gli otto come review online-only. Pacchetti offline
approvati invariati; corretto il crash del pannello download per opere non
incluse nei pacchetti. Play/Pausa/Stop e fade iniziale riusano il motore,
senza modificare i file, applicare gain aggiuntivo o introdurre mixer.

[F] Fonte/metriche, titoli, test, residui di toolchain e gate musicali sono
registrati in `docs/HATHA_1_INTEGRATION.md`. 414 test verdi non equivalgono
a un'approvazione d'ascolto; Doctor 19/20 e audit FAIL restano espliciti.

[U] Il ciclo evolvente e la validazione iPhone/loop/background restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino alle prove pertinenti.

## D-068 - Checkpoint locale e ulteriore riduzione minima del transport

Data: 6 settembre 2026
Stato: commit locale esplicitamente autorizzato; nessuna nuova pubblicazione

[F] Robert richiede «Commit» e, durante il preflight, comandi Play/Pausa
leggermente più piccoli. Altezza minima condivisa 56 → 52 (circa -7%),
senza ridurre icone/testo né perdere allineamento con Stop; target ancora
superiori a 44. La PWA pubblicata D-067 resta a 56: questa nuova variazione
è inclusa nel checkpoint locale, non pubblicata automaticamente.

[F] Perimetro: 193 percorsi di codice, test, configurazione, icone PWA e
documentazione accumulati dopo `72346a0`. Nessun nuovo byte audio; è inclusa
la rimozione già autorizzata dell'Eclypsis FLAC dal repository, recuperabile
dal commit precedente. I master esterni restano intatti. Esclusi audio
localhost da 2.657.446.897 byte, output/tmp Strategia, build, cache, report
generati e checkout isolato Sites. Nessuno staging globale.

[F] Gate: 62 suite / 400 test, typecheck, lint, formato, test HTTP 12/12,
placeholder/ATP01/consumer, safety/artwork, configurazione e confini QA/PWA
PASS. Doctor 20/20, Expo install-check PASS. Security PASS WITH ACCEPTED
RESIDUALS soltanto per i due advisory image-size già documentati. Scansione
segreti sui percorsi del commit PASS. Simulazione con `.easignore`: 149 file /
159.973.441 byte, esattamente i tre WAV ATP01, nessun catalogo pesante,
segreto o path sorgente privato. Non è un'operazione EAS.

[F] Dopo la riduzione a 52, nuova suite completa 400/400 (145 test audio
inclusi) e nuovo export PWA locale PASS: 111 file / 7.400.563 byte, zero audio
o Workbench. Prove locali in `dist/commit-app-review-jest.json`,
`dist/commit-app-review-doctor.log`, `dist/commit-app-scope.json` e
`dist/commit-app-pwa`. L'export locale non aggiorna il Site pubblicato.

[F] Audit parallelo su snapshot isolati: nessun materiale estraneo; riallineati
i riferimenti storici di pubblicazione/commit nei documenti. Rilevata una
divergenza di gain nel motore nativo composito ancora inattivo, registrata
come blocco prima dell'attivazione in `docs/A01_NATIVE_GATE.md`. UI e factory
nativa mantengono il doppio gate Web-only/resolver assente. Salvare il
checkpoint non promuove quella preparazione a funzionalità disponibile.

[U] Gate di ascolto/resa aggiornata, offline privato, background e long-run
restano aperti. Il commit locale non autorizza push, PR, build native/cloud,
nuova pubblicazione, acquisti o attivazione di funzioni future.

## D-067 - Pubblicazione privata della barra compatta

Data: 6 settembre 2026
Stato: A01-A14.5 pubblicata, versione Sites 6; attesa del giudizio iPhone

[F] Robert autorizza «Mettila nella PWA». Pubblicata soltanto la correzione
D-066 e il nuovo identificativo di revisione; nessuna modifica ad audio,
catalogo, disponibilità, Worker, accesso o funzionalità. I controlli sono
compatti ma mantengono posizione, azioni e target accessibili.

[F] 7 suite / 42 test player/PWA e 12 test Worker PASS; export e validatore
PWA PASS, formato e scansione segreti/path privati PASS. Shell 111 file /
7.399.811 byte, zero audio/Workbench/sourcemap; archivio 113 file /
7.417.043 byte non compressi, 3.517.647 byte gzip. Precache 109 file /
7.388.955 byte. Lo storage AUDIO con i 37 file esistenti non è modificato.

[F] Source isolata `7f9ef6c15103614a26ed83d9be15822dcbc6dec6`;
versione `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_1f916abcd0dc81919dd2e17dd3b15072`.
Deployment `appgdep_6a9cb60dc580819195a0a051ae883c9d` succeeded, env 2.
Live: https://app-relax-private-review.robfulton.chatgpt.site.
Accesso verificato owner-only: un account, nessun gruppo/ospite, revision 1;
anonimo HTTP 401. Handoff accodato nella scheda Codex esistente.

[F] Verifica remota completata: 68 HTML con riferimento al bundle aggiornato
e 43 asset non-HTML byte-identici. Prove e hash in
`dist/compact-transport-publication.json`. Non è un test d'ascolto iPhone.

[F] Fonte costi ricontrollata: Sites incluso nei piani idonei durante beta
(https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost). Nessuna
quota numerica residua esposta, nessun gate a pagamento o acquisto, nessun
nuovo servizio o upload audio. Non è stato modificato l'accesso al Site.

[F] Il solo checkout isolato Sites segue commit/push richiesti dalla
pubblicazione. HEAD canonico resta `72346a089fca9d9235b1788acceab6eb0dcd455c`,
index vuoto; niente commit dell'app, push GitHub, EAS o build nativa.
[U] Il test visivo/ascolto aggiornato su iPhone resta umano. Offline privato,
background e long-run non vengono dichiarati risolti da questo aggiornamento.

## D-066 - Barra di ascolto compatta, senza alterare la disponibilità

Data: 6 settembre 2026
Stato: correzione locale; non pubblicata e non committata

[F] Robert giudica eccessivo l'ingombro della barra introdotta in D-063:
la visibilità non deve compromettere l'estetica consumer-paper. Stop resta
a sinistra e Play/Pausa a destra, nella stessa posizione fissa. Altezza minima
da 80 a 56, simbolo e testo affiancati, carattere 16, bordi sottili e fondo
carta per Stop; Play/Pausa mantiene il contrasto inchiostro/carta. Nessuna
altezza massima impedisce alla riga di crescere con il testo ingrandito.
Motore, callback, navigazione e catalogo non cambiano.

[F] Test mirati player/barra corrente/adattivo: 4 suite, 24 test PASS.
Prettier sui due file, lint e typecheck PASS. Il test verifica ordine,
target 56 (oltre il minimo 44), riga compatta, colori e azioni anche durante
Starting. Queste prove non sostituiscono il giudizio visivo su telefono.

[F] Export Web locale e validatore PWA PASS: 111 file / 7.399.811 byte,
45 route player, nessun byte audio o Workbench. Artefatto separato
`dist/compact-transport-pwa`, log `dist/compact-transport-export.log`;
nessun server/Metro o emulatore lasciato attivo.

[F] Gli stati futuri non vengono nascosti o promossi a disponibili: Guided
richiede registrazioni vocali reali; le coppie musicali approvate sono vuote
dopo D-055/D-056 e richiedono revisione, non necessariamente nuove opere.
Ascolti singoli e sessioni naturali restano utilizzabili. Il QA tecnico dei
crossfade D-064 resta indipendente dalla produzione di nuovo materiale.

[U] Nessuno screenshot runtime ottenuto: il primo accesso locale precedeva
l'avvio del server e ha restituito connessione rifiutata; la selezione della
pagina d'errore è stata poi bloccata dalla policy del browser. Non sono stati
usati browser o percorsi alternativi per aggirarla. Resa visiva aggiornata:
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

[F] La PWA privata resta A01-A14.4 / Sites 5 con la barra precedente.
Nessuna pubblicazione, commit, push, nuovo audio o modifica ai master.

## D-065 - Aggiornamento privato crossfade, poi test umano prima del commit

Data: 6 settembre 2026
Stato: A01-A14.4 pubblicata, versione Sites 5; attesa dell'esito iPhone

[F] Robert richiede la PWA aggiornata da lasciare disponibile per un test
successivo; il commit canonico viene rimandato all'esito positivo del test.
Si riusa il Site privato, senza nuovi servizi, audio, acquisti o condivisione.
Fonte costi ricontrollata: Sites incluso nei piani idonei durante la beta
(https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost). Quota
numerica residua non esposta dal connettore; nessun gate di acquisto/upgrade
ha richiesto o ricevuto approvazione.

[F] Export PWA 111 file / 7.420.963 byte, zero audio/Workbench; pacchetto
locale 113 file regolari / 7.438.195 byte non compressi. Source isolata
`b9e714a47884870b086c889cdba502146970aef9`; versione
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_fcfcb1380eb08191b8fc96638cd7b3bd`.
Deployment `appgdep_6a9ca8dca3388191981de52c1c293575` succeeded, env revision 2.
Live: https://app-relax-private-review.robfulton.chatgpt.site.

[F] Verifica remota: 68 HTML con riferimento al bundle nuovo e 43 asset
byte-identici. Accesso custom, un solo proprietario, nessun gruppo/ospite;
anonimo HTTP 401. Worker, catalogo e binding AUDIO invariati. Test Worker
12/12 e suite crossfade rieseguita 92/92; regressione completa precedente
400/400. Handoff accodato nella scheda Codex già esistente.

[U] La richiesta API identity-less al catalogo riceve 401 dal controllo
identità: non è un nuovo test audio autenticato su iPhone. Non vengono
falsificati header di identità né allentata l'autenticazione. Qualità,
crossfade reali, latenza, offline remoto e long-run restano gate umani o
di piattaforma. Prove e metadata del pacchetto in
`dist/crossfade-publication.json`.

[F] HEAD canonico invariato `72346a089fca9d9235b1788acceab6eb0dcd455c`, index
vuoto. Commit/push eseguiti soltanto nel repository isolato richiesto da
Sites per la pubblicazione; nessun commit dell'app, push GitHub, EAS o build
nativa. Nessun server, emulatore o ascolto lasciato acceso. La PWA rimane
pubblicata e non viene modificata in attesa del riscontro di Robert.

## D-064 - Verifica crossfade indipendente dai brani

Data: 6 settembre 2026
Stato: correzioni e test locali; nessun aggiornamento della PWA pubblicata

[F] Robert precisa che i crossfade devono essere testati anche senza
approvare specifici abbinamenti, per verificare la solidità del codice.
Il Workbench e i test accelerati precedenti restano il riferimento; non si
vincola il QA tecnico alle coppie editoriali mancanti dopo D-055/D-056.

[F] Fixture senza asset: due corsie, transizioni lente e sfalsate, sessioni
virtuali fino a 90 minuti. Corrette curva frazionaria dopo seek, automazioni
vecchie su Resume, composizione ingresso/finale e gain iniziale nel finale,
ritardo di posizionamento della sorgente entrante (retry limitato e
cancellabile). L'audit respinge anche un piano vuoto. Nessuna modifica ai
brani, al catalogo, alle durate editoriali o all'architettura nativa.

[F] `pnpm test:crossfade`: 10 suite / 92 test; regressione completa:
62 suite / 400 test. Nuovi 18 casi, TypeScript e lint verdi.
Dettagli e prove ripetibili: `docs/CROSSFADE_QA.md`.

[U] API simulate e clock virtuale non certificano decoder, PCM renderizzato,
qualità sonora, long-run, background o latenza su iPhone/Android.
NON DETERMINATO — EVIDENZA INSUFFICIENTE per questi gate. D-063 descrive la
PWA pubblicata; D-064 resta locale, senza commit, push, EAS o pubblicazione.

## D-063 - Comandi immediati e personalizzazione visibile dopo il test iPhone

Data: 6 settembre 2026
Stato: A01-A14.3 verificata e pubblicata sul Site privato, versione 4

[F] Robert riferisce test iPhone positivo e suono pulito sulla versione già
pubblicata; apprezza i collegamenti Home, che restano invariati. Chiede comandi
Stop/Play/Pausa riconoscibili senza cercare il testo, minore attesa e recupero
della personalizzazione delle sessioni. Questo riscontro non prova offline,
background, tutti i decoder o long-run.

[F] Transport consumer condiviso: Stop quadrato a sinistra su terracotta,
Play/Pausa a destra su inchiostro, simboli 25–30 px, target minimo 80 px e
testo 18 px. Il player lo fissa sotto lo scroll con safe area; nella
navigazione la barra della sessione usa lo stesso ordine. Sfogliando un altro
suono compare un solo transport fisso per l'ascolto corrente, non due barre.
Il nuovo candidato mantiene un pulsante contestuale Play this sound.

[F] Stop durante un Play pendente aveva fino a tre richieste di arresto:
fire-and-forget, cleanup del Play e stop serializzato. Ora la cancellazione
esplicita è benigna: un solo arresto, nessun falso errore, Ready soltanto dopo
la conferma del driver. Uno Start cancellato non naviga come se fosse riuscito.
Non sono stati accorciati fade editoriali o rimossi i vincoli WebKit di avvio.

[F] Personalize your session è un'azione distinta prima di Start; espone
famiglia naturale, durata già scelta e ordine effettivo delle opere del piano.
Le sessioni naturali evolventi erano presenti ma nascoste in Customize.
Le sessioni musica più natura NON vengono dichiarate ripristinate: dopo D-055
e D-056 il registro delle coppie musicali autorizzate è vuoto. Serve una
nuova scelta/revisione di abbinamenti, non il recupero delle tracce respinte.
Guided resta IN PRODUCTION; nessun mixer libero o nuovo audio.

[U] Millisecondi risparmiati e percepibilità della nuova UI sull'iPhone:
NON DETERMINATO — EVIDENZA INSUFFICIENTE fino al confronto dell'utente.
L'audit read-only conferma guardie di invalidazione Web/PWA; rileva una race
preesistente nel driver nativo dopo await Start/Resume/Dispose, non risolta
dalla vecchia tripla richiesta Stop. Non viene promossa questa patch a
garanzia nativa: vedi docs/A01_NATIVE_GATE.md. Il gate offline D-062 resta
aperto; le correzioni .2 e .3 sono consegnate in un unico aggiornamento.

[F] Run finale: 61 suite / 382 test, regressione audio 128/128, TypeScript,
lint e format mirato verdi; Doctor 20/20, install-check e validatori verdi.
Un export iOS interrotto è stato respinto per metadata assente e rieseguito
da zero: ultimo export iOS/Android e confini Web/EAS tutti PASS. Shell PWA
111 file / 7.419.834 byte, senza audio. Versione privata 4, deployment
appgdep_6a9ca0c09b20819196171ae372b78a60 succeeded, environment revision 2.
Sorgente Sites isolata e3b3bae45dbcdf4673c90911df6db1aa090efdd1.
Accesso ricontrollato: un solo proprietario, zero gruppi/ospiti; AUDIO
invariato, nessun nuovo upload, servizio o acquisto. Canonical HEAD invariato
e staging vuoto. Prove in dist/a01-a14-gates/phone-controls-final-state.json.

## D-062 - Download verificato non equivale a riapertura offline pronta

Data: 5 settembre 2026
Stato: correzione software verificata; inclusa nell'aggiornamento privato A01-A14.3 pubblicato

[F] Dopo il fallimento remoto D-061, revisione mirata ha dimostrato che la
registrazione service worker era fire-and-forget; i test chiamavano install
e fetch senza verificare ready/controller. Il file OPFS verificato non
garantiva l'app shell. Il problema non viene attribuito a Sites senza prova.

[F] Introdotto gate separato e limitato nel tempo: register, ready, worker
esatto, controller e handshake di cache completa. La UI distingue download
audio da app pronta e propone controllo/ripristino online manuale, senza
interrompere l'ascolto o usare takeover. Nessun audio cancellato o ricaricato,
nessuna modifica di accesso o dipendenza. Test completi 60 suite / 377 verdi;
TypeScript, lint e formattazione verdi.

[U] Riapertura privata offline e iPhone restano NON DETERMINATO — EVIDENZA
INSUFFICIENTE fino alla nuova prova autorizzata; il blocco della pagina errore
del browser non viene aggirato. Nessun commit canonico, EAS o spesa.

## D-061 - Consolidamento A01–A14, offline PWA selettivo e limiti nativi

Data: 5 settembre 2026
Stato: software locale verificato; PWA privata versione 3 pubblicata; riapertura offline remota non superata

[F] UI consumer compatta con Home/Sounds, durata pertinente prima dello Start,
preparazione silenziosa isolata e avvio confermato nello stesso gesto. Barra
sessione persistente e ultimo ascolto single/adaptive; cronologia heard-only.
La matrice planner ammette 35 combinazioni naturali reali; Meditation 10 min
offre un'opera autonoma, non un piano incompatibile. Nessuna nuova coppia
musicale, voce o revisione editoriale è stata inventata.

[F] Download selettivo OPFS con hash del trasferimento e rilettura, spazio,
cancel/retry, rimozione reversibile e lease. Starter pioggia di 16.622.588 byte.
Prova localhost nel browser Codex senza rete, chiusura pagina e riapertura: Quiet Weather
in Play con timer 10:00 → 09:18. Non è una prova di iPhone installato né del
catalogo completo offline. La shell viene precacheata integralmente; audio e
Range restano fuori da Cache Storage. Gli aggiornamenti attendono la chiusura
dei vecchi client e non interrompono una sessione attiva.

[F] Doctor ha richiesto Expo 57.0.20 e Router 57.0.19. Metadata ufficiali npm
verificati; aggiornamento locale con pnpm 11.16.0 e store esistente, senza
installazioni globali. SDK 57/RN 0.86.3/RNAA 0.13.2 invariati. Un export PWA
ha rilevato nomi ATP nella cache di trasformazioni condivisa dopo export QA:
artefatto respinto dal validatore, non pubblicato. Gli script export ora
richiedono `--clear`; il gate non è stato allentato.

[F] Lo scheduler nativo e il resolver verificato sono implementati e testati,
ma la factory NON inietta storage nativo concreto: playback adattivo/offline
nativo resta fail-closed. Seek con tolleranza software fino a 100 ms e preload
progressivo JavaScript non attestano sample accuracy o background.

[F] Accesso Site ricontrollato: proprietario, una sola persona, zero ospiti o
gruppi. Si aggiorna soltanto il medesimo Site e binding AUDIO; nessun nuovo
upload audio. Sites risulta incluso nella beta dei piani idonei dalla fonte
ufficiale corrente; nessun upgrade, acquisto o nuovo servizio ammesso.
Fonte: https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost.

[F] Versione 3 A01-A14.1 pubblicata: deployment
`appgdep_6a9c2e5f3f8081918d569ed24f7e2f57` succeeded, environment revision 2;
sorgente Sites isolata `c0e50acd6157c83548443591e240b1358aa62e3e`.
Shell 111 file / 7.286.699 byte senza audio; 68 HTML e 43 asset remoti
verificati. Tutti i 37 file AUDIO esistenti sono coerenti; Start remoto
Meditation e Stop verificati. Jest finale 59 suite / 369 test verdi,
Doctor 20/20. Nessun commit/push canonico, EAS o nuovo servizio.

[F] Il Rain starter si scarica e verifica anche sul sito privato. La prova
di riapertura remota senza rete invece FALLISCE nel browser integrato.
[U] Causa e riapertura PWA privata offline: `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`. Non promuovere la prova localhost a certificazione remota.
La pagina d'errore blocca anche la pulizia automatica della scheda: nessun
aggiramento; chiusura manuale della sola scheda di test. Server 8095 spento.

[U] Gate telefono/installazione, VoiceOver/TalkBack, tutti i decoder,
background, lock screen, Bluetooth, batteria, qualità e long-run:
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Il dettaglio verificabile e il
protocollo sono in `docs/AUDIT_A01_A14.md`; nessun commit/push canonico o EAS.

## D-060 - Milestone A01–A14 e varietà subordinata alla disponibilità

Data: 5 settembre 2026
Stato: autorizzata, obiettivo aperto e implementazione in corso

[F] L'utente, dopo il test iPhone, richiede la risoluzione software di tutti i
rilievi A01–A14 e una nuova PWA privata soltanto a costo aggiuntivo zero
verificato. Nessun nuovo catalogo, commit/push canonico, EAS, acquisto o
diffusione pubblica. Si riusa il Site e la delivery D-059; il gate nativo e
l'ascolto umano restano distinti dal Web.

[F] Viene approvata PRIMA dell'implementazione la revisione della sola
esclusione rigida FRA sessioni di D-047: la storia recente guida una
preferenza deterministica, non rende indisponibili opere altrimenti sicure.
Nella stessa sessione restano vietate ripetizioni di opera e famiglia; tutti
i vincoli editoriali, armonici, di fase, integrità e transizione restano duri.
La cronologia registra esclusivamente opere il cui ascolto è realmente
iniziato, non tutte le sorgenti pianificate al primo Play. Non viene
introdotto un replay identico consumer del seed QA.

[F] Stato iniziale protetto in `tmp/audit-a01-a14-baseline`: 251 file sorgente
non audio, hash, HEAD e stato Git. Baseline M4/M5 e modifiche preesistenti
preservate. Lavori indipendenti nativo/offline usano worktree separati;
integrazione selettiva, nessun agente scrive contemporaneamente nel canonico.

[I] Direzione: medesimi sei bisogni e artwork, Home compatta, proposta pronta
e durata prima dello Start, sessione persistente, errori recuperabili e
download locali espliciti. Hatha dolce/slow flow è un contratto di ruoli e
finestre future: Do maggiore e scansione proposta non sono musica approvata.
Crossfade musicale 180 secondi conservato; nessuna nuova coppia abilitata.

[U] Matrice delle evidenze A01–A14 in `docs/AUDIT_A01_A14.md`. Nessun rilievo
si considera risolto per la sola assenza di un test; telefono, offline reale,
persone e release rimangono gate espliciti fino a prova.

## D-059 - PWA privata online con 37 audio integri, import chiuso

Data: 5 settembre 2026
Stato: pubblicata privatamente; ascolto e installazione iPhone da confermare

[F] Ripresa autorizzata dopo lo sblocco della rete. Riutilizzato il Site
`appgprj_6a9bed84f78c81919575b1cbe1876cd1`, senza ampliare l'accesso:
una sola persona proprietaria, zero gruppi/ospiti. URL HTTPS live:
https://app-relax-private-review.robfulton.chatgpt.site.

[F] Versione pubblicata:
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_d2aa3d602af48191b60e97b310c31263`.
Deployment `appgdep_6a9bf8cd69b481919471b35af980a511`: `succeeded`,
environment revision 2. Sorgente isolata Sites:
`e519d75889430b033b1bb4f16f27bb5dcabd1013`; nessun commit/push del
repository canonico App-Relax. La correzione locale del solo checker hosted
riconosce anche il fallback offline, che non contiene il bundle Expo.

[F] Import completato: 37/37 file, 2.657.446.897 byte. Originali read-only;
SHA-256 locale e checksum completo R2 verificati, HEAD/dimensioni/hash e primi
e ultimi 16 byte remoti coerenti per ogni file. I grandi file usano multipart
64 MiB e promozione streaming con checksum verso chiave immutabile. Catalogo
fuori da shell/Git/EAS; nessuna ricodifica, compressione lossy o duplicazione
dei master. Restano escluse le opere respinte.

[F] La chiave temporanea di importazione e la scadenza sono state rimosse e
la revisione applicata tramite nuovo deployment. Dopo la chiusura, richieste
anonime a Home/catalogo e richieste import con vecchia chiave ricevono 401.
L'accesso audio normale usa l'identità ChatGPT verificata dalla piattaforma.
Il token operativo Sites non è inserito nel codice o nell'artefatto.

[F] Verifiche: Worker 12/12; audit dipendenze Site zero vulnerabilità; shell
remota 109/109 file (68 HTML inclusa la pagina offline, 41 asset non HTML
byte-identici). Sites può aggiungere il proprio bridge HTML; i 67 percorsi
dell'app mantengono il bundle esportato. Gli asset statici sono serviti dalla
piattaforma prima del Worker: il controllo `review-ready` del fallback Worker
non è una barriera globale alla Home. La consegna avviene solo dopo la verifica
di tutti i 37 audio; gli oggetti audio mancanti o incoerenti falliscono chiusi.

[F] Browser Codex autenticato: Home e catalogo visibili; Low Rain in Play con
timer in avanzamento. Dopo la chiusura import, Misted Garden ha raggiunto Pause
e 29:34 da 30:00; Stop eseguito. Un primo tentativo ha riportato una richiesta
Play interrotta da nuovo caricamento; dopo ricarica completa il test è passato.
Non si deduce da questo una correzione generale della compatibilità mobile.

[F] Nessun costo aggiuntivo, acquisto, abbonamento esterno, EAS o store
attivato. Sites resta soggetto ai limiti inclusi del piano; fermarsi prima di
qualunque richiesta di pagamento. Il telefono non necessita del Mac acceso.

[U] Ascolto di tutti i file e installazione su iPhone, offline audio,
background/lock screen e robustezza lunga: `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`. Guided, pacchetti offline e abbinamenti musicali privi di
approvazione restano onestamente `IN PRODUCTION`.

## D-058 - Pubblicazione privata PWA autorizzata, arresto prima di costi

Data: 5 settembre 2026
Stato storico: blocco superato dalla ripresa e dalla pubblicazione D-059

[F] L'utente, collegato da iPhone, autorizza esplicitamente la predisposizione
di una pubblicazione privata con tutti i 37 audio approvati, fermandosi prima
di qualsiasi costo. Questa decisione supera il precedente divieto di upload
e pubblicazione soltanto per questa prova privata; non autorizza gli store,
EAS, GitHub push, acquisti, servizi a pagamento o la modifica dei master.

[F] Verificate le pagine ufficiali Sites e Pricing: Sites è incluso nei piani
ChatGPT idonei durante la beta, con limiti di utilizzo. Non viene attivato un
abbonamento Cloudflare separato. In caso di quota insufficiente o richiesta
di pagamento, arrestarsi senza upgrade o acquisti.

[F] Creato una sola volta `App Relax — Private iPhone Review`, id
`appgprj_6a9bed84f78c81919575b1cbe1876cd1`. Il controllo successivo conferma
owner, accesso custom, una sola persona ammessa, zero ospiti e zero gruppi;
versione 0 e nessun URL live. Non dichiarare la PWA pubblicata.

[F] Snapshot della shell in `tmp/pwa-private-site/public`: 109 file,
7.282.973 byte, identici all'export verificato. La registrazione è conservata
in `tmp/pwa-private-site/.openai/hosting.json`; nessuna credenziale viene
salvata. Directory ignorata da Git/EAS, separata dalle aree Strategia.
Il binding R2 `AUDIO` è soltanto predisposto: storage, import e adapter di
delivery non sono ancora implementati/provisionati/verificati.

[F] Il catalogo rimane read-only sul Mac: 37 file, 2.657.446.897 byte;
17 file superano 25 MiB e il maggiore misura 345.312.044 byte. Non inserirlo
negli asset statici o nel repository del sito. Nessun audio è stato caricato.

[F] Il preflight e i 12 test HTTP locali passano nuovamente. Sono prove con
richieste simulate, non ascolti nel browser o test di hosting.

[U] I comandi locali non risolvono `git.chatgpt-team.site` né
`learn.chatgpt.com` (`curl` exit 6). Le chiamate del connettore funzionano,
ma non sostituiscono il trasferimento sorgente obbligatorio del workflow
Sites. Nessun commit, push, versione, upload audio o deployment eseguito.
Riprendere solo con accesso rete consentito per il server sorgente e per
l'origin privato; non aggirare il sandbox. Il runbook è in `docs/PWA.md`.

[U] Runtime, delivery, accesso da iPhone, installazione e ascolto restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

Fonti: [Sites](https://learn.chatgpt.com/docs/sites),
[Pricing](https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost),
[Sandboxing](https://learn.chatgpt.com/docs/sandboxing).

## D-057 - PWA consumer complementare, shell leggera e audio on-demand

Data: 5 settembre 2026
Stato: implementata localmente; gate runtime iPhone e pubblicazione aperti

[F] Su richiesta esplicita dell'utente viene introdotta una PWA come superficie
consumer complementare. Non sostituisce l'app nativa e non modifica i gate
nativi per background, lock screen, Bluetooth, batteria o qualità sonora su
telefono reale.

[F] La PWA usa la radice Router separata `src/app-pwa` e lo stesso linguaggio
consumer-paper. Include Home, Yoga, Soundscapes, i sei outcome, sessioni
adattive, player, Settings e Legal; esclude Workbench QA, Audio Test, preset
tecnico e route legacy. Il confine `AudioProvider` riceve una factory driver e
il driver Web riceve un resolver sorgenti: l'export PWA non trascina più i tre
WAV ATP01 attraverso il grafo degli import.

[F] L'artefatto non incorpora WAV, FLAC o `public/audio-catalog/`. Predispone
45 route player: 37 opere approvate che richiedono una delivery same-origin
non ancora pubblicata e otto generatori runtime. La PWA rifiuta stem e opere
ATP01 incorporate; `Soft Air`, `Moon Drone`, `Deep River`, Eclipse Veil e
Stillwater Halo restano fuori dalla sua superficie.

[F] L'audio di produzione è consentito soltanto dal contratto esplicito
same-origin `/audio-catalog/` in secure context. Il service worker precachea un
fallback minimo, usa network-first per risorse non audio visitate e bypassa
audio, WAV, FLAC e richieste Range. La PWA è predisposta all'installazione;
riapertura offline completa e disponibilità offline dei suoni non vengono
dichiarate.

[F] `web:pwa` serve direttamente l'export con un singolo processo Node su
loopback, senza Metro, symlink o compilazioni. Le URL pulite puntano alle
pagine esportate; i 37 audio autorizzati dal manifest sono letti dalla
posizione originale con GET/HEAD/Range 206 e MIME espliciti. Il comando
`Avvia PWA.command` usa il runtime già installato e rende l'avvio eseguibile
dal Finder. Un link `file://` a `index.html` non è un avvio valido della PWA.
`export:web:pwa` produce la shell statica e
`pwa:validate` controlla confini, manifest, icone, hash, route, assenza audio e
dimensioni.

[F] Su Web il primo Play resta un gesto esplicito. I deck futuri confermano
Play prima di essere messi in pausa e l'attesa complessiva è limitata a 10
secondi: un browser che non conferma fallisce chiuso, ferma i deck e libera la
coda dei comandi invece di lasciare l'interfaccia bloccata.

[F] L'export consolidato contiene 109 file per 7.282.973 byte, 67 route
statiche totali e 45 player predisposti. Il validatore conferma zero WAV/FLAC,
catalogo, Audio Test o Workbench nell'artefatto.

[U] Il server locale non può essere avviato dentro la sandbox corrente perché
il bind TCP è negato con `EPERM`; il comportamento runtime resta `NON
DETERMINATO — EVIDENZA INSUFFICIENTE`. Il preflight locale e 12 prove del
gestore HTTP sono verdi, inclusi HEAD e intervalli iniziali/finali dei 37
file; non viene dichiarato un ascolto reale da richieste simulate. HTTPS,
clean-URL rewrite sul futuro host pubblico, delivery dei
2,6 GiB, installazione, riapertura offline completa e ascolto su iPhone
richiedono un gate separato.

[F] Nessun deploy, account, upload, EAS, commit, push o pubblicazione è
autorizzato da questa decisione.

## D-056 - Nirvana Waves eliminato dal catalogo dell'app

Data: 4 settembre 2026
Stato: decisione umana applicata e verificata localmente; non committata

[F] L'utente ha ordinato di eliminare anche `Nirvana Waves`, pubblicato
nell'app come `Stillwater Halo`. Questa decisione supera D-044 e ogni
successiva disponibilità dell'opera; non viene inferita una motivazione diversa
dall'ordine esplicito ricevuto.

[F] Sono rimossi il record `stillwater-halo`, l'assetKey `nirvanaWaves001`, la
route generata, la copia WAV della Review localhost da 48.960.044 byte e la
copia FLAC del sidecar QA Android da 26.858.497 byte. La preview locale contiene
ora 37 file per 2.657.446.897 byte; il catalogo contiene 48 entità, 40
file-backed, 37 approvate, 47 riproducibili nella Review, 33 transition-ready,
14 single-only e una respinta.

[F] Il master canonico esterno, i derivati di archivio e
`docs/M4_LOSSLESS_DERIVATIVE_REPORT.json` restano intatti come prova storica;
non descrivono disponibilità nell'app e non autorizzano la reintroduzione.

[F] `Stillwater Halo → Quiet Field` era l'unica coppia musicale autorizzata.
Dopo la rimozione non resta alcuna coppia musicale consumer: `Music + nature`
è visibile ma disabilitato come `IN PRODUCTION`, le richieste musicali falliscono
chiuse e le vecchie sessioni salvate non vengono convertite silenziosamente.
Le sessioni naturali restano operative; nessun nuovo abbinamento è inventato.

[F] Con Node 22.23.1 sono verdi formattazione, lint, TypeScript, 39 suite / 185
test, regressione audio 55/55, validatori audio/asset/config/sicurezza/QA ed
export Web. Gli export iOS e Android correnti non contengono stringhe
Nirvana/Stillwater e includono esattamente i tre WAV ATP01 per 155.520.132
byte; misurano rispettivamente 162.490.591 e 163.646.202 byte. Il sidecar QA
Android locale contiene ora 37 FLAC per 1.635.181.380 byte.

[U] Build native/cloud e prova su telefono restano `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`; non sono state autorizzate né eseguite. Expo Doctor passa 18/20
controlli: i due controlli remoti non sono determinabili perché la sandbox non
può raggiungere `exp.host`.

## D-055 - Eclypsis escluso dal catalogo dopo il test d'ascolto

Data: 4 settembre 2026
Stato: decisione umana applicata e verificata localmente; non committata

[F] L'utente ha respinto `Eclypsis` / `Eclipse Veil` perché il risultato è
percepito come troppo dissonante e ne ha ordinato l'eliminazione dal catalogo
dell'app. D-055 supera le precedenti decisioni che lo indicavano disponibile o
approvato.

[F] Sono rimossi il record `eclipse-veil`, l'assetKey `eclypsis001`, il mapping
nativo, le relazioni Continuum, la route generata dal catalogo e il FLAC starter
incorporato da 28.167.925 byte. Il pacchetto consumer non contiene più FLAC
starter; gli export mobili devono contenere soltanto i tre WAV ATP01 per
155.520.132 byte.

[F] Il master canonico esterno e i derivati di archivio non vengono cancellati,
rinominati o modificati. `docs/M4_LOSSLESS_DERIVATIVE_REPORT.json` resta prova
storica della conversione lossless e non descrive la disponibilità corrente.

[F] Al momento di D-055 la sola relazione musicale ancora autorizzata era
Stillwater Halo → Quiet Field. D-056 ha poi eliminato Nirvana Waves / Stillwater
Halo e azzerato le coppie musicali consumer; nessun sostituto è stato inventato.

[F] Con Node 22.23.1 sono verdi formattazione, lint, TypeScript, 39 suite / 184
test, regressione audio 55/55, validatori audio/asset/config/sicurezza/QA e gli
export Web. I nuovi export iOS e Android contengono esattamente tre WAV ATP01,
nessun FLAC e misurano rispettivamente 162.490.586 e 163.646.167 byte.

[U] Un nuovo archivio EAS e una build installabile non sono stati generati:
restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al gate separatamente
autorizzato. Expo Doctor passa 18/20 controlli; i due controlli remoti non sono
eseguibili con la rete sandbox disabilitata.

## D-054 - Correzione del caricamento FLAC nella Review iPhone

Data: 4 settembre 2026
Stato: patch locale verificata; nuova prova iPhone richiesta

[F] La prova iPhone ha raggiunto la sessione Meditation 20 minuti con Eclipse
Veil e Night Shore, ma Play ha mostrato `Session source 0 could not be
decoded.` Il source index 0 del piano e Eclipse Veil. L'errore precedente non
leggeva pero `HTMLMediaElement.error`: chiamava impropriamente "decode" ogni
evento media, inclusi rete, abort e formato non supportato.

[F] Eclipse Veil e integro: 28.167.925 byte, FLAC 24-bit/48 kHz/stereo,
8.295.000 frame; SHA-256 e decode completo via HTTP coincidono con le prove
registrate. HEAD e Range rispondono 200/206. Il server dichiarava invece
`audio/x-flac` insieme a `nosniff`; RFC 9639 registra `audio/flac` e marca
`audio/x-flac` come alias deprecato.

[F] Metro ora forza `Content-Type: audio/flac` per ogni risposta FLAC, inclusi
asset Metro e catalogo pubblico, conservando byte range e file invariati. Il
player adattivo non precarica piu tutte le sorgenti future: prepara soltanto le
sorgenti attive e al massimo la prossima in ordine temporale, mantenendo non
piu di tre elementi media allocati nella partenza musica+natura. Gli errori
riportano ora titolo, corsia, indice e codice `MediaError` reale.

[F] Dopo il riavvio, Eclipse Veil e Night Shore rispondono entrambi come
`audio/flac`; Range 0-63 risponde 206. La sessione musica piu onde ha raggiunto
Playing nel browser interno e il timer e avanzato. Config validator, lint,
TypeScript e Jest sono verdi: 39 suite, 183 test.

[U] Il risultato sul browser iPhone resta `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`. D-055 ha poi escluso Eclipse dal prodotto per ragioni d'ascolto,
quindi non è richiesto un fallback consumer; nessun fallback lossy viene
assunto.

## D-053 - Anteprima consumer iPhone su LAN privata, senza pacchetto audio

Data: 4 settembre 2026
Stato: implementata localmente; prova iPhone aperta

[F] `localhost` aperto sull'iPhone indica il telefono stesso e non il Mac. Il
nuovo comando `web:iphone` individua quindi l'IPv4 privata dell'interfaccia di
rete predefinita e avvia una modalità LAN consumer separata. Il gate applicativo
accetta soltanto l'host esatto comunicato dal launcher, in development e nel
solo spazio IPv4 privato; IP pubblico, hostname, produzione e tunnel falliscono
chiusi. Il launcher forza inoltre `APP_RELAX_SURFACE=consumer`, anche se la shell
avesse conservato una vecchia variabile QA. I comandi ordinari `web` e `web:qa`
restano vincolati a loopback.

[F] Non viene creato un artifact da 2,6 GiB né copiato il catalogo: Expo serve
dal Mac soltanto i file richiesti dal browser, e il server supporta le richieste
HTTP Range necessarie a caricamento e seek. Gli export mobili continuano a
usare `public-mobile`; nessun file del catalogo entra in Git, EAS o build.

[F] La route consumer caricata dalla LAN non tenta autoplay dopo la
navigazione: mostra `IPHONE PREVIEW · TAP PLAY TO BEGIN` e attende il gesto
diretto richiesto dai browser iOS. La superficie QA/Workbench non viene esposta
da questo comando.

[F] Dal browser interno Codex, usando l'indirizzo LAN e non localhost, la Home
consumer e la route Relax musica+natura si sono caricate. Il tap Play ha portato
il controllo a Pause e fatto avanzare il timer; Stop ha ripristinato 20:00. La
singola opera Open Tide ha superato lo stesso ciclo Play/Pause/Stop. Una
richiesta parziale a un FLAC Rain ha restituito `206 Partial Content`,
`Accept-Ranges: bytes` e il range esatto richiesto. Un riavvio di prova con
`APP_RELAX_SURFACE=qa` nella shell ha comunque servito la Home consumer.

[F] Expo `--lan` lega il server a tutte le interfacce locali: l'exact-host è un
gate della logica di playback, non un'autenticazione né una ACL degli asset.
Durante l'esecuzione i file pubblici possono quindi essere richiesti anche
tramite un altro indirizzo locale del Mac.

[F] Dopo la richiesta esplicita dell'utente, lo stesso launcher supporta una
modalità `--review`: forza la radice QA, la cartella pubblica locale e apre
direttamente `/qa-workbench`. La Review conserva anche le route consumer e usa
lo stesso `ConsumerPlaybackSurface`, aggiungendo catalogo completo, ascolto
singolo, A/B, sessione e scrubber. Non modifica EAS né gli export.

[F] Audit di consegna LAN: tutti i 38 file del manifest locale hanno risposto
con HEAD `200`, Range `206`, MIME e byte coerenti, per 2.706.406.941 byte. Anche
Eclipse Veil, Moon Drone e Deep River incorporati rispondono correttamente. Gli
otto noise sono generatori runtime. Soft Air è l'unica voce intenzionalmente
bloccata dopo il rifiuto d'ascolto: il suo WAV tecnico esiste, ma non è un path
consumer rotto.

[F] Nella radice Review effettivamente servita su LAN, il browser interno ha
raggiunto lo stato Playing sia con Open Tide, FLAC naturale da 26.805.900 byte,
sia con Aquarian Echo, WAV musicale da 345.312.044 byte e file piu grande del
manifest. Timer e posizione file sono avanzati; l'audio di prova e stato poi
fermato. Il launcher imposta inoltre `BROWSER=none`, cosi non apre Chrome in
parallelo alla Review richiesta nel browser interno.

[F] Un audit ffprobe 8.1.2 su 38/38 file non ha trovato container o codec
anomali: i 14 WAV sono RIFF/WAVE PCM standard 24-bit/48 kHz/stereo; i 24 FLAC
sono lossless 24-bit/48 kHz/stereo; durate e frame coincidono. I soli outlier
operativi sono nove WAV fra 124 e 329 MiB. La dimensione puo aumentare latenza,
banda e costo di seek su mobile, ma non dimostra da sola il difetto riferito.

[U] Compatibilità effettiva di ogni FLAC, seek, decoder simultanei e crossfade
su Safari/Chrome iOS resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino alla
prova sul dispositivo. Durante l'esecuzione il catalogo è raggiungibile dagli
altri dispositivi della stessa rete: usare soltanto una Wi-Fi fidata e spegnere
il server dopo il test.

## D-052 - Il catalogo localhost e separato dagli export mobili

Data: 3 settembre 2026
Stato: difesa locale implementata e verificata; archivio EAS non eseguito

[F] Expo SDK 57 copia ricorsivamente la cartella pubblica anche durante un
export iOS o Android. Una prova dal checkout reale con il comando grezzo ha
quindi incluso i 38 file di `public/audio-catalog/` per 2.706.406.941 byte,
nonostante non fossero asset Metro. `.easignore` protegge l'archivio sorgente
EAS, ma non governa questo passaggio locale.

[F] Gli script export consumer impostano ora
`EXPO_PUBLIC_FOLDER=public-mobile`, una radice pubblica separata e vuota. Il
server QA localhost continua invece a usare `public/`, quindi tutte le opere
restano ascoltabili nel Workbench senza entrare nel pacchetto mobile. I tre
profili EAS fissano la stessa variabile e `.easignore` conserva l'esclusione
esplicita come seconda difesa.

[F] Il validatore degli export legge `metadata.json`, confronta SHA-256,
estensione e dimensione dei soli tre WAV ATP01 e del FLAC starter, scansiona
l'intero output e fallisce su `audio-catalog`, WAV/FLAC pubblici non processati,
file oltre 100 MiB o output oltre 512 MiB. Le prove pulite misurano iOS
190.634.511 byte e Android 191.790.133 byte; gli audio autorizzati sono
183.688.057 byte su entrambe le piattaforme.

[U] Nessun archivio sorgente EAS reale e stato generato o caricato. Il suo
contenuto resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino a un gate EAS
separatamente autorizzato.

## D-051 - Il Workbench mostra il player consumer e l'intero catalogo

Data: 3 settembre 2026
Stato: implementato localmente dopo feedback utente; approvazione e commit aperti

[F] Il Workbench non usa piu una shell scura separata come rappresentazione
del prodotto. `ConsumerPlaybackSurface` e condiviso dai player single-track,
adattivo e QA: l'utente vede artwork, gerarchia, timer, Play/Pause/Stop e volume
della stessa superficie consumer, mentre i controlli tecnici restano sotto o
accanto in una cornice development-only.

[F] Il catalogo QA elenca 50 entita. Quarantanove sono riproducibili
singolarmente sul localhost; `Soft Air` resta visibile ma bloccato per il
precedente rifiuto all'ascolto. Trentanove file approvati dispongono di profilo
Continuum e sono selezionabili direttamente come A/B. Noise e ATP01
provvisori restano single-only e non vengono promossi artificialmente a
transizioni.

[F] La selezione A/B compila un piano QA esatto a due sorgenti soltanto dopo il
superamento delle regole di compatibilita esistenti e della fattibilita
temporale: `READY` compare soltanto se un safe exit dell'uscente entra nella
durata QA scelta. Una coppia incompatibile o troppo lunga per quella finestra
fallisce chiusa con le ragioni leggibili. I comandi `OPEN A/B FILE + SCRUB`
aprono inoltre ciascuna sorgente completa nello stesso player consumer,
preservando la coppia quando si torna alla transizione. Il planner consumer
deterministico non viene modificato.

[F] Il difetto dello scrubber dipendeva da `locationX`, assente nel click DOM
ricevuto da React Native Web. Il controllo usa ora coordinate normalizzate,
supporta click e drag, carica il piano prima del primo seek e disattiva
l'eventuale finestra di audition. I controlli accessibili consentono anche
salti di dieci secondi. Una seconda barra nella modalita single-track controlla
la posizione reale dentro ciascuno dei 41 file riproducibili; gli otto noise
runtime sono generatori continui e non fingono una posizione file. Il driver
Web e il dual-deck condividono la stessa conferma: ogni sorgente attiva deve
emettere `seeked` e trovarsi entro 20 ms dal punto richiesto prima che Play o il
seek siano dichiarati riusciti. All'avvio dentro un overlap, entrambi i deck
vengono preparati e verificati prima di invocare qualunque Play; se uno fallisce
mentre l'altro e ancora pendente, il sistema attende il suo esito, mantiene
tutto silenzioso e pulisce entrambi. Timeout, posizione diversa o errore
falliscono chiusi, fermano il driver e riportano lo scrubber al punto
precedente, quindi la UI non anticipa piu la posizione sonora effettiva.

[F] Cambio modalita, installazione del piano e Play sono serializzati e
cancellabili. Il Workbench ferma la sorgente precedente prima di cambiare cio
che mostra; mantiene inoltre piani separati per sessione completa e coppia
diretta. Lo stato Play/Pause/Stop viene riferito soltanto all'opera o al piano
realmente caricato. Il cambio modalita azzera sempre l'indice di transizione e
gli errori assorbiti dal controller vengono verificati prima di mostrare un
messaggio `Playing`.

[F] La disponibilita completa fallisce chiusa fuori da Web, fuori da localhost
o in `NODE_ENV=production`; gli script `web` e `web:qa` usano inoltre
`--localhost`, impedendo al server dei 2,6 GiB di legarsi alla LAN. Anche il
player consumer single-track rifiuta i file `local-preview-file` fuori da
questo perimetro. Dopo un cambio modalita volume e mute restano
visibili ma disabilitati fino al caricamento del programma mostrato, impedendo
che modifichino una sorgente precedente nascosta.

[F] Il catalogo esterno completo e il dual-deck sono disponibili soltanto nel
Workbench Web localhost. La radice QA puo rappresentare il contratto su una
development build, ma blocca e dichiara indisponibile quel playback su native:
non finge che 2,6 GiB di asset siano incorporati o gia scaricati.

[F] La prova nella scheda interna Codex ha avviato Open Tide nello stesso
player consumer, spostato il file con click e drag fino a 01:56/02:28,
verificato i salti di dieci secondi e fermato l'audio al cambio modalita. La
coppia Open Tide → Tidal Breath e stata portata a 09:40, esattamente all'inizio
del crossfade, avviata soltanto dopo la conferma delle sorgenti, ascoltata oltre
la fine del cambio a 09:52 e poi messa in pausa. Un secondo test ha spostato la
sessione direttamente da 00:00 a 10:00 tramite click sulla barra prima di
riportarla a 09:40. La console browser non ha registrato errori o avvisi. Questa
e prova del percorso Web locale; non certifica precisione nativa del seek,
decoder simultanei o crossfade su dispositivo.

[U] Qualita musicale delle coppie, comportamento nativo e approvazione finale
della nuova superficie restano gate umani separati. La revisione non e ancora
committata; push, EAS e build non sono autorizzati.

## D-042 - Patch SDK 57 e correzione decode-uri-component

Data: 2 settembre 2026
Stato: verificato localmente

[F] `expo install --check` ha richiesto le patch correnti della stessa baseline
SDK 57: Expo 57.0.19, Expo Router 57.0.18 e React Native 0.86.3, con i relativi
moduli Expo e preset di test. L'aggiornamento non cambia SDK o architettura.
Peer check, Expo install check, Expo Doctor 20/20, lint, TypeScript, test ed
export Metro Android/iOS sono verdi.

[F] Il refresh audit ha rilevato GHSA-vcc3-ghjq-m6fr nella dipendenza transitiva
`decode-uri-component` 0.2.2 via `query-string`/Expo Router. La versione corretta
è 0.5.0; un override pnpm riproducibile la applica senza cambiare API dell'app.
Fonti primarie: [GitHub Advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr),
[release 0.5.0](https://github.com/SamVerschueren/decode-uri-component/releases/tag/v0.5.0).

[F] L'audit policy passa con i soli due advisory `image-size` già accettati e
vincolati dal validator degli asset. Nessun nuovo residuo è stato allowlistato.

## D-041 - Noise Colours come sorgenti consumer autonome

Data: 2 settembre 2026
Stato: implementato localmente; ascolto reale aperto

[F] Su richiesta esplicita dell'utente, il catalogo aggiunge otto generatori
runtime: White, Pink, Brown/Red, Blue/Azure, Violet/Purple, Grey/Gray, Green e
Black. Gli alias non duplicano sorgenti. Ogni programma riproduce un solo buffer in
loop attraverso lo stesso controller consumer: nessun layering, mixer o nuovo
file audio.

[F] White/Pink/Brown/Blue/Violet sono profili spettrali tecnici; Grey, Green e
Black sono etichettati come profili non standard. Black è definito
editorialmente come profilo profondo con intervalli quieti lenti, non come uno
standard universale. Stop e Mute restano i controlli del silenzio.

[F] Ogni buffer stereo Float32 48 kHz viene creato una sola volta al load, non
nel callback audio: 384.000 frame / 8 secondi, sample peak 0,5, crossfade di
confine e gain interno -6 dB. Il costo audio nel pacchetto è zero; il buffer
temporaneo vale circa 3,1 MB includendo i due canali.

[U] True peak inter-sample, raccordo percepito, qualità, fatica d'ascolto,
background e stabilità restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino
al test su telefono Android reale. L'emulatore non è un gate d'ascolto valido.

## D-040 - Commit locale M3/M4 autorizzato

Data: 2 settembre 2026
Stato: autorizzato dall'utente

[F] L'utente ha richiesto esplicitamente `Commit`. L'autorizzazione comprende
un commit locale delle modifiche M3/M4 presenti e verificate nel worktree.

[F] L'autorizzazione non comprende push, pull request, EAS, build cloud,
pubblicazione, Git LFS o asset delivery. `output/strategia-app-audio/`,
`tmp/strategia-app-audio/` e gli screenshot ignorati in `dist/` restano esclusi.

## D-039 - M4: catalogo consumer autonomo e lossless

Data: 1 settembre 2026
Stato: implementato localmente; runtime e listening gate aperti

[F] L'autorizzazione M4 supera il limite M3 sui nuovi asset soltanto per il pack
`APP_READY_AUDIO_01`. Le 18 registrazioni sono entità autonome; le vecchie
coppie pad/piano sono varianti editoriali separate e non possono essere
sommate. `Moon Current`, `deep-sleep-432` e il mixer restano confinati nel test
tecnico.

[F] Il modello `ConsumerAudioWork` e il programma `SingleTrackProgram` sono
separati dal contratto fisso a tre stem. Il player consumer usa un solo file,
timer, trasporto e volume principale; il gain interno porta ciascuna proposta
verso -18 LUFS mantenendo il true peak post-gain sotto -1 dBTP.

[F] I master restano WAV esterni. I derivati app sono FLAC lossless stereo
PCM24/48 kHz level 8. Il PCM decodificato dei 18 file è hash-identico al WAV;
il totale scende da 2.563.271.952 a 1.455.254.377 byte (-43,2267%).

[F] Un solo FLAC da 28.167.925 byte entra nello starter; gli altri derivati
restano esterni. Quattro lavori sono quindi referenziabili localmente: Eclipse
Veil e i tre ATP01 riusati. Yoga e Massage restano disabilitati perché nessun
asset delle rispettive proposte è incorporato.

[F] Il flusso outcome rispetta il massimo di due tocchi: il primo apre la lista
filtrata, che ordina il primo asset incorporato in testa; il secondo avvia quel
featured nel player dopo il completamento del load. La navigazione diretta da
Soundscapes e le opere non featured non attivano autoplay.

[F] Gli export Metro Android e iOS contengono ciascuno esattamente tre WAV ATP01
e lo starter FLAC, 183.688.057 byte audio totali, con hash attesi. Prettier,
lint, TypeScript, test, regressione audio, validatori asset/config e verifica
PCM sono verdi.

[F] Per il gate visivo sono disponibili quattro render statici ad alta
risoluzione in `dist/m4-screenshots/`: Home, outcome Relax filtrato,
Soundscapes e player. Usano copy, font, palette e artwork correnti e sono stati
ispezionati visivamente; non dimostrano esecuzione runtime né playback.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: decoder/loop FLAC a runtime,
qualità, titoli e mapping fino a test Android e approvazione d'ascolto; screenshot
M4 finché la sandbox non consente un renderer; due controlli Expo Doctor e il
refresh dell'audit dipendenze finché manca rete. Git LFS o asset delivery
richiedono autorizzazione separata; non è stato configurato alcun workaround.

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
Stato: struttura preservata; visual revision riaperta in D-037

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
Stato: asset preservato; resa corretta in D-037

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

## D-037 - Correzione dimensionale e Home pittorica compatta

Data: 15 agosto 2026
Stato: implementata localmente; approvazione umana aperta

[F] Lo screenshot successivo al commit ha mostrato un difetto di layout reale,
non l'assenza degli asset: React Native Web manteneva le dimensioni intrinseche
dei JPEG. Nel viewport 390×844 il fondale risultava 864×1821 e ogni artwork alto
720 px; la prima tile raggiungeva circa 1.010 px. Restavano visibili soltanto la
zona pallida dello sfondo e frammenti delle immagini.

[F] `EditorialScreen` forza ora il fondale al 100% del viewport e riduce la
velatura inferiore. `OutcomeGridTile` usa un frame con rapporto esplicito e
immagine 100%×100%; la tile Yoga misurata via browser scende a circa 357 px e il
suo artwork a circa 131 px. La barra primaria scende da 68 a 52 px, mentre ogni
tab resta alta 48 px e supera il target minimo di 44 px.

[F] La Home conserva sei outcome equivalenti, CTA, formato, titolo futuro e
stato `IN PRODUCTION`; rimuove soltanto il kicker `RITUALS` duplicato. Audio,
navigazione, asset e route consumer non cambiano. La nuova prova web è
`dist/m3-screenshots/01-home-compact-painterly-revision.jpg`, 390×844, SHA-256
`c2bee77684f2bcd60dadfe5c9f74c87591d7ac4ca1a36344cc6d64dcb05b7da6`.

## D-038 - Spettro pastello funzionale nei sei outcome

Data: 15 agosto 2026
Stato: implementata localmente; approvazione umana aperta

[F] L'utente ha richiesto di rendere realmente percepibili i pastelli in tutte
le loro sfumature. I dati dei sei outcome contenevano già coppie `accent` e
`wash`, ma la Home le copriva con pannelli carta quasi bianchi.

[F] Ogni box usa ora una composizione rettangolare a quattro toni: testata
pastello pieno, corpo pastello chiaro opaco, hairline nella relativa tinta
`wash` e accento editoriale scuro per il titolo futuro. La sequenza è giada per
Yoga, pesca/rosa polvere per Massage, acqua marina per Relax, blu minerale per
Meditation, lavanda per Sleep e zafferano per Focus. Gli artwork restano
inalterati e non filtrati; non sono stati introdotti blob, pillole o gradienti
digitali.

[F] I test di tema verificano per tutti e sei i box contrasto almeno 4,5:1 di
testo e accenti sui relativi fondi. L'anteprima web 390×844 conserva griglia,
CTA, formati, stato bloccato e barra da 52 px. Le prove sono:

- `dist/m3-screenshots/01-home-pastel-spectrum-revision.jpg`, 52.684 byte,
  SHA-256 `b29875cc323a09ff2a88bb39b9238e87f556b96902a3956ab93d9f1d3d73ec6a`;
- `dist/m3-screenshots/01-home-pastel-spectrum-cards.jpg`, 51.070 byte,
  SHA-256 `109a82f28ae2556c21708492c48c21fa8150f421e37cd4100ba4eb9821ce7332`.

[F] Nessun audio, route player, asset, dipendenza o configurazione nativa è
stato modificato. Prettier, lint, TypeScript, 15 suite/62 test e regressione
audio 26/26 sono verdi; l'anteprima web non registra errori console.
L'approvazione estetica della nuova palette resta umana.

## D-039 - Anteprima locale sonora con driver Web Audio separato

Data: 2 settembre 2026
Stato: implementata e verificata localmente; commit aperto

[F] L'anteprima Expo Web usa `WebAudioDriver`, selezionato soltanto per la
piattaforma web e conforme allo stesso `AudioGraphDriver` del driver nativo.
Android e iOS continuano a usare `ReactNativeAudioDriver`; controller, UI,
catalogo, persistenza e contratti consumer non sono stati duplicati.

[F] Nel browser locale sono entrati in stato Play con timer in decremento:
Pink Noise generato a runtime, Deep River WAV, Eclipse Veil FLAC lossless e il
percorso tecnico Moon Current con i tre stem ATP01 più generatori. Per il
consumer sono stati verificati anche Pause/Resume, Stop e Mute/Unmute; il log
console non ha registrato errori durante il run.

[F] Il web è una superficie di anteprima locale, non sostituisce il prodotto
mobile. Le capability dichiarano correttamente assenti background playback,
notification controls e shared clock preciso. [U] Bluetooth, lock-screen,
interruzioni, latenza, batteria e qualità nativa restano `NON DETERMINATO —
EVIDENZA INSUFFICIENTE` fino al test su telefono reale.

## D-040 - Soft Air respinto nel consumer

Data: 2 settembre 2026
Stato: decisione umana applicata localmente; sostituzione aperta

[F] L'utente ha respinto Soft Air perché il materiale è percepito come una
ventola potente e ricorda l'interno di un aereo. La qualità consumer non è più
provvisoria: lo stato è `REJECTED — REPLACEMENT REQUIRED`.

[F] Soft Air è disabilitato in Home, outcome e Soundscapes e non può aprire il
player. La UI mostra `REPLACEMENT REQUIRED` e `REJECTED AFTER LISTENING`.
`SLEEP_TEXTURE_001.wav` non viene cancellato, rinominato o modificato: resta
necessario soltanto al preset tecnico ATP01 in `AUDIO TEST / TEST ONLY`.

[U] Nome, provenienza, spettro e master del sostituto sono `NON DETERMINATO —
EVIDENZA INSUFFICIENTE`; nessun nuovo asset è stato integrato.

## D-041 - Catalogo completo approvato nella preview localhost

Data: 3 settembre 2026
Stato: implementata e verificata localmente; mobile delivery aperta

[F] L'utente ha dichiarato positivo l'ascolto di tutti i file raccolti dalla
Strategia e ha richiesto che siano inseriti, ricatalogati e funzionanti nella
preview localhost. L'approvazione sonora copre i 15 lavori analogici di
`APP_READY_AUDIO_01` e i 24 lavori di
`APP_READY_AUDIO_02_ELEMENTAL_WATER_AIR`: 39 opere. Non riabilita Soft Air,
respinto separatamente in D-040, e non rende definitivi i working title.

[F] Il registro contiene ora 42 opere file-backed: 39 approvate, Moon Drone e
Deep River ancora tecniche/provvisorie, Soft Air respinto. Con otto generatori
noise il totale è 50 entità; ogni programma consumer resta rigorosamente
single-source. Calm viene esposto sotto Relax, le 23 opere Water sotto
Elemental Worlds e `Second Element: Air` sotto Esoteric Series.

[F] Per evitare un pacchetto nativo monolitico, 38 file sono copiati nella
cartella locale ignorata `public/audio-catalog/` e caricati soltanto on demand:
14 WAV invariati dal pack 01 e 24 FLAC invariati dal pack 02, per
2.706.406.941 byte. Eclipse Veil usa il FLAC starter già incorporato. Il
manifest tracciato fissa filename, byte size e SHA-256; il validatore ha
verificato tutti i file e vieta l'ingresso di `SLEEP_TEXTURE_001.wav`.

[F] Il collaudo browser ha aperto individualmente tutte le 39 route approvate:
ciascuna ha completato Play e mostrato Pause, senza alert o errori console. Un
primo ciclo rapido su Silver Canopy non ha osservato la transizione entro la
finestra breve; due prove isolate, inclusa quella finale con attesa maggiore,
sono passate. Non resta un fallimento riproducibile.

[I] Il localhost è la superficie corretta per questa fase di ascolto e
ricatalogazione, ma non è una strategia di distribuzione mobile. Incorporare
tutti i FLAC approvati richiederebbe circa 1.690.207.802 byte di solo audio;
Git LFS o asset delivery e una nuova build restano gate separati non
autorizzati. [U] Prestazioni, loop, background e qualità del percorso nativo
restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al test su telefono.

## D-042 - Patch transitiva xmldom

Data: 3 settembre 2026
Stato: risolta e verificata localmente

[F] Il gate finale ha rilevato GHSA-6gmq-8vp8-gcm6 nelle versioni transitive
`@xmldom/xmldom` 0.8.13 e 0.9.10, introdotte dagli strumenti plist/config di
Expo. L'advisory GitHub reviewed indica come release corrette 0.8.15 e 0.9.12.

[F] `pnpm-workspace.yaml` forza separatamente ciascun ramo alla propria patch
compatibile. Il lockfile e l'installazione locale sono stati aggiornati senza
installazioni globali; `security:audit`, Expo install check, TypeScript e i test
mirati catalogo/UI sono tornati verdi. Restano soltanto i due advisory
`image-size` già accettati e confinati dal validatore asset.

## D-043 - Meditation prima e priorità editoriale ai suoni marini

Data: 3 settembre 2026
Stato: decisione umana applicata localmente

[F] L'utente ha chiesto di portare Meditation in prima posizione e di dare più
risalto ai suoni di onde marine già approvati. Meditation è quindi il primo
outcome della Home e `Open Tide` è il suo lavoro featured nella preview
localhost.

[F] Seguono `Tidal Breath`, `Pearl Tide`, `Blue Interval`, `Moon Shore` e
`Night Shore`. `Eclipse Veil` rimane disponibile e invariato nel catalogo, ma
viene mostrato dopo il gruppo marino. Nessun file audio, gain, stato di ascolto
o mapping di collezione è stato modificato. Stato storico, superato da D-055.

## D-044 - Stillwater Halo chiude Cosmic / Zen Ambient

Data: 3 settembre 2026
Stato: decisione storica, superata da D-056

[F] L'utente ha chiesto di spostare `Stillwater Halo` in ultima posizione nella
sezione Soundscapes. L'opera chiude ora la propria raccolta
`Cosmic / Zen Ambient`; resta una traccia Relax approvata e non cambia file,
gain, disponibilità, route o catalogazione.

[F] D-056 ha successivamente eliminato l'opera dall'app mantenendo intatto il
master esterno di archivio.

## D-045 - Il catalogo localhost è escluso dall'archivio EAS

Data: 3 settembre 2026
Stato: hardening locale verificato prima del commit

[F] Il controllo pre-commit ha dimostrato che `expo export` copia anche
`public/audio-catalog/` nell'output locale quando i 38 file sono presenti sul
Mac. La tabella Metro continua a referenziare soltanto i tre WAV ATP01 e lo
starter FLAC, ma l'output completo non può essere descritto come limitato a
questi quattro file.

[F] `.easignore` esclude ora l'intera cartella `public/audio-catalog/`. I byte
locali restano disponibili per l'ascolto localhost ma non devono entrare
nell'archivio sorgente EAS; `validate-project-config.mjs` richiede la regola e
`validate-eas-archive.mjs` fallisce se trova la cartella. Il validatore riconosce
inoltre correttamente i quattro asset audio incorporati: tre WAV ATP01 e un
consumer starter FLAC.

## D-046 - Sessioni adattive: funzione, durata, Start

Data: 3 settembre 2026
Stato: decisione umana implementata localmente, gate QA aperto

[F] Le modalità consumer sono `Sound only` e `Guided`. La scelta primaria resta
bisogno/attività → durata → Start; Customize è facoltativo e chiuso. La voce
compare soltanto dopo la scelta Guided.

[F] Non esistono registrazioni vocali autorizzate. Guided e la scelta voce
restano `IN PRODUCTION`; non vengono sintetizzate voci e il CTA non può
avviare una sessione Guided fittizia.

[F] Le durate strutturali sono 10/20/30/45/60/90 minuti, ma ogni outcome espone
soltanto il proprio subset sensato. `Play your last session` riusa l'ultima
richiesta avviata con successo con un nuovo seed; il replay identico resta una funzione
del solo Workbench.

## D-047 - Continuum è un sequencer deterministico e fail-closed

Data: 3 settembre 2026
Stato: contratto e implementazione locale QA

[F] Continuum costruisce Arrival → Flow → Deepening → Return in frame interi a
48 kHz. Il seed rende il piano riproducibile; opere e famiglie non si ripetono
nella stessa sessione e le tre sessioni recenti alimentano una finestra di
esclusione.

[F] Ogni passaggio deve superare contemporaneamente gruppo editoriale,
famiglia armonica, classe di transizione, delta energetico, densità, presenza
melodica e boundary di ingresso/uscita. Se non esiste una sequenza compatibile,
il planner restituisce un errore esplicito e non ripiega su accoppiamenti
casuali.

[I] I metadata Continuum correnti derivano dal catalogo e, in alcuni casi, dal
filename; sono quindi marcati `PROVISIONAL — CATALOG AND FILENAME INFERENCE`.
L'approvazione d'ascolto delle opere singole non prova la qualità dei passaggi.
Il planner consumer li esclude per default; soltanto il QA locale può abilitarli
esplicitamente. Arrival, Flow, Deepening e Return applicano anche regole di
energia, densità e presenza melodica proprie della fase.

[F] Il default ambient è un crossfade equal-power di 12 secondi. L'overlap è
limitato a uscente ed entrante; il limite peak usa il massimo matematico
dell'intera curva, non un campione al punto medio, ed è compensato con trim
statico per un limite calcolato di -1,1 dBTP. Nessun limiter o modifica ai
master. L'ID del piano deriva da input e timeline completi, così varianti di
curva, disponibilità o storia non collidono.

[U] La precisione reale delle transizioni, due decoder FLAC simultanei, seek,
preload, background e comportamento su device restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino a un'implementazione nativa e a
prove su telefono.

## D-048 - Offline è un contratto senza delivery inventata

Data: 3 settembre 2026
Stato: fondazione locale, sorgente remota assente

[F] Il manifest offline non contiene URL. Il primo pacchetto logico Water
registra 12 opere e 177.645.113 byte, con revisione, object key, dimensione e
SHA-256. Lo stato copre queued, downloading, verifying, available, removing e
failed; spazio, retry, rimozione e recovery da interruzione sono separati dagli
adapter di storage e source.

[F] Il contratto non accetta buffer generici: la sorgente scrive in uno staging
streaming, ogni asset viene verificato e l'intero tentativo viene promosso o
annullato. `available` viene riconfermato interrogando byte e SHA-256 reali; una
revisione catalogo diversa o un file mancante/corrotto degrada in modo
fail-closed. Le operazioni sullo stesso pacchetto sono serializzate.

[F] `public/audio-catalog/` rimane una sorgente di ascolto read-only su
localhost. I suoi 2.706.406.941 byte non entrano in Git o EAS e non vengono
presentati come pacchetto scaricato.

[U] CDN/backend, autenticità del manifest remoto, range/resume, adapter nativo
che implementi staging/promozione atomica, lease durante playback e SHA-256
incrementale su iOS/Android non esistono ancora:
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## D-049 - Il QA Workbench usa una radice Router separata

Data: 3 settembre 2026
Stato: confine locale verificabile

[F] La configurazione predefinita usa `src/app`; la superficie QA esiste in
`src/app-qa` ed è selezionata soltanto con `APP_RELAX_SURFACE=qa`. Il Workbench
non ha link in Home, tab o Settings e porta il sentinel
`AUDIO QA WORKBENCH · DEVELOPMENT ONLY`.

[F] `.easignore` esclude fisicamente `src/app-qa/` e `src/qa/`, inclusa la
persistenza del draft QA. Il development
client può ricevere la radice QA dal Metro locale, mentre la configurazione
destinata all'archivio EAS predefinito resta consumer. Un validatore esegue
entrambe le configurazioni e
scansiona le route consumer. Un secondo validatore confronta gli export Web:
sentinel, route e chiave di storage devono essere assenti dal consumer e
presenti nel solo artifact QA.

[F] Il Workbench espone seed, timeline, scrubber, passaggio
precedente/successivo, loop ±30/60 secondi, outgoing/incoming/both, A/B di
durata/curva, metriche e audit accelerato. Nessuno di questi termini viene
mostrato nel percorso consumer.

## D-050 - M5 supera il gate visivo e resta aperta all'ascolto

Data: 3 settembre 2026
Stato: gate repository/non nativo e screenshot approvati, ascolto aperto

[F] Tutti i controlli M5 sono stati eseguiti con Node 22.23.1 e pnpm 11.16.0:
formattazione, lint, TypeScript, 33 suite / 131 test, regressione audio 44/44,
validatori audio/asset/config/security/QA, Expo Doctor 20/20 ed Expo install
check sono verdi. Il residuo sicurezza resta limitato ai due advisory
`image-size` già accettati e vincolati dall'asset safety gate.

[F] Gli export da una copia temporanea priva di `public/audio-catalog/` sono
riusciti per iOS, Android, Web consumer e Web QA. I bundle nativi referenziano
soltanto tre WAV ATP01 e un FLAC starter; il Workbench e la sua chiave di
persistenza sono assenti dall'export consumer e presenti solo nell'artifact QA.

[U] Un nuovo archivio sorgente EAS non è stato generato. Il relativo validatore
è predisposto e `.easignore` è verificato staticamente, ma gli export isolati
non costituiscono prova dell'archivio prodotto da `eas build:inspect`. Questo
gate resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE` perché EAS non è
autorizzato nella milestone.

[F] Nel browser loopback la sequenza Home → Meditation → 20 min → Sound only →
Start ha raggiunto lo stato Play con Open Tide e timer attivo. Pause ha
mantenuto il tempo stabile e Play ha ripreso. Il Workbench ha prodotto lo
stesso piano dal seed e l'audit accelerato ha verificato durata esatta, nessun
gap, massimo due sorgenti e sette intervalli esatti. Cinque screenshot 390×844
sono stati salvati in `dist/m5-screenshots/`; i server sono stati spenti.

[F] Il 3 settembre 2026 l'utente ha approvato esplicitamente i cinque
screenshot M5. Questa decisione chiude il gate visivo ma non costituisce
approvazione d'ascolto, autorizzazione al commit o prova nativa.

[F] In un ordine successivo l'utente ha autorizzato esplicitamente un solo
commit locale M5. Push, EAS, build e pubblicazione restano azioni separate e
non autorizzate.

[U] Questa prova non certifica precisione sample-accurate nativa, due decoder
FLAC su telefono, background, lock-screen, Bluetooth, batteria o qualità
musicale delle transizioni. Tali aspetti restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Nessun EAS, push o pubblicazione è
autorizzato o eseguito.

## D-052 - Le opere erano presenti ma nascoste dal percorso consumer M5

Data: 3 settembre 2026
Stato: correzione locale verificata, non committata

[F] Il confronto dei due manifest approvati con il registro e i file locali ha
confermato zero omissioni: 15 opere analogiche e 24 Water/Air approvate
all'ascolto sono tutte registrate e disponibili; i tre ATP01 portano le opere
file-backed a 42 e gli otto generatori portano il catalogo a 50 entita. I file
aggiuntivi presenti nei pacchetti sono master, derivati e seam preview degli
stessi lavori. Materiale esterno non manifestato non viene promosso a catalogo.

[F] La regressione era di navigazione: M5 aveva sostituito gli elenchi delle
route outcome con il solo setup adattivo e Home mostrava sei titoli
aspirazionali non presenti nel registro. Il setup durata -> Start resta la
prima azione; sotto compare ora `OR CHOOSE ONE SOUND` con l'intera selezione
pubblica pertinente. Home mostra come featured reali Open Tide, Quiet Field,
Mineral Drift, Stillwater Halo, Moonlit Veil e Astral Thread.

[F] Soundscapes continua a esporre tutte le 50 entita una sola volta, ma porta
in apertura Sea, Rain e Stream. Questo rende immediatamente visibili le 24
opere naturali che prima iniziavano soltanto dopo 24 card Cosmic, Standalone e
Noise. Soft Air resta visibile ma disabilitata; nessuno stato di ascolto o
disponibilita e stato falsificato.

[I] Il riscontro utente che i suoni naturali "reggono" giustifica la priorita
editoriale corrente. Non prova decoder, transizioni, background o qualita su
telefono reale: tali gate rimangono `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## D-053 - Musica più una famiglia naturale sotto controllo dell'utente

Data: 4 settembre 2026
Stato: decisione utente implementata nella preview Web, non committata

[F] L'utente ha richiesto per la sessione musicale la scelta esplicita tra
`Ocean waves` e `Rain`, oltre a un volume ambiente indipendente. Il volume
principale resta separato; l'ambiente espone 0–100% e mute/unmute con target
accessibili, senza mostrare dB, stem o controlli da DAW.

[F] La famiglia naturale si sceglie prima dello Start e viene conservata
nell'ultima sessione. Durante l'ascolto resta regolabile il suo volume separato;
un cambio di famiglia non interrompe o rigenera di nascosto una sessione in
corso.

[F] Questa e un'eccezione stretta al divieto di mixer consumer: il programma ha
una corsia musica e una sola corsia natura scelta dall'utente. Ogni corsia usa
una sola opera fuori dal proprio crossfade; i cambi delle due corsie sono
sfalsati e il piano non supera tre sorgenti simultanee. Non esiste selezione o
somma arbitraria di più layer.

[F] Dopo l'ascolto dell'utente, la durata predefinita dei passaggi musicali
approvati e 180 secondi equal-power. La corsia natura usa cambi altrettanto
lenti e resta nella famiglia selezionata, alternando due registrazioni Sea
oppure due registrazioni Rain. Le sole relazioni musicali abilitate sono
Eclipse Veil → Astral Thread, Celestial Current o Quiet Field e Stillwater Halo
→ Quiet Field; ogni altra coppia fallisce chiusa. Questo elenco è storico: D-055
rimuove Eclipse Veil e lascia attiva soltanto Stillwater Halo → Quiet Field.

[I] Il valore ambiente 100% indica il massimo bilanciamento disponibile entro
il margine di headroom del programma composito, non il guadagno raw unitario
sommato alla musica. Il bus principale e i due bus di corsia restano distinti.

[U] Precisione e stabilita con più decoder, carico CPU, glitch, background,
lock-screen e resa del bilanciamento su telefono reale restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`. La preview localhost non sostituisce
il driver nativo o il gate d'ascolto su device.
