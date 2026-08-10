# Test plan

## Strategia

La milestone usa cinque livelli distinti: test puri, integrazione con driver fake, validazione config/asset, bundle/prebuild e prove su device. Nessun livello sostituisce il successivo.

## Test automatici

### Dominio e prodotto

- Schema preset valido e versione supportata.
- `tuningLabel`, `carrierHz` e `beatHz` separati.
- Un solo preset registrato e quattro categorie esatte.
- Richiesta `AUDIO TEST PACK 01` bloccata e limitata a tre nomi.
- Copy senza promesse mediche affermative.

### DSP e placeholder

- Binaural: frequenze sinistra/destra con differenza uguale a `beatHz`.
- Brown noise: output deterministico con RNG seeded, centrato e normalizzato.
- Placeholder: esattamente tre WAV PCM 16-bit, 48 kHz, stereo, 8 secondi, manifest e SHA-256 coerenti.
- I placeholder sono tecnici e non simulano le specifiche 24-bit/180 s del pack reale.

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
- Persistenza versionata ignora dati corrotti e non salva autoplay.

### UI

- Home mostra Sleep, Calm, Focus e Meditate.
- Hero unico `Deep Sleep 432` e badge placeholder.
- Stato fade di ogni sorgente e esposto testualmente insieme a gain/mute.

## Gate locali

```bash
pnpm install --frozen-lockfile
pnpm peers check
pnpm exec expo install --check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:audio
pnpm audio:validate-placeholders
pnpm assets:validate-safety
pnpm security:audit
pnpm config:validate
pnpm expo:doctor
pnpm exec expo config --type prebuild --json
pnpm exec expo export --platform ios --output-dir dist/ios-bundle
pnpm exec expo export --platform android --output-dir dist/android-bundle
```

`security:audit` accetta soltanto i due advisory `image-size` esplicitamente documentati in D-015 e fallisce su qualsiasi altro advisory o cambio di versione. Il comando raw `pnpm audit --audit-level high` resta atteso exit 1 finche non esiste una release corretta; entrambi gli esiti vanno riportati.

Ultima esecuzione verificata il 10 agosto 2026: 8 suite/30 test, subset audio 19/19, Expo Doctor 20/20, entrambi gli export Hermes completati.

Il prebuild di verifica va eseguito soltanto in una copia temporanea e con `--no-install`; non deve generare `ios/` o `android/` nel checkout.

## Gate EAS cloud

I profili sono separati per evitare autorizzazioni implicite.

### Android prima

Comando autorizzato ed eseguito una sola volta:

```bash
EAS_NO_VCS=1 pnpm dlx eas-cli@21.7.1 build --platform android --profile development-android
```

Esito cloud: build `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7` `FINISHED`, Expo SDK 57.0.0; APK 299.803.135 byte con SHA-256 `d54a5333b40574baeb6560879a743ad1722619df6f6c676669e62bf7feff4ae7`; ZIP, manifest, otto DEX, quattro ABI e scan mirato di leakage/segreti verdi. La compilazione nativa e accettata; installabilita e runtime restano aperti fino al telefono reale.

### iOS dopo

Comando proposto, non autorizzato:

```bash
pnpm dlx eas-cli@21.7.1 build --platform ios --profile development-ios
```

Accettazione: account/credenziali approvati, iPhone registrato, build `finished`, immagine/Xcode previsti nel log e IPA installabile sul device registrato.

Non usare `--platform all`, `--auto-submit` o `eas submit`.

## Smoke test su telefono reale

- Installazione e avvio development build.
- Navigazione Home -> Sleep -> player -> Settings/Legal.
- Play, pausa, stop, timer e fade.
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
