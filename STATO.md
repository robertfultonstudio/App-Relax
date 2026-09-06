# Stato progetto

Aggiornato: 6 settembre 2026

## Checkpoint locale autorizzato — D-068

[F] Robert richiede il commit locale e, durante il controllo, una riduzione
ulteriore minima dei comandi. Altezza 56 → 52, testo e icone invariati;
Stop conserva l'allineamento. Il checkpoint comprende sorgenti, test,
configurazione e documenti del lavoro accumulato dopo `72346a0`.
400/400 test e controlli statici verdi; catalogo pesante e materiali Strategia
esclusi. Nessun push o nuova pubblicazione richiesti da questo comando.

[F] La PWA online resta A01-A14.5 / Sites 6 con altezza 56: l'ulteriore
riduzione a 52 è soltanto locale. Non è un nuovo esito di test iPhone.
[U] Rilascio nativo ancora bloccato: oltre a resolver/storage e device QA,
l'audit registra una divergenza di gain delle due corsie nel codice nativo
inattivo (`docs/A01_NATIVE_GATE.md`). Il checkpoint non certifica quei gate.

## Barra compatta pubblicata nella PWA privata

[F] Robert considera la barra troppo invasiva. D-066 riduce i comandi da
80 a 56, con icona/testo affiancati, fondo carta per Stop e posizione stabile.
24 test mirati, lint, typecheck e formato PASS; audio e disponibilità
invariati. Guided attende registrazioni, le sessioni musicali nuovi abbinamenti
approvati; non ogni blocco richiede nuovo materiale.

[F] Su richiesta esplicita «Mettila nella PWA», D-067 pubblica A01-A14.5
(Sites 6) sullo stesso link privato. 42 test PWA/player e 12 test Worker PASS;
catalogo, audio e funzioni invariati. Nessun commit canonico o acquisto.
[U] La resa della barra sul telefono attende il giudizio di Robert. Chiudere
la vecchia PWA dopo Stop e riaprire online; nessun reload forzato durante
l'ascolto. Il blocco del precedente screenshot non è una prova visiva.

## Versione precedente: crossfade pubblicato per il test umano

[F] Su richiesta di Robert, A01-A14.4 è pubblicata sullo stesso Site privato
(versione 5, D-065). Include le correzioni crossfade D-064 e conserva comandi
grandi e personalizzazione. Confermati 68 HTML, 43 asset byte-identici e
accesso soltanto al proprietario. Nessun nuovo audio, servizio o acquisto.

[F] Il link resta disponibile senza Mac acceso. Testare online dopo aver
chiuso i vecchi client; identificativo in Settings: A01-A14.4. Nessun commit
nel repository canonico: si attende l'esito positivo comunicato dall'utente.
Il solo repository isolato di pubblicazione segue il workflow Sites.
[U] Ascolto, latenza e stabilità della revisione aggiornata su iPhone sono
ancora da provare; offline privato e gate nativi restano distinti.

## Crossfade: QA tecnico indipendente dal catalogo

[F] Su precisazione di Robert, la solidità del motore si verifica senza
attendere l'approvazione di nuove coppie musicali. D-064 aggiunge fixture
senza audio, sessioni virtuali fino a 90 minuti e stress di seek/pausa/stop;
corregge precisione e composizione delle curve, automazioni su Resume,
riallineamento entrante e validazione del piano vuoto. Suite dedicata
92/92, completa 400/400 in 62 suite; lint/typecheck verdi.

[F] D-064 chiusa inizialmente con modifiche locali non committate; nessun brano
o abbinamento nuovo. D-065 autorizza e consegna poi la nuova PWA privata.
`docs/CROSSFADE_QA.md` contiene
comandi, risultati e limiti. [U] Clock virtuale e API simulate non sostituiscono
decoder, ascolto, latenza o long-run su telefono.

## Ultimo riscontro iPhone e aggiornamento consegnato

[F] Robert riferisce test positivo e suoni puliti; collegamenti Home approvati
e preservati. A01-A14.3 rende Stop/Play/Pausa grandi e fissi in basso e porta
in evidenza Personalize your session con anteprima dell'ordine dei suoni.
Corretto l'arresto ripetuto durante Play pendente, senza anticipare Ready.
61 suite / 382 test e regressione audio 128/128 verdi, Doctor 20/20;
export e validatori PASS. Stessa PWA privata aggiornata, versione 4 (D-063).

[U] Nuova UI e latenza vanno confrontate sul telefono. La personalizzazione
natura/durata è disponibile; musica più natura attende nuove coppie approvate
dopo le eliminazioni. Offline remoto, background e race nativa Start/Stop
rimangono gate distinti, non coperti dal riscontro positivo online.

## Milestone attiva

Milestone autorizzata corrente: **A01–A14 — avvio immediato e continuità**
(D-060/D-061). Correzioni software e prove browser consolidate; nuova PWA
privata A01-A14.5 pubblicata. Restano aperti storage/adattività nativi concreti,
riapertura offline remota, telefono reale e approvazioni umane: non è un MVP nativo certificato.
Il lavoro M5/M6 già aperto è riconciliato, non dichiarato nativo completo.
Checkpoint precedente: `tmp/audit-a01-a14-baseline`. D-068 autorizza il nuovo
commit locale; EAS, nuovi asset sonori e push restano esclusi.
Copertura: `docs/AUDIT_A01_A14.md`.

M5 `Adaptive Sessions & QA Workbench`: sessioni consumer duration-first,
sequencer deterministico a vincoli, contratto Guided, pacchetti offline e
Workbench tecnico separato. Il baseline M3/M4 e protetto dal commit locale
`05a672eb4c2f878cba9fcdae94c4f6b5981ce5c1`; non viene riscritto.
Il commit locale M5 è stato autorizzato dopo il gate visivo. EAS, build
native/cloud, push, PR, Git LFS e asset delivery restano esclusi.

## PWA complementare

- [x] Pubblicazione privata autorizzata dall'utente per il test remoto su
      iPhone, con arresto prima di qualsiasi costo (D-058/D-059). PWA privata
      pubblicata su https://app-relax-private-review.robfulton.chatgpt.site,
      accesso alla sola persona proprietaria tramite ChatGPT, senza
      ospiti/gruppi. Versione 6 (A01-A14.5), deployment `succeeded`, environment
      revision 2; nessun nuovo audio caricato o servizio attivato.
- [x] Dopo lo sblocco della rete sono stati caricati e verificati tutti i 37
      file: 2.657.446.897 byte, SHA-256, dimensioni e intervalli iniziali/finali
      coerenti. Storage separato dalla shell; nessuna conversione o modifica
      ai master. Il repository canonico non è stato committato o pushato.
      I commit di pubblicazione riguardano soltanto il repository Sites
      isolato `tmp/pwa-private-site`.
- [x] Import temporaneo chiuso: chiave e scadenza rimosse, nuova configurazione
      pubblicata e richieste con la vecchia chiave respinte (HTTP 401).
      Richieste anonime a Home/catalogo respinte (401). Nessun acquisto o
      abbonamento aggiuntivo attivato; nessun Mac acceso o LAN richiesti.
