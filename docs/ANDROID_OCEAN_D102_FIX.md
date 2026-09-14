# D-102 — Ocean waves: avvio nativo e conferma posizione

14 settembre 2026. Correzione locale richiesta da Robert, nessuna nuova build,
pubblicazione, spesa, modifica dei file audio o commit.

## Difetto riprodotto

[F] Riutilizzato il development client Android esistente sull'AVD API34
x86_64, con i47 file importati conservati. Hatha90+Ocean sulla baseline
D-101 fallisce come nell'APK1.0.2. Diagnostica temporanea, solo locale:

```text
workId: respiro-hatha-1-02
entrySeconds: 0
sessionPosition: 0
segmentStart: 352.78570833333333
currentTime: 4.935999999999988
duration / expectedDuration: 582.5 / 582.5
error: Native decoder did not confirm the requested position.
```

[F] Il decoder della musica successiva è vivo e la durata concorda; l'errore
di questo run è la conferma posizione mancata, non un file Ocean assente.
Il controllo accetta solo progresso positivo entro100ms. Una creazione
sincrona nativa successiva o uno stallo JS può far perdere tale finestra e
lasciare il controllo in attesa fino al timeout. Il test con blocco simulato
di200ms riproduce il fallimento prima del fix.

## Correzione limitata

- [F] `AdaptiveNativePlayback`: barriera fra allocazione dei decoder iniziali
  e loro avvio. Tutte le creazioni sincrone terminano prima che inizino le
  finestre di conferma. Cancellazione/generazione ricontrollate alla barriera.
- [F] `StreamingStemSource`: se viene osservato un overshoot finito, una sola
  nuova seek silenziosa al target. Non si accetta l'overshoot; la posizione
  deve poi rientrare nel limite originale. Tolleranza100ms e deadline5s non
  vengono aumentate. Budget condiviso anche fra probe near-EOF e target:
  massimo2 seek normali o3 nel caso near-EOF, nessun ciclo di retry.
- [F] Nessuna modifica a musica, loop asset, livelli, scelta editoriale,
  durata, timer assoluto, crossfade o superficie consumer.

[F] Verifica del codice C++ RNAA0.13.2 installato: il daemon consuma l'ultima
seek accodata, elimina frame precedenti ed emette DISCONTINUOUS al target;
il render aggiorna currentTime prima di proseguire. La conferma avviene a
grafo silenziato; non si sostituisce con una seek da paused senza ack.
Riferimenti: `SeekDecoderDaemon.cpp`, `AudioFileSourceNode.cpp` e host object
sotto `node_modules/react-native-audio-api/common/cpp/audioapi/`.

## Test e confini

[F] Sei nuove regressioni: creazione sincrona concorrente; Stop alla barriera;
recupero di overshoot; timeout originale con recovery a4900ms; cancellazione
durante recovery; budget comune near-EOF. Tutte passano. I precedenti test
zero/no-ack, probe/final, pause/resume, rolling90min Rain/Sea restano verdi.

[F] Jest653/653,89 suite,31,418s: `dist/d102-jest.json`. Audit indipendente
su copia isolata: nessun nuovo blocker rilevato; non è una prova sonora.
Validatori config, boundary, safety, ATP01, rituali, consumer, Hatha e texture
locali PASS. Audit dipendenze PASS WITH ACCEPTED RESIDUALS soltanto per i due
advisory image-size già accettati. Output: `dist/d102-validators.json`.

[F] Runtime: primo avvio Ocean con barriera riuscito, pausa88:41 e ripresa
Playing88:03. Secondo avvio con barriera+recovery riuscito. AudioFlinger:
client attivo dell'app e segnale corrente non nullo. Mute natura0% e ripristino
50% indipendenti da main80%. Screenshot `d102-ocean-*` in `dist/d101-native/`.

[F] Hatha 90 + Ocean resta Playing a 81:47 (493 secondi trascorsi), oltre la
fine della prima giunzione musicale a 465,75 secondi. Prova visiva:
`dist/d101-native/d102-ocean-after-first-join.png`. Non equivale a certificare
che la giunzione sia inudibile né a una prova completa di 90 minuti.

