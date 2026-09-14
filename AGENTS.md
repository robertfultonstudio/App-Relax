# App Relax - Istruzioni operative

## Ambito

Aggiornamento D-097, 13 settembre 2026: l'utente autorizza il collegamento
nativo Android e una successiva APK consumer interna, a costo zero verificato.
Il catalogo resta separato dall'APK/EAS: import locale verificato nello storage
privato del telefono. Il flag del solo profilo preview-android consente questa
implementazione concreta e il ciclo Hatha provvisorio per test; non abilita
iOS, Guided, store, PWA, commit o approvazioni sonore. Questa decisione supera
soltanto i precedenti blocchi M5 sulla factory nativa e sulla build Android.

Questo repository contiene una vera app mobile consumer iOS/Android basata su
React Native ed Expo. La milestone attiva è M5 `Adaptive Sessions & QA
Workbench`: modalità `Sound only` e `Guided`, durata prima dello Start,
sequencer deterministico a vincoli, contratto per pacchetti offline e
Workbench tecnico escluso dalla superficie consumer. Il catalogo M4 resta
formato da opere autonome; `Moon Current`, `deep-sleep-432` e i tre stem di
`AUDIO TEST PACK 01` restano confinati in `AUDIO TEST / TEST ONLY`.

Il materiale in `output/strategia-app-audio/` e `tmp/strategia-app-audio/` appartiene a un flusso parallelo e non va modificato, spostato, cancellato, staged o assorbito senza istruzione esplicita.

## Ordine delle fonti

1. Istruzioni dell'utente e policy globale della sessione.
2. Questo file.
3. `STATO.md` e `docs/DECISIONS.md`.
4. Specifiche in `docs/`.
5. Codice e test verificati.

In caso di conflitto, fermarsi, registrare il conflitto e non inventare una soluzione.

## Regole non negoziabili

- Consumer first, mobile first; nessuna PWA o web demo come sostituto del prodotto.
- TypeScript strict, Expo SDK 57, React Native 0.86, Expo Router e development build con `expo-dev-client`.
- La UI parla con `AudioSessionController`; non usa direttamente API audio native.
- La shell consumer usa il linguaggio `consumer-paper`: layout editoriale
  asimmetrico, carta washi, immagini integrate e hairline. Sono vietati card
  arrotondate generiche, pillole di stato e blob decorativi; Audio Test resta
  deliberatamente nella shell tecnica scura separata.
- `AudioEngine` resta indipendente dall'implementazione.
- `tuningLabel`, `carrierHz` e `beatHz` sono concetti distinti.
- Nessun claim medico, terapeutico o clinico.
- Nessun backend, login, billing, analytics, community o marketplace in M5.
- Il catalogo locale da circa 2,6 GiB resta fuori da Git, APK ed EAS; nessuna
  delivery remota viene inventata.
- `Eclypsis` / `Eclipse Veil` è stato respinto all'ascolto perché troppo
  dissonante: non può rientrare in catalogo, asset mapping, Continuum o pacchetti
  senza una nuova decisione esplicita dell'utente. Il master esterno resta
  intatto come archivio, non come asset dell'app.
- `Nirvana Waves` / `Stillwater Halo` è stato eliminato dal catalogo su ordine
  esplicito dell'utente: non può rientrare in catalogo, asset mapping, Continuum
  o pacchetti senza una nuova decisione esplicita. Il master esterno resta
  intatto come archivio, non come asset dell'app.
- Ogni opera consumer è autonoma; nessun mixer multilayer consumer. Una
  sessione musicale adattiva può usare esattamente due corsie coordinate:
  musica più una sola famiglia naturale scelta dall'utente (`Rain` oppure
  `Ocean waves`), con volume/mute ambiente separato. Ogni corsia riproduce una
  sola opera fuori dalle proprie transizioni; i cambi sono lenti e sfalsati.
  Questa eccezione non autorizza stem, layering arbitrario o un mixer libero.
- Guided resta `IN PRODUCTION` finché non esistono registrazioni reali.
- I metadata Continuum dedotti dal catalogo o dai filename sono provvisori e
  utilizzabili soltanto nel QA locale; non valgono come revisione musicale.
- Il mixer multilayer resta soltanto nel percorso tecnico `AUDIO TEST`.
- Functionality and time-to-sound first; evocative naming is secondary metadata.
- D-074: ascolto quotidiano attività → Play, timer facoltativo e una sola opera
  adatta scelta silenziosamente e mantenuta in loop. Titoli dei brani fuori da
  player/barra/attività; catalogo manuale solo nel sottomenu delle impostazioni.
  Hatha completo è un percorso separato con sequenza strutturata; non confondere
  loop autonomo e ciclo completo. D-105: nella sola PWA privata di prova i
  controlli di sviluppo partono aperti, anche con Rain/Ocean; `review=0` può
  richiuderli esplicitamente. Nessuna esposizione nella superficie nativa consumer.
- Gli artwork outcome seguono un contemporary minimal Japanese impressionism
  materico (pigmento minerale nihonga, sumi, gouache asciutta, washi,
  asimmetria e `ma`) insieme a refined cosmic new age; functionality e
  time-to-sound restano primari.