- [x] Worker: 12/12 test; dipendenze del Site: zero vulnerabilità nell'audit.
      Verifica remota shell corrente: 68 HTML e 43 asset non HTML byte-identici.
      A01-A14.1: Start Meditation remoto, timer 19:57 → 18:20 e Stop verificati.
      Nella precedente versione Play e timer erano verificati nel browser con
      Low Rain e, dopo la chiusura import, Misted Garden; quest'ultima fermata.
      Un primo tentativo Misted Garden interrotto da una nuova richiesta di
      caricamento è riuscito dopo ricarica completa: non costituisce prova di
      robustezza su iPhone.
- [x] Creata una radice Router PWA consumer separata con manifest,
      service worker, icone derivate dall'artwork Meditation e route statiche
      per Home, i sei outcome, sessioni adattive e player. Workbench QA,
      `AUDIO TEST / TEST ONLY`, preset tecnico e route legacy non entrano
      nell'artefatto.
- [x] Il confine audio Web è ora iniettato nel controller: la PWA non importa
      i tre stem ATP01 e risolve soltanto file same-origin sotto
      `/audio-catalog/` oppure gli otto noise generator runtime. Sono
      predisposte 45 route player: 37 file-backed approvate e disponibili
      sulla delivery privata same-origin, più otto generate nel browser. `Soft
Air`, `Moon Drone`, `Deep River`, Eclipse Veil e Stillwater Halo restano
      fuori.
- [x] La shell predisposta all'installazione è separata dal catalogo da
      2.657.446.897 byte. Il service worker bypassa audio e richieste Range;
      precachea integralmente la shell senza takeover durante Play. Download
      selettivi OPFS con hash/rilettura, cancel/retry, rimozione/Undo. Starter
      Rain 16.622.588 byte; prova localhost offline/reopen/Play Quiet Weather
      superata. Il download sul sito privato è verificato, ma la successiva
      riapertura remota senza rete è FALLITA nel browser integrato. Causa:
      `NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Non è una prova iPhone.
- [x] `web:pwa` serve l'export statico e i 37 audio autorizzati con un unico
      processo Node su loopback, URL pulite, GET/HEAD/Range e MIME espliciti.
      `Avvia PWA.command` avvia dal Finder usando il Node già installato;
      nessun Metro, symlink, copia audio o compilazione all'apertura.
- [x] Preflight locale e 12 test del gestore HTTP verdi, inclusi HEAD e primi/
      ultimi 16 byte identici per tutti i 37 file reali. Richieste simulate
      senza socket: non costituiscono un test del decoder nel browser.
- [x] Export PWA statico e validatore verdi: 111 file per 7.286.699 byte, 67
      route statiche totali e 45 player predisposti; zero WAV/FLAC, catalogo,
      Audio Test o Workbench nell'artefatto.
- [F] Il precedente blocco rete/bind locale è storico (D-058). La consegna
  corrente usa HTTPS privato remoto, verificato nel browser Codex; non dipende
  dal launcher Finder o dalla porta 8095.
- [U] Installazione e riapertura offline completa della PWA su iPhone, decoder
  di tutte le opere e comportamento offline
  dei suoni restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`. La sola
  pubblicazione privata di prova è eseguita (D-059/D-061); nessun costo,
  store, EAS o diffusione pubblica è autorizzato.

## M5 implementato localmente

- [x] `Nirvana Waves` / `Stillwater Halo` eliminato dal catalogo su ordine
      esplicito dell'utente il 4 settembre 2026. Record, assetKey, route, copia
      Review WAV e copia FLAC del sidecar QA Android sono stati rimossi; il
      master canonico esterno e il report lossless storico restano intatti.
      Stato corrente: 48 entità, 40 file-backed, 37 approvate, 47 riproducibili
      nella Review, 33 transition-ready, 14 single-only e una respinta. Relax
      espone 28 suoni; il manifest localhost contiene 37 file per
      2.657.446.897 byte.
- [x] La rimozione azzera le coppie musicali approvate. `Music + nature` resta
      visibile ma disabilitato come `IN PRODUCTION`; una vecchia sessione
      musicale salvata non viene convertita silenziosamente. Il percorso
      consumer parte da sessioni naturali funzionanti e il planner musicale
      fallisce chiuso finché l'utente non approva un nuovo abbinamento.
- [x] Gate della rimozione: formattazione, lint, TypeScript, 39 suite / 185
      test, regressione audio 55/55, validatori audio/asset/config/sicurezza/QA
      ed export Web verdi. Gli export iOS e Android correnti contengono
      esattamente i tre WAV ATP01 per 155.520.132 byte, nessun FLAC e nessuna
      stringa Nirvana/Stillwater; misurano 162.490.591 e 163.646.202 byte. Il
      sidecar QA Android locale è sceso a 37 FLAC / 1.635.181.380 byte.
