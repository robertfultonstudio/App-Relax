# D-112 — APK consumer Android aggiornata, 1.0.4 / 5

14 settembre 2026. Ordine diretto: «prepara un Apk Aggiornata».
Una sola build interna Android, esclusivamente a costo zero verificato.
Nessuna PWA, iOS/store, push/commit canonico, dipendenza o nuovo audio.

## Perimetro del candidato

[F] Versione1.0.4/versionCode5. Base canonica `53b506b`, modifiche
preesistenti C1/C2/D-106/D-107 preservate e non committate. In questa richiesta
cambiano solo app.json/package.json per la versione e i documenti di consegna.

[F] Consumer aggiornato con chiarezza fra Resume e nuovo avvio, separazione
delle route tecniche, rimozione della texture ATP01 non consumer dal pacchetto
e dei permessi generali storage/overlay. Il motore conserva il fix Ocean D-102.
Hatha30/45/60/90 e catalogo47 file sono collegati al driver nativo e allo storage
privato verificato; nessuna dipendenza da Metro o dal sito PWA.

[F] Differenza esplicita prima dell'invio: i controlli sviluppatore e il cambio
Rain/Ocean durante Play sono della PWA; Android conserva Stop-to-change.
Non si presenta questa APK consumer come copia completa della review Web.
Field Ambience e Night Birds sono nel kit Android, non nel sito privato.

## Preflight

[F] Node22.23.1, pnpm11.16.0 fissato, EAS CLI21.7.1 già presente;
Expo57.0.22/RN0.86.3/RNAA0.13.2 invariati. Skill Expo deployment applicata
al profilo interno esistente, senza installazione/login o store submission.

- 17/17 controlli PASS: formattazione dei due file versione, lint, typecheck,
Jest, config, separazione QA, safety, placeholder/ATP01, artwork, catalogo,
Hatha, texture locali, audit dipendenze, permessi, Doctor e install check.
- 748/748 test,100 suite;297 audio inclusi nel run completo.
- Doctor20/20. Audit dipendenze conserva solo i due residui image-size già accettati.
- Kit esterno47/47 SHA-256 e dimensioni PASS,2434210564 byte, audio invariato.
Manifest SHA-256 `70c026c7e8ad8c8bae6e7711382420a43df9bbdae55e0a6e035f2e2055bdfcac`.
- Archivio reale EAS174 file/108364626 byte:2 WAV consumer condivisi,
nessun FLAC/catalogo esterno, route tecniche, credenziale o path master.
- Export Android corrente48 file/110810048 byte,2 WAV103680088 byte,
marker tecnici assenti. `EXPO_PUBLIC_FOLDER=public-mobile` e flag preview
espliciti; nessun progetto Gradle locale generato. Il validatore a due
piattaforme usa l'export iOS C2 come riferimento immutato: non una nuova
build o un nuovo export iOS1.0.4.
- 174 file dell'archivio confrontati col worktree e congelati prima dell'invio.

Prove: `dist/d112-preflight.json`, `dist/d112-jest.json`,
`dist/d112-kit.json`, `dist/d112-candidate.json`, `dist/d112-eas-archive/`,
`dist/d112-android-export/`. I documenti estranei non sono stati riformattati
né assorbiti nello staging; nessuna scansione di firma equivale a certificazione.

## Build unica e costo

