# D-104 — PWA privata PLAYER-REVIEW.22

14 settembre 2026. Mandato: «aggiornare la PWA privata, devo provarla sul telefono».

## Perimetro e risultato

[F] Aggiornato soltanto il sito esistente
`https://app-relax-private-review.robfulton.chatgpt.site`, ancora owner-only:
un solo account autorizzato, nessun gruppo o visitatore esterno; policy revision 1.
Nessuna build APK/EAS, modifica del catalogo remoto, upload audio, nuova risorsa,
servizio a pagamento, modifica degli accessi o pubblicazione store.

[F] PLAYER-REVIEW.22 proviene da un export PWA fresco del checkout corrente.
Include i cambi già verificati D-091/D-093: riuso del reader completamente
inattivo durante Pause, rilascio su Stop/dispose, eliminazione del reset
superfluo del decoder FLAC al primo utilizzo. Consumer-paper, Hatha 30/45/60/90,
Rain/Ocean con volume separato, controlli di review e `/loop-review` conservati.
Non è una nuova dichiarazione di latenza o di qualità sonora sul telefono.

[F] Catalogo remoto invariato: 45 FLAC, 2.371.806.490 byte, senza duplicare
audio nella shell. Composizione: 13 musiche, 8 Hatha, 24 elementali
(11 Rain, 7 Sea, 5 Stream, 1 Esoteric Air). I 37 già approvati all'ascolto
restano distinti dagli 8 Hatha `TECHNICAL_PASS_LISTENING_PENDING` ammessi nella
review privata. `field-recording-01` e `night-birds-b1` restano local-only;
Eclypsis/Eclipse, Nirvana/Stillwater e Soft Air non rientrano nei 45 asset.

## Prove locali ripetute

- [F] Node 22.23.1; Jest 89 suite, 653/653 PASS (`dist/d104-jest.json`).
- [F] Test worker FLAC 10/10 PASS; build worker 76.182 byte,
  SHA-256 `655053067d4eb26967bb039a0237a66048922bfd9798ec2c96e66ff81b6ef6a7`,
  identico nel sorgente generato, nell'export e nel checkout Sites.
- [F] Export Expo Web con superficie PWA/same-origin, massimo due worker:
  77 route statiche, 53 player preparati. `dist/pwa-d104`.
- [F] Validatore PWA PASS: 184 file, 12.430.679 byte; nessun byte audio,
  Audio Test o QA Workbench. Il pannello di review PWA resta disponibile.
- [F] Precache: 161 file, 8.350.091 byte; revisione
  `cc94fcb4790ffb2512c16a299783678d006869568f54572e3ebe1b69a9f6131f`.
- [F] Audit indipendente dei 45 indici: hash/dimensioni/frame/formato e
  catene di entry coerenti, 4.585.437 byte; nessun asset mancante o extra.
- [F] Asset safety PASS, 533 file del repository esaminati.
- [F] Sito: 17/17 test PASS, build Vite/staging PASS, 184 file statici.
  Catalogo, worker di hosting e `.openai/hosting.json` identici al precedente
  commit del sito; solo README e artefatto pubblico aggiornati.
- [F] `git diff --check` pulito escludendo il file worker generato: quest'ultimo
  contiene un warning whitespace dentro il payload WASM compresso. Byte e
  hash verificati; payload non modificato per eliminare un warning testuale.
- [F] Preview statica loopback `http://localhost:8095/`: HTTP 200, senza Metro.

## Pubblicazione verificata

[F] Checkout Sites isolato `tmp/pwa-private-site`, inizialmente pulito.
Commit esclusivamente per il sorgente del sito, richiesto dal workflow di
pubblicazione: `38a7676f91eb75c098596d84f5d4bd0d0af95fbf`,
`Publish PLAYER-REVIEW.22 for private phone testing`; push source Sites riuscito.
Non è un commit/push della repository canonica App Relax.

[F] Archivio costruito da quel sorgente: `dist/pwa-d104-site.tar.gz`,
4.898.440 byte, SHA-256
`6b7dffbcb1bea0b429897ffeb43c482fddfafba357f21f3f0fbabaea668d99ff`.
Versione Sites 33:
`appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_f41bd44b1e6c819188005a120a4fe106`.
Deployment `appgdep_6aa74a3478848191bda1bcb7c4c4d85b`, **succeeded**
alle 01:13:38 UTC; environment revision 6 invariata.

[F] Controllo remoto dell'artefatto: 79 HTML con marker del bundle corrente
e 105 asset non-HTML byte-identici, incluso il decoder; nessun file statico
fallito. Accesso anonimo al catalogo HTTP 401.

[U] Il controllo audio automatico con token Sites identity-less si ferma
con HTTP 401 al catalogo: il worker richiede l'identità del visitatore
autenticato, non fornita dal bypass della sola piattaforma. Il comando
`tmp/d104-check-hosted.mjs` conserva questo FAIL dopo i 184 controlli statici
riusciti. Non sono stati dichiarati riusciti HEAD/Range audio remoti, non è
stato simulato un utente e non sono stati alterati gli accessi per il test.
Il catalogo e il codice hosting sono immutati rispetto alla precedente PWA.

[F] Server locale 8095 arrestato normalmente, porta verificata libera.
Checkout Sites pulito. La repository canonica conserva HEAD e indice vuoto;
alle 100 modifiche tracciate/94 entry untracked ereditate si aggiunge soltanto
il presente rapporto, con gli aggiornamenti coerenti di STATO/DECISIONS.

## Gate umano

[U] Ripetere sul telefono Play/Pause/Stop, loop del singolo file e passaggio
di sessione con Rain/Ocean. Latenza percepita, assenza di click, interruzioni,
background e long-run: `NON DETERMINATO — EVIDENZA INSUFFICIENTE` per questa
pubblicazione finché Robert non esegue la prova.

[F] Per sostituire la vecchia copia senza cancellare audio e preferenze:
fermare la riproduzione e chiudere altre finestre App Relax, aprire
`/update.html`, quindi `Open updated app`. Il link resta privato e richiede
l'account già autorizzato.
