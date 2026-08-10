# Architettura tecnica

## Decisione sintetica

L'app usa Expo SDK 57, React Native 0.86.2 ed Expo Router con un'architettura a porte e adattatori per l'audio. `AudioSessionController` e il solo proprietario della sessione; la UI osserva snapshot serializzabili e invia comandi. `ReactNativeAudioDriver` usa `react-native-audio-api` 0.13.2 dietro `AudioGraphDriver` e `AudioEngine`.

RNAA dichiara peer aperti verso React Native ma la sua matrice pubblica non documenta ancora RN 0.86. La compatibilita nativa e quindi `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino ai gate EAS; l'assenza della riga in matrice non e da sola un blocker dimostrato.

## Moduli

```text
src/app/                       route Expo Router
src/components/                componenti consumer
src/domain/audio/              tipi e contratti puri
src/audio/                     controller e porta graph driver
src/audio/reactNativeAudioApi/ adattatore nativo
src/audio/generators/          funzioni DSP pure/testabili
src/state/                     persistenza serializzabile
src/presets/                   registry dei preset
assets/audio/placeholders/     stem autoprodotti e manifest
```

## Flusso di controllo

```text
UI -> AudioSessionController -> AudioGraphDriver -> React Native Audio API -> graph nativo
                 |                     |
                 v                     v
             snapshot            eventi/lifecycle
                 |
                 v
            AsyncStorage
```

La UI non conserva handle nativi. I comandi sono serializzati; `play`, `stop` e cleanup sono idempotenti. Un fallimento durante start ferma il graph prima di pubblicare lo stato di errore.

## Contratto AudioEngine

Il contratto copre:

- `loadPreset(preset)`;
- `play()`, `pause()`, `stop()`, `dispose()`;
- `setSourceGain(sourceId, gain, fadeMs)`;
- `setSourceMuted(sourceId, muted, fadeMs)`;
- `setTimer(durationMinutes)`;
- `subscribe(listener)` e `getSnapshot()`;
- capability esplicite per background, notification controls, shared clock e synthesis.

Ogni sorgente pubblica `kind`, `loadingState`, `error`, `gain`, `muted` e `fadeState`.

## Audio graph

```text
drone buffer ---- gain --\
ambience buffer - gain ---\
texture buffer -- gain ----+--> master gain --> destination
left/right oscillators -----/
brown-noise loop buffer ----/
```

- I tre stem sono `AudioBufferSourceNode` distinti, avviati sullo stesso clock e loopabili.
- Il binaural usa due oscillatori sinusoidali, uno per canale tramite stereo panner.
- Il brown noise e generato in un buffer PCM a runtime e riprodotto in loop.
- Ogni sorgente ha un gain node; il master applica fade-in e fade-out.
- `react-native-worklets` e presente per soddisfare il peer nativo di RNAA; questa slice non implementa un worklet custom.
- Il mix iniziale conserva headroom. Loudness e qualita definitivi restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino ai WAV reali e all'ascolto su device.

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

Il controller memorizza una deadline assoluta. Il driver pianifica master fade e `stop(endAt)` di buffer/oscillatori sul clock audio, cosi il suono termina anche se i timer JavaScript vengono sospesi. Il ticker JS aggiorna la UI e, al risveglio, chiude notification/audio session una sola volta. Un cambio timer durante playback e rifiutato; dopo pausa la deadline viene ricostruita sul tempo residuo.

La pulizia immediata di notification/foreground service con JavaScript totalmente sospeso resta da osservare su telefono: il graph audio si arresta sul clock nativo, mentre la finalizzazione di sistema viene riconciliata quando JS riprende.

## Persistenza

AsyncStorage salva un payload versionato con ultimo preset, durata, gain e mute. L'idratazione precede atomicamente il load del preset. Non si salvano nodi nativi, deadline o stato `playing`; l'app non riparte in autoplay.

## Background e sistema

Il config plugin RNAA genera `UIBackgroundModes=audio` su iOS e un foreground service `mediaPlayback` su Android. I controlli di sistema richiedono permesso notification quando applicabile e degradano senza fermare l'audio se negato. La pausa causata da interruzione e distinta dalla pausa manuale, per evitare resume spurii.

La configurazione e stata verificata tramite prebuild isolato, ma lock-screen, interruzioni, Bluetooth e sessioni lunghe richiedono telefono reale.

## EAS e native build

- Gate locale: lint, typecheck, test, config, Metro/export; non compila codice nativo.
- Gate EAS Android: profilo `development-android`, APK interno, immagine SDK 57 fissata.
- Gate EAS iOS: profilo `development-ios`, immagine Xcode 26.6 fissata, firma Apple separata.
- `extra.eas.projectId` e volutamente assente finche il project linking non viene autorizzato.
- Identificativo provvisorio comune: `com.robertfultonstudio.apprelax`; sintassi validata, disponibilita sugli account non verificabile senza login.

## Variabilita futura

`VariationPlan` puo descrivere pool di layer, finestre di rotazione, macro-mix states e seed, ma il sequencer non viene implementato ora. Questa estensione non modifica il contratto UI-controller-engine.

## Alternative escluse

- `expo-audio`: fallback possibile per playback a stem solo se emerge un blocker nativo riproducibile; nessun cambio silenzioso.
- Worklet DSP custom: non necessario per oscillator e buffer noise iniziali.
- Zoom: nessuna superficie Zoom corrisponde a un'app consumer audio autonoma.
- OpenAI API: nessuna feature AI e richiesta; introdurla aggiungerebbe backend, costi e trattamento dati fuori scope.
