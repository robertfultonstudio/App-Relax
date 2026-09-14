# Android consumer offline kit — D-097

14 settembre 2026 · APK1.0.3/4 per prova Android, correzione Ocean inclusa

[F] D-103: nuova APK1.0.3/4 a costo zero, installazione in aggiornamento
riuscita e47/47 importati conservati. Hatha90+Ocean supera l'avvio e la
prima giunzione (516s), pausa/ripresa/volumi/mute, Rain→Stop→Ocean e Stop.
Prove e hash in `ANDROID_APK_D103_PREFLIGHT.md`. Catalogo invariato e separato
dall'APK. Il telefono reale deve ancora validare loop/crossfade, interruzioni
e background. I paragrafi seguenti conservano la cronologia precedente.

[F] Aggiornamento D-102: correzione Ocean verificata localmente con il
development client, non ancora nell'APK qui descritta. Kit invariato,
nessuna nuova build. Prove e limiti: `ANDROID_OCEAN_D102_FIX.md`.

[F] D-101: build `71e00fbe-bc05-4a61-ab70-13a2dc7d75a3` FINISHED,
costo stimato zero, Free Android2/15 usate. Kit47/47 ricontrollato, nessun
byte audio modificato. APK1.0.2/3 ispezionata e installata senza Metro:
Hatha90+Rain, pausa/ripresa, mute e Stop passano la prova funzionale;
segnale presente oltre l'istante della prima giunzione. Ocean waves fallisce
invece l'avvio, anche al Retry e dopo riavvio pulito. La1.0.2/3 resta un
candidato non accettato, la1.0.1/2 conserva il precedente esito negativo.
Vedere `ANDROID_APK_D101_PREFLIGHT.md` per hash, prove e limiti. Nessuna
seconda build, commit, pubblicazione o nuova consegna dichiarata funzionante.

## Stato precedente D-097 della consegna

[F] Tutti47 file sono stati importati e verificati realmente nell'APK su
Android API34 x86_64. Home e Settings47/47 funzionano. Night Birds WAV e
Astral Thread FLAC producono segnale nativo non nullo verso AudioFlinger.
Hatha90 con Rain e senza ambiente, invece, fallisce in preparazione.
L'APK sotto resta un artefatto di diagnosi, NON una consegna funzionante.

[F] La diagnosi ha trovato un difetto locale nelle curve native: il mock
non riproduceva il controllo RNAA che vieta anche overlap sub-campione.
Rendendolo fedele, due test precedentemente verdi falliscono su una
sovrapposizione di circa2,3e-13 secondi. Confini assoluti concatenati corretti
nel sorgente, senza allentare quel gate; 22 test nativi e644 test complessivi
passano. Il fix NON è incluso nell'APK1.0.1/2, che conserva il suo hash.

[U] Una nuova build e la ripetizione del test sono necessarie. Non è ancora
provato che questo fix risolva l'errore Hatha visto in UI; non si trasforma
la riproduzione in un mock in una prova nativa. Nessuna seconda build avviata.

[F] Gate dopo il fix: Jest644/644 in89 suite (30,425s), audio248/248 in22
suite (8,555s), lint, typecheck, Prettier e diff-check PASS. Asset safety527
file, config e boundary QA/PWA PASS. Gli export/archivio, Doctor20/20 e
secret scan descritti sotto appartengono al pre-build643; non si spaccia
l'APK o l'export precedente come se contenesse la correzione. Nessun nuovo
asset, dipendenza, manifest o codice PWA modificato nel fix post-build.

[F] Stato Git finale: HEAD `6549f0117f2d7623fe20816cbf2c687385af6b8d`, index
vuoto,99 file tracciati modificati e88 voci non tracciate complessive, incluse
le modifiche ereditate. Dopo la build sono cambiati soltanto il confine delle
curve in `AdaptiveNativePlayback.ts`, il relativo test e i documenti
STATO/DECISIONS/A01/questo rapporto. Evidenze diagnostiche ignorate in dist,
istruzioni corrette nella cartella esterna. Nessuno staging o commit.

## Contenuto reale

[F] `nativeAudioManifest.json` collega47 registrazioni esterne:13 musiche,
8 Respiro Hatha1,24 registrazioni naturali/Elemental e le2 nuove texture
Field Ambience/Night Birds. Sono45 FLAC già verificati e2 WAV PCM24 recenti
conservati esattamente come consegnati. Totale2.434.210.564 byte. Nessuna
rinormalizzazione, conversione lossy o modifica ai master. Le due texture
non classificate restano soltanto nell'ascolto manuale, non in Rain/Ocean.

