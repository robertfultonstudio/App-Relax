# C1 — stato, istruzioni e sessione corrente

14 settembre 2026 · **LOCALE VERIFICATO, NON PUBBLICATO**.
Candidato `PLAYER-REVIEW.27-C1-LOCAL`. HEAD preservato
`53b506b8bc65284dff4c66eb0c53d60893f83c40`, branch `codex/quiet-by-design-m2`.
Le 35 modifiche D-106/D-107 preesistenti sono state preservate; nessuno staging,
commit, push, nuova APK, pubblicazione o cambio audio/accesso.

## Esito della revisione Strategy — integrazione AG03

[F] La revisione ha accettato AG01 come PASS statico circoscritto e AG02 sul
confronto immagini/DOM e sui test736 già consegnati. Ha mantenuto AG03 parziale:
il diagramma di `ARCHITECTURE.md` e la frase sulle route consumer descrivevano
ancora il percorso superato durata→Continuum→Web QA e il solo SingleTrackProgram.
La precedente chiusura locale non costituiva quindi accettazione completa AG03.

[F] Corretto soltanto quel residuo: diagramma attività→Play con timer
facoltativo, rami single/adaptive coordinato, Hatha separato e controller/driver
di piattaforma. La descrizione distingue `/listen` single o adaptive con natura
da `/adaptive-session` con `kind: "adaptive"`; espliciti i gate delle factory.
Riletti i riferimenti effettivi `ImmediateSessionSetup.tsx`,
`src/app/listen/[workId].tsx`, `src/app/adaptive-session/[outcomeId].tsx` e
`platformSessionFactories.ts` senza modificare codice o audio.

[F] In questa integrazione sono cambiati soltanto `docs/ARCHITECTURE.md` e
questo rapporto. Verifica dei riferimenti, formattazione e diff documentale;
nessuna nuova suite, server, export/build, commit o pubblicazione. I736 test
restano il run C1 precedente, non una nuova esecuzione.

**AG03: correzione documentale locale pronta, rilettura Strategy pendente.**
Nessun avvio C2–C4 e nessuna modifica al candidato eseguibile o ai suoi screenshot.

## Fonte e perimetro

Rapporto `Audit_generale_App_Relax.md`, audit Strategy14settembre, SHA-256
`a213d5fdc997e4310f2338440e831d100a9f559bec79de7a76d161c5b4db7cb4` e
`Mandato_Sviluppo.md`, entrambi letti. Solo C1, non C2–C4. Product Design ha
guidato il confronto dello stesso flusso a390×844, senza redesign; Expo/Jest
per stato, cache e regressioni. Il profilo operativo consigliato è Sol/High.
Nessuna installazione o superficie mobile avviata.

| ID                                       | Risultato locale                                                                                                                                                   | Evidenza e limite                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AG01, confermato                         | Stato `online-only` sul solo hostname privato, nessun tentativo di registrare/verificare shell o retry impossibile. Copy distingue audio salvato e accesso all'app | Test su policy, preparazione diretta, DownloadControl e update. Preservate operazioni audio e cache. Il browser localhost mantiene intenzionalmente la policy shell ordinaria: il suo screenshot **non** prova il ramo dell'host privato, coperto dai test, non pubblicato |
| AG02, comportamento confermato/ambiguità | Nuova sessione e sessione in pausa distinguibili; `Start new session` vs `Resume`, tempo residuo corrente esplicito                                                | Test single/nature, ritorno/Hatha regressione; browser Pause20→45→Resume20→Return→nuovo45→Stop. Non è stato cambiato il contratto timer né introdotta sostituzione implicita                                                                                               |
| AG03, confermato                         | Sommari correnti e avvisi storici aggiornati                                                                                                                       | Architettura/kit/runbook confrontati con factory, NativeCatalogStore e manifest47 file/2.434.210.564 byte. Nessuna nuova prova AVD o telefono; D-103 resta evidenza storica                                                                                                |

## File C1

- Stato e relazione: `STATO.md`, `docs/DECISIONS.md`, questo documento.
- AG01: `src/offline/pwaShellPolicy.ts`, `src/offline/PwaShellReadiness.ts`,
  `src/pwa-review/pwaShellBootstrap.ts`, `src/components/DownloadControl.tsx`,
  `src/app-pwa/settings.tsx`; test `tests/offline/PwaShellReadiness.test.ts`,
  `tests/offline/DownloadControl.test.tsx`, `tests/domain/pwaUpdate.test.ts`.
  `public-pwa/pwa-update.js` non richiedeva una modifica; test eseguiti.