- [U] Expo Doctor passa 18/20 controlli; schema remoto e React Native Directory
  restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` perché la sandbox non
  può raggiungere `exp.host`.
- [x] `Eclypsis` / `Eclipse Veil` escluso dal prodotto dopo il test d'ascolto
      del 4 settembre 2026: l'utente lo giudica troppo dissonante. La voce,
      l'assetKey, il mapping nativo, le relazioni Continuum e il FLAC starter da
      28.167.925 byte sono stati rimossi dal catalogo e dal pacchetto app. Il
      master esterno e il report storico di conversione restano intatti. Stato
      corrente, dopo entrambe le esclusioni: 48 entità, 40 file-backed, 37
      approvate, 47 riproducibili nella Review e 33 transition-ready;
      Meditation espone 16 suoni. L'audio nativo
      autorizzato torna ai soli tre WAV ATP01, 155.520.132 byte.
- [x] Patch Review iPhone dopo la prova reale: la schermata ricevuta ha
      identificato in precedenza `Session source 0` come Eclipse Veil. File,
      hash, decode
      completo e Range sono integri; il messaggio era generico e non provava un
      errore decoder. Metro serve ora tutti i FLAC con il media type registrato
      `audio/flac` al posto dell'alias deprecato `audio/x-flac`, senza cambiare
      i byte. Il player prepara soltanto le sorgenti attive e una futura, non
      piu tutto il piano insieme, e mostra titolo/corsia/codice media reali in
      caso di errore. HEAD e Range 206 sono stati riconfermati; sul browser
      interno la sessione musica piu onde raggiunge Playing. Gate automatici:
      config PASS, lint PASS, typecheck PASS, Jest 39 suite / 183 test. Questa
      diagnosi resta storica; l'opera è stata poi esclusa dal prodotto.
- [U] Il nuovo esito sul browser iPhone dopo refresh resta `NON DETERMINATO —
EVIDENZA INSUFFICIENTE`; il server Review è spento a chiusura.

- [x] Anteprima consumer per iPhone predisposta senza build nativa: il comando
      dedicato rileva l'IPv4 privata del Mac, autorizza soltanto quell'host in
      development, forza la radice consumer e mantiene `web`/`web:qa` su
      localhost. Il catalogo da circa 2,6 GiB non viene copiato: i file
      richiesti sono serviti dal Mac on-demand con supporto Range. Su LAN iOS
      sia il player adattivo sia quello della singola opera attendono un tap
      Play esplicito, evitando di fingere un autoplay che Safari/Chrome possono
      bloccare.
- [U] Apertura, decoder FLAC, seek e crossfade su un iPhone reale restano
  `NON DETERMINATO — EVIDENZA INSUFFICIENTE` finché l'utente non prova il
  link sulla stessa Wi-Fi. La modalità LAN è temporanea, priva di tunnel e
  va usata soltanto su rete fidata.
- [x] Prova LAN dal browser interno Codex: Home consumer completa caricata su
      `192.168.1.5:8094`; la route Relax musica+natura ha atteso il tap, è
      passata da Play a Pause con timer in avanzamento ed è tornata a 20:00
      dopo Stop. Anche la singola opera Open Tide ha atteso il tap, è passata a
      Pause con timer in avanzamento ed è stata fermata. Un FLAC Rain ha
      risposto `206 Partial Content` con `Accept-Ranges: bytes`. Il launcher ha
      mostrato la Home consumer anche partendo deliberatamente da una shell con
      `APP_RELAX_SURFACE=qa`. Questo verifica il percorso Web dal Mac, non la
      resa sonora o la compatibilità sull'iPhone dell'utente.
- [x] Modalità Review iPhone autorizzata e predisposta nello stesso launcher:
      forza la radice QA e `public`, apre direttamente `/qa-workbench` e
      conserva Home/route consumer. Espone ora 48 voci: 47 riproducibili, 33
      transition-ready e Soft Air visibile ma intenzionalmente bloccato.
- [x] Audit manifest corrente: 37/37 file hanno presenza, dimensione e hash
      coerenti per 2.657.446.897 byte; Moon Drone e Deep
      River incorporati sono serviti correttamente. Nessun path riproducibile
      manca. I problemi riferiti dall'utente sono quindi un
      gate di caricamento/decodifica sul suo browser, da identificare per titolo
      nella Review; non risultano file assenti dal server. Il controllo di
      Eclipse appartiene alla prova precedente alla sua esclusione.
- [x] Prova runtime della radice Review sul browser interno: Workbench QA,
      player consumer identico, catalogo e controlli di sessione/A-B/scrub sono
      visibili. Open Tide, FLAC naturale da 26.805.900 byte, e Aquarian Echo,
      WAV musicale da 345.312.044 byte, hanno raggiunto lo stato Playing con
      timer e posizione file in avanzamento; entrambi sono stati poi fermati.
      Questa coppia copre un FLAC naturale e il WAV più pesante, ma non prova
      la compatibilita di ogni file sul browser iPhone dell'utente.
- [x] Audit container con ffprobe 8.1.2: 14/14 WAV sono RIFF/WAVE PCM standard
      24-bit/48 kHz/stereo, 24/24 FLAC sono lossless 24-bit/48 kHz/stereo e
      durate/frame coincidono col catalogo. Nessun container, codec o metadata
      anomalo. I soli outlier sono nove WAV fra 124 e 329 MiB: costituiscono un
      rischio plausibile di latenza, banda o seek mobile, non una causa provata.

- [x] Sessioni musicali coordinate dopo la revisione d'ascolto: non resta
      alcuna coppia editoriale ammessa. Il codice conserva il contratto dei
      passaggi lenti, ma la UI consumer li dichiara `IN PRODUCTION` e il planner
      fallisce chiuso; nessun sostituto è stato inventato.
- [x] L'utente sceglie esplicitamente `Ocean waves` oppure `Rain`; la corsia
      naturale alterna lentamente due registrazioni diverse restando sempre
      nella famiglia scelta. Il player mostra un volume ambiente separato
      0–100% con mute, oltre al volume principale. Non e un mixer libero:
      esistono soltanto una corsia musica e una corsia natura, i cambi sono
      sfalsati e il piano limita l'esecuzione a tre sorgenti contemporanee.
- [x] Gate locale della revisione musica+natura: Prettier, lint e TypeScript
      verdi; Jest 39 suite / 178 test. Nel browser Codex localhost la vista
      consumer aveva mostrato, prima dell'esclusione, Eclipse Veil + Ocean
      waves, i due volumi distinti e il passaggio musicale da 180 secondi. Play
      e Stop erano stati verificati e l'ascolto fermato. Scelta famiglia,
      volume ambiente, mute/ripristino, persistenza e indipendenza dal volume
      principale sono coperti dai test automatici.
- [U] Riproduzione coordinata e controlli sono verificabili nella preview Web
  loopback. Decoder multipli, timing, CPU, background e qualita sul driver
  nativo restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino a build e
  prova autorizzata su telefono reale.
- [x] Correzione di visibilita del catalogo dopo il feedback utente: nessuna
      delle 37 opere ancora approvate manca dai manifest o dal registro, ma Home e
      le sei route outcome non esponevano piu i titoli individuali. Home usa
      ora un vero titolo approvato per ogni funzione; ogni route mantiene
      durata e Start come azione primaria e mostra sotto l'intera libreria
      pertinente (Meditation 16, Yoga 3, Massage 7, Relax 28, Sleep 16,
      Focus 14). Soundscapes apre con Sea, Rain e Stream prima delle famiglie
      cosmiche, standalone e noise.
- [x] Audit manifest -> catalogo -> disco: 40/40 opere file-backed presenti,
      cioe 13 analogiche, 24 Water/Air e tre ATP01 riusate senza duplicazione;
      con gli otto generatori il totale resta 48. I file supplementari nei
      pacchetti sono master o preview degli stessi lavori, non tracce
      consumer aggiuntive. I candidati esterni non manifestati restano esclusi.
- [x] Verifica della correzione: lint e TypeScript verdi, Jest 37 suite / 161
      test; nel browser loopback la Home mostra Open Tide, Quiet Field,
      Mineral Drift, Distant Bloom, Moonlit Veil e Astral Thread;
      Meditation mostra 16 suoni e Soundscapes apre con tutte le sette opere
      Sea, poi undici Rain e sei Stream.
- [I] Il commento utente che i suoni naturali "reggono" e registrato come
  riscontro d'ascolto positivo e criterio di priorita editoriale, non come
  nuova certificazione tecnica o sostituto del gate su telefono reale.
- [x] Revisione QA successiva al commit `72346a0`, ancora non committata: il
      Workbench riusa ora lo stesso `ConsumerPlaybackSurface` dei player
      consumer e lo stesso selettore 15/30/60 del player single-track, con
      artwork, tipografia, trasporto, timer e volume identici; i controlli di
      revisione restano aggiuntivi e confinati alla radice QA.
- [x] Il Workbench espone tutte le 48 entita del catalogo: 47 avviabili in
      ascolto singolo locale, 33 selezionabili direttamente come uscente o
      entrante e `Soft Air` visibile ma disabilitato perche respinto
      all'ascolto. Le 14 entita single-only non vengono forzate nel motore
      crossfade.
- [x] La modalita `Direct transition` costruisce esattamente la coppia A/B
      scelta, ne applica le regole ALL-OF e blocca gli abbinamenti
      incompatibili. La durata segue quella ammessa per l'outcome e la UI
      dichiara `READY` soltanto quando un safe exit registrato entra davvero
      nella finestra scelta. Ogni singola opera transition-ready ha almeno un
      partner compatibile verificato dai test. I comandi
      `OPEN A/B FILE + SCRUB` portano ciascuna sorgente nel player consumer
      completo senza perdere la coppia selezionata.
- [x] Lo scrubber Web usa coordinate normalizzate e supporta click,
      trascinamento e salti accessibili di 10 secondi. Se il piano non e ancora
      caricato, lo carica, chiude l'eventuale finestra A/B e applica il seek
      prima di Play. Ogni file singolo dispone inoltre di una barra dedicata
      che sposta la posizione dentro il file e attende l'evento `seeked` del
      browser prima di confermare il nuovo punto; i generatori continui
      dichiarano onestamente di non avere una posizione file. Lo stesso
      handshake verificato precede ora Play e ogni riposizionamento del
      dual-deck: un evento `seeked` su un punto diverso fallisce e la barra
      torna alla posizione precedente. I due deck iniziali usano inoltre una
      barriera comune: nessuno dei due puo partire finche entrambi i seek non
      sono confermati; un errore su uno ferma e pulisce l'intera sessione. Nel
      browser Codex reale Open Tide e
      stato spostato con click e drag fino a 01:56/02:28; la sessione diretta e
      stata posizionata a 09:40, avviata dopo la conferma delle sorgenti e poi
      ascoltata oltre la fine del crossfade a 09:52 e lasciata in pausa, senza
      errori o avvisi console. Un nuovo click diretto sulla timeline ha inoltre
      spostato la sessione da 00:00 a 10:00 prima del Play.
- [x] Cambio modalita, sostituzione piano e avvio sono serializzati: prima si
      ferma l'audio corrente, poi cambia la superficie. Sessione completa e
      coppia diretta conservano piani separati, quindi UI e audio non possono
      divergere tornando da una modalita all'altra. L'indice della transizione
      torna a zero a ogni cambio di modalita e un errore di load/play non puo
      produrre un falso stato `Playing`. Volume e mute restano visibili ma
      disabilitati finche il programma mostrato non e caricato, quindi non
      possono modificare una sorgente precedente nascosta.
- [x] Il catalogo completo e il dual-deck adattivo sono dichiarati e abilitati
      esclusivamente nel Workbench Web localhost. Gli script Web si legano
      esplicitamente a loopback e anche i deep link dei file locali falliscono
      chiusi su host non-loopback o in produzione. La superficie QA nativa non
      finge che i 37 file locali siano incorporati o scaricati.
- [x] Gate della revisione aggiornato: lint e TypeScript verdi; Jest 39 suite /
      185 test, regressione audio 55/55, inclusi conteggi correnti
      48/47/33/14/1, partner compatibili,
      fattibilita temporale del safe exit, programma diretto fail-closed,
      click/drag/clamp, conferma e posizione esatta dopo `seeked`, seek file e
      dual-deck, barriera Play atomica, cleanup con un deck fallito e l'altro
      pendente, seek fail-closed, rollback UI, load+seek prima di Play, reset
      dell'indice, volume confinato e fallimento load onesto.
- [x] Separazione export verificata dal checkout reale: gli script nativi e i
      tre profili EAS usano `public-mobile`, quindi il catalogo localhost resta
      disponibile al Workbench ma non viene copiato nell'output mobile. Il
      validatore nuovo ha confermato iOS 162.490.586 byte e Android 163.646.167
      byte, ciascuno con esattamente tre WAV ATP01 e nessun FLAC starter, per
      155.520.132 byte audio; nessun path `audio-catalog` e nessun file oltre
      100 MiB.
      Il comando Expo grezzo precedente aveva invece copiato il catalogo allora
      presente per 2.706.406.941 byte:
      per questo non fa piu parte del runbook. Un archivio EAS reale resta
      `NON DETERMINATO — EVIDENZA INSUFFICIENTE` finche EAS non e autorizzato.
- [ ] La revisione QA richiede approvazione visiva e d'uso dell'utente prima
      di un eventuale nuovo commit. Nessun push, EAS o build e stato eseguito.

- [x] Due modalità consumer: `Sound only` operativa esclusivamente nella
      preview QA localhost e `Guided` visibile ma bloccata con
      `RECORDED VOICES · IN PRODUCTION`. Nessuna voce sintetica, registrazione
      fittizia o account.
- [x] Home e Yoga seguono bisogno/attività → durata → Start. Le durate possibili
      sono 10/20/30/45/60/90 minuti, filtrate per Meditation, Yoga, Massage,
      Relax, Sleep e Focus. Restano letterali `What do you need right now?`,
      `Start your yoga session`, `Start your massage session` e
      `Play your last session`.
- [x] La personalizzazione è progressiva e chiusa al primo render. La scelta
      della voce compare soltanto in Guided; offline e modalità non ostacolano
      il percorso principale Sound only.
- [x] `Play your last session` persiste soltanto outcome, durata e modalità
      dopo uno Start riuscito; la Home rilegge lo stato al ritorno, genera una
      nuova variazione e non espone né conserva il seed QA nell'URL consumer.
- [x] Registro Continuum separato dal catalogo: intenti, famiglia estetica,
      famiglia armonica, energia iniziale/finale, densità, presenza melodica,
      compatibilità voce, ruolo di fase, boundary di ingresso/uscita, classe di
      transizione e stato offline. I metadata inferiti restano esplicitamente
      `PROVISIONAL — CATALOG AND FILENAME INFERENCE`, sono esclusi per default
      e richiedono un opt-in confinato alla preview QA locale.
- [x] Planner puro e riproducibile tramite seed: arco Arrival → Flow →
      Deepening → Return, nessuna opera o famiglia ripetuta nella stessa
      sessione, esclusione delle tre sessioni recenti, regole specifiche per
      fase, controlli di transizione ALL-OF e fallimento esplicito quando una
      sequenza sicura non esiste. L'identità include input e timeline completi;
      nessuno shuffle arbitrario o fallback musicale casuale.
- [x] Durata esatta calcolata in frame interi a 48 kHz. I cambi avvengono sui
      boundary di loop registrati; un finale editoriale richiesto e assente
      fallisce chiuso. In assenza di outro editoriale, il contratto dichiara un
      inviluppo finale controllato e non finge una chiusura composta.
- [x] Crossfade equal-power configurabile; il baseline M5 usava 12 secondi,
      mentre la revisione d'ascolto corrente imposta 180 secondi per le coppie
      musicali approvate. Normalmente una sola opera è udibile e soltanto il
      passaggio usa due deck. Peak combinato
      stimato sul massimo matematico dell'intera curva e trim statico calcolato
      per restare a massimo -1,1 dBTP. Ogni transizione resta
      `PROVISIONAL — LISTENING REVIEW REQUIRED`.
- [x] Preview Web Audio locale con validazione metadata di tutte le sorgenti,
      preparazione del prossimo deck, seek, pausa/ripresa, volume, audition
      outgoing/incoming/both e loop della finestra di cambio. Un errore futuro
      torna al controller. È QA browser, non prova di precisione nativa.
- [x] Workbench interno con timeline completa, fasi, entry/crossfade/exit,
      scrubber, cambio precedente/successivo, finestre ±30/60 secondi, A/B di
      durata/curva, metriche, audit regole, seed salvabile e controllo esatto di
      tutti gli intervalli senza attesa reale.
- [x] Il Workbench non è linkato dalla UI consumer. `app.config.js` seleziona
      `src/app` per default e `src/app-qa` soltanto con
      `APP_RELAX_SURFACE=qa`; `src/app-qa/` e `src/qa/` sono esclusi da
      `.easignore` e un validatore dedicato controlla il confine.
- [x] Manifest offline locale senza URL: pacchetto Water da 12 opere,
      177.645.113 byte, con ID, revisione, SHA-256 e object key. Stato
      download/verify/retry/remove, spazio libero sui byte mancanti, recovery
      da interruzione, staging streaming, riconciliazione del contenuto e porte
      atomiche source/storage sono implementati e testati. Gli adapter nativi e
      la delivery remota non esistono e non vengono dichiarati.
- [x] Il catalogo locale completo da 2.657.446.897 byte resta in
      `public/audio-catalog/`, fuori da Git e dall'archivio EAS. Il local source
      è esplicitamente read-only e non viene finto come download offline.
- [x] Il percorso tecnico `AUDIO TEST / TEST ONLY` e il player autonomo M4
      restano regressioni separate; nessun mixer è stato introdotto nelle
      sessioni consumer.
- [x] Gate logici finali eseguiti con Node 22.23.1 e pnpm 11.16.0:
      Prettier, lint e TypeScript verdi; Jest 40 suite / 207 test; regressione
      audio 8 suite / 69 test. Sono coperti durate, determinismo, vincoli,
      regole di fase, peak, audit 90 minuti, controller, persistenza, offline e
      confine QA.
- [x] Validatori placeholder, ATP01, catalogo consumer, lossless, asset,
      config, sicurezza e confine Workbench verdi. Il validatore conferma zero
      FLAC starter e conserva il confronto PCM soltanto come evidenza storica
      del master esterno. L'audit dipendenze corrente non rileva advisory.
- [U] Expo Doctor passa 18/20 controlli; i due controlli remoti falliscono per
  `ENOTFOUND exp.host` con rete sandbox disabilitata, non per un difetto
  dimostrato del progetto. `expo install --check` dichiara le dipendenze
  aggiornate usando la mappa locale Expo, ma avverte che il risultato
  offline non è una verifica remota completa.
- [x] Export isolati correnti verdi: iOS 162.493.295 byte e Android 163.648.902
      byte. I due export nativi contengono esattamente tre WAV ATP01 e nessun
      FLAC starter, per 155.520.132 byte; nessun file supera 100 MB, il catalogo
      da 2,6 GiB è assente e la scansione mirata non trova Eclypsis. Gli export
      Web consumer e QA sono stati rigenerati senza riferimenti al brano.
      Il confronto Web trova 15 artifact testuali consumer puliti e il sentinel
      QA soltanto nei 16 artifact della superficie QA.
- [ ] Un nuovo archivio sorgente EAS reale non è stato generato né caricato:
      `eas build:inspect` ed EAS restano fuori dall'autorizzazione M5. Il
      validatore dell'archivio è predisposto e `.easignore` è verificato
      staticamente, ma queste prove e gli export isolati non equivalgono a un
      archivio EAS corrente: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [x] Prova browser reale localhost a 390×844: Home e sei outcome leggibili;
      Guided mostra la voce solo come `IN PRODUCTION` e disabilita Start;
      Sound only ha avviato Open Tide con timer in decremento, Pause ha fermato
      il timer per 1,5 secondi e Play lo ha ripreso. Nessun errore console.
      L'audit Workbench riporta durata esatta, nessun gap, massimo due sorgenti
      e sette intervalli esatti; audition A avviata senza errori.
- [x] Cinque screenshot runtime Web sono in `dist/m5-screenshots/`: Home,
      Guided/offline, player in Play, piano Workbench e audit accelerato. Sono
      prova della preview locale, non approvazione d'ascolto né prova nativa.
      Metro, server localhost, emulatore e ADB risultano spenti a chiusura.
- [x] Il 3 settembre 2026 l'utente ha approvato esplicitamente i cinque
      screenshot M5. L'approvazione è visiva e non implica approvazione delle
      transizioni musicali, commit, EAS o prove native.
- [ ] Native adaptive dual-deck, seek schedulato, due decoder FLAC, pacchetti
      scaricati, background/lock-screen/Bluetooth, durata lunga, batteria e
      qualità delle transizioni: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
      Il driver nativo fallisce esplicitamente invece di simulare supporto.
- [ ] Approvazione d'ascolto delle transizioni: gate umano separato. Il giudizio
      positivo sui singoli file non approva automaticamente accoppiamenti,
      durata o curva dei passaggi.
- [ ] Non resta alcuna coppia musicale approvata. Le sessioni musicali restano
      `IN PRODUCTION` e falliscono chiuse finché non viene approvato un nuovo
      abbinamento; nessun fallback casuale è stato introdotto.

## M4 implementato localmente

- [x] Registro editoriale unico di 48 entità autonome: 40 opere file-backed (13
      derivati analogici, 24 opere Water/Air e tre ATP01) più otto generatori
      noise runtime. Ogni entità resta single-source.
- [x] Tutti e sei gli outcome hanno opere riproducibili nel localhost. Calm è
      ricondotto a Relax; Water vive in Elemental Worlds e Second Element: Air
      in Esoteric Series, senza cambiare i master o sommare sorgenti.
- [x] L'utente ha dichiarato positivo l'ascolto dei 15 lavori analogici e dei 24
      Water/Air il 3 settembre 2026; il 4 settembre ha poi respinto Eclypsis ed
      eliminato Nirvana Waves. Restano quindi 13 lavori analogici e 24
      Water/Air, 37 opere con stato
      `APPROVED — LISTENING PASSED`. Titoli e mapping restano modificabili.
- [x] Meditation occupa ora la prima posizione della Home. Nel localhost la sua
      selezione apre con `Open Tide` in evidenza e prosegue con gli altri cinque
      suoni marini già associati a Meditation; `Eclipse Veil` è escluso.
- [x] `Stillwater Halo` non compare più in Soundscapes né in alcuna selezione
      consumer; il master esterno resta archivio intatto.
- [x] `SingleTrackProgram` separato dal preset tecnico; controller, driver,
      timer assoluto, fade, interruzioni, notification lifecycle e persistenza
      supportano una sola sorgente consumer in loop: file oppure noise buffer.
- [x] Collezione `Noise Colours`: White, Pink, Brown/Red, Blue/Azure,
      Violet/Purple, Grey/Gray, Green e Black. Gli alias non duplicano
      generatori; Grey, Green e Black sono dichiarati profili non standard.
- [x] I noise vengono generati una sola volta al load in un buffer stereo
      Float32 48 kHz da 8 secondi, con boundary raccordato, sample peak 0,5 e
      gain interno -6 dB. Nessun nuovo asset audio e nessun peso audio nel
      pacchetto; circa 3,1 MB temporanei per il buffer attivo.
- [x] Player consumer con Play/Pause/Stop, timer 15/30/60, volume principale e
      mute; nessun mixer, Hz, waveform o pannello tecnico.
- [x] Flusso outcome realmente disponibile in due tocchi: Home → lista filtrata;
      il primo asset incorporato è ordinato in testa e il secondo tocco lo
      carica e avvia nel player. Le opere successive aprono il player senza
      autoplay.
- [x] Gain di ascolto calcolato per circa -18 LUFS; tutte le opere restano sotto
      -1 dBTP post-gain senza rinormalizzare master o applicare limiter.
- [x] 18 FLAC level 8 generati fuori repository e verificati: PCM decodificato
      identico ai WAV. Totale 2.563.271.952 → 1.455.254.377 byte (-43,2267%).
- [x] Lo starter consumer FLAC è vuoto dopo l'esclusione di Eclipse Veil. Moon
      Drone e Deep River riusano due ATP01 nel consumer; `SLEEP_TEXTURE_001`
      resta nei byte soltanto per AUDIO TEST dopo il rifiuto consumer di Soft
      Air.
- [x] Catalogo localhost completo: 37 file on-demand in
      `public/audio-catalog/`, ignorati da Git, per 2.657.446.897 byte. Sono i 13
      lavori analogici ancora approvati come WAV invariati e i 24 Water/Air
      come FLAC delivery invariati.
      Manifest locale, dimensioni e SHA-256 di ogni file sono validati.
- [x] Prova browser individuale storica completata sulle 38 opere allora approvate;
      Nirvana Waves è stata poi esclusa. Per le 37 opere correnti,
      ciascuna ha raggiunto lo stato Pause dopo Play, senza alert o errori
      console. Play/Pause/Stop restano verificati sul percorso Web Audio.
- [x] Gate locali M4 verdi dopo l'estensione: Prettier, lint, TypeScript, 18
      suite / 81 test, regressione audio 40/40, peer dependency, Expo install
      check, Expo Doctor 20/20, validatori placeholder/ATP01/consumer/asset/config
      e confronto PCM lossless completo.
- [x] Bundle Metro Android e iOS verdi. La tabella degli asset referenziati
      deve contenere esattamente i tre WAV ATP01, per 155.520.132 byte; gli
      SHA-256 coincidono con i manifest e non sono emersi
      path locali o segreti mirati nel bundle/metadata. Un export locale eseguito
      mentre `public/audio-catalog/` è popolata ne copia anche i 38 file di
      ascolto: non sono asset Metro nativi e l'intera cartella è ora esclusa
      esplicitamente dall'archivio EAS tramite `.easignore`.
- [x] Export web statico verde con 12 route, incluse Home, outcome filtrato,
      Soundscapes e player consumer.
- [x] Anteprima web sonora su `http://localhost:8092/`: un adattatore Web Audio
      separato usa lo stesso `AudioSessionController` senza importare il graph
      nativo nel browser. Verificati nel browser Play/Pause/Stop, timer,
      volume/mute, Pink Noise generato, Deep River WAV e il percorso tecnico
      Moon Current; la precedente prova di Eclipse Veil resta soltanto evidenza
      storica. Nessun errore console nel run.
