# D-111 — consegna della sola PWA privata

Data: 14 settembre 2026.

## Mandato e risultato

[F] Richiesta diretta: «Aggiorna solo Pwa», seguita da «continua».
Pubblicazione della shell C1/C2 già verificata, non nuova implementazione.
URL: https://app-relax-private-review.robfulton.chatgpt.site/

- Sites versione38; stato `succeeded`,14:30:27 UTC.
- Project: `appgprj_6a9bed84f78c81919575b1cbe1876cd1`.
- Version: `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_2bc44f680b048191985186957f30462f`.
- Deployment: `appgdep_6aa804f6d45c819182549446d3abc62c`.
- Accesso verificato prima del deploy: custom, un solo account owner ammesso,
  zero visitatori esterni, zero gruppi; access policy revision1 invariata.
- Environment revision6 invariata. Nessuna nuova configurazione di accesso.

## Candidato e catena di provenienza

[F] `dist/c2-pwa` riutilizzato integralmente:184 file,12457342 byte, zero audio,
zero symlink. Copia nel checkout Sites confrontata byte per byte con l'export.
Marker `PLAYER-REVIEW.28-C2-LOCAL` conservato deliberatamente: il suffisso
identifica il candidato, non significa che la versione sia rimasta soltanto locale.

- Entry: `entry-f86f98e1b7f97a0cf269b1b1e3c93600.js`.
- Entry SHA-256: `1bb21f709abf3b36e0044f079094a65368ad45c949faaf9145289f505e45a7a5`.
- Checkout Sites: `tmp/pwa-private-site`; commit `a6f64500c9426d41a06c62ee57632e0d2df458f4`,
  messaggio `D111: publish accepted private PWA review`.
- Predecessore Sites: `2999ae4604c62e3d91b687f88a0a51fce26bd413`.
- Solo README e public sono entrati nel commit Sites. Worker, catalog.json,
  configurazione hosting, dipendenze e script sono invariati; checkout pulito.
- Public precedente recuperabile in `/tmp/app-relax-d111-site-backup.pYgcMt/public`.
- HEAD canonico invariato: `53b506b8bc65284dff4c66eb0c53d60893f83c40`;
  index vuoto, modifiche preesistenti preservate. Nessun commit/push GitHub.

[F] Archivio preparato con helper Sites, `dist/pwa-d111-site.tar.gz`:

- gzip:4907106 byte; SHA-256 `2c78981b94960fe008b7b5fd163207b35057d7d57c46efea4d057531a0c0be48`.
- tar decompresso locale:12653568 byte;
  SHA-256 `d2a1f7c284e0a0878e907d62e637b9aa1c087b2aa9ce2c49c7b6563688a4047f`.
- snapshot archiviato dal servizio:12656640 byte,186 file;
  content hash `sha256:09bac34f6e0bd410952bab36b3045bd6b5b7d7a47e9727813a06a13e4c495bc6`.

I due tar non hanno lo stesso hash e non sono dichiarati byte-identici:
si distinguono il contenitore preparato e lo snapshot server. Il confronto
dei file client e delle risorse effettivamente servite è la prova del payload.
Nell'archivio locale:184 file client più worker/metadata, nessun file audio,
source map o percorso ascendente.

## Controlli proporzionati

[F] Riutilizzate le prove C2/C3:748 test/100 suite,297 audio, report
`C2_BUNDLE_SECURITY_REVIEW.md` e `C3_LOCAL_AND_DEVICE_REVIEW.md`.
Nessun nuovo run completo senza modifica del codice. Audit indipendente:
zero drift rispetto agli hash di40 sorgenti/config e41 includendo easignore.

[F] Rieseguiti per la pubblicazione: validatore PWA PASS;17/17 test hosting
PASS; build/staging Sites PASS con184 file statici. Runtime Node22.23.1,
dipendenze locali già presenti, nessuna installazione. Warning locale di tar
non bloccante, exit0 e contenuto verificato.

### Risorse effettivamente online

[F] Controllo autenticato del payload pubblicato, senza avviare audio:

- Home, Hatha90+Rain e `/loop-review`: HTTP200 e riferimento all'entry attesa.
- `/update.html`: HTTP200, titolo corrente e script `/pwa-update.js` presenti.
- `/offline.html`: HTTP200 e fallback atteso.
- Entry online identica al file locale; SHA-256
  `1bb21f709abf3b36e0044f079094a65368ad45c949faaf9145289f505e45a7a5`.
- `/pwa-update.js` online identico al file locale; SHA-256
  `4fcfb2be31262493354b2b3ef8ce3ac674d369a7fdd7574482d3bf5913f1228f`.
- Accesso anonimo: HTTP401. Token ufficiale temporaneo passato solo in memoria,
  mai scritto nel payload, negli script o nel report.

