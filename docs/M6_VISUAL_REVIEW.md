# M6 — Mineral Washi: proposta visuale da approvare

16 settembre 2026. Fase visuale subordinata a M5. Non è una nuova versione
dell'app, non prova il playback e non autorizza implementazione o pubblicazione.

## Consegna e stato reale

[F] Sei immagini autonome generate con Image Gen integrato, secondo il flusso
image-first di ImageToCode e il brief Product Design. Tutte ispezionate visivamente
nel risultato originale. Dimensioni effettive 853×1844, proporzioni prossime alla
viewport logica 390×844. Copie integrali in `output/m6-design-review/`.
Nessun collage, ritaglio da board, modifica al codice o nuovo audio.

[F] Figma ora autenticato. Creato e verificato nell'elenco Recents il file
[App Relax — M6 Consumer Experience — Review](https://www.figma.com/design/m09OI6AzKuOlFyTDLgxQ4o).
Il file è ancora vuoto: non dichiararlo fonte visuale già compilata.
Aprendolo nel browser integrato, Figma risponde «We can't open this file
because WebGL isn't supported, or is disabled, in your browser». Non sono
state modificate impostazioni del browser o installati strumenti. Il limite
riguarda l'editor browser, non dimostra indisponibilità delle scritture del plugin.

[F] Preflight iniziale 12ui 0.2.70: eseguito `improve <01-home.png> --candidates 4 --to draft
--out-dir tmp/m6-12ui-preflight --dry-run`. Risposta: nessuna cattura remota,
dispatch o acquisto. Tetto dichiarato draft: 0,122 USD (ricerca corpus, piano,
quattro immagini). Il piano completo include inoltre 0,55 USD per conversione
e responsive export, totale 0,672 USD; NON autorizzati. La CLI richiede anche
il proprio collegamento account; nessuna credenziale configurata.

[F] Successivamente autorizzati account/upload del solo riferimento Home e
quattro draft entro0,122 USD. Run concluso, addebito riportato0 USD sponsored,
conversione esclusa. Esiti e difetti in `M6_12UI_VARIANTS.md`: tutti landscape,
non conformi al requisito mobile. Nessuna variante selezionata o implementata.
Le sei immagini qui sotto NON sono risultati 12ui. M6 NON completata: import in
Figma, correzioni visuali e approvazione umana restano aperti.

## Direzione unica

[I] **Mineral Washi**: superficie continua avorio, pigmenti minerali e immagini
che respirano nella carta; titoli editoriali, azioni letterali. Il cosmo rimane
in luce lunare e lavanda, non in grafica frequency-first. Niente card annidate,
pillole di stato, sfere nere, imitazioni di Anima o titoli musicali nel consumer.
Meditation resta prima; Yoga/Hatha non assorbe l'identità di App Relax.

### 1. Home

![Home](</Users/RF/Documents/ChatGPT/New project/output/m6-design-review/01-home.png>)

[I] Priorità: domanda → sei attività → ritorno all'ultima sessione. Griglia
editoriale aperta 2×3, immagini senza contenitore arrotondato, nomi brevi.
Serif per funzione, sans per supporto. Rispetto all'audit la pittura occupa
spazio reale; il ritorno non precede più il bisogno nuovo.
Da rifinire: a 390 px la frase di supporto va su due righe, non ridotta per
mantenere la singola riga generata. Il cielo dipinto non deve toccare le lettere.

### 2. Attività e durata

![Attività e durata](</Users/RF/Documents/ChatGPT/New project/output/m6-design-review/02-activity-duration.png>)

[I] Priorità: Begin meditation → durata già selezionata → Play. Le sei durate
sono visibili, con selezione tramite sottolineatura e lieve tinta, non solo colore.
Natura resta facoltativa e secondaria. Il numero di decisioni obbligatorie resta
zero dopo l'attività: si può accettare il tempo predefinito e premere Play.
Da rifinire: pulsante Play con sans Manrope, senza texture ad alto contrasto;
uniformare il selettore durata con Hatha anziché mantenere due famiglie.

### 3. Player

![Player](</Users/RF/Documents/ChatGPT/New project/output/m6-design-review/03-player.png>)

[I] Priorità: attività → tempo → ambiente → trasporto stabile. Titolo del brano
assente. Volume ambiente e principale non sono confusi; Mute esplicito.
Stop a sinistra, Pause/Play a destra, sempre nella medesima posizione.
Da rifinire: entrambi i volumi devono conservare mute accessibile, anche se
l'immagine mostra solo quello ambiente. Icona mute deve distinguere azione e
stato, senza far credere che Rain sia già silenziata. Nessun artwork sotto le
zone di testo critico. La UI proposta non prova che il cambio live sia valido
in tutti gli stati del motore: usare le capability reali del controller.

### 4. Hatha completo

![Hatha](</Users/RF/Documents/ChatGPT/New project/output/m6-design-review/04-hatha.png>)

[I] Susuki, luna quasi bianca e pesca sono coerenti con l'identità Yoga richiesta.
Durate 30/45/60/90, un solo avvio, natura facoltativa, ascolto semplice separato.
Nessuna voce promessa. Le fasi sono descrizione del viaggio, non un elenco brani.
Da rifinire: abbassare il peso delle quattro fasi e uniformare i selettori alla
tavola 2; nessun nuovo contenitore solo perché compare nel raster.

### 5. Review sviluppatore

![Review](</Users/RF/Documents/ChatGPT/New project/output/m6-design-review/05-review.png>)

[I] Stessa carta e controlli, ma titolo Development review inequivocabile.
Due corsie, cursore comune e scrubber adiacente; giunzione selezionata al centro
del lavoro. Start/end distinti da preview con lead-in; audition e finestra loop
progressivi, dettagli sorgenti in disclosure. Nessun secondo dock duplicato.
Correzione necessaria prima dell'implementazione: il raster mostra Hatha 90 min
ma asse 0–15 min. Va marcato **Join window · 0–15 min** con comando Full session,
oppure sostituito da asse globale 0–90; non copiare questa ambiguità nel codice.
Barre e timestamp del raster sono schematici, non derivati da un piano validato.
Hit target minimi vanno ottenuti aumentando l'area attiva, non rimpicciolendo testo.

### 6. Caricamento / errore / retry

![Recupero](</Users/RF/Documents/ChatGPT/New project/output/m6-design-review/06-recovery.png>)

[I] Il raster rappresenta SOLO l'errore recuperabile: sessione non iniziata,
scelte conservate, Try again primario e Cancel secondario. Nessun falso Play.
Da rifinire: rimuovere il thumb dalla linea ferma, che sembra uno scrubber
interattivo. Il caricamento usa lo stesso contenitore con «Preparing your sound…»
e Cancel; non mostrare contemporaneamente errore e caricamento. Progress bar
determinata solo se esiste una misura reale, altrimenti testo di stato.
Nessun messaggio di download/offline riuscito senza evidenza verificata.

## Specifica proposta, non token già approvati

| Voce              | Proposta                                              | Vincolo                                    |
| ----------------- | ----------------------------------------------------- | ------------------------------------------ |
| Superficie        | #F6F1E7                                               | Texture decorativa sotto aree non critiche |
| Testo / CTA       | #20352F                                               | 11,57:1 sul colore base                    |
| Testo secondario  | #4D5C59                                               | 6,24:1 sul colore base                     |
| Accenti           | lavanda, giada chiara, pesca, rosa polvere, oro tenue | Mai unico segnale di selezione             |
| Titoli            | Newsreader, 28–34 px, interlinea 1,15–1,25            | Supporto Dynamic Type/reflow               |
| Corpo / controlli | Manrope, 16 px, interlinea 1,4–1,5                    | 14 px solo metadata secondari              |
| Tempo player      | Newsreader 56–64 px                                   | Cifre tabulari se disponibili              |
| Griglia           | gutter 24, unità 4/8, sezioni 24/32                   | 2 colonne Home, reflow a 1 se necessario   |
| Trasporto         | pulsanti 56 px, icone 24                              | Minimo target 44×44, safe area extra       |
| Bordi             | hairline 1 px; raggio 0–2                             | Nessun effetto card / shadow               |
| Movimento         | dissolvenze brevi non essenziali                      | Reduce Motion statico, timer non pulsante  |

[F] Rapporti calcolati da luminanza sRGB dei colori proposti. Non sono una
certificazione di contrasto dei raster, delle texture o della futura UI.
[U] TalkBack/VoiceOver, zoom 200%, touch, performance e telefono:
NON DETERMINATO — EVIDENZA INSUFFICIENTE.

## Piano di traduzione dopo approvazione

| Superficie     | Punti esistenti da preservare                                                               | Lavoro visuale previsto                               |
| -------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Home           | src/app/index.tsx, OutcomeGridTile, LastSessionAction                                       | Griglia aperta, immagini/copy, priorità resume        |
| Attività       | src/app/outcome/[outcomeId].tsx, src/app-pwa/outcome/[outcomeId].tsx, ImmediateSessionSetup | Durata facoltativa e CTA letterale                    |
| Durata/natura  | SessionDurationPicker, NatureAmbienceChoice, SessionNatureControl                           | Famiglia comune, stati busy/disabled/selected         |
| Player         | ConsumerPlaybackSurface, PlaybackTransport, CurrentSessionBar                               | Trasporto unico, mute e volumi chiari                 |
| Hatha          | src/app/yoga.tsx, src/app-pwa/yoga.tsx, AdaptiveSessionSetup                                | Setup distinto da loop quotidiano                     |
| Review privata | PwaPlayerReviewControls, PwaReviewTimeline, PwaReviewScrubber, ReviewDock                   | Timeline unica, zoom esplicito, marker deterministici |
| Recupero       | stati controller e superfici attuali                                                        | Attesa/cancel/retry senza reset silenzioso            |

Nessuna route nuova necessaria in questa proposta. Expo va usato nella fase
implementativa per confini native/PWA/QA e safe area; nessun accesso diretto
all'audio dai componenti. AudioSessionController rimane il confine.
Non cambiare piano, seed, fade, codec, catalogo, asset sonori o persistenza per
adattare i mockup. Guided rimane non disponibile, catalogo manuale nel submenu.
Il Workbench scuro AUDIO TEST non viene convertito nella UI consumer.

## Gate di verifica successivi

1. Revisione delle varianti 12ui generate e risoluzione dei difetti mobile;
   nuova generazione o conversione richiedono autorizzazione separata.
2. Riferimenti consolidati nel file Figma, incluse le correzioni annotate sopra.
3. Approvazione umana della direzione; solo poi modifica UI.
4. Test UI/accessibilità, lint/typecheck, regressioni audio/controller e confini
   export; screenshot reali comparati allo stesso riferimento approvato.
5. PWA/APK/pubblicazione/commit restano autorizzazioni distinte.

## Manifest immagini

| File                     | SHA-256                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| 01-home.png              | dbbd21e9e8b8509a87925e9684a5423f9706e116f041f0603b0593555af692e2 |
| 02-activity-duration.png | c84e261165b7cbd541862c13c6b8d2676a8c92a4717ab1eaece1b3ae4263535a |
| 03-player.png            | 42089d28100bf238cfa4b55f9d17c53b6ee89ef800ac53790c44d37632f78b2b |
| 04-hatha.png             | 27f636d1dc354a1e98f852b08be92498b1e45bb1fc9fbfed9ccc08f74ff95800 |
| 05-review.png            | a55e7a690b8066f83dd592abcdf066553e8b2272cff4285ae413709d9240a005 |
| 06-recovery.png          | 4c34fddc48dbd8bd5e54594a625d43d687e970a21a43c4f0fcdfa585c6267d1e |

Prompt set: ui-mockup, 390×844 logici, sei immagini autonome nella medesima
direzione Mineral Washi; riferimenti audit Home/Hatha per la prima immagine,
Home generata per attività/player/Hatha, player generato per review/recovery.
Vincoli comuni: consumer-paper, Newsreader/Manrope, funzioni letterali, nessun
titolo brano consumer, nessun device chrome/collage, no card/pillole/Anima.
Prompt esatti e risultati originali restano nelle sei chiamate Image Gen della
task. I quattro draft 12ui successivi sono separati e tracciati nel relativo report.
