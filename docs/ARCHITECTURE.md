# Architettura tecnica

## Decisione sintetica

L'app usa Expo SDK 57, React Native 0.86.3 ed Expo Router. La Home outcome-first
offre due percorsi distinti: opere autonome M4 e sessioni adattive M5. Yoga,
Massage, Relax, Meditation, Sleep e Focus scelgono prima la durata; Sound only
può costruire un piano Continuum, mentre Guided resta bloccato finché non
esistono voci registrate. Il player autonomo, le sessioni adattive e la route
separata `AUDIO TEST / TEST ONLY` usano tutti `AudioSessionController`, con
contratti distinti. Il controller resta il solo proprietario della sessione.
`ReactNativeAudioDriver` e `WebAudioDriver` restano dietro `AudioGraphDriver` e
`AudioEngine`.

RNAA dichiara peer aperti verso React Native ma la sua matrice pubblica non documenta ancora RN 0.86. Due compilazioni EAS Android e il playback della preview standalone con Metro spento dimostrano il percorso Android corrente; compatibilita iOS e comportamento su telefono reale restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## Adaptive Sessions M5

`SessionWorkProfile` è un registro di orchestrazione separato da
`ConsumerAudioWork`. Aggiunge intenti, famiglia estetica e armonica, energia,
densità, presenza melodica, compatibilità voce, ruoli di fase, boundary sicuri,
classe di transizione e stato offline. I valori correnti sono metadata QA
provvisori, non approvazione musicale.

`createAdaptiveSessionProgram()` è una funzione pura. Ordina stabilmente gli
input, usa il seed soltanto per spareggi riproducibili, costruisce quattro fasi
contigue e applica regole di fase più regole di transizione ALL-OF. Non ripete
opera o famiglia e accetta la storia delle tre sessioni recenti. I profili
provvisori sono esclusi per default e richiedono l'opt-in QA. Se non trova
quattro lavori e tre passaggi compatibili, fallisce esplicitamente.

Tutti i tempi del piano sono frame interi a 48 kHz. I passaggi rispettano i
boundary di loop registrati. La durata totale termina esattamente al frame
target; un'opera che richieda un finale editoriale non può essere tagliata. Per
i loop continui senza outro, il piano dichiara apertamente un inviluppo finale
controllato.

Il Web valida in anticipo i metadata di tutte le sorgenti, usa due deck
HTMLAudio soltanto durante il cambio, prepara la sorgente successiva e applica
curve Web Audio. Gli errori di una sorgente futura tornano al controller invece
di fermare silenziosamente la sessione. Il nativo fallisce chiuso: risoluzione dei
pacchetti scaricati, due decoder FLAC, scheduling e seek non sono ancora
implementati o validati su telefono.

Il manifest offline è indipendente dal catalogo e non contiene endpoint. Un
`OfflinePackageManager` orchestra spazio sui soli byte mancanti, staging
streaming, verifica, promozione/rollback atomici, retry, rimozione e recovery
attraverso interfacce `PackageSource`, `AudioBinaryStore` e
`OfflineStateStore`. Lo stato `available` viene riconciliato con presenza,
dimensione e hash dei file committed. La cartella localhost non è una delivery
mobile; l'implementazione nativa delle porte resta assente.

Il Router ha due radici: `src/app` consumer per default e `src/app-qa` soltanto
con `APP_RELAX_SURFACE=qa`. Il Workbench è in `src/qa`, non ha link consumer ed
è escluso dall'archivio EAS.

## Moduli

```text
src/app/                       route Expo Router
src/app-qa/                    root Router QA locale, esclusa da EAS
src/components/                componenti consumer
src/content/                   tab e registro editoriale consumer
src/domain/audio/              tipi e contratti puri
src/domain/sessions/           planner, curve e audit Continuum
src/domain/offline/            manifest e porte offline
src/audio/                     controller e porta graph driver
src/audio/reactNativeAudioApi/ adattatore nativo
src/audio/web/                 adattatore Web Audio per anteprima locale
src/audio/generators/          funzioni DSP pure/testabili
src/offline/                   manager, store e source adapter
src/qa/                        Workbench tecnico, escluso da EAS
src/state/                     persistenza serializzabile consumer
src/presets/                   registry dei preset
assets/audio/test-pack-01/     tre stem reali e manifest
assets/audio/placeholders/     fixture tecniche non referenziate
public/audio-catalog/           byte audio localhost, ignorati da Git
```

