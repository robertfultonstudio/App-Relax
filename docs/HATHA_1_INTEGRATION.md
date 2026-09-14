# Respiro Hatha 1 — integrazione review, 12 settembre 2026

## Aggiunta richiesta dall'utente — 13 settembre, D-070

[F] **Pubblicata** sullo stesso [Site privato](https://app-relax-private-review.robfulton.chatgpt.site/), Sites 8 / env 4. Gli otto WAV sono stati verificati nel percorso remoto con SHA-256, HEAD e Range iniziale/finale byte-identici; il Worker ha poi verificato il catalogo completo (45 file ready). Chiave d'importazione ed expiry eliminate e nuova configurazione applicata. Accesso owner-only invariato; controllo negativo anonimo/chiave ritirata HTTP 401. Nessuna identità browser simulata tramite header.

[F] Verifica remota autenticata nel browser Codex: Settings `HATHA-REVIEW.2`, elenco Yoga aggiornato; `Space Unfolding` Playing, countdown, pannello DEVELOPMENT REVIEW e nessun errore console. Fermato dopo la prova. I 422 test e la prova browser non sostituiscono il test richiesto sull'iPhone.

[F] Dopo la chiusura dell'import, aperto il report `/_review/catalog` nel
browser realmente autenticato: **45/45 ready**, somma byte 4.002.191.597,
otto Hatha con gli SHA-256 del manifest. Nessuna modifica ad accesso o header
d'identità per ottenere questa verifica. Schede locali/report chiuse; server
temporanei spenti, PWA privata lasciata disponibile.

[F] La PWA privata finale `HATHA-REVIEW.2` comprende un pannello richiudibile
DEVELOPMENT REVIEW nel player consumer: barra di posizione touch/tastiera,
salti ±30 s/coda file, precedente/successiva transizione, loop ±30/60 s,
ascolto uscente/entrante/entrambi e variante A/B durata (60–300 s)/curva.
Il cambio variante ferma l'audio e richiede Play esplicito. La stima del
picco non è presentata come misura live. Nessuna coppia Hatha è inventata.

[F] Consolidamento dopo questa aggiunta: **422/422 test in 64 suite**,
145 regressioni audio incluse; lint/typecheck/formato PASS. 13 HTTP e
12 Worker PASS. Nuova PWA 119 file / **7.776.076 byte**, precache 117 file /
7.764.948 byte. Audio sempre separato e invariato. Export iOS 162.649.002 byte,
Android 163.804.787 byte; esattamente tre ATP01 e nessun pannello review.
Simulazione archivio 152 file / 159.985.043 byte. La verifica native grep
senza corrispondenze restituisce 1 come normale esito della ricerca, non un
fallimento dell'export (validatore esplicitamente PASS).

[F] Nel browser: `Space Unfolding` spostato a 03:35 e poi all'inizio dalla
barra; sessione onde raggiunta a due cambi; loop, ascolto selettivo e B da
240 secondi preparata con player fermo. Risolto un hydration mismatch sul
link di sessione con query; pacchetto finale Ready senza errori console.
Prove locali in `dist/hatha-integration/review2-*`. Restano invariati i
residui Doctor/audit e i gate musicali/telefono descritti sotto.

## Perimetro e provenienza

[F] Otto WAV della cartella autorizzata `00_AUDIO_EDITING/Respiro_Hatha_1_Loops_2026-09-12_v01/audio`, nel sound-design archive esterno. Copie locali byte-identiche in `public/audio-catalog/`, ignorato da Git/EAS. Nessuna rinomina, conversione, normalizzazione o modifica degli originali. Il successivo comando «quando finisci, pwa» autorizza questi stessi otto file sul Site privato esistente, non una pubblicazione pubblica o una build nativa.

[F] Identificativi, ordine, titoli inglesi, durata, byte e SHA-256 sono in `src/content/hathaAudioFiles.json`; registro separato `hathaCatalog.ts`. L'ordine 1–8 è metadata interno, non prefisso del titolo. Tutti sono Yoga / Standalone works, autonomi e in loop; nessun nuovo mixer.

| Ordine interno | Titolo pubblico     | Ruolo documentato             | Fase struttura | Durata WAV |
| -------------- | ------------------- | ----------------------------- | -------------- | ---------- |
| 1              | Threshold of Breath | Arrivo e centratura           | Arrival        | 465,75 s   |
| 2              | Air Between Hands   | Preparazione e mobilità dolce | Arrival        | 582,50 s   |
| 3              | Wave and Ground     | Slow flow I                   | Flow           | 823,75 s   |
| 4              | Quiet Expanse       | Slow flow II e tenute         | Flow           | 823,75 s   |
| 5              | Earth in Motion     | Lavoro a terra e allungamenti | Deepening      | 697,75 s   |
| 6              | Long Exhale         | Discesa verso il riposo       | Deepening      | 585 s      |
| 7              | Lingering Space     | Savasana e quiete             | Deepening      | 460 s      |
| 8              | Space Unfolding     | Ripresa e chiusura            | Return         | 230,75 s   |

[F] La fonte strutturale pertinente è `Respiro_Hatha_80min_MIDI_v03 2/Rerspiro Hatha 1 Project/03_ANALISI/Timeline_lezione.csv`, letta insieme a `INIZIA_DA_QUI.md` e `Sezioni_e_locator.csv`. La skill RF Music Knowledge ha guidato questa distinzione di provenienza: i contratti `Brani_e_fasi.csv` / `Contratto_musicale_playlist.json` trovati per **Centro comune** appartengono a un altro ciclo e non sono stati riutilizzati. [I] La proiezione dei ruoli nelle quattro fasi è strutturale, non un'approvazione di passaggi musicali.

[F] Il manifest storico dell'editing conteneva sette record e non il file 5; gli hash correnti di 3 e 7 differiscono da quella fotografia. L'ordine esplicito autorizza gli otto WAV correnti. Le metriche di tutti e otto sono state rimisurate senza alterare il segnale; nessun vecchio hash è stato inventato o promosso come corrente.

## Audio verificato

[F] Otto file PCM24 stereo / 48 kHz, complessivamente **1.344.744.700 byte**. RIFF, formato PCM/extensible PCM, frame count, durata, file hash e hash del payload PCM verificati; copied bytes/source hash invariati. `validate-hatha-audio.mjs` è idempotente e rifiuta file destinazione già presenti con hash diverso prima di copiare qualsiasi file. Nessun nuovo master in Git.

[F] Rimisura ffmpeg 8.1.2, ebur128 true-peak, un thread: tutti −18,0 LUFS; picchi da −7,9 a −5,8 dBTP. `playbackGainDb = 0`: il volume UI moltiplica il livello già preparato. Nessun limiter, doppia normalizzazione o secondo gain statico. Il n. 8 è precisamente SHA-256 `47cfdaa456cad4e959b0bed2c0b9404094b055c11757f85d00d41685d60ef61a`; il guadagno −4,4 dB e il raccordo circolare 12 s appartengono all'editing sorgente, non a interventi dell'app.

[F] Il player riusa il driver single-track: una sorgente, loop continuo del media element e fade iniziale del programma. Non è stato aggiunto un fade a ogni ripetizione. Il rapporto completo con PCM hash e misure è `dist/hatha-integration/audio-verification.json`; non è un'approvazione sonora.

## Disponibilità e gate di transizione

[F] Tutti gli otto sono disponibili in localhost e nella PWA privata in modalità review; non sono abilitati nativamente. La libreria Yoga mostra prima i nuovi Hatha nell'ordine documentato. Il testo informa che sono opere singole; non presenta una sessione evolvente già pronta.

[F] I pacchetti offline già approvati restano 37 file. I nuovi Hatha mostrano `Review audio · online listening only.`; il controllo download non consulta pacchetti inesistenti. Corretto il crash osservato nel browser, con test di regressione. Nessuna falsa approvazione offline o d'ascolto.

[F] `getCyclePhaseCandidates` seleziona per ruoli espliciti, non per titoli o posizione nell'array. I test rinominano e riordinano le opere per provarlo. Una richiesta di sessione per `cycleId=respiro-hatha-1` fallisce con `CYCLE_TRANSITIONS_UNREVIEWED`; non ripiega di nascosto su natura o altre musiche. Le transizioni che coinvolgono il ciclo sono rifiutate finché non vengono revisionate.

[U] **NON DETERMINATO — EVIDENZA INSUFFICIENTE**: per il piano Hatha evolvente servono safe entry/exit riferiti ai WAV finali, coppie compatibili approvate, durata/curva delle transizioni e politica di chiusura/adattamento alle durate. La timeline MIDI non certifica posizioni nel WAV editato/ruotato né i 180 secondi del precedente motore. Tonalità, energia e densità non sono state dedotte dai nomi. Il gate può essere risolto sul materiale esistente mediante revisione musicale, non richiede automaticamente nuovi brani.

## Prove del 12 settembre

- [F] 63 suite / **414 test PASS**, inclusi player degli otto titoli, provenienza/ordine/fasi, gain, fail-closed e regressioni audio/offline. Typecheck, lint e formato dei file modificati PASS.
- [F] Trasporto locale HTTP **13/13 PASS**, HEAD e Range iniziale/finale byte-identici su tutti i **45 file** (37 precedenti + 8 Hatha), totale **4.002.191.597 byte**. File caricati su richiesta, non all'apertura.
- [F] Browser Codex reale: tutti gli otto aperti dalla libreria Yoga, Play → Pausa → Stop raggiunti; sul primo osservato countdown in decremento. Nessun errore console nel pacchetto corretto. Prova funzionale breve, non ascolto completo o long-run iPhone.
- [F] PWA: 119 file / **7.686.637 byte**, 53 route player, **zero byte audio**, zero Audio Test/Workbench. Precache 117 file / 7.675.509 byte; revisione `HATHA-REVIEW.1`. Audio separato nello storage privato.
- [F] Export Metro iOS 49 file / 162.648.255 byte e Android 53 file / 163.804.101 byte. Entrambi hanno soltanto i 3 WAV ATP01 (155.520.132 byte); nuovo catalogo assente. Non sono build native.
- [F] Simulazione locale `.easignore`: 152 file / 159.983.545 byte; archivio e scansione mirata segreti/path PASS. Nessuna operazione EAS. I file sorgente protetti e i percorsi Strategia sono esclusi.
- [F] Worker privato: **12/12 test PASS**, build PASS; audit delle sue dipendenze **0 vulnerabilità**. Auth owner-only e import a scadenza restano invariati nel modello.

## Residui toolchain — non mascherati come PASS

[F] Il fresh check differisce dal checkpoint D-068 senza cambi al lockfile: Expo Doctor **19/20**, install-check segnala dieci patch Expo disponibili (57.0.20 → ~57.0.22 e moduli correlati). Il dettaglio è nei log `doctor.log` e `expo-install.log`. Nessun aggiornamento automatico dello stack durante questa integrazione audio.

[F] `security:audit` resta **FAIL** per tre advisory nuovi rispetto alla policy: joi 17.13.4 (due advisory) e js-yaml 3.15.1/4.3.1 (uno, su due rami), oltre ai due residui image-size già accettati. I percorsi effettivi sono EAS schema, Jest/coverage, ESLint e CLI Expo; non sono dipendenze runtime del Worker. Non è stata allentata la policy né aggiunta un'eccezione fittizia. Questo blocca una dichiarazione di gate repository interamente verdi / release nativa, non il test privato della shell statica e del Worker invariato.

[F] Fonti primarie: [Joi custom messages](https://github.com/hapijs/joi/security/advisories/GHSA-6w3j-5fw6-r9vr), [Joi rename](https://github.com/hapijs/joi/security/advisories/GHSA-gg4h-3hg2-grpc), [js-yaml merge](https://github.com/nodeca/js-yaml/security/advisories/GHSA-2883-xcg3-v3hh). Fix dichiarati: joi ≥17.13.6, js-yaml ≥3.15.2 / ≥4.3.2. Il JSON audit completo conserva catene/versioni verificabili.

[I] Runbook manutenzione separata: partire dal diff approvato; aggiornare localmente le sole patch Expo suggerite e le risoluzioni transitive compatibili; rigenerare il lockfile senza installazioni globali; rieseguire peers, Doctor/install-check, audit, tutti i test ed export; confrontare fingerprint prima di autorizzare una nuova build. Non modificare le allowlist per far diventare verde l'audit.

[U] Ascolto e stabilità dei nuovi otto WAV su iPhone, loop percepiti, background, Bluetooth e interruzioni restano gate umani/piattaforma distinti. Nessuna approvazione è dedotta dal timer o da un test simulato.
