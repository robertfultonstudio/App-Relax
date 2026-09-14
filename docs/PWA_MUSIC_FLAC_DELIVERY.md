# PWA musical FLAC delivery — D-082

Data: 13 settembre 2026. Stato: .14 pubblicata e verificata nel browser; ascolto iPhone aperto.

## Perimetro autorizzato

[F] Robert ha risposto «Autorizzo» alla sostituzione dei 21 WAV musicali con
i derivati FLAC verificati nello stesso Site owner-only, con arresto prima
di costi. Nessun nuovo ascoltatore, servizio, account, acquisto, EAS o commit
del repository App Relax. I master esterni e il catalogo sorgente sono read-only.

[F] Accessi riletti: owner, un solo account autorizzato, zero gruppi e visitatori
esterni. La documentazione ufficiale [prezzi Sites](https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost)
indica Sites incluso nei piani idonei durante la beta pubblica;
[limiti Sites](https://learn.chatgpt.com/docs/sites) non dichiara un tetto fisso R2,
ma ammette vincoli d'uso del piano. Nessun saldo/quota numerica live è esposto
dagli strumenti disponibili: NON DETERMINATO — EVIDENZA INSUFFICIENTE.
Nessun upgrade o metodo di pagamento; qualsiasi errore quota/costo interrompe
il trasferimento, senza fallback a un servizio a pagamento.

## File e identità

| Perimetro                                   |       Prima WAV |       Dopo FLAC |                   Differenza |
| ------------------------------------------- | --------------: | --------------: | ---------------------------: |
| 21 musiche (13 catalogo + 8 Hatha)          | 3.653.766.432 B | 2.023.381.325 B | −1.630.385.107 B / −44,6220% |
| 45 registrazioni attive (incluse 24 nature) | 4.002.191.597 B | 2.371.806.490 B |             −1.630.385.107 B |

[F] Fonti: `SESSION_REVIEW_5_LOSSLESS_REPORT.json`, spike completo D-078,
manifest index e file esterni in `App Relax Audio Derivatives/session-review-5`.
Nuova lettura integrale SHA/bytes di tutti i 21 FLAC e dei 21 WAV sorgente
da revisore read-only: 21/21 coerenti. Identità PCM completa e 105 finestre
contro WAV già provate D-078: non è una nuova approvazione all'ascolto.
Digest inventario ordinato filename/NUL/bytes/NUL/SHA:
`2e5c4a4107dd27960c73544be781e811d5ad6904cd9c2e9192f808c8e4ef3022`.

[F] Nessuna cancellazione remota: i vecchi 21 WAV restano per le versioni PWA
già aperte e per i download esistenti. A trasferimento concluso lo storage
fisico atteso è 6.025.572.922 B, distinto dai 2.371.806.490 B del catalogo
attivo. Le copie offline WAV restano valide; non si dichiara che i vecchi
pacchetti offline siano stati migrati o rimpiccioliti.

## Implementazione

- [F] Mapping esclusivamente PWA da filename sorgente a derivato verificato,
  con frame-count fail-closed. I contratti catalogo/native/offline sono invariati.
- [F] URL online musicali FLAC → reader PCM indicizzato già usato per la natura.
  Le lease offline `blob:` WAV continuano nel lettore WAV, non nel decoder FLAC.
- [F] 45 indici con SHA e formato verificati; i 21 indici musicali sono scaricati
  soltanto per l'opera scelta, senza caricarli tutti all'avvio. Budget shell
  iniziale 20 MiB non allentato, nessun byte audio nell'export.
- [F] Stage mantiene shell .12 e catalogo vecchio. Import limitato ai 21 SHA
  nuovi, streaming/checksum, HEAD e Range primi/ultimi 16 byte. La ready key
  nuova è scritta soltanto dopo verifica di tutte le 45 registrazioni.
- [F] Multipart con prenotazione condizionale prima della creazione: retry
  sulla stessa sessione, un record incerto richiede recupero manuale. Cleanup
  autenticato dei soli temporanei approvati anche oltre la scadenza; nessuna
  crescita illimitata di sessioni. Publish esige cleanup terminato.
- [F] Import con segreto effimero, mai in Git/archivio. Dopo la verifica vanno
  rimosse entrambe le variabili e applicata la revisione chiusa nel deploy .13.

## Gate eseguiti

- [F] Lint e typecheck PASS; Jest 77 suite / 547 test PASS.
- [F] Worker Site 16/16 PASS: auth, range, scope, readiness, retry e cleanup.
- [F] Server PWA 14/14 PASS; in più 21 HEAD e 42 Range primi/ultimi byte
  contro gli esatti nuovi FLAC locali: PASS.
- [F] Asset safety, configurazione, confini QA/PWA e validatore export PASS.
- [F] Precache: 160 file / 8.498.039 B; export include gli indici on-demand.
- [F] Export finale 183 file / 12.578.607 B; zero audio, zero match di pattern
  segreti/path RF. Revisione precache
  `56fe1a03e12947e37d219f7dd775a626188f60163cf19da7025533d01d55d77d`.
- [F] Regressioni audio dedicate: 18 suite / 196 test PASS; worker FLAC 8/8;
  ATP01 tre WAV e Hatha otto WAV originali/hash PASS, senza riscriverli.
- [F] Review indipendente: nessun P0/P1 residuo sul mapping e sulla migrazione.
- [U] Pubblicazione finale, browser remoto e chiusura import: da consolidare.
- [U] Doctor/install-check/security D-069 già documentati, non dichiarati verdi
  da questa modifica PWA. Ascolto iPhone, RAM low-end, background e interruzioni
  restano NON DETERMINATO — EVIDENZA INSUFFICIENTE.

## Browser locale .13

- [F] Cedar Current + Rain: seek a 15 s prima del loop 02:50.00; Playing
  osservato a 04:17. Famiglia Rain e main/ambience separati visibili.
- [F] Hatha60 + Ocean waves, seed `yoga-music-sea-60-mtzjx7fx`: sette musiche
  intere e sei nature. Seek 07:50, attraversato tutto il raccordo musicale
  08:01.91–09:42.50; pausa/ripresa a 09:06, ancora Playing a 09:52.
  Proseguito senza altri seek attraverso il cambio onde 09:42.50–12:42.50,
  ancora Playing a 13:14, senza errore visibile. Stop → Ready/60:00.
- [F] Log completo della sessione server, comprese le 42 micro-richieste del
  test HTTP: 370 GET FLAC, zero WAV, tutte Range finite / HTTP 206, massimo
  2.028.064 B per risposta, nessun overflow. Non equivale a 370 ascolti.
  Evidenza `dist/audio-continuity-audit/mixed-format-requests.json`.
- [F] Scheda di test chiusa e server PID 33148 terminato normalmente.

## Sorgente della pubblicazione

[F] Checkout Sites separato: versione 24 salvata, sorgente
`4828b581f6533ca447ae1cfccaffac20d045bc85`, 16 test PASS e build PASS.
Archivio `tmp/player-review13-site.tar.gz`: 5.357.909 B, SHA-256
`c5d48778c98329b42bfc14d10ebe6eeedaaf17c07d3218cc3a5d6b397a8f41cf`.
[F] Trasferimento terminato: 21/21 copie SHA/HEAD/Range verificate,
`ready:true,fileCount:45`, `pending:0`; 2.023.381.325 nuovi byte FLAC.
Stage 23 ha mantenuto .12 durante il trasferimento. Versione 24 / .13
pubblicata, deployment `appgdep_6aa66097fe888191a53b3e6ef71dedb1`
succeeded / env 6. Un account autorizzato, zero gruppi/visitatori esterni.

## Controprova online e correzione .14

[F] .13 sul Site: Distant Garden + Rain ha riportato `Audio buffer ran out`
a 01:05. Non viene dichiarata pronta sulla base della sola prova locale.
Le richieste viste nel log remoto sono FLAC / 206; la durata server degli
header non misura il tempo completo di trasferimento al browser.

[I] Il margine di refill di 16 s non ha assorbito la variabilità osservata.
.14 aumenta soltanto il refill a 32 s (finestra individuale ancora 8 s,
cache ancora quattro finestre). Startup invariato a 8 s: non si pretende
una garanzia su qualsiasi rete o RAM di ogni telefono. Test deterministico
di blocco refill per 20 s dopo warmup: passa senza salti né avvio ritardato.
Un esaurimento oltre la riserva continua a fallire esplicitamente.

[F] Le variabili import risultano rimosse in env 6, ma la controprova appena
dopo il deploy accettava ancora la vecchia chiave per cleanup. Nessuna nuova
scrittura audio: cleanup riportava zero temporanei. La causa/progressione
del runtime env non è dimostrata. .14 chiude perciò import e autenticazione
import nel codice se `catalog.phase=activate`, indipendentemente dalle
variabili residue. Test: vecchia chiave rifiutata, anche con expiry futura.

[F] .14 / Sites 25 / env 6 pubblicata, sorgente
`cda9d8ae2ab0fa334188d1d2c0993643fbdfbe82`, deployment
`appgdep_6aa662e1be408191ae4f1f418a4d5322` succeeded.
Archivio 5.357.979 B, SHA-256
`f43898805884eddd58d8f3402ccb4c0a0ea775a509dc312a819bd7d0813e30be`.
Worker 17/17, Jest 77 suite / 548 test, lint/typecheck/Prettier,
export/config/safety/boundary PASS. Shell ed export conservano gli stessi
pesi di .13; nuova revisione precache
`092bd680bfbc932f43abf5519fc65b7a675ac7abad24aebd36cd117834d638ad`.

[F] Chiusura import verificata online il 13 settembre alle 08:47:39 UTC:
la vecchia chiave non autorizza più nemmeno cleanup (HTTP 401).
Richiesta anonima al FLAC musicale HTTP 401. Accessi owner-only invariati.

## Esito finale browser .14

- [F] Il player remoto conferma `PLAYER-REVIEW.14`. Distant Garden + Rain
  in Playing oltre 02:32, contro il fallimento .13 a 01:05. Mute ambiente
  50→0→50 mantenendo il main a 80%. Seek prima del loop 16:16.00 e Playing
  osservato a 16:38, oltre la giunzione fine/inizio del file FLAC.
- [F] Hatha60 + Ocean waves, seed `yoga-music-sea-60-mtzkscbe`:
  seek 07:50, attraversamento completo della giunzione musicale
  08:01.91–09:42.50, ancora Playing a 10:07 senza errore visibile.
  Il successivo raccordo naturale è iniziato; non viene dichiarato osservato
  per intero online in .14. Il test locale .13 lo aveva superato fino a 13:14.
- [F] Stop → Ready, timer 60:00, Stop disabilitato. Scheda utente conservata
  sul player Hatha, audio fermo, controlli sviluppatore accessibili. Schede
  extra chiuse. Nessun server locale/Metro/emulatore lasciato da questa prova.
- [F] Regressione audio finale .14: 18 suite / 197 test PASS.
- [F] Repository canonico: HEAD invariato
  `6549f0117f2d7623fe20816cbf2c687385af6b8d`, index vuoto;
  127 voci status (75 modificate, 52 non tracciate, cartelle incluse),
  comprendenti il lavoro precedente preservato. Checkout Sites isolato pulito.
- [U] Nessun ascolto o long-run iPhone certificato. Il margine maggiore non
  garantisce ogni rete, background o telefono meno potente. Rimangono i
  residui dipendenze D-069 già classificati; nessun gate allentato.

## Differenze di questo turno

`pwaDeliveryFilename.ts`, `PwaWebAudioSourceResolver.ts`, `createPwaPcmReader.ts`,
registro/indici FLAC, build/validator/precache, server diagnostico, script di
preparazione manifest privato, revisione .13 e test relativi; questi documenti.
Il checkout isolato Sites contiene l'import e la shell pubblicabile.
Il resto del diff App Relax è lavoro precedente preservato, non tutto D-082.
