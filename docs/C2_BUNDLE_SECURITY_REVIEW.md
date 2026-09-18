# C2 — confine consumer/QA e sicurezza

14 settembre 2026. AG10 / AG17, supporto AG04. Candidato locale non committato
su `53b506b8bc65284dff4c66eb0c53d60893f83c40`, branch `codex/quiet-by-design-m2`.
Baseline: 53 percorsi modificati, index vuoto. C1 accettata e preservata.
Mandato successivo esplicito: correzioni locali compatibili, nessuna build,
pubblicazione, modifica audio, installazione o commit. Obiettivo globale PWA
letto come blocked: non sostituito né dichiarato completato.

## AG10 — corretto localmente; APK esistente non corretta

[F] Grafo prima: `src/app/_layout` → factory → ReactNativeAudioDriver →
`stemAssets` e `consumerAssets` → `stemAssets` → tutti e tre i WAV.
La radice Router consumer includeva inoltre `audio-test`, `category` e
`session`. Non bastava nascondere i link da Home/Settings.

[F] Grafo dopo: consumer factory → driver → `consumerAssets` → **Drone e
Ambience soltanto**. Le tre route sono trasferite, non distrutte, in
`src/app-qa`; la sua factory inietta esplicitamente `STEM_ASSETS`. Conserva
anche resolver e policy del catalogo Android quando autorizzati dal flag.
Il resolver Web segue la stessa separazione. Un consumer che tenti loadPreset
fallisce prima di fermare la sessione corrente. Motore tecnico, timer, mixer,
tre master, hash e contenuti audio non vengono riscritti.

[F] `Moon Drone` / `sleepDrone001` e `Deep River` / `sleepAmbience001` usano
gli stessi WAV originali; non sono inclusi nei 47 file del kit esterno. Non
possono essere eliminati dal pacchetto senza cambiare il contratto di delivery.
`Soft Air` resta indisponibile: il suo filename storico può esistere nei
metadata, ma il terzo WAV non entra negli asset Metro consumer. Il gate
controlla hash/byte reali, non confonde la stringa di provenienza con un audio.

[F] `.easignore` esclude la registry tecnica e il terzo WAV, oltre alle radici
QA già escluse. Il manifest ATP01 resta nel sorgente d'archivio come provenienza
dei file condivisi; non viene importato nel bundle. Non si dichiara l'archivio
privo di ogni metadata tecnico. Nessun archivio EAS effettivo nuovo generato.

### APK prima: misura integrale, non stima

`AppRelax-1.0.3-android-consumer.apk`, versione1.0.3/code4,
`com.robertfultonstudio.apprelax`, SHA-256
`56c64cdeb525c2d95d7b2d15426052e65afe1222ab99b529ad55160a5c4be3ea`.

| Categoria       | Byte compressi ZIP | Byte non compressi | Voci |
| --------------- | -----------------: | -----------------: | ---: |
| Audio           |          155520132 |          155520132 |    3 |
| Librerie native |          112737168 |          112737168 |  108 |
| DEX + bundle    |           18088040 |           44404588 |    5 |
| Risorse         |            5529453 |            6693148 |  999 |
| Altro           |             172154 |             389290 |  229 |
| Payload totale  |          292046947 |          319744326 | 1344 |

[F] APK totale293084262B = payload292046947B + overhead ZIP1037315B.
CRC e SHA di tutte le voci controllati senza estrazione. Duplicati identici:
48 gruppi/171 voci, soltanto39113B compressi eccedenti (87512B non compressi),
nessun gruppo da100KB. Gli audio e i binari delle ABI **non** sono duplicati.

[F] Librerie per ABI: arm64-v8a29944224B; armeabi-v7a21549316B;
x8630639340B; x86_6430604288B;27 librerie per ABI. Tenere l'APK universale
preserva la compatibilità attuale. Selezionare ABI richiederebbe destinatari
noti e una decisione di distribuzione; un AAB avrebbe un diverso canale di
installazione. Nessuna di queste opzioni è applicata implicitamente.

