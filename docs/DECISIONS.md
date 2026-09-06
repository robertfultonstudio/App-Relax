# Decision log

## D-068 - Checkpoint locale e ulteriore riduzione minima del transport

Data: 6 settembre 2026
Stato: commit locale esplicitamente autorizzato; nessuna nuova pubblicazione

[F] Robert richiede «Commit» e, durante il preflight, comandi Play/Pausa
leggermente più piccoli. Altezza minima condivisa 56 → 52 (circa -7%),
senza ridurre icone/testo né perdere allineamento con Stop; target ancora
superiori a 44. La PWA pubblicata D-067 resta a 56: questa nuova variazione
è inclusa nel checkpoint locale, non pubblicata automaticamente.

[F] Perimetro: 193 percorsi di codice, test, configurazione, icone PWA e
documentazione accumulati dopo `72346a0`. Nessun nuovo byte audio; è inclusa
la rimozione già autorizzata dell'Eclypsis FLAC dal repository, recuperabile
dal commit precedente. I master esterni restano intatti. Esclusi audio
localhost da 2.657.446.897 byte, output/tmp Strategia, build, cache, report
generati e checkout isolato Sites. Nessuno staging globale.

[F] Gate: 62 suite / 400 test, typecheck, lint, formato, test HTTP 12/12,
placeholder/ATP01/consumer, safety/artwork, configurazione e confini QA/PWA
PASS. Doctor 20/20, Expo install-check PASS. Security PASS WITH ACCEPTED
RESIDUALS soltanto per i due advisory image-size già documentati. Scansione
segreti sui percorsi del commit PASS. Simulazione con `.easignore`: 149 file /
159.973.441 byte, esattamente i tre WAV ATP01, nessun catalogo pesante,
segreto o path sorgente privato. Non è un'operazione EAS.

[F] Dopo la riduzione a 52, nuova suite completa 400/400 (145 test audio
inclusi) e nuovo export PWA locale PASS: 111 file / 7.400.563 byte, zero audio
o Workbench. Prove locali in `dist/commit-app-review-jest.json`,
`dist/commit-app-review-doctor.log`, `dist/commit-app-scope.json` e
`dist/commit-app-pwa`. L'export locale non aggiorna il Site pubblicato.

[F] Audit parallelo su snapshot isolati: nessun materiale estraneo; riallineati
i riferimenti storici di pubblicazione/commit nei documenti. Rilevata una
divergenza di gain nel motore nativo composito ancora inattivo, registrata
come blocco prima dell'attivazione in `docs/A01_NATIVE_GATE.md`. UI e factory
nativa mantengono il doppio gate Web-only/resolver assente. Salvare il
checkpoint non promuove quella preparazione a funzionalità disponibile.

[U] Gate di ascolto/resa aggiornata, offline privato, background e long-run
restano aperti. Il commit locale non autorizza push, PR, build native/cloud,
nuova pubblicazione, acquisti o attivazione di funzioni future.

## D-067 - Pubblicazione privata della barra compatta

Data: 6 settembre 2026
Stato: A01-A14.5 pubblicata, versione Sites 6; attesa del giudizio iPhone

[F] Robert autorizza «Mettila nella PWA». Pubblicata soltanto la correzione
D-066 e il nuovo identificativo di revisione; nessuna modifica ad audio,
catalogo, disponibilità, Worker, accesso o funzionalità. I controlli sono
compatti ma mantengono posizione, azioni e target accessibili.

[F] 7 suite / 42 test player/PWA e 12 test Worker PASS; export e validatore
PWA PASS, formato e scansione segreti/path privati PASS. Shell 111 file /
7.399.811 byte, zero audio/Workbench/sourcemap; archivio 113 file /
7.417.043 byte non compressi, 3.517.647 byte gzip. Precache 109 file /
7.388.955 byte. Lo storage AUDIO con i 37 file esistenti non è modificato.

[F] Source isolata `7f9ef6c15103614a26ed83d9be15822dcbc6dec6`;
versione `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_1f916abcd0dc81919dd2e17dd3b15072`.
Deployment `appgdep_6a9cb60dc580819195a0a051ae883c9d` succeeded, env 2.
Live: https://app-relax-private-review.robfulton.chatgpt.site.
Accesso verificato owner-only: un account, nessun gruppo/ospite, revision 1;
anonimo HTTP 401. Handoff accodato nella scheda Codex esistente.

[F] Verifica remota completata: 68 HTML con riferimento al bundle aggiornato
e 43 asset non-HTML byte-identici. Prove e hash in
`dist/compact-transport-publication.json`. Non è un test d'ascolto iPhone.

[F] Fonte costi ricontrollata: Sites incluso nei piani idonei durante beta
(https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost). Nessuna
quota numerica residua esposta, nessun gate a pagamento o acquisto, nessun
nuovo servizio o upload audio. Non è stato modificato l'accesso al Site.

[F] Il solo checkout isolato Sites segue commit/push richiesti dalla
pubblicazione. HEAD canonico resta `72346a089fca9d9235b1788acceab6eb0dcd455c`,
index vuoto; niente commit dell'app, push GitHub, EAS o build nativa.
[U] Il test visivo/ascolto aggiornato su iPhone resta umano. Offline privato,
background e long-run non vengono dichiarati risolti da questo aggiornamento.

## D-066 - Barra di ascolto compatta, senza alterare la disponibilità

Data: 6 settembre 2026
Stato: correzione locale; non pubblicata e non committata

[F] Robert giudica eccessivo l'ingombro della barra introdotta in D-063:
la visibilità non deve compromettere l'estetica consumer-paper. Stop resta
a sinistra e Play/Pausa a destra, nella stessa posizione fissa. Altezza minima
da 80 a 56, simbolo e testo affiancati, carattere 16, bordi sottili e fondo
carta per Stop; Play/Pausa mantiene il contrasto inchiostro/carta. Nessuna
altezza massima impedisce alla riga di crescere con il testo ingrandito.
Motore, callback, navigazione e catalogo non cambiano.

[F] Test mirati player/barra corrente/adattivo: 4 suite, 24 test PASS.
Prettier sui due file, lint e typecheck PASS. Il test verifica ordine,
target 56 (oltre il minimo 44), riga compatta, colori e azioni anche durante
Starting. Queste prove non sostituiscono il giudizio visivo su telefono.

[F] Export Web locale e validatore PWA PASS: 111 file / 7.399.811 byte,
45 route player, nessun byte audio o Workbench. Artefatto separato
`dist/compact-transport-pwa`, log `dist/compact-transport-export.log`;
nessun server/Metro o emulatore lasciato attivo.

[F] Gli stati futuri non vengono nascosti o promossi a disponibili: Guided
richiede registrazioni vocali reali; le coppie musicali approvate sono vuote
dopo D-055/D-056 e richiedono revisione, non necessariamente nuove opere.
Ascolti singoli e sessioni naturali restano utilizzabili. Il QA tecnico dei
crossfade D-064 resta indipendente dalla produzione di nuovo materiale.

[U] Nessuno screenshot runtime ottenuto: il primo accesso locale precedeva
l'avvio del server e ha restituito connessione rifiutata; la selezione della
pagina d'errore è stata poi bloccata dalla policy del browser. Non sono stati
usati browser o percorsi alternativi per aggirarla. Resa visiva aggiornata:
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

[F] La PWA privata resta A01-A14.4 / Sites 5 con la barra precedente.
Nessuna pubblicazione, commit, push, nuovo audio o modifica ai master.

## D-065 - Aggiornamento privato crossfade, poi test umano prima del commit

Data: 6 settembre 2026
Stato: A01-A14.4 pubblicata, versione Sites 5; attesa dell'esito iPhone

[F] Robert richiede la PWA aggiornata da lasciare disponibile per un test
successivo; il commit canonico viene rimandato all'esito positivo del test.
Si riusa il Site privato, senza nuovi servizi, audio, acquisti o condivisione.
Fonte costi ricontrollata: Sites incluso nei piani idonei durante la beta
(https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost). Quota
numerica residua non esposta dal connettore; nessun gate di acquisto/upgrade
ha richiesto o ricevuto approvazione.

