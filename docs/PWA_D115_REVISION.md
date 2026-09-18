# D-115 — revisione PWA, registro delle sei milestone

16 settembre 2026. Mandato diretto nel prompt allegato: diagnosi,
implementazione, regressioni e candidato **solo PWA**. Nessuna APK (neppure
download/consegna), EAS Build, export nativo, pubblicazione, commit, push,
installazione o costo. La precedente APK non è una prova di questa revisione.

## Perimetro ed evidenza iniziale

[F] Checkout `codex/quiet-by-design-m2`, HEAD `53b506b`; index vuoto,
modifiche D-106–D-114 preesistenti preservate. Baseline di 549 identità e diff
ereditato in `dist/d115-baseline/`. Le cartelle Strategy sono escluse.
Non cambiare né copiare i master o i byte del catalogo locale.

[F] Browser Codex, viewport CSS 390×844, export Web locale di riferimento
`dist/d115-before`, marker `PLAYER-REVIEW.28-C2-LOCAL`; server loopback8098,
47 audio esistenti letti su richiesta, zero copie. Il primo avvio è stato
negato dal sandbox (`listen EPERM`); avvio loopback autorizzato dal controllo
permessi, senza aprire LAN o tunnel. Una scheda di errore non conta come prova.

[F] Product Design: Home corrente catturata; artwork e sei attività presenti.
Il player Hatha90/Rain espone604 pulsanti,1485 nodi DOM e2 scrubber. Il
contenuto scorre in un contenitore interno: l'altezza844 del documento NON
misura l'intera pagina. La gerarchia visibile del review è una lunga sequenza
di controlli rettangolari. Immagini in `dist/d115-audit/`; screenshot dinamici
non certificano accessibilità, fluidità o ascolto.

[F] Primo Play Hatha90/Rain osservato Playing; cambio Ocean osservato con
posizione avanzata, poi Stop→Ready. Nessun errore console in questo breve
percorso. Il crash segnalato dall'utente non si è riprodotto spontaneamente:
la riproduzione tecnica sottostante è tramite fault injection, non sul telefono.

## M1 — continuità audio (gate locale verificato)

### Cause riprodotte e correzioni

- **A1 / errore nella nuova dissolvenza:** il driver ritirava la sorgente
  naturale precedente e aggiornava il programma prima dell'ultimo scheduling
  AudioParam. Un errore in quel punto lasciava programma e sorgenti incoerenti.
  Riprodotto con test rosso; ora lo scheduling fallibile è preparato sul nuovo
  programma prima di ritirare il vecchio. In caso di errore la vecchia corsia
  è ripristinata e il retry non riavvia la musica.
- **A2 / timer obsoleti:** ogni cambio aggiungeva altri callback fino a fine
  sessione. Test rosso:11 timer contro limite8 già al primo cambio. Ora i timer
  della sola corsia naturale sono annullati al commit del cambio; quelli
  musicali rimangono sullo stesso clock. I callback eseguiti si autorimuovono.
- Il test iniziale dei20 cambi aveva inoltre un mock `prepareAt` che non
  aggiornava la posizione: corretto il mock, senza scambiare questo errore
  di test per un difetto del decoder reale.

### Prove

[F] Test mirati60/60 PASS nel primo consolidamento: controller, cambio live,
annullamento tardivo, clock futuro, crossfade e durate virtuali10–90 minuti.
Nuovo caso controller+motore:20 cambi consecutivi, pool4, massimo3 sorgenti
durante il cambio e2 dopo, deadline invariata, musica mai riavviata;
posizione0→80s, pausa3s senza avanzamento, ripresa→82s, seek100s,
ulteriore cambio→104s e timer1696s; Stop→Ready e nessuna sorgente attiva.

File prove rosso/verde: `dist/d115-m1-red.json`,
`dist/d115-m1-timers-red.json`, `dist/d115-m1-regression.json`.
Il consolidamento esteso finale supera **27 suite/302 test**
(`dist/d115-m1-audio-final.json`,30,685s), inclusi gli ultimi due casi pausa/seek
durante preparazione. Il run mirato finale supera40/40 test
in due suite (`dist/d115-m1-final-targeted.json`). Sono inclusi il vero piano
Hatha90 accelerato fino alla fine, rilascio delle sorgenti e zero timer residui.
TypeScript, configurazione progetto e lint dei quattro file di codice/test
modificati: PASS. Nessuna build nativa eseguita dal validatore configurazione.