[F] Tre marker route tecnici e `Engine room.` presenti nell'APK vecchia,
Workbench assente. Il FAIL stretto storico è conservato. La patch toglie
51840044B di payload audio dagli export; **non è una misura della futura APK**,
della RAM o dello spazio installato. Per ridurre i restanti103680088B condivisi
servirebbe una decisione distinta sulla delivery; nessuno starter/hosting nuovo.

Riproduzione read-only:
`python3 scripts/audit-apk-size.py <percorso-APK>`.
Le categorie sono disgiunte, totale e overhead riconciliati; validazione Data
standard applicata alle misure, senza inferire latenza o consumo dai byte.

## AG17 — falso verde corretto, residui ancora espliciti

[F] Difetto riprodotto: il wrapper usava `npm_execpath`; con npm senza lock
riceveva `{error: ENOLOCK}`/exit1 e interpretava `advisories` assente come zero.
Ora accetta soltanto l'entrypoint pnpm, richiede schema completo, conteggi e
status coerenti; errori/tool timeout/schema sconosciuto falliscono chiusi.
I dieci test Node comprendono entrypoint pnpm mjs/cjs e npm negativo.

[F] Eccezioni non ampliate, anzi ristrette: solo due GHSA, `image-size@1.2.1`,
severity high, affected `<=2.0.2`, findings non vuoti e ogni percorso termina
in `>metro>image-size`. Altro genitore, versione, rischio o advisory riapre il
gate. Audit live finale: PASS WITH ACCEPTED RESIDUALS, **non zero vulnerabilità**.

