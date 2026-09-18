# Prompt per App Relax — revisione e correzione completa

Lavora sul repository **App Relax** come proprietario operativo dello sviluppo. Questo è un ordine di **diagnosi, implementazione, test e documentazione**, non una richiesta di piano o di semplice verifica dell’APK esistente.

## Obiettivo generale

Correggi integralmente i problemi descritti sotto e porta l’app a comportarsi e presentarsi come una vera applicazione mobile consumer. Mantieni intatta l’identità visiva già approvata: impressionismo giapponese contemporaneo, carta materica, pigmenti, asimmetria, `ma` e atmosfera cosmica raffinata.

L’app non deve più dare l’impressione di essere un sito aperto in Safari o Chrome. Il problema non è l’estetica artistica: sono struttura, navigazione, gerarchia, componenti, densità, scorrimento, reattività e comportamento.

Non considerare il lavoro completato limitandoti a riconsegnare o ricontrollare l’APK 1.0.4. Quella build è soltanto una baseline precedente e contiene ancora limiti noti.

## Metodo operativo obbligatorio

1. Leggi prima `AGENTS.md`, `STATO.md`, `docs/DECISIONS.md` e lo stato Git reale.
2. Conserva tutte le modifiche preesistenti. Non sovrascrivere lavoro altrui, non usare staging globale e non toccare `output/strategia-app-audio/` o `tmp/strategia-app-audio/`.
3. Lavora per milestone delimitate, con un solo Obiettivo attivo alla volta.
4. Per ogni milestone esegui: riproduzione del difetto, causa, modifica reale del codice, test mirati, regressione e prova visiva o tecnica pertinente.
5. Dopo una milestone verificata, passa automaticamente alla successiva. Fermati soltanto davanti a un’autorizzazione realmente necessaria, a credenziali mancanti o a un blocco esterno non aggirabile in sicurezza.
6. Non dichiarare risolto ciò che non è stato provato. Distingui sempre test locali, emulatore, browser, APK e telefono reale.
7. Non eseguire commit, push, pull request, pubblicazione, creazione di account, acquisti o installazioni globali senza autorizzazione esplicita.

## Vincolo assoluto di consegna — solo PWA

In questo ciclo **non creare, richiedere, ricostruire, aggiornare, scaricare o consegnare alcuna APK**. Non avviare EAS Build e non consumare nemmeno una build o una quota Android. Non riconsegnare l’APK 1.0.4 e non usare la produzione di una nuova APK come prova di completamento.

La sola consegna richiesta è una **PWA completa e verificata**, costruita con il percorso PWA già previsto dal repository. Prepara l’artefatto PWA e le relative prove. Una pubblicazione esterna resta distinta: se non risulta già autorizzata per questa revisione, fermati immediatamente prima del deploy e consegna il candidato PWA locale pronto, senza pubblicarlo autonomamente.

Le verifiche native, l’ascolto sul telefono e una futura APK restano gate successivi separati. Non devono consumare quota in questa milestone e non devono impedire di completare e consegnare la PWA.

## Strumenti da usare quando pertinenti e realmente disponibili

- **@Product Design**: audit iniziale e finale di UX, gerarchia, navigazione, componenti, accessibilità osservabile e coerenza mobile.
- **@Figma**: esplorazione e confronto della nuova direzione soltanto se esiste un file Figma realmente collegato e accessibile. Se non è disponibile, dichiaralo e prosegui nel codice senza inventare prove.
- **@Expo** e relative skill: implementazione React Native/Expo, sviluppo mobile, controlli di compatibilità e runtime.
- **Maestro MCP**: percorsi ripetibili e regressioni, soltanto sul runtime effettivamente disponibile.
- **@Browser**: verifica della PWA o delle superfici Web; non vale come prova nativa.
- **@Data**: raccolta strutturata di tempi, crash, scatti, esiti e confronti prima/dopo quando utile.
- **@Sentry**: soltanto se il progetto risulta davvero configurato e collegato. In caso contrario usa log locali e non dichiarare di averlo utilizzato.
- **Strumenti audio e test del repository**: player, loop, transizioni, seek, timer, ripresa, scelta delle tracce e cambio dell’ambiente.
- **$rf-app-success**: gate conclusivo su utilità, facilità, stabilità, differenziazione e possibilità di ritorno dell’utente.

