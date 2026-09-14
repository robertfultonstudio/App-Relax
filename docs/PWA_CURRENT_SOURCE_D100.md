# D-100 — verifica PWA dai sorgenti correnti

13 settembre 2026. Solo export e prova locali; Android sospeso su richiesta.

## Perimetro

[F] D-099 verificava `dist/pwa-d093`, preesistente alle ultime patch. Questo
passaggio esporta i sorgenti correnti in `dist/pwa-d100`, senza sovrascrivere
il candidato precedente. Nessuna modifica a codice app, motore o audio.
Documenti aggiornati: questo rapporto, `STATO.md`, `docs/DECISIONS.md`.

[F] Node 22.23.1, Expo 57.0.22, export statico web con massimo due worker.
Cartella pubblica `public-pwa`, superficie PWA e audio same-origin espliciti.
Nessuna APK, build EAS, upload, pubblicazione, conversione audio o commit.

## Artefatto e controlli

- [F] Export, finalizzazione precache e validatore PWA: PASS.
  184 file, 12.431.440 byte, 53 route player preparate; nessun file audio,
  Audio Test o QA Workbench incorporato. Il player review PWA resta presente.
- [F] Precache: 161 URL / 8.350.852 byte. Tutti verificati via HTTP HEAD,
  161 risposte 200. Revisione:
  `903938556e4514172247c51e2d559cdd6549691174f461ba23f356eeace98704`.
- [F] Bundle `entry-1d3c8d5efeacf464ea8b095a308318e6.js`, SHA-256:
  `1dffd1ac8dac835169c1dff9432f81d88c356f5bda512c43b61af9379c565807`.
- [F] Worker FLAC rigenerato, byte invariati rispetto al candidato precedente:
  76.182 byte, SHA-256:
  `655053067d4eb26967bb039a0237a66048922bfd9798ec2c96e66ff81b6ef6a7`.
  Test worker: 10/10, nessuno saltato. Configurazione progetto: PASS.
- [F] Audit import indipendente su copia isolata: driver PWA web e guardia
  piattaforma per il wrapper nativo puro. Nel bundle assenti i marcatori
  controllati `ExpoPrivateCatalogPort`, `expo-file-system`,
  `NativeCatalogStore`, `ParamControlQueue` e package Android.
  Scan limitato anche a path sorgente RF, chiavi private e prefissi token:
  zero corrispondenze; non è una certificazione esaustiva di sicurezza.
- [F] Regressione completa più recente, D-099: Jest 644/644 in 89 suite,
  HTTP 19/19, lint e typecheck verdi. Non rieseguiti integralmente in D-100:
  il sorgente applicativo è invariato fra i due passaggi. Nessun risultato
  precedente viene presentato come un nuovo run.

## Browser reale locale

[F] Server statico loopback sulla porta 8095, catalogo read-only e nessuna
copia audio. Endpoint correnti servibili: 47 / 2.434.210.564 byte, più 21
URL WAV legacy. La PWA continua ad ammettere 45 registrazioni: le due texture
local-only non sono promosse da questa verifica.

[F] Scheda dedicata nel browser Codex, non Chrome. Aggiornamento tramite
`/update.html` riuscito senza fallback; Home outcome-first e Yoga immediato
presenti. Hatha completa offre 30/45/60/90 minuti e il player di sviluppo.

[F] Prova Hatha 90 + Rain, seed `yoga-music-rain-90-mu098vtz`: otto opere
musicali, nove registrazioni naturali, due estensioni loop complete dichiarate.
Play → Playing, mute principale, Pausa → Paused, salto a 05:22 in 304 ms,
Stop → Ready 90:00. Il contatore ha avanzato per circa otto secondi prima
della pausa. Console: nessun errore osservato nella scheda di prova.

[F] Sul salto: zero tentativi HTTP, un hit memoria, una lettura PCM in
100 ms comprendente una decodifica worker di 81 ms. Sono contatori interni
del comando, con clock lead fino a 60 ms, non latenza acustica su iPhone.

## Chiusura e limiti

[F] Player fermato, scheda dedicata chiusa, server terminato ordinatamente
con exit 0 / «PWA spenta». Le schede private dell'utente non sono modificate.
HEAD resta `6549f0117f2d7623fe20816cbf2c687385af6b8d`, indice vuoto;
worktree preesistente preservato. Il nuovo artefatto resta ignorato in `dist`.

[U] Non è un ascolto approvato, né un test continuo di 90 minuti. Loop senza
glitch, tempi su telefono/rete, background, batteria e offline restano
NON DETERMINATO — EVIDENZA INSUFFICIENTE.

[U] La versione privata online non è stata aggiornata. Nessuna nuova quota
EAS consumata da questo passaggio; Android rimane sospeso. Per una nuova prova
da iPhone occorre un distinto gate di pubblicazione privata autorizzata.
