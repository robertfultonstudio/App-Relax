# PWA — preparazione limitata dei punti di test

13 settembre 2026 · D-087/D-088/D-089 · PLAYER-REVIEW.21 privata

## D-093 — Primo batch senza reinizializzazione superflua

[F] Letto il codice locale della dipendenza fissata `@wasm-audio-decoders/flac`
0.2.11: `ready` completa già `_init`; `reset` chiama `free` e `_init` di nuovo.
Il worker applicativo faceva entrambe le operazioni prima del primo decode.
Un test del worker minificato con WebAssembly reale osserva le istanze libFLAC
(esclude il decompressor puff): RED 2 invece di 1. Correzione: il primo batch
usa lo stato vergine già pronto; ogni tentativo successivo resetta prima di
decodificare. Il flag cambia prima del decode, anche se questo fallisce.
Rifiuti di protocollo/concorrenza/limite 4 MiB non consumano lo stato vergine.

[F] 10/10 test Node del worker PASS. Il test degli errori verifica frameNumber
e inputBytes tornati a zero dopo due batch corrotti; aggiunti rifiuto oversized
e richiesta concorrente durante il primo avvio. Annullamento, timeout, budget
e numero di worker invariati. Nessuna inizializzazione anticipata aggiuntiva,
nessun nuovo download, cache o modifica al PCM.

[F] Browser integrato, nuova compilazione worker: Rain Misted Garden, Sea Pearl
Tide e Hatha Threshold of Breath. Per ogni caso 576.000 campioni confrontati
contro il riferimento, errore massimo 0 a EOF e al cambio finestra. Hash di
tutte le letture anche identici al report D-091; prova con apertura diretta
vicino a EOF, non solo dal campione zero. Nessun errore browser osservato.
Report distinto `dist/flac-window-spike/browser-compiled-clock-report-d093.json`:
il report precedente non è stato sovrascritto. L'argomento opzionale `d093`
al server diagnostico seleziona soltanto il nome di output, non i criteri PASS.

[F] Primo prepareAt locale 94,8–179,5 ms; seek successivi con riuso 39,8–83,9 ms.
Entrambi i rami di questo harness usano il worker nuovo: non è un benchmark
prima/dopo D-093. La riduzione dimostrata riguarda il numero di inizializzazioni,
non una percentuale garantita di latenza. HTTP, decode e hash sono inclusi.
Rendering NRT e identità PCM non certificano glitch di rete/CPU, ascolto del
clic di ogni master, iPhone, background o latenza acustica.

[F] Worker generato 76.182 byte, SHA-256
`655053067d4eb26967bb039a0237a66048922bfd9798ec2c96e66ff81b6ef6a7`;
provenienza/source delivery rigenerata dallo script, nessuna modifica upstream.
Regressione Jest 618/85, typecheck/lint, asset safety510, config e boundary PASS.
Dopo il cambio del solo identificatore .22, altri 39 test UI/loop/player PASS;
Prettier dei file interessati e diff whitespace PASS.

[F] Candidato locale `dist/pwa-d093`: 184 file / 12.427.519 byte,
precache161 / 8.346.931 byte, hash revisione
`f1d3cc765399d5e5117b7fcb071bc3992a3f7e2958dee9685da8251aa23a7320`.
Validatore PWA PASS, 53 route player e 45 indici audio previsti. Ispezione
indipendente: zero file audio, zero pattern segreti/path privati; worker con
SHA atteso e marker PLAYER-REVIEW.22 nell'inventario loop.

[F] Primo export avviato senza `--clear` fallito al validatore: riferimenti
Moon Drone/ATP01 nel bundle. Stessi sorgenti e ambiente, riesportati con il
`--clear` prescritto dallo script di progetto: riferimenti esclusi e PASS.
Il controllo non è stato allentato; non usare il primo artefatto come prova.

[F] Scheda diagnostica chiusa; server PID66190 terminato con exit0, listener
8252 assente. Export e controlli conclusi, nessun Metro/emulatore lasciato
acceso. HEAD `6549f0117f2d7623fe20816cbf2c687385af6b8d`, index vuoto;
87 modifiche tracciate/71 voci non tracciate nel worktree, incluse le ereditate.
Delta D-093: worker, test worker, tag report del server diagnostico, revisione,
source delivery generata e questi documenti. Nessun file audio modificato.