- [x] Dipendenze allineate alle patch SDK 57 richieste da Expo il 2 settembre:
      Expo 57.0.19, Router 57.0.18 e React Native 0.86.3. L'override transitivo
      `decode-uri-component` 0.5.0 corregge GHSA-vcc3-ghjq-m6fr; audit policy
      verde con i soli due residui `image-size` già documentati.
- [x] Il nuovo GHSA-6gmq-8vp8-gcm6 emerso il 3 settembre è chiuso con override
      transitivi `@xmldom/xmldom` 0.8.15 e 0.9.12, le due release corrette
      indicate dall'advisory. Audit policy nuovamente verde.
- [ ] Runtime FLAC/loop Android: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
      ADB è bloccato dal sandbox (`Operation not permitted`) e l'emulatore non
      si avvia in questa task; la compatibilità statica non vale come ascolto.
- [x] Quattro render statici M4 ad alta risoluzione prodotti e ispezionati da
      sorgenti, copy, font e artwork correnti: Home, lista Relax filtrata,
      Soundscapes e player. Sono prove visive di layout, non screenshot runtime.
- [x] Renderer browser e server locale M4 disponibili; lo screenshot web resta
      prova visiva e il playback web prova il solo percorso Web Audio.
- [ ] Runtime M4 su telefono reale: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
      Il browser non certifica background, Bluetooth, latenza, batteria o
      qualità del percorso nativo Android/iOS.
