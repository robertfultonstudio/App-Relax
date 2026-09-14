# Audit richieste PWA — 13 settembre 2026, D-081

## Audit corrente — 14 settembre 2026, dopo D-105 / PLAYER-REVIEW.23

Il turno precedente è **progresso**: ha corretto e pubblicato updater,
visibilità review e richiesta della categoria audio iPhone, con prove runtime
prima e dopo la pubblicazione. L'obiettivo complessivo dell'utente resta
«PWA con tutte le novità implementate e completamente funzionante»: non è
ridotto al solo smoke test del browser e **non è dichiarato raggiunto**.

| Requisito                                          | Evidenza pertinente corrente                                                                                                        | Esito                                                                                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| PWA privata effettivamente aggiornata              | Sites34, source `9f736d35e00ed31e722b8ab0f9bf997bf55b1e67`; updater → Home .23; 79 HTML/105 asset remoti confrontati                | [F] Verificato D-105                                                                                                                 |
| Hatha90 come sessione, player e controlli visibili | Runtime .23: 8 brani, timeline/entry/loop/13 giunzioni con Ocean, Play/Pause/seek/Stop                                              | [F] Flusso browser verificato; ascolto iPhone ancora [U]                                                                             |
| Tracce separate e scorrimento per loop test        | Inventario online45; Cedar Current, slider120 → 02:00, ultimo5s → wrap osservato                                                    | [F] Comandi verificati; nessun verdetto sulla cucitura sonora                                                                        |
| Musica e una natura scelta con livello separato    | Rain/Ocean preservati; Hatha90+Ocean verificato, regressioni correnti `AdaptiveMixedSources`, `sessionNatureControl` e player       | [F] Implementato; esito acustico telefono [U]                                                                                        |
| Tutto il materiale consegnato anche online         | Manifest privato45 FLAC/2.371.806.490B; i due manifest D-090/D-092 sono local-only, fuori dal manifest Site                         | [U] Field Ambience e Night Birds non pubblicati; richiedono autorizzazione separata al payload audio, non esclusione tacita dal goal |
| Play udibile sull'iPhone che aveva fallito         | HTTP206 del telefono precedente; categoria opzionale playback ora richiesta al gesto; test e browser non sono misura speaker iPhone | [U] Ritest umano richiesto, causa/esito non determinati                                                                              |
| Nessun click/gap nei loop e raccordi               | Wrap browser, scheduling e regressioni software; otto Hatha ancora listening-pending                                                | [U] Ascolto sul telefono richiesto                                                                                                   |
| Reattività quasi immediata                         | D-105 remoto: primo seek1015ms, slider513ms, con richieste HTTP a dati non pronti                                                   | [U] Target non dimostrato; non si promette latenza nulla                                                                             |
| Offline e comportamento mobile prolungato          | Salvataggi preservati, streaming autenticato; review privata online-first                                                           | [U] Non dedurre riapertura offline/background/long-run su iPhone                                                                     |
| Nessun costo/build o modifica esterna fuori scope  | D-105 solo Site esistente, catalogo/accessi/worker invariati; nessun EAS o commit canonico                                          | [F] Perimetro rispettato                                                                                                             |

[F] Controverifica locale dopo la consegna: validatori PWA dell'export finale
e config PASS. Worker/HTTP: 29/29 test PASS, zero skipped nel run con
`APP_RELAX_TEST_LOSSLESS_ROOT` esplicito read-only. Include HEAD e primi/ultimi
range esatti di tutti i47 file locali; **non** prova che quei47 siano online.
Il primo run aveva un test saltato per root esterna non indicata: conservato
come risultato distinto, poi eseguito senza saltarlo. La suite app finale
resta91/667 PASS (`dist/d105-jest-final.json`); nessuna nuova modifica runtime.

[F] Audit indipendente sui documenti in copia isolata concorda sul gate
iPhone ancora aperto. Il set45 online non viene usato per ridefinire
automaticamente «tutte le novità». D-074 pannello chiuso, D-081 musica WAV
online e D-104 .22 sono storia, non lo stato corrente. APK, store e commit
sono azioni separate, non nuovi lavori da avviare per questo audit.

[U] Arresto operativo: attendere il riscontro Play/loop/transizione sullo
stesso iPhone; per i due asset local-only serve prima autorizzazione al nuovo
caricamento. Nessuna ripubblicazione identica, nuovi server o build sono
necessari per ottenere quel riscontro. Prove complete in
`PWA_PRIVATE_D105_FIX.md`; l'obiettivo resta attivo, non completo.

