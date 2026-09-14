# A01 — Adattività nativa: gate software, non certificazione device

5 settembre 2026 · worktree isolato `app-relax-audit-native-20260905`

## Esito e confini

### D-103 — APK1.0.3/4: correzione Ocean verificata standalone

[F] Unica build autorizzata a costo zero conclusa; stessa firma, dati47/47
conservati nell'aggiornamento. Hatha90+Ocean parte e prosegue oltre prima
giunzione a516s; pausa/ripresa, volume/mute separati, Rain→Stop→Ocean e Stop
verificati senza Metro. Non è un ascolto umano o un test90min completo.
Il solo residuo tecnico legacy Audio Test è già documentato, fuori dalla
navigazione consumer. Rapporto completo: `ANDROID_APK_D103_PREFLIGHT.md`.
Le versioni1.0.1/1.0.2 sotto conservano gli esiti negativi storici.

### D-102 — correzione locale Ocean verificata; APK non aggiornata

[F] Riprodotto il timeout di conferma posizione del decoder Hatha02 e
corretti allocazione iniziale e recupero limitato dello seek. Nel development
client: Ocean parte, supera la prima giunzione musicale, pausa/ripresa/mute
e Rain → Stop → Ocean passano. Diagnostica rimossa, processi spenti.
653 test generali e 257 audio verdi. Rapporto: `ANDROID_OCEAN_D102_FIX.md`.

[U] L'APK 1.0.2/3 sotto conserva il FAIL: D-102 non è compilata in quel
file. Nuova APK e ascolto su telefono sono ancora gate separati.

### D-101 — APK1.0.2/3: Rain osservata, Ocean waves fallisce

[F] Nuova APK consumer compilata e installata su AVD API34 x86_64,
senza Metro.47/47 registrazioni importate conservate. Hatha90+Rain avviata,
pausa/ripresa, volume/mute distinti e Stop→Ready osservati; segnale presente
oltre il tempo previsto della prima giunzione. Non è ascolto umano.

[F] Ocean waves fallisce l'avvio, al Retry e dopo riavvio pulito. Gate
complessivo FAIL, nonostante647 test e audit statici verdi. Causa nativa
esatta NON DETERMINATO — EVIDENZA INSUFFICIENTE; possibile finestra seek
persa, non ancora riprodotta con errore interno. Nessuna patch speculativa
o build aggiuntiva. Artefatto, hash e prove in `ANDROID_APK_D101_PREFLIGHT.md`.
Le sezioni seguenti conservano i risultati storici, non lo stato corrente.

### D-097 — collegamento Android interno autorizzato

[F] Factory/storage reali e import locale verificato ora implementati per il
solo profilo preview-android. Piani Hatha30/45/60/90, famiglia Rain/Ocean e
guardia di preparazione10s testati; file47/47 verificati nel kit esterno.
Le note sotto descrivono i gate storici, non una factory ancora scollegata.
Dettagli in `ANDROID_CONSUMER_OFFLINE_KIT.md`. La certificazione su telefono
e l'APK restano gate distinti, non dedotti da questa integrazione software.

[F] Chiusura prova D-097: APK1.0.1/2 compilata/installata,47/47 importati
realmente. Singole opere WAV/FLAC producono segnale nativo; Hatha90 con/senza
ambiente fallisce. Gate di consegna quindi FAIL. Nel sorgente è corretto un
overlap numerico delle curve dimostrato da un mock più fedele alla libreria;
644 test passano, ma quella correzione non è nell'APK e la prova nativa deve
essere ripetuta dopo una nuova build autorizzata. Nessuna garanzia implicita.

### Aggiornamento locale D-095 — 13 settembre 2026

[F] Corretta la divergenza di gain descritta storicamente sotto: bus musica0,5
e natura0–0,5, test dei livelli/mute; Stop impedisce il completamento tardivo
di load/start/resume. La singola opera accetta ora lease verificate oltre
agli asset incorporati. D-095 registra30 test nelle due suite native e624
complessivi. Nessuna factory o delivery concreta ancora abilitata; quelle
correzioni non chiudono i gate di decoder/background su device.

### Blocco aggiuntivo rilevato prima del checkpoint D-068

[F] L'audit statico del 6 settembre rileva che `AdaptiveNativePlayback`
collega la musica direttamente a `sessionBus` e applica a `natureBus` il
livello natura senza la divisione 0,5 prevista da `fixed-music-equal-ceiling`.
Il Web applica invece 0,5 alla musica e 0,5 × livello alla natura. Per un
piano composito, il solo `compositeHeadroomTrimDb` non conserva quindi il
medesimo margine del Web; alzando la natura è possibile un overshoot.
Il test nativo corrente del bus principale non prova questa parità.

[F] Non è un percorso attivo nell'app: `isAdaptivePlaybackAvailable`
richiede Web e la factory nativa crea `ReactNativeAudioDriver` senza resolver;
`loadAdaptiveSession` fallisce prima di creare il grafo. Il checkpoint locale
preserva questo codice in preparazione senza correggerlo o abilitarlo sotto
il solo mandato di commit/UI. Non riguarda la PWA pubblicata.

