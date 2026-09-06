# A02 — Download verificati e storage locale

5 settembre 2026. Implementazione software nel worktree isolato A02; nessun
upload, nuova delivery, build nativa/cloud, commit, push o modifica audio.

## Risultato e confini

- [F] La delivery D-059 è già presente: la modifica usa soltanto le URL relative
  same-origin `/audio-catalog/` dei 37 file approvati, con i byte e gli SHA-256
  del manifest corrente. Il totale resta 2.657.446.897 byte; nessun file audio
  viene aggiunto alla shell, Git o EAS.
- [F] Ogni opera può essere scaricata singolarmente. Lo starter esplicito
  `approved-rain-starter-v1` contiene Quiet Weather, Sheltered Rain e Soft
  Weather: tre registrazioni approvate, 16.622.588 byte. Nessun generatore
  viene spacciato per un asset scaricato. Nessun download all'apertura o di
  tutto il catalogo.
- [F] OPFS mantiene file privati immutabili. Il worker dedicato usa
  `FileSystemSyncAccessHandle`, ACK dopo ogni scrittura e blocchi massimi da
  256 KiB. Il fetch rispetta la backpressure; un solo download selezionato è
  in corso. Non esiste un buffer JS grande quanto il file o il catalogo.
- [F] SHA-256 incrementale conforme al procedimento FIPS 180-4, verificato con
  vettori standard, il vettore da un milione di `a`, boundary e confronto con
  Node crypto. Il digest del download viene confrontato al manifest; il file
  viene poi riletto a blocchi e ricontrollato prima della promozione. Una sola
  scrittura atomica dell'indice rende visibile l'intero tentativo.
- [F] Spazio stimato prima del trasferimento sui byte mancanti, con riserva di
  64 MiB; quota reale e relative eccezioni restano determinanti. Nessun limite
  artificiale al numero dei 37 file: ciascun file, incluso il WAV massimo da
  345.312.044 byte, usa lo stesso percorso a blocchi, subordinato allo spazio
  effettivo. Questo non dimostra prestazioni o decoder di quel WAV su iPhone.
- [F] Retry riparte dai file mancanti o corrotti, conservando gli asset già
  verificati. Cancel annulla il trasferimento e impedisce la promozione;
  uno staging abbandonato viene recuperato sotto un lock dell'origine.
  Non è implementato il resume HTTP dentro un singolo file.
- [F] Remove nasconde la copia senza cancellarne i byte. Undo verifica e
  ripristina la copia. `Free space permanently` elimina soltanto quella copia
  locale già rimossa ed è rifiutato mentre una lease di riproduzione è attiva.
  L'undo termina con questo secondo gesto esplicito. Master e delivery remota
  non vengono modificati.
- [F] `acquire(workId)` rilegge e verifica i byte attuali, acquisisce un lock
  condiviso cross-tab e restituisce un URL `blob:` legato a un `File` OPFS.
  `release()` revoca l'URL e il lock una sola volta. La rimozione definitiva
  richiede il corrispondente lock esclusivo. File assenti/incompleti non
  diventano sorgenti locali valide.

## API d'integrazione

`getPwaOfflineDownloads()` da `src/offline/PwaOfflineDownloads.ts` espone
`subscribe`, `getSnapshot(packageId)`, `getServerSnapshot(packageId)`,
`hydrate(packageId)`, `download(packageIds)`, `cancel()`, `remove(packageId)`,
`undoRemoval(packageId)`, `purgeRemoval(packageId)` e `acquire(workId)`.

Ogni work ID approvato è anche un package ID. Lo starter ha l'ID dedicato sopra.
`DownloadControl workId="…"` offre la singola opera; senza prop offre lo starter.
Il componente non usa API audio. Il resolver PWA deve preferire la lease
verificata, poi usare la delivery online se assente; ogni percorso di load
fallito, sostituzione e cleanup deve rilasciare tutte le lease.

Il tipo condiviso `VerifiedAudioFile` contiene `uri`, `workId`, `sha256`,
`byteSize` e `release()`. `NativeVerifiedAudioResolver` applica la stessa
verifica incrementale sopra una porta `NativePrivateAudioFiles` iniettata:
URI `file:///` privato, letture a blocchi e lock del file. La porta deve
garantire immutabilità durante la lease e non risolvere master esterni.

[U] `expo-file-system` è presente transitivamente ma non dichiarato nel
package dell'app: non è stato importato attraverso un percorso interno né
installato. Un adapter nativo concreto di storage/download richiede la
decisione del root sulle dipendenze e l'integrazione autorizzata. Il contratto
e i test del resolver non dimostrano un download nativo operativo.

## Shell PWA

Eseguire dopo ogni export e prima della validazione/pubblicazione:

```bash
node scripts/finalize-pwa-precache.mjs dist/m5-pwa
```