## Flusso di controllo

```text
Consumer tabs -> durata -> AdaptiveSessionPlan -> AudioSessionController
                         |                            |
                         v                            v
                  4 fasi / 3 cambi             Web dual deck QA

Soundscapes -> catalogo -> SingleTrackProgram -> AudioSessionController
                                                    |
                                                    v
                                      file source OPPURE noise buffer

Audio Test UI -> AudioSessionController -> AudioGraphDriver -> driver di piattaforma -> graph audio
                 |                     |
                 v                     v
             snapshot            eventi/lifecycle
                 |
                 v
            AsyncStorage
```

La UI non conserva handle nativi. Le route consumer non possiedono
`audioPresetId`: caricano soltanto un `SingleTrackProgram`, mai un preset o un
mixer. Tutti i comandi sono serializzati; `play`, `stop` e cleanup sono
idempotenti. Un fallimento
durante start ferma il graph prima di pubblicare lo stato di errore.

## Contratto AudioEngine

Il contratto copre:

- `loadPreset(preset)`;
- `loadProgram(singleTrackProgram)`;
- `loadAdaptiveSession(adaptiveSessionProgram)`;
- `seekAdaptiveSession(positionSeconds)`;
- `configureAdaptiveAudition(audition)`;
- `play()`, `pause()`, `stop()`, `dispose()`;
- `setSourceGain(sourceId, gain, fadeMs)`;
- `setSourceMuted(sourceId, muted, fadeMs)`;
- `setTimer(durationMinutes)`;
- `setVolume(volume)` per la singola sorgente consumer;
- `subscribe(listener)` e `getSnapshot()`;
- capability esplicite per background, notification controls, shared clock e synthesis.

Ogni sorgente pubblica `kind`, `loadingState`, `error`, `gain`, `muted` e `fadeState`.

## Audio graph

```text
drone file source ---- media element ---- gain --\
ambience file source - media element ---- gain ---\
texture file source -- media element ---- gain ----+--> master gain --> destination
left/right oscillators -----/
brown-noise loop buffer ----/

consumer file source --------> consumer gain --> master gain --> destination
        OPPURE
consumer colour-noise buffer -> consumer gain --> master gain --> destination
```

- I tre stem sono file source incrementali distinti, avviati sullo stesso clock e loopabili; non vengono decodificati integralmente in `AudioBuffer`.
- Ogni file viene prima instradato tramite `MediaElementAudioSourceNode`, evitando il collegamento automatico alla destination e quindi playback duplicato/bypass del gain.
- `expo-asset` scarica ogni WAV su un `file://` locale; hash MD5 atteso e URI distinta sono condizioni di load.
- Il binaural usa due oscillatori sinusoidali, uno per canale tramite stereo panner.
- Il brown noise e generato in un buffer PCM a runtime e riprodotto in loop.
- Il catalogo consumer offre otto colour-noise generati su richiesta. Un solo
  buffer stereo Float32 da 8 secondi esiste alla volta; nessun file viene
  scaricato o incorporato e nessun consumer mixer viene creato.
- Ogni sorgente ha un gain node; il master applica fade-in e fade-out.
- La risoluzione di piattaforma usa `createAudioDriver.web.ts` nel browser e
  `createAudioDriver.ts` nelle build native. Il driver web riproduce gli asset
  Metro tramite `HTMLAudioElement` instradato nel Web Audio graph e genera i
  noise in `AudioBuffer`; non dichiara background o notification controls.
- Le opere approvate ma non incorporate risolvono nel solo browser un filename
  locale sotto `/audio-catalog/`. Il server supporta byte range e carica un
  solo file on demand; Android/iOS non considerano questa disponibilità come
  asset mobile.
