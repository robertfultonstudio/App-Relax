# D-103 — APK consumer Android 1.0.3 / 4

14 settembre 2026. Una sola nuova build autorizzata da Robert, solo a costo
zero. Nessun retry automatico, PWA, iOS, store, commit/push o nuova credenziale.

## Candidato e preflight

- [F] Correzione Ocean D-102 invariata: barriera di allocazione e recupero
  limitato dello seek, già riprodotti e verificati nel development client.
  Nessun ulteriore cambio funzionale. Solo versione 1.0.3 / versionCode 4.
- [F] Runtime Node 22.23.1, pnpm 11.16.0; Expo 57.0.22, RN 0.86.3,
  RNAA 0.13.2; EAS CLI 21.7.1 esistente, nessun aggiornamento globale.
- [F] Prettier, lint, typecheck, Jest 653/653 in 89 suite e audio 257/257
  in 22 suite PASS. Expo Doctor 20/20, Expo install check PASS.
- [F] Config, separazione QA/PWA, secret/asset safety, ATP01, artwork,
  catalogo consumer, Hatha e texture locali PASS. Audit dipendenze
  PASS WITH ACCEPTED RESIDUALS solo GHSA-w3rx-r6r6-pgpr e
  GHSA-5p2g-fcmc-qvqq, già circoscritti dal gate asset.
- [F] Risultati completi: `dist/d103-preflight.json`, `dist/d103-jest.json`,
  `dist/d103-audio-jest.json`.
- [F] Archivio EAS locale verificato: 177 file / 160.186.901 byte,
  esattamente tre WAV ATP01, nessun catalogo esterno/FLAC, segreto, QA o
  percorso master. App/package 1.0.3 e code 4 controllati nell'archivio.
- [F] Audit indipendente del kit esterno: 47/47 SHA-256 e dimensioni
  corrispondenti, zero extra/mancanti/duplicati; 45 FLAC + 2 WAV,
  2.434.210.564 byte. Eclypsis/Nirvana/Soft Air esclusi. Nessun audio copiato,
  rinominato, normalizzato o caricato su EAS. Manifest SHA-256:
  `70c026c7e8ad8c8bae6e7711382420a43df9bbdae55e0a6e035f2e2055bdfcac`.
- [F] Rapporto indipendente:
  `/tmp/app-relax-d103-audit.bf1gyD/D103_INDEPENDENT_PREBUILD_AUDIT.md`.

## Costo zero e invio unico

[F] Verifica live immediatamente prima dell'invio: account
`robert-fulton-studio`, piano Free, Android 2/15 usate (13 residue), totale
2/30; overage 0, costo stimato 0 centesimi; periodo 1 settembre–1 ottobre.
Nessun job attivo o candidato 1.0.3 preesistente nella lista controllata.
Prova: `dist/d103-cost-before.json`, con timestamp di osservazione.

