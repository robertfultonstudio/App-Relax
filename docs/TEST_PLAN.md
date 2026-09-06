# Test plan

## Strategia

La milestone usa cinque livelli distinti: test puri, integrazione con driver fake, validazione config/asset, bundle/prebuild e prove su device. Nessun livello sostituisce il successivo.

## M5 — Adaptive Sessions & QA Workbench

### Planner e timeline

- Guided fallisce finché non esistono voci registrate; Sound only usa soltanto
  durate ammesse dalla policy dell'outcome.
- I profili provvisori sono esclusi per default e richiedono opt-in QA; un set
  editoriale revisionato funziona senza override.
- Stesso input e seed producono lo stesso piano; curve, storia o disponibilità
  diverse producono identità diverse.
- Ogni piano ha quattro fasi, quattro opere e tre transizioni; nessuna opera o
  famiglia si ripete e la storia recente viene esclusa.
- Regole di fase e transizione sono ALL-OF; un solo fallimento blocca la
  sequenza senza fallback casuale.
- Entry/exit usano marker validi. Il target termina sul frame esatto; un finale
  editoriale obbligatorio mancante fallisce.
- Il bound peak usa il massimo completo della curva equal-power o lineare e il
  rischio post-trim resta al massimo -1,1 dBTP.
- L'audit ispeziona tutti gli intervalli delimitati dagli eventi e rileva anche
  gap o triple overlap inferiori a un secondo.
- Le coppie musicali approvate usano 180 secondi equal-power; al momento la
  whitelist è vuota dopo le due esclusioni d'ascolto, quindi ogni richiesta
  musicale consumer fallisce chiusa. Le coppie QA provvisorie non diventano
  automaticamente sessioni consumer.
- `Ocean waves` seleziona soltanto opere Sea e `Rain` soltanto opere Rain; due
  registrazioni diverse della stessa famiglia vengono alternate senza
  passaggio automatico da una famiglia all'altra.

### Controller, UI e persistenza

- Le modalità sono Sound only e Guided; la voce appare soltanto in Guided e il
  CTA resta disabilitato.
- `Music + nature` è visibile ma disabilitato come `IN PRODUCTION` finché non
  esiste una coppia approvata; una richiesta musicale salvata non viene
  convertita silenziosamente in natura.
- Le durate sono 10/20/30/45/60/90 con subset per categoria e ruolo radio
  accessibile.
- La preview adattiva è ammessa soltanto su Web non-production. Gli script
  ordinari si legano a `--localhost`; la modalità esplicita `web:iphone`
  autorizza in development un solo IPv4 LAN privato rilevato dal launcher,
  senza tunnel. Deep link e `Play your last session` rispettano lo stesso gate.
- Su LAN il parametro Start prepara la sessione ma non invoca autoplay: il
  browser deve ricevere un tap Play diretto. Loopback conserva l'auto-start per
  il QA deterministico.
- Preflight e player usano la stessa storia recente; un errore storage blocca
  esplicitamente lo Start.
- Il seed non compare nell'URL consumer e non viene persistito. La Home rilegge
  l'ultima richiesta quando torna in focus.
- Errore di una sorgente futura viene propagato al controller; il driver nativo
  rifiuta esplicitamente le sessioni adattive.
- Il player musicale espone volume principale e volume ambiente distinti. Il
  secondo accetta 0–100%, mute/unmute e passi del 10%, senza esporre stem, dB o
  un mixer multilayer; la scelta Rain/Ocean waves e accessibile come radio.

### Offline e confine QA

- Manifest runtime, catalogo e manifest M4 coincidono per work ID, object key,
  byte e SHA-256.
- Stato persistito con schema/revisione incoerenti viene ignorato; `available`
  è riconfermato con i file committed.
- Download usa sink streaming, progress finito e bounded, spazio sui soli byte
  mancanti, verifica di ogni asset e promozione/rollback di tentativo.
- Operazioni sullo stesso pacchetto sono serializzate; una rimozione fallita
  conserva l'evidenza precedente.
- Config consumer e QA hanno root distinte; source QA e draft store sono
  esclusi da EAS.
- Dopo export, sentinel, route e storage key QA sono assenti dall'artifact
  consumer e presenti nel solo artifact QA.
- La radice PWA dedicata contiene soltanto route consumer. L'artefatto statico
  ha 45 route player predisposte, manifest e service worker, ma zero WAV,
  FLAC, Audio Test o Workbench.
- Il service worker PWA bypassa audio e richieste Range; il playback di
  produzione richiede delivery same-origin esplicita in un secure context.