## Aggiornamento D-084 — reattività Play/seek, PLAYER-REVIEW.16

[F] Eliminati doppio rebuild QA, avvio PCM a zero prima del seek e attesa
dei futuri non imminenti. Riuso metadata/PCM per URL, indici autenticati
condivisi (18), affinità deck e recupero delle finestre schedulate alla pausa
entro quattro slot. FLAC inizia con una finestra 8 s anziché 2+8; niente
riduzione dei gate 8 s startup/32 s refill/4 MiB/identità PCM. I futuri
attendono il runway attivo, salvo ingressi entro 8 s preparati prima di Ready.
Attacco iniziale PWA 80 ms; raccordi lunghi, file e fade finali invariati.

[F] Lint/typecheck/Prettier PASS; Jest 78 suite/562 test PASS, audio dedicati
19 suite/205 test PASS; test addizionale di refill doppio sospeso e pausa che
cancella un futuro PASS. Config, asset safety (486 file), confini QA/PWA/EAS,
HTTP14 e Worker17 PASS. Nessun nuovo segreto o byte audio introdotto.
Expo Doctor/audit dipendenze non rilanciati: residui D-069 ancora aperti,
non confusi con i test di questa correzione.

[F] Export finale: 183 file/12.585.687 B; precache160/8.505.119 B,
`5eca49646047cd556aa58bdd6f85e09ad57e9253f071675c3d326cefa5fe133f`.
Bundle `entry-b4a7a51681c892c5250f4f5dcbdbafc6.js`, ispezionato anche per
guardia delle revisioni sul prefetch e cleanup del controller. Scan dei JS,
HTML/JSON per path sorgente e pattern token/Bearer: zero match.

[F] Prova locale preliminare, seed `yoga-music-sea-90-mtzsf3of`: Play,
Jump 05:22 a dati nuovi301 ms; ritorno dopo pausa243 ms; stesso punto43 ms.
Misure `performance.now` dentro l'azione del controller, non durata del tool;
clock audio fino a ulteriori60 ms, senza certificare l'uscita acustica.
Questa prova precede l'ultimo gate di priorità refill e cancellazione futura:
non è presentata come benchmark della versione finale o come iPhone.
La shell locale vecchia è stata aggiornata dalla pagina ufficiale di recupero;
le prime richieste WAV nel report appartengono alla shell precedente.
Audio fermato e server/scheda locale chiusi al termine.

[F] Sorgente Sites isolata `d6a3421eabc97d01c3a00fc332d7db7422c86e4a`;
archivio12.800.000 B SHA256
`6a17e38204cadfb838486a6947bbe4dd100a8999feaa80fdeabaf611542a1386`.
Site27 predisposto sullo stesso accesso: un owner, zero gruppi/ospiti;
nessuna modifica storage, catalogo remoto, import, costo o credenziale runtime.

[F] .16 pubblicata Sites27/env6, deployment
`appgdep_6aa69981c2a48191b42d06ce6edbe42a` succeeded. Nella scheda esistente
Hatha90+Ocean, seed `yoga-music-sea-90-mtzsxye2`: primo salto1460 ms,
ritorno1548 ms, ripetizione a dati pronti36 ms; due cambi successivi3614 e
2660 ms. Stop verificato. Questa controprova NON raggiunge l'obiettivo sui
punti freddi e non viene presentata come soluzione definitiva.

[F] .17 aggiunge finestre FLAC ancorate esattamente al campione richiesto,
anziché alla griglia globale precedente. A target100 s le due corsie fanno
due sole letture totali da8 s, non quattro; cache covering e scheduling
restano sample-exact. Regressioni562 e audio205 PASS dopo la correzione.

[F] .17 pubblicata Sites28/env6, deployment
`appgdep_6aa69bb6958c8191ad682fd3edc92b72` succeeded. Sorgente isolata
`eb3561dbeae220b30291045775ff77ef82bf8aed`, archivio12.800.000 B SHA256
`32e38b519ef4efd4af667a012a2137f2033896af6eb653d31938390ade66cf49`.
Export183/12.585.781 B, precache160/8.505.213 B,
`7d81d87bcfd8a4e65f4d913f0a657a2837cc2486158af510d04ea5baa3c9f072`;
bundle `entry-769f2c3b0af07bdd72241a54670458a4.js`. Scan export zero match.

