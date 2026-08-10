# Product spec - Consumer audio MVP

## Visione

Un'app mobile consumer semplice e premium per accompagnare sonno, calma, concentrazione e meditazione. Il secondo segmento strategico comprende insegnanti yoga e operatori wellness che in futuro potranno usare sessioni lunghe, fluide e poco ripetitive.

## Principi di prodotto

- Consumer first e mobile first.
- Interazione immediata: scegliere una sessione e iniziare ad ascoltare.
- Estetica twilight, organica e contemplativa; mai interfaccia da DAW.
- Qualita audio e stabilita prima dell'ampiezza del catalogo.
- Linguaggio emozionale ma non sanitario.

## Utenti e lavori da svolgere

### Pubblico generalista

- Avviare rapidamente un sottofondo per dormire o rilassarsi.
- Ridurre le decisioni con preset comprensibili.
- Impostare una durata e lasciare che la sessione termini dolcemente.

### Operatori wellness - futuro

- Usare sottofondi lunghi durante yoga, meditazione e breathwork.
- Evitare una ripetizione troppo evidente.
- Ottenere variazioni gentili senza controlli tecnici complessi.

## Vertical slice

### Navigazione

1. Home con quattro categorie: Sleep, Calm, Focus, Meditate.
2. La categoria Sleep contiene una sola sessione: `Deep Sleep 432`.
3. Le altre categorie mostrano un empty state, non sessioni inventate.
4. Il player espone controllo principale, durata e un mix secondario.
5. Settings e Legal sono raggiungibili dalla Home.

### Sessione Deep Sleep 432

- Goal: sleep.
- Tuning label: `432 Hz` come metadato/etichetta del preset.
- Binaural beat e carrier: valori tecnici indipendenti dal tuning label.
- Fonti: drone, ambience, texture, binaural, brown noise.
- Durate iniziali: 15, 30 e 60 minuti.
- Fade-in e fade-out dolci.

## Copy e compliance

Sono consentite etichette descrittive come `brown noise`, `binaural 3.5 Hz`, `deep rest` e `ritual calm`. Non sono consentite promesse di cura, terapia, guarigione, riparazione del DNA, trattamento dell'acufene o efficacia clinica non dimostrata.

Il copy legale dell'MVP e informativo e non sostituisce una revisione legale o store. `NON DETERMINATO — EVIDENZA INSUFFICIENTE`: giurisdizioni di lancio e testo legale finale.

## Accessibilita

- Contrasto leggibile su tema scuro.
- Target touch di almeno 44 x 44 pt.
- Label comprensibili per VoiceOver/TalkBack.
- Stati comunicati anche con testo, non solo colore.
- Riduzione delle animazioni quando il sistema lo richiede.

## Fuori scope

- Login, backend, community, chat, feed e marketplace.
- Billing completo e analytics invasive.
- Area professionale separata.
- Decine di preset o libreria audio estesa.
- Generazione algoritmica long-form completa.
- Claim medici o pseudo-scientifici.

## Successo della milestone

Il successo e tecnico e osservabile: percorso completo, un'unica sessione attiva, cinque fonti controllabili, timer/fade/persistenza, gate statici verdi, development build installata e smoke test su telefono reale. EAS cloud puo produrre la build senza una toolchain locale e senza acquistare un nuovo Mac. Retention, conversione e qualita percepita non sono misurabili in questa milestone.
