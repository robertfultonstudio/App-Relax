# Welcome e ambiente live — revisione pubblicata

17 settembre 2026. Baseline HEAD `53b506b8bc65284dff4c66eb0c53d60893f83c40`,
branch `codex/quiet-by-design-m2`. Il worktree conteneva già 161 voci modificate;
preservate, nessuno staging globale o commit. Snapshot iniziale dei file in
`dist/live-ambience-welcome/baseline.json`; prove generate ignorate da Git.

## Implementato

- Ingresso `/` distinto dalle attività `/moments`, con artwork M6 esistente,
  CTA unica, movimento finito, feedback al tocco, Reduce Motion dinamico.
  Testo non animato, non sfocato. Passaggio di route fade 200 ms, disattivato
  con Reduce Motion. Nessun onboarding o riproduzione automatica.
- Play circolare 68×68 con triangolo disegnato, nessuna emoji o font Play,
  label screen reader, risposta immediata alla pressione e caricamento visibile.
- Rain/Ocean/Off durante il playback attraverso `AudioSessionController`.
  Musica e ambiente hanno bus, volume, decoder e cleanup separati. Off non
  acquisisce file/decoder naturali. Una sola famiglia naturale per volta.
- Cambio famiglia senza attese delle finestre editoriali: uscita del solo
  ambiente, caricamento e ingresso progressivo della nuova famiglia. La
  musica non si interrompe né riparte. Fallimento dopo l'uscita mantiene Off
  esplicito; annullamento, Pause, Stop e volume restano disponibili.
- Join durante una transizione naturale: viene raggiunta la registrazione
  entrante, senza riattivare quella uscente già iniziata quando era Off.
- Factory PWA e native preparano il contratto live anche partendo da Off;
  planner core e oracle musicali mantengono il contratto precedente opt-in.

## Prove e limiti

[F] Browser integrato reale, viewport 390×844, file FLAC esterni on-demand:
Welcome → attività → Meditation → Play → Rain → Ocean → Off.
Primo test Distant Garden, secondo Aquarian Drift. Analizzatori diagnostici
temporanei, non collegati all'uscita e non inseriti nel codice distribuito,
hanno rilevato PCM non nullo contemporaneo sui due bus:

| Stato | RMS musica | RMS ambiente | Gain musica |
| ----- | ---------: | -----------: | ----------: |
| Rain  |  0.0210048 |    0.0137764 |         0.5 |
| Ocean |  0.0251057 |   0.00345943 |         0.5 |
| Off   |  0.0622837 |            0 |         0.5 |

Il bus musica e la connessione della sua sorgente restano gli stessi; il
timer avanza senza reset. I valori sono campioni diagnostici, non misura
di loudness né approvazione sonora. JSON grezzo `browser-audio-probe.json`.
Screenshot runtime `welcome.png`, `play-icon.png` in
`dist/live-ambience-welcome/`.

[F] Dopo l'ultima correzione, ripetuto il percorso completo su Distant Garden:
Off → Rain → Ocean → Off → Pause → Resume → Stop, senza reset del timecode.
Feedback `Preparing ambience` e Cancel compaiono subito; musica continua.
Il primo caricamento dell'export sostituito a server acceso aveva una shell
obsoleta e un warning ServiceWorker. Riavviato il solo server statico locale:
nuovo documento, artwork e interazioni corretti, ServiceWorker `activated`,
nessun nuovo warning/error nel percorso finale. Registro completo preservato
in `browser-runtime-log.json`, senza nascondere il warning iniziale.

[F] Runtime Node 22.23.1, pnpm 11.16.0; Expo 57.0.23, RN 0.86.3,
React Native Audio API 0.13.2. Expo Doctor 20/20 e install check PASS.
I risultati finali sono conservati nei log della stessa cartella.