- L'export PWA viene prodotto con `pnpm export:web:pwa` e verificato con
  `pnpm pwa:validate`; il conteggio e il peso riportati si riferiscono
  all'artefatto appena rigenerato, non a un export precedente.
- `pnpm pwa:test-server` verifica il server statico senza aprire socket:
  root/URL pulite, MIME, GET/HEAD/Range, 416/404, esclusione host esterni e
  traversal, allowlist manifest e byte iniziali/finali di tutti i 37 audio.
  `pnpm pwa:check-local` controlla l'avvio prima di aprire la porta. Il test
  browser/ascolto resta distinto dalle richieste simulate al gestore HTTP.

## Test automatici

### Dominio e prodotto

- Schema preset valido e versione supportata.
- `tuningLabel`, `carrierHz` e `beatHz` separati.
- Un solo preset registrato e quattro temi/artwork editoriali esatti.
- La Home espone esattamente Yoga, Massage, Relax, Meditation, Sleep e Focus.
- Le sei azioni consumer hanno almeno una sorgente riproducibile; il localhost
  distingue gli asset di preview dai byte realmente incorporati nel mobile.
- Eclypsis / Eclipse Veil e Nirvana Waves / Stillwater Halo sono assenti da
  catalogo, mapping asset, QA, relazioni Continuum ed export; il report
  lossless storico resta immutato.
- La gerarchia verificabile e funzione, CTA, durata/formato, naming evocativo.
- Il solo `audioPresetId` appartiene a `AUDIO_TEST_RITUAL` con stato `test-only`.
- Yoga espone soltanto 20/30/45/60/90 minuti.
- Soundscapes espone le famiglie richieste e la collezione `Noise Colours`.
- `AUDIO TEST PACK 01` integrato e limitato a tre nomi canonici.
- Copy senza promesse mediche affermative.

### DSP e asset audio

- Binaural: frequenze sinistra/destra con differenza uguale a `beatHz`.
- Brown noise: output deterministico con RNG seeded, centrato e normalizzato.
- Noise consumer: otto profili, alias Red/Purple/Gray, output deterministico,
  centrato, bounded e raccordato al loop; ordine di brillantezza verificato per
  Brown, Pink, White, Blue e Violet.
- Placeholder: esattamente tre WAV PCM 16-bit, 48 kHz, stereo, 8 secondi, manifest e SHA-256 coerenti.
- Test Pack: esattamente tre WAV PCM 24-bit, 48 kHz, stereo, 180 secondi, metriche, loop, manifest e SHA-256 coerenti.
- I placeholder restano fixture tecniche e non sono referenziati dal preset.

### Controller

- Idratazione completata prima del load preset.
- `play` rapido avvia un solo graph.
- Pausa/resume non duplica la sessione.
- Cambio timer rifiutato durante playback.
- Deadline assoluta, fade terminale e un solo stop.
- Pausa manuale non viene ripresa da un'interruzione estranea.
- Pausa da interruzione riparte solo con `shouldResume`, anche con eventi begin/end ravvicinati.
- Una pausa manuale concorrente prevale sull'auto-resume e rilascia il focus; resume lo riacquisisce.
- Stop nasconde sempre i controlli notification best-effort, anche dopo un errore di update.
- Start failure e gain failure producono cleanup/stato leggibile.
- Seek file o sessione non confermato ferma il driver, invalida deadline/ticker
  e produce uno stato errore leggibile; lo scrubber torna al punto precedente.
- Nel dual-deck nessun Play avviene finché tutti i file attivi non hanno
  confermato il seek. Un errore con il deck partner ancora pendente lascia
  entrambi silenziosi e li pulisce dopo il loro esito.
- I bus musica e natura sono separati: cambiare il volume ambiente aggiorna il
  relativo bilanciamento senza mutare il volume principale, e Stop li pulisce
  entrambi.
- Persistenza versionata ignora dati corrotti e non salva autoplay.

### UI

- Tab e copy esatti per Rituals, Yoga e Soundscapes.
- Copy IA esatto per `Start your yoga session`, `Set the room for massage`,
  `Relax now`, `Begin meditation`, `Prepare for sleep` e `Focus`.
- Le card usano copy consumer `AVAILABLE`/`IN PRODUCTION`; i dettagli di source,
  delivery e generazione restano fuori dal percorso consumer.
- `Aquarian Sky`, Cosmic/Zen Ambient, Esoteric Series ed Elemental Worlds restano
  famiglie editoriali future visibili.
