# Runbook build native ed EAS

Stato: development client e preview Android standalone verificati su emulatore; installazione fisica aperta; iOS, push, submission e costi non autorizzati
Ultima verifica operativa: 11 agosto 2026

## Obiettivo economico

Produrre e provare development build iOS/Android senza rendere obbligatorio l'acquisto di un altro Mac. La macchina attuale resta valida per codice, test, Metro ed export JavaScript; EAS fornisce la toolchain nativa cloud. Ogni costo resta rinviato al gate che lo richiede.

## Baseline verificata

| Area           | Versione/stato                                                | Esito                                            |
| -------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| Progetto       | Expo 57.0.12, RN 0.86.2, React 19.2.3                         | configurato                                      |
| Runtime target | Node 22.23.1, pnpm 11.16.0                                    | pin repository                                   |
| Host           | macOS 13.7.8 Intel, Node sistema 18.20.8                      | solo gate JS con runtime isolato/version manager |
| iOS locale     | Xcode 15.2, nessun runtime, CocoaPods assente                 | bloccato                                         |
| Android locale | Platform Tools 37.0.1, Emulator 37.1.11, image API 34 x86_64  | smoke APK/Metro; build nativa bloccata           |
| Expo SDK 57    | Node 22.13.x, Xcode 26.4+, iOS 16.4+, API Android 36          | fonte Expo                                       |
| EAS Android    | `ubuntu-26.04-jdk-17-ndk-r27b-sdk-57`, Node 22.23.1, JDK 17   | build `FINISHED`, APK verificato                 |
| EAS iOS        | `macos-tahoe-26.5-xcode-26.6`, Node 22.23.1, CocoaPods 1.16.2 | profilo configurato                              |

