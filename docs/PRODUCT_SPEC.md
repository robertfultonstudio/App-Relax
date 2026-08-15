# Product spec - M3 Product Shell

## Visione

Un'app mobile consumer che mette il bisogno prima del catalogo. In apertura
l'utente deve capire entro cinque secondi cosa fare e il prodotto futuro deve
portarlo al suono in uno o due tap, senza feed, onboarding, quiz, pressione o
tecnicismi obbligatori.

## Principi di prodotto

- Consumer first e mobile first.
- Struttura primaria a tre tab: `RITUALS`, `YOGA`, `SOUNDSCAPES`.
- Home outcome-first: Yoga, Massage, Relax, Meditation, Sleep e Focus.
- Home in griglia 2×3: sei box equivalenti con artwork distinti; nessun bisogno
  o titolo futuro è trattato come hero dell'intera pagina.
- Functionality and time-to-sound first; evocative naming is secondary metadata.
- Tutto il contenuto consumer M3 è `IN PRODUCTION`, bloccato e privo di audio.
- I futuri brani sono entità autonome, non preset multilayer esposti al pubblico.
- Il mixer resta solo nel test tecnico e non definisce l'esperienza consumer.
- Linguaggio emozionale e spirituale accessibile, mai medico o pseudoscientifico.
- UI minimalista; identità contenutistica direzionale 60% impressionismo/pastello
  meditativo e 40% cosmic new age raffinato.

## Shell consumer

| Tab         | Titolo                        | Struttura M3                                                                                                                         |
| ----------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Rituals     | `What do you need right now?` | promessa guida `Choose your moment. Press start. Leave the phone behind.`; sei azioni per bisogno, tutte in produzione e senza audio |
| Yoga        | `Begin your practice.`        | formati futuri 20/30/45/60 minuti; nessuna sessione o audio disponibile                                                              |
| Soundscapes | `Where would you like to go?` | opere autonome e famiglie editoriali future; nessun audio pubblicato                                                                 |

Yoga usa il sottotitolo `Choose a journey shaped to move with you.`.
Soundscapes predispone `Standalone works`, `Elemental Worlds`,
`Field recordings`, `Cosmic / Zen ambient` ed `Esoteric Series`.

### Gerarchia funzionale

1. funzione/bisogno;
2. CTA immediata;
3. durata o formato;
4. titolo evocativo come metadato secondario.

Le sei CTA pianificate sono `Start your yoga session`,
`Set the room for massage`, `Relax now`, `Begin meditation`,
`Prepare for sleep` e `Focus`. Sono tutte visibilmente `IN PRODUCTION`,
disabilitate e prive di preset, audio o route player. Nel box Yoga l'avvio della
sessione precede le durate 20/30/45/60 e il titolo futuro `Cedar Ascent`, ma il
box conserva lo stesso peso visivo degli altri cinque bisogni.

## Confine Audio Test

`Moon Current`, l'identificativo `deep-sleep-432`, i tre WAV ATP01, binaural,
brown noise, timer e mixer multilayer sono strumenti di regressione del motore.
Vivono nella route separata `AUDIO TEST / TEST ONLY`, raggiungibile da Settings
ma assente dai tab consumer.

Il player tecnico mantiene Play, Pause, Stop, timer 15/30/60, volume e mute con
target minimi 44x44. `Volume & mute` e `Test details` sono chiusi di default.
La presenza del test non autorizza `Moon Current` come release consumer.

## Claim boundary

`tuningLabel`, `carrierHz` e `beatHz` restano metadati tecnici distinti.
`beatHz` descrive soltanto la differenza tra due toni stereo. Non sono
consentite promesse di cura, terapia, guarigione, sincronizzazione cerebrale,
trattamento dell'ansia o dell'acufene, né efficacia clinica.

## Design system

- Font locali OFL: Newsreader per titoli, Manrope per UI.
- Palette minerali e pastello: blu, lavanda, rosa polvere, giada e oro discreto.
- Superfici pittoriche, pennellate morbide e molto spazio; testo ad alto contrasto.
- Cosmic new age originale ammesso e centrale: cieli pittorici, campi stellari
  rarefatti, nebulose ad acquerello, luce lunare, aurora e pioggia celeste.
- Differenziazione da Anima nell'interfaccia, non abbandono dell'immaginario
  cosmico: niente imitazioni di sfere/pianeti neri luminosi, waveform o
  neuro-grafiche protagoniste, frequency-first, mandala, chakra, Buddha o torii.
- Reduce Motion rispettato; target touch minimi 44x44; label e stati TalkBack.

## Fuori scope

- Nuovo audio, backend, login, analytics, billing, favorite o marketplace.
- Sessioni Yoga realmente riproducibili o catalogo Soundscapes pubblicato.
- EAS, build iOS, submission, pubblicazione, commit, push o PR.
- Naming commerciale definitivo e claim non revisionati.

## Successo M3

Gate locali ed export Metro verdi, esattamente tre WAV ATP01, nessun nuovo audio
o segreto, cinque screenshot Android puliti e approvazione umana. Qualità audio,
Bluetooth, background, lock-screen, batteria e ascolto lungo restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al telefono reale.