[F] Browser Codex reale, candidato locale su loopback8099: Hatha90/Rain,
Play, Rain→Ocean→Rain, pausa stabile a03:42.88, ripresa, seek+30s,
nuovo cambio Ocean, Stop→Ready/90:00. Seed invariato
`yoga-music-rain-90-mu4bpe9r`; nessun errore console osservato.
I20 cambi sono verificati nel test controller+motore automatizzato, non
venti ascolti umani. Log: `dist/d115-audit/m1-browser-events.json`;
screenshot ispezionato: `dist/d115-audit/03-m1-player-after.png`.

[F] Il singolo seek osservato riporta100ms,2 richieste range e1 decode worker
da26ms. Non è una distribuzione statistica e non certifica prestazioni iPhone.

[F] Export **solo Web** `dist/d115-m1-pwa`: validatore PWA PASS,
184 file/12.457.996byte,53 route player, nessun byte audio né Audio Test o
QA Workbench. Precache161 file/8.377.408byte; +654byte rispetto al riferimento.
Marker `PLAYER-REVIEW.29-D115-M1-LOCAL`. Asset safety PASS (601file),
secret scan PASS (551percorsi/518file testuali). Nessuna pubblicazione.

### Perimetro del diff M1

Confronto SHA-256 con il worktree congelato: soltanto sei file preesistenti
cambiati: `src/audio/web/AdaptiveWebPlayback.ts`,
`src/content/reviewRevision.ts`, `tests/audio/LiveNatureFamilySafety.test.ts`,
`tests/audio/CrossfadeRobustness.test.ts`, `STATO.md`, `docs/DECISIONS.md`;
aggiunto questo rapporto. Artefatti di prova soltanto in `dist/` ignorato.
Index vuoto; diff ampio rispetto a HEAD già ereditato, non attribuibile a M1.
Nessun asset audio modificato, commit o staging effettuato.

[F] Fine collaudo: playback fermato; entrambi i server locali8098/8099
terminati normalmente e porte senza listener. Il candidato rimane su disco;
la PWA privata remota resta invariata. M2 parte come milestone separata.

## Aggiornamento privato M1 autorizzato — 16 settembre

[F] Richiesta successiva «aggiorna PWA»: pubblicazione della sola M1 verificata.
Sites39, stato succeeded17:01:52UTC, accesso owner-only (un account, zero gruppi
e visitatori esterni), revisioni accesso1/environment6 invariate.
Project `appgprj_6a9bed84f78c81919575b1cbe1876cd1`,
version `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_2f4f0417be788191b158b607f313af44`,
deployment `appgdep_6aaacb7211dc8191b31ddd5c7cc5cf7b`.

[F] Solo checkout isolato Sites aggiornato, commit
`54fd014b4d17dde20eb4fa143c22c504174dcc13` (README e public).
184 file client byte-identici al candidato M1; worker/catalogo/config invariati.
17 test hosting PASS; build/staging PASS; archivio186 file senza audio/map.
Precedente public recuperabile in `/tmp/app-relax-d115-site-backup.BCBXt9/public`.
Nessun commit/push del repository App Relax, nessuna APK/EAS o nuovo audio.

[F] Home, Hatha90/Rain e loop-review online puntano alla nuova entry;
entry online byte-identica, SHA256
`f15cc65de8c62d668be41aa7cc63ad25b1fb90f64f9622371815e1aa6fdc307a`;
pwa-update.js byte-identico. Non è ascolto o test iPhone.

[F] Verifica finale update.html: contenuto app invariato, script di sicurezza
Cloudflare aggiunto dall'edge prima di chiudere body; HTML non dichiarato
byte-identico. Accesso anonimo HTTP401. Checker `dist/d115-check-online.mjs`
completato exit0. La pubblicazione M1 non contiene il redesign M2–M6.

## M2 — primo consolidamento misurato

