# Field Ambience — integrazione locale

13 settembre 2026 · D-090. Nessun nuovo upload/PWA, commit o build nativa.

## Fonte e integrità

[F] Consegna Editing `Field_Recording_01_Loop_2026-09-13_v01`, letti
`CONSEGNA_SVILUPPO.md` e `manifest.json` integralmente. Integrato esclusivamente
`audio/field_recording_01_LOOP_48K24.wav`; nessuna preview, candidato o intermedio.

[F] Copia in `public/audio-catalog/field_recording_01_LOOP_48K24.wav`, ignorata
da Git ed EAS. Validazione ripetibile prima/dopo la copia e seconda esecuzione
idempotente: sorgente e destinazione identiche, nessuna sovrascrittura.
52.704.102 B, PCM24 stereo/48 kHz, 8.784.000 frame, 183 s.
SHA file `551587af8c2c39a8048c0627c0b1344226786bf56b3b16b8a6ddb2c9c763ca58`;
SHA PCM `8422a771492a358b76bfe81a315ca53d757ff5df2120b937bfb4e04f603a19e6`.
Il validatore legge anche GUID PCM esteso, chunk RIFF, rate, bit, frame e durata.

[F] Ricontrollato anche l'originale float32 in archivio: SHA
`ada03f3dfccf9d5276312e6dd693c6087dc99eb60c8648449602ee1c2ea09fce`,
identico al prima/dopo registrato da Editing.

[F] Misure della consegna riferite al WAV identificato: −18 LUFS, LRA6,5,
true peak−4,2 dBTP, gain app0 dB. Non ricalcolate né promosse ad ascolto.
Loop0 incluso→8784000 escluso; raccordo2 s già nei campioni, nessun nuovo fade,
DSP, normalizzazione o derivato. Il fade iniziale resta quello del player.

## Catalogo e confini

[F] ID `field-recording-01`, titolo inglese provvisorio `Field Ambience`.
Materiale naturale non classificato, `primaryOutcome: null`, zero outcome
secondari/collezioni/ciclo, nessun profilo Continuum. Stato ascolto provvisorio.
Il raggruppamento `unclassified-nature` è soltanto un indice manuale locale,
non una nuova famiglia miscelabile; nessun fallback music, Rain, Ocean o stream.

[F] Accesso QA da Settings → Listening preferences → Choose a recording
manually → Natural textures · local review → Field Ambience. Il wrapper
`src/app-qa/soundscapes.tsx` apre `/qa-workbench?workId=field-recording-01`
in modalità Single work senza autoplay. Riusa il player e lo scrubber esistenti;
nessun artwork di attività viene assegnato al materiale generico.

[F] La root consumer non contiene il collegamento QA e non apre una daily
session con attività inventata. PWA e nativo non rendono il file disponibile;
nessuna route PWA statica, download approvato o lista loop online lo include.
L'inventario remoto rimane45 file. Le37 voci M4 approvate e8 Hatha non cambiano.
Totale registro tecnico57 voci,56 riproducibili localmente,33 transition-ready,
23 single-only,1 respinta; questi conteggi non sono il catalogo pubblico.

## Prove

[F] Test specifici: classificazione natura/non musica, assenza da tutti i sei
outcome, Continuum/PWA esclusi, gain/picco, ingresso QA senza autoplay,
collegamento solo nel wrapper QA. Finale: Jest612/85 suite PASS; typecheck,
lint, format dei file modificati, validatori audio/asset/config/boundary PASS.
Hash Hatha8/8 e M4 37/37 invariati. `git diff --check` senza errori.

[F] Corretti durante la verifica due test (un import UI non necessario nel
test di dominio e il conteggio delle famiglie) e una violazione di boundary:
il link tecnico è stato spostato nel wrapper QA, senza allentare il validatore.

[F] Il wrapper pnpm11.19.0 ha riallineato node_modules alle dipendenze già
bloccate e si è fermato su `ERR_PNPM_IGNORED_BUILDS` per esbuild. Nessun
approve-builds o script postinstall esbuild eseguito. I primi test lanciati
durante quel riallineamento non trovavano Jest/ESLint: non sono stati contati
come PASS. Dopo il termine, test e Metro usano i CLI già installati con
Node22.23.1, senza cambiare package/lock né installazioni globali.

[F] Runtime browser integrato, localhost8093 in development QA: accesso diretto
e dal menu, Play→Pause, seek al centro e poi03:02, ripresa e ritorno osservato
a00:36/03:03 ancora in riproduzione. Pausa e Stop successivi PASS, posizione
00:00 e Stop disabilitato. Nessun errore browser. HTTP WAV/Range206 e byte
totali52704102. Percorso HTMLMediaElement locale, non decoder FLAC PWA.

[F] Screenshot ispezionati: `dist/field-recording-01-review/01-loop-return-local.png`
e `02-manual-catalog-local.png`. Scheda locale chiusa e Metro arrestato.
Porta8093 libera, PID Metro62341 assente; test/lint/export conclusi. Nessun
emulatore o processo audio lasciato attivo.

[F] Export Web consumer fresco in `dist/field01-consumer-web`:54 file,
161.488.096 B. Audio presenti: soltanto i3 WAV ATP01 preesistenti, ciascuno
51.840.044 B e SHA corrispondente alla sorgente canonica; zero nuovi audio,
nessun Field Ambience, segreto/path privato o sentinel Workbench. Non è
l'artefatto PWA pubblicato né una build nativa. `.gitignore` e `.easignore`
escludono la nuova copia, indice Git vuoto. Export iOS/Android/EAS non eseguiti
per questo delta: esclusione nativa provata da configurazione e regole,
non da una nuova build. Doctor/advisory precedenti restano separati.

[F] Stato finale Git: HEAD app invariato
`6549f0117f2d7623fe20816cbf2c687385af6b8d`,87 file tracked modificati e70 voci
untracked complessive, inclusa la milestone precedente. Nessuno staging globale
o commit. La texture e il suo editing originale restano fuori da Git.

## Gate aperti

[U] Tipo preciso dell'ambiente, titolo definitivo, eventi riconoscibili,
ascolto del loop e telefono reale: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
Il passaggio del clock e le metriche di Editing non sono approvazione sonora.
Nessuna prova iPhone, background, Bluetooth o latenza low-end per questo WAV.

[U] Il WAV resta locale senza nuova codifica; un futuro derivato FLAC dovrà
superare identità PCM e decoder prima della delivery. Non caricato nel Site,
nessun trasferimento esterno dedotto dal mandato Editing. Classificazione e
pubblicazione richiedono decisioni distinte.
