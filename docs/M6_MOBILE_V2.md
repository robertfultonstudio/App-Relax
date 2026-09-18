# M6 — seconda esplorazione mobile, coppia1–2 selezionata

16 settembre2026. L'utente ha respinto la prima esplorazione come troppo simile
alla precedente e simile a vecchie pagine Web. La raccomandazione C è ritirata.

[F] Product Design/get-context/ideate e ImageToCode image-first applicati.
Due direzioni, ciascuna con Home e player autonomi. Quattro chiamate Image Gen
integrate; nessuna chiamata12ui aggiuntiva, conversione, build, deploy o commit.
Preflight Product Design: nessun contesto salvato; usati brief e asset locali.
Non avviati server o emulatori. Nessun codice applicativo/audio modificato.

## Ordine effettivo delle immagini mostrate

1. `output/m6-design-review/mobile-v2/01-home.png`: sei accessi pittorici2×3.
2. `output/m6-design-review/mobile-v2/02-player.png`: player coordinato, trasporto basso.
3. `output/m6-design-review/mobile-v2/03-home.png`: attività selezionabile e Play in Home.
4. `output/m6-design-review/mobile-v2/04-player.png`: player coordinato, trasporto sotto timer.

Le coppie1–2 e3–4 sono alternative, non quattro direzioni indipendenti.
I riferimenti sono raster, non screenshot runtime né preview navigabili.

## Analisi ImageToCode

[I] Coppia1–2: materia pittorica senza cornice e sei funzioni immediatamente
riconoscibili; testo delle attività sans, titolo serif più contenuto. Player
con cielo/lago, due volumi distinti e Stop/Pause alla base. Resta vicina alla
precedente architettura a galleria: il cambiamento è principalmente visivo.

[I] Coppia3–4: modifica anche l'interazione. Selettore attività piatto2×3,
timer modificabile e Play nella stessa Home. Nessuna ricerca tra titoli.
Arte atmosferica unica, non sei thumbnail. Nel player Stop/Pause/Timer stanno
subito sotto il tempo, prima della natura e dei volumi. Il costo della scelta
è minore enfasi sull'illustrazione individuale di ogni attività.

Tipografia: sans per controlli e corpo, serif selettivo per tempo/attività;
scala proposta16px corpo,28–32 titolo,64 tempo, non misurazione certificata
del raster. Carta avorio, lavanda/blu minerale, pesca e inchiostro prugna.
Controlli primari solidi, selezioni con sottolineatura; assenti waveform,
titoli musicali e mixer. Touch, focus, reflow e contrasto restano da verificare
nel successivo prototipo. Non trasferire il raster come interfaccia cliccabile.

## Difetti da correggere prima di approvare o costruire

- La Home1 introduce un loto per Hatha; la Home3 una figura seduta. Entrambe
  contrarie al brief: sostituire con etichetta Hatha semplice, come nel player4.
- Home3 e player4 hanno proporzioni più corte del390×844 richiesto; ricomporre
  lo spazio, non stirare il raster. Sono studi portrait, non prove responsive.
- Icone mute con croce ambigue rispetto ai valori35/80%: rendere distinguibili
  azione e stato; non dichiarare due volumi silenziati durante il playback.
- Nella coppia3–4 ridurre densità del pigmento sotto Home/Settings per contrasto.
- Uniformare 'Ocean' in2 a 'Ocean waves'; conservare copy reale e CTA letterali
  specifiche per attività durante la traduzione dopo approvazione.
- Verificare in particolare che Pause centrale resti moderato: non ripetere
  il precedente dock sovradimensionato respinto dall'utente.

## Prompt set e fonti

Generazioni built-in, use case ui-mockup, mobile390×844 logici, una schermata
per chiamata, nessun collage o device chrome. Prompt integrali nelle quattro
chiamate Image Gen della task, nomi interni Pigment atlas / One quiet gesture.
Fonti Home: `assets/images/outcomes/meditation.jpg` e
`assets/images/backgrounds/rituals-home-v1.jpg`, ispezionate e allegate.
Per ciascun player, allegata la rispettiva Home appena generata come riferimento.
La prima Home precedente è stata ispezionata come controesempio, non allegata.
Vincoli: sei outcome, Meditation prima, nessun titolo brano, consumer-paper,
pittura giapponese/pastelli/cosmo,44px target, nessun audio nuovo o modifica motore.

[F] Scelta successiva dell'utente: «1-2». Creato prototipo locale separato in
`output/m6-mobile-prototype`, usando lo starter mobile-app Product Design.
URL loopback `http://127.0.0.1:8102/`. Le due pitture sono state ripulite dal testo
tramite Image Gen; nessun mock raster usato come interfaccia cliccabile.
Componenti HTML reali, font Manrope/Newsreader locali, icone Radix; Hatha senza loto.
Build/TypeScript e integrità28 file runtime PASS. Interazioni verificate nel
browser integrato; screenshot/confronti e limiti nel `design-qa.md` del prototipo.
[U] Il prototipo simula il playback e non contiene audio. Approvazione umana
del risultato, integrazione Expo, accessibilità assistiva e prove su telefono
restano separate. Nessuna modifica all'app, pubblicazione, EAS o commit.