[F] Riprodotto rendering ripetuto dei controlli giunzione ad ogni aggiornamento
di posizione. Estratta una sezione memoizzata con callback stabile: marker,
target e calcoli del piano invariati. Benchmark React Profiler, stesso seed
`D115-M2-benchmark`, Hatha90 musicale8 sorgenti/7 giunzioni,24 aggiornamenti:
prima510ms totali/p50 16ms/p95 23ms; dopo103ms/p50 2ms/p95 5ms.
Sono tempi del renderer di test, non fps o latenza udibile del telefono.
Regressione deterministica: aggiornare il clock non richiama più map delle
giunzioni; nessun seek emesso dai render.12 test timeline/scrub verdi nel
primo run; nuova asserzione strutturale aggiunta al consolidamento finale.

[F] Browser: riferimento Hatha90+Rain catturato; misure CDP possibili,
scroll sintetico CDP non supportato. Cattura mobile corretta rispetto al DPR
1,7 della finestra per ottenere390×844 CSS reali. Non dichiarare fluidità
misurata da un singolo PageDown: confronto integrato prosegue con M3.

## M3 — barra tecnica e navigazione delle giunzioni

[F] `ReviewDock.tsx`: posizione/durata, seek, previous/next marker, inizio/fine
giunzione, loop/exit e stato sopra il footer Play/Stop esistente. Portale DOM
e ResizeObserver evitano il posizionamento nel contenitore scorrevole.
Target44px; errore/loading/disabilitazione riusano il controller esistente.
Sequencer prima dei dettagli; entry/exit/loop di ogni corsia, lista giunzioni
e diagnostica in disclosure separate. I dettagli sono memoizzati.
Seek libero aggiorna anche la giunzione selezionata senza rigenerare il piano.

[F] Browser reale390×844: Hatha90+Rain, Play→Pause, seek tastiera,
Join start→05:52.79, tutte e tre le barre allo stesso punto; Loop→05:22.79
(lead-in30s), Exit loop, Stop→Ready. Nessun errore console osservato.
Screenshot `11-review-final.png` ispezionato. Questi sono comandi del browser,
non un gesto fisico iPhone o un'approvazione uditiva del crossfade.

## M4 — Home mobile, confronto Product Design

[F] Prima: intestazione editoriale da sito e sei tessere in due colonne.
Dopo: brand22px, Settings44×72px, domanda primaria28px, sei azioni editoriali
orizzontali80px con artwork alternati e testi serif22px. Palette, file immagine
e sfondo pittorico invariati; nessuna nuova card arrotondata, pillola o immagine.
Ripresa ultima sessione e barra sessione corrente conservate e distinte.
Meditation→Play osservato Playing, titolo musicale assente, poi Stop.

[F] Catture accettate: `04-m2-home-before.png`, `05-m2-sequencer-before.png`,
`10-home-clean.png`, `11-review-final.png`, `12-home-landscape.png`.
Le catture06,08,09 hanno scala/posizionamento errato e NON sono prove finali.
390×844: sei attività visibili prima del footer senza sessione precedente.
844×390: nessun overflow orizzontale, Settings44×72, azioni800×81,
ripresa800×56; scorrimento verticale previsto in landscape.
Contrasto palette e semantica/accessibility label: test passati. Focus visibile
osservato nella timeline; VoiceOver/TalkBack reale non eseguito.

[I] La gerarchia riduce la ricerca dei comandi senza cambiare identità artistica.
Preferenza estetica e comprensione spontanea richiedono ancora giudizio umano.

## M5 — raccolte musicali e anti-ripetizione

[F] `ACTIVITY_MUSIC_POOLS` contiene sei proposte esplicite, filtrate per
visibilità/riproducibilità reale, file musicale e assenza ciclo Hatha:

| Attività   | Opere provvisorie                                          |
| ---------- | ---------------------------------------------------------- |
| Meditation | Distant Garden, Aquarian Drift                             |
| Yoga       | Quiet Field, Cedar Current                                 |
| Massage    | Mineral Drift, Moonlit Keys, Luminous Steps, Aquarian Echo |
| Relax      | Distant Bloom, Moonlit Veil                                |
| Sleep      | Moonlit Veil, Aquarian Drift                               |
| Focus      | Astral Thread, Luminous Grain                              |