- [x] Qualità d'ascolto dei 39 file raccolti dalla Strategia approvata
      direttamente dall'utente. [U] Naming definitivo e test del percorso
      nativo restano separati; Soft Air resta `REJECTED — REPLACEMENT REQUIRED`.

## M3 implementato finora

- [x] Tab consumer `RITUALS`, `YOGA` e `SOUNDSCAPES` con copy inglese richiesto.
- [x] Home outcome-first con CTA esplicite per Yoga, Massage, Relax,
      Meditation, Sleep e Focus; il caso Yoga espone subito
      `Start your yoga session` e poi i formati 20/30/45/60.
- [x] Home riequilibrata in una griglia 2×3 di sei box equivalenti: nessun
      outcome domina la pagina; ogni box usa il proprio artwork finale e ordina
      funzione, CTA, formato e titolo futuro in questa sequenza.
- [x] Functionality and time-to-sound first; evocative naming is secondary metadata.
- [x] La Home usa come promessa guida la frase
      `Choose your moment. Press start. Leave the phone behind.` Un avviso
      separato e immediatamente visibile chiarisce che le sessioni consumer sono
      ancora in produzione e senza audio.
- [x] Tutte le card consumer sono `IN PRODUCTION`, disabilitate e prive di
      riferimenti a preset o asset audio.
