# M4 Consumer Audio Catalog

Stato: `TECHNICAL_PASS_LISTENING_PENDING`

## Confine di prodotto

[F] Il catalogo contiene 18 opere autonome: 15 derivati analogici e i tre file
canonici ATP01 riusati per riferimento, senza duplicare i byte. Ogni programma
consumer contiene un solo file in loop. Pad e piano della stessa famiglia sono
varianti editoriali separate; non possono essere sommate. Il mixer multilayer,
`Moon Current` e `deep-sleep-432` restano esclusivamente in `AUDIO TEST / TEST
ONLY`.

[F] Il player consumer offre Play/Pause/Stop, timer 15/30/60 e volume principale.
Il volume 0–100% moltiplica il `playbackGainDb` interno; nessun master è stato
rinormalizzato e non viene applicato alcun limiter.

## Catalogo provvisorio

Tutti i titoli sono `PROVISIONAL — LISTENING APPROVAL REQUIRED`.

| Titolo            | Outcome primario | Famiglia                | Gain dB | TP post-gain dBTP | Stato byte               |
| ----------------- | ---------------- | ----------------------- | ------: | ----------------: | ------------------------ |
| Eclipse Veil      | Meditation       | Cosmic / Zen ambient    |  -0.001 |            -5.931 | FLAC starter incorporato |
| Stillwater Halo   | Relax            | Cosmic / Zen ambient    |  +0.002 |            -5.068 | FLAC esterno pronto      |
| Mineral Drift     | Massage          | Standalone works        |  +0.019 |            -2.641 | FLAC esterno pronto      |
| Astral Thread     | Focus            | Cosmic / Zen ambient    |  -0.001 |            -6.481 | FLAC esterno pronto      |
| Celestial Current | Meditation       | Cosmic / Zen ambient    |   0.000 |            -6.400 | FLAC esterno pronto      |
| Quiet Field       | Yoga             | Cosmic / Zen ambient    |  -0.003 |            -5.533 | FLAC esterno pronto      |
| Cedar Current     | Yoga             | Cosmic / Zen ambient    |   0.000 |            -6.830 | FLAC esterno pronto      |
| Moonlit Veil      | Sleep            | Cosmic / Zen ambient    |  +3.574 |            -5.286 | FLAC esterno pronto      |
| Moonlit Keys      | Massage          | Standalone works        |  +2.687 |            -4.903 | FLAC esterno pronto      |
| Luminous Grain    | Focus            | Cosmic / Zen ambient    |  +1.485 |            -6.605 | FLAC esterno pronto      |
| Luminous Steps    | Massage          | Standalone works        |  +5.178 |            -4.592 | FLAC esterno pronto      |
| Distant Garden    | Meditation       | Cosmic / Zen ambient    |  +2.048 |            -5.762 | FLAC esterno pronto      |
| Distant Bloom     | Relax            | Standalone works        |  +3.763 |            -4.337 | FLAC esterno pronto      |
| Aquarian Drift    | Meditation       | Cosmic / Zen ambient    |  +3.064 |            -3.886 | FLAC esterno pronto      |
| Aquarian Echo     | Massage          | Standalone works        |  +2.329 |            -3.001 | FLAC esterno pronto      |
| Moon Drone        | Sleep            | Cosmic / Zen ambient    |  -4.000 |            -6.020 | WAV ATP01 riusato        |
| Deep River        | Relax / Sleep    | Elemental Worlds: Water |  +2.028 |            -5.982 | WAV ATP01 riusato        |
| Soft Air          | Focus / Relax    | Elemental Worlds: Air   |  -4.001 |            -6.021 | WAV ATP01 riusato        |

`Deep River` non è descritto come field recording: la provenienza disponibile
non basta a sostenere quel claim. Nessuna opera è assegnata automaticamente a
Esoteric Series.

## Lossless e dimensioni

[F] I 18 WAV PCM24/48 kHz stereo totalizzano **2.563.271.952 byte**. I 18 FLAC
level 8 totalizzano **1.455.254.377 byte**, con risparmio esatto di
**1.108.017.575 byte (43,2267%)**. Per ogni file il PCM decodificato ha lo stesso
SHA-256 del data chunk WAV: sample rate, canali, frame count, durata, LUFS e seam
restano quindi invariati. Il report per-file è
`docs/M4_LOSSLESS_DERIVATIVE_REPORT.json`.

[F] Starter incorporato: un FLAC da **28.167.925 byte** più i tre WAV ATP01 già
presenti. Audio referenziato previsto nell'archivio base: **183.688.057 byte**.
Il contributo incrementale certo di M4 è 28.167.925 byte; il peso finale APK/AAB
è `NON DETERMINATO — EVIDENZA INSUFFICIENTE` senza una build autorizzata.

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

[U] Il percorso FLAC `expo-asset → file:// → createFileSource(loop=true)` è
implementato e supportato staticamente da RNAA 0.13.2, ma la prova runtime è
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`: il sandbox corrente impedisce ad
ADB di aprire la porta locale e l'emulatore non parte. Nessuna approvazione
sonora è implicita.