[F] Export PWA 111 file / 7.420.963 byte, zero audio/Workbench; pacchetto
locale 113 file regolari / 7.438.195 byte non compressi. Source isolata
`b9e714a47884870b086c889cdba502146970aef9`; versione
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_fcfcb1380eb08191b8fc96638cd7b3bd`.
Deployment `appgdep_6a9ca8dca3388191981de52c1c293575` succeeded, env revision 2.
Live: https://app-relax-private-review.robfulton.chatgpt.site.

[F] Verifica remota: 68 HTML con riferimento al bundle nuovo e 43 asset
byte-identici. Accesso custom, un solo proprietario, nessun gruppo/ospite;
anonimo HTTP 401. Worker, catalogo e binding AUDIO invariati. Test Worker
12/12 e suite crossfade rieseguita 92/92; regressione completa precedente
400/400. Handoff accodato nella scheda Codex già esistente.

[U] La richiesta API identity-less al catalogo riceve 401 dal controllo
identità: non è un nuovo test audio autenticato su iPhone. Non vengono
falsificati header di identità né allentata l'autenticazione. Qualità,
crossfade reali, latenza, offline remoto e long-run restano gate umani o
di piattaforma. Prove e metadata del pacchetto in
`dist/crossfade-publication.json`.

[F] HEAD canonico invariato `72346a089fca9d9235b1788acceab6eb0dcd455c`, index
vuoto. Commit/push eseguiti soltanto nel repository isolato richiesto da
Sites per la pubblicazione; nessun commit dell'app, push GitHub, EAS o build
nativa. Nessun server, emulatore o ascolto lasciato acceso. La PWA rimane
pubblicata e non viene modificata in attesa del riscontro di Robert.

## D-064 - Verifica crossfade indipendente dai brani

Data: 6 settembre 2026
Stato: correzioni e test locali; nessun aggiornamento della PWA pubblicata

[F] Robert precisa che i crossfade devono essere testati anche senza
approvare specifici abbinamenti, per verificare la solidità del codice.
Il Workbench e i test accelerati precedenti restano il riferimento; non si
vincola il QA tecnico alle coppie editoriali mancanti dopo D-055/D-056.

[F] Fixture senza asset: due corsie, transizioni lente e sfalsate, sessioni
virtuali fino a 90 minuti. Corrette curva frazionaria dopo seek, automazioni
vecchie su Resume, composizione ingresso/finale e gain iniziale nel finale,
ritardo di posizionamento della sorgente entrante (retry limitato e
cancellabile). L'audit respinge anche un piano vuoto. Nessuna modifica ai
brani, al catalogo, alle durate editoriali o all'architettura nativa.

[F] `pnpm test:crossfade`: 10 suite / 92 test; regressione completa:
62 suite / 400 test. Nuovi 18 casi, TypeScript e lint verdi.
Dettagli e prove ripetibili: `docs/CROSSFADE_QA.md`.

[U] API simulate e clock virtuale non certificano decoder, PCM renderizzato,
qualità sonora, long-run, background o latenza su iPhone/Android.
NON DETERMINATO — EVIDENZA INSUFFICIENTE per questi gate. D-063 descrive la
PWA pubblicata; D-064 resta locale, senza commit, push, EAS o pubblicazione.

## D-063 - Comandi immediati e personalizzazione visibile dopo il test iPhone

Data: 6 settembre 2026
Stato: A01-A14.3 verificata e pubblicata sul Site privato, versione 4

[F] Robert riferisce test iPhone positivo e suono pulito sulla versione già
pubblicata; apprezza i collegamenti Home, che restano invariati. Chiede comandi
Stop/Play/Pausa riconoscibili senza cercare il testo, minore attesa e recupero
della personalizzazione delle sessioni. Questo riscontro non prova offline,
background, tutti i decoder o long-run.

[F] Transport consumer condiviso: Stop quadrato a sinistra su terracotta,
Play/Pausa a destra su inchiostro, simboli 25–30 px, target minimo 80 px e
testo 18 px. Il player lo fissa sotto lo scroll con safe area; nella
navigazione la barra della sessione usa lo stesso ordine. Sfogliando un altro
suono compare un solo transport fisso per l'ascolto corrente, non due barre.
Il nuovo candidato mantiene un pulsante contestuale Play this sound.

[F] Stop durante un Play pendente aveva fino a tre richieste di arresto:
fire-and-forget, cleanup del Play e stop serializzato. Ora la cancellazione
esplicita è benigna: un solo arresto, nessun falso errore, Ready soltanto dopo
la conferma del driver. Uno Start cancellato non naviga come se fosse riuscito.
Non sono stati accorciati fade editoriali o rimossi i vincoli WebKit di avvio.

[F] Personalize your session è un'azione distinta prima di Start; espone
famiglia naturale, durata già scelta e ordine effettivo delle opere del piano.
Le sessioni naturali evolventi erano presenti ma nascoste in Customize.
Le sessioni musica più natura NON vengono dichiarate ripristinate: dopo D-055
e D-056 il registro delle coppie musicali autorizzate è vuoto. Serve una
nuova scelta/revisione di abbinamenti, non il recupero delle tracce respinte.
Guided resta IN PRODUCTION; nessun mixer libero o nuovo audio.

[U] Millisecondi risparmiati e percepibilità della nuova UI sull'iPhone:
NON DETERMINATO — EVIDENZA INSUFFICIENTE fino al confronto dell'utente.
L'audit read-only conferma guardie di invalidazione Web/PWA; rileva una race
preesistente nel driver nativo dopo await Start/Resume/Dispose, non risolta
dalla vecchia tripla richiesta Stop. Non viene promossa questa patch a
garanzia nativa: vedi docs/A01_NATIVE_GATE.md. Il gate offline D-062 resta
aperto; le correzioni .2 e .3 sono consegnate in un unico aggiornamento.

[F] Run finale: 61 suite / 382 test, regressione audio 128/128, TypeScript,
lint e format mirato verdi; Doctor 20/20, install-check e validatori verdi.
Un export iOS interrotto è stato respinto per metadata assente e rieseguito
da zero: ultimo export iOS/Android e confini Web/EAS tutti PASS. Shell PWA
111 file / 7.419.834 byte, senza audio. Versione privata 4, deployment
appgdep_6a9ca0c09b20819196171ae372b78a60 succeeded, environment revision 2.
Sorgente Sites isolata e3b3bae45dbcdf4673c90911df6db1aa090efdd1.
Accesso ricontrollato: un solo proprietario, zero gruppi/ospiti; AUDIO
invariato, nessun nuovo upload, servizio o acquisto. Canonical HEAD invariato
e staging vuoto. Prove in dist/a01-a14-gates/phone-controls-final-state.json.

## D-062 - Download verificato non equivale a riapertura offline pronta

Data: 5 settembre 2026
Stato: correzione software verificata; inclusa nell'aggiornamento privato A01-A14.3 pubblicato

[F] Dopo il fallimento remoto D-061, revisione mirata ha dimostrato che la
registrazione service worker era fire-and-forget; i test chiamavano install
e fetch senza verificare ready/controller. Il file OPFS verificato non
garantiva l'app shell. Il problema non viene attribuito a Sites senza prova.

[F] Introdotto gate separato e limitato nel tempo: register, ready, worker
esatto, controller e handshake di cache completa. La UI distingue download
audio da app pronta e propone controllo/ripristino online manuale, senza
interrompere l'ascolto o usare takeover. Nessun audio cancellato o ricaricato,
nessuna modifica di accesso o dipendenza. Test completi 60 suite / 377 verdi;
TypeScript, lint e formattazione verdi.

[U] Riapertura privata offline e iPhone restano NON DETERMINATO — EVIDENZA
INSUFFICIENTE fino alla nuova prova autorizzata; il blocco della pagina errore
del browser non viene aggirato. Nessun commit canonico, EAS o spesa.

## D-061 - Consolidamento A01–A14, offline PWA selettivo e limiti nativi

Data: 5 settembre 2026
Stato: software locale verificato; PWA privata versione 3 pubblicata; riapertura offline remota non superata

[F] UI consumer compatta con Home/Sounds, durata pertinente prima dello Start,
preparazione silenziosa isolata e avvio confermato nello stesso gesto. Barra
sessione persistente e ultimo ascolto single/adaptive; cronologia heard-only.
La matrice planner ammette 35 combinazioni naturali reali; Meditation 10 min
offre un'opera autonoma, non un piano incompatibile. Nessuna nuova coppia
musicale, voce o revisione editoriale è stata inventata.

[F] Download selettivo OPFS con hash del trasferimento e rilettura, spazio,
cancel/retry, rimozione reversibile e lease. Starter pioggia di 16.622.588 byte.
Prova localhost nel browser Codex senza rete, chiusura pagina e riapertura: Quiet Weather
in Play con timer 10:00 → 09:18. Non è una prova di iPhone installato né del
catalogo completo offline. La shell viene precacheata integralmente; audio e
Range restano fuori da Cache Storage. Gli aggiornamenti attendono la chiusura
dei vecchi client e non interrompono una sessione attiva.

[F] Doctor ha richiesto Expo 57.0.20 e Router 57.0.19. Metadata ufficiali npm
verificati; aggiornamento locale con pnpm 11.16.0 e store esistente, senza
installazioni globali. SDK 57/RN 0.86.3/RNAA 0.13.2 invariati. Un export PWA
ha rilevato nomi ATP nella cache di trasformazioni condivisa dopo export QA:
artefatto respinto dal validatore, non pubblicato. Gli script export ora
richiedono `--clear`; il gate non è stato allentato.

[F] Lo scheduler nativo e il resolver verificato sono implementati e testati,
ma la factory NON inietta storage nativo concreto: playback adattivo/offline
nativo resta fail-closed. Seek con tolleranza software fino a 100 ms e preload
progressivo JavaScript non attestano sample accuracy o background.

[F] Accesso Site ricontrollato: proprietario, una sola persona, zero ospiti o
gruppi. Si aggiorna soltanto il medesimo Site e binding AUDIO; nessun nuovo
upload audio. Sites risulta incluso nella beta dei piani idonei dalla fonte
ufficiale corrente; nessun upgrade, acquisto o nuovo servizio ammesso.
Fonte: https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost.

[F] Versione 3 A01-A14.1 pubblicata: deployment
`appgdep_6a9c2e5f3f8081918d569ed24f7e2f57` succeeded, environment revision 2;
sorgente Sites isolata `c0e50acd6157c83548443591e240b1358aa62e3e`.
Shell 111 file / 7.286.699 byte senza audio; 68 HTML e 43 asset remoti
verificati. Tutti i 37 file AUDIO esistenti sono coerenti; Start remoto
Meditation e Stop verificati. Jest finale 59 suite / 369 test verdi,
Doctor 20/20. Nessun commit/push canonico, EAS o nuovo servizio.

[F] Il Rain starter si scarica e verifica anche sul sito privato. La prova
di riapertura remota senza rete invece FALLISCE nel browser integrato.
[U] Causa e riapertura PWA privata offline: `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`. Non promuovere la prova localhost a certificazione remota.
La pagina d'errore blocca anche la pulizia automatica della scheda: nessun
aggiramento; chiusura manuale della sola scheda di test. Server 8095 spento.

[U] Gate telefono/installazione, VoiceOver/TalkBack, tutti i decoder,
background, lock screen, Bluetooth, batteria, qualità e long-run:
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Il dettaglio verificabile e il
protocollo sono in `docs/AUDIT_A01_A14.md`; nessun commit/push canonico o EAS.

## D-060 - Milestone A01–A14 e varietà subordinata alla disponibilità

Data: 5 settembre 2026
Stato: autorizzata, obiettivo aperto e implementazione in corso

[F] L'utente, dopo il test iPhone, richiede la risoluzione software di tutti i
rilievi A01–A14 e una nuova PWA privata soltanto a costo aggiuntivo zero
verificato. Nessun nuovo catalogo, commit/push canonico, EAS, acquisto o
diffusione pubblica. Si riusa il Site e la delivery D-059; il gate nativo e
l'ascolto umano restano distinti dal Web.

[F] Viene approvata PRIMA dell'implementazione la revisione della sola
esclusione rigida FRA sessioni di D-047: la storia recente guida una
preferenza deterministica, non rende indisponibili opere altrimenti sicure.
Nella stessa sessione restano vietate ripetizioni di opera e famiglia; tutti
i vincoli editoriali, armonici, di fase, integrità e transizione restano duri.
La cronologia registra esclusivamente opere il cui ascolto è realmente
iniziato, non tutte le sorgenti pianificate al primo Play. Non viene
introdotto un replay identico consumer del seed QA.

[F] Stato iniziale protetto in `tmp/audit-a01-a14-baseline`: 251 file sorgente
non audio, hash, HEAD e stato Git. Baseline M4/M5 e modifiche preesistenti
preservate. Lavori indipendenti nativo/offline usano worktree separati;
integrazione selettiva, nessun agente scrive contemporaneamente nel canonico.

[I] Direzione: medesimi sei bisogni e artwork, Home compatta, proposta pronta
e durata prima dello Start, sessione persistente, errori recuperabili e
download locali espliciti. Hatha dolce/slow flow è un contratto di ruoli e
finestre future: Do maggiore e scansione proposta non sono musica approvata.
Crossfade musicale 180 secondi conservato; nessuna nuova coppia abilitata.

[U] Matrice delle evidenze A01–A14 in `docs/AUDIT_A01_A14.md`. Nessun rilievo
si considera risolto per la sola assenza di un test; telefono, offline reale,
persone e release rimangono gate espliciti fino a prova.

## D-059 - PWA privata online con 37 audio integri, import chiuso

Data: 5 settembre 2026
Stato: pubblicata privatamente; ascolto e installazione iPhone da confermare

[F] Ripresa autorizzata dopo lo sblocco della rete. Riutilizzato il Site
`appgprj_6a9bed84f78c81919575b1cbe1876cd1`, senza ampliare l'accesso:
una sola persona proprietaria, zero gruppi/ospiti. URL HTTPS live:
https://app-relax-private-review.robfulton.chatgpt.site.

[F] Versione pubblicata:
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_d2aa3d602af48191b60e97b310c31263`.
Deployment `appgdep_6a9bf8cd69b481919471b35af980a511`: `succeeded`,
environment revision 2. Sorgente isolata Sites:
`e519d75889430b033b1bb4f16f27bb5dcabd1013`; nessun commit/push del
repository canonico App-Relax. La correzione locale del solo checker hosted
riconosce anche il fallback offline, che non contiene il bundle Expo.

[F] Import completato: 37/37 file, 2.657.446.897 byte. Originali read-only;
SHA-256 locale e checksum completo R2 verificati, HEAD/dimensioni/hash e primi
e ultimi 16 byte remoti coerenti per ogni file. I grandi file usano multipart
64 MiB e promozione streaming con checksum verso chiave immutabile. Catalogo
fuori da shell/Git/EAS; nessuna ricodifica, compressione lossy o duplicazione
dei master. Restano escluse le opere respinte.

[F] La chiave temporanea di importazione e la scadenza sono state rimosse e
la revisione applicata tramite nuovo deployment. Dopo la chiusura, richieste
anonime a Home/catalogo e richieste import con vecchia chiave ricevono 401.
L'accesso audio normale usa l'identità ChatGPT verificata dalla piattaforma.
Il token operativo Sites non è inserito nel codice o nell'artefatto.

[F] Verifiche: Worker 12/12; audit dipendenze Site zero vulnerabilità; shell
remota 109/109 file (68 HTML inclusa la pagina offline, 41 asset non HTML
byte-identici). Sites può aggiungere il proprio bridge HTML; i 67 percorsi
dell'app mantengono il bundle esportato. Gli asset statici sono serviti dalla
piattaforma prima del Worker: il controllo `review-ready` del fallback Worker
non è una barriera globale alla Home. La consegna avviene solo dopo la verifica
di tutti i 37 audio; gli oggetti audio mancanti o incoerenti falliscono chiusi.

[F] Browser Codex autenticato: Home e catalogo visibili; Low Rain in Play con
timer in avanzamento. Dopo la chiusura import, Misted Garden ha raggiunto Pause
e 29:34 da 30:00; Stop eseguito. Un primo tentativo ha riportato una richiesta
Play interrotta da nuovo caricamento; dopo ricarica completa il test è passato.
Non si deduce da questo una correzione generale della compatibilità mobile.

[F] Nessun costo aggiuntivo, acquisto, abbonamento esterno, EAS o store
attivato. Sites resta soggetto ai limiti inclusi del piano; fermarsi prima di
qualunque richiesta di pagamento. Il telefono non necessita del Mac acceso.

[U] Ascolto di tutti i file e installazione su iPhone, offline audio,
background/lock screen e robustezza lunga: `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`. Guided, pacchetti offline e abbinamenti musicali privi di
approvazione restano onestamente `IN PRODUCTION`.

## D-058 - Pubblicazione privata PWA autorizzata, arresto prima di costi

Data: 5 settembre 2026
Stato storico: blocco superato dalla ripresa e dalla pubblicazione D-059

[F] L'utente, collegato da iPhone, autorizza esplicitamente la predisposizione
di una pubblicazione privata con tutti i 37 audio approvati, fermandosi prima
di qualsiasi costo. Questa decisione supera il precedente divieto di upload
e pubblicazione soltanto per questa prova privata; non autorizza gli store,
EAS, GitHub push, acquisti, servizi a pagamento o la modifica dei master.

[F] Verificate le pagine ufficiali Sites e Pricing: Sites è incluso nei piani
ChatGPT idonei durante la beta, con limiti di utilizzo. Non viene attivato un
abbonamento Cloudflare separato. In caso di quota insufficiente o richiesta
di pagamento, arrestarsi senza upgrade o acquisti.

[F] Creato una sola volta `App Relax — Private iPhone Review`, id
`appgprj_6a9bed84f78c81919575b1cbe1876cd1`. Il controllo successivo conferma
owner, accesso custom, una sola persona ammessa, zero ospiti e zero gruppi;
versione 0 e nessun URL live. Non dichiarare la PWA pubblicata.

[F] Snapshot della shell in `tmp/pwa-private-site/public`: 109 file,
7.282.973 byte, identici all'export verificato. La registrazione è conservata
in `tmp/pwa-private-site/.openai/hosting.json`; nessuna credenziale viene
salvata. Directory ignorata da Git/EAS, separata dalle aree Strategia.
Il binding R2 `AUDIO` è soltanto predisposto: storage, import e adapter di
delivery non sono ancora implementati/provisionati/verificati.

[F] Il catalogo rimane read-only sul Mac: 37 file, 2.657.446.897 byte;
17 file superano 25 MiB e il maggiore misura 345.312.044 byte. Non inserirlo
negli asset statici o nel repository del sito. Nessun audio è stato caricato.

[F] Il preflight e i 12 test HTTP locali passano nuovamente. Sono prove con
richieste simulate, non ascolti nel browser o test di hosting.

[U] I comandi locali non risolvono `git.chatgpt-team.site` né
`learn.chatgpt.com` (`curl` exit 6). Le chiamate del connettore funzionano,
ma non sostituiscono il trasferimento sorgente obbligatorio del workflow
Sites. Nessun commit, push, versione, upload audio o deployment eseguito.
Riprendere solo con accesso rete consentito per il server sorgente e per
l'origin privato; non aggirare il sandbox. Il runbook è in `docs/PWA.md`.

[U] Runtime, delivery, accesso da iPhone, installazione e ascolto restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

