# M6 — Product Design System & Consumer Experience Reconstruction

16 settembre 2026. Milestone di design subordinata a M5; distinta dal gate
integrato denominato M6 nel precedente ciclo D-115.

## Stato e confini

[F] Aggiornamento dopo «completa M6»: autenticazione Figma risolta, file creato
e sei proposte visuali disponibili. Stato aggiornato, limiti e piano componenti
in `M6_VISUAL_REVIEW.md`; le note di blocco autenticazione qui sotto descrivono
il momento dell'audit iniziale e non lo stato attuale.

[F] Audit Product Design della superficie PWA locale eseguito nel browser
integrato Codex, viewport 390×844, senza emulatore. Otto screenshot nuovi
salvati e ispezionati. Candidato: `dist/d115-final-pwa`, marker
`PLAYER-REVIEW.30-D115-LOCAL`; non equivale alla PWA online Sites39.

[F] Baseline Git `53b506b8bc65284dff4c66eb0c53d60893f83c40`, branch
`codex/quiet-by-design-m2`. Le 131 voci preesistenti del worktree sono state
preservate; index vuoto. Questa fase aggiunge solo il presente audit e note
in STATO/DECISIONS. Nessuna modifica UI, audio, dipendenza o pubblicazione.

[F] Gate Figma bloccato: due chiamate consecutive a `figma_whoami` hanno
restituito `isError: true` e «Authentication for Figma was requested and
accepted. Retry this tool call now.». Il secondo tentativo non ha restituito
un'identità autenticata. Nessun file Figma letto o creato.

[U] Il mandato impone di fermarsi qui: riferimenti ImageToCode, varianti
12ui, direzione approvata e piano di traduzione in componenti sono PENDENTI,
non completati. Nessuna generazione esterna, upload o costo avviato.
Documents/PDF non necessari: il registro Markdown è sufficiente.

## Audit del percorso, evidenze e priorità

Le valutazioni estetiche e le proposte sono [I], non risultati di usability
test con utenti. Le osservazioni dell'interfaccia sono [F].

### 1. Home — da affinare, struttura utile

[F] Sei attività, immagini esistenti, nessun titolo di brano nella Home;
ritorno alla sessione precedente e navigazione HOME/HATHA presenti.
[I] P2: sei fasce rettangolari quasi identiche comprimono la presenza pittorica;
l'alternanza delle immagini dà ritmo ma non basta a definire una composizione
editoriale. Il ritorno alla sessione compete con la scelta di una nuova attività.
Preservare immediatezza e arte, non introdurre nuove card generiche.

![Home attuale](/Users/RF/Documents/ChatGPT/New%20project/dist/m6-design-audit/01-home.png)

### 2. Attività, durata, Start — semplice ma gerarchia migliorabile

[F] Meditation si raggiunge dalla Home con un tap; Play avvia al secondo.
Timer facoltativo espandibile, durate 10/20/30/45/60/90, scelta ambiente separata.
[I] P2: scelta ambiente prima del Play e timer dopo il Play rendono l'ordine
diverso dal brief attività → CTA → durata → avvio. Le grandi superfici vuote
sotto i controlli non sono ancora una composizione intenzionale di ma.

![Attività](/Users/RF/Documents/ChatGPT/New%20project/dist/m6-design-audit/02-meditation.png)

![Durata e ambiente](/Users/RF/Documents/ChatGPT/New%20project/dist/m6-design-audit/03-duration-ambience.png)

### 3. Player, pausa e stop — controlli presenti, review invadente

[F] Play → Playing, Pause → Paused, Stop → Ready e tempo iniziale osservati.
Stop/Play sono ancorati al fondo. Barra tecnica più trasporto consumer occupano
circa 228 dei 844 px della viewport; nella schermata in pausa il volume ambiente
prosegue sotto questa zona. L'immagine e la tipografia restano consumer-paper.
[I] P1: il doppio trasporto e le due posizioni ripetute sottraggono spazio e
competono con le azioni urgenti. La review va preservata, ma con gerarchia
distinta; non va scambiata per la superficie consumer nativa.

![Player in riproduzione, zona review](/Users/RF/Documents/ChatGPT/New%20project/dist/m6-design-audit/04-active-player.png)

![Player in pausa](/Users/RF/Documents/ChatGPT/New%20project/dist/m6-design-audit/05-paused-player.png)

### 4. Rain/Ocean waves — chiarezza dello stato da correggere nel design

