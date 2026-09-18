# M6 — integrazione della direzione approvata 1–2

17 settembre 2026. Mandato: «prosegui e concludi M6», seguito da autorizzazione
esplicita ad aggiornare la PWA privata senza costi. La cronologia sotto resta
conservata; il riepilogo finale è `M6_CLOSEOUT.md` e supera i vecchi gate aperti.
Nessun commit/push del repository canonico né build nativa/cloud.

## Revisione successiva: pastelli, tab e caratteri

L'ultimo feedback dell'utente supera le scelte tipografiche e il fondo bianco
descritti nella prima iterazione sotto, senza cambiare pitture o architettura.

[F] Trasporto con lavatura lavanda/cipria e bordo superiore sfumato; simboli
opachi, Pause senza ombre e Stop delimitato. Tab rettilinei non sfumati,
contorno visibile, selezione giada, label 16 px e target minimo 48 px.
Test: contrasto testo ≥4,5:1, contorni tab ≥3:1 sulle superfici definite.
Questo non sostituisce una verifica con screen reader e ipovisione su telefono.

[F] Zen Old Mincho per titoli/timer e Hanken Grotesk per comandi e testo.
Cinque derivati statici Latin, 329696 byte complessivi, font locali senza
fetch durante l'uso; licenze OFL conservate in `assets/fonts/m6/`.
Manifest con SHA-256, fonte upstream fissata a commit e hash degli originali;
famiglie derivate rinominate. Generatore `scripts/prepare-m6-fonts.py`;
validatore `scripts/validate-m6-fonts.mjs`. La copertura non include il giapponese.
Font effettivo del titolo verificato via browser: App Relax Zen Mincho Latin,
custom font; non un fallback. Le vecchie dipendenze font non sono state rimosse
dal lockfile, ma non sono più importate dalle tre root.

[F] Ultimo run: typecheck/lint PASS; Jest 103 suite/760 test PASS;
font/asset/config/secret scan e diff check PASS. PWA locale: 186 file,
13152982 byte; precache 163 file/9072650 byte, zero audio,
revisione `899dea88edfe6da81f272494713294d0cb231b173f1200d441cc8f5cc4b3204d`.
Screenshot successivi al feedback: `home-pastel.png`, `player-pastel.png`
e confronti `*-pastel-comparison.png` in `dist/m6-review/`, 390×844.
Play, avanzamento, Pause e Stop rieseguiti nella nuova versione; audio fermato.
Restano invariati il gate Expo e i limiti di pubblicazione descritti sotto.

## Prima iterazione: risultato e confini

[F] Home con sei attività 2×3 sopra una composizione pittorica continua,
Meditation prima; navigazione, selezione automatica e catalogo manuale conservati.
Player coordinato, Pause/Play circolare 64 px senza ombre, Stop separato,
due volumi regolabili e mute indipendenti. Il timer facoltativo è sotto i volumi,
non fra di essi. Font Newsreader Regular e Manrope già disponibili localmente.
I controlli UI continuano a chiamare il controller: nessuna nuova API audio.

[F] Il player di sviluppo resta presente nella PWA privata; `review=0` serve
solo a ispezionare la superficie consumer senza il dock tecnico. Non è stato
cambiato il default di review. Hatha 90 minuti: otto sorgenti, sette giunzioni.
Nessuna modifica al motore audio o ai byte del catalogo in questo intervento.

## Figma e provenienza

[F] File reale `m09OI6AzKuOlFyTDLgxQ4o` letto con il plugin autenticato;
era vuoto. Sono stati caricati soltanto i due riferimenti selezionati:

- `3:2`: M6 / Approved 1-2 / Home reference — raster.
- `3:3`: M6 / Approved 1-2 / Player reference — raster.

Entrambi disposti a 390×844 e ispezionati tramite screenshot Figma.
Sono riferimenti raster, **non** una libreria di componenti Figma editabili.
Le correzioni già richieste al riferimento (niente loto, Ocean waves esteso,
stato mute non ambiguo) sono applicate nel codice, non falsificate nel raster.

Gli sfondi applicativi provengono dalle due pitture senza testo generate
per il prototipo approvato in `output/m6-mobile-prototype/public/art/`.
Normalizzazione JPEG, nessun testo o controllo raster usato come UI:

| Asset                                     | Dimensioni |   Byte | SHA-256                                                            |
| ----------------------------------------- | ---------- | -----: | ------------------------------------------------------------------ |
| `assets/images/backgrounds/m6/home.jpg`   | 853×1844   | 433618 | `838f4a15202ade5d2f65ae7141e4d7ce19d63d2c7ae58a771e615b7d51f2a517` |
| `assets/images/backgrounds/m6/player.jpg` | 853×1844   | 449640 | `89a937acbc05b7bad87175272e1f71b2483fac3350fa27722e90dede72d5b96d` |