[F] Esposizione individuata nel parser asset Metro0.84.4, durante bundling/dev
server; non un decoder audio consumer. Gate asset su estensione e firma
ICNS/JXL/HEIF mantenuto. Fonti ufficiali consultate:
[ICNS GHSA](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr),
[JXL/HEIF GHSA](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq),
[Metro Assets](https://github.com/react/metro/blob/v0.84.4/packages/metro/src/Assets.js).
[U] Il report registry indica patched `>=2.0.3`, mentre le pagine GHSA
consultate mostrano None: non ne segue che un upgrade compatibile1.x esista.
Nessuna dipendenza forzata, nuova installazione o dichiarazione di patch upstream.

[F] READ/WRITE_EXTERNAL_STORAGE introdotti da expo-file-system sono bloccati
in config. L'import concreto usa il picker SAF e URI della cartella scelta;
[Android SAF](https://developer.android.com/training/data-storage/shared/documents-files)
non richiede i permessi storage generali. SYSTEM_ALERT_WINDOW bloccato soltanto
per `EAS_BUILD_PROFILE=preview-android`, preservando i development client.
FGS/media/notifiche/Internet conservati; nessun permesso microfono aggiunto.
`validate-android-permissions.mjs` verifica in memoria le direttive remove,
i due profili e il servizio media. [Expo blockedPermissions](https://docs.expo.dev/versions/latest/config/app/#blockedpermissions).
[U] Il merge finale dei manifest e l'import API24–32 senza permessi generali
richiedono una futura build/prova autorizzata; l'APK1.0.3 è invariata.

[F] Runtime sorgente/test Node22.23.1. CLI pnpm realmente disponibile11.19.0,
non11.16.0 dichiarata: non si falsifica la riproducibilità. Audit finale
invocato col Node fissato e l'entrypoint pnpm già presente. I precedenti pnpm
run hanno eseguito il controllo automatico no-op “Already up to date”; nessun
package/lock cambiato osservato. Per evitare auto-install del pnpm11 corrente,
usare `pnpm_config_verify_deps_before_run=warn` o i binari locali direttamente.
[F] Successivo controllo mirato trova pnpm11.16.0 già nella cache Corepack.
Si usa direttamente quel `bin/pnpm.mjs` con Node22.23.1, senza installare o
scaricare nulla. Il launcher predefinito11.19 non deve essere usato come prova
della versione fissata. Audit conclusivo ripetuto con la coppia esatta.

## Copy e prove locali

Ricevute grezze preservate in `dist/c2-evidence/`: `dependency-audit.json`
(pnpm11.16, exit1 coerente con due advisory), `android-permissions.json`
(introspection dei due profili, non merge APK), `apk-size.json` (audit ZIP/CRC).
Queste ricevute e gli export sono stati riesaminati indipendentemente da Work;
C2 accettata nel perimetro locale. Nessun nuovo ciclo di test richiesto per
questa annotazione documentale.

[F] “Playlist” rimosso dai testi/label visibili di setup, review giunzioni e
loop individuali. Commenti tecnici, identificatori, ricerca e cronologia non
sono sottoposti a replace globale. Revisione locale `PLAYER-REVIEW.28-C2-LOCAL`.

[F] 743/743 test in99 suite, inclusi297 audio; log `dist/c2-jest-final.json`.
Prima regressione: due test leggevano il percorso della route appena spostata;
corretti i riferimenti, poi intera suite verde. Primo lint ha rilevato un import
Buffer mancante nel nuovo validatore; corretto. Primo controllo marker cercava
anche filename storici: ristretto alle route/UI tecniche, con hash audio
consumer esatti obbligatori. Nessuna eccezione per marker di schermate.

[F] Doctor20/20, Expo install check, typecheck/lint, asset/ritual/ATP01,
boundary e10 test del parser audit PASS. Export Web consumer10 route, QA14
route: Audio Test e Workbench solo nel secondo; validatore export PASS.
[U] Gli export non sono APK, prova di ascolto o long-run. Nessun commit,
pubblicazione, invio audio, cloud build o modifica dei master. PWA online
resta26/Sites37 e APK resta1.0.3/4. Aggiornamento finale export/PWA sotto.

### Consolidamento conclusivo

[F] Export finali: `dist/c2-final-ios`44 file109653129B;
`dist/c2-final-android`48 file110810048B; entrambi2WAV103680088B con hash
canonici e senza marker delle route tecniche. Bundle Android SHA256
`1d9c9f91e5a3d818d94b5d0199df9079a109d3c640731db8e8e6161073c711c7`;
iOS `c8e8d4184fefb70a6209e659f2a311ea2337539c2d75f9e2904c679c3a9265ad`.

[F] PWA locale `dist/c2-pwa`:184 file12457342B, nessun audio, worker76.182B
SHA256 `655053067d4eb26967bb039a0237a66048922bfd9798ec2c96e66ff81b6ef6a7`.
Decoder10/10, validatore PWA PASS; il primo tentativo aveva indicato la vecchia
`dist/m5-pwa` e falliva correttamente per worker non allineato: non è stato
allentato il gate. Export fresco validato. Preflight locale con root FLAC
esplicita nel kit Android PASS47 file; il percorso default non contiene i FLAC
Hatha e va evitato. Nessuna copia dei file.

[F] Scan firme credenziali453 file testuali Git/untracked pertinenti:0 riscontri.
`git diff --check` PASS, staging vuoto, master/hash conservati. Questo scan non
è una certificazione di sicurezza completa. Formattazione del report applicata.

| ID            | Stato entro il mandato                                  | Residuo / minimo input                                                                      |
| ------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| AG10          | Corretto e verificato localmente                        | Nuova APK autorizzata per dimostrare il bundle installato; nessuna build avviata            |
| AG17          | Corretto e verificato il falso verde e la policy locale | Due advisory upstream accettati, merge manifest e prova API24–32 su futura APK restano gate |
| AG04 supporto | Inventario eseguibile ora completato                    | Work deve definire e far approvare il modello di consegna; nessuna opzione applicata        |

La chiusura tecnica C2 non chiude l'Obiettivo globale, il test iPhone, i diritti
o i gate C3/C4. Prosegue C3 locale, senza richiedere una nuova autorizzazione
per le sole verifiche già incluse nel mandato.