[U] .22 contiene codice candidato D-091/D-093, non una pubblicazione avvenuta.
.21 online invariata; catalogo remoto e servizi non toccati. Field Ambience e
Night Birds rimangono soltanto locali. Nuovo ascolto iPhone, misure online,
rilascio privato del candidato e residui release D-069 ancora distinti;
Doctor/audit dipendenze/export nativi non ricertificati in questo intervento.

## D-091 — Riuso del reader inattivo, correzione soltanto locale

[F] RED→GREEN: `ClockedWavSource.pause()` chiudeva il reader anche quando non
aveva nessun open/read in corso. Tre seek non coperti da PCM nella stessa URL
aprivano tre worker. Ora soltanto un reader completamente inattivo sopravvive
alla pausa; open o finestre pendenti continuano a essere annullati/chiusi.
Una Promise vecchia non può azzerare lo stato di apertura del reader nuovo.

[F] Stop adattivo libera tutti i reader dei deck; reset della sorgente, errore
e dispose li chiudono. Resta il tetto di quattro deck, quattro finestre/deck e
8 MiB di cache compressa. Nessun PCM/audio o scheduling modificato. Le risorse
WASM inattive restano residenti più a lungo durante la pausa: budget di picco
invariato non significa stessa RAM media, né validazione low-end/iPhone.

[F] Test su riuso 0→35→60, cancellazione open/read, risposta tardiva, cambio
sorgente, release esplicita mantenendo PCM verificato e Stop su due corsie.
Il vecchio comportamento è fallito con 3 aperture invece di1; il nuovo passa.

[F] Browser integrato locale, decoder minificato reale, tre registrazioni:
Misted Garden, Pearl Tide, Threshold of Breath. Confronto controllato per file
fra teardown precedente simulato con release dopo pause e riuso inattivo:
3→1 worker aperti, tutti chiusi alla fine, hash Float32 per finestra identici.
Seek successivi, baseline→riuso (ms): 125,3→97 /71,9→52,4;
81,5→63,9 /70,7→36,6; 114,3→59,5 /75→30,3.
Primo avvio resta variabile (80,5–167,1 ms nelle sei prove), nessun miglioramento
freddo dichiarato. Tempi locali includono HTTP, decode e hash: non sono misure
online/iPhone e non isolano ogni fase. Nessun benchmark statistico generale.

[F] Stesso harness ha renderizzato EOF e giunzione delle finestre contro PCM
di riferimento verificato: 576.000 campioni/caso, massimo errore0, tre casi PASS.
Report: `dist/flac-window-spike/browser-compiled-clock-report.json`.
Non dedurre da questa identità che un master abbia una cucitura percettivamente
approvata. Il controllo dimostra che il player non aggiunge differenze al riferimento.

[F] Corretto anche il server diagnostico per risolvere le dipendenze transitive
nel layout isolato pnpm, senza installazioni. Primo avvio non eseguiva il test
per moduli assenti; il tentativo successivo con percorso symlink non reale
è terminato con MODULE_NOT_FOUND. Dopo risoluzione realpath, harness PASS.
La scheda su errore di connessione non era riutilizzabile; nessuna policy
browser aggirata, prova completata in una nuova scheda dello stesso browser.

