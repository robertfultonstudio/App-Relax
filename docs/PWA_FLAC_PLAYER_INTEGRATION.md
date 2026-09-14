# Player PWA lossless — D-080

13 settembre 2026. I capitoli D-078/D-079 restano cronologia delle prove
precedenti. PLAYER-REVIEW.10 ha superato localhost ma ha fallito online per
riserva iniziale insufficiente. Correzione PLAYER-REVIEW.11 pubblicata sullo
stesso Site privato e verificata online nei casi descritti sotto.

## Perimetro reale

- [F] 24 FLAC natura già approvati e già sul servizio. Nessun asset modificato,
  nessuna nuova traccia, master read-only. Le 21 musiche restano WAV PCM24.
- [F] PWA: decoder a finestre in worker, PCM stereo 48 kHz canonico,
  probe metadata limitata, richieste fino a 8 secondi e 4 MiB compressi.
  Non scarica/decodifica intere opere prima del Play. Massimo quattro deck.
  Da .11, Ready richiede almeno otto secondi disponibili (un ciclo completo
  per file più corti); tipicamente una finestra di due più una di otto secondi.
- [F] 24 indici: 520.015 byte, SHA vincolato al registro e al manifest audio.
  Cache applicativa di quattro indici verificati, fetch/parse alla selezione.
  Il service worker include TUTTI gli indici nella shell offline: non si
  sostiene quindi che l'installazione scarichi soltanto l'indice selezionato.
- [F] Worker: 76.166 byte, SHA-256
  `4c13ea62317481fa2d4ff8d0caeb4cbb3969215bd49b2e866fbad081505af5d0`.
  FLAC 0.2.11, esbuild 0.28.2; minificazione normale, property mangling assente.
  Richieste con ID monotono per worker; abort/timeout/close terminano il worker
  e rifiutano il lavoro pendente. Nessun requisito crypto.randomUUID.
- [F] codec-parser 2.5.0 LGPL rimane nel bundle. In `public-pwa/flac-source/`:
  notice, sei licenze, esatto tarball originale, quattro file d'integrazione e
  istruzioni di relink. Manifest/hash verificati nell'export. La documentazione
  non equivale a un parere o certificato di conformità legale.
- [F] Main e ambiente restano indipendenti. Off/Rain/Ocean waves nel normale
  setup; durante Play volume/mute ambiente disponibile, scelta famiglia dopo
  Stop. Titoli e dati tecnici rimangono nel pannello Development review.

## Clock, revisione e cancellazione

[F] WAV e FLAC usano lo stesso audio clock. Ogni prossimo segmento PCM viene
preparato un secondo prima e fissato all'anchor assoluto, non all'istante in
cui il codice termina la preparazione. Se manca la deadline si ferma con
errore: non taglia una frase per fingere continuità. Pausa e seek invalidano
epoch, timer e richieste; una sorgente futura già schedulata non entra nella
lista di ripresa finché non è realmente attiva.

[F] FLAC remoto richiede ETag forte, SHA dichiarato identico al manifest e
If-Range per le finestre successive. Indice valido non equivale a file valido.
Il server locale rifiuta file cambiati dopo l'avvio. I blob offline sono
ammessi soltanto dal resolver dopo la verifica SHA del pacchetto; nessun URL
arbitrario inserito dall'utente viene promosso a sorgente verificata.

## Prove eseguite

- [F] Run finale .11: lint/typecheck PASS, Jest 74 suite / 526 test PASS.
  Il test con risposta ritardata di quattro secondi dimostra che Ready e
  audio clock restano chiusi finché la seconda finestra è disponibile.
  Il clock non parte più con soli due secondi di buffer. Prettier finale .11 PASS.
- [F] 14 test HTTP PASS, inclusi HEAD e prime/ultime finestre byte-identiche
  di tutti i 45 file, If-Range e rifiuto di file scomparsi/modificati.
- [F] 8 test worker PASS: matching ID, messaggi corrotti, abort, close,
  buffer parziali, concorrenza/cap, reset/error shape nel vero WASM.
- [F] Browser integrato con il worker realmente minificato: tre file,
  1.728.000 campioni ai punti loop/finestra identici al riferimento indipendente.
  Report `dist/flac-window-spike/browser-compiled-clock-report.json`.
  Render offline: NON è ascolto, performance in tempo reale o prova iPhone.
  Ripetuto dopo la riserva .11: ancora zero errore su 1.728.000 campioni.
- [F] Export `dist/m5-pwa`: 162 file, 8.502.060 byte, zero audio.
  Precache 160 file / 8.486.914 byte, revisione
  `ded8a571d2281642c562f9fd36032063e7eb680bc438acc48a8ce7ed8080f8f5`.
  Validatore PWA verifica hash degli indici, worker e pacchetto source/notices.
- [F] Asset safety, config e separazione QA/PWA/native PASS. Il nuovo decoder
  viene iniettato soltanto da createPwaAudioDriver; non è un adapter nativo.
- [F] Audit indipendente su snapshot: nessun P0/P1 concreto; copertura all-PCM
  aggiunta separatamente dai test legacy HTML.