[I] Associazioni editoriali, non nuova approvazione sonora. Il catalogo manuale
non è eliminato. Nessun audio nuovo; Eclipse Veil/Stillwater Halo/Soft Air esclusi.

[F] Causa ripetizione: la selezione precedente era letta soltanto per `single`;
musica+natura non forniva previousWorkId. Ora legge anche listeningWorkId del
programma adattivo e ultimo ascolto persistito prima di scegliere. Scelta una
volta, retry/timer/natura non cambiano brano. Storage fallito: lettura best-effort,
non si promette memoria persistente in presenza di errore storage.
Test su sei pool (almeno due alternative), precedente adattivo salvato,
avvio esplicito, retry stessa opera, natura e timer PASS. Durate60/90 già
ammesse da tutte le policy; regressioni durata/loop/controller incluse nella suite.

## M6 — prove integrate e residui espliciti

| Controllo                                   | Evidenza                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| Jest completo                               | 101 suite/756 test PASS,121.656s, `dist/d115-final-jest.json`                 |
| Audio                                       | 27 suite/302 test incluse nel run completo; precedente run dedicato PASS      |
| Tooling                                     | 54 PASS,0 fail,1 skip: test47 URL richiede variabile path esterno             |
| TypeScript / ESLint                         | exit0 entrambi, nessuna nuova dipendenza di tipi                              |
| Formattazione                               | ratchet PASS,1 file storico ammesso; nessun allentamento                      |
| Config, safety, artwork, ATP01, placeholder | PASS; solo asset audio preesistenti                                           |
| Secret scan                                 | PASS554 percorsi/521 file testuali                                            |
| Web consumer/QA                             | export PASS;12 artifact consumer puliti,16 QA con sentinel                    |
| PWA                                         | 184 file,12.458.574byte, marker30; zero audio                                 |
| Audit dipendenze online                     | PASS WITH ACCEPTED RESIDUALS: solo i due advisory image-size già circoscritti |
| Expo Doctor online                          | 19/20; atteso Expo~57.0.23, installato57.0.22                                 |
| Expo install check offline                  | up to date sulla mappa locale, esplicitamente non prova online                |
| Maestro                                     | solo Chromium non connesso; nessun runtime mobile disponibile                 |
| Figma                                       | richiesto, plugin abilitato;3 tentativi whoami restano in autenticazione      |

[F] Profiling ripetibile24 clock update/48 commit, stesso seed8 sorgenti/7join.
Baseline510ms totali,p50 16,p95 23. Primo memo103ms,p50 2,p95 5;
versione completa ultimo run mirato210ms,p50 3,p95 10. Sotto export concorrente
609ms,p95 43: forte sensibilità al carico host, non presentare un fattore di
accelerazione garantito. La prova deterministica è zero nuove map giunzioni
durante24 aggiornamenti e zero seek provocati da render. Fluidità/latenza
su iPhone NON DETERMINATO — EVIDENZA INSUFFICIENTE.

### RF App Success — decisione circoscritta

- [F] Utilità/avvio: Meditation→Play e Hatha90 con natura avviabili nel browser;
  nessun account, titolo musicale o scelta tecnica obbligatori nel consumer.
- [F] Affidabilità locale: regressioni verdi; recovery ambiente e timer protetti.
- [I] Comprensione: Home più compatta e comandi persistenti promettono meno ricerca;
  la promessa va validata osservando un utente, non contando test.
- [U] Preferenza, ritorno autonomo, disponibilità a pagare e release native:
  NON DETERMINATO — EVIDENZA INSUFFICIENTE. Nessuna analytics/billing introdotta.
- Decisione: candidato per review controllata, **non release approvata**.
  Gate residui: collegamento Figma richiesto dall'utente, autorizzazione patch
  locale Expo prima di chiudere Doctor, approvazione visuale/pubblicazione,
  poi prova fisica loop/latency/interruzioni/background.

### Perimetro Git