Fonti: [versioni Expo](https://docs.expo.dev/versions/latest/), [infrastruttura EAS](https://docs.expo.dev/build-reference/infrastructure/).

## Gate 0 - Runtime locale riproducibile

File gia presenti:

- `.nvmrc` e `.node-version`: `22.23.1`;
- `package.json`: engine Node `>=22.13.0`, Volta Node 22.23.1, pnpm 11.16.0;
- `eas.json`: Node 22.23.1 per tutti i profili.

Usare un version manager gia disponibile. Se nessun version manager e installato, la sua installazione per-user richiede prima approvazione; non installare globalmente Node, Expo o EAS CLI.

Controlli attesi:

```bash
node --version          # v22.23.1 target
node -p process.arch    # x64 su questo host
pnpm --version          # 11.16.0 target
git rev-parse --show-toplevel
```

Il runtime Codex Node 24.19.0 e sufficiente per i gate eseguiti in questa sessione, ma non sostituisce il pin riproducibile per operatori esterni.

## Gate 1 - Repository e bundle JavaScript

Eseguibile senza account e gia verificato:

```bash
CI=1 pnpm install --frozen-lockfile
pnpm peers check
CI=1 pnpm exec expo install --check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:audio
pnpm audio:validate-placeholders
pnpm audio:validate-test-pack
pnpm assets:validate-safety
pnpm assets:validate-rituals
pnpm security:audit
pnpm config:validate
CI=1 pnpm expo:doctor
CI=1 pnpm run export:ios:consumer --output-dir dist/ios-bundle
CI=1 pnpm run export:android:consumer --output-dir dist/android-bundle
CI=1 pnpm export:validate-native dist/ios-bundle dist/android-bundle
```

Criterio: tutti exit 0. La policy security puo stampare `PASS WITH ACCEPTED RESIDUALS` soltanto per i due advisory `image-size` documentati in D-015; il raw audit resta registrato separatamente. `dist/` e ignorata da Git.

Non usare il comando `expo export` grezzo: Expo copia ricorsivamente `public/`
anche nelle piattaforme native. Gli script consumer selezionano
`public-mobile`, mentre i profili EAS impostano la stessa variabile e
`.easignore` mantiene una seconda esclusione del catalogo localhost.

## Gate 2 - Preparazione EAS offline

Gia completato:

- tre profili separati in `eas.json`: development Android/iOS e preview Android;
- immagini builder complete fissate;
- `developmentClient: true` per i due profili development, `false` per la preview e `distribution: internal` per tutti;
- APK per il profilo Android;
- bundle/package `com.robertfultonstudio.apprelax`;
- config plugin RNAA e permessi;
- `.easignore` esplicito con esclusione di credenziali, output generati e flussi paralleli;
- `cli.requireCommit: false` e invocazione con `EAS_NO_VCS=1` per impedire che EAS reintroduca `.git` e il path locale nell'archivio; stato Git, diff e contenuto esatto dell'archivio sono verificati manualmente;
- owner EAS `robert-fulton-studio` e project ID `e1d77255-66f4-45c1-b1fa-c503a088b30f` assegnati e verificati dalla CLI.

Disponibilita del bundle identifier negli account Apple/Google per la distribuzione: `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino ai rispettivi gate store.

## Gate 3A - Account e build Android cloud

L'approvazione esplicita e stata ricevuta per: login Expo, creazione/collegamento progetto EAS, upload del sorgente validato e consumo della sola quota Free. Non richiede Apple Developer Program, Android Studio locale o Play Store account per produrre un APK interno. Se la quota Free non e disponibile o compare un costo, arrestarsi senza confermare.

Comandi di account/linking gia eseguiti e verificati:

```bash
pnpm dlx eas-cli@21.7.1 login
pnpm dlx eas-cli@21.7.1 whoami
pnpm dlx eas-cli@21.7.1 account:usage robert-fulton-studio --json --non-interactive
pnpm dlx eas-cli@21.7.1 init --id e1d77255-66f4-45c1-b1fa-c503a088b30f
pnpm dlx eas-cli@21.7.1 project:info --json
```

Prima build autorizzata ed eseguita una sola volta:

```bash
EAS_NO_VCS=1 pnpm dlx eas-cli@21.7.1 build \
  --platform android \
  --profile development-android
```

Prima di confermare la build:

1. verificare `git status --short --branch`, assenza di staging accidentale, diff corrente e hash del commit di base;
2. verificare l'account/owner Expo mostrato;
3. verificare che il `projectId` appartenga al progetto corretto;
4. controllare quota e prezzo correnti;
5. rieseguire `pnpm security:audit` e il raw `pnpm audit --audit-level high`;
6. generare lo stage `archive` con `EAS_NO_VCS=1`, eseguire `pnpm eas:validate-archive <directory>` e verificare che `.easignore` escluda `.git/`, path locali, `output/`, `tmp/`, test, documentazione e file credenziali;
7. non includere segreti, `output/` o `tmp/` paralleli.

Post-build:

- [x] stato EAS `FINISHED`, ID `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7`, completata `2026-08-10T21:00:58.407Z`;
- [x] Expo SDK 57.0.0, app 1.0.0 (1), fingerprint `0d061b3ea48ae2044f80a75a232326e3cf6eee7b`;
- [x] artifact APK 299.803.135 byte, SHA-256 `d54a5333b40574baeb6560879a743ad1722619df6f6c676669e62bf7feff4ae7`;
- [x] `unzip -t` verde, manifest, otto DEX e quattro ABI presenti; scan mirato di path/segreti verde;
- [x] quota Free dopo build `1/15` Android, overage e costo zero;
- [ ] installazione su un telefono Android compatibile con l'APK tramite URL/QR o metodo autorizzato;
- [x] avvio development client e collegamento a Metro su emulatore API 34 x86_64;
- [ ] checklist reale in `docs/TEST_PLAN.md`.

Pagina stabile dell'evidenza: [build EAS Android](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7). L'URL diretto firmato dell'artefatto non viene registrato nel repository.

Seconda build Android, autorizzata separatamente ed eseguita una sola volta:

```bash
EAS_NO_VCS=1 pnpm dlx eas-cli@21.7.1 build \
  --platform android \
  --profile preview-android \
  --freeze-credentials \
  --no-wait
```

Post-build preview:

- [x] stato EAS `FINISHED`, ID `c3a39414-d156-4373-810a-0011296b51f8`, completata `2026-08-11T19:56:53.613Z`;
- [x] Expo SDK 57.0.0, app 1.0.0 (1), fingerprint `92f6d62d3eb36db3d9eef3db223d6552c86af6f6`;
- [x] APK 289.861.086 byte, SHA-256 `47a6603108f6aee3464f6a63ae00f0b0fdb287d375a391d1a9210043e6b0a2a6`;
- [x] ZIP, manifest, quattro DEX, quattro ABI, bundle incorporato e tre WAV con hash del Test Pack verificati;
- [x] nessun placeholder, path locale, filename credenziale o pattern segreto mirato rilevato;
- [x] installazione pulita su emulatore API 34, Home -> player -> Ready -> Play con Metro spento;
- [x] quota Free `2/15` Android, `0/15` iOS, overage e costo zero;
- [ ] smoke completo su telefono Android reale.

Pagina stabile dell'evidenza: [build EAS Android preview](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/c3a39414-d156-4373-810a-0011296b51f8). L'URL diretto dell'APK scade con l'artefatto e non viene registrato nel repository.

## Gate 3B - Account e build iOS cloud

Eseguire separatamente. Per installare la development build su iPhone via EAS servono programma Apple Developer attivo, credenziali di firma, device registrato e Developer Mode. La quota Apple ufficiale e 99 USD/anno o valuta locale, salvo esenzioni; ogni acquisto richiede approvazione.

Comandi proposti, non eseguiti:

```bash
pnpm dlx eas-cli@21.7.1 device:create
pnpm dlx eas-cli@21.7.1 build \
  --platform ios \
  --profile development-ios
```

Post-build:

- dispositivo corretto nel provisioning profile;
- stato EAS `finished`;
- log con immagine iOS/Xcode configurata;
- IPA installabile sul device registrato con iOS 16.4+;
- Developer Mode attivo;
- smoke test audio completo.

Fonti: [development build iOS su device](https://docs.expo.dev/get-started/set-up-your-environment/?device=physical&mode=development-build&platform=ios), [ruoli Apple per EAS](https://docs.expo.dev/app-signing/apple-developer-program-roles-and-permissions/), [membership Apple](https://developer.apple.com/support/compare-memberships/).

## Gate 4 - Test fisici

Richiede almeno un telefono reale, non un nuovo computer.

| Prova                          | Simulatore/cloud build | Telefono reale |
| ------------------------------ | ---------------------: | -------------: |
| Compilazione nativa            |                     si |             no |
| Navigazione/base UI            |               parziale |             si |
| Speaker e volume reale         |                     no |   obbligatorio |
| Binaural stereo/cuffie         |                     no |   obbligatorio |
| Bluetooth e route change       |                     no |   obbligatorio |
| Background e lock-screen       |                     no |   obbligatorio |
| Interruzioni                   |                     no |   obbligatorio |
| Latenza, batteria, temperatura |                     no |   obbligatorio |
| Qualita e loop                 |                     no |   obbligatorio |

Disponibilita dei telefoni: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Nessun dispositivo Android e stato rilevato via USB. Platform Tools, Emulator, image API 34 x86_64 e AVD `AppRelax_API_34_x86_64` sono stati installati su autorizzazione esplicita; Android Studio, JDK generico, SDK Platform e Build Tools restano assenti e non servono per caricare il bundle corrente via Metro.

## Gate 5 - AUDIO TEST PACK 01 — confinato nel test tecnico

L'utente ha autorizzato esplicitamente l'integrazione locale prima della chiusura dello smoke placeholder. Il pack resta limitato a:

1. `SLEEP_DRONE_001.wav`
2. `SLEEP_AMBIENCE_001.wav`
3. `SLEEP_TEXTURE_001.wav`

Nessun altro asset o catalogo e autorizzato. In M3 il pack e `TEST ONLY`, fuori
dai tab consumer. Validazione automatica e cablaggio locale sono verdi;
ascolto, qualita e accettazione su telefono restano aperti. Una nuova build
cloud o pubblicazione non e implicita.

## Confine di autorizzazione corrente

Gia eseguiti prima di M2: `eas login`, `eas init`, una build
`development-android` e una build `preview-android`, senza auto-submit e solo
entro quota Free. D-025 registrava una precedente autorizzazione condizionata
M2; D-026 definisce ora il confine operativo M3 e non autorizza alcuna EAS.

Vietati senza nuova approvazione:

```text
brew install / brew upgrade
softwareupdate
xcode-select -s
xcodebuild -downloadPlatform
pod install
ulteriori installazioni sdkmanager / Android Studio
expo run:ios / expo run:android
eas device:create
eas build / eas build --platform ios / eas submit / --auto-submit
git push / gh pr create
```

La build locale nativa rimane un gate distinto e non e necessaria per procedere via EAS.