[I] Prima di collegare il resolver o attivare musica+natura nativa: allineare
il gain delle corsie al contratto Web, correggere/estendere il test nativo e
verificare volume natura 0/50/100%, mute e crossfade sfalsati rispetto al
bound di picco del planner. Poi restano necessarie build e prove device.

[F] Consolidamento root: sorgenti e test integrati; Expo aggiornato localmente
a 57.0.20 (Router 57.0.19) per il gate Doctor 20/20. Il report di lavoro sotto
conserva le versioni/esecuzioni osservate al momento del suo handoff.
`createAudioDriver()` non inietta ancora un resolver: l'adattività nativa è
esplicitamente indisponibile, non soltanto in attesa di un test. La PWA usa
un adapter separato; il suo successo offline non chiude questo gate.

[F] Implementato uno scheduler nativo dietro `ReactNativeAudioDriver` e il
contratto esistente `AudioGraphDriver`. La UI continua a passare da
`AudioSessionController`. Nessuna capability o disponibilità consumer è stata
sbloccata, nessuna coppia musicale approvata è stata inventata. Il costruttore
senza resolver conserva il fallimento esplicito dei pacchetti mancanti.

[F] Il driver accetta soltanto lease di file locali verificati tramite un
resolver iniettato. Il contratto è strutturalmente compatibile con quello A02:

```ts
interface NativeAudioSourceResolver {
  acquire(workId: string): Promise<VerifiedNativeAudioFile | null>;
}
interface VerifiedNativeAudioFile {
  uri: string; // file:/// assoluto, mai HTTP, localhost o un URL privato
  workId: string;
  sha256: string;
  byteSize: number;
  release(): Promise<void> | void;
}
```

[F] `acquire` è il confine di fiducia: l'adapter deve confrontare dimensione e
SHA-256 correnti con un manifest attendibile e impedire rimozione/sostituzione
fino a `release`. Il driver verifica struttura e identità della lease, non
inventa un secondo filesystem né scambia una stringa SHA-256 per un hash
calcolato. Tutte le opere del piano devono ottenere una lease prima di Play;
errore o cancellazione rilasciano anche le lease acquisite parzialmente o
arrivate dopo Stop. Nessuna factory di produzione è stata collegata a uno
storage fittizio. La selezione nativa resta un gate di integrazione A02.

## Comportamento implementato

- [F] File source incrementali RNAA, mai decode completo in RAM. Binding a
  `MediaElementAudioSourceNode` prima di start, così il file non bypassa il gain.
- [F] Massimo due sorgenti assegnate per la corsia naturale; massimo tre per
  due corsie coordinate. Si preparano sorgenti attive e una successiva se
  esiste uno slot. Le due registrazioni della corsia natura appartengono al
  piano; la validazione editoriale della famiglia resta responsabilità del
  planner, non è dedotta da filename nel driver.
- [F] Trim opera/segmento e headroom composito; curve equal-power o linear
  schedulate sul clock audio, con resto della curva corretto dopo seek.
  Bus principale e natura separati, mute natura realmente a gain zero.
- [F] Pausa/ripresa attraverso il clock sospeso del contesto; seek cancella
  graph/preload precedenti e ricrea soltanto i deck necessari. Una barriera
  comune mantiene il bus silenzioso finché tutte le posizioni iniziali sono
  confermate; una sorgente fallita pulisce l'intero tentativo.
- [F] Stop dei segmenti e finale schedulati sul clock nativo. Stop manuale
  resta disponibile durante il fade a livello driver. Prima di rimuovere il
  binding viene chiamato `pause`: il codice RNAA può altrimenti riconnettere
  automaticamente una sorgente raw ancora in esecuzione alla destinazione.
- [F] Fine/errore inoltrati al controller; timer di preload, preparazioni e
  lease ripuliti. Stop tenta tutti i rilasci anche dopo errori di gain,
  disconnect o suspend. `AUDIO TEST` e single-track embedded/noise restano
  regressioni separate; QA audition nativa non implementata.

## Limiti reali della versione RNAA fissata

