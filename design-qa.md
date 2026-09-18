# M6 — confronto della direzione 1–2 con l'app reale

## Chiusura del 17 settembre 2026

[F] Gate integrato locale PASS:103 suite/761 test,55 tooling, Expo20/20,
export PWA e validatori verdi. Pubblicazione privata autorizzata e completata;
report definitivo `docs/M6_CLOSEOUT.md`. Le sezioni seguenti sono cronologia.

Confronti finali realmente ispezionati: `dist/m6-closeout/home-comparison.png`
e `player-comparison.png`, con source normalizzata e screenshot `*-visible.png`
a390×844. Gli screenshot CDP con scala/crop diversi, compresi `player.png` e
le vecchie prove high-DPR, non sono evidenza valida di nitidezza. Nessun filtro
di sharpening inventato e nessun falso screenshot Retina.

Titolo reale ZenMinchoRegular30px, opacity1, nessunfilter/ombra/transform;
font locale custom già verificato. Corpo Hanken, controlli opachi, tab netti;
entrambi i volumi visibili. Pitture non testuali, nessuna nuova animazione,
copy funzionale e navigazione conservati. Il giudizio estetico finale su
telefono resta dell'utente; contrasto su ogni pixel pittorico non certificato.

Hatha90/Rain avviata; Pause, Join start352,79s, review loop322,79s e Stop
verificati, tre barre concordi. Inventario45 registrazioni raggiungibile;
nessun errore console finale. Test locale non equivale ad ascolto approvato.

Final result: passed per QA locale delimitata. Nessun blocco implementativo
M6 residuo; test fisici, nuova APK e commit canonico restano gate separati.

## Ultima revisione richiesta dall'utente

La preferenza successiva richiede font più caratterizzati, trasporto pastello
sfumato e tab sempre riconoscibili. Supera il fondo bianco e la tipografia del
riferimento iniziale: non si cerca di ricopiare quei due dettagli respinti.

Verificati e aperti i confronti `home-pastel-comparison.png` e
`player-pastel-comparison.png`, source normalizzata a sinistra e nuova app
390×844 a destra. Screenshot individuali `home-pastel.png`, `player-pastel.png`.
Titoli Zen Mincho, corpo Hanken; font locale effettivo verificato nel browser.
Lavatura lavanda/cipria sul solo fondo trasporto, nessuna ombra sulle icone;
Stop ha un contorno, Play/Pause resta pieno. Tab rettilinei con contorno netto,
selezione giada e stato assistivo; non dissolti nel dipinto. Pitture, gerarchia,
copy e flusso conservati. Entrambi i volumi restano visibili a 390×844.

103 suite/760 test, incluso contrasto ≥4,5:1 del testo e ≥3:1 dei contorni tab,
target ≥44 px e assenza di opacità sui simboli abilitati. Nessuna animazione.
Risultato QA locale: passed. Approvazione estetica di questa nuova iterazione
ancora dell'utente; nessuna nuova prova su telefono o pubblicazione implicita.

## Prove della prima iterazione

Source visual truth: `output/m6-design-review/mobile-v2/01-home.png` e
`02-player.png`, entrambi 853×1844; copie Figma verificate `3:2` e `3:3`.
Implementazione: `dist/m6-review/home-final.png`, `player-final.png`.
Viewport e screenshot: 390×844 CSS/pixel, DPR 1. Source ridimensionata
proporzionalmente a 390×843/844, senza cornice. Il contenitore del browser
inizialmente aveva uno zoom incoerente: quei primi scatti non sono prova finale.

Confronti realmente aperti come input affiancato:
`dist/m6-review/home-comparison.png`, `player-comparison.png` (780×866,
22 px di intestazione). Stato: Home con ultima sessione, player Playing
con Rain e review chiusa esplicitamente. Il tempo/volume differisce dal mock
perché il player è reale. Esaminato anche player con dock QA aperto.

## Findings e correzioni

- [P1, risolto] Il dipinto player ereditava la larghezza intrinseca 853 px e
  perdeva la luna. Corretto con contenitore relativo e immagine 100%.