[F] Nella scheda online esistente, seed `yoga-music-sea-90-mtzt9uox`, Hatha90
con Ocean: primo salto05:22=1366 ms, Next13:12=2897 ms; ritorno al target
dopo pausa1587 ms; stessa posizione già pronta46 ms. Loop tecnico13:12–16:05
configurato senza secondo seek, Play/Pause verificati. Questi sono tempi
interni dell'azione, più fino a60 ms di clock, non misura acustica su iPhone.
La prova esclude una promessa quasi-zero per target nuovi; le differenze fra
seed/corsie/rete non giustificano un confronto percentuale controllato.

[F] Ripresa finale in Playing a14:02 dentro il secondo raccordo, poi Pause e
Stop verificati → Ready90:00. Scheda privata esistente lasciata aperta con
revisione visibile; nessuna scheda locale, server8251, Metro o emulatore
rimasti dalla prova. Worktree canonico:77 tracked modificati/53 untracked
(incluso lavoro preesistente), index vuoto; HEAD canonico invariato.
File della correzione: ClockedWavSource, AdaptiveWebPlayback,
positionMediaElement, WebAudioDriver, AudioSessionController e interfacce;
PwaPlayerReviewControls, createPwaPcmReader/PwaFlacIndexStore, reviewRevision;
test ClockedWavSource/AdaptiveWebPlayback/AdaptivePcmLatency/CrossfadeRobustness/
AdaptiveSessionController/pwaPlayerReview; STATO, DECISIONS e questo audit.

[U] L'obiettivo di risposta quasi
immediata non equivale a zero latenza per un target freddo: rete e decoder
restano necessari. Ascolto Safari/iPhone, telefoni economici e long-run
rimangono gate umani. Nessun commit del repository canonico.

## Aggiornamento D-083 — Hatha90, PLAYER-REVIEW.15

[F] Corrette durata mancante e accessibilità della revisione: la preparazione
Hatha PWA espone 30/45/60/90; `Playlist & development player` apre i controlli
senza Play implicito. La barra corrente indica la durata effettiva. Default
consumer chiuso, accesso esplicito `review=1` apre/scorre al pannello; comandi
di salto e audition prima del dettaglio completo di tracce e marker.

[I] 90 minuti = otto file in ordine, due iterazioni extra integrali in Flow e
Deepening, sette raccordi musicali di circa 112,964 s. Due loop aggiuntivi
esplicitamente marcati; non sono nuove composizioni né approvazione musicale.
La durata esatta è 259.200.000 frame. Rain: nove registrazioni; Ocean: sette;
le giunzioni naturali da 180 s restano sfalsate rispetto a quelle musicali.

[F] Gate locali: lint/typecheck/Prettier PASS, Jest 77 suite / 556 test PASS,
audio 18 suite / 199 test PASS; HTTP 14/14, Worker privato 17/17, safety,
config, confini PWA/EAS, catalogo consumer, Hatha 8/8 e ATP01 3/3 PASS.
Export: 183 file / 12.582.534 byte, zero audio; precache 160 / 8.501.966 B,
revisione `8ecc27a204ac126d322fd90a39b079f8ddd978a29ee6e6c2194877b0860a7919`.
Bundle `entry-9c12b4e15a52afb359351a8f1d6411da.js`.
Scan export per path locale/token/Bearer: nessun match; `git diff --check` PASS.

[F] Browser locale: 90 selezionabile, link alla playlist apre Ready/90:00,
otto musiche, due loop, sette raccordi e nove nature visibili. Screenshot
runtime mostrato nella task. Seed finale Rain `yoga-music-rain-90-mtzow7ul`:
Play; seek 15 s prima del loop 27:26.07 → Playing 27:43; secondo loop
62:45.39 → Playing 63:09; pausa a 63:18 e ripresa; Exit8 avvia gli ultimi
15 s → Completed/00:00. Questa è una prova accelerata con seek, NON un
ascolto ininterrotto di 90 minuti. Server e scheda locale chiusi.

[F] Stesso Site owner-only, un utente owner/zero gruppi/zero ospiti. Sites26,
env6, deployment `appgdep_6aa67f9564008191be9324c8daf00b02` succeeded.
Sorgente isolata `13487669a13a8dd7b183f4a65b177552fc2b222d`; archivio
12.800.000 B, hash `a9e4956e205891accfd612f99e546fd096acfddd271eadf31adaf70d205f2eba`.
Nessun upload audio, credenziale runtime o impostazione di costo modificata.