[F] Kit locale generato fuori dal repository:
`/Users/RF/Documents/App Relax Android Test 20260913/AppRelaxAudio/`.
Sorgenti e copie confrontate integralmente per dimensione/SHA-256:47/47 PASS.
Hash del manifest nel kit:
`70c026c7e8ad8c8bae6e7711382420a43df9bbdae55e0a6e035f2e2055bdfcac`.
Eclypsis, Nirvana Waves e Soft Air non sono in questo kit. Gli8 generatori
noise restano a runtime; Moon Drone/Deep River riusano gli asset incorporati.
I3 WAV tecnici ATP01 restano invariati, non duplicati nel kit esterno.

## Import e fiducia

[F] `preview-android` abilita esclusivamente Android, non iOS né una delivery
remota. Il primo avvio chiede la cartella AppRelaxAudio sul telefono. Copia
sequenziale SAF verso staging privato, SHA-256 incrementale256KiB, controllo
spazio e promozione dopo verifica. Il manifest importato non viene fidato:
identità/hash/dimensioni provengono dal manifest incorporato nel codice.

[F] Crash/cancellazione/errore non attestano file parziali. Il retry riusa
soltanto file già verificati. Gli originali nella cartella selezionata non
vengono mai spostati, sovrascritti o cancellati. La singola copia Expo non è
cancellabile: Cancel prende effetto dopo di essa o fra i blocchi di verifica.
La UI lo dichiara. Il contenuto consumer resta non montato finché non sono
pronte tutte47 registrazioni, evitando selezioni automatiche non riproducibili.

[F] File privati content-addressed e immutabili. Una ricevuta salvata soltanto
dopo SHA corretto viene riusata al riavvio; a ogni acquire si controllano
dimensione e timestamp privato, riservando la lease prima del controllo.
Non si rilegge l'intero catalogo a Play. Questo non è un controllo crittografico
anti-bitrot a ogni lettura né una fiducia nel timestamp della sorgente SAF.
Backup Android disabilitato per evitare una copia cloud implicita dei file.