- [x] Yoga predisposto per formati futuri 20/30/45/60 minuti.
- [x] Soundscapes predisposto per opere autonome, Elemental Worlds, field
      recording, Cosmic/Zen Ambient ed Esoteric Series.
- [x] `Moon Current`, `deep-sleep-432`, ATP01 e mixer multilayer confinati nel
      percorso separato `AUDIO TEST / TEST ONLY`, raggiungibile da Settings.
- [x] Play/Pause/Stop, timer, volume e mute restano chiari e accessibili nel
      solo player tecnico; motore, controller e persistenza preservati.
- [x] Direzione visiva: impressionismo/pastello meditativo con cosmic new age
      raffinato e contemporary minimal Japanese impressionism materico:
      pigmento minerale nihonga, sumi, gouache asciutta, washi, asimmetria e
      `ma`. Differenziazione da Anima nell'interfaccia, non abbandono
      dell'immaginario cosmico.
- [x] Sei artwork outcome originali, uno per Yoga, Massage, Relax, Meditation,
      Sleep e Focus: JPEG 720×720 generati con OpenAI image generation built-in.
      Cinque restano text-only; Yoga v2 deriva da un unico edit del precedente
      sorgente Yoga originale del progetto, senza reference esterne. Byte,
      SHA-256 e confine di provenienza sono in
      `docs/M3_OUTCOME_ARTWORK_PROVENANCE.md`.
- [x] Yoga v2: susuki, luna avorio incompleta e lavatura solare pesca integrati;
      screenshot runtime Android acquisito e verificato.