[F] Online .15 verificata nella scheda esistente, vista stretta per il test
mobile: Ready/90:00, pannello aperto e playlist effettiva. Seed Ocean
`yoga-music-sea-90-mtzp0ij9`: Play → Playing; salto all'inizio del primo
raccordo 05:52.78, attraversato per intero fino a Playing/08:10, oltre fine
07:45.75. Stop → Ready/90:00, pannello lasciato aperto, audio fermo e sola
scheda utente mantenuta. Screenshot runtime mostrati nella task; non screenshot
o prova di un iPhone reale. La ripetizione locale ha richiesto 145 Range FLAC:
144 completati HTTP206 (max 2.028.064 B), uno non completato nel run con
salti di posizione, nessun WAV. Porta8251 e processi di export/prova spenti.

[U] Restano ascolto iPhone delle cuciture,
long-run/background/RAM e residui dipendenze D-069; nessuna certificazione
sonora ricavata dal browser. Repository canonico non committato: HEAD
`6549f0117f2d7623fe20816cbf2c687385af6b8d`, index vuoto, preservate 75 modifiche
tracked + 52 voci untracked pregresse (incluse cartelle).

[F] Perimetro D-083: factory `createWholeFileReviewProgram`, tipo ending,
guardia dei riferimenti `AdaptiveWebPlayback`, `AdaptiveSessionSetup`,
`CurrentSessionBar`, wrapper PWA adaptive-session, `PwaPlayerReviewControls`,
`PwaReviewTimeline`, `reviewRevision`; test wholeFileReview, setup,
currentSessionBar, pwaPlayerReview, productShell e AdaptiveMixedSources;
STATO/DECISIONS e questo audit. Tutte le altre modifiche precedenti preservate.

## Aggiornamento corrente D-082

[F] Il prospetto sotto è la fotografia D-081. La successiva autorizzazione
di Robert ha portato a 21/21 musiche FLAC caricate e catalogo attivo tutto
FLAC (45 registrazioni, 2.371.806.490 B). PLAYER-REVIEW.14 online owner-only,
Off/Rain/Ocean, volume ambiente e strumenti sviluppatore preservati.
La .13 ha fallito una controprova online e non è la consegna corrente.
Risultati, chiusura import, correzione refill, file e residui in
`PWA_MUSIC_FLAC_DELIVERY.md`. Gate ascolto iPhone sempre distinto.

Obiettivo: correggere la consegna segnalata da Robert, non limitarsi alla
presenza di un selettore. Correzione locale PLAYER-REVIEW.12. Il turno
precedente è progresso; una prova più lunga di .11 ha poi contraddetto
l'ipotesi di ciclo Hatha interamente funzionante.

## Richieste e prove

| Richiesta                                            | Evidenza corrente                                                                                | Esito                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Estetica minimale, titoli secondari, attività → Play | Home/Yoga online .11; test Home/ImmediateSessionSetup; catalogo Settings → Listening preferences | [F] Presente, nessun redesign D-081                        |
| Una musica scelta silenziosamente e in loop          | automaticListening, createListeningNatureProgram, test selezione/marker                          | [F] Codice/test; loop iPhone non certificato               |
| Hatha come successione, non loop mascherato          | createWholeFileReviewProgram, file interi ordinati 30/45/60; prove .12 locale/online sotto       | [F] .11 fallita; raccordi .12 verificati nel browser       |
| Natura scelta dall'operatore, livello autonomo       | Off/Rain/Ocean prima di Play; mute online mantiene main 80%                                      | [F] Presente; famiglia modificabile dopo Stop              |
| Natura variabile lungo la sessione                   | .11 limitata a due; .12 sei opere distribuite a 60 min                                           | [F] Corretto e verificato anche online                     |
| Controlli sviluppatore                               | Timeline da frame, entry/exit/loop, seek, giunzioni, audition; test driver su due wrap           | [F] Implementati; non equivale ad ascolto iPhone           |
| Loop senza interruzioni del player                   | NRT .11: 1.728.000 campioni identici; strict AudioParam .12 copre errore online                  | [U] iPhone e master eventualmente discontinui da ascoltare |
| Caricamento leggero lossless                         | Shell senza audio, finestre bounded; 24 nature FLAC su clock PCM                                 | [F] 21 musiche ancora WAV online: delivery incompleta      |
| Materiale approvato disponibile                      | Manifest remoto 45 file: 21 musiche + 24 nature                                                  | [F] Upload originale già verificato; nessuno nuovo D-081   |

## Limiti e autorizzazioni residue