| Controllo finale                                          | Risultato                                      |
| --------------------------------------------------------- | ---------------------------------------------- |
| Jest completo, regressione audio inclusa                  | 105 suite, 771 test PASS                       |
| Tooling, inclusi range HTTP dei 47 file locali            | 55/55 PASS, zero skip                          |
| Typecheck / lint                                          | PASS                                           |
| Secret scan                                               | PASS, 588 percorsi / 548 file di testo         |
| Asset safety / config / boundary / font / artwork / ATP01 | PASS                                           |
| Expo Doctor / install check                               | 20/20 / allineato                              |
| Export PWA                                                | PASS, 187 file / 13.283.426 byte, zero audio   |
| Precache shell                                            | 164 file / 9.203.078 byte, zero audio          |
| Export Metro Android consumer                             | PASS, 111.510.635 byte, solo 2 WAV autorizzati |
| Export Metro iOS consumer                                 | PASS, 110.353.764 byte, solo 2 WAV autorizzati |

Gli export Metro sono bundle, **non build APK/iOS**. I due WAV incorporati
preesistenti totalizzano 103.680.088 byte; il catalogo esterno resta escluso.
Lo stress test esegue 20 cambi consecutivi, limite decoder, Stop/Pause/seek,
errore di preparazione e ingresso dentro una dissolvenza lunga. Il profilo UI
automatico della timeline misura p95 7 ms su questo Mac, non FPS o latenza
audio sul telefono. Nessuna pretesa di latenza zero o assenza assoluta di bug.

47 file modificati rispetto allo snapshot di inizio turno, elencati in
`dist/live-ambience-welcome/changed.json`: route/schermate Welcome e Moments,
Play/setup, controller e driver web/native, contratto natura, test e documenti.
Stato Git complessivo: 183 voci, incluse quelle precedenti; index vuoto,
HEAD invariato. Nessuna modifica ai percorsi strategia protetti.

[F] GitHub e Figma verificati in lettura. Nessun SDK/configurazione Supabase
nel progetto: nessun backend introdotto. Sentry non disponibile né
configurato: non sono stati consultati eventi Sentry. Nessun token richiesto
in chat o nuova telemetria attivata.

[U] Android fisico non collegato. Concorrenza, qualità e latenza native sul
telefono, touch/VoiceOver/TalkBack, Bluetooth, lock screen/background,
batteria e ascolto finale: **NON DETERMINATO — EVIDENZA INSUFFICIENTE**.
Non dichiarare tutti gli acceptance criteria soddisfatti.

## Gate successivo

Collegare Android con debug USB e autorizzazione al Mac. Verificare una build
che contenga questa revisione (non un APK precedente): avvio musica Off,
Rain on/off, Ocean on/off, cambio durante transizione, Pause/Resume/Stop,
volume musica invariato e timecode crescente. Nessuna build cloud avviata.
Sentry richiede un progetto già autorizzato/collegato: non aggiungere un
servizio a pagamento per supplire alla sua assenza.

[F] Dopo autorizzazione esplicita, la shell validata è stata pubblicata come
Sites41 sullo stesso indirizzo privato stabile:
`https://app-relax-private-review.robfulton.chatgpt.site/`. Marker online
`PLAYER-REVIEW.32-WELCOME-LIVE-LOCAL`; accesso owner-only invariato (un account,
zero gruppi e zero ospiti), richiesta anonima 401. Il browser autenticato ha
mostrato Welcome, passaggio a `/moments`, nuovo Play e i controlli
Rain/Ocean/Off; console senza warning/errori. Manifest `start_url`/`scope` a
radice, `display: standalone`, service worker, icona e meta Apple verificati.
Worker, catalogo, 45 audio e binding sono byte per byte invariati. Nessun byte
audio caricato, costo, APK/EAS, installazione globale o commit/push canonico.

[U] Installazione da Safari, aggiunta alla Home e riapertura standalone su
iPhone fisico: **NON DETERMINATO — EVIDENZA INSUFFICIENTE**. È il prossimo
gate umano e non viene sostituito dalla verifica browser autenticata.

[F] Chiusura: audio fermato, schede dei due test audio chiuse, viewport
ripristinato; server statico e ADB spenti, nessun listener sulle porte 8105
e 5037. Una vecchia scheda di errore browser non è stata manipolata perché
bloccata dalla policy URL; non contiene una sessione audio attiva.