[I] Audit upstream read-only conferma che conservare il worker conserva anche
il suo contesto Wasm. `reset()` ricrea l'istanza interna ma non il worker;
non modificato in questa correzione. Fonte primaria fissata alla release:
[FLACDecoder 0.2.11](https://github.com/eshaz/wasm-audio-decoders/blob/c9ff316db7f21fe95b0e89b308d0720fde6fecd2/src/flac/src/FLACDecoder.js).

[U] .21 online NON aggiornata da questo intervento. Benefit per target che
richiedono una sorgente nuova o un decoder precedentemente interrotto, latenza
quasi-zero generale e iPhone: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
Nessuna autorizzazione sonora, pubblicazione o commit dedotti dai test locali.

[F] Consuntivo D-091/D-092: 618 test/85 suite PASS; typecheck e lint completati
con exit 0. Server di prova e Metro terminati regolarmente; PID assenti e nessun
listener 8093/8252 alla verifica finale. Index vuoto, HEAD app invariato.

## D-089 — Diagnostica del salto, senza nuovi buffer

[F] La misura unica .20 (280/1006 ms) non distingueva rete e lavoro locale.
La PWA .21 aggiunge somme effimere di apertura, lettura PCM e worker/decode,
più tentativi HTTP e hit della cache compressa durante il seek. Nessun URL,
titolo, log persistente o invio remoto. Il confine UI resta il controller;
native restituisce metriche assenti. Il costo sono contatori/performance.now
nel driver della PWA, anche quando il pannello tecnico è chiuso.

[F] I contatori Range coprono soltanto FLAC online, non letture Blob offline,
richieste degli indici o del worker. I tempi invece includono tutti i FLAC
indicizzati; il vecchio percorso WAV offline non è strumentato. I tempi sono
somme concorrenti: decode è dentro read, non un ritardo da sommare.
Un'operazione iniziata prima dello snapshot può terminare dopo; le misure
richiedono un test in pausa e non equivalgono a tracing completo o RAM/CPU.

[F] Revisione indipendente read-only: nessun blocker audio/cache/privacy.
Corretta la copy per dichiarare espressamente l'esclusione dei Blob dai
contatori Range. Test del punto adaptive ora prepara e cerca anche lo stesso
target; resta un double di confine, distinto dai test reali cache→reader→clock.

[U] La diagnostica non corregge di per sé la latenza e non prova l'assenza di
click nel loop. Non vengono cambiati campioni, scheduler, numero di worker,
budget 8 MiB, finestre PCM, ambiente consumer o catalogo.

[F] 609 test /84 suite, audio229 /22 suite PASS; lint, typecheck, Prettier,
safety502 file, config, boundary PASS. Worker privato17 PASS. Il primo controllo
PWA ha incrociato una riesportazione in corso (index non ancora disponibile):
fallimento procedurale, rieseguito sull'export concluso con PASS.
Artefatto184 file/12.423.581 B; precache161/8.342.993 B,
hash `968315a05088323dabe7949cf40f87bfcac99f28baa68838169cd4cdd0fc145b`.
Zero byte audio e zero pattern segreti/path privati. Doctor/export nativi non
rieseguiti in questo delta; residui D-069 non dichiarati risolti.

[F] Sites32/env6, owner-only riconfermato. SHA isolato Sites
`191fe972f9fa2e93465b7e0ed0188f02f7c151dc`, deployment
`appgdep_6aa6bd44ca10819193833174671f6b3e` succeeded. Nessun commit app.
Solo shell aggiornata: 45 file remoti e audio invariati.

[F] Browser online, Wave and Ground isolato: ultimo5 s in115 ms; 0HTTP/2hit,
open2ms, read108ms, decode94ms. Riavvio osservato a00:12 ancora Playing,
errori browser assenti, poi Stop. Non prova uditiva.

[F] Hatha90+Rain, seed `yoga-music-rain-90-mtzygcpf`, primi punti entrambi
dichiarati preparati: 05:22 in215ms (0HTTP/2hit,1read114ms,decode100ms);
13:12 in3368ms (0HTTP/4hit,2open2ms,2read4980ms,2decode4894ms).
Le somme sono concorrenti, quindi non sommare4980+4894 né confrontarle come
wall-time. Evidenza: `dist/review21-screenshots/01-prepared-seek-diagnostics.png`,
ispezionata. Zero errori browser, Stop confermato; PWA lasciata nell'inventario.
Nessun server/emulatore avviato per questo run, nessun ascolto continuo.

[I] Nel salto13:12 la fase worker/decode domina il residuo; è escluso un miss
HTTP delle finestre audio. Bootstrap worker, risorsa worker, inizializzazione
WASM e CPU decoder non sono ancora distinti: NON DETERMINATO — EVIDENZA
INSUFFICIENTE. Non chiamarlo miglioramento della latenza globale.

## D-088 — Allineamento con cache PCM parziale e sorgenti offline

13 settembre 2026 · PLAYER-REVIEW.20 pubblicata, latenza globale ancora aperta.

[F] Il turno precedente ha prodotto progressi (cache bounded e .19 privata)
e controevidenza online, non un blocco: 2011 ms sul target dichiarato preparato.

[F] Test RED riproducibile: con PCM 0–8 già disponibile, un seek a 5 s richiede
8–16 anziché il range preparato 5–13. Il reader riutilizzava una copertura
parziale e spostava la successiva richiesta fuori dalla cache compressa.
Correzione: conservare il percorso PCM se copre TUTTA la riserva, anche su più
finestre/EOF; altrimenti ancorare la prima finestra fredda al target esatto.
Quattro finestre e riserva 8 s invariati; nessuna modifica a scheduler/campioni.

[F] Test di integrazione ClockedWavSource → FlacWindowReader → cache Range:
seek 5 s, 75 s, EOF−1 campione, EOF esatto e ritorno a 5 s,
nessuna nuova richiesta dopo prepare.
Il decoder fixture controlla il flusso, non prova l'ascolto del materiale.

[F] Secondo caso: prepare rifiutava l'intera sessione se una corsia disponeva
di una lease Blob offline. Il resolver ammette solo lease locali verificate.
Ora quelle sorgenti non vengono ricopiate: si preparano soltanto quelle online.
Tutte offline significa zero nuove richieste; segnale annullato resta false.
La UI distingue byte preparati e già disponibili offline.

[F] Controprova UI sulla .19: Settings mostra Rain starter scaricato e verificato,
16,6 MB, con Quiet Weather, Sheltered Rain, Soft Weather. Il seed precedente
usa Sheltered Rain nel primo target, Distant Shower nel secondo: ciò conferma
la presenza del prerequisito offline della riproduzione deterministica del bug.
Nessun download rimosso o modificato per il test.

[F] Tre verifiche: RED→GREEN del difetto, suite completa e test integrato,
revisione indipendente read-only, quindi browser reale. Jest 606/83 suite;
audio 226/21 suite; estensione EOF e verifiche store/resolver 24 test PASS.
Lint/typecheck/Prettier, PWA/safety/config/boundary PASS; Worker 17, decoder 8,
HTTP 14 PASS. Scan artefatto 184 file: zero pattern segreti/percorso privato.
Runtime Node 22.23.1, wrapper pnpm 11.19.0 (progetto dichiara 11.16.0, invariato).

[F] Export .20: 184 file / 12.422.572 B; precache 161 file / 8.341.984 B,
hash `770fa50625aabcae21d84b3defe9f4d252397ed651d67a63910275da6cb217dd`.
Zero audio nell'export. Catalogo remoto invariato, nessun nuovo upload audio.

[F] Pubblicazione privata Sites 31/env6, owner-only riconfermato (un account,
zero esterni/gruppi). Checkout Sites `0207f93d8d7d772815a71ef2d603858cbcf43968`,
deployment `appgdep_6aa6b7db780c8191984e0aa43baca6f7` succeeded. Nessun commit app.

[F] Browser locale Hatha 90 + Rain: seek preparati 379/364 ms. Report
`dist/audio-continuity-audit/review20-runtime-requests.json`: 29 FLAC, tutte
206, massimo 2.006.694 B, zero WAV. Nessun errore browser, Stop confermato.

[F] Online .20, seed `yoga-music-rain-90-mtzxkyub`, Hatha 90 + Rain:
primo target 05:22 preparato, Quiet Weather già nel pacchetto offline,
seek 280 ms; secondo target 13:12, Misted Garden online, seek 1006 ms.
Non è un benchmark di rete controllata né lo stesso seed .19: documenta
comunque entrambi i percorsi reali. Clock audio fino a ulteriori 60 ms.
Screenshot `dist/review20-screenshots/01-offline-mixed-seek-online.png` e
`02-online-mixed-seek.png`. Pausa mantenuta e Stop confermato, nessun errore.

[F] Online Wave and Ground isolato: ultimi 5 s preparati in 154 ms, Play
supera EOF e continua in Playing a 01:33; nessun errore browser. Screenshot
`dist/review20-screenshots/03-single-loop-online.png`, poi Stop confermato.
[U] Ascolto iPhone e latenza quasi-zero globale non ancora provati. Il salto
con due sorgenti online resta circa un secondo; primo caricamento freddo,
decoder prolungato, RAM low-end e gate release precedenti restano aperti.
Il precaricamento non corregge difetti musicali del master.

[F] Consegna .20: index canonico vuoto, HEAD invariato; 81 modifiche tracked
e 63 voci untracked complessive comprendono il lavoro ereditato. Modifiche
di questo passaggio: `ClockedWavSource`, factory e copy review PWA, revisione,
test clock/cache/preparazione e documenti D-088. Nessuno staging app.
Server 8251 terminato, tab locale chiusa, nessun emulatore o Metro. L'elenco
dei 45 test resta aperto nella stessa PWA privata con audio fermo.

## Problema osservato e perimetro

[F] D-084 non chiude la latenza fredda: online .17 riportava 1.366–2.897 ms
per punti nuovi e 46 ms sul punto pronto. .18 risolve la ripresa del seek
singolo e rende accessibili i 45 loop, non rende istantanea la rete.

[I] La review può preparare UN prossimo punto durante la pausa: ultimi 5 s
per il file isolato; preroll effettivo della prossima giunzione per la sessione.
Nessun nuovo pulsante consumer, titolo in Home, formato audio o file aggiunto.

## Contratto tecnico verificabile

- Cache effimera dei soli byte FLAC compressi, massimo 8 MiB incluse intestazioni.
- Nessun PCM persistente aggiuntivo, decoder o aumento del pool quattro deck.
- Pianificazione usa la stessa funzione `flacWindowSpan` del reader, indici
  autenticati e frame interi; coda più testa per una riserva che supera EOF.
- Un piano di range completo sopra budget resta non preparabile; nessuna
  falsa Ready dopo auto-eviction. Gli header del piano sono protetti da dati vecchi.
- La coda controller ammette la richiesta solo dopo i comandi foreground,
  in Paused; il trasferimento non occupa la coda. Start/Resume/Stop/seek e
  dispose annullano la richiesta; un risultato tardivo non aggiorna UI/cache.
- Playing non avvia prefetch. Un cache miss foreground interrompe la lettura
  speculativa. Il range in volo non viene promosso: se ancora incompleto, il
  normale seek può doverlo richiedere di nuovo; nessuna promessa su questo caso.
- URL, SHA approvato, Range/total, ETag forte e lunghezza completa verificati.
  Risposte cached sono copie, non buffer trasferibili condivisi con il worker.
  Il reader mantiene le proprie verifiche su dati e decoder.
- Gli header già validi sono riusati per la stessa URL/SHA; ogni successivo
  range di rete resta legato a SHA/ETag. Blob offline conserva il percorso esistente.
- Gli 8 MiB riguardano lo storage compresso della cache, non la RAM complessiva
  del browser, PCM o copie temporanee di lettura.

## Tre livelli di controllo

1. Revisione indipendente read-only: priorità refill, isolamento worker,
   budget atomico, target reale e annullamento senza Stop bloccato.
2. Test di logica e regressione: EOF→zero con identità PCM; zero fetch dopo
   prefetch completo; copie immutabili; header legati a SHA; range corrotti,
   troncati/sovrabbondanti; oltre budget; Stop e risposte tardive; mapping
   giunzione con tre sorgenti e ingresso entro 8 s; nessun prefetch Playing.
3. [F] Export finale: 184 file / 12.422.156 B; precache shell 161 file /
   8.341.568 B, revisione
   `e82d261a018dc764afc6106474475427dca432540831f14a98df398ed69aec78`.
   Nessun audio incorporato. La prova privata finale è ancora in corso.

## Evidenze locali

[F] Lint, typecheck e Jest 601/601 in 82 suite PASS; regressioni audio
221/221 in 20 suite PASS. La revisione indipendente finale conferma il
fail-closed ETag: una revisione mista purga la sola URL/SHA e non produce Ready.

[F] Prima prova browser: file Hatha isolato, ultimi 5 s preparati, seek
116 ms; la riproduzione supera EOF e continua in Playing. Hatha 90 + Rain,
preroll giunzioni 05:22 e 13:12 preparati, seek 701/877 ms, Paused preservato.
Queste due misure coincidono con l'export attivo e non sono un benchmark
comparativo di CPU libera. Clock audio fino a ulteriori 60 ms.

[F] Report `dist/audio-continuity-audit/review19-first-runtime-requests.json`:
70 richieste FLAC, tutte 206, massimo 2.006.694 B, zero WAV, zero overflow.
Non prova assenza di fetch in ogni seek: il server registra l'intera prova,
incluse letture iniziali e refill. Browser senza errori, Stop eseguito.

[F] Seconda prova locale senza export attivo: Hatha 90 + Rain, gli stessi
due preroll pronti in 476/588 ms. Report
`dist/audio-continuity-audit/review19-final-runtime-requests.json`: 22 richieste
FLAC, tutte 206, massimo 1.940.015 B, zero WAV. SHA-256 del report
`7be4fb251e718cd9c4ca6018fd96185977140beb9b31e39d6b220aafc3d9a281`.

[F] PLAYER-REVIEW.19 pubblicata: Sites 30/env6, accesso verificato owner-only
(un account, zero esterni/gruppi), stesso URL. Deployment
`appgdep_6aa6b0bc6bf08191b6119f8168f9ef5d` succeeded. Solo checkout Sites
`20c55ba3defc092eca65cdc86860fa38070a629b`, nessun commit del repository app.
Catalogo remoto e costi/configurazione servizi non modificati.

[F] Worker privato 17/17, decoder 8/8, server HTTP 14/14 PASS. Validatori PWA,
safety, config, boundary e catalogo PASS; Prettier PASS. Scan artefatto 184 file:
nessun pattern credenziale/chiave privata/percorso `/Users/RF/` rilevato.
Il primo validatore PWA era stato avviato prima che l'export ricreasse index.html
e falliva per file mancante: rieseguito dopo exit 0 dell'export, PASS.

[F] Prova online .19: inventario 45/45 visibile. Threshold of Breath isolato,
Paused → ultimi 5 s dopo preparazione: seek 159 ms; Play supera EOF, continua
Playing a 00:42, nessun errore browser. Non è approvazione sonora.

[F] Controprova Hatha 90 + Rain (`yoga-music-rain-90-mtzwlpm6`): il primo
preroll 05:22 non è stato dichiarato preparato, anche riaprendo il pannello;
il salto normale richiede 3615 ms. Il successivo 13:12 risulta preparato ma
richiede 2011 ms. Pausa preservata e Stop riuscito. Non classificare l'intera
sessione come quasi-istantanea né usare il dato 159 ms per tutte le giunzioni.

[U] La causa specifica del residuo online non è isolata. Il contratto conserva
le copie offline esistenti e finestre PCM parzialmente già presenti possono
richiedere un range diverso dal piano cold-start; queste sono piste nel codice,
non cause dimostrate del caso osservato. Non sono state modificate le verifiche
di integrità né aumentata la cache per mascherare il problema.

[F] Screenshot 390×844: `dist/review19-screenshots/01-individual-tracks-online.png`,
`02-loop-seek-online.png`, `03-hatha-seek-online.png`. L'inventario e i controlli
sono verificati; latenza quasi-zero per tutte le sessioni e prova sonora iPhone
restano NON DETERMINATO — EVIDENZA INSUFFICIENTE.

## File e confini

[F] Intervento .19: `PwaReviewRangeCache.ts`, `reviewStartupRanges.ts`,
factory PWA; estrazione range condivisa in `FlacWindowReader.ts`; capacità
opzionale in `AudioGraphDriver`, controller, driver Web e `AdaptiveWebPlayback`;
solo tipi in `ClockedWavSource`; stato di preparazione in `PwaPlayerReviewControls`.
Test cache, controller, latenza adattiva e UI; revisione e documenti aggiornati.

[F] HEAD canonico invariato `6549f0117f2d7623fe20816cbf2c687385af6b8d`, index
vuoto; le modifiche precedenti restano non committate e non vanno attribuite
interamente a .19. Nessun byte audio o flusso Strategia modificato. I due server
locali avviati per queste prove sono terminati; emulatore e Metro non avviati.

[U] Doctor/patch Expo/advisory D-069 sono residui release precedenti, non
chiusi né nuovamente certificati da questi controlli mirati. Nessuna build nativa.

[U] Primo Play su rete fredda, salti arbitrari non preparati, ascolto iPhone,
long-run, RAM low-end e qualità musicale di ogni loop restano gate separati.
Il prefetch non è un correttore di click e non modifica il master.