[F] Preflight economico live: account `robert-fulton-studio`, Free,
Android3/15 usate e12 residue, totale3/30, overage0 e stima0 centesimi;
nessun candidato1.0.4 o job attivo preesistente nella lista controllata.
Fonte account: `dist/d112-cost-before.json`, ricontrollata immediatamente
prima dell'invio. [Piani EAS](https://docs.expo.dev/billing/plans/) e
[APK interne](https://docs.expo.dev/build-reference/apk/) verificati.

[F] Una sola richiesta inviata alle14:49:58.755 UTC:
`46e4258b-7b54-4738-b3d8-ea19d996c587`, profilo preview-android, INTERNAL,
1.0.4/code5. Firma esistente congelata; nessuna nuova credenziale.
Upload sorgenti compresso99,7MB, nessun byte del kit esterno caricato.
Intento esclusivo `dist/d112-submission-intent.json` impedisce retry automatico.
[Stato build](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/46e4258b-7b54-4738-b3d8-ea19d996c587).

## APK consegnabile e controlli finali

[F] FINISHED alle15:57:56.168 UTC; scaricata e ispezionata alle15:58.
[Download APK1.0.4](https://expo.dev/artifacts/eas/4ZrDEHnnuhWqv2O5YsKIVZIunkLQr1JuQ3OBwQKsmkw.apk).
Copia locale: `/Users/RF/Documents/App Relax Android Test 20260913/AppRelax-1.0.4-android-consumer.apk`.

- Dimensione:239954542 byte;53129720 byte in meno (-18,1278%) della1.0.3.
- SHA-256:`b6b89c73778b3f03ad6b17fefdbd145ac5a0b3f735a09f7015dcd19d0f7fcad7`.
- Identità:`com.robertfultonstudio.apprelax`, versione1.0.4/code5.
- Audit ZIP/manifest e17 controlli PASS: quattro ABI,2 WAV PCM24/stereo/48k
  con hash canonici, nessun FLAC/catalogo esterno, nessuna route QA/PWA,
  non-debuggable e allowBackup=false. Storage generale/overlay assenti.
- Fingerprint del certificato invariata. L'audit legge il signing block;
  l'installazione reale in aggiornamento è stata accettata dal PackageManager.
- Costo finale0, nessun overage; Free Android4/15 usate,11 residue.

[F] AVD esistente Android API34 x86_64 avviato solo per un controllo breve,
senza Metro e senza audio host. Installazione `-r` sopra1.0.3 riuscita.
L'hash dell'APK installata è uguale al download; Settings mostra1.0.4 e47/47
importati. Nessuna disinstallazione, cancellazione dati o reimportazione.

| Caso | Esito circoscritto |
| --- | --- |
| Astral Thread, FLAC | PASS: Ready, Play con segnale nativo, pausa/ripresa, Stop→Ready |
| Night Birds, WAV | PASS: stesso controllo |
| Hatha90 + Rain | PASS: avvio del piano, stesso controllo; non90min di ascolto |
| Hatha90 + Ocean waves | PASS: avvio del piano, stesso controllo; non90min di ascolto |

[F] Segnale iniziale verificato con due nuove letture non silenziose
AudioFlinger riferite al PID corrente, senza PID estranei attivi; non è un
ascolto umano né un'analisi isolata delle due corsie. Screenshot Settings e
Hatha/Ocean realmente ispezionati. I quattro run non sostituiscono un test
integrale di tutti47 file, delle giunzioni o della durata completa.

Prove: `dist/d112-artifact.json`, `dist/d112-apk-audit.json`,
`dist/d112-cost-after.json`, `dist/d112-native-smoke/run.json`,
`dist/d112-native-smoke/results.json`, XML/screenshot e AudioFlinger adiacenti.
App fermata e AVD terminato regolarmente; nessun Metro avviato.
ADB spento e nessun listener sulle porte5037/5554/5555/8554/8081.

[F] Installare sopra la versione precedente, senza disinstallare. Al primo
uso occorre copiare/importare `AppRelaxAudio` (2,43GB); nessuna delivery remota
o catalogo completo incorporato viene dichiarato. Istruzioni aggiornate nel
LEGGIMI della cartella esterna. Nessun nuovo asset/master modificato.

[U] **Pronta per il test su Android fisico**, non una certificazione di
qualità sonora. Loop/crossfade udibili, latenza reale, Bluetooth,
background/interruzioni, batteria e long-run90m restano
NON DETERMINATO — EVIDENZA INSUFFICIENTE fino alla prova sul telefono.
I pannelli sviluppatore e il cambio live Rain/Ocean restano nella PWA;
Android consumer conserva il cambio dopo Stop. Guided non disponibile.

[F] Worktree preesistente preservato; nessuno staging/commit/push/PR.
Per D-112 modificati solo versione app.json/package.json e documenti di
stato/consegna. PWA38, sorgenti audio e kit esterno invariati. Una sola build.
Controllo finale:174/174 sorgenti congelati ancora identici, diff-check PASS,
index vuoto e98 voci dirty complessive, incluse quelle preesistenti.