- [U] Ventuno FLAC musicali esterni: 3.653.766.432 → 2.023.381.325 byte,
  identità PCM verificata D-073/D-078. Non sono quelli online. Catalogo remoto
  attuale 4.002.191.597 byte, tutto-FLAC 2.371.806.490 byte. Serve autorizzazione
  specifica alla sostituzione privata e verifica preventiva di costo/quota.
- [U] Ascolto iPhone di loop/raccordi, latenza/RAM low-end, background,
  batteria/interruzioni: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
- [F] Doctor/install-check/security D-069 non verdi; runbook in
  `HATHA_1_INTEGRATION.md`. Nessuna accettazione tacita o release nativa.
- [F] Master, byte audio, percorsi Strategia, GitHub e build native/cloud
  fuori dalle modifiche. Nessun commit canonico autorizzato.

## Consolidamento D-081

- [F] Lint, typecheck, Prettier: PASS. Jest: 75 suite / 543 test PASS;
  worker FLAC: 8/8; HTTP: 14/14; safety/config/confini PWA: PASS.
- [F] Review indipendente read-only: nessun nuovo P0/P1 concreto. Copre
  limiti dei decoder, separazione delle corsie, monotonia degli inviluppi e
  audition ripetuta; non sostituisce il test del browser o l'ascolto.
- [F] Export .12: 162 file / 8.503.594 byte, zero audio; 160 file precache
  per 8.488.448 byte. Revisione precache:
  `0fee25e29c804410f177582469cb570652453b4010c0434497fb464032b1bfad`.
  Bundle `entry-c120c52661e4ff5329822a897bdb9850.js`.
- [F] Scan export per path locale, token provider e Bearer: nessun match.
  Nessun sourcemap, audio o path traversal nell'archivio pubblicabile.
- [F] Checkout isolato Sites: 12/12 test PASS, build PASS. Sorgente
  `9533ec6b318ac2868d753a330402daf612f99f42`, versione Sites 21 salvata.
  Archivio gzip: 3.885.500 byte, SHA-256
  `3a650f1bc99d244daa77af1270de1d165090bc6ffb0ab22a766204d5e81b5959`.
- [F] Sites 21 pubblicata owner-only, env 4, deployment
  `appgdep_6aa631cfbf8c8191b49e98ca35ef0138` succeeded. Nessun upload audio.
- [F] Browser locale pulito `127.0.0.1:8251`, revisione .12 verificata:
  otto musiche / sei nature Rain; primo raccordo completo superato fino a
  07:56, pausa/ripresa a 07:07; seek a 31:20, successivo Playing a 31:38
  oltre il terzo cambio natura. Stop verificato e scheda chiusa.
- [F] Il primo tentativo su `localhost:8251` aveva una vecchia .9 in cache:
  escluso dalle prove .12. Il log HTTP locale è misto e troncato a 200
  richieste (`overflow=true`), quindi non certifica l'intero traffico .12.
  Server PID 29103 arrestato normalmente; porte 8251/8252/8254/8081 libere.
- [F] Browser sul Site privato, .12 verificata nel player: Hatha60 + Ocean
  waves, seed `yoga-music-sea-60-mtzd4ugg`, sette musiche intere e sei nature.
  Seek prima del primo raccordo e riproduzione continua attraverso
  08:01.91–09:42.50; ancora Playing a 10:09, già entrato nel cambio natura.
  Nessun errore AudioParam visibile. Mute ambiente 50→0→50, main sempre 80%.
- [F] Online: seek a 31:10, Playing osservato a 31:23 e 31:49, oltre la
  fine 31:30 del terzo cambio naturale; nessun errore visibile. Stop porta
  a Ready, timer 60:00 e Stop disabilitato; scheda di prova chiusa.
- [U] Nessuna approvazione sonora iPhone dedotta dalla prova browser.

## File della correzione D-081

- Planner/helper: `src/domain/sessions/continuumPlanner.ts`, nuovo
  `natureTransitionSlots.ts`; scheduling in
  `src/audio/web/AdaptiveWebPlayback.ts`; `src/content/reviewRevision.ts`.
- Test: `natureTransitionSlots`, `reviewNatureTimeline`,
  `AdaptiveWebPlayback`, `CrossfadeRobustness`, `AdaptiveWebHarness`,
  `productShell` e `consumerPlayer`.
- Documenti: questo audit, `STATO.md`, `docs/DECISIONS.md`.
- Il diff canonico complessivo include molto lavoro precedente non
  committato: non viene attribuito tutto a D-081 né staged. HEAD canonico
  `6549f0117f2d7623fe20816cbf2c687385af6b8d`; index vuoto.