- AG02: `src/app/listen/[workId].tsx`,
  `src/components/ConsumerPlaybackSurface.tsx`, `src/components/CurrentSessionBar.tsx`;
  test `tests/ui/consumerPlayer.test.tsx`, `tests/ui/currentSessionBar.test.tsx`,
  `tests/ui/listeningContinuityReview.test.tsx`.
- Identità locale: `src/content/reviewRevision.ts`.
- AG03: `docs/ARCHITECTURE.md`, `docs/M4_CONSUMER_AUDIO_CATALOG.md`,
  `docs/ANDROID_CONSUMER_OFFLINE_KIT.md`, `docs/runbooks/ANDROID_PHYSICAL_DEVICE.md`,
  `docs/runbooks/NATIVE_AND_EAS_GATES.md`.

Alcuni di questi percorsi contenevano già D-106/D-107: il diff totale contro
HEAD non equivale al solo C1. Gli altri cambi preesistenti non sono C1.

## Test effettivi

Runtime usato Node22.23.1, dipendenze locali esistenti; nessun install.
Il pin progetto resta pnpm11.16.0; i controlli hanno usato Node diretto e npm
per eseguire gli script, senza cambiare package manager/lockfile.

- Mirati iniziali:55/55 in6suite (`dist/c1-targeted.json`).
- Primo completo:734/736; due FAIL dovuti all'aspettativa della vecchia etichetta
  `Play this sound` nella suite continuity, non a perdita della sessione.
  Aspettative aggiornate e rafforzate con stato/tempo espliciti;11/11 nel recheck.
- Completo finale: **736/736,97/97 suite,36,918s**, inclusi294 test audio;
  `dist/c1-final-green.json`. Zero suite/test saltati. Motore non modificato in C1.
- Lint, typecheck, Prettier dei file C1, `git diff --check`: PASS.
- Asset safety, artwork, placeholder e ATP01, config e confine QA/PWA: PASS.
- Server locale:18PASS/1SKIP iniziali; il solo caso47URL inizialmente saltato
  senza root è poi eseguito con root esplicita, **PASS**. Copre HEAD/range
  dei47 file, non ascolto né download integrale.
- Export Metro PWA + finalizzazione/validatore: **184file,12.458.109byte,zeroaudio**;
  precache161file/8.377.521byte, revisione
  `8b9335a7d91f5d6db860576b848c916cec0a944c1b18ae526e7de674e57fa95c`.
  Bundle `entry-c56213bfbae64376b501347b765fe4cb.js`; `dist/pwa-c1`.
- Scan firme credenziali su603file testuali Git-scope+export: zero riscontri.
  È uno scan per firme, non attestazione assoluta di sicurezza.

Non rieseguiti Doctor/audit dipendenze o export nativi: nessun cambio dipendenze,
config nativa o permessi in C1. Nessun risultato storico è promosso a nuovo run.
Sicurezza/advisory e residuo QA dell'APK restano AG17/AG10 per C2.

## Confronto browser locale

Browser integrato Codex,390×844, `localhost:8096`; non Safari emulato.
File in `dist/c1-evidence/`, acquisiti dalla pagina, riaperti/ispezionati:

1. `01-before-paused-new-duration.png`: .26,Ready45 e vecchia sessione19:36,
   entrambe con Play ambiguo. Controlli presenti, non persi.
2. `02-before-settings-local.png`: .26, istruzioni precedenti.
3. `03-after-settings-local.png`: .27-C1-LOCAL, copy aggiornato, host locale
   ordinario (non prova del ramo online-only privato).
4. `04-after-paused-new-duration.png` e relativo `.txt`: nuova45 separata da
   `Paused · 19:52 left` / Resume, Stop raggiungibile, artwork/layout conservati.
5. `05-explicit-new-start.txt`: Playing45 soltanto dopo Start new session.

[F] Resume ha conservato19:52; Return è tornato al timer20 con19:43 rimanenti.
Nuovo Start ha portato esplicitamente a45:00, poi Stop→Ready. Nessun errore
console raccolto. Nessuna azione Download/Remove/Clear eseguita. La prova
locale e il suo server sono stati spenti; scheda online utente intatta.

[U] Comprensione da parte di nuovi utenti, touch/latency/qualità iPhone,
background e telefono reale: **NON DETERMINATO — EVIDENZA INSUFFICIENTE**.
Non è stata rimisurata la latenza D-107 né modificato alcun audio per C1.

## Gate di consegna

PWA remota ancora **.26/Sites37**, APK **1.0.3/4** invariata. C1 è pronto alla
revisione locale; richiede autorizzazione distinta prima di pubblicazione o
commit. L'Obiettivo globale PWA non viene sostituito né dichiarato completato:
restano gate umano iPhone e autorizzazioni di consegna. C2–C4 non avviate.