[F] Modulo Expo FileSystem57.0.7 aggiunto come dipendenza diretta già risolta
nel lockfile; nessuna installazione globale/sistema. Sorgenti ufficiali:
[Directory SDK57](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-file-system/src/Directory.ts),
[FileHandle SDK57](https://raw.githubusercontent.com/expo/expo/sdk-57/packages/expo-file-system/src/File.types.ts).

## Playback e UI

[F] Factory reale → NativeCatalogStore → lease file privato → RNAA FileSource.
La UI resta dietro AudioSessionController. Funzione/durata/Start, Hatha
30/45/60/90, timer/volume e Rain/Ocean con volume distinto. Nessun pannello
sviluppatore nell'interfaccia APK; continua a esistere nella PWA separata.
Guided non contiene registrazioni e resta dichiaratamente indisponibile.

[F] Le factory pure dei piani sono condivise, senza importare la UI PWA nel
bundle Android. Hatha provvisorio ammesso soltanto dalla policy della build
interna; nessuno stato d'approvazione musicale viene riscritto. Il driver
controlla la famiglia delle registrazioni naturali e conserva il massimo
di3 decoder assegnati per musica+natura,2 per una singola corsia.

[F] Corrette due condizioni trovate dai test: arrotondamento decimale che
introduceva una sovrapposizione inferiore a un campione fra corsie; finestre
che si toccavano senza tempo per preparare il decoder successivo. Il piano
nativo riserva10s fra transizioni musicali e naturali; non cambia la durata
musicale né i file e non accorcia i crossfade. PWA mantiene la sua policy.
Test accelerato senza seek:90min Rain/Sea, clock a intervalli4s, nessuna
scadenza persa, massimo3 sorgenti e fine unica. Non è un long-run del decoder.

[F] Stop riallinea anche una richiesta di audio focus completata in ritardo;
non basta impedire source.start. Test di regressione per lease, cancellazione,
stato UI, rumori, timer e preset tecnico conservati.

## Gate di consegna

[F] Prima dell'upload: 643 test / 89 suite, lint/typecheck, asset/config,
Doctor 20/20, export finali e archivio PASS. Security policy PASS con i soli
due residui image-size già accettati. Quota Free live Android 0/15,
costo stimato zero. Avviato un solo job consumer 1.0.1 / versionCode 2:
`dde27cac-c2b3-476a-b0af-92cc6b8e214e`, firma esistente congelata.
[Stato EAS](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/dde27cac-c2b3-476a-b0af-92cc6b8e214e).
Niente store, commit, push o pubblicazione PWA.

[F] Job FINISHED il 13 settembre 2026 alle 18:27:01 UTC; Gradle
BUILD SUCCESSFUL in 28m23s. APK 293.082.242 byte, SHA-256
`bdc6c20019ee9a04486d4ec25d2920384682a9f2fdf539ca826dcadadffc2ea3`.
[Artifact esatto](https://expo.dev/artifacts/eas/DlMQ65CcM41r1f92vZjcBrfHg_WE7mvvXwail7ITUUI.apk).
Audit indipendente: ZIP integro, package/versione corretti, non-debuggable,
allowBackup false, quattro ABI, servizio RNAA mediaPlayback e permessi
foreground presenti. Solo 3 WAV ATP01 nel pacchetto, zero FLAC/catalogo
esterno. Firma v2 identificata; installazione Android in aggiornamento
`Success` senza cancellare i dati: firma accettata dal Package Manager.

[F] Avvio esplicito MainActivity COLD: 1.247 ms sul solo AVD API34 x86_64;
non è una misura del primo suono o di un telefono fisico. Selezione SAF
della cartella reale riuscita. Import completo entro19:19:54 UTC; Settings
47/47 attestato. Cancellazione/riavvio/retry conservano i9 file inizialmente
verificati, senza ricominciare da zero.
Il primo import sull'emulatore è lento, nell'ordine di decine di minuti per
l'intero kit: non si dichiara rapido né si proietta questo tempo sul telefono.
Non è una latenza ripetuta a ogni Play; il codice riusa ricevute e file privati.

[F] Screenshot runtime in `dist/d097-native/`:17 Home,19 Settings47/47,
22 Hatha90+Rain preparato,24 errore Hatha,27 playback Night Birds,28 pausa,
29 Stop,31 Astral Thread in playback,33 errore Hatha senza natura.
AudioFlinger: stereo48kHz, device SPEAKER, segnale non nullo sulle due opere;
zero underrun della traccia nel campione osservato, non una prova long-run.
Night Birds è rimasto in riproduzione oltre la durata di un ciclo, ma senza
ascolto host non si certifica la giunzione. Emulatore avviato con `-no-audio`.
Il tentativo26 di UIAutomator non ha raggiunto idle: XML non attuale, escluso
dalle prove; gli screenshot diretti27/31 e le letture successive sono validi.
Log e AudioFlinger salvati nella stessa cartella. Dopo Stop nessun servizio
audio attivo; app/emulatore/ADB spenti, dimensioni AVD ripristinate, nessun
Metro o listener8081/8092/8093/5037 rimasto. Dati importati conservati.

[F] Quota dopo la build: Free Android 1/15, overage zero e costo stimato
totale zero. Nessun secondo job, commit, push o aggiornamento PWA eseguito.

## Residui rilevati nell'APK

[F] Workbench e superfici PWA esclusi. Questo NON significa assenza di tutto
il codice tecnico: la route legacy ATP01 `/audio-test`, senza collegamenti
nella navigazione consumer, è ancora incorporata e raggiungibile tramite
deep link. Il marker `single-loop-review` è invece un seed interno delle
factory condivise, non un pannello QA. Prima di una release consumer finale
va chiusa anche l'esclusione della route legacy. Il controllo originario
QA/PWA non verificava questa condizione più forte.

[F] Restano i permessi legacy SYSTEM_ALERT_WINDOW e storage con maxSdk32,
da rivedere prima dello store. Non sono stati aggiunti login, analytics,
billing o una delivery remota. Report statici completi nel kit di consegna:
`APK_AUDIT.md` e `APK_AUDIT.json`.

[U] Telefono reale obbligatorio per loop percepito, decoder FLAC prolungato,
primo suono, background/lock-screen/interruzioni/Bluetooth, batteria e memoria:
NON DETERMINATO — EVIDENZA INSUFFICIENTE. Nessun risultato software viene
presentato come approvazione sonora o garanzia di latenza nulla.