- [P1, risolto] L'estensione del dipinto sotto la testata copriva Back.
  Gerarchia dei livelli corretta; Back visibile nella prova finale.
- [P2, risolto] Natura ripetuta due volte e timer fra i volumi portavano il
  volume principale sotto il trasporto. Tolta la duplicazione; timer facoltativo
  spostato dopo i volumi. Entrambi gli slider visibili nella prova finale.
- [P2, risolto] Sfondo Home fermo mentre scorreva la griglia: lo sfondo ora
  appartiene al contenuto scorrevole e mantiene la composizione alta 844 px.
- [P2, risolto] Slider nativo non marcato accessible: corretto, test di touch,
  limiti, azioni assistive e disabled superati.

Cronologia: prime prove `home.png`, `player-review.png` e `player-consumer.png`
sono intermedie, non deliverable. Le correzioni sopra sono state ricatturate;
gli scatti `*-final.png` e i confronti sono quelli successivi alle correzioni.

## Cinque superfici obbligatorie

- Tipografia: Newsreader Regular e Manrope reali e locali; timer verificato
  via font effettivamente renderizzato. Titoli e controlli leggibili, niente
  testo dentro i dipinti. Misure un poco più grandi del raster sono intenzionali
  per leggibilità; il raster generativo non definisce metriche font esatte.
- Spazi/layout: due colonne, sei accessi, nessuna card aggiunta. Trasporto
  persistente 64 px e target ≥44 px; due volumi visibili a 390×844.
  Il contenuto secondario scorre, non viene rimosso quando il dock è presente.
- Colori: carta avorio, inchiostro minerale, selezioni lavanda; nessuna ombra
  davanti al simbolo Pause. Contrasti dei token coperti dalle regressioni;
  contrasto di ogni pixel pittorico e screen reader fisico non certificati.
- Immagini: le pitture originali ripulite dal testo sono JPEG registrati,
  non ricostruzioni CSS/SVG. Luna, acqua, erbe e composizione coerenti. I soggetti
  sono decorativi e non sostituiscono i target o le etichette.
- Copy: sei funzioni prima dei titoli; niente nomi musicali nella Home/player
  normale. `Ocean waves` completo, Play/Pause/Stop e Mute espliciti.

Deviazioni intenzionali: Settings testuale al posto dell'ingranaggio,
Home/Hatha testuali (nessun loto vietato), Back conserva la navigazione reale,
stato Playing al posto della frase decorativa, volumi con Mute scritto anziché
icona ambigua, timer disponibile scorrendo. Dock opaco per leggibilità stabile.
Queste differenze sono scelte funzionali, non una dichiarazione di replica pixel-perfect.

## Interazioni e responsive

Play, Pause, Stop, ultima sessione, cambio Rain/Ocean, slider/mute separati,
Hatha 90 minuti e seek verso giunzioni provati nel browser integrato.
La Home a 320×568 non ha overflow orizzontale; i target misurano138×190;
Focus resta raggiungibile scorrendo. Test nativi coprono fontScale elevato
e controlli disabilitati. Nessuna nuova animazione introdotta.

I simboli e il testo sono leggibili a dimensione nativa nei confronti;
non occorre un ulteriore crop ingrandito per valutarli. I vecchi warning di
service worker appartengono al server sostituito; il percorso update locale
è stato poi verificato sul bundle finale. Nessuna approvazione audio implicita.

## Implementation checklist

- [x] Risolvere i cinque difetti riprodotti e ricatturare.
- [x] Confrontare source e runtime affiancati, non soltanto aprire file separati.
- [x] Preservare controller, review e catalogo esterno.
- [x] Test automatici e export PWA validi.
- [ ] Gate Expo patch e successiva approvazione/pubblicazione separati.
- [ ] Nuovo ascolto e accessibilità su telefono: non provati da screenshot.

final result: passed

Il risultato riguarda la QA visiva locale sopra delimitata, non la chiusura
del gate integrato M6, la PWA online o una release Android/iOS.