[F] Il vecchio checker esaustivo ha terminato con errore locale
`public/update.html: local app marker missing`: assumeva erroneamente che
anche la pagina autonoma di aggiornamento caricasse il bundle Expo. Non era
un HTTP fallito o un asset assente. La verifica mirata sopra usa i marker reali
della pagina e passa integralmente; script diagnostico `dist/d111-check-online.mjs`.
Non si dichiara un pass184/184 del vecchio checker né si ripubblica per questa
assunzione del test. Payload e checkout Sites non sono stati modificati.

[F] Richiesta riapertura della tab Sites esistente nel browser integrato:
handoff `queued`, senza nuova tab o reset forzato della sessione corrente.

## Perimetro invariato e limiti

[F] Conservati i controlli sviluppatore, timeline/barra adiacenti, cursore
sincronizzato, marker esatti, fade iniziale e cambio Rain/Ocean durante Play.
C1 distingue Resume da nuovo avvio e non reintroduce service worker sul dominio
privato; C2 separa consumer/QA e usa “Session” nel copy. C3 riguarda le prove.

[F] Nessun audio caricato: i45 FLAC remoti restano invariati; le due texture
local-only non sono state pubblicate. Nessuna modifica all'APK1.0.3/4.
Zero job EAS, zero nuova risorsa/binding, zero acquisti o step a pagamento
eseguiti; nessun costo richiesto dal workflow. Worker/import/audio/accessi
sono rimasti intatti. Nessuna credenziale salvata nel repository o ricevuta.

[U] Il workflow non espone una fattura: costo economico contabilizzato non
indipendentemente misurato. Prova shell/asset non equivale ad ascolto,
touch iPhone, latenza al suono, background, lock-screen o long-run; questi gate
restano NON DETERMINATO — EVIDENZA INSUFFICIENTE. Nessun nuovo giro audio
o browser invasivo durante la pubblicazione.

## Audit di completamento dell'obiettivo, dopo la consegna

14 settembre2026. Il turno di pubblicazione precedente è **progresso**:
ha aggiornato lo stato esterno e verificato l'entry online. Non equivale alla
chiusura del più ampio obiettivo «tutte le novità ... completamente funzionante».

[F] Nuovo controllo read-only: zero drift dei sorgenti/test rispetto alla
ricevuta C3; `dist/c3-jest-final.json` conferma748 PASS/0 FAIL,100 suite.
Inventario dispositivi corrente: soltanto Chromium, disconnected; nessun
telefono o simulatore mobile utilizzabile. Registro C3:0 righe di prova.

| Requisito corrente                            | Evidenza e verdetto circoscritto                                                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA aggiornata e privata                      | Sites38, hash dell'entry online e HTTP401 anonimo: consegna provata.                                                                                                                                  |
| Barra sotto diagramma, cursore sincrono, seek | `pwaTimelineTransport.test.tsx` controlla posizione del componente, gesture non committata, ripristino su errore e clock; prove desktop C3. Touch reale resta aperto.                                 |
| Controlli loop/giunzione e Hatha30/45/60/90   | `c3ReviewOracle.test.ts` verifica identità delle sorgenti, frame/marker, seed ripetibile e fine esatta. Non prova assenza udibile di clic o compatibilità musicale.                                   |
| Fade e Rain/Ocean durante Play                | Oracolo fade3s; test LiveNatureFamily/Safety/FutureClock verificano mantenimento musica/timer/livelli, rollback e Stop. Prove hosted D-106 distinte dalle prove software C3.                          |
| Play/Pause/Stop e Resume                      | Prove C1 e regressioni verdi, candidato immutato. Non sono misure di tap→suono.                                                                                                                       |
| Maggiore reattività / latenza quasi nulla     | Seek software misurato, ma latenza udibile fredda/calda su telefono non misurata: requisito ampio non provato.                                                                                        |
| Tutti gli audio                               | 45 FLAC remoti; Field Ambience e Night Birds esplicitamente local-only, esclusi da IndividualTrackReview. Nessuna affermazione di47 file online; nuova delivery fuori dall'ultimo mandato shell-only. |
| Uso offline completo                          | Policy privata `online-only` confermata nel codice. Audio salvato non equivale ad avvio offline della shell; non dichiarare questa capacità.                                                          |
| Accessibilità e continuità reale              | Eventi simulati e prove desktop non sostituiscono VoiceOver/TalkBack, interruzioni, lock-screen e long-run fisici.                                                                                    |

[U] Obiettivo generale **non completato**. Primo audit residuo dopo D111:
servono riscontri fisici/ascolto; non si creano test fittizi o ulteriori run
desktop identici. Nessun processo di test o audio avviato in questo audit.
La preparazione di nuovo catalogo remoto/offline, se richiesta, necessita di
un mandato separato e non viene inferita da «Aggiorna solo Pwa».