- [x] Approvazione umana dello screenshot Yoga v2 ricevuta dall'utente con
      `ok` il 15 agosto 2026.
- [x] Anteprima web locale della nuova Home a griglia acquisita senza emulatore:
      `01-home-grid-painterly-background-approved-candidate.jpg` mostra la
      gerarchia iniziale e il fondale;
      `01-home-grid-painterly-background-cards-detail.jpg` mostra CTA e formati
      dei box affiancati. Sono prove visive del layout, non prove runtime Android.
- [x] Fondale Home-only originale in stile impressionismo minimale giapponese:
      carta washi, velature pastello minerali, luce lunare, acqua/nebbia e
      vegetazione rada. Asset, manifest, hash e provenienza sono registrati in
      `docs/M3_HOME_BACKGROUND_PROVENANCE.md`; le altre route non cambiano.
- [x] Il precedente `bravo` ha autorizzato il commit locale, ma la successiva
      revisione post-commit ha riaperto il gate visivo: box e barra risultavano
      troppo alti e il fondale appariva spoglio.
- [x] Correzione locale dell'anteprima web: dimensionamento intrinseco bloccato,
      sfondo 390×844, artwork 131 px, box circa 357 px e barra 52 px con target
      tab da 48 px. Il fondale e i sei artwork sono ora visibili nel layout.
- [x] Spettro pastello reso esplicito nei sei box: giada, pesca, acqua marina,
      blu minerale, lavanda e zafferano usano testata, corpo, hairline e accento
      scuro coordinati senza filtrare gli artwork o introdurre blob/gradienti.
- [x] Revisione pastello verificata: Prettier, lint, TypeScript, 15 suite/62
      test e regressione audio 26/26 verdi; anteprima web senza errori console.
- [ ] Approvazione umana della Home pastello revisionata in
      `dist/m3-screenshots/01-home-pastel-spectrum-revision.jpg` e del dettaglio
      della seconda parte della griglia in
      `dist/m3-screenshots/01-home-pastel-spectrum-cards.jpg`.
- [x] Shell consumer separata `consumer-paper`: carta washi, inchiostro AA,
      composizioni editoriali asimmetriche, sezioni aperte e hairline; rimosso
      il linguaggio generico di card arrotondate, pillole e blob. Audio Test
      conserva intenzionalmente la shell tecnica scura.
- [x] Il primo screenshot Android `consumer-paper` è stato approvato dall'utente
      con `Design ok`. Il successivo passaggio di leggibilità porta tutte le
      micro-scritte consumer ad almeno 11 px, riduce il tracking e conserva il
      contrasto anche durante la pressione; screenshot aggiornato acquisito.
- [x] Gate repository M3 consolidato prima del commit: formattazione, peer,
      Expo install check, lint, TypeScript, 15 suite/60 test, audio 26/26,
      validatori audio/asset/config/security policy ed Expo Doctor 20/20 verdi.
      Gli export Metro iOS e Android contengono esattamente i tre WAV ATP01 con
      hash canonici e 11 JPEG registrati, senza segreti mirati rilevati.
- [ ] Screenshot finale runtime Android della Home: resta distinto
      dall'anteprima web richiesta e approvata senza emulatore.

## Baseline M2 completata e preservata

- [x] Registro editoriale separato dal motore: quattro goal, quattro rituali,
      quattro temi e un solo rituale disponibile.
- [x] Titolo pubblico e notifica del preset `deep-sleep-432` aggiornati a
      `Moon Current`; nessun Hz nella Home o nella vista principale del player.
- [x] Home 2x2 senza onboarding; `Quiet Tide`, `Cedar Light` e `Aquarian Sky`
      mostrano `IN PRODUCTION` e non possono navigare o caricare audio.
- [x] Player immersivo con timer e trasporto; `Adjust sound` e
      `About the sound` separati e chiusi di default.
- [x] Quattro artwork originali ispezionati, normalizzati JPEG 1080x1440,
      tutti sotto 1,2 MB e registrati con SHA-256.
- [x] Font OFL Newsreader e Manrope incorporati localmente, senza download
      runtime; motion massimo 1.03 solo in Play e statico con Reduce Motion.
- [x] Nessun nuovo WAV: il repository contiene ancora soltanto i tre master
      autorizzati di `AUDIO TEST PACK 01`.
- [x] TypeScript, lint e 12 suite/47 test verdi dopo l'implementazione UI;
      subset audio 26/26.
- [x] Gate M2 consolidato: dipendenze/peer, Expo install check, validatori audio,
      asset e config, Expo Doctor 20/20, config prebuild ed export Metro iOS e
      Android verdi. Il raw audit resta rosso soltanto per i due advisory
      `image-size` gia allowlistati; la policy audit e verde con residui accettati.
- [x] Gli export M2 contengono esattamente i tre WAV autorizzati e i quattro
      artwork registrati, senza placeholder audio, nuovo master, path locale,
      file credenziale o pattern segreto mirato.
- [x] Cinque screenshot runtime Android 1080x2400 acquisiti in
      `dist/m2-screenshots/`: Home, card `IN PRODUCTION` non navigabile, player,
      mixer a cinque layer e `About the sound`. Nessun overlay Fast Refresh;
      mixer con stati editoriali `READY`, senza `STEM`/`BINAURAL`/`NOISE`.

## Completato e verificato localmente

