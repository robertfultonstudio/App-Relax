# M4 Consumer Audio Catalog

Stato: `LOCALHOST_CATALOG_READY — ECLYPSIS AND NIRVANA WAVES REMOVED`

## Confine di prodotto

[F] Il catalogo contiene 48 entità autonome: 40 opere file-backed (13 derivati
analogici, 24 opere Water/Air e i tre file canonici ATP01) e otto generatori
noise runtime. Ogni programma consumer contiene una sola sorgente:
un file in loop oppure un buffer noise generato sul device. Pad e piano della
stessa famiglia sono varianti editoriali separate; non possono essere sommate.
Il mixer multilayer,
`Moon Current` e `deep-sleep-432` restano esclusivamente in `AUDIO TEST / TEST
ONLY`.

[F] Il player consumer offre Play/Pause/Stop, timer 15/30/60 e volume principale.
Il volume 0–100% moltiplica il `playbackGainDb` interno; nessun master è stato
rinormalizzato e non viene applicato alcun limiter.

## Noise colours generati

[F] La collezione `Noise Colours` genera in memoria, soltanto quando richiesta,
otto profili: White, Pink, Brown/Red, Blue/Azure, Violet/Purple, Grey/Gray,
Green e Black. Red e Purple sono alias, non generatori duplicati. Ogni buffer è
Float32 stereo 48 kHz, lungo 8 secondi, centrato, limitato a 0,5 sample peak e
raccordato al confine di loop. Il gain interno di -6 dB porta il ceiling sample teorico a
circa -12,02 dBFS prima del volume utente. Nessun file audio o byte persistente
viene aggiunto al pacchetto.

[F] White, Pink, Brown, Blue e Violet seguono i consueti profili spettrali da
chiaro a scuro. Grey, Green e Black non hanno una definizione universale:
nell'app sono esplicitamente descritti come profili non standard,
rispettivamente bilanciato, mid-band e profondo con intervalli quieti lenti. Il
silenzio resta Stop/Mute.