[F] HEAD canonico53b506b invariato, index vuoto,131 percorsi dirty totali
prevalentemente ereditati. Rispetto al baseline D115 cambiano: driverweb,
marker, Home/OutcomeGridTile, ImmediateSessionSetup/automaticListening,
PwaPlayerReviewControls/PwaReviewTimeline, relativi test e documenti.
Nuovi: ReviewDock, dichiarazione minima react-dom portal, benchmark timeline,
test ambiente M1 e questo rapporto. Il prompt redesign apparso nel frattempo
è materiale utente/strategia preservato, non attribuito a questa implementazione.
Tre vecchie route già eliminate nel worktree iniziale non sono cancellazioni D115.
Nessun commit/staging canonico, APK, EAS o nuovo byte audio.

### Chiusura operativa del candidato

[F] Export finale marker `PLAYER-REVIEW.30-D115-LOCAL`, entry
`entry-68ece52443d7c1f7f5bf1f884e0b955a.js`, SHA256
`54de9113c6fa1899d6ed1eeb91758956216052d9dbfe9301cc8b4a0a204e6ce8`.
Precache161 file/8.377.986byte. Validatore PWA, secret scan e format ratchet
PASS dopo il rebuild. Tre server locali8099/8100/8101 terminati normalmente;
verifica lsof senza listener. Browser ripristinato alle dimensioni normali.
Nessuna pubblicazione del candidato30: online resta la M1 Sites39.

[F] Ultimo controllo Figma: sito aperto nell'account Robert Fulton, piano Free,
ma il connector continua a richiedere autenticazione. Non confondere la
sessione del sito con l'autorizzazione del plugin. Nessun file Figma modificato.
[U] Arresto prima delle azioni richieste all'utente: completare collegamento
Figma–Codex e autorizzare la patch locale Expo57.0.23 necessaria al Doctor.
M6/obiettivo complessivo non dichiarati completi.

## Strumenti e limiti

### Uso esplicito Product Design + Expo, 16 settembre

[F] Nuovo audit circoscritto del candidato30, non della PWA online M1:
skill Product Design index/audit e framework, preflight senza contesto salvato;
skill Expo building-native-ui. Screenshot di questo run in
`13-product-design-home.png` e `14-product-design-review.png`, entrambi
390×844, salvati e ispezionati. Nessuna prova riciclata per questo audit.

1. Home dopo ascolto: sei attività e ripresa visibili insieme, Settings chiaro,
   titoli musicali assenti; gerarchia leggibile. Il testo di ripresa resta più
   prominente delle attività: scelta consapevole per il ritorno, da osservare
   con utenti nuovi e ricorrenti.
2. Review Hatha90 Ready: barra persistente159px + footer69px =228px/844,
   circa27% dello schermo. Controlli raggruppati e focus visibile, ma la densità
   tecnica rimane un rischio di spazio; non dichiarare design ottimale.
   Disabled coerente prima del Play; etichetta tecnica idle vs Ready e testo
   “keeps playing” visibile anche a riposo sono opportunità di chiarezza.

[F] Expo: configurazione e confine export consumer/QA ricontrollati PASS;
nessuna build Expo Go/nativa (RN Audio API e mandato solo PWA), nessuna nuova
dipendenza/installazione. I pattern HTML/portale del review sono esclusivamente
Web e non proposti come componenti nativi. Patch Doctor già segnalata, invariata.
[U] L'audit visivo non certifica WCAG completa, risposta touch, fluidità audio
o preferenza estetica. Nessun audio avviato durante questo controllo.

- RF Task Router: scope locale e milestone separate.
- Product Design audit: evidenza iniziale browser, densità e gerarchia.
- Expo networking: confine sorgenti/cache/errori, nessuna nuova dipendenza.
- Browser Codex: PWA reale locale, non prova Android/iPhone.
- Maestro: inventario disponibile solo Chromium non connesso; nessun telefono
  o emulatore attivo rilevato. Nessun test mobile eseguito.
- Figma: nessun file collegato trovato; non usato per produrre prove.
- Sentry: nessuna configurazione app trovata; nessun accesso/account introdotto.
- RF App Success: revisione circoscritta sopra; non certifica successo commerciale.

[U] Ascolto, loop percepito, latenza reale iPhone/Android, Bluetooth,
interruzioni, schermo bloccato, batteria e long-run fisico:
**NON DETERMINATO — EVIDENZA INSUFFICIENTE**. Non bloccano la preparazione PWA.
Deploy di questa revisione non autorizzato: stop al candidato locale verificato.