- Settings collega il percorso separato `Audio Test — Test only`.
- Player e preset tecnico mostrano `TEST ONLY`; nessun tab consumer li apre.
- `Volume & mute` e `Test details` sono chiusi al primo render.
- I controlli Play/Pause/Stop, timer, volume e mute hanno target almeno 44x44.
- La sessione musicale mostra `Ocean waves`/`Rain`, il titolo dell'ambiente e
  un controllo volume ambiente 0–100% con mute; la sessione di soli suoni
  naturali non presenta un secondo controllo duplicato.
- La UI consumer non usa imitazioni di sfere/pianeti neri luminosi, waveform,
  neuro-grafiche, frequency-first, mandala, chakra, Buddha o torii.
- Reduce Motion rende l'artwork statico; target touch minimi 44x44.
- Stato fade di ogni sorgente e esposto testualmente insieme a gain/mute.

## Gate locali

```bash
pnpm install --frozen-lockfile
pnpm peers check
pnpm exec expo install --check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:audio
pnpm audio:validate-placeholders
pnpm audio:validate-test-pack
pnpm audio:validate-consumer
pnpm audio:verify-lossless
pnpm assets:validate-safety
pnpm assets:validate-rituals
pnpm security:audit
pnpm config:validate
pnpm qa:validate-boundary
pnpm expo:doctor
pnpm exec expo config --type prebuild --json
pnpm run export:ios:consumer --output-dir dist/m5-export-ios
pnpm run export:android:consumer --output-dir dist/m5-export-android
pnpm export:validate-native dist/m5-export-ios dist/m5-export-android
pnpm export:web:consumer
pnpm export:web:qa
pnpm qa:validate-exports
pnpm export:web:pwa
pnpm pwa:validate
```

Il gate export accetta esattamente i tre WAV ATP01, 155.520.132 byte, e nessun
FLAC starter consumer.

### Prova iPhone Web sulla stessa Wi-Fi

1. Avviare `pnpm web:iphone` con Node 22.23.1 e annotare il link privato.
2. Collegare Mac e iPhone alla stessa rete fidata; aprire il link in Safari o
   Chrome senza sostituire l'IP con `localhost`.
3. Scegliere funzione, durata e tipo di suono; premere Start e poi il Play
   esplicito mostrato dal player.
4. Verificare un file naturale e una sessione musica+natura: Play/Pause/Stop,
   volume principale, Rain/Ocean waves, volume ambiente, seek e cambio lento.
5. A fine prova interrompere il server e verificare che la porta non risponda.

Il test richiede il Mac acceso e non installa un'app. Un risultato sul browser
iPhone non certifica background, lock-screen, Bluetooth, batteria o driver
nativo.

Per la revisione completa, sostituire il primo comando con
`pnpm web:iphone:review` e aprire il link `/qa-workbench` stampato dal launcher.
La radice QA conserva anche Home e route consumer, ma aggiunge catalogo
completo, ascolto singolo, transizioni dirette, sessione completa e scrubber.
Il catalogo resta on-demand e non viene copiato sull'iPhone.

Senza argomenti il gate lossless richiede zero FLAC starter, verifica l'assenza
di Eclypsis dal catalogo attivo e conserva nel report soltanto l'evidenza
storica della conversione PCM-identica. La riverifica completa del PCM, quando
WAV sorgenti e decoder FLAC sono disponibili, usa:

```bash
pnpm audio:verify-lossless -- <wav-dir> <flac-dir> <flac-binary>
```

Il validatore consumer legge `docs/M4_LOCAL_LISTENING_MANIFEST.json`, richiede
esattamente 37 asset locali, verifica per ciascuno byte size e SHA-256 e fallisce
se entra `SLEEP_TEXTURE_001.wav`. Il collaudo browser apre separatamente tutte le
37 route file-backed ancora approvate, preme Play e richiede la transizione a Pause senza
alert.

`security:audit` fallisce su qualsiasi advisory non previsto o cambio di
versione. La policy conserva come soli residui eventualmente accettabili i due
advisory `image-size` documentati in D-015; il run corrente non ne rileva.

Gli export M5 nativi usano obbligatoriamente gli script consumer, che impostano
`EXPO_PUBLIC_FOLDER=public-mobile`. I 2,6 GiB in `public/audio-catalog/` servono
al solo ascolto localhost: il validatore richiede esattamente i tre WAV ATP01 e
nessun FLAC starter, rifiuta file audio pubblici non processati, file oltre 100 MiB,
output oltre 512 MiB e qualsiasi path `audio-catalog`.