Non usare axe DevTools Mobile. Non attivare plugin indiscriminatamente: assegna a ciascuno un compito concreto e documenta soltanto l’uso reale.

## Milestone 1 — Stabilità e motore audio

Riproduci e correggi, con causa verificata:

1. crash, blocchi e ritorni inattesi all’inizio della sessione;
2. cambio da Pioggia a Onde e da Onde a Pioggia durante la riproduzione;
3. mancato avvio o silenzio dopo il cambio dell’ambiente;
4. ripartenza della musica, del timer o della posizione;
5. doppio audio, sovrapposizioni non volute e risorse non rilasciate;
6. problemi di pausa, ripresa, Stop, seek, loop, transizioni e fine sessione;
7. recupero coerente dopo errore o interruzione.

Il cambio Pioggia/Onde durante Play deve avvenire senza interrompere o riavviare la musica principale, senza azzerare timer e posizione e senza crash. Deve restare una sola opera musicale più una sola famiglia naturale scelta dall’utente.

### Prove minime

- test unitari e di integrazione sulle transizioni di stato;
- almeno venti cambi consecutivi Pioggia/Onde in un test ripetibile senza crash, riavvio o doppia sorgente;
- prova di pausa, ripresa, Stop e seek prima e dopo il cambio;
- simulazione accelerata dell’intera durata e delle transizioni;
- log della posizione e del timer prima e dopo ogni operazione;
- prova breve su emulatore o development build se disponibile;
- test lungo e ascolto sul telefono reale restano un gate distinto e non possono essere sostituiti dal browser.

## Milestone 2 — Sequencer e prestazioni

Il sequencer tecnico è utile e va mantenuto, ma oggi lo scorrimento è lento, scattoso e talvolta inutilizzabile.

1. Profila rendering, aggiornamenti di posizione, timeline, listener e operazioni audio.
2. Elimina render inutili, calcoli ripetuti e aggiornamenti troppo frequenti.
3. Rendi fluido lo scorrimento anche su una sessione di novanta minuti.
4. Mantieni sincronizzati cursore, posizione reale, marker, loop e transizioni.
5. Evita che lo scrub o lo scroll provochino blocchi, seek multipli o crash.

Consegna misure prima/dopo e un test di regressione ripetibile. Non usare la sola sensazione visiva come prova di prestazione.

## Milestone 3 — Player tecnico sviluppatore

Riprogetta il player di revisione tecnica. I controlli sparsi nella pagina sono disorientanti e occupano troppo spazio.

1. Crea una barra inferiore tecnica persistente, compatta e ordinata.
2. Inserisci nella barra, con gerarchia chiara: Play/Pausa, Stop, tempo e durata, seek, salto al punto precedente o successivo, salto all’inizio o alla fine della transizione, loop di revisione, uscita dal loop e stato corrente.
3. Mantieni il sequencer sopra la barra e rendilo direttamente leggibile e manipolabile.
4. Usa pannelli secondari o espansioni controllate per le funzioni meno frequenti, senza ricreare una lunga pagina di pulsanti.
5. Rendi stati attivi, disabilitati, loading ed errore chiaramente riconoscibili.
6. Mantieni questa superficie separata dall’app consumer e fuori dagli export consumer.

La tipografia, le icone, i pesi, gli spazi e gli stati di Play, Pausa e Stop devono essere moderni e coerenti con l’app. Elimina l’aspetto da vecchio pannello desktop o da “Windows 95”. Mantieni target tattili accessibili e leggibili.

## Milestone 4 — Home e struttura mobile consumer

Ricostruisci la Home come schermata mobile nativa, conservando gli artwork e l’identità impressionista.

1. Elimina l’effetto intestazione da sito, link Web, griglia da pagina e scorrimento eccessivo.
2. Usa navigazione, gerarchia, spazi, gesti e componenti coerenti con un’app per telefono.
3. Mantieni immediato il percorso attività → durata facoltativa → Play.
4. Mantieni visibile la ripresa della sessione corrente senza confonderla con un nuovo avvio.
5. Non mostrare titoli tecnici o titoli dei brani nella superficie consumer.
6. Mantieni Settings raggiungibile con un pattern mobile chiaro.
7. Verifica dimensioni tattili, contrasto, lettura, focus, screen reader e orientamento.