[F] Fonti primarie verificate: [prezzi Expo](https://expo.dev/pricing) e
[piani EAS](https://docs.expo.dev/billing/plans/). Il piano Free comprende
build a priorità bassa e quote limitate; non equivale a build illimitate.
Nessun upgrade, add-on o metodo di pagamento configurato.

[F] Inviato esattamente un job il 14 settembre 2026 alle 00:08:47 UTC:
`11e48eab-81b1-4134-8077-244e173512ab`, Android, `preview-android`, internal,
versione 1.0.3 / code 4, firma esistente con `--freeze-credentials`.
Archivio compresso circa 148 MB. L'helper impedisce di ripetere l'invio:
`dist/d103-submission-intent.json` creato in modo esclusivo prima dell'azione.
Nessun auto-submit o modifica dello store.

[F] FINISHED alle 00:31:08.607 UTC; Gradle BUILD SUCCESSFUL in 20m49s.
Scaricata l'APK esatta, 293.084.262 byte (circa 293 MB), SHA-256
`56c64cdeb525c2d95d7b2d15426052e65afe1222ab99b529ad55160a5c4be3ea`.
[Download APK](https://expo.dev/artifacts/eas/Hp25umw5cVRlDYGoVnLYunCIrv87Vl1Mmahofb6DbSU.apk).
File locale: `/Users/RF/Documents/App Relax Android Test 20260913/AppRelax-1.0.3-android-consumer.apk`.

[F] Costo finale live alle 00:31:29 UTC: Free Android 3/15 usate,
12 residue, overage e totale stimato 0 centesimi. Consumato un solo job
aggiuntivo, nessun retry. Prove: `dist/d103-build-status.json`,
`dist/d103-artifact.json`, `dist/d103-cost-after.json`.

## Ispezione del pacchetto

[F] Hash/dimensioni, ZIP/CRC, package/versionCode, quattro ABI, servizio audio
e permessi PASS. Debug disabilitato e backup disabilitato. Esattamente tre
WAV ATP01 invariati, zero FLAC/catalogo esterno, nessun percorso PWA/Workbench
o pannello review. Certificato v2 identico alla 1.0.2. L'installazione Android
in aggiornamento è stata accettata: `Success`, senza disinstallare o
cancellare dati. Settings mostra 1.0.3 e 47/47 registrazioni importate.

[F] Residuo dichiarato, non nascosto: l'audit indipendente più severo
`no_forbidden_qa_bundle_markers` resta FAIL per la sola route legacy
`./audio-test.tsx`. È presente una volta anche nella 1.0.2, già documentata
nella consegna precedente e separata dal consumer secondo AGENTS.md.
Non è una nuova regressione D-103: Home/Settings non la espongono e
Workbench/PWA review sono esclusi. Non si dichiara assenza assoluta di codice
tecnico nell'APK. Conservati rapporto originale e addendum di classificazione
in `/tmp/app-relax-d101-apk-audit.hUF6ZJ/`.

[F] Expo plugin 1.0.2: applicate le skill pertinenti `expo-deployment` e
`expo-dev-client` per distribuzione e installazione/test; niente Expo Go,
nuove installazioni o submission. La scelta dinamica di strumenti/skill,
non esclusiva a Expo, è registrata in AGENTS.md su richiesta esplicita.

## Gate di accettazione

[F] Prova dell'APK standalone esatta, Android API34 x86_64, senza Metro né
reverse ADB. Hatha90 + Ocean si avvia; pausa/ripresa, volume ambiente
50→40→mute→50 e principale80→70→mute→80 osservati. Incrementi UI reali10%,
non5%: il primo probe aveva un'aspettativa errata, corretta soltanto nel
test helper, non nell'app. Timer fermo durante Paused, ripresa coerente.

[F] Ocean resta Playing a81:24: 516s trascorsi, oltre fine prima giunzione
musicale465,75s. Segnale nativo corrente PID1942 non nullo; musica ancora
presente con ambiente portato a0 dopo la giunzione. Successivi
Stop→Ready90:00, Rain→Play, Stop→Ready, Ocean→Play e Stop→Ready riusciti.
Nessun warning ReactNativeJS o errore AndroidRuntime nei log controllati.
Non è una certificazione del passaggio inudibile né un long-run completo90min.

[F] Prove in `dist/d101-native/` con prefisso `d103-`: Settings, Ocean
setup/avvio, pausa e volumi, `d103-ocean-after-first-join.png` e `.txt`,
`d103-music-only-confirmed.txt`, Rain, ritorno Ocean e Ready finale.
UiAutomator non sempre ottiene lo stato idle durante il countdown: nessuna
gerarchia stale utilizzata. In quei casi screenshot effettivi e stati
Paused/Ready stabili; il limite dell'automazione non è un errore playback.

[F] Controllo aggiuntivo rappresentativo su due file singoli:
Astral Thread FLAC e Night Birds WAV. APK installata confrontata per SHA-256
con l'artefatto cloud; avvio, segnale corrente non nullo, Paused e Stop→Ready
PASS2/2. Ogni prova forza un nuovo processo e usa il proprio PID, esclude
altri audio attivi e confronta due righe di segnale nuove rispetto al
pre-Play. Screenshot ispezionati. Risultati:
`dist/d103-native-catalog-v2/results.json` e `run.json`.
Il primo tentativo automatizzato è conservato come INCONCLUSIVE per
UiAutomator non-idle, non come errore app; la seconda prova usa lo stesso
controllo Play/Pause stabile e verifica Paused dopo la cattura audio.
Non è un test runtime47/47: l'integrità/hash e l'import coprono47/47,
lo smoke standalone copre esplicitamente2 formati, più le sessioni sopra.

[F] Chiusura: app fermata, emulatore terminato con exit0, ADB spento,
PID97127 assente e nessun listener5037/5554/5555/8081. Metro mai avviato.
APK1.0.3 e dati importati conservati nell'AVD; nessun rollback alla1.0.2.
Riconfrontati6/6 hash sorgenti dell'invio: nessuna deriva del codice dopo
la build. Nessun master modificato o nuovo byte audio in Git/EAS.

## Consegna e stato Git

[F] APK interna pronta per la prova su telefono con kit separato; non una
release store. Aggiornate le istruzioni in
`/Users/RF/Documents/App Relax Android Test 20260913/LEGGIMI.md` e conservati
APK/audit precedenti con i loro esiti negativi. Il solo catalogo pesa2,43GB;
prima importazione con circa6GB liberi consigliati, aggiornamento senza
disinstallazione per conservare i dati già verificati.

[F] Nessun commit, staging, push, PR, deploy PWA o secondo job EAS.
Modifiche di questa consegna: versione in app/package, AGENTS.md per scelta
dinamica degli strumenti, STATO/DECISIONS e documenti Android/D103.
Motore e test D102 già presenti restano invariati. Il diff complessivo include
il lavoro precedente, non è attribuito interamente alla D103.

[F] HEAD invariato `6549f0117f2d7623fe20816cbf2c687385af6b8d`; index vuoto,
100 file tracciati modificati e94 voci non tracciate complessive, incluse
le modifiche ereditate. Prettier dei documenti finali e `git diff --check`
PASS. I percorsi strategia protetti non sono stati toccati.

[U] Qualità percepita dei loop/crossfade, Bluetooth, batteria, lock-screen,
interruzioni e long-run su telefono restano NON DETERMINATO — EVIDENZA
INSUFFICIENTE finché non vengono ascoltati/provati sul dispositivo reale.
La sessione Hatha 90 resta una pratica preview; Guided non viene inventato.
Il kit va importato separatamente: tutti gli audio verificati non significa
che i 2,43 GB siano incorporati nell'APK.