Totale 883258 byte. Manifest dedicato e validatore rigoroso per nomi, dimensioni,
hash e limite 500000 byte per immagine; nessun allentamento dei contratti M2/M3.

## Prove automatiche

[F] Node 22.23.1; Expo installata 57.0.22; React Native 0.86.3.

- TypeScript strict e ESLint completo, zero warning: PASS.
- Jest finale: 102 suite / 758 test PASS, incluse le regressioni audio.
- Prettier sui file M6: PASS; `git diff --check`: PASS.
- Placeholder, ATP01, asset safety, ritual/outcome/background artwork: PASS.
- Configurazione, confine QA/PWA e secret scan: PASS.
- Export Web consumer/QA e controllo separazione: PASS.
- Export PWA: 186 file, 13406896 byte, 53 route player predisposte, zero audio.
- Precache shell: 163 file, 9326142 byte; revisione
  `b2f5ef58bae243c14d31fbb877547e0600c7c3c6872153cabfb4e072dae42a73`.
- Audit dipendenze: PASS WITH ACCEPTED RESIDUALS, soltanto i due advisory
  image-size già documentati (`GHSA-w3rx-r6r6-pgpr`, `GHSA-5p2g-fcmc-qvqq`).
- Expo Doctor online: **19/20**, patch richiesta 57.0.23, presente 57.0.22.
  `expo install --check` conferma lo stesso unico mismatch. Non nascosto con
  esclusioni e non installato; richiesta approvazione locale all'utente.

I primi tentativi hanno rilevato test stilistici obsoleti, l'assenza di
`accessible` sullo slider nativo e asset non registrati: corretti e rieseguiti.
Il primo Doctor isolato falliva per rete; il risultato sopra è il retry online.

## Browser reale, non simulazione del prototipo

[F] App servita su `http://127.0.0.1:8104/` con il catalogo FLAC esistente,
47 file / 2434210564 byte letti su richiesta, più 21 URL legacy compatibili.
Gli originali esterni non sono stati modificati o copiati.

Verificati: attività → Play, tempo che avanza, Pause/Play/Stop, ultima sessione,
Rain → Ocean waves durante Playing, volume principale da tastiera, volume e
mute/unmute ambiente, Hatha 90 minuti e accesso al player sviluppatore.
Seek Hatha alla prima giunzione e incremento dello slider: timeline e dock
convergono a 05:52.90 in pausa. Non è una misura di latenza su telefono.
Il flusso `update.html` ha caricato il nuovo bundle locale mantenendo preferenze.

Screenshot in `dist/m6-review/`: `home-final.png`, `player-final.png`,
`hatha-90.png`, `hatha-review.png`, `home-320.png`, confronti affiancati.
390×844, DPR 1 per i confronti; a 320 px nessun overflow orizzontale,
sei target da 138×190 px e Focus raggiungibile scorrendo. Font timer reale
verificato dal browser: Newsreader-Regular, custom font, non fallback.
Dettagli di confronto e limiti: `design-qa.md`.

## File del presente intervento

- Design: `src/design/{editorialTheme,theme,shellArtwork}.ts`.
- Root font: `src/app/_layout.tsx`, `src/app-qa/_layout.tsx`,
  `src/app-pwa/_layout.tsx`; Home e ordinamento controlli in `src/app/index.tsx`
  e `src/app/listen/[workId].tsx`.
- Componenti: EditorialScreen, EditorialHeader, OutcomeGridTile,
  LastListeningAction, ProductTabBar, ConsumerPlaybackSurface, PlaybackTransport,
  SessionDurationPicker, NatureAmbienceChoice, SessionNatureControl,
  VolumeRange nativo e Web.
- Test: home, playbackTransport, qaWorkbenchBoundary, nuovo volumeRange.
- Asset/manifest M6, `scripts/validate-ritual-assets.mjs`, documenti M6,
  STATO e DECISIONS. Il restante worktree sporco precede questo intervento.

## Gate residui

[U] Gate integrato M6 **non chiuso** finché manca il controllo Expo verde.
Serve approvazione della sola patch locale; nessun costo o build impliciti.
PWA pubblicata ancora invariata: questa consegna è locale. Per aggiornarla
serve il distinto ordine di pubblicazione. L'ascolto su telefono, VoiceOver/
TalkBack, offline, Bluetooth, background e latenza reale restano
NON DETERMINATO — EVIDENZA INSUFFICIENTE per questa iterazione grafica.

[F] Audio arrestato al termine delle prove; vecchio prototipo 8102 e server
8103 spenti. Resta il solo server statico locale 8104, senza emulatore o Metro.
Nessun file staged e nessun commit creato; nessun byte audio o segreto introdotto.