- `react-native-worklets` e presente per soddisfare il peer nativo di RNAA; questa slice non implementa un worklet custom.
- Il mix iniziale conserva headroom. Loudness e qualita definitivi restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino all'ascolto su telefono.

## Parametri preset

```ts
type AudioPreset = {
  schemaVersion: 1;
  id: string;
  goal: "sleep" | "calm" | "focus" | "meditate";
  tuningLabel: string;
  carrierHz: number;
  beatHz: number;
  noise: { type: "brown" };
  stems: StemDefinition[];
  defaultMix: Record<AudioSourceId, number>;
  durationOptionsMinutes: number[];
  variation?: VariationPlan;
};
```

`tuningLabel` non alimenta alcun calcolo del binaural beat. Carrier e beat sono decisioni di sound design, non claim clinici.

## Timer e fade

Il controller memorizza una deadline assoluta. Per preset e opere autonome il
driver pianifica master fade e `stop(endAt)`. Per le sessioni adattive il piano
possiede già transizioni e inviluppo finale, quindi il controller non aggiunge
un secondo fade globale. Il ticker JS aggiorna la UI e chiude una sola volta.
Un cambio timer durante playback è rifiutato; dopo pausa la deadline viene
ricostruita sul tempo residuo.

La pulizia immediata di notification/foreground service con JavaScript totalmente sospeso resta da osservare su telefono: il graph audio si arresta sul clock nativo, mentre la finalizzazione di sistema viene riconciliata quando JS riprende.

## Persistenza

AsyncStorage salva payload versionati. Il percorso tecnico conserva preset,
durata, gain e mute; il player autonomo conserva opera, durata e volume; M5
conserva soltanto l'ultima richiesta Sound only e le tre sequenze recenti. Seed,
piano, nodi, deadline e stato `playing` non vengono ripristinati dal consumer.
Il Workbench ha uno store QA separato che può salvare il seed per riprodurre un
test.

## Background e sistema

Il config plugin RNAA genera `UIBackgroundModes=audio` su iOS e un foreground service `mediaPlayback` su Android. I controlli di sistema richiedono permesso notification quando applicabile e degradano senza fermare l'audio se negato. La pausa causata da interruzione e distinta dalla pausa manuale, per evitare resume spurii.

La configurazione e stata verificata tramite prebuild isolato, ma lock-screen, interruzioni, Bluetooth e sessioni lunghe richiedono telefono reale.

## EAS e native build

- Gate locale: lint, typecheck, test, config, Metro/export; non compila codice nativo.
- Gate EAS Android: profilo `development-android`, APK interno, immagine SDK 57 fissata.
- Gate EAS Android preview: profilo `preview-android`, APK interno standalone con bundle e asset incorporati.
- Gate EAS iOS: profilo `development-ios`, immagine Xcode 26.6 fissata, firma Apple separata.
- `extra.eas.projectId` collega il progetto EAS autorizzato `@robert-fulton-studio/app-relax`.
- Identificativo provvisorio comune: `com.robertfultonstudio.apprelax`; sintassi validata, disponibilita sugli account non verificabile senza login.

## Limiti M5 dichiarati

- Preview Web Audio: adatta a pianificazione, audit e ascolto locale; scheduling
  HTMLAudio non è prova sample-accurate.
- Native adaptive playback e download reali: `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`.
- Guided: contratto/UI soltanto, senza voce fittizia.
- Qualità di ogni transizione: gate umano distinto dall'approvazione dei file.

## Alternative escluse

- `expo-audio`: fallback possibile per playback a stem solo se emerge un blocker nativo riproducibile; nessun cambio silenzioso.
- Worklet DSP custom: non necessario per oscillator e buffer noise iniziali.
- Zoom: nessuna superficie Zoom corrisponde a un'app consumer audio autonoma.
- OpenAI API: nessuna feature AI e richiesta; introdurla aggiungerebbe backend, costi e trattamento dati fuori scope.