[U] Qualità percepita, assenza di fatica, resa del raccordo e comportamento in
background su telefono reale sono `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## Catalogo analogico e ATP01

L'utente ha confermato il 3 settembre 2026 l'esito positivo dell'ascolto dei 15
lavori analogici, quindi il 4 settembre ha respinto Eclypsis / Eclipse Veil e
ha ordinato di eliminare Nirvana Waves / Stillwater Halo. Restano 13 lavori
analogici con stato
`APPROVED — LISTENING PASSED`; i working title restano metadata editoriali
modificabili. Soft Air non appartiene a questo gruppo: resta respinto e
soltanto tecnico.

[F] `Eclipse Veil` e `Stillwater Halo` non appartengono più al catalogo
consumer, alle route, alle relazioni Continuum o ai pacchetti QA. I master
canonici esterni restano intatti come archivio.

| Titolo            | Outcome primario | Famiglia                | Gain dB | TP post-gain dBTP | Stato byte                 |
| ----------------- | ---------------- | ----------------------- | ------: | ----------------: | -------------------------- |
| Mineral Drift     | Massage          | Standalone works        |  +0.019 |            -2.641 | WAV localhost verificato   |
| Astral Thread     | Focus            | Cosmic / Zen ambient    |  -0.001 |            -6.481 | WAV localhost verificato   |
| Celestial Current | Meditation       | Cosmic / Zen ambient    |   0.000 |            -6.400 | WAV localhost verificato   |
| Quiet Field       | Yoga             | Cosmic / Zen ambient    |  -0.003 |            -5.533 | WAV localhost verificato   |
| Cedar Current     | Yoga             | Cosmic / Zen ambient    |   0.000 |            -6.830 | WAV localhost verificato   |
| Moonlit Veil      | Sleep            | Cosmic / Zen ambient    |  +3.574 |            -5.286 | WAV localhost verificato   |
| Moonlit Keys      | Massage          | Standalone works        |  +2.687 |            -4.903 | WAV localhost verificato   |
| Luminous Grain    | Focus            | Cosmic / Zen ambient    |  +1.485 |            -6.605 | WAV localhost verificato   |
| Luminous Steps    | Massage          | Standalone works        |  +5.178 |            -4.592 | WAV localhost verificato   |
| Distant Garden    | Meditation       | Cosmic / Zen ambient    |  +2.048 |            -5.762 | WAV localhost verificato   |
| Distant Bloom     | Relax            | Standalone works        |  +3.763 |            -4.337 | WAV localhost verificato   |
| Aquarian Drift    | Meditation       | Cosmic / Zen ambient    |  +3.064 |            -3.886 | WAV localhost verificato   |
| Aquarian Echo     | Massage          | Standalone works        |  +2.329 |            -3.001 | WAV localhost verificato   |
| Moon Drone        | Sleep            | Cosmic / Zen ambient    |  -4.000 |            -6.020 | WAV ATP01 riusato          |
| Deep River        | Relax / Sleep    | Elemental Worlds: Water |  +2.028 |            -5.982 | WAV ATP01 riusato          |
| Soft Air          | Focus / Relax    | Elemental Worlds: Air   |  -4.001 |            -6.021 | RESPINTO · solo AUDIO TEST |

`Deep River` non è descritto come field recording: la provenienza disponibile
non basta a sostenere quel claim. Soltanto `Second Element: Air`, dotato di
provenienza esplicita, entra in Esoteric Series.

## Elemental Water / Esoteric Air approvati

I 24 derivati di `APP_READY_AUDIO_02_ELEMENTAL_WATER_AIR` sono stati approvati
all'ascolto dall'utente e usano gain di playback 0 dB: i livelli più quieti
restano intenzionali e non vengono spinti contro il ceiling.

| Gruppo                | Titoli                                              | Funzione primaria |
| --------------------- | --------------------------------------------------- | ----------------- |
| Rain                  | Silver Canopy; Fine Rain; Rain Veil; Distant Shower | Focus             |
| Rain                  | Soft Weather; Misted Garden; Quiet Weather          | Relax             |
| Rain                  | Deep Rain; Sheltered Rain; Low Rain; Rain Receding  | Sleep             |
| Stream                | Stone Current; Moss Current                         | Relax             |
| Stream                | Hidden Water                                        | Meditation        |
| Stream                | Clear Stream; Cedar Stream                          | Focus             |
| Sea                   | Tidal Breath; Open Tide; Pearl Tide; Blue Interval  | Meditation        |
| Sea                   | Moon Shore; Night Shore; Distant Surf               | Sleep             |
| Esoteric Series / Air | Second Element: Air                                 | Meditation        |

[F] L'ordine editoriale di Meditation privilegia i suoni marini approvati:
`Open Tide` è il lavoro featured, seguito da `Tidal Breath`, `Pearl Tide`,
`Blue Interval`, `Moon Shore` e `Night Shore`. Eclypsis / Eclipse Veil è stato
eliminato dal catalogo Meditation e da ogni altra superficie consumer.

[F] Soft Air è stato respinto all'ascolto il 2 settembre 2026: l'utente lo
descrive come una ventola potente, simile all'interno di un aereo. La route
consumer è disabilitata e richiede un asset sostitutivo; il WAV canonico non è
stato cancellato né modificato perché resta uno dei tre stem ATP01 del percorso
tecnico separato.

## Lossless e dimensioni

[F] I 18 WAV PCM24/48 kHz stereo totalizzano **2.563.271.952 byte**. I 18 FLAC
level 8 totalizzano **1.455.254.377 byte**, con risparmio esatto di
**1.108.017.575 byte (43,2267%)**. Per ogni file il PCM decodificato ha lo stesso
SHA-256 del data chunk WAV: sample rate, canali, frame count, durata, LUFS e seam
restano quindi invariati. Il report per-file è
`docs/M4_LOSSLESS_DERIVATIVE_REPORT.json`.

[F] Questi totali restano prova storica del batch di conversione e includono
anche Eclypsis e Nirvana Waves. Non sono il manifest del catalogo attivo e non
ne autorizzano la reintroduzione.

[F] La preview localhost contiene 37 file per **2.657.446.897 byte**: i 13 WAV
analogici ancora approvati, invariati, per **2.309.021.732 byte** e 24 FLAC
Water/Air invariati per **348.425.165 byte**. Tutte le 37 opere approvate
attive sono riproducibili. I byte sono richiesti uno alla volta e sono
ignorati da Git; manifest e hash sono in
`docs/M4_LOCAL_LISTENING_MANIFEST.json`.

[F] Expo copia la cartella `public/` nell'output di un export locale quando i
file sono presenti sul Mac. Questo comportamento non trasforma il catalogo
localhost in asset nativi: `.easignore` esclude ora l'intera
`public/audio-catalog/` dall'archivio EAS e il validatore fallisce se anche un
solo file della cartella entra nel pacchetto sorgente.

[F] Starter FLAC consumer: vuoto dopo l'esclusione di Eclipse Veil. Restano
referenziati nell'archivio base soltanto i tre WAV ATP01 per **155.520.132
byte**. Il pacchetto app perde 28.167.925 byte rispetto allo stato precedente;
il peso finale APK/AAB è `NON DETERMINATO — EVIDENZA INSUFFICIENTE` senza una
build autorizzata.
I generatori noise aggiungono solo codice e memoria temporanea: **0 byte audio**
all'archivio.

[F] Il catalogo FLAC completo richiederebbe circa 1,455 GB di soli file audio.
Diversi file superano 100 MB, incluso `Mineral Drift` a 208.526.921 byte. GitHub
normale non può ospitarli: servono Git LFS o asset delivery, entrambi fuori dal
perimetro autorizzato.

## Provenienza e gate

[F] Riferimento canonico: pack `APP_READY_AUDIO_01`, manifest
`qa/APP_READY_AUDIO_01_MANIFEST.json`, map `qa/APP_READY_AUDIO_01_MAP.csv` e
controllo true peak `qa/ANALOG_TRUE_PEAK_CHECK.json`. I master e l'archivio
approvato sono rimasti in sola lettura.

[F] Encoder: libFLAC 1.3.3, level 8, verify, nessun padding/seektable/tag
aggiuntivo. Il validatore riproducibile è
`scripts/verify-lossless-derivatives.mjs`.

[F] Nel localhost tutte le 38 opere ancora approvate hanno completato il percorso
Play → Pause senza alert o errori console. Il server espone byte range per WAV e
FLAC e il driver Web Audio applica loop e volume principale.

[U] Il percorso nativo FLAC `expo-asset → file:// → createFileSource(loop=true)`
resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE` per il catalogo completo. La
prova web e l'approvazione d'ascolto non certificano packaging, background,
Bluetooth o prestazioni su telefono.