[F] Rain selezionata prima dell'avvio; volume/mute naturale distinti dal volume
principale. Un tentativo di cambio a Ocean seguito immediatamente da Pause
ha lasciato Rain selezionata; in pausa la UI mostra «Stop to change the
ambience» e tutte le scelte disabilitate. In Hatha avviato con Off le scelte
naturali risultano disabilitate durante Playing.
[I] P1: disponibilità condizionale e messaggio generico non spiegano chiaramente
quando il cambio live è possibile. Il design deve distinguere caricamento,
cambio consentito, transazione pendente e azione non disponibile.
[U] Questa sequenza non dimostra un guasto del motore o del cambio live:
concorrenza cambio/pausa e comportamento su telefono richiedono test dedicati.
Riferimenti visivi: screenshot 03 e 05.

### 5. Hatha completo — distinto e raggiungibile

[F] Tab HATHA, durata 30/45/60/90, natura opzionale, Start e accesso al player
di sviluppo presenti. Il piano 30 minuti espone quattro opere e tre giunzioni.
[I] P2: CTA consumer e accesso di sviluppo hanno entrambe forte peso visivo;
la modalità review dovrebbe essere inequivocabile senza duplicare l'avvio.
Buona separazione tra pratica completa e ascolto Yoga semplice.

![Hatha](/Users/RF/Documents/ChatGPT/New%20project/dist/m6-design-audit/06-hatha.png)

### 6. Workbench nella PWA privata — preciso nei marker, troppo testuale

[F] Audit della superficie DEVELOPMENT REVIEW integrata nel consumer, non del
Workbench scuro legacy della radice QA. Timeline con quattro segmenti,
scrubber, ingressi/uscite e tre join presenti; dettagli progressivi chiusi.
Il comando «Join 1 start · 06:44.25» porta entrambi gli indicatori alla posizione
404,25 s. Slider azionabile da tastiera, focus visibile; dock mantiene i comandi
accessibili mentre si scorre. Nessun errore/warning nei log acquisiti.
[I] P1: timeline, scrubber e dock ripetono posizione e navigazione; «Previous»,
«Next», «Join start/end» richiedono interpretazione. I dettagli sono un lungo
elenco, non una gerarchia visiva centrata sulla giunzione selezionata.
Progettare una sola relazione evidente tra traccia, cursore, marker e preview.

![Timeline review](/Users/RF/Documents/ChatGPT/New%20project/dist/m6-design-audit/07-hatha-review.png)

![Giunzioni review](/Users/RF/Documents/ChatGPT/New%20project/dist/m6-design-audit/08-join-details.png)

### 7. Caricamento, errore e retry — evidenza runtime insufficiente

[F] Negli avvii brevi osservati l'interfaccia è arrivata a Playing; nessun
errore naturale riprodotto. Non sono stati alterati asset o rete per forzarlo.
[U] Gerarchia dello stato di errore/retry, latenza percepita su rete mobile e
recupero offline: NON DETERMINATO — EVIDENZA INSUFFICIENTE. La futura tavola
dedicata deve rendere chiari attesa, annullamento e retry, senza inventare
disponibilità. Nessuno screenshot di errore viene simulato come prova runtime.

## Accessibilità e limiti della prova

[F] Controlli semanticamente esposti come button/radio/slider, selezioni e
stati disabled leggibili nell'albero accessibile; focus dello scrubber visibile.
[I] Rischio: testi tecnici piccoli nel dock, affollamento con zoom e contrasto
dei disabled. [U] VoiceOver/TalkBack, contrasto AA misurato, zoom 200%, Reduce
Motion, touch iPhone, latenza, qualità sonora, loop senza click, offline,
Bluetooth/background/lock-screen: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
Playing e avanzamento tempo non equivalgono a un ascolto approvato.

## Prossimo gate e chiusura operativa

Una sola azione richiesta: completare il collegamento del plugin Figma a Codex.
Solo dopo una risposta autenticata si potrà leggere/creare il file reale,
produrre i sei riferimenti distinti e sottoporli all'approvazione visiva.
La prima fase M6 non è ancora conclusa.

[F] Playback arrestato, scheda di audit chiusa, viewport ripristinata, server
locale 8101 spento e assenza listener verificata. Nessun emulatore avviato.
Suite funzionali non rieseguite: il lavoro di questo turno è audit/documentazione,
non modifica del codice. I risultati D-115 precedenti non sono nuovi test M6.
