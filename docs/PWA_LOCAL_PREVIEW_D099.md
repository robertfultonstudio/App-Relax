# D-099 — launcher locale allineato alla PWA lossless

13 settembre 2026. Solo correzioni locali, Android sospeso. Nessuna build,
compilazione/export nuovo, pubblicazione, copia audio o commit.

## Difetti riprodotti e corretti

[F] Il launcher usava soltanto il manifest M4 e gli otto WAV Hatha.
Con il candidato `dist/pwa-d093`, 23 dei 47 indirizzi audio correnti davano
404: 21 musiche FLAC e le due texture locali. Non è prova di un difetto del
server privato online, che usa un'implementazione distinta.

[F] Il launcher ora unisce i manifest approvati con il registro FLAC del
player. Cerca solo file espliciti; i FLAC mancanti nel catalogo locale possono
essere letti da una cartella derivata scelta con `--lossless-root`. Non copia
né converte nulla. Un file locale corrotto/symlink non viene mascherato dal
fallback. Identità discordanti fra manifest bloccano l'avvio.

[F] Sono servibili 47 file correnti / 2.434.210.564 byte; restano accessibili
21 precedenti URL WAV per compatibilità con copie offline/vecchie shell.
Sono riferimenti a file preesistenti, non nuove copie né opere duplicate.
L'inventario PWA .22 continua correttamente a mostrare 45 registrazioni:
Field Ambience e Night Birds restano `local-only`, non promosse nella PWA
privata pubblicata o nella navigazione PWA da questo intervento.

[F] Secondo difetto: `/flac-source/MANIFEST.sha256` era nell'elenco precache
ma il server non lo serviva (404). L'installazione della shell falliva,
lasciando attiva una versione precedente. Aggiunto il MIME testo e un gate
che rifiuta l'avvio se anche un solo URL precache non è servibile.
Il recupero applicativo prima falliva; dopo la correzione torna alla schermata
attività → Play corretta senza usare il secondo pulsante di fallback.
Nessun audio salvato o preferenza cancellati.

## Prove

- [F] Due regressioni RED → GREEN: sorgente lossless esterna e manifesto
  SHA-256 precache. HTTP/launcher: 19/19 test, nessuno saltato nel run completo.
- [F] Tutti i 47 URL: HEAD 200, dimensioni e identità dichiarate corrette;
  94 Range iniziali/finali con byte uguali ai file. È un controllo trasporto,
  non una nuova verifica SHA integrale o di ogni campione PCM.
- [F] Jest dell'app: 644/644, 89 suite; `dist/d099-local-jest.json`.
  Primo invio con un separatore CLI superfluo non trovava test; corretto e
  rieseguito senza abbassare criteri o usare pass-with-no-tests.
- [F] Worker FLAC esistente: 10/10. Typecheck, lint, configurazione,
  confine QA/PWA e validatore del candidato D-093 PASS. Il validatore config
  è stato adattato al nuovo helper, conservando loopback e manifest espliciti.
- [F] Browser Codex locale, candidato .22 preesistente: Astral Thread
  Play/Pausa/seek/Stop; ultimi 5 s in 96 ms, ritorno osservato a 00:24.
  Prova del contatore in mute, NON ascolto approvato del loop.
- [F] Tutti i161 URL precache rispondono200 via HTTP locale dopo la
  correzione; prima160/161. Recupero shell nel browser riuscito.
- [F] Hatha90 + Rain: otto musiche, nove nature, due estensioni loop dichiarate;
  Play e Pausa riusciti. Seed `yoga-music-rain-90-mu08pgq5`: salti preparati
  05:22 in 272 ms e 13:12 in 355 ms; Stop → Ready90:00. Non un long-run90.
  Tempi del comando UI, più clock lead fino a60 ms; non latenza acustica iPhone.
- [F] Il browser aveva inizialmente la vecchia shell locale: quel setup Yoga
  obsoleto è escluso dalla prova Hatha. Recuperata attraverso la pagina
  `/update.html`; nessuna modifica alla PWA online.

## Riproduzione locale

Con Node22.23.1 e il runtime pnpm11.16.0 del progetto, fornire i percorsi
già esistenti (non installa né genera file audio):

```bash
pnpm web:pwa --check --artifact dist/pwa-d093 --lossless-root /percorso/derivati-esistenti
pnpm web:pwa --artifact dist/pwa-d093 --lossless-root /percorso/derivati-esistenti --port 8095
```

Test con i file esterni esplicitamente selezionati:

```bash
APP_RELAX_TEST_LOSSLESS_ROOT=/percorso/derivati-esistenti node --test tests/scripts/pwaPreviewServer.test.mjs
```

[U] Nessuna revisione online nuova: .21 resta quella pubblicata, .22 soltanto
locale. Nuovo export dopo le patch dipendenze/native, pubblicazione privata,
ingresso delle due texture nella PWA, ascolto iPhone, latenza quasi-zero
generale, offline e long-run non sono certificati da questa correzione.
Android rimane sospeso. Goal complessivo non completato.

## Chiusura operativa

[F] Scheda di test locale chiusa e server terminato con exit0 / «PWA spenta»;
nessun listener8095, Metro, emulatore o processo build trovato al controllo.
Le schede private dell'utente sono state preservate. HEAD invariato
`6549f0117f2d7623fe20816cbf2c687385af6b8d`, indice vuoto; modifiche pregresse
preservate. Nessuno staging globale. Secret scan limitato agli otto file
interessati: zero match per chiavi private/token delle regole provate,
non una certificazione esaustiva. Prettier e diff-check finali PASS.

[F] File di questo passaggio: `scripts/current-pwa-preview.mjs`,
`scripts/start-pwa-web-preview.mjs`, `scripts/pwa-preview-server.mjs`,
`scripts/validate-project-config.mjs`, `tests/scripts/pwaPreviewServer.test.mjs`,
questo documento, `STATO.md` e `docs/DECISIONS.md`.