Fonti: [Sites](https://learn.chatgpt.com/docs/sites),
[Pricing](https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost),
[Sandboxing](https://learn.chatgpt.com/docs/sandboxing).

## D-057 - PWA consumer complementare, shell leggera e audio on-demand

Data: 5 settembre 2026
Stato: implementata localmente; gate runtime iPhone e pubblicazione aperti

[F] Su richiesta esplicita dell'utente viene introdotta una PWA come superficie
consumer complementare. Non sostituisce l'app nativa e non modifica i gate
nativi per background, lock screen, Bluetooth, batteria o qualità sonora su
telefono reale.

[F] La PWA usa la radice Router separata `src/app-pwa` e lo stesso linguaggio
consumer-paper. Include Home, Yoga, Soundscapes, i sei outcome, sessioni
adattive, player, Settings e Legal; esclude Workbench QA, Audio Test, preset
tecnico e route legacy. Il confine `AudioProvider` riceve una factory driver e
il driver Web riceve un resolver sorgenti: l'export PWA non trascina più i tre
WAV ATP01 attraverso il grafo degli import.

[F] L'artefatto non incorpora WAV, FLAC o `public/audio-catalog/`. Predispone
45 route player: 37 opere approvate che richiedono una delivery same-origin
non ancora pubblicata e otto generatori runtime. La PWA rifiuta stem e opere
ATP01 incorporate; `Soft Air`, `Moon Drone`, `Deep River`, Eclipse Veil e
Stillwater Halo restano fuori dalla sua superficie.

[F] L'audio di produzione è consentito soltanto dal contratto esplicito
same-origin `/audio-catalog/` in secure context. Il service worker precachea un
fallback minimo, usa network-first per risorse non audio visitate e bypassa
audio, WAV, FLAC e richieste Range. La PWA è predisposta all'installazione;
riapertura offline completa e disponibilità offline dei suoni non vengono
dichiarate.

[F] `web:pwa` serve direttamente l'export con un singolo processo Node su
loopback, senza Metro, symlink o compilazioni. Le URL pulite puntano alle
pagine esportate; i 37 audio autorizzati dal manifest sono letti dalla
posizione originale con GET/HEAD/Range 206 e MIME espliciti. Il comando
`Avvia PWA.command` usa il runtime già installato e rende l'avvio eseguibile
dal Finder. Un link `file://` a `index.html` non è un avvio valido della PWA.
`export:web:pwa` produce la shell statica e
`pwa:validate` controlla confini, manifest, icone, hash, route, assenza audio e
dimensioni.

[F] Su Web il primo Play resta un gesto esplicito. I deck futuri confermano
Play prima di essere messi in pausa e l'attesa complessiva è limitata a 10
secondi: un browser che non conferma fallisce chiuso, ferma i deck e libera la
coda dei comandi invece di lasciare l'interfaccia bloccata.

[F] L'export consolidato contiene 109 file per 7.282.973 byte, 67 route
statiche totali e 45 player predisposti. Il validatore conferma zero WAV/FLAC,
catalogo, Audio Test o Workbench nell'artefatto.

[U] Il server locale non può essere avviato dentro la sandbox corrente perché
il bind TCP è negato con `EPERM`; il comportamento runtime resta `NON
DETERMINATO — EVIDENZA INSUFFICIENTE`. Il preflight locale e 12 prove del
gestore HTTP sono verdi, inclusi HEAD e intervalli iniziali/finali dei 37
file; non viene dichiarato un ascolto reale da richieste simulate. HTTPS,
clean-URL rewrite sul futuro host pubblico, delivery dei
2,6 GiB, installazione, riapertura offline completa e ascolto su iPhone
richiedono un gate separato.

[F] Nessun deploy, account, upload, EAS, commit, push o pubblicazione è
autorizzato da questa decisione.

## D-056 - Nirvana Waves eliminato dal catalogo dell'app

Data: 4 settembre 2026
Stato: decisione umana applicata e verificata localmente; non committata

[F] L'utente ha ordinato di eliminare anche `Nirvana Waves`, pubblicato
nell'app come `Stillwater Halo`. Questa decisione supera D-044 e ogni
successiva disponibilità dell'opera; non viene inferita una motivazione diversa
dall'ordine esplicito ricevuto.

[F] Sono rimossi il record `stillwater-halo`, l'assetKey `nirvanaWaves001`, la
route generata, la copia WAV della Review localhost da 48.960.044 byte e la
copia FLAC del sidecar QA Android da 26.858.497 byte. La preview locale contiene
ora 37 file per 2.657.446.897 byte; il catalogo contiene 48 entità, 40
file-backed, 37 approvate, 47 riproducibili nella Review, 33 transition-ready,
14 single-only e una respinta.

[F] Il master canonico esterno, i derivati di archivio e
`docs/M4_LOSSLESS_DERIVATIVE_REPORT.json` restano intatti come prova storica;
non descrivono disponibilità nell'app e non autorizzano la reintroduzione.

[F] `Stillwater Halo → Quiet Field` era l'unica coppia musicale autorizzata.
Dopo la rimozione non resta alcuna coppia musicale consumer: `Music + nature`
è visibile ma disabilitato come `IN PRODUCTION`, le richieste musicali falliscono
chiuse e le vecchie sessioni salvate non vengono convertite silenziosamente.
Le sessioni naturali restano operative; nessun nuovo abbinamento è inventato.

[F] Con Node 22.23.1 sono verdi formattazione, lint, TypeScript, 39 suite / 185
test, regressione audio 55/55, validatori audio/asset/config/sicurezza/QA ed
export Web. Gli export iOS e Android correnti non contengono stringhe
Nirvana/Stillwater e includono esattamente i tre WAV ATP01 per 155.520.132
byte; misurano rispettivamente 162.490.591 e 163.646.202 byte. Il sidecar QA
Android locale contiene ora 37 FLAC per 1.635.181.380 byte.

[U] Build native/cloud e prova su telefono restano `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`; non sono state autorizzate né eseguite. Expo Doctor passa 18/20
controlli: i due controlli remoti non sono determinabili perché la sandbox non
può raggiungere `exp.host`.

## D-055 - Eclypsis escluso dal catalogo dopo il test d'ascolto

Data: 4 settembre 2026
Stato: decisione umana applicata e verificata localmente; non committata

[F] L'utente ha respinto `Eclypsis` / `Eclipse Veil` perché il risultato è
percepito come troppo dissonante e ne ha ordinato l'eliminazione dal catalogo
dell'app. D-055 supera le precedenti decisioni che lo indicavano disponibile o
approvato.

[F] Sono rimossi il record `eclipse-veil`, l'assetKey `eclypsis001`, il mapping
nativo, le relazioni Continuum, la route generata dal catalogo e il FLAC starter
incorporato da 28.167.925 byte. Il pacchetto consumer non contiene più FLAC
starter; gli export mobili devono contenere soltanto i tre WAV ATP01 per
155.520.132 byte.

[F] Il master canonico esterno e i derivati di archivio non vengono cancellati,
rinominati o modificati. `docs/M4_LOSSLESS_DERIVATIVE_REPORT.json` resta prova
storica della conversione lossless e non descrive la disponibilità corrente.

[F] Al momento di D-055 la sola relazione musicale ancora autorizzata era
Stillwater Halo → Quiet Field. D-056 ha poi eliminato Nirvana Waves / Stillwater
Halo e azzerato le coppie musicali consumer; nessun sostituto è stato inventato.

[F] Con Node 22.23.1 sono verdi formattazione, lint, TypeScript, 39 suite / 184
test, regressione audio 55/55, validatori audio/asset/config/sicurezza/QA e gli
export Web. I nuovi export iOS e Android contengono esattamente tre WAV ATP01,
nessun FLAC e misurano rispettivamente 162.490.586 e 163.646.167 byte.

[U] Un nuovo archivio EAS e una build installabile non sono stati generati:
restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al gate separatamente
autorizzato. Expo Doctor passa 18/20 controlli; i due controlli remoti non sono
eseguibili con la rete sandbox disabilitata.

## D-054 - Correzione del caricamento FLAC nella Review iPhone

Data: 4 settembre 2026
Stato: patch locale verificata; nuova prova iPhone richiesta

[F] La prova iPhone ha raggiunto la sessione Meditation 20 minuti con Eclipse
Veil e Night Shore, ma Play ha mostrato `Session source 0 could not be
decoded.` Il source index 0 del piano e Eclipse Veil. L'errore precedente non
leggeva pero `HTMLMediaElement.error`: chiamava impropriamente "decode" ogni
evento media, inclusi rete, abort e formato non supportato.

[F] Eclipse Veil e integro: 28.167.925 byte, FLAC 24-bit/48 kHz/stereo,
8.295.000 frame; SHA-256 e decode completo via HTTP coincidono con le prove
registrate. HEAD e Range rispondono 200/206. Il server dichiarava invece
`audio/x-flac` insieme a `nosniff`; RFC 9639 registra `audio/flac` e marca
`audio/x-flac` come alias deprecato.

[F] Metro ora forza `Content-Type: audio/flac` per ogni risposta FLAC, inclusi
asset Metro e catalogo pubblico, conservando byte range e file invariati. Il
player adattivo non precarica piu tutte le sorgenti future: prepara soltanto le
sorgenti attive e al massimo la prossima in ordine temporale, mantenendo non
piu di tre elementi media allocati nella partenza musica+natura. Gli errori
riportano ora titolo, corsia, indice e codice `MediaError` reale.

[F] Dopo il riavvio, Eclipse Veil e Night Shore rispondono entrambi come
`audio/flac`; Range 0-63 risponde 206. La sessione musica piu onde ha raggiunto
Playing nel browser interno e il timer e avanzato. Config validator, lint,
TypeScript e Jest sono verdi: 39 suite, 183 test.

[U] Il risultato sul browser iPhone resta `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`. D-055 ha poi escluso Eclipse dal prodotto per ragioni d'ascolto,
quindi non è richiesto un fallback consumer; nessun fallback lossy viene
assunto.

## D-053 - Anteprima consumer iPhone su LAN privata, senza pacchetto audio

Data: 4 settembre 2026
Stato: implementata localmente; prova iPhone aperta

[F] `localhost` aperto sull'iPhone indica il telefono stesso e non il Mac. Il
nuovo comando `web:iphone` individua quindi l'IPv4 privata dell'interfaccia di
rete predefinita e avvia una modalità LAN consumer separata. Il gate applicativo
accetta soltanto l'host esatto comunicato dal launcher, in development e nel
solo spazio IPv4 privato; IP pubblico, hostname, produzione e tunnel falliscono
chiusi. Il launcher forza inoltre `APP_RELAX_SURFACE=consumer`, anche se la shell
avesse conservato una vecchia variabile QA. I comandi ordinari `web` e `web:qa`
restano vincolati a loopback.

[F] Non viene creato un artifact da 2,6 GiB né copiato il catalogo: Expo serve
dal Mac soltanto i file richiesti dal browser, e il server supporta le richieste
HTTP Range necessarie a caricamento e seek. Gli export mobili continuano a
usare `public-mobile`; nessun file del catalogo entra in Git, EAS o build.

[F] La route consumer caricata dalla LAN non tenta autoplay dopo la
navigazione: mostra `IPHONE PREVIEW · TAP PLAY TO BEGIN` e attende il gesto
diretto richiesto dai browser iOS. La superficie QA/Workbench non viene esposta
da questo comando.

[F] Dal browser interno Codex, usando l'indirizzo LAN e non localhost, la Home
consumer e la route Relax musica+natura si sono caricate. Il tap Play ha portato
il controllo a Pause e fatto avanzare il timer; Stop ha ripristinato 20:00. La
singola opera Open Tide ha superato lo stesso ciclo Play/Pause/Stop. Una
richiesta parziale a un FLAC Rain ha restituito `206 Partial Content`,
`Accept-Ranges: bytes` e il range esatto richiesto. Un riavvio di prova con
`APP_RELAX_SURFACE=qa` nella shell ha comunque servito la Home consumer.

[F] Expo `--lan` lega il server a tutte le interfacce locali: l'exact-host è un
gate della logica di playback, non un'autenticazione né una ACL degli asset.
Durante l'esecuzione i file pubblici possono quindi essere richiesti anche
tramite un altro indirizzo locale del Mac.

[F] Dopo la richiesta esplicita dell'utente, lo stesso launcher supporta una
modalità `--review`: forza la radice QA, la cartella pubblica locale e apre
direttamente `/qa-workbench`. La Review conserva anche le route consumer e usa
lo stesso `ConsumerPlaybackSurface`, aggiungendo catalogo completo, ascolto
singolo, A/B, sessione e scrubber. Non modifica EAS né gli export.

[F] Audit di consegna LAN: tutti i 38 file del manifest locale hanno risposto
con HEAD `200`, Range `206`, MIME e byte coerenti, per 2.706.406.941 byte. Anche
Eclipse Veil, Moon Drone e Deep River incorporati rispondono correttamente. Gli
otto noise sono generatori runtime. Soft Air è l'unica voce intenzionalmente
bloccata dopo il rifiuto d'ascolto: il suo WAV tecnico esiste, ma non è un path
consumer rotto.

[F] Nella radice Review effettivamente servita su LAN, il browser interno ha
raggiunto lo stato Playing sia con Open Tide, FLAC naturale da 26.805.900 byte,
sia con Aquarian Echo, WAV musicale da 345.312.044 byte e file piu grande del
manifest. Timer e posizione file sono avanzati; l'audio di prova e stato poi
fermato. Il launcher imposta inoltre `BROWSER=none`, cosi non apre Chrome in
parallelo alla Review richiesta nel browser interno.

[F] Un audit ffprobe 8.1.2 su 38/38 file non ha trovato container o codec
anomali: i 14 WAV sono RIFF/WAVE PCM standard 24-bit/48 kHz/stereo; i 24 FLAC
sono lossless 24-bit/48 kHz/stereo; durate e frame coincidono. I soli outlier
operativi sono nove WAV fra 124 e 329 MiB. La dimensione puo aumentare latenza,
banda e costo di seek su mobile, ma non dimostra da sola il difetto riferito.

[U] Compatibilità effettiva di ogni FLAC, seek, decoder simultanei e crossfade
su Safari/Chrome iOS resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino alla
prova sul dispositivo. Durante l'esecuzione il catalogo è raggiungibile dagli
altri dispositivi della stessa rete: usare soltanto una Wi-Fi fidata e spegnere
il server dopo il test.

## D-052 - Il catalogo localhost e separato dagli export mobili

Data: 3 settembre 2026
Stato: difesa locale implementata e verificata; archivio EAS non eseguito

[F] Expo SDK 57 copia ricorsivamente la cartella pubblica anche durante un
export iOS o Android. Una prova dal checkout reale con il comando grezzo ha
quindi incluso i 38 file di `public/audio-catalog/` per 2.706.406.941 byte,
nonostante non fossero asset Metro. `.easignore` protegge l'archivio sorgente
EAS, ma non governa questo passaggio locale.

[F] Gli script export consumer impostano ora
`EXPO_PUBLIC_FOLDER=public-mobile`, una radice pubblica separata e vuota. Il
server QA localhost continua invece a usare `public/`, quindi tutte le opere
restano ascoltabili nel Workbench senza entrare nel pacchetto mobile. I tre
profili EAS fissano la stessa variabile e `.easignore` conserva l'esclusione
esplicita come seconda difesa.

[F] Il validatore degli export legge `metadata.json`, confronta SHA-256,
estensione e dimensione dei soli tre WAV ATP01 e del FLAC starter, scansiona
l'intero output e fallisce su `audio-catalog`, WAV/FLAC pubblici non processati,
file oltre 100 MiB o output oltre 512 MiB. Le prove pulite misurano iOS
190.634.511 byte e Android 191.790.133 byte; gli audio autorizzati sono
183.688.057 byte su entrambe le piattaforme.

[U] Nessun archivio sorgente EAS reale e stato generato o caricato. Il suo
contenuto resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino a un gate EAS
separatamente autorizzato.

## D-051 - Il Workbench mostra il player consumer e l'intero catalogo

Data: 3 settembre 2026
Stato: implementato localmente dopo feedback utente; approvazione e commit aperti

[F] Il Workbench non usa piu una shell scura separata come rappresentazione
del prodotto. `ConsumerPlaybackSurface` e condiviso dai player single-track,
adattivo e QA: l'utente vede artwork, gerarchia, timer, Play/Pause/Stop e volume
della stessa superficie consumer, mentre i controlli tecnici restano sotto o
accanto in una cornice development-only.

[F] Il catalogo QA elenca 50 entita. Quarantanove sono riproducibili
singolarmente sul localhost; `Soft Air` resta visibile ma bloccato per il
precedente rifiuto all'ascolto. Trentanove file approvati dispongono di profilo
Continuum e sono selezionabili direttamente come A/B. Noise e ATP01
provvisori restano single-only e non vengono promossi artificialmente a
transizioni.

[F] La selezione A/B compila un piano QA esatto a due sorgenti soltanto dopo il
superamento delle regole di compatibilita esistenti e della fattibilita
temporale: `READY` compare soltanto se un safe exit dell'uscente entra nella
durata QA scelta. Una coppia incompatibile o troppo lunga per quella finestra
fallisce chiusa con le ragioni leggibili. I comandi `OPEN A/B FILE + SCRUB`
aprono inoltre ciascuna sorgente completa nello stesso player consumer,
preservando la coppia quando si torna alla transizione. Il planner consumer
deterministico non viene modificato.

[F] Il difetto dello scrubber dipendeva da `locationX`, assente nel click DOM
ricevuto da React Native Web. Il controllo usa ora coordinate normalizzate,
supporta click e drag, carica il piano prima del primo seek e disattiva
l'eventuale finestra di audition. I controlli accessibili consentono anche
salti di dieci secondi. Una seconda barra nella modalita single-track controlla
la posizione reale dentro ciascuno dei 41 file riproducibili; gli otto noise
runtime sono generatori continui e non fingono una posizione file. Il driver
Web e il dual-deck condividono la stessa conferma: ogni sorgente attiva deve
emettere `seeked` e trovarsi entro 20 ms dal punto richiesto prima che Play o il
seek siano dichiarati riusciti. All'avvio dentro un overlap, entrambi i deck
vengono preparati e verificati prima di invocare qualunque Play; se uno fallisce
mentre l'altro e ancora pendente, il sistema attende il suo esito, mantiene
tutto silenzioso e pulisce entrambi. Timeout, posizione diversa o errore
falliscono chiusi, fermano il driver e riportano lo scrubber al punto
precedente, quindi la UI non anticipa piu la posizione sonora effettiva.

[F] Cambio modalita, installazione del piano e Play sono serializzati e
cancellabili. Il Workbench ferma la sorgente precedente prima di cambiare cio
che mostra; mantiene inoltre piani separati per sessione completa e coppia
diretta. Lo stato Play/Pause/Stop viene riferito soltanto all'opera o al piano
realmente caricato. Il cambio modalita azzera sempre l'indice di transizione e
gli errori assorbiti dal controller vengono verificati prima di mostrare un
messaggio `Playing`.

[F] La disponibilita completa fallisce chiusa fuori da Web, fuori da localhost
o in `NODE_ENV=production`; gli script `web` e `web:qa` usano inoltre
`--localhost`, impedendo al server dei 2,6 GiB di legarsi alla LAN. Anche il
player consumer single-track rifiuta i file `local-preview-file` fuori da
questo perimetro. Dopo un cambio modalita volume e mute restano
visibili ma disabilitati fino al caricamento del programma mostrato, impedendo
che modifichino una sorgente precedente nascosta.

[F] Il catalogo esterno completo e il dual-deck sono disponibili soltanto nel
Workbench Web localhost. La radice QA puo rappresentare il contratto su una
development build, ma blocca e dichiara indisponibile quel playback su native:
non finge che 2,6 GiB di asset siano incorporati o gia scaricati.

[F] La prova nella scheda interna Codex ha avviato Open Tide nello stesso
player consumer, spostato il file con click e drag fino a 01:56/02:28,
verificato i salti di dieci secondi e fermato l'audio al cambio modalita. La
coppia Open Tide → Tidal Breath e stata portata a 09:40, esattamente all'inizio
del crossfade, avviata soltanto dopo la conferma delle sorgenti, ascoltata oltre
la fine del cambio a 09:52 e poi messa in pausa. Un secondo test ha spostato la
sessione direttamente da 00:00 a 10:00 tramite click sulla barra prima di
riportarla a 09:40. La console browser non ha registrato errori o avvisi. Questa
e prova del percorso Web locale; non certifica precisione nativa del seek,
decoder simultanei o crossfade su dispositivo.

[U] Qualita musicale delle coppie, comportamento nativo e approvazione finale
della nuova superficie restano gate umani separati. La revisione non e ancora
committata; push, EAS e build non sono autorizzati.

## D-042 - Patch SDK 57 e correzione decode-uri-component

Data: 2 settembre 2026
Stato: verificato localmente

[F] `expo install --check` ha richiesto le patch correnti della stessa baseline
SDK 57: Expo 57.0.19, Expo Router 57.0.18 e React Native 0.86.3, con i relativi
moduli Expo e preset di test. L'aggiornamento non cambia SDK o architettura.
Peer check, Expo install check, Expo Doctor 20/20, lint, TypeScript, test ed
export Metro Android/iOS sono verdi.

[F] Il refresh audit ha rilevato GHSA-vcc3-ghjq-m6fr nella dipendenza transitiva
`decode-uri-component` 0.2.2 via `query-string`/Expo Router. La versione corretta
è 0.5.0; un override pnpm riproducibile la applica senza cambiare API dell'app.
Fonti primarie: [GitHub Advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr),
[release 0.5.0](https://github.com/SamVerschueren/decode-uri-component/releases/tag/v0.5.0).

[F] L'audit policy passa con i soli due advisory `image-size` già accettati e
vincolati dal validator degli asset. Nessun nuovo residuo è stato allowlistato.

## D-041 - Noise Colours come sorgenti consumer autonome

Data: 2 settembre 2026
Stato: implementato localmente; ascolto reale aperto

[F] Su richiesta esplicita dell'utente, il catalogo aggiunge otto generatori
runtime: White, Pink, Brown/Red, Blue/Azure, Violet/Purple, Grey/Gray, Green e
Black. Gli alias non duplicano sorgenti. Ogni programma riproduce un solo buffer in
loop attraverso lo stesso controller consumer: nessun layering, mixer o nuovo
file audio.

[F] White/Pink/Brown/Blue/Violet sono profili spettrali tecnici; Grey, Green e
Black sono etichettati come profili non standard. Black è definito
editorialmente come profilo profondo con intervalli quieti lenti, non come uno
standard universale. Stop e Mute restano i controlli del silenzio.

[F] Ogni buffer stereo Float32 48 kHz viene creato una sola volta al load, non
nel callback audio: 384.000 frame / 8 secondi, sample peak 0,5, crossfade di
confine e gain interno -6 dB. Il costo audio nel pacchetto è zero; il buffer
temporaneo vale circa 3,1 MB includendo i due canali.

[U] True peak inter-sample, raccordo percepito, qualità, fatica d'ascolto,
background e stabilità restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino
al test su telefono Android reale. L'emulatore non è un gate d'ascolto valido.

## D-040 - Commit locale M3/M4 autorizzato

Data: 2 settembre 2026
Stato: autorizzato dall'utente

[F] L'utente ha richiesto esplicitamente `Commit`. L'autorizzazione comprende
un commit locale delle modifiche M3/M4 presenti e verificate nel worktree.

[F] L'autorizzazione non comprende push, pull request, EAS, build cloud,
pubblicazione, Git LFS o asset delivery. `output/strategia-app-audio/`,
`tmp/strategia-app-audio/` e gli screenshot ignorati in `dist/` restano esclusi.

## D-039 - M4: catalogo consumer autonomo e lossless

Data: 1 settembre 2026
Stato: implementato localmente; runtime e listening gate aperti

[F] L'autorizzazione M4 supera il limite M3 sui nuovi asset soltanto per il pack
`APP_READY_AUDIO_01`. Le 18 registrazioni sono entità autonome; le vecchie
coppie pad/piano sono varianti editoriali separate e non possono essere
sommate. `Moon Current`, `deep-sleep-432` e il mixer restano confinati nel test
tecnico.

[F] Il modello `ConsumerAudioWork` e il programma `SingleTrackProgram` sono
separati dal contratto fisso a tre stem. Il player consumer usa un solo file,
timer, trasporto e volume principale; il gain interno porta ciascuna proposta
verso -18 LUFS mantenendo il true peak post-gain sotto -1 dBTP.

[F] I master restano WAV esterni. I derivati app sono FLAC lossless stereo
PCM24/48 kHz level 8. Il PCM decodificato dei 18 file è hash-identico al WAV;
il totale scende da 2.563.271.952 a 1.455.254.377 byte (-43,2267%).

[F] Un solo FLAC da 28.167.925 byte entra nello starter; gli altri derivati
restano esterni. Quattro lavori sono quindi referenziabili localmente: Eclipse
Veil e i tre ATP01 riusati. Yoga e Massage restano disabilitati perché nessun
asset delle rispettive proposte è incorporato.

[F] Il flusso outcome rispetta il massimo di due tocchi: il primo apre la lista
filtrata, che ordina il primo asset incorporato in testa; il secondo avvia quel
featured nel player dopo il completamento del load. La navigazione diretta da
Soundscapes e le opere non featured non attivano autoplay.

[F] Gli export Metro Android e iOS contengono ciascuno esattamente tre WAV ATP01
e lo starter FLAC, 183.688.057 byte audio totali, con hash attesi. Prettier,
lint, TypeScript, test, regressione audio, validatori asset/config e verifica
PCM sono verdi.

[F] Per il gate visivo sono disponibili quattro render statici ad alta
risoluzione in `dist/m4-screenshots/`: Home, outcome Relax filtrato,
Soundscapes e player. Usano copy, font, palette e artwork correnti e sono stati
ispezionati visivamente; non dimostrano esecuzione runtime né playback.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: decoder/loop FLAC a runtime,
qualità, titoli e mapping fino a test Android e approvazione d'ascolto; screenshot
M4 finché la sandbox non consente un renderer; due controlli Expo Doctor e il
refresh dell'audit dipendenze finché manca rete. Git LFS o asset delivery
richiedono autorizzazione separata; non è stato configurato alcun workaround.

## D-001 - Milestone singola

Data: 10 agosto 2026
Stato: superata da D-020 per autorizzazione esplicita dell'utente

[F] Il brief originario definiva la vertical slice placeholder e il gate `AUDIO TEST PACK 01`. D-020 registra la successiva autorizzazione esplicita a integrare i tre WAV reali; il limite a un preset e tre file resta invariato.

## D-002 - Expo SDK 57 come baseline

Data: 10 agosto 2026
Stato: accettata; sostituisce la precedente ipotesi SDK 56

[F] Su decisione esplicita dell'utente, si mantiene Expo SDK 57 salvo blocker tecnico dimostrato. I metadata ufficiali correnti associano SDK 57 a React Native 0.86, React 19.2.3, Node 22.13.x, iOS 16.4+, Xcode 26.4+ e Android API 36. Il progetto usa Expo 57.0.12 e RN 0.86.2, allineati al template ufficiale corrente.

[F] I gate locali eseguiti con Node 24.14.0 sono verdi. Il target riproducibile e Node 22.23.1, presente nelle immagini EAS SDK 57 e registrato nei file di versione.

[F] La build EAS Android `FINISHED` dimostra la compilazione di RNAA 0.13.2 con RN 0.86.2 per le quattro ABI previste. L'emulatore API 34 ha inoltre dimostrato bundle Metro, cache dei tre stem, Ready e almeno un avvio AAudio sul percorso streaming. [U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: affidabilita Play sul bundle finale, comportamento su telefono e compatibilita iOS fino a una build autorizzata. Il package RNAA usa peer aperti ma la sua matrice pubblica arriva a RN 0.85; questa assenza non e da sola un blocker dimostrato.

Fonti primarie: [tabella versioni Expo](https://docs.expo.dev/versions/latest/), [metadata SDK Expo](https://github.com/expo/expo/blob/main/docs/ui/components/SDKTables/sdk-versions.json), [template SDK 57](https://github.com/expo/expo/blob/sdk-57/templates/expo-template-default/package.json), [compatibilita RNAA](https://docs.swmansion.com/react-native-audio-api/docs/other/compatibility/), [package RNAA 0.13.2](https://github.com/software-mansion/react-native-audio-api/blob/0.13.2/packages/react-native-audio-api/package.json).

## D-003 - Motore audio primario

Data: 10 agosto 2026
Stato: implementazione streaming verificata staticamente; runtime emulatore parziale

[F] `react-native-audio-api` 0.13.2 offre AudioContext, buffer source, oscillator, gain, stereo panner, decoding, session management, playback notifications e config Expo per background. E il motore primario dietro `AudioGraphDriver`.

[F] Il precedente percorso full-buffer con tre WAV da 180 secondi ha riprodotto un `OutOfMemoryError` Android. E stato sostituito da download su file locale e tre file source incrementali distinti, instradati tramite media-element prima dello start per evitare il bypass del gain. La versione RNAA resta fissata a 0.13.2 e l'adapter ha un contract test dedicato. [U] Memoria, stabilita e qualita su telefono reale restano aperte.

## D-004 - Sintesi e peer worklets

Data: 10 agosto 2026
Stato: accettata

Il binaural usa due oscillator node pannati; il brown noise usa un buffer generato a runtime e loopato. `react-native-worklets` 0.10.1 e installato per soddisfare il peer dichiarato da RNAA ed e coerente con SDK 57; non viene implementato un worklet DSP custom in questa slice.

## D-005 - Parametri Deep Sleep 432

Data: 10 agosto 2026
Stato: decisione tecnica iniziale, rivedibile dopo ascolto

- `tuningLabel`: `432 Hz`.
- `carrierHz`: 180 Hz.
- `beatHz`: 3.5 Hz.
- Durate: 15, 30, 60 minuti.
- Fade-in: 8 secondi; fade-out: 12 secondi.

Questi valori sono design sonoro e metadati, non indicazioni terapeutiche. `432 Hz` non viene usato per derivare carrier o beat.

## D-006 - Stato persistito

Data: 10 agosto 2026
Stato: accettata

Si salvano versione schema, ultimo preset, durata, gain e mute. L'idratazione precede il load; non si salva lo stato nativo ne si attiva autoplay.

## D-007 - Background audio

Data: 10 agosto 2026
Stato: configurato, validazione device aperta

[F] Il prebuild isolato ha generato `UIBackgroundModes=audio`, permessi Android e foreground service `mediaPlayback`. Il driver pianifica fade e stop dei nodi sul clock audio, gestisce permesso notification, nasconde sempre i controlli best-effort, conserva l'osservazione durante interruzioni e rilascia/riacquisisce il focus nelle pause manuali.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: stabilita reale, lock-screen, notifica immediatamente rimossa con JS sospeso, Bluetooth e sessioni lunghe fino ai test su telefoni.

## D-008 - Superfici esterne

Data: 10 agosto 2026
Stato: accettata

- Zoom: nessuna superficie applicabile; il prodotto non e meeting, video, event delivery, Phone o Contact Center.
- OpenAI API: fuori scope; nessuna feature AI richiesta.
- GitHub: repository canonica `https://github.com/robertfultonstudio/App-Relax`; `origin` configurato localmente dopo verifica read-only. Nessun push o PR senza autorizzazione.
- Plugin management: nessuna installazione aggiuntiva necessaria.
- DOCX/PDF: non richiesti; la documentazione resta Markdown versionata.

## D-009 - Lavoro parallelo

Data: 10 agosto 2026
Stato: accettata

[F] `output/` e `tmp/` contengono artefatti paralleli comparsi dopo l'audit iniziale, inclusi strategia e render PDF non appartenenti alla vertical slice. Non sono stati modificati o assorbiti; le directory complete sono escluse da staging e upload EAS.

## D-010 - Repository canonica

Data: 10 agosto 2026
Stato: accettata

[F] Owner GitHub `robertfultonstudio`; repository pubblica `App-Relax`, branch predefinito `main`, vuota al controllo read-only. Il remote `origin` punta a `https://github.com/robertfultonstudio/App-Relax.git`. La milestone e preparata sul branch locale `codex/deep-sleep-432-mvp`; il commit locale e autorizzato, mentre push e PR restano non autorizzati.

## D-011 - EAS cloud al posto della toolchain locale

Data: 10 agosto 2026
Stato: Android completata; iOS esclusa

[F] EAS Build e un servizio hosted che produce binari Android e iOS senza toolchain native locali. I profili sono separati: Android usa `ubuntu-26.04-jdk-17-ndk-r27b-sdk-57`; iOS usa `macos-tahoe-26.5-xcode-26.6`; entrambi Node 22.23.1. Il primo gate Android e stato completato; iOS resta separato e non autorizzato.

[F] `.easignore` prevale su `.gitignore` durante la preparazione dell'upload. Il file replica le esclusioni essenziali e rimuove dall'archivio `.git`, dipendenze, output nativi/generati, credenziali locali, documentazione, test e i flussi paralleli `output/`/`tmp/`. Il validator config rende obbligatorie le regole di sicurezza critiche.

[F] Il piano EAS Free corrente include una quantita limitata di build a bassa priorita. La CLI ha verificato sull'organizzazione `robert-fulton-studio` quota Android `0/15`, quota totale `0/30`, nessun add-on, overage e costo stimato pari a zero prima della build. Dopo l'unica build autorizzata la quota e `1/15` Android e `1/30` totale, con overage e costo ancora pari a zero.

Fonti primarie: [EAS Build](https://docs.expo.dev/build/), [infrastruttura EAS](https://docs.expo.dev/build-reference/infrastructure/), [regole `.easignore`](https://docs.expo.dev/build-reference/easignore/), [piani EAS](https://docs.expo.dev/billing/plans/), [pricing Expo](https://expo.dev/pricing).

## D-012 - Account Apple, costi e hardware

Data: 10 agosto 2026
Stato: accettata

[F] Una development build EAS installata su iPhone richiede un abbonamento attivo all'Apple Developer Program, firma e registrazione device. La distribuzione App Store richiede il programma Apple; la quota ufficiale e 99 USD/anno o equivalente locale, salvo esenzioni. Nessun acquisto, login Apple o registrazione dispositivo e autorizzato ora. Il solo login Expo necessario al gate Android e autorizzato.

[F] Un telefono reale e necessario per il gate audio, ma non serve acquistare un nuovo Mac. La disponibilita di iPhone/Android dell'utente e `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

Fonti primarie: [setup development build iOS](https://docs.expo.dev/get-started/set-up-your-environment/?device=physical&mode=development-build&platform=ios), [ruoli Apple per EAS](https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/), [membership Apple](https://developer.apple.com/support/compare-memberships/).

## D-013 - Identificativi e project linking

Data: 10 agosto 2026
Stato: collegato e verificato

[F] `com.robertfultonstudio.apprelax` e sintatticamente valido e condiviso tra iOS/Android. [U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: disponibilita negli account Apple/Google per la distribuzione store. Il progetto EAS e `@robert-fulton-studio/app-relax`, owner `robert-fulton-studio`, project ID `e1d77255-66f4-45c1-b1fa-c503a088b30f`; `eas project:info` ha confermato entrambi dopo il linking.

## D-014 - Evidenze locali

Data: 10 agosto 2026
Stato: verificata

[F] Install frozen e peer check verdi; lint e typecheck verdi; 9 suite/37 test verdi (subset audio 26/26); placeholder, Test Pack, asset safety e project config verdi; Expo Doctor 20/20; export Hermes iOS/Android completati; prebuild isolato config plugin completato. La successiva EAS Android ha compilato con successo il progetto e le librerie native; l'accettazione runtime resta separata e richiede un telefono reale.

## D-015 - Audit dipendenze e asset non fidati

Data: 10 agosto 2026
Stato: mitigato con residuo upstream accettato per i gate locali

[F] Gli advisory moderati di `joi` e `uuid` sono stati risolti nel lockfile con override a `joi` 17.13.4 e `uuid` 11.1.1. Config validator, prebuild isolato e gate Expo devono restare verdi per coprire la compatibilita degli override.

[F] `metro` 0.84.4 dipende da `image-size` 1.2.1. L'audit segnala due DoS high per parser ICNS e JXL/HEIF. Al controllo corrente il registry npm pubblica al massimo 2.0.2 e gli advisory GitHub dichiarano nessuna versione corretta, quindi non esiste un upgrade risolutivo pubblicato.

[F] Il prodotto non accetta immagini remote o upload utente. `assets:validate-safety` esclude ICNS, JXL, HEIF, HEIC e AVIF nell'intero sorgente, sia per estensione sia per signature binaria; `security:audit` fallisce per qualsiasi advisory diverso dai due residui esatti o se modulo/versione cambiano.

[U] Residuo: `pnpm audit --audit-level high` termina con exit 1 finche l'advisory upstream resta aperto. La policy locale termina verde con `PASS WITH ACCEPTED RESIDUALS`; va rieseguita immediatamente prima di ogni upload EAS e l'allowlist va rimossa appena Expo/Metro espone una dipendenza corretta.

Fonti primarie: [ICNS DoS](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [JXL/HEIF DoS](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), [package npm image-size](https://www.npmjs.com/package/image-size).

## D-016 - Sblocco operativo Android

Data: 10 agosto 2026
Stato: autorizzato entro confini espliciti

[F] Dopo l'elenco puntuale dei gate residui, l'utente ha autorizzato lo sblocco operativo. Il perimetro copre staging e commit locali della milestone, login Expo sicuro via browser, creazione o collegamento del progetto EAS, upload del solo archivio validato e una build Android `development-android` entro la quota Free.

[F] Restano esclusi: push o PR GitHub, build iOS, login Apple, registrazione dispositivi, submission store, pubblicazione, acquisti e upgrade di piano. Un prompt che richieda un costo o una scelta di account non dimostrabile interrompe il gate.

## D-017 - Account Expo e organizzazione

Data: 10 agosto 2026
Stato: creati e verificati

[F] Su autorizzazione esplicita dell'utente e stato completato l'onboarding Expo tramite l'account Google indicato dall'utente. Sono stati creati il profilo personale `robertfultonstudio`, l'organizzazione commerciale `Robert Fulton Studio` con slug `robert-fulton-studio` e il progetto `App Relax` con slug `app-relax`. Non sono stati invitati membri, caricati avatar, aggiunti metodi di pagamento o attivati piani a pagamento.

[F] La CLI `eas whoami` conferma il ruolo Owner su profilo e organizzazione. Nessuna password, token o credenziale e stata letta, stampata o aggiunta al repository.

## D-018 - Archivio EAS senza Git metadata

Data: 10 agosto 2026
Stato: mitigazione verificata sull'archivio locale

[F] `eas build:inspect --stage archive` con `cli.requireCommit: true` ha reintrodotto un repository `.git` shallow nonostante la regola `/.git/` in `.easignore`. Il relativo `.git/config` conteneva un remote `file://` con il path locale del workspace. Non conteneva credenziali, ma la divulgazione del path e inutile.

[F] Il comportamento corrisponde a un bug aperto nel repository ufficiale `expo/eas-cli`: le varianti `.git`, `.git/**` e `/.git/**` non rimuovono i metadata nel flusso osservato. Anche `requireCommit: false` da solo non e stato sufficiente. La mitigazione verificata e `EAS_NO_VCS=1` insieme a `requireCommit: false`, con worktree pulita, commit e hash controllati esplicitamente prima della build; `.easignore` resta il confine dell'upload.

[F] L'ispezione no-VCS finale ha prodotto 49 file per 6.143.075 byte, manifest SHA-256 `4c8769a5608b328a45c0ac55be4e8a84a6d835769dc8149866366843cbef8fd4`: nessun `.git`, path locale, segreto, symlink, docs, test, tooling o flusso parallelo; presenti esattamente i tre WAV placeholder e tutti i file essenziali di build. `scripts/validate-eas-archive.mjs` rende ripetibile il controllo.

Fonte primaria: [issue Expo EAS CLI #2875](https://github.com/expo/eas-cli/issues/2875), [documentazione `.easignore`](https://docs.expo.dev/build-reference/easignore/).

## D-019 - Prima build Android EAS

Data: 10 agosto 2026
Stato: completata e verificata; smoke test fisico aperto

[F] L'unica build cloud autorizzata, profilo `development-android`, e terminata `FINISHED`: ID `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7`, Expo SDK 57.0.0, app 1.0.0 (1), fingerprint `0d061b3ea48ae2044f80a75a232326e3cf6eee7b`, completata il 10 agosto 2026 alle 21:00:58 UTC. La coda Free e durata circa 68 minuti e la build circa 24 minuti. Nessun retry, iOS, submit o upgrade e stato avviato.

[F] L'APK scaricato misura 299.803.135 byte e ha SHA-256 `d54a5333b40574baeb6560879a743ad1722619df6f6c676669e62bf7feff4ae7`. `unzip -t` e verde; sono presenti `AndroidManifest.xml`, otto DEX e librerie per `arm64-v8a`, `armeabi-v7a`, `x86` e `x86_64`. Lo scan mirato non rileva path locali, traversal, file credenziali o token evidenti. Il file e in `dist/eas/`, ignorato da Git.

[F] Il completamento della build dimostra che RNAA 0.13.2 e il config plugin compilano con Expo 57 / RN 0.86.2 su Android. L'APK e stato installato su emulatore API 34 x86_64 e ha caricato il bundle e gli asset correnti via Metro. [U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: affidabilita playback, background, lock-screen, Bluetooth, interruzioni, latenza, batteria e qualita fino allo smoke test su telefono reale.

Evidenza primaria: [build EAS Android](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7).

## Attivita aperte

- Riverificare `security:audit` e rimuovere l'allowlist `image-size` non appena esiste una release corretta.
- Installare la development build su un telefono Android gia disponibile e svolgere lo smoke test.
- Autorizzare EAS iOS solo con programma Apple e iPhone disponibili.
- Misurare headroom, memoria e loop dopo il gate `AUDIO TEST PACK 01`.
- Confermare bundle identifier e naming commerciale prima della distribuzione.
- Ottenere revisione legale/store prima del rilascio pubblico.

## D-020 - Integrazione AUDIO TEST PACK 01

Data: 10 agosto 2026
Stato: integrato localmente; ascolto e runtime device aperti

[F] L'utente ha fornito e autorizzato per l'uso nell'app esattamente tre WAV: drone A=432, ambience river e texture air. L'istruzione esplicita sblocca la loro validazione e integrazione locale nonostante lo smoke test placeholder non fosse ancora documentato; non autorizza una nuova build cloud, pubblicazione o ulteriori asset.

[F] I tre file sono PCM WAV stereo 24 bit / 48 kHz, lunghi esattamente 180 secondi. La validazione non rileva clipping, campioni non finiti, DC problematico, silenzi anomali o raccordi superiori ai transienti interni. Hash, metriche e punti di loop sono registrati in `assets/audio/test-pack-01/manifest.json` e verificati da `pnpm audio:validate-test-pack`.

[F] `Deep Sleep 432` usa ora tre chiavi reali distinte. I placeholder non sono piu referenziati e vengono esclusi dagli archivi EAS. Binaural beat e brown noise restano generati a runtime e non sono incorporati negli stem.

[F] Lint, typecheck, 9 suite/37 test, subset audio 26/26, validatori audio/config/asset safety, audit dipendenze con residui accettati ed Expo Doctor 20/20 sono verdi. Gli export Metro locali iOS e Android contengono esattamente i tre WAV reali con SHA-256 identici al manifest e nessun placeholder audio.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: startup e memoria su hardware ARM, loop percepito, bilanciamento, speaker, cuffie/Bluetooth e background fino al test su telefono.

## D-021 - Smoke Android emulatore e confine di prova

Data: 11 agosto 2026
Stato: ascolto base emulatore completato; qualita device aperta

[F] Su autorizzazione esplicita sono stati installati Platform Tools 37.0.1, Emulator 37.1.11, una system image API 34 x86_64 e l'AVD `AppRelax_API_34_x86_64`. L'APK EAS esistente e stato installato e ha caricato da Metro il bundle corrente e i tre WAV reali. Home -> Sleep -> player, copy corrente, cache di esattamente tre WAV, SHA-256 attesi, Ready e timer 15 minuti sono stati verificati.

[F] Dopo la sostituzione del full decode, un'esecuzione ha raggiunto Play con AAudio attivo senza riprodurre l'OOM; RSS osservato circa 602-605 MB in Ready e 631-695 MB in Play. Il blocco UI successivo era nel setup asincrono della notifica Android, accessorio al graph: rendendolo best-effort e non bloccante, il rerun ha mostrato `RITUAL IN PROGRESS`, timer in decremento e AAudio stereo 48 kHz. Un test impedisce che una notifica pendente blocchi di nuovo l'avvio udibile.

[F] L'utente ha confermato di sentire il suono dagli altoparlanti interni del Mac e ha segnalato molti glitch. La diagnosi live ha mantenuto AAudio `started`, frame e potenza HAL continui, zero underrun mixer/track e nessun errore RNAA o decoder. CoreAudio ha invece chiuso e riaperto `AppleHDAEngineOutput` due volte durante Play, con gap di circa 22 ms e 11 ms. Il difetto osservato e quindi localizzato dopo l'HAL Android, nel ponte QEMU -> CoreAudio; il trigger preciso delle riaperture resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: presenza dei glitch su hardware ARM, navigazione mixer completa, gain, pausa/stop, lifecycle e tutte le proprieta audio reali. Emulator, Metro e server ADB sono stati spenti a fine test. Il gate di prodotto resta un telefono Android reale; l'emulatore non certifica speaker, cuffie/Bluetooth, background/lock-screen, interruzioni, latenza, batteria o qualita.

## D-022 - Preview Android standalone e link condivisibile

Data: 11 agosto 2026
Stato: build e smoke autonomo completati; telefono reale aperto

[F] Su autorizzazione esplicita e stata eseguita una sola build EAS `preview-android`, senza development client, retry, iOS o submit. La build `c3a39414-d156-4373-810a-0011296b51f8` e terminata `FINISHED` alle `2026-08-11T19:56:53.613Z`: Expo SDK 57.0.0, app 1.0.0 (1), fingerprint `92f6d62d3eb36db3d9eef3db223d6552c86af6f6`. La coda Free e durata circa 87 minuti e la compilazione circa 28 minuti.

[F] L'APK misura 289.861.086 byte e ha SHA-256 `47a6603108f6aee3464f6a63ae00f0b0fdb287d375a391d1a9210043e6b0a2a6`. `unzip -t` e verde; contiene 1.328 entry, `assets/index.android.bundle` da 3.216.244 byte, quattro DEX e 27 librerie per ciascuna ABI `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`. I tre WAV incorporati hanno esattamente gli SHA-256 del Test Pack. Nessun placeholder, traversal, path locale, filename credenziale o pattern segreto mirato e stato rilevato.

[F] Dopo installazione con dati app puliti su emulatore API 34, Metro e porta 8081 sono rimasti spenti. La preview ha mostrato Home, player `READY WHEN YOU ARE`, `RITUAL IN PROGRESS`, timer 28:55 e Pause; AAudio ha completato `requestStart`. App, emulatore e ADB sono stati spenti. APK e screenshot sono in `dist/eas/`, ignorati da Git; lo screenshot ha SHA-256 `3b1852e346ce7cfbc9121b925e03f239959bf4e4bd441f2384fae6f4d8948b7a`.

[F] Il piano resta Free: Android `2/15`, iOS `0/15`, totale `2/30`, overage 0, nessun add-on e costo totale stimato 0 centesimi. Nessun commit, push, PR, pubblicazione store o spesa e stato eseguito in questo gate.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: installazione sul telefono dell'amico, glitch su hardware ARM, speaker/cuffie/Bluetooth, background/lock-screen, interruzioni, latenza, batteria, memoria e qualita. Questi punti richiedono lo smoke su telefono reale.

Evidenza primaria: [build EAS Android preview](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/c3a39414-d156-4373-810a-0011296b51f8).

## D-023 - M2 Quiet by Design e registro dei quattro rituali

Data: 12 agosto 2026
Stato: implementazione locale; visual gate aperto

[F] M2 separa contenuto editoriale e temi dal motore audio. I quattro rituali
sono `Moon Current`, `Quiet Tide`, `Cedar Light` e `Aquarian Sky`; soltanto il
primo ha `audioPresetId` e usa l'identificativo tecnico `deep-sleep-432`.

[F] Le tre card `IN PRODUCTION` sono disabilitate e non caricano il player. La
Home non usa onboarding o catalogo; il player non espone Hz nella vista
principale e mantiene mixer e dettagli tecnici facoltativi, separati e chiusi.

[F] AudioEngine, AudioSessionController, timer, fade, persistenza, `carrierHz` e
`beatHz` non sono stati modificati. `beatHz` è documentato come differenza tra i
due toni stereo, non come frequenza cerebrale. Nessun nuovo audio è stato
integrato.

[F] Quattro immagini originali `stylized-concept` sono state generate senza
reference image, ispezionate e normalizzate a JPEG 1080x1440 sotto 1,2 MB. Gli
hash sono registrati in `assets/images/rituals/manifest.json`. Il sistema usa
Newsreader e Manrope locali e rispetta Reduce Motion.

[U] Chiarezza entro cinque secondi e preferenza estetica restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al concept test. Retention, WTP
ed efficacia percepita richiedono invece prove di prodotto/mercato successive e
non sono misurate dal concept test M2.

## D-024 - Evidenza del precedente test Android reale

Data: 12 agosto 2026
Stato: confine di prova registrato

[F] L'utente ha dichiarato che il precedente APK è stato installato e avviato su
un telefono Android reale e che Play ha prodotto suono. Questa evidenza chiude
soltanto installazione, launch e Play del vecchio APK.

[U] Modello telefono, versione OS, Bluetooth, background, lock-screen,
interruzioni, latenza, batteria, sessione lunga, seam, bilanciamento e qualità
restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Il nuovo APK M2 richiederà un
nuovo smoke strutturato.

## D-025 - Gate EAS M2

Data: 12 agosto 2026
Stato: autorizzazione condizionata, non ancora eseguita

[F] Il piano autorizza una sola nuova EAS `preview-android`, ma soltanto dopo
gate locali verdi, screenshot runtime approvati dall'utente, quota Free
riverificata e assenza di costi. Nessuna build iOS, submission, pubblicazione,
push o PR è inclusa.

## D-026 - M3 Product Shell e confine Audio Test

Data: 15 agosto 2026
Stato: implementazione locale; visual gate aperto

[F] L'istruzione M3 sostituisce operativamente il percorso consumer M2 senza
trasformare il Test Pack in contenuto pubblicato. La navigazione primaria usa i
tab `RITUALS`, `YOGA` e `SOUNDSCAPES`; tutte le card consumer sono
`IN PRODUCTION`, disabilitate e prive di `audioPresetId` o asset audio.

[F] Yoga espone soltanto strutture future da 20/30/45/60 minuti. Soundscapes
predispone opere autonome, `Elemental Worlds`, field recording,
`Cosmic / Zen ambient` ed `Esoteric Series`. Queste entità sono famiglie
editoriali e formati pianificati, non sessioni o registrazioni disponibili.

[F] `Moon Current`, `deep-sleep-432`, i tre WAV ATP01, binaural, brown noise e
mixer multilayer appartengono esclusivamente a `AUDIO TEST / TEST ONLY`, fuori
dai tab consumer e raggiungibile da Settings. Il motore, timer, fade,
persistenza e regressioni audio restano preservati.

[F] M3 non autorizza EAS, commit, push, PR, pubblicazione, backend, login,
billing, analytics o nuovo audio. La task si arresta agli screenshot runtime e
alla richiesta di approvazione umana.

## D-027 - Identità cosmica e differenziazione da Anima

Data: 15 agosto 2026
Stato: direzione vincolante accettata

[F] La differenziazione da Anima riguarda esclusivamente linguaggio e gerarchie
di interfaccia; non richiede l'abbandono dell'immaginario cosmico o new age.
M3 combina, in modo direzionale, circa 60% impressionismo/pastello meditativo e
40% cosmic new age raffinato.

[F] Sono parte dell'identità: cieli pittorici, campi stellari rarefatti,
nebulose ad acquerello, luce lunare, aurora, polvere d'oro discreta, blu
minerale, lavanda, rosa polvere e giada. `Aquarian Sky`, Cosmic/Zen Ambient,
Esoteric Series ed Elemental Worlds restano famiglie editoriali future.

[F] Restano vietate imitazioni riconoscibili di sfere o pianeti neri luminosi,
waveform/neuro-grafiche protagoniste, gerarchie frequency-first, mandala,
chakra, Buddha e torii. Il cosmo è ammesso come tema originale, mai come
supporto a claim medici, scientifici o pseudoscientifici.

## D-028 - Functionality e time-to-sound prima del catalogo

Data: 15 agosto 2026
Stato: direzione vincolante implementata localmente

[F] Functionality and time-to-sound first; evocative naming is secondary
metadata. La Home M3 mette in ordine Yoga, Massage, Relax, Meditation, Sleep e
Focus e mostra prima la funzione, poi la CTA, quindi durata/formato e solo dopo
il titolo evocativo futuro.

[F] Il caso guida Yoga espone `Start your yoga session` in apertura e prepara
formati 20/30/45/60 minuti. Le altre CTA sono `Set the room for massage`,
`Relax now`, `Begin meditation`, `Prepare for sleep` e `Focus`.

[F] In M3 tutte le sei azioni restano `IN PRODUCTION`, disabilitate e prive di
preset, asset audio e route player. L'architettura predispone un futuro avvio in
uno o due tap senza promettere contenuto oggi inesistente. Cosmic, Aquarian ed
Elemental restano naming e famiglie editoriali successive alla funzione.

## D-029 - Sei artwork outcome originali M3

Data: 15 agosto 2026
Stato: asset finali presenti; provenance e hash verificati

[F] Yoga, Massage, Relax, Meditation, Sleep e Focus hanno ciascuno un artwork
quadrato originale creato espressamente per App Relax con OpenAI image
generation built-in. Cinque asset restano text-only; Yoga v2 deriva da un unico
edit del precedente sorgente Yoga originale del progetto, senza reference
esterne. I PNG sorgente 1254×1254 sono stati convertiti in JPEG 720×720 qualità 80. File, byte e SHA-256 sono registrati in
`docs/M3_OUTCOME_ARTWORK_PROVENANCE.md`.

[F] La direzione comune è contemporary minimal Japanese impressionism:
pigmento minerale nihonga, sumi libero, gouache asciutta, washi tattile,
asimmetria e `ma`, combinati con refined cosmic new age dove coerente con la
funzione. La differenziazione da Anima resta limitata al linguaggio e alla
gerarchia dell'interfaccia; non elimina l'immaginario cosmico.

[F] Restano vietati torii, pagode, kanji, mandala, chakra, Buddha,
sfere/pianeti neri luminosi, neon, waveform, neuro-grafiche, gerarchie
frequency-first e claim medici, terapeutici, scientifici o pseudoscientifici.
Functionality e time-to-sound restano primari: immagine e naming non precedono
funzione, CTA o durata/formato e non sbloccano audio/player consumer.

[U] `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: esclusività legale,
registrabilità e assenza di somiglianze sostanziali fino a una revisione IP/store
dedicata. Il fatto verificato è il processo documentato di generazione interna,
incluso l'edit Yoga v2 basato esclusivamente sul precedente sorgente originale
del progetto; non è una certificazione legale automatica.

## D-030 - Consumer paper shell e rifiuto del template wellness

Data: 15 agosto 2026
Stato: direzione visiva approvata; leggibilità raffinata in D-031

[F] L'utente ha approvato i sei artwork ma ha respinto il linguaggio UI
precedente perché card arrotondate, pillole, blob e barra scura rendevano la
shell riconoscibile come grafica generica. Questi primitivi non appartengono più
alla direzione consumer.

[F] La nuova shell `consumer-paper` usa carta washi calda, inchiostro ad alto
contrasto, composizioni asimmetriche, immagini editoriali, hairline e molto
`ma`. Le sezioni sono aperte: nessuna card-gabbia, pillola di stato o blob
decorativo. `IN PRODUCTION` resta una nota tipografica, non un bottone.

[F] `technical-dark` resta separata per Audio Test e player: il ridisegno non
trasforma ATP01 o il mixer in contenuto consumer. Funzione, CTA e formato
continuano a precedere artwork e naming evocativo.

[F] Il primo screenshot Android 1080×2400 del nuovo layout è stato approvato
dall'utente con `Design ok`. Nessuna EAS, commit, push o pubblicazione è stata
eseguita.

## D-031 - Leggibilità della microtipografia consumer

Data: 15 agosto 2026
Stato: implementata e verificata su Android Emulator

[F] Dopo l'approvazione della direzione visiva, l'utente ha richiesto scritte
piccole leggermente più intelligibili. La gerarchia e la composizione restano
invariate: micro-label, kicker, caption, note, formati e navigazione aumentano
di circa 1 px, con tracking ridotto e interlinea più comoda.

[F] Nessun testo della shell `consumer-paper` resta sotto 11 px. Gli stati
pressed di header, tab e Settings non riducono più l'opacità del testo: usano
un fondo carta più profondo e una traslazione di 1 px, mantenendo il contrasto.

[F] Prettier, lint, TypeScript e 15 suite / 59 test sono verdi. Lo screenshot
Android aggiornato è stato acquisito senza overlay; Audio Test, motore e asset
audio non sono stati modificati. Emulator, Metro e ADB sono stati spenti.

## D-032 - Promessa guida della Home

Data: 15 agosto 2026
Stato: implementata come copy editoriale provvisoria

[F] La Home usa `Choose your moment. Press start. Leave the phone behind.` come
promessa guida del flusso futuro: scegliere il bisogno, avviare rapidamente e
lasciare che il telefono torni in secondo piano.

[F] Non è una tagline commerciale finale né un claim legalmente validato. Per
non promettere funzionalità inesistenti in M3, una riga distinta dichiara subito
che le sessioni consumer sono ancora in produzione e senza audio disponibile.

## D-033 - Direzione visiva Yoga sole-luna

Data: 15 agosto 2026
Stato: approvato dall'utente

[F] L'artwork Yoga conserva campo avorio, palette pastello e materia washi ma
reinterpreta il gesto botanico come susuki stilizzato. Una grande luna avorio,
incompleta e decentrata, è bilanciata da una lavatura solare pesca/zafferano
minima. La simbologia resta implicita, senza testo o tecnicismi.

[F] L'asset deriva da una sola chiamata built-in di edit del precedente sorgente
Yoga originale del progetto. Il JPEG finale resta `yoga.jpg`, 720×720, 99.211
byte, SHA-256
`3c252aca78b72c510337b980d4cfda21352ec69229b04e7c780610aa99ffdb2f`;
gli altri cinque outcome, UI, navigazione e audio non cambiano.

[F] Sono assenti luna/pianeta nero, sequenze di fasi, astrologia, zodiaco, carte
celesti, Om, loto-logo, mandala, chakra, Buddha, torii, pagode, kanji, persone e
pose yoga.

[F] Evidenza runtime: `dist/m3-screenshots/02-yoga-consumer-paper.png`,
1080×2400, 583.172 byte, SHA-256
`45eebbc619a71c218476445e69dc7bca02890e69e2913b80a030e577feda6495`.

[F] Il 15 agosto 2026 l'utente ha approvato Yoga v2 rispondendo `ok` alla
richiesta esplicita di giudizio sullo screenshot. Nessun altro intervento
visivo, build o rilascio è implicato da questa approvazione.

## D-034 - Home a sei box funzionali equivalenti

Data: 15 agosto 2026
Stato: struttura preservata; visual revision riaperta in D-037

[F] L'utente ha rilevato che la Home full-width faceva apparire Yoga come il
contenuto dominante e che lo screenshot precedente non mostrava i nuovi
artwork. Ha confermato che la struttura a box era valida: il problema erano il
linguaggio visivo precedente e i nomi privi di funzione esplicita.

[F] La Home usa ora una griglia 2×3 con sei box dello stesso peso per Yoga,
Massage, Relax, Meditation, Sleep e Focus. Ogni box mostra il proprio artwork
finale e rispetta la gerarchia funzione → CTA → formato → titolo futuro. Nessun
box usa una variante hero; `Cedar Ascent`, `Quiet Tide`, `Soft Horizon`,
`Aquarian Sky`, `Night Garden` e `Cedar Light` restano metadati secondari.

[F] Tutti i box restano disabilitati e marcati `IN PRODUCTION`; non sono stati
aggiunti preset, audio o route player. La schermata Yoga separata, il motore e
gli altri cinque outcome non sono stati modificati.

[F] L'export web locale renderizza i sei controlli disabilitati e i sei artwork.
Le prove visive 390×844 sono
`dist/m3-screenshots/01-home-grid-painterly-background-approved-candidate.jpg`
e `dist/m3-screenshots/01-home-grid-painterly-background-cards-detail.jpg`,
ottenute senza Android Emulator. Non sostituiscono il futuro screenshot runtime
mobile.

## D-035 - Fondale pittorico Home-only

Data: 15 agosto 2026
Stato: asset preservato; resa corretta in D-037

[F] Su richiesta dell'utente la Home non usa più soltanto il gradiente carta:
un fondale originale text-only introduce washi avorio, pigmenti pastello
minerali, una luce lunare parziale, acqua/nebbia e vegetazione rada in uno stile
di impressionismo minimale giapponese contemporaneo.

[F] L'asset `assets/images/backgrounds/rituals-home-v1.jpg` è applicato tramite
una prop opzionale di `EditorialScreen`, usata soltanto dalla route Home. Yoga,
Soundscapes, Settings, Audio Test, navigazione e motore restano invariati.

[F] Una velatura carta graduata mantiene leggibile la testata; i sei box hanno
fondo carta al 90% e la nota finale al 92%. Il fondale è decorativo,
`accessible=false`, non intercetta azioni e non altera l'ordine TalkBack.

[F] Dimensioni, byte, SHA-256, prompt e confine di provenienza sono registrati
in `docs/M3_HOME_BACKGROUND_PROVENANCE.md`; il validatore richiede esattamente
un JPEG di sfondo registrato. Due screenshot web 390×844, uno iniziale e uno
scrollato sui box, documentano la resa senza Android Emulator. L'approvazione
estetica è stata ricevuta dall'utente con `bravo` il 15 agosto 2026.

## D-036 - Chiusura visual gate e autorizzazione del commit locale M3

Data: 15 agosto 2026
Stato: autorizzato dall'utente

[F] Dopo avere approvato la Home con il fondale pittorico, l'utente ha richiesto
esplicitamente `commit poi screenshot home page`. Questa istruzione autorizza
un solo commit locale della milestone M3 e un nuovo screenshot Home successivo
al commit.

[F] L'autorizzazione non comprende push, pull request, EAS, build cloud,
pubblicazione o deploy. Queste azioni restano gate distinti e richiedono una
nuova istruzione esplicita.

## D-037 - Correzione dimensionale e Home pittorica compatta

Data: 15 agosto 2026
Stato: implementata localmente; approvazione umana aperta

[F] Lo screenshot successivo al commit ha mostrato un difetto di layout reale,
non l'assenza degli asset: React Native Web manteneva le dimensioni intrinseche
dei JPEG. Nel viewport 390×844 il fondale risultava 864×1821 e ogni artwork alto
720 px; la prima tile raggiungeva circa 1.010 px. Restavano visibili soltanto la
zona pallida dello sfondo e frammenti delle immagini.

[F] `EditorialScreen` forza ora il fondale al 100% del viewport e riduce la
velatura inferiore. `OutcomeGridTile` usa un frame con rapporto esplicito e
immagine 100%×100%; la tile Yoga misurata via browser scende a circa 357 px e il
suo artwork a circa 131 px. La barra primaria scende da 68 a 52 px, mentre ogni
tab resta alta 48 px e supera il target minimo di 44 px.

[F] La Home conserva sei outcome equivalenti, CTA, formato, titolo futuro e
stato `IN PRODUCTION`; rimuove soltanto il kicker `RITUALS` duplicato. Audio,
navigazione, asset e route consumer non cambiano. La nuova prova web è
`dist/m3-screenshots/01-home-compact-painterly-revision.jpg`, 390×844, SHA-256
`c2bee77684f2bcd60dadfe5c9f74c87591d7ac4ca1a36344cc6d64dcb05b7da6`.

## D-038 - Spettro pastello funzionale nei sei outcome

Data: 15 agosto 2026
Stato: implementata localmente; approvazione umana aperta

[F] L'utente ha richiesto di rendere realmente percepibili i pastelli in tutte
le loro sfumature. I dati dei sei outcome contenevano già coppie `accent` e
`wash`, ma la Home le copriva con pannelli carta quasi bianchi.

[F] Ogni box usa ora una composizione rettangolare a quattro toni: testata
pastello pieno, corpo pastello chiaro opaco, hairline nella relativa tinta
`wash` e accento editoriale scuro per il titolo futuro. La sequenza è giada per
Yoga, pesca/rosa polvere per Massage, acqua marina per Relax, blu minerale per
Meditation, lavanda per Sleep e zafferano per Focus. Gli artwork restano
inalterati e non filtrati; non sono stati introdotti blob, pillole o gradienti
digitali.

[F] I test di tema verificano per tutti e sei i box contrasto almeno 4,5:1 di
testo e accenti sui relativi fondi. L'anteprima web 390×844 conserva griglia,
CTA, formati, stato bloccato e barra da 52 px. Le prove sono:

- `dist/m3-screenshots/01-home-pastel-spectrum-revision.jpg`, 52.684 byte,
  SHA-256 `b29875cc323a09ff2a88bb39b9238e87f556b96902a3956ab93d9f1d3d73ec6a`;
- `dist/m3-screenshots/01-home-pastel-spectrum-cards.jpg`, 51.070 byte,
  SHA-256 `109a82f28ae2556c21708492c48c21fa8150f421e37cd4100ba4eb9821ce7332`.

[F] Nessun audio, route player, asset, dipendenza o configurazione nativa è
stato modificato. Prettier, lint, TypeScript, 15 suite/62 test e regressione
audio 26/26 sono verdi; l'anteprima web non registra errori console.
L'approvazione estetica della nuova palette resta umana.

## D-039 - Anteprima locale sonora con driver Web Audio separato

Data: 2 settembre 2026
Stato: implementata e verificata localmente; commit aperto

[F] L'anteprima Expo Web usa `WebAudioDriver`, selezionato soltanto per la
piattaforma web e conforme allo stesso `AudioGraphDriver` del driver nativo.
Android e iOS continuano a usare `ReactNativeAudioDriver`; controller, UI,
catalogo, persistenza e contratti consumer non sono stati duplicati.

[F] Nel browser locale sono entrati in stato Play con timer in decremento:
Pink Noise generato a runtime, Deep River WAV, Eclipse Veil FLAC lossless e il
percorso tecnico Moon Current con i tre stem ATP01 più generatori. Per il
consumer sono stati verificati anche Pause/Resume, Stop e Mute/Unmute; il log
console non ha registrato errori durante il run.

[F] Il web è una superficie di anteprima locale, non sostituisce il prodotto
mobile. Le capability dichiarano correttamente assenti background playback,
notification controls e shared clock preciso. [U] Bluetooth, lock-screen,
interruzioni, latenza, batteria e qualità nativa restano `NON DETERMINATO —
EVIDENZA INSUFFICIENTE` fino al test su telefono reale.

## D-040 - Soft Air respinto nel consumer

Data: 2 settembre 2026
Stato: decisione umana applicata localmente; sostituzione aperta

[F] L'utente ha respinto Soft Air perché il materiale è percepito come una
ventola potente e ricorda l'interno di un aereo. La qualità consumer non è più
provvisoria: lo stato è `REJECTED — REPLACEMENT REQUIRED`.

[F] Soft Air è disabilitato in Home, outcome e Soundscapes e non può aprire il
player. La UI mostra `REPLACEMENT REQUIRED` e `REJECTED AFTER LISTENING`.
`SLEEP_TEXTURE_001.wav` non viene cancellato, rinominato o modificato: resta
necessario soltanto al preset tecnico ATP01 in `AUDIO TEST / TEST ONLY`.

[U] Nome, provenienza, spettro e master del sostituto sono `NON DETERMINATO —
EVIDENZA INSUFFICIENTE`; nessun nuovo asset è stato integrato.

## D-041 - Catalogo completo approvato nella preview localhost

Data: 3 settembre 2026
Stato: implementata e verificata localmente; mobile delivery aperta

[F] L'utente ha dichiarato positivo l'ascolto di tutti i file raccolti dalla
Strategia e ha richiesto che siano inseriti, ricatalogati e funzionanti nella
preview localhost. L'approvazione sonora copre i 15 lavori analogici di
`APP_READY_AUDIO_01` e i 24 lavori di
`APP_READY_AUDIO_02_ELEMENTAL_WATER_AIR`: 39 opere. Non riabilita Soft Air,
respinto separatamente in D-040, e non rende definitivi i working title.

[F] Il registro contiene ora 42 opere file-backed: 39 approvate, Moon Drone e
Deep River ancora tecniche/provvisorie, Soft Air respinto. Con otto generatori
noise il totale è 50 entità; ogni programma consumer resta rigorosamente
single-source. Calm viene esposto sotto Relax, le 23 opere Water sotto
Elemental Worlds e `Second Element: Air` sotto Esoteric Series.

[F] Per evitare un pacchetto nativo monolitico, 38 file sono copiati nella
cartella locale ignorata `public/audio-catalog/` e caricati soltanto on demand:
14 WAV invariati dal pack 01 e 24 FLAC invariati dal pack 02, per
2.706.406.941 byte. Eclipse Veil usa il FLAC starter già incorporato. Il
manifest tracciato fissa filename, byte size e SHA-256; il validatore ha
verificato tutti i file e vieta l'ingresso di `SLEEP_TEXTURE_001.wav`.

[F] Il collaudo browser ha aperto individualmente tutte le 39 route approvate:
ciascuna ha completato Play e mostrato Pause, senza alert o errori console. Un
primo ciclo rapido su Silver Canopy non ha osservato la transizione entro la
finestra breve; due prove isolate, inclusa quella finale con attesa maggiore,
sono passate. Non resta un fallimento riproducibile.

[I] Il localhost è la superficie corretta per questa fase di ascolto e
ricatalogazione, ma non è una strategia di distribuzione mobile. Incorporare
tutti i FLAC approvati richiederebbe circa 1.690.207.802 byte di solo audio;
Git LFS o asset delivery e una nuova build restano gate separati non
autorizzati. [U] Prestazioni, loop, background e qualità del percorso nativo
restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al test su telefono.

## D-042 - Patch transitiva xmldom

Data: 3 settembre 2026
Stato: risolta e verificata localmente

[F] Il gate finale ha rilevato GHSA-6gmq-8vp8-gcm6 nelle versioni transitive
`@xmldom/xmldom` 0.8.13 e 0.9.10, introdotte dagli strumenti plist/config di
Expo. L'advisory GitHub reviewed indica come release corrette 0.8.15 e 0.9.12.

[F] `pnpm-workspace.yaml` forza separatamente ciascun ramo alla propria patch
compatibile. Il lockfile e l'installazione locale sono stati aggiornati senza
installazioni globali; `security:audit`, Expo install check, TypeScript e i test
mirati catalogo/UI sono tornati verdi. Restano soltanto i due advisory
`image-size` già accettati e confinati dal validatore asset.

## D-043 - Meditation prima e priorità editoriale ai suoni marini

Data: 3 settembre 2026
Stato: decisione umana applicata localmente

[F] L'utente ha chiesto di portare Meditation in prima posizione e di dare più
risalto ai suoni di onde marine già approvati. Meditation è quindi il primo
outcome della Home e `Open Tide` è il suo lavoro featured nella preview
localhost.

[F] Seguono `Tidal Breath`, `Pearl Tide`, `Blue Interval`, `Moon Shore` e
`Night Shore`. `Eclipse Veil` rimane disponibile e invariato nel catalogo, ma
viene mostrato dopo il gruppo marino. Nessun file audio, gain, stato di ascolto
o mapping di collezione è stato modificato. Stato storico, superato da D-055.

## D-044 - Stillwater Halo chiude Cosmic / Zen Ambient

Data: 3 settembre 2026
Stato: decisione storica, superata da D-056

[F] L'utente ha chiesto di spostare `Stillwater Halo` in ultima posizione nella
sezione Soundscapes. L'opera chiude ora la propria raccolta
`Cosmic / Zen Ambient`; resta una traccia Relax approvata e non cambia file,
gain, disponibilità, route o catalogazione.

[F] D-056 ha successivamente eliminato l'opera dall'app mantenendo intatto il
master esterno di archivio.

## D-045 - Il catalogo localhost è escluso dall'archivio EAS

Data: 3 settembre 2026
Stato: hardening locale verificato prima del commit

[F] Il controllo pre-commit ha dimostrato che `expo export` copia anche
`public/audio-catalog/` nell'output locale quando i 38 file sono presenti sul
Mac. La tabella Metro continua a referenziare soltanto i tre WAV ATP01 e lo
starter FLAC, ma l'output completo non può essere descritto come limitato a
questi quattro file.

[F] `.easignore` esclude ora l'intera cartella `public/audio-catalog/`. I byte
locali restano disponibili per l'ascolto localhost ma non devono entrare
nell'archivio sorgente EAS; `validate-project-config.mjs` richiede la regola e
`validate-eas-archive.mjs` fallisce se trova la cartella. Il validatore riconosce
inoltre correttamente i quattro asset audio incorporati: tre WAV ATP01 e un
consumer starter FLAC.

## D-046 - Sessioni adattive: funzione, durata, Start

Data: 3 settembre 2026
Stato: decisione umana implementata localmente, gate QA aperto

[F] Le modalità consumer sono `Sound only` e `Guided`. La scelta primaria resta
bisogno/attività → durata → Start; Customize è facoltativo e chiuso. La voce
compare soltanto dopo la scelta Guided.

[F] Non esistono registrazioni vocali autorizzate. Guided e la scelta voce
restano `IN PRODUCTION`; non vengono sintetizzate voci e il CTA non può
avviare una sessione Guided fittizia.

[F] Le durate strutturali sono 10/20/30/45/60/90 minuti, ma ogni outcome espone
soltanto il proprio subset sensato. `Play your last session` riusa l'ultima
richiesta avviata con successo con un nuovo seed; il replay identico resta una funzione
del solo Workbench.

## D-047 - Continuum è un sequencer deterministico e fail-closed

Data: 3 settembre 2026
Stato: contratto e implementazione locale QA

[F] Continuum costruisce Arrival → Flow → Deepening → Return in frame interi a
48 kHz. Il seed rende il piano riproducibile; opere e famiglie non si ripetono
nella stessa sessione e le tre sessioni recenti alimentano una finestra di
esclusione.

[F] Ogni passaggio deve superare contemporaneamente gruppo editoriale,
famiglia armonica, classe di transizione, delta energetico, densità, presenza
melodica e boundary di ingresso/uscita. Se non esiste una sequenza compatibile,
il planner restituisce un errore esplicito e non ripiega su accoppiamenti
casuali.

[I] I metadata Continuum correnti derivano dal catalogo e, in alcuni casi, dal
filename; sono quindi marcati `PROVISIONAL — CATALOG AND FILENAME INFERENCE`.
L'approvazione d'ascolto delle opere singole non prova la qualità dei passaggi.
Il planner consumer li esclude per default; soltanto il QA locale può abilitarli
esplicitamente. Arrival, Flow, Deepening e Return applicano anche regole di
energia, densità e presenza melodica proprie della fase.

[F] Il default ambient è un crossfade equal-power di 12 secondi. L'overlap è
limitato a uscente ed entrante; il limite peak usa il massimo matematico
dell'intera curva, non un campione al punto medio, ed è compensato con trim
statico per un limite calcolato di -1,1 dBTP. Nessun limiter o modifica ai
master. L'ID del piano deriva da input e timeline completi, così varianti di
curva, disponibilità o storia non collidono.

[U] La precisione reale delle transizioni, due decoder FLAC simultanei, seek,
preload, background e comportamento su device restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino a un'implementazione nativa e a
prove su telefono.

## D-048 - Offline è un contratto senza delivery inventata

Data: 3 settembre 2026
Stato: fondazione locale, sorgente remota assente

[F] Il manifest offline non contiene URL. Il primo pacchetto logico Water
registra 12 opere e 177.645.113 byte, con revisione, object key, dimensione e
SHA-256. Lo stato copre queued, downloading, verifying, available, removing e
failed; spazio, retry, rimozione e recovery da interruzione sono separati dagli
adapter di storage e source.

[F] Il contratto non accetta buffer generici: la sorgente scrive in uno staging
streaming, ogni asset viene verificato e l'intero tentativo viene promosso o
annullato. `available` viene riconfermato interrogando byte e SHA-256 reali; una
revisione catalogo diversa o un file mancante/corrotto degrada in modo
fail-closed. Le operazioni sullo stesso pacchetto sono serializzate.

[F] `public/audio-catalog/` rimane una sorgente di ascolto read-only su
localhost. I suoi 2.706.406.941 byte non entrano in Git o EAS e non vengono
presentati come pacchetto scaricato.

[U] CDN/backend, autenticità del manifest remoto, range/resume, adapter nativo
che implementi staging/promozione atomica, lease durante playback e SHA-256
incrementale su iOS/Android non esistono ancora:
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## D-049 - Il QA Workbench usa una radice Router separata

Data: 3 settembre 2026
Stato: confine locale verificabile

[F] La configurazione predefinita usa `src/app`; la superficie QA esiste in
`src/app-qa` ed è selezionata soltanto con `APP_RELAX_SURFACE=qa`. Il Workbench
non ha link in Home, tab o Settings e porta il sentinel
`AUDIO QA WORKBENCH · DEVELOPMENT ONLY`.

[F] `.easignore` esclude fisicamente `src/app-qa/` e `src/qa/`, inclusa la
persistenza del draft QA. Il development
client può ricevere la radice QA dal Metro locale, mentre la configurazione
destinata all'archivio EAS predefinito resta consumer. Un validatore esegue
entrambe le configurazioni e
scansiona le route consumer. Un secondo validatore confronta gli export Web:
sentinel, route e chiave di storage devono essere assenti dal consumer e
presenti nel solo artifact QA.

[F] Il Workbench espone seed, timeline, scrubber, passaggio
precedente/successivo, loop ±30/60 secondi, outgoing/incoming/both, A/B di
durata/curva, metriche e audit accelerato. Nessuno di questi termini viene
mostrato nel percorso consumer.

## D-050 - M5 supera il gate visivo e resta aperta all'ascolto

Data: 3 settembre 2026
Stato: gate repository/non nativo e screenshot approvati, ascolto aperto

[F] Tutti i controlli M5 sono stati eseguiti con Node 22.23.1 e pnpm 11.16.0:
formattazione, lint, TypeScript, 33 suite / 131 test, regressione audio 44/44,
validatori audio/asset/config/security/QA, Expo Doctor 20/20 ed Expo install
check sono verdi. Il residuo sicurezza resta limitato ai due advisory
`image-size` già accettati e vincolati dall'asset safety gate.

[F] Gli export da una copia temporanea priva di `public/audio-catalog/` sono
riusciti per iOS, Android, Web consumer e Web QA. I bundle nativi referenziano
soltanto tre WAV ATP01 e un FLAC starter; il Workbench e la sua chiave di
persistenza sono assenti dall'export consumer e presenti solo nell'artifact QA.

[U] Un nuovo archivio sorgente EAS non è stato generato. Il relativo validatore
è predisposto e `.easignore` è verificato staticamente, ma gli export isolati
non costituiscono prova dell'archivio prodotto da `eas build:inspect`. Questo
gate resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE` perché EAS non è
autorizzato nella milestone.

[F] Nel browser loopback la sequenza Home → Meditation → 20 min → Sound only →
Start ha raggiunto lo stato Play con Open Tide e timer attivo. Pause ha
mantenuto il tempo stabile e Play ha ripreso. Il Workbench ha prodotto lo
stesso piano dal seed e l'audit accelerato ha verificato durata esatta, nessun
gap, massimo due sorgenti e sette intervalli esatti. Cinque screenshot 390×844
sono stati salvati in `dist/m5-screenshots/`; i server sono stati spenti.

[F] Il 3 settembre 2026 l'utente ha approvato esplicitamente i cinque
screenshot M5. Questa decisione chiude il gate visivo ma non costituisce
approvazione d'ascolto, autorizzazione al commit o prova nativa.

[F] In un ordine successivo l'utente ha autorizzato esplicitamente un solo
commit locale M5. Push, EAS, build e pubblicazione restano azioni separate e
non autorizzate.

[U] Questa prova non certifica precisione sample-accurate nativa, due decoder
FLAC su telefono, background, lock-screen, Bluetooth, batteria o qualità
musicale delle transizioni. Tali aspetti restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Nessun EAS, push o pubblicazione è
autorizzato o eseguito.

## D-052 - Le opere erano presenti ma nascoste dal percorso consumer M5

Data: 3 settembre 2026
Stato: correzione locale verificata, non committata

[F] Il confronto dei due manifest approvati con il registro e i file locali ha
confermato zero omissioni: 15 opere analogiche e 24 Water/Air approvate
all'ascolto sono tutte registrate e disponibili; i tre ATP01 portano le opere
file-backed a 42 e gli otto generatori portano il catalogo a 50 entita. I file
aggiuntivi presenti nei pacchetti sono master, derivati e seam preview degli
stessi lavori. Materiale esterno non manifestato non viene promosso a catalogo.

[F] La regressione era di navigazione: M5 aveva sostituito gli elenchi delle
route outcome con il solo setup adattivo e Home mostrava sei titoli
aspirazionali non presenti nel registro. Il setup durata -> Start resta la
prima azione; sotto compare ora `OR CHOOSE ONE SOUND` con l'intera selezione
pubblica pertinente. Home mostra come featured reali Open Tide, Quiet Field,
Mineral Drift, Stillwater Halo, Moonlit Veil e Astral Thread.

[F] Soundscapes continua a esporre tutte le 50 entita una sola volta, ma porta
in apertura Sea, Rain e Stream. Questo rende immediatamente visibili le 24
opere naturali che prima iniziavano soltanto dopo 24 card Cosmic, Standalone e
Noise. Soft Air resta visibile ma disabilitata; nessuno stato di ascolto o
disponibilita e stato falsificato.

[I] Il riscontro utente che i suoni naturali "reggono" giustifica la priorita
editoriale corrente. Non prova decoder, transizioni, background o qualita su
telefono reale: tali gate rimangono `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## D-053 - Musica più una famiglia naturale sotto controllo dell'utente

Data: 4 settembre 2026
Stato: decisione utente implementata nella preview Web, non committata

[F] L'utente ha richiesto per la sessione musicale la scelta esplicita tra
`Ocean waves` e `Rain`, oltre a un volume ambiente indipendente. Il volume
principale resta separato; l'ambiente espone 0–100% e mute/unmute con target
accessibili, senza mostrare dB, stem o controlli da DAW.

[F] La famiglia naturale si sceglie prima dello Start e viene conservata
nell'ultima sessione. Durante l'ascolto resta regolabile il suo volume separato;
un cambio di famiglia non interrompe o rigenera di nascosto una sessione in
corso.

[F] Questa e un'eccezione stretta al divieto di mixer consumer: il programma ha
una corsia musica e una sola corsia natura scelta dall'utente. Ogni corsia usa
una sola opera fuori dal proprio crossfade; i cambi delle due corsie sono
sfalsati e il piano non supera tre sorgenti simultanee. Non esiste selezione o
somma arbitraria di più layer.

[F] Dopo l'ascolto dell'utente, la durata predefinita dei passaggi musicali
approvati e 180 secondi equal-power. La corsia natura usa cambi altrettanto
lenti e resta nella famiglia selezionata, alternando due registrazioni Sea
oppure due registrazioni Rain. Le sole relazioni musicali abilitate sono
Eclipse Veil → Astral Thread, Celestial Current o Quiet Field e Stillwater Halo
→ Quiet Field; ogni altra coppia fallisce chiusa. Questo elenco è storico: D-055
rimuove Eclipse Veil e lascia attiva soltanto Stillwater Halo → Quiet Field.

[I] Il valore ambiente 100% indica il massimo bilanciamento disponibile entro
il margine di headroom del programma composito, non il guadagno raw unitario
sommato alla musica. Il bus principale e i due bus di corsia restano distinti.

[U] Precisione e stabilita con più decoder, carico CPU, glitch, background,
lock-screen e resa del bilanciamento su telefono reale restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`. La preview localhost non sostituisce
il driver nativo o il gate d'ascolto su device.