- [F] Vero export aperto nel browser Codex: Home → Meditation → Rain → Play;
  mute ambiente 50→0→50% con main 80% invariato, Stop → Ocean waves → Play.
  Seek prima del cambio Rain, attraversamento effettivo dell'anchor e stato
  Playing ancora attivo dopo il cambio. Hatha60+Ocean: otto fonti musicali,
  tutti gli otto raccordi visibili; salto a 04:43, attraversato l'avvio della
  seconda musica a 05:13 senza errore visibile. Pearl Tide autonomo: salto
  a 02:21, superato EOF 02:36 con posizione tornata a 00:26 e stato Playing.
- [F] Traccia HTTP della prova: 231 richieste audio, tutte GET Range finite
  con risposta 206, massimo 2.304.000 byte; nessun full GET o stato fallito.
  Quattro FLAC Rain/Sea, due ulteriori FLAC per Hatha e sette WAV richiesti
  fra preparazione, cambi e playback. Sono dati di funzionamento, non ascolto.
- [F] Screenshot player con volume ambiente/main e controlli review ispezionato.
  Audio fermato, due schede diagnostiche chiuse, server 8254 terminato e porta
  verificata libera. Nessun emulatore o server Metro permanente.
- [F] Simulazione locale dello scope `.easignore`: 160 file / 160.068.143 byte,
  esattamente tre WAV ATP01, nessun catalogo consumer o sorgente PWA incluso.
  Validatore archivio PASS; non è una build né un comando EAS.

## Residui espliciti

[F] Security audit FAIL: GHSA-6w3j-5fw6-r9vr e GHSA-gg4h-3hg2-grpc (joi),
GHSA-2883-xcg3-v3hh (js-yaml su due rami). Già documentati in D-069, nessuna
nuova eccezione. Doctor 19/20 e install-check segnalano dieci patch Expo;
nessun upgrade generalizzato durante questa correzione audio. Runbook D-069.

[U] Ascolto loop, RAM/CPU su iPhone debole, rete lenta, background/lock-screen,
batteria e interruzioni: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
Il lettore preserva i campioni: non corregge una discontinuità già nel master.

[U] 21 derivati musicali FLAC ancora esterni e non caricati. Il catalogo remoto
rimane 4.002.191.597 byte; proposta interamente FLAC 2.371.806.490 byte (-40,74%).
Questi numeri NON descrivono un upload già eseguito. Nessun commit canonico,
nuovo audio, EAS, costo o modifica accessi autorizzato da questa integrazione.

## Revisione remota e recupero del difetto iniziale

[F] PLAYER-REVIEW.10 / Sites 19 è stata pubblicata owner-only, poi la prova
online ha mostrato `Audio buffer ran out` dopo circa due secondi. L'aggiornamento
non è stato consegnato come accettato. Il worker non aveva corrotto i campioni:
il problema riproducibile era il clock aperto prima della riserva successiva.

[F] .11 abbassa subito readyState su pausa/nuova preparazione, esige otto
secondi o un ciclo completo, consente wrap di file brevi e ha un cap esplicito
di iterazioni. Fallisce ancora se la rete non può alimentare il playback:
non inserisce silenzi o tagli fingendo continuità.

[F] Export .11 `dist/review11-pwa`: 162 file / 8.501.477 byte, zero audio.
Precache 160 file / 8.486.331 byte, revisione
`c0a83beca4499136a624f7bac268dc0fddcfb446d039879fd94e1705d8db090b`.
Archive Sites `tmp/player-review11-site.tar.gz`: 3.886.014 byte, SHA-256
`c3244b17b82e4d87b6e15d5218409312ccbfd4202118993eace7b6165baaba5b`.
Il validator iniziale dell'archivio era troppo generico per i percorsi font
Expo `assets/node_modules`; verifica corretta limitata ai soli PNG/TTF già
presenti nell'export. Nessun node_modules sorgente, audio o sourcemap incluso.

[F] Commit della sola copia privata Sites:
`b367a81f6bcb34f52739f4d2e1dbab0de24ce0af`. HEAD dell'app canonica resta
`6549f0117f2d7623fe20816cbf2c687385af6b8d`, index vuoto; modifiche app non
committate. Node 22.23.1, pnpm effettivo 11.19.0 (wrapper locale), dichiarato
11.16.0. Nessuna modifica del runtime di sistema.

[F] Sites 20 / env 4: deploy `appgdep_6aa6284dc1e48191b07d627ded67bb6b`
con stato `succeeded`, versione
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_5fcb542de7e881919540fa1b83756370`.
Stesso URL owner-only, nessuna modifica degli accessi o dei 45 oggetti audio.

[F] Verifica online .11 nel browser integrato, non localhost: `Distant Garden`
con Rain ha superato 01:08 in stato Playing, incluso il loop naturale a 00:43.
Mute 50→0→50% mantiene main a 80%; pausa e ripresa confermate fino a 01:26.
Stop → Ocean waves cambia realmente famiglia e riparte in stato Playing.
Il pannello identifica PLAYER-REVIEW.11 e mostra loop, ingressi/uscite e
raccordo naturale 08:30–11:30; il salto Audition a 08:00 è stato eseguito.
Superato l'avvio reale del raccordo a 08:30 e proseguito fino a 09:01 in
Playing senza errori visibili. Non è una prova dell'intera durata del raccordo.
Screenshot del player con ambiente/main e review ispezionato; Stop confermato
da Ready e timer 20:00. Queste sono prove di stato/runtime, non un'approvazione
sonora iPhone. Porte 8252/8254/8081 libere; audit indipendente conferma HEAD/index
canonici invariati e checkout Sites pulito. Nessun emulatore avviato.