[F] Rimossa la diagnostica temporanea e riavviata l'app: Hatha 90 + Rain
parte; Stop riporta Ready; scelta Ocean e Play partono nuovamente. Screenshot
`d102-rain-clean-result.png`, `d102-rain-to-ocean-result.png` e
`d102-final-ocean-stop-ready.png` nella stessa cartella. AudioFlinger corrente:
PID 3271, track 76 attiva e segnale non nullo dopo l'avvio Ocean delle
01:26:49; report `d102-final-ocean-signal.txt`. Nessun errore decoder nel log
del nuovo processo. Restano i warning development preesistenti Reduce Motion
e ciclo AudioProvider/ConsumerListeningObserver, non errori Ocean.

[F] Prove concluse: Stop → Ready 90:00, Play abilitato. Ripristinata sull'AVD
l'APK originale 1.0.2/3 senza cancellare dati; app fermata. Emulatore, Metro e
ADB spenti; PID 90212/90486 assenti e nessun listener 5037/5554/5555/8081.
Nessuna approvazione d'ascolto da emulatore senza audio host.

## Controlli del candidato

[F] Test audio 257/257 in 22 suite (`dist/d102-audio-jest.json`), lint e
typecheck PASS. Expo Doctor 20/20, Expo install check: dipendenze allineate.
Archivio locale EAS: 177 file, 160.186.901 byte; validatore PASS senza
segreti, percorsi sorgente, catalogo consumer o audio oltre i tre WAV ATP01.
`build:inspect --stage archive` non è una build cloud e non esegue upload.

[F] Ripetizione finale sul sorgente senza diagnostica: Jest 653/653,
89 suite, 28,897s (`dist/d102-final-jest.json`). Prettier, incluso il lockfile,
e `git diff --check` PASS; asset safety 532 file PASS. Nessuna nuova dipendenza.

[F] Export Metro consumer con catalogo pubblico mobile vuoto, un worker:

| Export  | File | Byte totali | Audio incorporati             |
| ------- | ---: | ----------: | ----------------------------- |
| Android |   53 | 163.942.551 | 3 WAV ATP01, 155.520.132 byte |
| iOS     |   49 | 162.785.686 | 3 WAV ATP01, 155.520.132 byte |

Validatore scope/hash PASS su entrambi, nessun catalogo locale né logger
temporaneo. Percorsi: `dist/d102-export-android`, `dist/d102-export-ios`.
Sono export JavaScript/Hermes, non compilazioni native Android/iOS.

[F] I due file del motore nell'archivio corrispondono byte per byte al
candidato testato. SHA-256:

- `AdaptiveNativePlayback.ts`: `351a95a1a3cf90afe7065a0f060739c04be7e42828a5e19a90bfc75fbc582fec`.
- `StreamingStemSource.ts`: `bbc7aaae3db19f3444167b5dd484581160cf7083fcc24ff7ad1a1fbc8bf23ff8`.

[F] Perimetro del fix: `AdaptiveNativePlayback.ts`, `StreamingStemSource.ts`,
`tests/audio/AdaptiveNativePlayback.test.ts`, questo rapporto, `STATO.md`,
`docs/DECISIONS.md` e note di distinzione artefatto/correzione nei report
`A01_NATIVE_GATE.md`, `ANDROID_CONSUMER_OFFLINE_KIT.md` e
`ANDROID_APK_D101_PREFLIGHT.md`. Aggiornato anche il solo `LEGGIMI.md` esterno
della consegna: le APK presenti non contengono la correzione.

[F] Stato Git finale: branch `codex/quiet-by-design-m2`, HEAD invariato
`6549f0117f2d7623fe20816cbf2c687385af6b8d`, index vuoto; 100 file tracciati
modificati e 93 voci untracked (incluse cartelle). Sono in gran parte lavoro
ereditato, non il diff di D-102. Le modifiche precedenti sono preservate;
nessuno staging, commit, push o nuova modifica ai master e al kit audio.

## Artefatto Android non aggiornato

[F] L'APK1.0.2/versionCode3 già generata non contiene D-102. Conserva hash
e stato FAIL registrati in `ANDROID_APK_D101_PREFLIGHT.md`; non viene
rinominata né presentata come corretta. Nessun nuovo job EAS avviato.

[U] Il candidato con D-102 deve ancora essere compilato e riprovato come
APK standalone dopo nuova approvazione. Telefono reale, qualità percepita
di loop/giunzioni, Bluetooth, batteria, lock-screen e long-run finale restano
NON DETERMINATO — EVIDENZA INSUFFICIENTE.