- [x] Brief, istruzioni locali e perimetro letti.
- [x] Audit di host, toolchain, repository, remote e file esistenti.
- [x] Repository Git locale inizializzato; remote canonico `https://github.com/robertfultonstudio/App-Relax.git` verificato e configurato; branch di milestone `codex/deep-sleep-432-mvp`; commit locale autorizzato; nessun push.
- [x] Documentazione base e decision log.
- [x] Expo SDK 57 / React Native 0.86.2 / Expo Router / TypeScript strict.
- [x] Home, quattro categorie, lista Sleep, player, Settings e Legal.
- [x] Preset unico `Deep Sleep 432`, tre stem reali di `AUDIO TEST PACK 01`, binaural e brown noise generati; i placeholder restano soltanto fixture di test.
- [x] Controller idempotente, timer assoluto, stop sorgenti sul clock audio, fade, mute/gain, persistenza, interruzioni serializzate, focus e cleanup notification.
- [x] Profili EAS separati per development Android/iOS e preview Android autonoma, identificativo provvisorio `com.robertfultonstudio.apprelax`, config plugin e archivio `.easignore` validati offline.
- [x] Dipendenze allineate e peer dependency verdi.
- [x] Lint, TypeScript, 9 suite/37 test (audio 26/26), validatori audio/config/asset safety, policy audit dipendenze ed Expo Doctor 20/20 verdi.
- [x] Prebuild isolato `--no-install`: iOS `UIBackgroundModes=audio`; Android permessi, foreground service e `mediaPlayback` presenti.
- [x] Account Expo personale `robertfultonstudio`, organizzazione `robert-fulton-studio` e progetto `@robert-fulton-studio/app-relax` creati tramite Google; linking verificato dalla CLI con project ID `e1d77255-66f4-45c1-b1fa-c503a088b30f`.
- [x] Piano EAS Free verificato sull'organizzazione: quota Android `0/15` prima e `1/15` dopo la build; nessun add-on, overage o costo.
- [x] Archivio Android no-VCS ispezionato e validato: 49 file / 6.143.075 byte, SHA-256 manifest `4c8769a5608b328a45c0ac55be4e8a84a6d835769dc8149866366843cbef8fd4`; nessun Git metadata, path locale, segreto, symlink, docs/test/tooling o flusso parallelo; esattamente tre WAV placeholder.
- [x] EAS Android `development-android` completata: build `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7`, SDK 57, fingerprint `0d061b3ea48ae2044f80a75a232326e3cf6eee7b`, stato `FINISHED` il 10 agosto 2026 alle 21:00:58 UTC.
- [x] APK scaricato in `dist/eas/` e verificato: 299.803.135 byte, SHA-256 `d54a5333b40574baeb6560879a743ad1722619df6f6c676669e62bf7feff4ae7`, ZIP integro, manifest, otto DEX e quattro ABI presenti; nessun path locale, file credenziale o token evidente rilevato. L'artefatto e ignorato da Git.
- [x] `AUDIO TEST PACK 01` ricevuto su istruzione esplicita: tre WAV PCM24 stereo 48 kHz da 180 secondi, hash e metriche registrati nel manifest; formato, clipping, DC e raccordi automatici verdi.
- [x] Preset e driver cablati ai tre stem reali distinti; placeholder non piu referenziati ed esclusi dagli archivi EAS.
- [x] Export Metro locali iOS e Android completati con esattamente i tre WAV reali; gli SHA-256 degli asset esportati coincidono con il manifest e nessun placeholder audio e incluso.
- [x] Android Emulator API 34 x86_64 avviato con l'APK EAS esistente e bundle corrente via Metro: Home -> Sleep -> player, UI `EARLY ACCESS`/`3 sleep layers`, cache di esattamente tre WAV con SHA-256 attesi, stato Ready e selezione timer 15 minuti verificati.
- [x] Un'esecuzione precedente dello stesso motore streaming ha raggiunto Play con AAudio attivo senza riprodurre il precedente OOM full-buffer; RSS osservato circa 602-605 MB in Ready e 631-695 MB in Play. Questa prova emulatore non certifica un telefono.
- [x] Il setup notification Android e stato rimosso dal percorso critico di Play: il rerun ha mostrato `RITUAL IN PROGRESS`, timer in decremento e AAudio stereo 48 kHz attivo. L'utente ha confermato di sentire il suono dagli altoparlanti del Mac.
- [x] EAS Android `preview-android` autonoma completata: build `c3a39414-d156-4373-810a-0011296b51f8`, SDK 57, fingerprint `92f6d62d3eb36db3d9eef3db223d6552c86af6f6`, stato `FINISHED` l'11 agosto 2026 alle 19:56:53 UTC; coda Free circa 87 minuti e compilazione circa 28 minuti.
- [x] APK preview scaricato in `dist/eas/`: 289.861.086 byte, SHA-256 `47a6603108f6aee3464f6a63ae00f0b0fdb287d375a391d1a9210043e6b0a2a6`, ZIP integro, 1.328 entry, bundle Android incorporato da 3.216.244 byte, quattro DEX e 27 librerie per ciascuna delle quattro ABI.
- [x] I tre WAV incorporati nell'APK coincidono byte per byte con gli SHA-256 del Test Pack; nessun placeholder, path locale, filename credenziale o pattern segreto mirato rilevato.
- [x] Smoke standalone su emulatore API 34 dopo cancellazione dei dati app e con Metro spento: Home, player `READY WHEN YOU ARE`, `RITUAL IN PROGRESS`, timer 28:55 e AAudio avviato. Screenshot verificabile in `dist/eas/`, ignorato da Git.
- [x] Piano EAS Free dopo la preview: Android `2/15`, iOS `0/15`, totale `2/30`, overage 0, add-on assenti e costo totale stimato 0 centesimi.

## Gate aperti

- [x] [F] Su dichiarazione diretta dell'utente, l'APK precedente è stato
      installato e avviato su un telefono Android reale e Play ha prodotto suono.
- [ ] [U] Modello telefono, versione Android e verifica strutturata di
      Home/controlli nel precedente test: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [ ] EAS cloud build iOS `development-ios`: richiede approvazione, account Apple Developer attivo, credenziali e registrazione iPhone.
- [ ] Smoke test audio su telefono reale; background, lock-screen, Bluetooth, interruzioni, latenza, batteria e qualita restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [x] I glitch percepiti nell'emulatore sono stati localizzati dopo l'HAL Android, nel ponte QEMU -> CoreAudio: AAudio e AudioFlinger hanno mantenuto frame e segnale continui con zero underrun, mentre CoreAudio ha riaperto due volte `AppleHDAEngineOutput` con gap di circa 22 ms e 11 ms. Il trigger esatto delle riaperture resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [ ] Presenza dei glitch e comportamento su telefono: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`; nessuna accettazione di qualita audio e implicita.
- [ ] Memoria/startup dei tre WAV reali su hardware ARM, loop percepito, bilanciamento e qualita: `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al test su telefono.

## Limiti locali verificati

- [F] Node di sistema 18.20.8 è insufficiente; il target di progetto è Node
  22.23.1. I gate M5 sono stati eseguiti con Node 22.23.1 installato nello
  spazio utente tramite nvm e pnpm 11.16.0 tramite Corepack, senza
  installazioni globali o di sistema.
- [F] macOS 13.7.8 e Xcode 15.2 non soddisfano Expo SDK 57, che richiede Node 22.13.x e Xcode 26.4+.
- [F] Nessun runtime/device iOS Simulator e installato; CocoaPods e assente.
- [F] Sono installati, su autorizzazione esplicita, Android SDK Platform Tools 37.0.1, Emulator 37.1.11, system image API 34 x86_64 e AVD `AppRelax_API_34_x86_64`. Emulator, Metro e server ADB sono spenti a chiusura test.
- [F] Android Studio, un JDK generico, SDK Platform e Build Tools restano assenti. Questi limiti impediscono build native locali, non Metro, l'APK esistente o build EAS cloud.
- [F] Nessun acquisto hardware e necessario per produrre i binari cloud; almeno un telefono fisico resta necessario per il gate audio reale.
- [U] `pnpm audit --audit-level high` segnala due DoS transitive high in `image-size` senza release corretta pubblicata. Nessun input immagine remoto e presente; il validatore vieta i formati vulnerabili per estensione e signature. La policy allowlistata e stata riverificata prima dell'upload EAS e resta un residuo upstream accettato, non un gate verde del raw audit.

## Prossimo gate

Gli screenshot M5 sono approvati e l'utente ha autorizzato separatamente un
commit locale. Resta aperto l'ascolto mirato delle tre transizioni del piano
proposto. Adapter nativo dual-deck, download mobile, asset delivery e una futura
build restano milestone distinte. Bluetooth, background, lock-screen,
interruzioni, batteria e percorso nativo restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## Lavoro parallelo escluso

`output/` e `tmp/` contengono flussi paralleli comparsi durante il lavoro, inclusi strategia e render PDF. Non appartengono a questa milestone Codex: sono preservati e ignorati integralmente per staging/upload.