[F] La versione installata è RNAA **0.13.2**, con Expo **57.0.19**, React Native
**0.86.3** e TypeScript **6.0.3**. Sono stati letti i sorgenti TypeScript/JSI e
C++ del package installato, senza modificarlo. Le API usate esistono:
`context.createFileSource`, `duration/currentTime`, `start/stop/pause`,
`seekToTime`, `createMediaElementSource`, `AudioParam.setValueCurveAtTime`.
Riferimenti primari:
[JSI 0.13.2](https://github.com/software-mansion/react-native-audio-api/blob/0.13.2/packages/react-native-audio-api/src/jsi-interfaces.ts),
[AudioParam](https://docs.swmansion.com/react-native-audio-api/docs/core/audio-param/).

[F] Il seek C++ viene inviato a un decoder worker: non espone una Promise
`seeked` o un evento dedicato di errore decoder. La preparazione avvia il
decoder dietro gain zero e osserva `currentTime` entro cinque secondi, richiedendo
un avanzamento tra 0 e 100 ms rispetto al punto richiesto, poi mette in pausa
la sorgente. Questa è una barriera software conservativa, **non seek
sample-accurate**: l'ingresso conserva il piccolo avanzamento osservato.
L'assenza di avanzamento o la durata incoerente falliscono chiusi. Un watchdog
durante Play rileva posizione non finita o ferma per più di cinque secondi;
non misura segnale acustico, drop audio o qualità musicale.

[F] Curve e Stop dei deck già preparati sono sul clock nativo. La sostituzione
progressiva del decoder richiede invece JavaScript; se il thread perde una
scadenza, la sessione viene fermata invece di partire in ritardo con un falso
stato valido. Questo non completa il gate background. Il limite dei deck è
provato sul graph applicativo; i tempi reali del rilascio dei decoder C++/GC e
il picco di memoria necessitano misura nativa.

[U] Primo suono, decoder WAV/FLAC simultanei, precisione effettiva di
start/seek/Stop, pause, transizioni, durata lunga, interruzioni, background,
schermo bloccato, Bluetooth, consumo, batteria, memoria e qualità su telefono:
**NON DETERMINATO — EVIDENZA INSUFFICIENTE**. Nessun test JavaScript chiude A01
come MVP mobile finale.

## Toolchain e verifiche

[F] Tutti i comandi JavaScript usano il Node isolato
`/Users/RF/.nvm/versions/node/v22.23.1/bin/node`; nessuna installazione di
dipendenze, nessuna scrittura in `node_modules`, nessun Node di sistema.

[F] Inventario read-only: macOS 13.7.8, Xcode 15.2 (15C500b); `pod` non trovato;
`java_home -V` non trova JDK; Android `platforms` e `build-tools` assenti.
`platform-tools` ed `emulator` esistono, ma non sono stati avviati. Xcode non
raggiunge il prerequisito SDK 57 già registrato nel runbook; nessuna
compilazione nativa locale realistica è stata tentata. Nessun `expo run`, EAS,
prebuild, nuova installazione o nuovo lancio emulatore.

[F] TypeScript strict e lint mirato verdi. La prima suite completa ha dato
227/228 test verdi: unico fallimento per timeout di cinque secondi nel render
QA Workbench, file non modificato da A01. Il rerun isolato Workbench più tutta
la regressione audio è verde: 10 suite / 100 test. Nessun timeout nei file è
stato aumentato. L'ultima esecuzione completa è verde: **41 suite / 229 test**,
incluso il nuovo caso Stop con errori nativi. La regressione audio conta
**9 suite / 91 test**; il subset dei tre file nativi conta **35 test**.

Comandi ripetibili nel worktree (usare sempre il Node sopra):

```bash
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/jest/bin/jest.js tests/audio --runInBand --cacheDirectory tmp/jest-cache
node node_modules/jest/bin/jest.js --runInBand --cacheDirectory tmp/jest-cache
```

## Prossimi gate, non eseguiti

1. [I] Integrare un adapter nativo A02 reale e iniettare il resolver, senza
   modificare disponibilità o audio approvati in base ai soli test.
2. [I] Ispezionare export e archivio corrente, definire esattamente uno starter
   verificato e ottenere le autorizzazioni separate per build Android e iOS.
3. [I] Installare artefatto corrente su telefoni già disponibili e misurare
   durata e posizione, inclusi avvio/seek dentro un overlap, Stop durante fade,
   file mancante/corrotto, rimozione con lease attiva e tutte le condizioni
   native elencate. Il gate d'ascolto dell'autore resta obbligatorio.

[F] Nessun audio, master o file di catalogo modificato/copiato/convertito;
nessun commit, push, PR, EAS, upload, pubblicazione Sites, acquisto o asset
delivery. Le modifiche A01 sono soltanto sorgenti del driver, test e questo
rapporto, da integrare selettivamente nel checkout canonico.

# Follow-up Stop durante avvio pendente — 6 settembre 2026

[F] La correzione controller D-063 evita teardown ripetuti nel Web/PWA.
L'audit del driver nativo trova una race preesistente, non introdotta dalla
correzione: Start o Resume possono proseguire dopo await context.resume o
setAudioSessionActivity anche se Stop/Dispose hanno già terminato. I vecchi
Stop duplicati non sincronizzavano questo completamento tardivo.

[U] Garanzia nativa su questo caso: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
Prima del relativo gate servono generation guard su Start/Resume/Load,
invalidazione all'inizio di Stop, disposed prima del primo await di Dispose,
verifica dopo ogni await e prima di source.start/fade/notifiche. Adaptive deve
verificare anche l'identità dell'istanza. Test: activity/resume differiti,
Stop/Dispose, risoluzione tardiva senza riavvio, focus o notifica Playing.
Questo follow-up non autorizza build o installazioni native e non riapre
il catalogo o gli abbinamenti musicali respinti.