Lo script genera `precache-manifest.js`, include tutte le route consumer,
bundle JS, font, artwork e worker storage; rifiuta audio, symlink e shell oltre
20 MiB. La revisione include byte della shell e codice del service worker.
Un export non finalizzato non può installare il nuovo service worker.

Il worker precachea la shell integralmente e sequenzialmente. Un errore
annulla soltanto la cache della nuova revisione. Navigazione offline con URL
pulite/query e asset sono risolti dalla cache della stessa revisione. Audio e
Range non sono intercettati: l'audio offline usa la lease OPFS esplicita.
Gli aggiornamenti non invocano `skipWaiting`, `clients.claim` o reload e
attendono la chiusura delle vecchie finestre. Il primo caricamento può
richiedere una nuova navigazione prima di essere controllato dal worker.

## Verifica e gate aperti

### Consolidamento root A01–A14

[F] Resolver async/lease, UI download, export e validatori sono integrati.
Prova reale nel browser Codex: starter di 16.622.588 byte verificato, rete
disattivata, pagina chiusa con about:blank e riaperta, Quiet Weather in Play
10:00 → 09:18. Remove/Undo verificati senza purge; connessione ripristinata.
La vecchia revisione cache è rimasta attiva fino alla chiusura della pagina,
poi la nuova ha preso il controllo senza takeover forzato. Dettagli e limiti
in `AUDIT_A01_A14.md`; i punti Root sotto sono il handoff storico, ora superato.
Non equivale a riavvio del processo browser, installazione iPhone o test di
tutti i file offline. La porta storage nativa concreta resta non implementata.

[F] Questa evidenza è LOCALHOST. Sul sito privato versione 3 il Rain starter
si scarica e verifica, ma la riapertura senza rete FALLISCE nel browser
integrato. [U] Causa e riapertura privata/installata offline:
**NON DETERMINATO — EVIDENZA INSUFFICIENTE**. A02 non è chiusa end-to-end;
il test iPhone iniziale deve essere online. Dettaglio in `AUDIT_A01_A14.md`.

[F] Follow-up A01-A14.2: corretto il mancato gate fra file audio verificato e
shell effettivamente pronta. La UI ora controlla registrazione, ready,
controller e risposta del worker sulla completezza della cache; distingue
pronto, da riaprire online, errore/timeout e retry. Non forza attivazioni o
reload durante l'ascolto. Nuovi test lifecycle/UI e suite completa: 377/377.
La correzione non prova da sola la causa o la risoluzione del reopen remoto.

- [F] Gate del worktree A02 con Node 22.23.1: Prettier, ESLint scoped
  `--max-warnings=0`, TypeScript completo e `git diff --check` verdi.
  Jest seriale `tests/offline`: **11 suite / 54 test verdi**, cache isolata in
  `tmp/jest-cache`. Nessuna installazione o scrittura in node_modules.
- [F] Test unitari: SHA-256, manifest 37/starter, staging/hash readback,
  promozione atomica, corruzione, file mancanti, undo, lease e purge,
  recovery orfani, sorgente HTTP/MIME/byte/path/abort, worker shell completa,
  URL pulite offline e aggiornamento non intrusivo; resolver nativo a blocchi.
- [U] Root: integrare il resolver async e il lifecycle delle lease, collocare
  DownloadControl, aggiornare lo script export e i validatori PWA esistenti,
  uniformare il vecchio fallback HTML che dice ancora che tutto richiede rete.
- [U] Root: export finale, prova browser reale con download esplicito,
  disconnessione, chiusura e riapertura, Play locale, Retry/Cancel/spazio e
  prova di aggiornamento con sessione attiva. Non sono sostituiti dai mock.
- [U] Safari/iPhone/Android fisici, decodifica di ogni opera, riapertura
  installata offline, background, Bluetooth e qualità: **NON DETERMINATO —
  EVIDENZA INSUFFICIENTE**. A02 software non chiude da solo il gate mobile A01.

Supporto verificato mediante feature detection, non user-agent: secure
context, OPFS, Worker, Storage estimate e Web Locks. La scrittura sync in
worker precede l'introduzione di `createWritable` in Safari 26. Storage API
completa/quote moderne sono documentate da Safari 17; la concessione di
persistenza è best effort, e rifiuto/eviction non vengono nascosti. Tenere
aperta la PWA durante un download: nessun background download è promesso.

Fonti primarie: [WebKit — OPFS](https://webkit.org/blog/12257/the-file-system-access-api-with-origin-private-file-system/),
[WebKit — Storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/),
[WebKit — Web Locks in Safari 15.4](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/),
[Apple — Safari 16.4](https://developer.apple.com/documentation/safari-release-notes/safari-16_4-release-notes),
[NIST — FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final).