Non sostituire l’estetica impressionista con card generiche, pillole, gradienti aziendali o una UI standardizzata. Il risultato deve sembrare un’app mobile originale, non un template.

## Milestone 5 — Musica per attività e scelta automatica

Le attività Relax, Massage, Meditation, Yoga, Focus e Sleep non devono limitarsi a sola pioggia o sole onde.

1. Ogni attività deve avere una raccolta curata di opere musicali pertinenti.
2. All’avvio, il motore sceglie silenziosamente un’opera dalla raccolta corretta.
3. Evita la ripetizione immediata della stessa opera tra sessioni consecutive quando esistono alternative.
4. La scelta iniziale può variare, ma una sessione avviata deve restare deterministica e recuperabile.
5. La durata scelta, inclusi sessanta e novanta minuti, deve essere rispettata tramite il comportamento di sessione previsto, con loop e transizioni corretti.
6. L’utente può abbinare una sola famiglia naturale, Pioggia oppure Onde, con volume e mute separati.
7. Usa subito il materiale musicale esistente come base provvisoria di sviluppo, senza attendere il catalogo futuro.
8. Predisponi una struttura estendibile per opere future specifiche di Yoga, Meditation, Relax, Massage, Focus e Sleep.

La parola **“playlist” non deve comparire nell’interfaccia consumer**. Usa espressioni coerenti con il prodotto, come “organizza il tuo flusso”, “sessione”, “ascolto” o “percorso”, secondo il contesto. I titoli dei brani restano fuori dal player consumer e dalle attività.

## Milestone 6 — Verifica finale integrata

Esegui l’intera suite pertinente alla consegna PWA: formattazione, lint, typecheck, test, test audio, validatori di sicurezza e confine consumer/QA, Expo Doctor, controllo delle dipendenze, export Web consumer e PWA QA secondo gli script autorizzati del repository. Non eseguire EAS Build e non produrre export o pacchetti finalizzati a una nuova APK.

Esegui inoltre:

- audit Product Design prima/dopo;
- percorsi ripetibili disponibili con Maestro;
- confronto visivo delle schermate principali;
- verifica che i controlli tecnici non entrino nell’app consumer;
- verifica che non compaia “playlist” nell’interfaccia consumer;
- verifica che non entrino nuovi byte audio, segreti o cataloghi locali in Git o negli export;
- revisione finale con `$rf-app-success`.

## Definition of Done

Il lavoro può essere dichiarato concluso soltanto quando:

1. esistono modifiche reali e ispezionabili nel repository per ogni problema applicabile;
2. crash e riavvii riprodotti sono corretti con test di regressione;
3. Pioggia/Onde cambia durante Play senza riavviare musica, timer o posizione;
4. il sequencer è misurato e risulta fluido nel caso lungo;
5. il player tecnico è concentrato nella barra inferiore e resta escluso dal consumer;
6. Home e navigazione hanno struttura chiaramente mobile conservando l’identità impressionista;
7. ogni attività utilizza musica pertinente con scelta automatica e anti-ripetizione;
8. test e validatori pertinenti sono verdi;
9. esistono screenshot o registrazioni prima/dopo e un rapporto dei risultati;
10. viene consegnato esclusivamente il candidato PWA verificato, senza creare o consumare alcuna build APK;
11. ogni limite non provato su telefono reale è dichiarato `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

Se manca un telefono reale, completa comunque tutto il lavoro locale ed emulato possibile e fermati soltanto al gate fisico, indicando esattamente le prove da eseguire. Non trasformare quel limite in una falsa conclusione dell’intero mandato.

## Rapporto finale obbligatorio

Alla fine fornisci:

- problemi riprodotti e cause;
- file e comportamenti modificati;
- test eseguiti con esito;
- misure prima/dopo;
- plugin e skill realmente utilizzati, con il compito svolto da ciascuno;
- screenshot o artefatti di verifica;
- cosa è verificato localmente, su browser, su emulatore e su telefono;
- eventuali elementi ancora aperti e relativo motivo.

Non chiudere con un riepilogo generico e non riconsegnare la vecchia APK come se rappresentasse queste correzioni. La consegna finale deve essere soltanto la PWA verificata. Concludi soltanto quando la Definition of Done è soddisfatta oppure quando esiste un blocco esterno preciso che richiede l’utente.