- Differenziare l'interfaccia da Anima senza abbandonare l'immaginario cosmico: sono ammessi cieli pittorici, campi stellari rarefatti, luce lunare e famiglie Cosmic/Aquarian originali; sono vietate imitazioni riconoscibili di sfere o pianeti neri luminosi, waveform/neuro-grafiche, frequency-first, mandala, chakra, Buddha, torii, pagode e kanji.
- Non dichiarare background audio o qualita sonora validati senza prove su telefono reale.
- Usare le etichette `[F]`, `[I]`, `[U]`; quando manca evidenza scrivere `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- Nessun nuovo Mac o altro acquisto hardware e un prerequisito di progetto.

## Scelta dinamica di strumenti, plugin e skill

Aggiornamento esplicito dell'utente, 14 settembre 2026: per ogni task scegliere
autonomamente lo strumento o la skill più pertinente alle capacità richieste,
senza chiedere all'utente le normali scelte tecniche. Preferire le capacità
già disponibili, inclusi strumenti nativi e CLI; cercare altre integrazioni
solo quando manca una funzione utile. Motivare la scelta in una frase quando
aiuta a comprendere il lavoro.

Expo è installato e si usa quando pertinente, ma non è esclusivo né obbligatorio
per ogni attività. Figma, Sentry e Supabase sono esempi, non integrazioni o
sequenze di adozione già autorizzate. La scelta tecnica non autorizza nuove
installazioni, account, credenziali, costi o operazioni esterne: restano validi
tutti i gate espliciti di questo repository.

## Workflow

Prima di cambiare file, leggere `STATO.md`, `docs/DECISIONS.md` e `git status --short --branch`. Mantenere modifiche piccole e reversibili. Non usare staging globale: aggiungere solo percorsi confermati.

Runtime riproducibile: Node `22.23.1` e pnpm `11.16.0`, registrati in `.nvmrc`, `.node-version`, `package.json` ed `eas.json`. Il Node di sistema non va usato. I controlli in questo ambiente possono usare il runtime Node isolato fornito da Codex.

Comandi locali autorizzabili senza toolchain nativa:

```bash
pnpm install --frozen-lockfile
pnpm peers check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:audio
pnpm audio:validate-placeholders
pnpm audio:validate-test-pack
pnpm assets:validate-safety
pnpm assets:validate-rituals
pnpm security:audit
pnpm config:validate
pnpm expo:doctor
pnpm exec expo install --check
pnpm run export:ios:consumer --output-dir dist/m5-export-ios
pnpm run export:android:consumer --output-dir dist/m5-export-android
pnpm export:validate-native dist/m5-export-ios dist/m5-export-android
```

Gli export native devono passare dagli script `export:*:consumer`: impostano
`public-mobile` come cartella pubblica vuota e impediscono che Expo copi il
catalogo localhost da 2,6 GiB. Non sostituirli con il comando Expo grezzo.

Le anteprime Web normali restano su loopback. `pnpm web:iphone` e
`pnpm web:iphone:review` sono le sole eccezioni LAN: individuano l'IPv4 privata
dell'interfaccia predefinita e autorizzano esattamente quell'host in
development, senza tunnel. La prima forza la superficie consumer; la seconda,
autorizzata dall'utente il 4 settembre 2026, espone la radice QA completa. Vanno
usate solo su una rete fidata e spente a fine prova.

`expo run:*`, `eas login`, `eas init`, `eas device:create`, `eas build`, upload, submission e registrazione dispositivi richiedono approvazione esplicita. Android e iOS sono gate cloud separati; non usare `--platform all`.

## Definition of Done

Il gate repository/non nativo M5 è chiuso solo quando:

- i sei outcome seguono attività → Play (D-074): timer già impostato,
  facoltativo e modificabile con sole durate pertinenti tra 10/20/30/45/60/90;
  nessun wizard, titolo musicale o scelta voce obbligatoria. Il ritorno
  conserva la sessione attiva; un nuovo avvio è esplicito;
- le sessioni musicali permettono di scegliere `Rain` o `Ocean waves`, tengono
  distinto il volume principale dal volume ambiente e cambiano registrazione
  naturale soltanto dentro la famiglia selezionata;
- Guided e scelta voce restano contratti futuri senza false disponibilità;
  non vanno reintrodotti nel flusso consumer corrente;
- il planner produce Arrival → Flow → Deepening → Return, è riproducibile da
  seed, evita ripetizioni e fallisce senza fallback casuale;
- safe entry/exit, regole di fase, compatibilità e stima conservativa del picco
  sono coperte da test;
- preview adattiva e pratica Hatha completa restano distinte dai loop
  quotidiani: browser locale/LAN autorizzato o PWA privata owner-only già
  autorizzata; non certificano una release native. Il driver adattivo nativo
  fallisce esplicitamente finché manca l'adapter verificato;
- il manifest offline non contiene URL e stato, spazio, integrità, retry,
  rimozione e astrazioni streaming/atomiche sono verificati senza dichiarare
  adapter o delivery inesistenti;
- il Workbench scuro esiste soltanto nella radice Router QA; la PWA privata
  dispone dei controlli di review e dell'inventario loop separato richiesti
  dall'utente. Entrambi esclusi da EAS/export consumer; titoli fuori dalla Home;
- lint, typecheck, test, test audio, validatori, Expo Doctor, controllo Expo
  install ed export Metro Android/iOS e Web consumer/QA sono verdi;
- nessun segreto o nuovo byte audio entra in Git/EAS e gli screenshot locali
  richiesti sono pronti per il gate umano.

Il 3 settembre 2026 l'utente ha autorizzato un solo commit locale M5 dopo il
gate visivo. La task si ferma prima di EAS, build native/cloud, push o PR.
Native adaptive playback, download mobile e comportamento su telefono reale
restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` finché non esistono adapter,
build e prove autorizzate.

## Autorizzazioni

Sono richieste istruzioni esplicite prima di installazioni globali o di sistema, credenziali/account, acquisti, project linking EAS, build cloud, upload, registrazione dispositivi, deploy, pubblicazione, push, invii esterni, cancellazioni o migrazioni irreversibili. Commit locale, push e pull request sono azioni distinte; non inferire l'una dall'altra.