Il prebuild di verifica va eseguito soltanto in una copia temporanea e con `--no-install`; non deve generare `ios/` o `android/` nel checkout.

## Gate EAS cloud storico e futuro

M5 non autorizza nuove build cloud. Le sezioni seguenti registrano build
precedenti o comandi futuri e non sono parte del gate corrente.

I profili sono separati per evitare autorizzazioni implicite.

### Android development client

Comando autorizzato ed eseguito una sola volta:

```bash
EAS_NO_VCS=1 pnpm dlx eas-cli@21.7.1 build --platform android --profile development-android
```

Esito cloud: build `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7` `FINISHED`, Expo SDK 57.0.0; APK 299.803.135 byte con SHA-256 `d54a5333b40574baeb6560879a743ad1722619df6f6c676669e62bf7feff4ae7`; ZIP, manifest, otto DEX, quattro ABI e scan mirato di leakage/segreti verdi. L'APK contiene il development client e ha caricato via Metro il JavaScript e i tre WAV correnti.

### Android standalone preview

Comando autorizzato ed eseguito una sola volta:

```bash
EAS_NO_VCS=1 pnpm dlx eas-cli@21.7.1 build --platform android --profile preview-android --freeze-credentials --no-wait
```

Esito cloud: build `c3a39414-d156-4373-810a-0011296b51f8` `FINISHED`, APK 289.861.086 byte con SHA-256 `47a6603108f6aee3464f6a63ae00f0b0fdb287d375a391d1a9210043e6b0a2a6`. Sono verdi ZIP, manifest, quattro DEX, quattro ABI, bundle incorporato, hash dei tre WAV, assenza placeholder e scan mirato di leakage/segreti. Dopo installazione pulita su emulatore API 34, Home, player Ready e Play hanno funzionato con Metro spento; screenshot `RITUAL IN PROGRESS` con timer 28:55 registrato in `dist/eas/`.

### iOS dopo

Comando proposto, non autorizzato:

```bash
pnpm dlx eas-cli@21.7.1 build --platform ios --profile development-ios
```

Accettazione: account/credenziali approvati, iPhone registrato, build `finished`, immagine/Xcode previsti nel log e IPA installabile sul device registrato.

Non usare `--platform all`, `--auto-submit` o `eas submit`.

## Smoke test su telefono reale

- Installazione e avvio dell'APK standalone verificato.
- Navigazione tra Rituals, Yoga e Soundscapes; card consumer bloccate.
- Settings -> Audio Test -> player tecnico e Settings -> Legal.
- Play, pausa, stop, timer e fade.
- Tutti e otto i noise colours, uno alla volta; nessun click evidente al loop,
  clipping, affaticamento o cambio anomalo di volume.
- Mute/gain di ciascuna delle cinque sorgenti.
- Tap rapido e navigazione senza duplicazioni.
- Stato salvato dopo riavvio senza autoplay.
- Speaker, cuffie stereo e Bluetooth.
- Background, lock-screen e controlli di sistema.
- Interruzioni: chiamata/assistant, altra app audio, perdita cuffie.
- Sessione lunga, temperatura, batteria e stabilita.
- Loop percepito, bilanciamento, clipping e fade.
- Accessibilita VoiceOver/TalkBack.

## Matrice di accettazione

| Area                         |    Locale statico |                 EAS cloud |           Telefono reale |
| ---------------------------- | ----------------: | ------------------------: | -----------------------: |
| UI, route e copy             |  richiesto, verde |              bundle verde |          smoke richiesto |
| Wiring cinque sorgenti       |    contratti/fake | compilazione nativa verde |       audio obbligatorio |
| Timer e persistenza          | fake clock, verde | compilazione nativa verde |   lifecycle obbligatorio |
| Config background            |   prebuild, verde |      manifest build verde | lock-screen obbligatorio |
| Bluetooth, latenza, batteria |  non verificabile |          non verificabile |             obbligatorio |
| Qualita sonora               |  non verificabile |          non verificabile |   obbligatorio dopo pack |

## Evidenze di chiusura

- Exit code e output dei gate locali.
- Build EAS Android ID, stato, fingerprint, artifact checksum e quota gia registrati dopo autorizzazione; non registrare URL firmati temporanei.
- Device/OS e checklist smoke, solo quando disponibili.
- Diff, `git status`, secret scan e dipendenze.
- Audit raw, policy audit e verifica signature degli asset.
- Limiti aperti in `STATO.md` e `docs/DECISIONS.md`.
