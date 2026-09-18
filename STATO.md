# Stato progetto

Aggiornato: 17 settembre 2026

## Correzione successiva M6 — Welcome e ambiente live pubblicati

[F] Nuova richiesta utente implementata: ingresso pittorico interattivo `/`,
attività spostate su `/moments`, Play disegnato senza emoji o titolo tipografico.
Rain/Ocean/Off possono cambiare durante la musica tramite il controller e bus
separati; Off non prepara decoder o file naturali. Feedback e annullamento
visibili, musica/timer invariati durante la modifica dell'ambiente.

[F] Prova strumentale nel browser reale: segnale PCM simultaneo su bus musica
e natura, musica continua quando natura viene spenta. Nessun asset audio,
servizio o dipendenza aggiunto. Dettaglio, controlli e screenshot in
`docs/M6_LIVE_AMBIENCE_WELCOME.md`.

[F] Pubblicazione privata esplicitamente autorizzata e completata sul Site
stabile `https://app-relax-private-review.robfulton.chatgpt.site/`: Sites41,
marker `PLAYER-REVIEW.32-WELCOME-LIVE-LOCAL`, stato succeeded. Accesso ancora
owner-only: un solo account, zero gruppi e zero ospiti; richiesta anonima 401.
Il browser autenticato ha mostrato la nuova Welcome, la route `/moments`, il
Play disegnato e Rain/Ocean/Off; nessun warning o errore console. Manifest
radice, standalone, service worker e metadati/icona Apple sono presenti.
Worker, catalogo, 45 registrazioni e binding audio hanno hash invariati.

[U] Android e iPhone fisici non collegati; Sentry non configurato/accessibile.
Installazione Safari > Aggiungi alla schermata Home, riapertura standalone,
playback concorrente nativo, prestazioni/touch/accessibilità reali, ascolto,
background e offline: NON DETERMINATO — EVIDENZA INSUFFICIENTE. Nessun commit
o push del repository canonico, PR, APK/EAS, upload audio o costo. Il gate
dispositivo resta aperto: non dichiarare tutti gli acceptance criteria chiusi
sulla base delle prove software o browser.

## M6 — gate locali chiusi, PWA privata aggiornata

[F] Implementazione M6 e patch Expo57.0.23 consolidate:103 suite/761 test,
55 tooling, lint/typecheck, validatori ed export Web/PWA PASS;
Expo Doctor20/20 e install check allineato. Trasporto pastello, tab netti,
font locali e pitture approvate conservati. Nitidezza verificata senza
filtri/ombre sui caratteri; screenshot validi `*-visible.png` e confronti
in `dist/m6-closeout/`, non gli scatti CDP diagnostici a scala incoerente.

[F] Su autorizzazione esplicita «Sì, aggiorna la PWA privata a costo zero»,
Sites40 pubblicata con stato succeeded, accesso owner-only invariato,
ambiente6. Nessun nuovo servizio/costo richiesto, upload audio o APK/EAS.
Catalogo45 registrazioni e Worker invariati; controlli review, Hatha90,
Rain/Ocean, volumi, loop e giunzioni conservati e provati nel browser.
Dettaglio e limiti: `docs/M6_CLOSEOUT.md`.

[U] Il prossimo gate è la prova iPhone dell'utente, non altra implementazione
M6. Nitidezza percepita sul dispositivo, ascolto, touch/VoiceOver, offline e
background restano NON DETERMINATO — EVIDENZA INSUFFICIENTE per questa versione.
Nessun commit/push canonico; worktree precedente preservato, index vuoto.
Le note successive sono cronologia e non riaprono i gate già chiusi sopra.

### M6 — ultimo feedback: trasporto pastello e tipografia

[F] Revisione locale: fondo lavanda/cipria sfumato, Stop delimitato,
Pause nitido; tab netti e selezione giada. Zen Old Mincho + Hanken Grotesk
locali, 329696 byte. Ultimi gate: 103 suite/760 test, typecheck/lint,
font/asset/config/secret scan ed export PWA PASS. Screenshot `*-pastel.png`
in `dist/m6-review/`; dettaglio in `docs/M6_APP_INTEGRATION.md`.
[U] Approvazione visiva della nuova revisione e patch Expo ancora pendenti.
Solo anteprima locale aggiornata; nessun commit/deploy/build, audio fermo.

## D-116 — integrazione M6 approvata, gate finale Expo aperto

[F] Dopo l'approvazione «prosegui e concludi M6», direzione 1–2 integrata
nell'app reale: Home pittorica, player coordinato, Play/Pause senza ombre,
volumi regolabili e controlli review conservati. Riferimenti Figma presenti
e verificati nei nodi `3:2` e `3:3` del file `m09OI6AzKuOlFyTDLgxQ4o`.
[F] Typecheck, lint, 102 suite/758 test, validatori asset/config/secret/boundary,
export Web e PWA PASS. QA visiva locale in `design-qa.md`; perimetro, prove,
provenienza e screenshot in `docs/M6_APP_INTEGRATION.md`.
[U] Expo Doctor online19/20: serve patch57.0.23 (presente57.0.22), richiesta
approvazione locale. M6 integrata NON dichiarata chiusa finché questo gate
resta aperto. Nessun commit o deploy; la PWA online è invariata. App reale
locale su127.0.0.1:8104, audio fermo e vecchi server8102/8103 spenti.

Le sezioni successive conservano la cronologia precedente, non annullano
l'approvazione e l'integrazione registrate sopra.

## D-116 — M6 Product Design System, riferimenti e gate esterni

[F] Avviata milestone di design subordinata a M5, distinta dalla M6 di verifica
integrata D-115. Audit Product Design del candidato locale con otto screenshot
nuovi: `docs/M6_PRODUCT_DESIGN_RECONSTRUCTION.md`. Nessuna modifica funzionale.
[F] Autenticazione Figma successivamente sbloccata. Creato file
`m09OI6AzKuOlFyTDLgxQ4o`, ancora vuoto; editor nel browser integrato bloccato
da WebGL non disponibile. Sei riferimenti ImageToCode/Image Gen separati e
ispezionati, analisi e piano componenti in `docs/M6_VISUAL_REVIEW.md`.
[F] Successiva autorizzazione esplicita: collegamento 12ui completato e quattro
varianti Home generate, solo riferimento visivo caricato, tetto0,122 USD.
Registro del run: addebito0 USD, finanziamento sponsored; nessuna conversione.
Risultati ispezionati: tutti orizzontali, non conformi al requisito mobile;
B omette Relax. Nessuna variante approvata. Dettagli in `docs/M6_12UI_VARIANTS.md`.
Prima fase M6 NON completata; nessuna approvazione visuale inferita.
[F] Successivo rifiuto esplicito delle proposte precedenti: raccomandazione C
ritirata. Prodotte due nuove coppie Home/player tramite Image Gen integrato,
non tramite altri acquisti 12ui; ispezione e limiti in `docs/M6_MOBILE_V2.md`.
La successiva scelta esplicita «1-2» seleziona Home pittorica e player coordinato.
[F] Prototipo interattivo isolato in `output/m6-mobile-prototype`, aperto su
`http://127.0.0.1:8102/`: sei attività, Hatha, timer, Play/Pause/Stop simulati,
Rain/Ocean/Off, due volumi e mute. Nessun audio collegato, nessuna modifica
all'app di produzione. Runtime protetto28 file, TypeScript e build locale PASS.
Prove e confronto visivo in `output/m6-mobile-prototype/design-qa.md`.
[U] Approvazione del prototipo e integrazione Expo restano aperte. Server di audit spento,
nessuna PWA pubblicata, build, commit, push o costo.

## D-115 — revisione completa, consegna solo PWA

[F] Nuovo mandato diretto: sei milestone sequenziali, stabilità audio prima;
nessuna APK/EAS/export nativo, deploy, commit o costo. Worktree D-106–D-114
preservato; baseline e audit locale raccolti. Registro `docs/PWA_D115_REVISION.md`.

[F] M1 verificata localmente: corretti cambio prematuro della nuova corsia
naturale su errore AudioParam e accumulo timer dei vecchi ambienti. Regressione
audio finale27 suite/302 test PASS; ultimi casi40/40 PASS. Inclusi20 cambi via
controller/motore, Hatha90 accelerato, rollback/retry e pause/seek concorrenti.
Browser reale: cambi ambiente, pausa/ripresa/seek e Stop PASS, seed conservato;
non è approvazione sonora su telefono. Su successivo «aggiorna PWA», M1 marker29
pubblicata in Sites39 owner-only; entry online verificata byte-identica.
TypeScript, lint mirato, PWA, asset safety e secret scan PASS.
[F] M2–M5 implementate nel candidato locale D115: giunzioni memoizzate,
barra tecnica persistente, dettagli chiusi, Home mobile con sei artwork,
raccolte musicali provvisorie e anti-ripetizione anche dopo musica+natura/reload.
Suite integrata101/101,756 test PASS; tooling54 PASS/1 skip ambientale.
Export solo Web consumer/QA/PWA e relativo confine PASS. Screenshot reali
390×844 e844×390 in `dist/d115-audit/10-home-clean.png`,
`11-review-final.png`, `12-home-landscape.png`.
[U] M6 non chiusa: Expo Doctor online19/20 richiede Expo57.0.23 (installata
57.0.22); nessun aggiornamento installato nel mandato senza installazioni.
Figma richiesto esplicitamente: plugin abilitato ma autenticazione ripetutamente
non disponibile; nessun file letto o creato. Richiesta riconnessione all'utente.
Il candidato locale non sostituisce ancora Sites39. Ascolto e prestazioni
fisiche restano NON DETERMINATO — EVIDENZA INSUFFICIENTE.

## D-114 — workflow Git scalabile, solo locale

[F] Definito trunk-based development con `main` stabile, branch brevi e una PR
per risultato coerente. Convenzioni per naming, dimensione, sincronizzazione,
squash merge, worktree, conflitti e pulizia sono in `docs/GIT_WORKFLOW.md` e
nel punto d'ingresso `CONTRIBUTING.md`.

[F] Aggiunti template PR, Code Owners per i confini delivery/quality e workflow
read-only `PR policy`: valida branch e titolo Conventional Commits, quattro
sezioni descrittive, target400 righe/15 file e gate oltre1.200 righe o35 file
senza label maintainer `large-pr-approved`. Il churn dei due lockfile è escluso
dal conteggio righe, non dalla review del contenuto.

[F] Verifica locale del nuovo processo:6/6 test PR policy PASS,54 test tooling
complessivi PASS e1 skip ambientale; Prettier ratchet, ESLint0/0, TypeScript,
peer dependencies, configurazione progetto e validazione dei4 workflow PASS.
La CI completa ha inoltre esposto due test Web privi di ambiente browser
esplicito: corretti con `jsdom`, poi100 suite/748 test e coverage ratchet PASS.

[U] Workflow, label, Code Owner review, cancellazione branch e status check non
sono operativi sul remoto finché non esistono baseline e `main` protetto. Il
checkout attuale richiederà una bootstrap PR grande e revisionata; nessun
commit, push, worktree o modifica GitHub remota eseguita.

## D-113 — CI/CD di produzione e confine backend, solo locale

[F] Introdotti tre workflow GitHub Actions: CI su pull request/main con gate
aggregato, preparazione SemVer/changelog via PR manuale e release da tag
annotato con build EAS Android/iOS separate,
ricevute, manifest SHA-256, source archive deterministico, GitHub Release draft
e submission protette da quattro environment. Node22.23.1, pnpm11.16.0,
EAS CLI24.3.0 isolata, profili e immagini builder sono fissati. Nessuna build cloud,
submission, tag, push o pubblicazione eseguita.

[F] Quality ratchet fail-closed: ESLint0, Prettier1 documento storico;
coverage statements79,03%, branches74,29%, functions76,14%, lines81,35%.
Ogni nuova violazione/regressione fallisce e gli update baseline non possono
aumentare il debito. Test tooling49:48 PASS,1 skip ambientale; suite app con
coverage748/748 PASS. Archivio EAS_NO_VCS locale:174 file/108341863B, esclude
Git, catalogo, QA/PWA, documenti, test, script, credenziali e contiene solo i
due WAV consumer condivisi.

[F] EAS CLI separata dalle dipendenze app perché Expo Doctor rifiuta la CLI
locale nel progetto. Lock dedicato e override patch rimuovono7 advisory high;
restano in allowlist esatta1 low/2 moderate della sola toolchain, zero
high/critical. Qualsiasi advisory nuovo o percorso fuori `eas-cli` fallisce.

[F] Export locali finali PASS: iOS44 file/109653128B, Android48/110810043B,
entrambi con2 WAV consumer e zero catalogo localhost; PWA184/12458104B, zero
audio; confine Web consumer/QA PASS. Manifest smoke:92 file mobile e285 Web,
HEAD `53b506b`; la pipeline richiede sorgente pulita per i manifest reali.

[F] Documentati ordine dei gate, branch/environment protection, versioni,
tag, changelog, release e rollback in `docs/CI_CD_ARCHITECTURE.md`. Il confine
client/server e il percorso Fase0 offline → Fase1 object storage/CDN → Fase2
auth/entitlement managed sono in `docs/BACKEND_BOUNDARY.md`. Nessun backend è
stato introdotto.

[U] Ruleset, reviewer, environment, secret e status check obbligatori sul
GitHub remoto sono `NON DETERMINATO — EVIDENZA INSUFFICIENTE` finché la
configurazione locale non viene pubblicata e applicata. Build firmate, store,
rollback reale e prove su telefono restano gate separati.

[F] Verifica read-only remota: repository GitHub pubblico esistente ma senza
branch né default branch. Nessun push iniziale è stato inferito o eseguito.

## D-112 — APK Android 1.0.4 pronta per il test fisico

[F] Richiesta diretta «prepara un Apk Aggiornata»: una build consumer1.0.4/5
inviata dopo748 test PASS, Doctor20/20, archivio174 file/108364626B e kit47/47
verificati. Quota live Free Android3/15, costo stimato0 prima dell'invio.
Job `46e4258b-7b54-4738-b3d8-ea19d996c587`; nessun retry o commit canonico.
PWA38 e audio invariati. Dettagli: `docs/ANDROID_APK_D112.md`.
[F] Job FINISHED alle15:57:56 UTC. APK239954542B,53,13MB in meno (-18,13%)
rispetto alla1.0.3; audit pacchetto PASS, firma precedente conservata.
Installazione in aggiornamento su AVD API34 riuscita,47/47 importati conservati;
Astral Thread FLAC, Night Birds WAV, Hatha90+Rain e Hatha90+Ocean superano
avvio con segnale nativo presente, pausa/ripresa e Stop, senza Metro.
Costo finale0; Free Android4/15 usate,11 residue. APK e istruzioni nella
cartella esterna di test; hash/link e limiti in `docs/ANDROID_APK_D112.md`.
[U] Pronta per il test, non validata all'ascolto o su telefono fisico.
Consumer Android senza pannelli review, cambio Rain/Ocean dopo Stop;
review live resta nella PWA. Nessun altro job, commit o aggiornamento PWA.

## D-111 — aggiornamento della sola PWA privata

[F] Su richiesta diretta «Aggiorna solo Pwa» / «continua», pubblicata Sites38
sullo stesso indirizzo privato; deployment riuscito il 14 settembre alle
14:30:27 UTC. Candidato C2 riutilizzato senza modifiche:184 file/12457342B,
zero audio, marker `PLAYER-REVIEW.28-C2-LOCAL` conservato per identità dei byte.
C1/C2 e i controlli review D-106/D-107 sono ora online; C3 aggiunge solo prove.
Le diciture «online26» nelle sezioni precedenti restano cronologia, non stato corrente.

[F] Policy owner-only revision1, environment6 e catalogo remoto45 FLAC
invariati. Nessuna APK/EAS, upload audio, nuova risorsa, acquisto o modifica
accessi. HEAD canonico `53b506b` e index vuoto preservati; commit/push solo
nel checkout Sites isolato, come passaggio della pubblicazione autorizzata.
Hosting17/17 e validatore PWA PASS; ricevuta e verifica online in
`docs/PWA_PRIVATE_D111.md`.

[U] Pubblicazione non equivale ad ascolto/touch, background o latenza su telefono.
Quei gate restano NON DETERMINATO — EVIDENZA INSUFFICIENTE.

## D-110 / C3 — preparazione verificata, prove fisiche aperte

[F] Dopo accettazione C2, completata la parte locale C3 senza cambiare app/audio:
oracolo seed C3-20260914, Hatha30/45/60/90 con WAV/FLAC distinti, frame, join
e loop; inventario11 naturali brevi. Cinque casi nuovi PASS,748 test/100 suite
nel consolidamento, lint/typecheck PASS. Report `docs/C3_LOCAL_AND_DEVICE_REVIEW.md`.

[F] Browser locale .28: barra/linea allineate, drag69ms, loop71ms, stesso join
95→11ms; non tap→suono. Larghezze390/320, target almeno44×44, focus slider;
pinch200 non prova reflow. Vecchia cache localhost distinta dall'export corretto
su127.0.0.1, nessuna cache cancellata. Audio/server/tab di prova spenti.

[U] Nessun target mobile disponibile nell'inventario. AG05/06/07/08/09/18:
runbook/registro pronti; ascolto, assistive reali, latenza, background e long-run
su telefono restano NON DETERMINATO — EVIDENZA INSUFFICIENTE. Non bloccano
la consegna della preparazione. Nessun commit/build/pubblicazione; online26 e
APK1.0.3 invariati. C4 documentale resta a Work.

## D-109 / C2 — separazione bundle e audit sicurezza, solo locale

[F] AG10: tre route legacy trasferite nella sola radice QA e registry tecnica
iniettata dalle factory QA; consumer conserva solo i due WAV condivisi Moon
Drone/Deep River103680088B. Il terzo WAV51840044B resta intatto in repo/QA,
fuori dall'export consumer. Catalogo esterno47 file invariato, fuori APK/EAS.
AG17: corretto falso verde npm/ENOLOCK nel controllo dipendenze; schema/status
e provenienza degli advisory ora falliscono chiusi. Due residui image-size
espliciti invariati. Permessi storage generali bloccati, overlay bloccato solo
preview-android; servizio media/notifiche conservati, introspection PASS.

[F] 743/743 test99 suite (297 audio),10 test audit,10 decoder, lint/typecheck,
Doctor20/20, install check, asset/config/QA/PWA PASS. Export finali iOS109653129B,
Android110810048B:2WAV/hash canonici, zero route tecniche. PWA locale184 file,
12457342B,zero audio. Scan453 testi0 firme credenziali. Report con fallimenti
intermedi e correzioni: `docs/C2_BUNDLE_SECURITY_REVIEW.md`.

[F] Nessun commit, build, pubblicazione o modifica master. Online resta26,
APK1.0.3/4 resta quella precedente con3WAV e marker legacy. C1 preservata.
Node22.23.1 e pnpm11.16.0 già presente in cache usati per audit finale; launcher
pnpm11.19 individuato e non confuso con il runtime fissato.
[U] Device e ascolto non certificati. C3 locale avviata; C4 documentale a Work.

## D-108 / C1 — istruzioni e sessione corrente coerenti, solo locale

[F] Chiusi localmente AG01/AG02/AG03 del rapporto generale Strategy del
14 settembre. `PLAYER-REVIEW.27-C1-LOCAL` distingue avvio nuovo e Resume;
il timer corrente non cambia implicitamente. La policy del solo hostname
privato impedisce anche a Settings di preparare/reinstallare il service worker;
audio salvato e riapertura dell'app sono capacità distinte. Nessuna cache,
preferenza o sorgente audio cancellata. Architettura/catalogo/runbook correnti
aggiornati, cronologia conservata.

[F] 736/736 test, 97 suite (294 audio), lint/typecheck/Prettier e validatori
asset/ATP01/config/boundary/PWA PASS. Server: 18 test PASS più il caso47 URL
rieseguito con root esplicita, PASS. Export locale184 file/12.458.109 byte,
zero audio; scan firme credenziali603 file, zero riscontri. Due aspettative
di vecchio copy nel primo run completo corrette e intera regressione verde.
Browser Codex390×844: prima/dopo, Pause20→prepara45→Resume20→Return senza reset,
avvio esplicito45 e Stop verificati; errori console raccolti: zero.

[F] Nessuna pubblicazione, APK, commit o push. PWA online resta .26/Sites37,
APK resta1.0.3/4. Server e audio della prova locale spenti. D-106/D-107 e
modifiche preesistenti preservate; C2–C4 non avviate.
[U] Ascolto/touch iPhone e gate di pubblicazione rimangono separati; l'Obiettivo
globale non è dichiarato completato. Prove e limiti:
`docs/C1_LOCAL_COHERENCE_REVIEW.md`.

## D-107 — timeline e barra insieme, cursore sincronizzato

[F] PLAYER-REVIEW.26 pubblicata sullo stesso sito owner-only: Sites37,
deployment riuscito alle 09:57:07 UTC, environment6 e accessi invariati.
Barra subito sotto ogni diagramma musica/natura; linea, cursore e tempo
condividono la posizione durante drag/seek. In Play il trasporto visibile
legge il clock reale fino a 30fps; sospensione fuori schermo/tab nascosta,
Reduce Motion a 500ms. Dettagli e audit non vengono ricostruiti a ogni frame.

[F] Richieste concorrenti per lo stesso indice FLAC unificate e verificate,
con annullamento indipendente e cache limitate invariate. Non elimina la rete
necessaria alle sorgenti ancora fredde e non promette latenza zero.

[F] 730/730 test in 97 suite, inclusi 294 audio; lint/typecheck/Prettier,
asset/config/boundary e PWA PASS. Export 184 file, 12.455.723 byte, audio zero.
Hosting 17/17. Scan firme credenziali su 483 file testuali: zero riscontri.
Browser locale: drag reale 44:52.10 con linea/barra allineate, seek 252ms;
Pause/Play e avanzamento clock verificati. Online: 184 risorse corrispondenti
all'export; revisione26 visibile, Hatha90+Rain Playing, drag44:52.10 con linea
immediata e seek audio1054ms. Resta attesa sulle sorgenti fredde.

[F] D-106 preservata; nessun nuovo commit/staging/push canonico, audio,
APK/EAS, dipendenza, costo o modifica Strategy. Server locale spento.
[U] Fluidità, latenza e ascolto su iPhone restano gate umano, non provati
dallo screenshot desktop. Dettagli: `docs/PWA_PRIVATE_D107_TIMELINE.md`.

## D-106 — commit di sicurezza, touch review e cambio ambiente durante Play

[F] Prima delle correzioni richieste da Robert: commit locale selettivo
`53b506b8bc65284dff4c66eb0c53d60893f83c40`, checkout pulito subito dopo,
nessun push GitHub. Le correzioni successive restano non committate.

[F] PLAYER-REVIEW.25 pubblicata owner-only: Sites36, deployment riuscito
alle 04:11:31 UTC, environment6 e accessi invariati. Fade iniziale completo
dopo readiness; slider con posizione locale durante il trascinamento;
salti esatti a inizio/fine giunzione; ascolto entrante/uscente senza reload;
loop QA con orologio coerente e uscita senza salto. Rain/Ocean durante Play
cambia solo ambiente, con fade4s e annullamento; gli incroci già in corso
rinviano il cambio in modo esplicito, senza bloccare Stop.

[F] 720/720 test in96 suite, inclusi288 test audio; lint/typecheck/Prettier,
Doctor20/20, Expo install check, asset/audio/config/boundary e PWA PASS.
Un FAIL intermedio Off esplicito corretto e ricontrollato nel run completo.
Audit dipendenze: soltanto i due residui image-size già accettati.
Browser locale: Hatha90 Ocean→Rain→Ocean Playing, seed/timer/livelli
conservati, Jump113ms e drag181ms. Non sono latenze misurate su iPhone.

[F] Il controllo online della .24 ha rilevato un errore di allineamento
su rete lenta: corretto nella .25 con un unico istante futuro per seek,
avvio e fade. Deadline mancata: ambiente precedente intatto. I range audio
già letti vengono ora riusati nella cache limitata esistente (8MiB retained,
non RAM totale), evitando rete ripetuta finché non vengono espulsi.

[F] Prova online .25: Rain→Ocean→Rain durante Playing riuscita; volumi
80%/50% conservati. Jump esatto05:52.79:729ms iniziale,109ms ripetuto.
Drag reale05:52.79→39:51.20 riuscito ma2944ms per sorgenti ancora fredde:
questo limite di rete resta aperto, non viene dichiarata latenza quasi nulla.
Loop completo±30, isolamento entrante ed Exit senza seek verificati.
184 risorse pubblicate corrispondono all'export; accesso privato invariato.

[U] Nuovo ascolto/touch iPhone, qualità loop e background restano gate umano.
Nessuna nuova APK/EAS, audio caricato o costo introdotto. Catalogo remoto
45 FLAC invariato; due texture restano local-only. Dettagli:
`docs/PWA_PRIVATE_D106_TOUCH_REVIEW.md`.

## D-105 — errore aggiornamento e controlli review corretti nella PWA

[F] Dopo la prova negativa di Robert, pubblicata PLAYER-REVIEW.23 sullo
stesso sito owner-only: versione 34, deployment riuscito alle 01:46:16 UTC.
Il pulsante update non registra più il service worker che la review disattiva;
nessun audio salvato o impostazione viene cancellato. Pannello sviluppatore
aperto di default nei player privati, anche con Rain/Ocean. Play richiede la
categoria audio musicale iOS quando l'API opzionale è disponibile.

[F] 667/667 test in 91 suite, lint/typecheck/Prettier, asset safety e scan
firme segreti PASS; hosting 17/17. Online: 79 HTML e 105 asset corrispondono
all'export finale. Update → Home senza errore; Hatha90+Ocean Playing,
timeline aperta con 8 brani/13 giunzioni complessive e salto/ripresa verificati
nel browser Codex autorizzato. Catalogo remoto 45 FLAC invariato.

[U] L'iPhone riceveva già HTTP206 per gli audio; questo non provava suono.
Il silenzioso del telefono non è stato confermato: la correzione categoria
audio non equivale a un ascolto iPhone superato. Qualità, loop e nuova prova
sonora restano gate umano. Nessuna APK/EAS o commit/push canonico.
Dettagli e provenienza: `docs/PWA_PRIVATE_D105_FIX.md`.

## D-104 — PWA privata aggiornata per il test sul telefono

[F] Su nuova richiesta esplicita di Robert, pubblicata PLAYER-REVIEW.22
sullo stesso sito owner-only. Sites versione 33, deployment riuscito alle
01:13:38 UTC; 79 pagine e 105 asset remoti verificati contro l'export fresco.
Controlli di sviluppo per loop/giunzioni, Hatha 30/45/60/90, Rain/Ocean e
grafica consumer conservati. Export: 184 file, 12.430.679 byte, zero audio.

[F] 653/653 test app, 10/10 decoder e 17/17 hosting PASS. Catalogo remoto
invariato: 45 registrazioni; le due texture local-only non sono state caricate.
Nessuna nuova APK/EAS, modifica accessi o commit/push della repository app.
Il solo checkout isolato Sites è stato committato/pushato per pubblicare.
Preview locale spenta; aggiornamento telefono tramite `/update.html`.

[U] La richiesta automatica senza identità al catalogo audio è respinta
con HTTP 401: non è prova di audio mancante e non è stata aggirata. Ascolto,
latenza e loop sul telefono della nuova pubblicazione restano da verificare
con l'account autorizzato. Prove e limiti: `docs/PWA_PRIVATE_D104.md`.

## D-103 — autorizzata una nuova APK, esclusivamente a costo zero

[F] Robert autorizza una sola nuova build Android consumer con il fix Ocean
D-102. Candidato 1.0.3 / versionCode 4; motore e catalogo invariati rispetto
alla correzione verificata. Prima dell'invio: quota Free e assenza di costi
verificate live, controlli finali e archivio isolato. Nessun retry cloud,
PWA, commit, push, store o nuova credenziale autorizzati.

[F] Preflight 653/653 e Doctor 20/20 PASS; kit 47/47 ricontrollato, archivio
177 file / 160.186.901 byte. Free Android 2/15, 13 residue, costo stimato
zero verificato subito prima dell'invio. Unico job inviato alle 00:08:47 UTC:
`11e48eab-81b1-4134-8077-244e173512ab`. `docs/ANDROID_APK_D103_PREFLIGHT.md`.

[F] Build FINISHED alle 00:31:08 UTC. APK 1.0.3/4: 293.084.262 byte,
SHA-256 `56c64cdeb525c2d95d7b2d15426052e65afe1222ab99b529ad55160a5c4be3ea`.
Costo finale verificato zero; Android Free 3/15 usate, 12 residue.
Installazione in aggiornamento riuscita, Settings 1.0.3 e 47/47 importati.
Avvio Hatha90+Ocean, pausa/ripresa e volume/mute distinti osservati senza
Metro. Ocean ancora Playing a81:24 (516s), oltre la prima giunzione;
segnale presente anche con natura muta. Rain→Stop→Ocean→Stop riusciti,
Ready90:00 ripristinato. Prove nell'APK esatta, non nel development client.

[F] Audit pacchetto positivo salvo gate assoluto sul marker legacy
`./audio-test.tsx`: presente già nella 1.0.2, fuori dalla navigazione
consumer, conforme alla separazione ATP01 documentata. FAIL stretto e
addendum conservati, nessuna nuova regressione dimostrata. PWA/Workbench
review esclusi. AGENTS.md registra la scelta dinamica di strumenti/skill.

[F] Smoke aggiuntivo Astral Thread FLAC/Night Birds WAV: segnale corrente,
pausa e Stop PASS2/2; non è ascolto47/47. Emulatore/ADB spenti e porte
verificate libere, nessun Metro. APK e LEGGIMI nella cartella
`/Users/RF/Documents/App Relax Android Test 20260913/`. Nessun commit/push.

[U] L'APK 1.0.2/3 conserva il precedente FAIL. La qualità sonora e il
long-run su telefono restano prove umane, non conseguenze della build.

## D-102 — Ocean waves: correzione locale verificata sul client nativo

[F] Su richiesta esplicita di Robert, riprodotto l'errore con il development
client esistente: il decoder Hatha02 avanzava a4,936s ma aveva perso la
finestra di conferma iniziale100ms. Il file era leggibile, durata corretta.
Corretti avvio concorrente e recupero limitato della posizione, senza
aumentare tolleranza/timeout o modificare audio, piani e livelli.

[F] Sei nuove regressioni, Jest653/653 in89 suite; audio257/257 in22suite,
Doctor20/20, Expo install check e validatori asset/config PASS; security con
i soli due residui image-size già accettati.
Audit indipendente su copia: nessun nuovo blocker. Avvii Ocean nativi,
pausa/ripresa, mute ambiente e prima giunzione musicale superati. Dopo la
rimozione della diagnostica: Rain → Stop → Ocean → Stop riusciti, segnale
AudioFlinger corrente non nullo. Emulatore/Metro/ADB spenti. Archivio locale
PASS; export Metro Android/iOS e relativi controlli PASS, catalogo escluso.
Regressione finale ripetuta: 653/653; Prettier e secret scan PASS.
Prove: `docs/ANDROID_OCEAN_D102_FIX.md`.

[U] D-102 NON è nell'APK1.0.2/3 già compilata: quell'artefatto conserva il
precedente FAIL. Nessuna nuova build, PWA o commit. Nuova APK e ascolto reale
restano gate separati; non si dichiara l'artefatto già corretto.

## D-101 — APK 1.0.2/3 compilata, consegna bloccata su Ocean waves

[F] Robert autorizza nuovamente «APK». Ripreso soltanto il percorso Android
consumer interno, senza PWA, commit/push o store. La precedente APK 1.0.1/2
rimane non consegnabile: il gate Hatha deve essere ripetuto con la correzione.

[F] Preflight: 647/647 test, lint/typecheck/Prettier, Doctor20/20,
config/asset/security e due export Metro PASS. Archivio177 file,
160.158.967 byte, nessun catalogo consumer o segreto. Kit offline47/47
ricontrollato integralmente per hash. Dettagli: `docs/ANDROID_APK_D101_PREFLIGHT.md`.

[F] Development client Android con sorgenti correnti: Hatha30 Off e Hatha90
Rain avviati, pausa/ripresa osservate; Hatha90 resta Playing oltre8min.
Nessuna certificazione sonora dall'emulatore. Metro, emulatore e ADB spenti
durante l'attesa cloud; dati del catalogo conservati.

[F] Una sola build interna1.0.2/versionCode3 conclusa FINISHED il13settembre
21:50:55UTC: `71e00fbe-bc05-4a61-ab70-13a2dc7d75a3`. APK scaricata,
293.083.762 byte; SHA-256
`676ba51bb369588d52b335eac70de2e2c765c6f7217f737d1b4967a09d2a1780`.
Audit indipendente del pacchetto PASS e installazione in aggiornamento
riuscita. Quota Free live finale: Android2/15 utilizzate,13 residue;
overage e totale stimato0 centesimi. Nessun retry cloud.

[F] APK esatta, senza Metro: Settings1.0.2 e47/47 importati; Hatha90+Rain
avviata, pausa/ripresa e volumi/mute separati osservati, Stop→Ready90:00.
Playing81:38 e segnale nativo non nullo oltre l'istante della prima giunzione
(465,75s). Questa prova funzionale non certifica un crossfade inudibile.

[F] Gate FAIL: Ocean waves non si avvia. Riprodotto dopo Stop della sessione
Rain, con Retry loading e dopo riavvio pulito: Could not play a90:00.
L'APK1.0.2/3 è quindi un candidato conservato, NON una consegna completamente
funzionante. Nessun fix speculativo o seconda build dopo il fallimento.

[U] Causa nativa esatta NON DETERMINATO — EVIDENZA INSUFFICIENTE. La possibile
perdita della finestra di conferma seek durante preparazioni parallele è
un'ipotesi di codice, non la causa dimostrata del run. Prima occorre una
diagnosi riproducibile senza cloud; un'altra APK richiede nuova approvazione.
Qualità sonora, tutti47 decoder e long-run/telefono restano gate distinti.

[F] Emulatore, Metro e ADB spenti e assenza dei processi/porte verificata;
catalogo importato conservato. HEAD invariata, index vuoto, nessun commit,
push, nuova PWA o modifica ai byte audio. Le sezioni seguenti sono cronologia.

## D-100 — PWA ricontrollata dai sorgenti attuali, soltanto locale

[F] Export web locale `dist/pwa-d100` concluso con le patch correnti:
184 file / 12.431.440 byte, nessun byte audio incorporato. Precache:
161 URL, tutti HTTP 200. Worker FLAC 10/10 e configurazione PASS.
Controverifica degli import su copia isolata e controllo del bundle:
nessun collegamento allo storage privato Android rilevato nella PWA.

[F] Browser Codex: aggiornamento shell riuscito; Yoga immediato e Hatha
30/45/60/90 presenti. Hatha 90 + Rain: Play, Pausa, salto alla prima
transizione in 304 ms e Stop → Ready 90:00. Nessun errore console osservato.
Server locale e scheda di prova chiusi. Dettagli e hash:
`docs/PWA_CURRENT_SOURCE_D100.md`.

[U] Nessuna nuova APK/build EAS, pubblicazione, copia audio o commit.
Il candidato locale aggiornato non è la versione online. Android resta
sospeso; ascolto iPhone, qualità dei loop e long-run non sono certificati.

## D-099 — PWA locale: corretti catalogo FLAC e aggiornamento shell

[F] Il launcher locale dichiarava pronto il catalogo ma23 URL correnti davano 404. Ora collega i45 FLAC e le due texture locali in sola lettura, senza copie
né nuovi audio. La UI PWA conserva45 registrazioni; le due texture non vengono
promosse da local-only. Conservati21 URL WAV precedenti per compatibilità.

[F] Corretto anche un404 del manifesto SHA-256 che impediva il precache e
lasciava la vecchia shell attiva. Nuovo gate: nessun avvio con URL precache
non servibili. Test HTTP19/19, worker10/10, Jest644/89, typecheck e validator
PWA/config/boundary PASS. Browser: Astral seek96ms; Hatha90+Rain avviata,
salti272/355ms e Stop→Ready90:00. Non sono misure/ascolto iPhone.

[U] Online invariata .21; nessuna build/export nuovo, upload o commit.
Prova sul candidato locale .22 D-093 preesistente, non un export del checkout
aggiornato dopo D-096/D-097. Dettagli: `docs/PWA_LOCAL_PREVIEW_D099.md`.
Latenza quasi-zero, qualità dei loop e long-run restano da verificare.

## D-098 — ritorno alla PWA, Android sospeso su richiesta

[F] Robert chiede di continuare con la PWA. Nessuna seconda build Android:
controllo live EAS Free1/15 Android usate,14 residue fino al1 ottobre2026,
overage0 e costo stimato0 centesimi. Nessuna nuova pubblicazione PWA in
questo passaggio; resta online la versione precedente.

[F] Prima della sospensione, il fix delle curve ha superato un controllo
indipendente compilando la vera ParamControlQueue C++ della libreria copiata:
ottimizzato e ASan/UBSan PASS. Non è una prova dell'intero motore Android.
Riutilizzato il development client già esistente, senza build e conservando
i file importati; avvio della Home riuscito. Test Hatha con il fix non
completato prima del cambio di priorità. Ripristinata l'APK release precedente
nell'AVD, senza cancellare dati; emulator e Metro spenti. La prima APK resta
non consegnabile. Ulteriori rischi di seek/teardown segnalati dall'audit sono
da riprodurre, non risolti o certificati in questo passaggio.

## APK consumer con catalogo offline — D-097, consegna bloccata dal runtime

[F] La risposta di Robert chiude la scelta di delivery D-095/D-096: procedere
con APK e catalogo separato da importare una volta su Android. Tutte le
registrazioni ammesse, incluse Hatha e le due texture locali, sono nel perimetro;
quelle respinte restano escluse. Nessuna nuova pubblicazione PWA autorizzata.

[F] Storage privato, import verificato e factory/sessioni Android collegati.
Kit esterno pronto: 47 file, 2.434.210.564 byte, copie SHA-256 verificate.
Gate finali: 643 test in 89 suite, lint/typecheck, validatori, Expo Doctor
20/20 ed export Android/iOS PASS; audit con i soli residui image-size già
accettati. Archivio EAS controllato: 177 file, 160.156.690 byte, senza kit
pesante, Workbench/PWA o segreti. Rimane una route legacy ATP01, descritta
nel rapporto APK; non si dichiara assenza assoluta di codice tecnico.
Nessun commit creato.

[F] Dopo verifica live Free Android 0/15 e costo stimato zero, avviata una
sola build consumer Android 1.0.1 / versionCode 2, firma esistente congelata:
`dde27cac-c2b3-476a-b0af-92cc6b8e214e`.
[Build EAS](https://expo.dev/accounts/robert-fulton-studio/projects/app-relax/builds/dde27cac-c2b3-476a-b0af-92cc6b8e214e).

[F] Build FINISHED il 13 settembre alle 18:27:01 UTC. APK 293.082.242 byte,
SHA-256 `bdc6c20019ee9a04486d4ec25d2920384682a9f2fdf539ca826dcadadffc2ea3`.
Installazione in aggiornamento sull'AVD API34 x86_64: Success, firma accettata
e dati conservati. Versione release 1.0.1/2, non-debuggable. Quota dopo il job:
Free Android 1/15, costo stimato e overage zero. Nessuna seconda build.

[F] Import SAF completato il 13 settembre entro le 19:19:54 UTC: Settings
attesta 47/47, Home consumer reale aperta. Cancellazione e riavvio avevano
conservato 9 file verificati; il completamento non ha ricominciato da zero.
Il primo import sul vecchio emulatore è lento, nell'ordine di decine di
minuti. Night Birds WAV e Astral Thread FLAC riprodotti nativamente: segnale
non nullo su AudioFlinger stereo48kHz verso speaker, Play/Pausa/ripresa/Stop
verificati sul WAV. Questo non è ascolto umano né prova di tutti47 decoder.

[F] Gate FAIL: Hatha90, con Rain e senza ambiente, termina in errore di
preparazione sull'APK1.0.1/2. Non consegnabile come completamente funzionante.
Diagnosi locale: un mock reso fedele all'esclusione stretta delle curve RNAA
riproduce due fallimenti prima nascosti (overlap ~2,3e-13s). Correzione locale
dei confini assoluti delle curve, test su clock non interi e regressione
644/644 verdi. Questa correzione NON è nell'APK già compilata.

[U] Il legame causale fra errore Hatha osservato e overlap riprodotto resta
da confermare con una nuova APK; la UI release non espone l'errore tecnico.
Nuova build/test richiesti, nessun secondo job avviato. Artefatti e dettaglio
in `docs/ANDROID_CONSUMER_OFFLINE_KIT.md`. Emulatore, ADB e processi di prova
spenti; catalogo importato conservato nell'AVD, nessun commit/push/PWA.

[U] Loop percepito, sessioni native complete e telefono reale restano
NON DETERMINATO — EVIDENZA INSUFFICIENTE. La milestone non è completata.
Le sezioni D-096 e precedenti sotto sono cronologia, non lo stato corrente.

## Prerequisiti APK e sicurezza — D-096

[F] Lettura live EAS su `robert-fulton-studio`: piano Free, Android0/15,
costi stimati0 centesimi nel periodo1 settembre–1 ottobre2026. Nessuna build
o upload avviati. Il controllo va ripetuto prima della build effettiva.

[F] Corretti i residui tooling D-069: aggiornamento patch Expo57.0.22 e
moduli SDK57 raccomandati, RN0.86.3 invariato. Risolti i due advisory Joi
con17.13.6 e quello js-yaml con3.15.2/4.3.2. Il primo override di Joi
copriva solo17.11.0: rilevata e corretta anche la copia transitiva17.13.4.
Installazione locale pnpm11.16.0/Node22.23.1 con lockfile congelato e
script installazione disattivati; nessuna installazione globale/sistema.

[F] Audit policy PASS WITH ACCEPTED RESIDUALS solo per i due `image-size`
già registrati; Expo install check PASS e Doctor20/20. Verifiche di regressione
624 test/85 suite, lint/typecheck/peers, asset/audio/config/boundary e
Prettier/diff PASS. Export Android/iOS e archivio locale EAS validati:
catalogo pesante e superfici review esclusi, nessun segreto rilevato.
L'archivio attuale conserva i tre WAV tecnici ATP01; non è un APK consumer
finale né una misura del suo peso. Dettagli e hash in D-096.

[U] La scelta import offline/download del catalogo Android resta pendente;
non sono stati abilitati storage fittizi né modificata la PWA online. Gli
aggiornamenti delle dipendenze non completano il collegamento Android.

## Collegamento Android in corso — D-095

[F] Robert ha autorizzato il completamento del collegamento nativo e la
successiva build APK. Costo zero da verificare live prima dell'upload; niente
commit, push/store o pubblicazione PWA impliciti.

[F] Il driver nativo accetta ora anche una singola opera tramite un resolver
di file verificati, con rilascio della lease a Stop e rifiuto di identità/URI
non validi. Stop annulla caricamenti/avvii tardivi; volume zero è zero reale.
Lo scheduler applica il medesimo bilanciamento Web: musica 0,5 e natura
0–0,5, senza recuperare volume di nascosto quando la natura viene mutata.

[F] Verifiche: 624 test/85 suite PASS (30 test nelle due suite native),
typecheck, lint, Prettier dei sei file toccati, diff check e validatori
asset-safety/config/boundary/catalogo PASS. HEAD invariato, index vuoto;
91 modifiche tracciate e71 voci non tracciate nel worktree complessivo.

[F] Manifest FLAC della review corrente: 45 file, 2.371.806.490 byte
(2,209 GiB); Hatha 8 file/750.323.352 byte. Otto file superano100 MiB.
Questi sono numeri dei manifest, non nuovi byte copiati o una delivery nativa.

[I] Proposto APK leggero più catalogo separato da importare una volta sul
telefono e usare offline, senza nuovi servizi o account. È stata chiesta
conferma rispetto a un download direttamente dall'app: resta una scelta di
delivery, non un difetto risolvibile abilitando soltanto un flag.

[U] Factory/storage/UI Android non ancora collegati, sessioni Hatha native
ancora bloccate dalla policy di ascolto provvisorio. Nessun APK avviato;
quota EAS non consumata (lettura successiva in D-096). Test software non provano decoder,
loop, latenza o background sul telefono: NON DETERMINATO — EVIDENZA INSUFFICIENTE.

## Prossimo deliverable richiesto — APK consumer Android, D-094

[F] Robert dispone ora di un telefono Android e chiede, dopo la chiusura del
lavoro corrente, un APK di prova in versione consumer. Non è richiesta una
nuova task, una distribuzione store o un APK con controlli sviluppatore.

[F] Preflight read-only: profilo `preview-android` già configurato per APK
standalone (`developmentClient:false`). La factory nativa non inietta ancora
il resolver dei file; le sessioni adattive falliscono esplicitamente senza
pacchetti verificati. La singola traccia nativa richiede un asset incorporato
(oppure un generatore). Le correzioni FLAC Web non certificano il motore Android.

[I] Prima della build: completare integrazione catalogo/storage e parità audio
nativa, verificare loop/Play/Pausa/Stop/timer e musica+natura senza interfaccia
QA; controllare archivio, peso, segreti e quota/costo live. Nessun costo senza
consenso. Il catalogo pesante resta fuori dal pacchetto base automatico.

[U] Nessuna build avviata e nessun nuovo APK consegnabile. Questa richiesta
non vale come approvazione della pubblicazione PWA .22 ancora pendente.

## Primo avvio FLAC — D-093, candidato locale PLAYER-REVIEW.22

[F] Rimossa la seconda inizializzazione libFLAC prima della prima finestra,
senza cambiare i campioni. Verifiche: test RED→GREEN sul worker reale,
10 test worker PASS e browser con tre render EOF/finestre PCM-identici.
Regressione completa 618 test/85 suite, typecheck/lint, asset safety e
config/boundary PASS. Più dettagli in `docs/PWA_REVIEW_LATENCY_CACHE.md`.

[F] Candidato esportato/validato in `dist/pwa-d093`: 184 file/12.427.519 byte,
zero audio incorporato e zero pattern segreti/path privati rilevati. Primo
tentativo senza cache pulita respinto; export con `--clear` PASS senza ridurre
i gate. Altri39 test UI dopo il marker .22 PASS. Processi di prova spenti.

[U] La .21 online non è stata modificata. .22 è soltanto un candidato locale;
ascolto click, latenza iPhone e pubblicazione privata ancora da verificare o
autorizzare. Nessun nuovo audio, commit, upload o modifica di servizi.

## Decoder inattivi riusati + Night Birds locale — D-091/D-092

[F] Pausa/seek sulla stessa sorgente non ricrea più il decoder inattivo;
Stop e operazioni pendenti liberano le risorse. Browser reale su3 file:
3→1 aperture, PCM identico, render EOF/finestre errore0. Seek successivi
locali30–97 ms; prestazioni online/iPhone ancora da misurare.

[F] Night Birds integrata con hash file/PCM invariati: 33,680104 s,
9.699.972 B, solo natura non classificata/manuale. Play/Pausa/Stop e3 ritorni
EOF→zero osservati nel browser locale; nessuna approvazione percettiva dedotta.
Field Ambience/Hatha preservati, nessun nuovo byte audio in export consumer.

[F] Consuntivo: 618 test/85 suite, typecheck e lint PASS. Server diagnostico
e Metro terminati con exit 0; PID assenti e porte 8093/8252 senza listener.
HEAD invariato, index vuoto; 87 modifiche tracciate e 71 voci non tracciate
nel worktree complessivo, incluse le modifiche ereditate.

[U] PWA online invariata .21/45 file; queste due modifiche sono locali,
non committate né pubblicate. Nuovo audio, ascolto iPhone e near-zero globale
mantengono gate distinti. Prove in `docs/PWA_REVIEW_LATENCY_CACHE.md` e
`docs/NIGHT_BIRDS_B1_INTEGRATION.md`.

## Nuova texture naturale locale — D-090

[F] `Field Ambience` / `field-recording-01`: WAV consegnato da Editing copiato
senza modifiche nel catalogo locale ignorato; SHA file/PCM, formato e183 s
verificati. Natura non classificata, nessuna attività o famiglia Rain/Ocean,
nessun profilo sessione. Solo ascolto manuale nel QA, da Settings e sottomenu.

[F] 612 test, typecheck/lint e validatori audio/asset/config/boundary PASS.
Browser locale: Play/Pausa/Stop, seek e riavvio EOF→zero senza arresto osservato.
Screenshot e dettagli in `docs/FIELD_RECORDING_01_INTEGRATION.md`.

[U] Non pubblicata nella PWA. Classificazione e ascolto umano/iPhone aperti.
Nessun commit, upload audio o build nativa; la .21 online resta45 registrazioni.

## Misure nel player sviluppatore — D-089

[F] PLAYER-REVIEW.21 online, Sites 32/env6 owner-only. Tutti i 45 file restano accessibili in
`/loop-review`, separati da playlist e ambiente aggiunto. Il solo pannello
review espone misure HTTP/cache/apertura/PCM/decoder, senza telemetria né
nuovi worker/cache. La grafica consumer e i campioni non cambiano.

[F] 609 test, 229 audio, lint/typecheck/Prettier e validatori PASS. Online:
seek singolo 115 ms, EOF superato in Playing; Hatha90+Rain 215 ms e 3368 ms.
Il secondo ha 0 richieste HTTP audio e 4 hit: il tempo è nella fase
worker/decode (somme concorrenti 4894 ms), non nei byte audio dalla rete.

[U] Il clic al ritorno EOF→zero e la latenza iPhone non sono approvati:
un contatore che avanza non certifica l'ascolto. Prove in
`docs/PWA_REVIEW_LATENCY_CACHE.md`. Nessun commit del repository app.

## Correzioni sui seek preparati — D-088

[F] PLAYER-REVIEW.20 online nella stessa PWA privata owner-only (Sites 31/env6).
Corretto il range freddo quando il PCM precedente copre soltanto parte del
target; una pioggia già offline non impedisce più di preparare la musica online.
Budget invariati, nessun audio nuovo o commit del repository app.

[F] 606 test, audio 226, test integrato cache→reader→clock compreso EOF,
lint/typecheck/Prettier e validatori PWA/config/boundary/safety PASS. Browser:
salto con pioggia offline 280 ms, doppia sorgente online 1006 ms, loop singolo
154 ms. Dati e controprove in `docs/PWA_REVIEW_LATENCY_CACHE.md`.

[U] Il secondo salto resta circa un secondo: quasi-zero globale NON raggiunto.
Primo Play freddo, ascolto click su iPhone e gate release separati restano aperti.

## Punti di test preparati — D-087

[F] PLAYER-REVIEW.19 pubblicata nella stessa PWA owner-only (Sites 30/env6).
Restano accessibili tutti i 45 file separati e i test ultimi 5/15 s; in pausa
la review prepara un prossimo punto con massimo 8 MiB di byte compressi,
senza audio nuovo, PCM extra o download integrale. Foreground prioritario.

[F] Jest 601/82 suite, audio 221/20 suite, lint/typecheck/Prettier, validatori
PWA/config/boundary/safety/catalogo PASS. Worker 17, decoder 8, HTTP 14 PASS.
Browser online: loop singolo preparato 159 ms, EOF superato senza arresto.

[U] Controprova importante: Hatha 90 + Rain richiede ancora 3615 ms sul primo
target non preparato e 2011 ms sul successivo dichiarato preparato. Quasi-zero
per tutte le giunzioni NON raggiunto; causa specifica non ancora isolata.
Ascolto iPhone dei click e long-run restano gate umani, non provati dal clock.
Prove, file e confini in `docs/PWA_REVIEW_LATENCY_CACHE.md`. Nessun commit app.

## Loop individuali e controllo dell'ascolto — D-085/D-086

[F] PLAYER-REVIEW.18 pubblicata nella PWA privata: inventario dei 45 file, accesso dai
pannelli review/Settings, ascolto isolato e salti ultimi 5/15 s. Corretto il
seek PCM che non riprendeva Playing; Stop interrompe anche un seek bloccato.
Master e catalogo invariati. Test del loop distinto dalle transizioni Hatha.

[F] Preso in carico l'audit UI Work del 13 settembre: continuità Return/Resume,
timer con sessione precedente controllabile, guardie Starting e copy di contesto.
Matrice e limiti in `docs/PWA_INDIVIDUAL_LOOP_AND_UI_REVIEW.md`.
[F] Lint/typecheck, 587 test, audio208, safety/config/boundary e PWA PASS.
Browser: loop Hatha due volte e naturale una volta, Return senza reset,
timer45 con controlli precedente20 visibili, tastiera Space/Enter/frecce.
Sites29/env6 owner-only verificato, .18 e 45 tracce visibili online. Server
locale e tab temporanea spenti; nessun emulatore/Metro, nessun commit canonico.
[U] Nessuna approvazione sonora dedotta: ascolto di ogni loop su iPhone e
latenza fredda restano aperti, insieme ai gate release separati D-069.

## Reattività Play e salti QA — D-084

[F] PLAYER-REVIEW.17 elimina la doppia ricostruzione sui salti e sui loop
QA. Il PCM viene preparato direttamente al punto richiesto; le sorgenti future
non bloccano Ready. Cache per sorgente e indici autenticati riusati, con
quattro finestre per deck e quattro deck invariati. La pausa conserva le
finestre già schedulate più vicine alla posizione corrente senza copiarle.

[F] Primo buffer FLAC di 8 s in una richiesta invece di 2+8 s seriali;
riserva startup 8 s e refill 32 s conservati. Attacco PWA anti-click 80 ms,
senza cambiare raccordi musicali, fade finale, campioni o derivati lossless.
Il player QA mostra il tempo effettivo del seek in millisecondi.

[F] Prima prova browser locale: salto freddo 301 ms, ritorno 243 ms,
stesso punto già pronto 43 ms; clock audio fino a ulteriori 60 ms. Non sono
misure iPhone né una promessa di zero latenza su rete fredda.

[F] .17 pubblicata sullo stesso Site owner-only (Sites28/env6). Il seek
FLAC freddo legge gli 8 s dal campione richiesto, senza griglia precedente.
Prova online finale: 1366/2897 ms su punti nuovi, 1587 ms sul ritorno non più
in cache, 46 ms ripetendo il target pronto. 562 test e 205 audio PASS.

[U] L'obiettivo quasi-zero NON è chiuso per i target freddi. Prossimo lavoro:
prefetch esplicito e limitato dei marker QA vicini, da progettare senza
sottrarre banda al refill né gonfiare la RAM; nessun download completo del
catalogo. Evidenze in `docs/PWA_REVIEW_COMPLETION_AUDIT.md`. Restano aperti
ascolto iPhone, long-run e residui dipendenze D-069. Nessun commit canonico o
nuovo audio.

## Hatha 90 minuti e accesso al player di revisione — D-083

[F] La foto iPhone di Robert conferma Rain/Ocean utilizzabili, ma mostra
soltanto 30/45/60 e nessun accesso diretto alla playlist. La revisione locale
PLAYER-REVIEW.15 aggiunge 90 nella pratica Hatha della sola PWA e un link
`Playlist & development player` che apre la revisione senza avviare audio.
La barra della sessione corrente esplicita la durata effettiva e apre il suo
player, senza confonderla con una nuova durata selezionata nella preparazione.

[I] Per costruire 90 minuti con gli otto file già disponibili (77:49.25 lordi),
due passaggi centrali, uno Flow e uno Deepening, eseguono due iterazioni
integrali. Otto opere uniche in ordine, sette raccordi 60–300 s, fine esatta
a 5.400 s. Eccezione di review dichiarata, non nuova musica o approvazione
editoriale. Le durate 30/45/60 e il planner production non cambiano.

[F] .15 pubblicata nello stesso Site owner-only (Sites26/env6). Lint,
typecheck, 556 test e audio199 PASS; validatori PWA/config/safety/catalogo e
HTTP14/Worker17 PASS. Browser locale: entrambi i loop musicali superati dopo
seek, pausa/ripresa e finale Completed/00:00; non ascolto continuo 90 minuti.
Prove online e perimetro in `docs/PWA_REVIEW_COMPLETION_AUDIT.md`.

[U] Ascolto iPhone delle due cuciture, long-run e residui dipendenze D-069
restano da verificare. Nessun commit canonico o nuovo audio.

## Musiche FLAC nella PWA — D-082, .14 pubblicata

[F] Sostituzione privata dei 21 WAV musicali autorizzata da Robert. Derivati
verificati: 3.653.766.432 → 2.023.381.325 byte, −44,6220%, identità PCM già
provata. Nessun master modificato o nuovo audio creativo. Mapping PWA .14,
45 indici autenticati; i 21 nuovi indici vengono richiesti su necessità.

[F] Lint/typecheck e 548 test PASS (audio dedicati 197); Worker privato 17/17, HTTP 14/14 più
21 HEAD / 42 Range dei derivati, safety/config/boundary PASS. Trasferimento
privato completato: 21/21, catalogo 45/45 pronto, zero temporanei. Vecchi WAV
preservati per compatibilità; il catalogo attivo .14 è tutto FLAC / 2.371.806.490 B.
Dettagli e limiti in `docs/PWA_MUSIC_FLAC_DELIVERY.md`.

[F] .13 online ha avuto un underrun a 01:05: non considerata pronta. .14
estende il solo refill a 32 s, startup invariato; test di stallo 20 s PASS.
Sites 25 / env 6 owner-only, import chiuso anche in codice, vecchia chiave
rifiutata online HTTP 401. Browser .14: musica+Rain oltre 02:32, mute 50→0→50
con main 80%, seek e superamento del loop 16:16 fino a 16:38 in Playing.

[F] Online .14 Hatha60 + Ocean waves: giunzione musicale completa
08:01.91–09:42.50 superata, Playing a 10:07. Poi Stop verificato, player
Ready/60:00 lasciato nella scheda utente; server e schede extra chiusi.

[U] Gate iPhone, long-run e residui dipendenze restano aperti; nessuna
approvazione sonora o latenza/RAM low-end dedotta da queste prove.

## Raccordi lunghi e natura variabile — D-081, .12 pubblicata

[F] La prova prolungata online di .11 ha rilevato un errore AudioParam a
07:44 nella pratica Hatha60. Le precedenti prove brevi PASS non certificano
quindi il ciclo completo. Correzione .12 locale: differenze temporali calcolate
prima di aggiungere il clock; intervalli di volume contigui senza sovrapposizioni.

[F] Corretto anche il limite di due sole nature: Hatha60 predispone ora sei
registrazioni distinte della famiglia scelta, distribuite lungo la sessione,
con cinque raccordi lenti separati dalle giunzioni musicali. Nessun nuovo audio.
I decoder restano quattro riutilizzati. Prove e limiti:
`docs/PWA_REVIEW_COMPLETION_AUDIT.md`.

[F] .12 pubblicata nello stesso Site owner-only, versione 21 / env 4.
Jest 75 suite / 543 test, lint/typecheck/Prettier, 8 worker, 14 HTTP e
validatori PWA/config/safety PASS. Browser locale: intero primo raccordo
oltre 07:45.75, con pausa/ripresa a 07:07; seek a 31:20 e superamento del
raccordo naturale fino a 31:38. Non è una prova di ascolto su iPhone.

[F] Online .12: Hatha60 + Ocean waves (sette musiche intere, sei nature)
attraversa l'intero raccordo 08:01.91–09:42.50 e prosegue a 10:09;
seek al terzo cambio naturale, Playing a 31:49 oltre la fine 31:30.
Mute ambiente 50→0→50 con main 80%. Stop verificato, schede di prova chiuse,
server locale arrestato e porte libere. Dettaglio e seed nell'audit.

[U] Ascolto iPhone, upload dei 21 FLAC musicali e residui di manutenzione
dipendenze rimangono distinti e aperti. La PWA è pronta per questo test umano,
non è una release audio/native certificata.

## FLAC nel player PWA — D-080, revisione .11 pubblicata

[F] Il driver PWA usa ora lo stesso scheduler PCM per musica WAV e natura
FLAC: massimo quattro sorgenti riutilizzate, niente loop HTML per i 24 FLAC
approvati. Decoder worker minificato 76.166 byte; 24 indici autenticati per
520.015 byte. Nessun audio aggiunto o sostituito. PLAYER-REVIEW.10 pubblicata
privatamente, ma la prova online ha rilevato underrun dopo due secondi:
NON pronta per la consegna. PLAYER-REVIEW.11 pubblicata sullo stesso Site
privato: almeno otto secondi già decodificati prima di Ready, senza full
download. Verifica online .11: musica+Rain oltre il primo loop, mute ambiente
indipendente, pausa/ripresa; Stop → Ocean waves, seek a 08:00, superato avvio
raccordo 08:30 fino a 09:01 in Playing senza errori visibili. Audio fermato.

[F] Test: 74 suite / 526 test, 14 HTTP, 8 worker; lint, typecheck e Prettier
PASS. Browser decoder minificato: 1.728.000 campioni identici su tre file.
Export PWA .11: 162 file / 8.501.477 byte, zero audio, indici/worker e pacchetto
licenze/sorgente verificati. Dettaglio e residui in
`docs/PWA_FLAC_PLAYER_INTEGRATION.md`.

[U] Doctor 19/20 e install-check segnalano le dieci patch Expo già note;
security audit resta FAIL sui tre advisory joi/js-yaml D-069. Nessun gate
allentato, nessun aggiornamento generalizzato. Ascolto iPhone, background e
RAM su telefoni meno potenti restano NON DETERMINATO — EVIDENZA INSUFFICIENTE.
I 21 nuovi FLAC musicali restano esterni, non caricati sul servizio.

## Clock e lettore FLAC — integrazione locale D-079

[F] Aggiunto lettore indicizzato a finestre dietro lo scheduler PCM, ancora
iniettato soltanto nel laboratorio. Browser: tre file / 1.728.000 campioni
confrontati ai loop e alle giunzioni, errore massimo zero. Corretti seek superati,
precaricamento vicino ai confini, anchor di avvio/ripresa e preroll durante
preparazione. Prove e limiti in `docs/FLAC_CLOCK_INTEGRATION.md`.

[F] Run finale lint/typecheck, 73 suite / 516 test, otto regressioni render WAV
PASS. Export locale finale 122 file / 7.764.933 byte senza audio, validatore
PWA e 13 test HTTP PASS; nessuna pubblicazione. Pausa durante preparazione
annulla anche un avvio ancora pendente. Server diagnostici e schede chiusi.

[U] NON pubblicato: PLAYER-REVIEW.9 rimane online. Restano adapter/packaging
FLAC, metadata autenticati, vincolo revisione HTTP, anchor delle tracce successive
e gate iPhone. Nessun nuovo audio, dipendenza nel progetto, commit o build cloud.
Goal ancora aperto: questa prova locale non chiude la stabilità audio della PWA.

## Decoder lossless — prova locale D-078

[F] 45 FLAC / 2.371.806.490 byte verificati in laboratorio temporaneo:
identità PCM completa con MD5 sorgente, 225 finestre deterministiche,
4.500 reset alternati. Per 21 musiche, 105 finestre identiche anche al WAV.
Browser worker ESM su tre file: 15/15 finestre, solo Range finiti; report
rafforzato con controllo di righe/hash/richieste e test negativi.

[F] Nessun audio modificato/copiato/pubblicato, nessuna dipendenza aggiunta
all'app. PLAYER-REVIEW.9 invariata. Nuovi strumenti di verifica e protocollo
in `docs/FLAC_WINDOW_DECODER_SPIKE.md`, con misure e limiti espliciti.
[U] Non è ancora il lettore dell'app: packaging/licenze, integrazione del
clock, cache/abort, bundle finale e loop iPhone restano da verificare.

## Correzione del playback musica+natura — D-077

[F] PLAYER-REVIEW.9 pubblicata privatamente: l'aggiunta di un FLAC naturale non disattiva
più il caricamento a finestre della musica WAV. Pool dedicati, massimo quattro
decoder riutilizzati; preload della musica successiva indipendente da quello
naturale. Corretto anche il riuso di una conferma Play dopo cambio posizione:
ora viene rifiutata con cleanup, non produce un falso stato Playing silenzioso.

[F] 72 suite / 502 test, lint/typecheck/Prettier, PWA/asset/config/boundary,
13 HTTP e 12 Worker PASS. Revisione indipendente senza ulteriori P0/P1.
Browser locale: musica+Rain, Hatha60+onde, pause/seek/Play e mute/volume
indipendente. Traccia reale: 45 richieste WAV tutte Range finito/206, max
2.304.000 byte (8 s), anche quando sono presenti FLAC. Server locale spento.
Sites 18 / env 4 owner-only, shell 122 file / 7.761.029 byte senza audio;
86 file testuali scansionati senza pattern di segreti/path RF. HEAD canonico
`6549f01` invariato e index vuoto. Prove e identificativi completi in D-077.
[F] Anche online: Home → Meditation → Rain → Play; PLAYER-REVIEW.9 e
punti di loop/giunzione verificati, screenshot setup ispezionato. Audio fermato.

[U] Non costituisce approvazione sonora: loop FLAC naturali, iPhone/low-end
e adozione dei nuovi FLAC musicali restano aperti. Nessun nuovo audio,
dipendenza, commit app, build nativa o costo; residui D-069 invariati.

## Ambiente naturale nel normale avvio — D-076

[F] Correzione di PLAYER-REVIEW.8: Home → qualsiasi delle sei attività ora
mostra Off / Rain / Ocean waves PRIMA di Play. D-075 lo esponeva nei player
e in Hatha completo, ma non nel normale setup: il percorso era incompleto.
Default Off, stessa musica quando cambiano ambiente/durata, nessun titolo
musicale esposto. Il player conserva volume/mute ambiente indipendenti.

[F] Solo la radice PWA inietta il programma musica+natura. Nessun adapter
nativo fittizio. Errori di preparazione/factory bloccano Play senza fallback;
le preparazioni precedenti sono cancellate. Durante Starting sono bloccati
sia ambiente sia durata. Nessun nuovo audio o modifica del motore.

[F] PLAYER-REVIEW.8 pubblicata owner-only (Sites 17 / env 4). Tutte le sei
attività verificate dalla Home nel browser locale; online Meditation → Rain
→ Play e mute ambiente 50→0% con main invariato a 80%. Screenshot online
del setup pronto ispezionato. 71 suite / 496 test, lint/typecheck/Prettier,
13 HTTP, 12 Worker, validatori asset/config/PWA/boundary PASS. Shell 122 file,
7.759.665 byte, zero audio; nessun nuovo upload audio. HEAD canonico `6549f01`
invariato, nessun file staged.

[F] La prima riapertura della scheda online tratteneva PLAYER-REVIEW.7.
La nuova apertura `/?review=8` ha caricato PLAYER-REVIEW.8, identificata
nella Development review; nessuna cancellazione di dati utente.
[F] Successiva apertura della Home senza query conferma ancora il setup
aggiornato. Playback di prova fermato; anteprima locale chiusa, processo
dedicato terminato e porta 8218 verificata libera. Nessun emulatore/Metro avviato.
[U] Nessuna nuova approvazione sonora iPhone dedotta dai test locali.

## Ripristino review completa e ambiente opzionale — D-075

[F] PLAYER-REVIEW.7 locale: nel player musicale PWA e in Hatha completo è
disponibile Off / Rain / Ocean waves, spento per default, con volume e mute
ambiente indipendenti dal volume principale. Si sceglie prima di Play o dopo
Stop, mai con cambio nascosto durante una sessione. La musica singola continua
a essere UNA registrazione in loop; Hatha resta una sequenza di opere intere.

[F] Development review contiene inventario reale delle sorgenti, entry/exit,
ogni punto di loop calcolato dai frame, tutti gli inizi/fini di giunzione,
seek, salto fra punti, audition outgoing/incoming/both e finestre ±30/60 s.
Nessun loop musicale inventato nel ciclo Hatha, che usa file interi una volta.
Titoli e file tecnici restano soltanto nella review, non nella UI consumer.

[F] Browser locale: musica+Rain in Play, mute ambiente 50→0% senza cambiare
main 80%; salto loop a 02:35 e avanzamento oltre 02:50. Hatha 60 con otto
musiche + due onde raggiunge Play; pausa e salto al secondo cambio 12:22.75
preservano Paused. Questa prova funzionale NON è approvazione sonora iPhone.

[F] Confronto OfflineAudioContext trova una discontinuità del caricatore WAV
sulla griglia 44,1 kHz. La PWA ora richiede il clock 48 kHz dei file e converte
solo l'uscita continua verso il dispositivo. Un contesto incompatibile fallisce
esplicitamente. Nessun PCM/master modificato. Rapporto e limiti in D-075.

[F] PLAYER-REVIEW.7 pubblicata owner-only, Sites 16 / env 4; 71 suite / 485
test PASS, lint/typecheck, 13 HTTP, 12 Worker, asset/config/PWA/boundary PASS.
Audit audio accelerato corretto: 8/8 PASS, errore massimo 1,82e−12.
Shell 122 file / 7.744.564 byte, zero audio; catalogo remoto invariato.
Browser remoto: musica+Rain Ready/Play e review nuova presenti. Server locali
8217/8250 spenti, HEAD canonico `6549f01` invariato e index vuoto.

[U] I FLAC musicali
locali NON sono ancora integrati/uploadati; qualità loop iPhone e FLAC naturali
restano da ascoltare. Non dichiarare tutti i problemi audio risolti.

## Ascolto immediato, titoli fuori dal percorso consumer — D-074

[F] Correzione di prodotto richiesta da Robert: attività → Play; timer
facoltativo. Il sistema sceglie una sola opera musicale autonoma adatta e la
mantiene in loop. Scelta una volta per visita, invariata durante cambio durata,
pausa o retry; evita la registrazione attiva precedente se esistono alternative.
Nessun titolo di brano nella pagina attività, player o barra della sessione.
La scelta manuale resta in Settings → Listening preferences → Choose a
recording manually. Tab Sounds rimossa, artwork impressionisti invariati.

[F] Hatha completo resta distinto: Yoga → Complete Hatha practice, oppure tab
Yoga. Solo 30/45/60 minuti, sequenza di file interi D-073 e non un loop singolo
mascherato. I controlli di sviluppo sono presenti nel player PWA ma chiusi.
Questa direzione supera D-073 per il comportamento quotidiano; non elimina
sequencer, audio o strumenti QA. Nessuna modifica a motore/master/delivery.

[F] QUIET-REVIEW.6 pubblicata privatamente, Sites 15 / env 4. 70 suite /
472 test, lint/typecheck/Prettier PASS; validatore PWA, asset safety/config,
confine QA/PWA, 13 test HTTP e 12 Worker PASS. Shell: 122 file / 7.659.099
byte, zero audio. Simulazione archivio: 157 file / 160.013.098 byte, soli
tre WAV ATP01, nessun segreto/catalogo consumer. Nessuna build o upload audio.

[F] Tre verifiche: test di selezione/regressione; export e perimetro;
browser reale locale e privato. Verificati Play/Pausa/Stop, barra senza titolo,
sottomenu manuale, Hatha completo e review chiusa. Il test browser ha trovato
e corretto il cursore accessibilità che prima muoveva soltanto la preview:
ora salto effettivo a 15:00 durante Play e 10:00 in pausa. Audio fermato,
server locali 8201/8216 spenti. HEAD canonico invariato `6549f01`, index vuoto.

[U] Loop udibile iPhone, latenza low-end e nuovi FLAC restano gate separati;
NON DETERMINATO — EVIDENZA INSUFFICIENTE. Nessun commit canonico autorizzato.
Residui Doctor/security D-069 non risolti né riclassificati come verdi.

## Correzione session-first e loop fallito su iPhone — D-073

[F] Le due foto di Robert confermano MUSIC-REVIEW.4 sul telefono: il problema
non viene attribuito a una vecchia versione. Loop respinto: glitch forte e
interruzione udibili. D-072 non è accettata. «Listen to your music» rimosso;
Home funzione-first, titoli e singoli file dentro disclosure di review.

[F] SESSION-REVIEW.5 locale: preparazione limitata alla route in primo piano,
senza Ready riutilizzato dopo un cambio pagina. Caricatore WAV PCM24/48k stereo
PWA a finestre (2 s iniziali, poi 8 s), Range rigoroso e nodi programmati sul
clock audio; non decodifica l'intero WAV in RAM. Non è un decoder FLAC streaming.
Nessun master modificato; FLAC naturali e copie offline blob mantengono il
percorso precedente. Non dichiarare il glitch iPhone risolto da questi test.

[F] Yoga Music nella sola review crea una sequenza di file Hatha interi, in
ordine strutturale, con tutte le quattro fasi: 30/45/60 minuti esatti, cambi
60–300 s, nessuna ripetizione interna né taglio nel mezzo. È una bozza tecnica
di ascolto, NON un'approvazione armonica o editoriale. 20/90 minuti falliscono
esplicitamente senza simulare una playlist con un loop singolo. Gli altri
abbinamenti musicali consumer restano non approvati. Planner release invariato.

[F] 21 derivati FLAC locali: 3.653.766.432 → 2.023.381.325 byte, −44,62%; PCM
decodificato identico al sorgente. Rapporto per file e hash in
`docs/SESSION_REVIEW_5_LOSSLESS_REPORT.json`. NON integrati o pubblicati:
compatibilità/streaming iPhone da provare prima di cambiare la delivery.
Il catalogo completo previsto sarebbe ancora 2.371.806.490 byte.

[F] Controlli locali: 68 suite / 463 test, lint e typecheck PASS; 13 test HTTP,
asset safety, config e confine QA/PWA PASS. Browser: sequenza Yoga a quattro
brani, salto al primo cambio da 178,25 s; Hatha 01 dal secondo 450,75 al
successivo secondo 10 senza errore runtime. Countdown e assenza errori NON
certificano continuità udibile. Ascolto iPhone/low-end/background ancora aperto.

[F] SESSION-REVIEW.5 pubblicata privatamente (Sites 13 / env 4), verificati
Home, Yoga 30, quattro opere, Start, seek e Stop nel browser autenticato.
Rapporto della consegna parziale in D-073: il test iPhone deve essere ripetuto.
Nessun commit
canonico, EAS o nuova importazione audio autorizzata da questa correzione.
Residui Doctor/security D-069 non risolti né riclassificati come verdi.

## Musiche al centro e accesso diretto — D-072

[F] Nuovo riscontro negativo di Robert: la PWA gli appare invariata e sente
soltanto onde. La consegna D-071 NON è accettata; non si presume un errore
dell'utente o si trasforma il countdown browser in prova d'ascolto.

[F] MUSIC-REVIEW.4: Music è ora proposta iniziale per tutte le categorie con
opere musicali disponibili. Onde/pioggia restano scelte esplicite; la vecchia
preferenza iniziale naturale è superata dal nuovo feedback. Home contiene
«Listen to your music» e identità di revisione. `/music` è un accesso diretto
alle 21 opere musicali (8 Hatha + 13 precedenti), con la stessa UI e lo stesso
player: nessuna traccia naturale/generatore nella lista. Non richiede il
percorso di aggiornamento offline D-071. Pannello review con nome WAV esatto.
«Play your last session» conserva la cronologia ma esplicita Rain/Ocean waves.
Anche le proposte di brani nelle categorie danno priorità alla musica, senza
alterare il mapping editoriale o nascondere gli altri suoni disponibili.

[F] Riprodotto ritorno alla Home vecchia dopo ingresso nella pagina nuova:
la preview su questo hostname privato passa a shell online-first, ritirando
la sola registrazione worker root, senza cancellare dati o riavviare altri
client. Localhost/altri host invariati. Il primo accesso diretto `/music`
deve quindi precedere la verifica di riapertura della vecchia Home salvata.

[F] Pubblicata privatamente MUSIC-REVIEW.4, Sites 12 / env 4. Browser
integrato autenticato: riapertura documentale Home nuova, link musica,
21 opere su `/music`; Meditation pre-seleziona Music e propone Celestial
Current/Distant Garden. Air Between Hands: file corretto, Play, seek +30 s
completato, Stop; pannello sviluppo presente, nessun errore console osservato.
Non è una prova di udibilità iPhone. 65 suite / 445 test, lint/typecheck,
13 test HTTP, 12 Worker, PWA/asset/config/boundary PASS. Nessun nuovo audio.
Server locale 8198 e audio di prova spenti; browser lasciato su `/music`.
Checkout canonico non staged e non committato. Residui tooling D-069 invariati.

[U] Versione realmente visualizzata e udibilità sul telefono da identificare
con il riscontro/screenshot chiesto a Robert. Nessun abbinamento Hatha nuovo,
nessuna modifica audio, approvazione musicale, commit canonico o build nativa.

## Accesso alle musiche e aggiornamento della copia installata — D-071

[F] Robert non trova/sente le musiche nuove e contesta l'indicazione «sessioni
natura», che non identifica un comando dell'app. Riprodotti due problemi UI:
Yoga proponeva Ocean waves come Start e nascondeva sei Hatha; il browser con
vecchio service worker continuava a mostrare il vecchio catalogo dopo export.
Ora Music / Ocean waves / Rain sono scelte esplicite, Yoga propone Hatha 01,
gli otto Hatha sono visibili senza disclosure e Music è prima in Sounds.

[F] `/update.html` offre un aggiornamento volontario e porta a Yoga. Non
cancella audio/impostazioni e rifiuta l'attivazione se esistono altre finestre
dell'app. Non forza reload o takeover durante l'ascolto. HATHA-REVIEW.3
pubblicata privatamente (Sites 10, env 4); nessun nuovo byte audio o commit
canonico. 438/438 test, lint/typecheck, PWA/asset/config e archivio simulato
PASS. Browser locale: aggiornamento bloccato con altra finestra, poi
riuscito; Start Yoga → Hatha 01, seek; Relax → Rain con comandi transizione.
[F] Nel browser remoto l'installazione della shell offline termina invece
`redundant`. La pagina offre quindi «Open latest online version»: secondo
click volontario, rilascio della sola registrazione worker di questa origine,
senza cancellare cache, audio o impostazioni e senza ricaricare altri client.
[U] Causa del fallimento del precache privato non determinata; non si dichiara
la disponibilità offline della PWA privata.
[F] Recupero online verificato anche sul Site: Yoga nuova, otto Hatha, Start
su Hatha 01 e controlli sviluppo. Audio fermato, server locali spenti.
[U] La mancata udibilità su iPhone non è riprodotta: questo intervento corregge
accesso/selezione/copia vecchia, non certifica l'uscita sonora del telefono.
Le transizioni tra Hatha restano da revisionare, senza sostituzioni con onde.

## PWA di review con controlli nel player — D-070

[F] Richiesta aggiuntiva di Robert: stessa estetica consumer e pannello
DEVELOPMENT REVIEW dentro il player. Barra seek, coda file/loop, salti alle
transizioni, finestre ±30/60 s, uscente/entrante/entrambi e A/B durata/curva.
Codice confinato a PWA privata, escluso da EAS/native. 422/422 test, lint e
typecheck PASS; browser verificato, nessun audio lasciato in Play.
Revisione finale HATHA-REVIEW.2 pubblicata sul medesimo Site privato (versione
8, env 4). Browser remoto autenticato: revisione verificata in Settings,
otto titoli visibili in Yoga, Space Unfolding in Play con countdown e pannello
review, nessun errore console. Audio poi fermato. Si attende il test iPhone.

## Respiro Hatha 1 — otto opere in review (D-069)

[F] Integrati gli otto WAV correnti autorizzati, titoli inglesi e ordine interno
1–8, ruoli ricavati dalla timeline pertinente Respiro (non Centro comune).
Tutti autonomi e in loop, Yoga / Standalone works; sorgenti intatte, gain 0 dB,
PCM24 stereo 48 kHz e SHA-256 verificati. 1.344.744.700 byte aggiunti soltanto
al catalogo ignorato. Nessun commit canonico, push GitHub o build.

[F] 414/414 test, lint/typecheck, 13 test HTTP e 12 Worker PASS. Otto player
provati nel browser con Play/Pausa/Stop. Gli export iOS/Android hanno soltanto
i tre ATP01, nessun nuovo audio. Fresh Doctor 19/20 e audit dipendenze FAIL
per patch/advisory tooling: residui documentati, non allentati.

[F] L'utente ha richiesto anche «quando finisci, pwa»: aggiornamento privato
autorizzato sullo stesso link; prima HATHA-REVIEW.1, poi HATHA-REVIEW.2 con i
controlli richiesti. Otto upload verificati SHA/HEAD/Range, 45 file totali
pronti; import temporaneo richiuso e chiavi rimosse. Nessun acquisto.
[U] Sessioni Hatha evolventi non abilitate: mancano finestre e abbinamenti sui
WAV finali. Ascolto iPhone dei nuovi file non certificato. Dettagli/prove:
`docs/HATHA_1_INTEGRATION.md`.

## Checkpoint locale autorizzato — D-068

[F] Robert richiede il commit locale e, durante il controllo, una riduzione
ulteriore minima dei comandi. Altezza 56 → 52, testo e icone invariati;
Stop conserva l'allineamento. Il checkpoint comprende sorgenti, test,
configurazione e documenti del lavoro accumulato dopo `72346a0`.
400/400 test e controlli statici verdi; catalogo pesante e materiali Strategia
esclusi. Nessun push o nuova pubblicazione richiesti da questo comando.

[F] La PWA online resta A01-A14.5 / Sites 6 con altezza 56: l'ulteriore
riduzione a 52 è soltanto locale. Non è un nuovo esito di test iPhone.
[U] Rilascio nativo ancora bloccato: oltre a resolver/storage e device QA,
l'audit registra una divergenza di gain delle due corsie nel codice nativo
inattivo (`docs/A01_NATIVE_GATE.md`). Il checkpoint non certifica quei gate.

## Barra compatta pubblicata nella PWA privata

[F] Robert considera la barra troppo invasiva. D-066 riduce i comandi da
80 a 56, con icona/testo affiancati, fondo carta per Stop e posizione stabile.
24 test mirati, lint, typecheck e formato PASS; audio e disponibilità
invariati. Guided attende registrazioni, le sessioni musicali nuovi abbinamenti
approvati; non ogni blocco richiede nuovo materiale.

[F] Su richiesta esplicita «Mettila nella PWA», D-067 pubblica A01-A14.5
(Sites 6) sullo stesso link privato. 42 test PWA/player e 12 test Worker PASS;
catalogo, audio e funzioni invariati. Nessun commit canonico o acquisto.
[U] La resa della barra sul telefono attende il giudizio di Robert. Chiudere
la vecchia PWA dopo Stop e riaprire online; nessun reload forzato durante
l'ascolto. Il blocco del precedente screenshot non è una prova visiva.

## Versione precedente: crossfade pubblicato per il test umano

[F] Su richiesta di Robert, A01-A14.4 è pubblicata sullo stesso Site privato
(versione 5, D-065). Include le correzioni crossfade D-064 e conserva comandi
grandi e personalizzazione. Confermati 68 HTML, 43 asset byte-identici e
accesso soltanto al proprietario. Nessun nuovo audio, servizio o acquisto.

[F] Il link resta disponibile senza Mac acceso. Testare online dopo aver
chiuso i vecchi client; identificativo in Settings: A01-A14.4. Nessun commit
nel repository canonico: si attende l'esito positivo comunicato dall'utente.
Il solo repository isolato di pubblicazione segue il workflow Sites.
[U] Ascolto, latenza e stabilità della revisione aggiornata su iPhone sono
ancora da provare; offline privato e gate nativi restano distinti.

## Crossfade: QA tecnico indipendente dal catalogo

[F] Su precisazione di Robert, la solidità del motore si verifica senza
attendere l'approvazione di nuove coppie musicali. D-064 aggiunge fixture
senza audio, sessioni virtuali fino a 90 minuti e stress di seek/pausa/stop;
corregge precisione e composizione delle curve, automazioni su Resume,
riallineamento entrante e validazione del piano vuoto. Suite dedicata
92/92, completa 400/400 in 62 suite; lint/typecheck verdi.

[F] D-064 chiusa inizialmente con modifiche locali non committate; nessun brano
o abbinamento nuovo. D-065 autorizza e consegna poi la nuova PWA privata.
`docs/CROSSFADE_QA.md` contiene
comandi, risultati e limiti. [U] Clock virtuale e API simulate non sostituiscono
decoder, ascolto, latenza o long-run su telefono.

## Ultimo riscontro iPhone e aggiornamento consegnato

[F] Robert riferisce test positivo e suoni puliti; collegamenti Home approvati
e preservati. A01-A14.3 rende Stop/Play/Pausa grandi e fissi in basso e porta
in evidenza Personalize your session con anteprima dell'ordine dei suoni.
Corretto l'arresto ripetuto durante Play pendente, senza anticipare Ready.
61 suite / 382 test e regressione audio 128/128 verdi, Doctor 20/20;
export e validatori PASS. Stessa PWA privata aggiornata, versione 4 (D-063).

[U] Nuova UI e latenza vanno confrontate sul telefono. La personalizzazione
natura/durata è disponibile; musica più natura attende nuove coppie approvate
dopo le eliminazioni. Offline remoto, background e race nativa Start/Stop
rimangono gate distinti, non coperti dal riscontro positivo online.

## Milestone attiva

Milestone autorizzata corrente: **A01–A14 — avvio immediato e continuità**
(D-060/D-061). Correzioni software e prove browser consolidate; nuova PWA
privata A01-A14.5 pubblicata. Restano aperti storage/adattività nativi concreti,
riapertura offline remota, telefono reale e approvazioni umane: non è un MVP nativo certificato.
Il lavoro M5/M6 già aperto è riconciliato, non dichiarato nativo completo.
Checkpoint precedente: `tmp/audit-a01-a14-baseline`. D-068 autorizza il nuovo
commit locale; EAS, nuovi asset sonori e push restano esclusi.
Copertura: `docs/AUDIT_A01_A14.md`.

M5 `Adaptive Sessions & QA Workbench`: sessioni consumer duration-first,
sequencer deterministico a vincoli, contratto Guided, pacchetti offline e
Workbench tecnico separato. Il baseline M3/M4 e protetto dal commit locale
`05a672eb4c2f878cba9fcdae94c4f6b5981ce5c1`; non viene riscritto.
Il commit locale M5 è stato autorizzato dopo il gate visivo. EAS, build
native/cloud, push, PR, Git LFS e asset delivery restano esclusi.

## PWA complementare

- [x] Pubblicazione privata autorizzata dall'utente per il test remoto su
      iPhone, con arresto prima di qualsiasi costo (D-058/D-059). PWA privata
      pubblicata su https://app-relax-private-review.robfulton.chatgpt.site,
      accesso alla sola persona proprietaria tramite ChatGPT, senza
      ospiti/gruppi. Versione 6 (A01-A14.5), deployment `succeeded`, environment
      revision 2; nessun nuovo audio caricato o servizio attivato.
- [x] Dopo lo sblocco della rete sono stati caricati e verificati tutti i 37
      file: 2.657.446.897 byte, SHA-256, dimensioni e intervalli iniziali/finali
      coerenti. Storage separato dalla shell; nessuna conversione o modifica
      ai master. Il repository canonico non è stato committato o pushato.
      I commit di pubblicazione riguardano soltanto il repository Sites
      isolato `tmp/pwa-private-site`.
- [x] Import temporaneo chiuso: chiave e scadenza rimosse, nuova configurazione
      pubblicata e richieste con la vecchia chiave respinte (HTTP 401).
      Richieste anonime a Home/catalogo respinte (401). Nessun acquisto o
      abbonamento aggiuntivo attivato; nessun Mac acceso o LAN richiesti.
- [x] Worker: 12/12 test; dipendenze del Site: zero vulnerabilità nell'audit.
      Verifica remota shell corrente: 68 HTML e 43 asset non HTML byte-identici.
      A01-A14.1: Start Meditation remoto, timer 19:57 → 18:20 e Stop verificati.
      Nella precedente versione Play e timer erano verificati nel browser con
      Low Rain e, dopo la chiusura import, Misted Garden; quest'ultima fermata.
      Un primo tentativo Misted Garden interrotto da una nuova richiesta di
      caricamento è riuscito dopo ricarica completa: non costituisce prova di
      robustezza su iPhone.
- [x] Creata una radice Router PWA consumer separata con manifest,
      service worker, icone derivate dall'artwork Meditation e route statiche
      per Home, i sei outcome, sessioni adattive e player. Workbench QA,
      `AUDIO TEST / TEST ONLY`, preset tecnico e route legacy non entrano
      nell'artefatto.
- [x] Il confine audio Web è ora iniettato nel controller: la PWA non importa
      i tre stem ATP01 e risolve soltanto file same-origin sotto
      `/audio-catalog/` oppure gli otto noise generator runtime. Sono
      predisposte 45 route player: 37 file-backed approvate e disponibili
      sulla delivery privata same-origin, più otto generate nel browser. `Soft
Air`, `Moon Drone`, `Deep River`, Eclipse Veil e Stillwater Halo restano
      fuori.
- [x] La shell predisposta all'installazione è separata dal catalogo da
      2.657.446.897 byte. Il service worker bypassa audio e richieste Range;
      precachea integralmente la shell senza takeover durante Play. Download
      selettivi OPFS con hash/rilettura, cancel/retry, rimozione/Undo. Starter
      Rain 16.622.588 byte; prova localhost offline/reopen/Play Quiet Weather
      superata. Il download sul sito privato è verificato, ma la successiva
      riapertura remota senza rete è FALLITA nel browser integrato. Causa:
      `NON DETERMINATO — EVIDENZA INSUFFICIENTE`. Non è una prova iPhone.
- [x] `web:pwa` serve l'export statico e i 37 audio autorizzati con un unico
      processo Node su loopback, URL pulite, GET/HEAD/Range e MIME espliciti.
      `Avvia PWA.command` avvia dal Finder usando il Node già installato;
      nessun Metro, symlink, copia audio o compilazione all'apertura.
- [x] Preflight locale e 12 test del gestore HTTP verdi, inclusi HEAD e primi/
      ultimi 16 byte identici per tutti i 37 file reali. Richieste simulate
      senza socket: non costituiscono un test del decoder nel browser.
- [x] Export PWA statico e validatore verdi: 111 file per 7.286.699 byte, 67
      route statiche totali e 45 player predisposti; zero WAV/FLAC, catalogo,
      Audio Test o Workbench nell'artefatto.
- [F] Il precedente blocco rete/bind locale è storico (D-058). La consegna
  corrente usa HTTPS privato remoto, verificato nel browser Codex; non dipende
  dal launcher Finder o dalla porta 8095.
- [U] Installazione e riapertura offline completa della PWA su iPhone, decoder
  di tutte le opere e comportamento offline
  dei suoni restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`. La sola
  pubblicazione privata di prova è eseguita (D-059/D-061); nessun costo,
  store, EAS o diffusione pubblica è autorizzato.

## M5 implementato localmente

- [x] `Nirvana Waves` / `Stillwater Halo` eliminato dal catalogo su ordine
      esplicito dell'utente il 4 settembre 2026. Record, assetKey, route, copia
      Review WAV e copia FLAC del sidecar QA Android sono stati rimossi; il
      master canonico esterno e il report lossless storico restano intatti.
      Stato corrente: 48 entità, 40 file-backed, 37 approvate, 47 riproducibili
      nella Review, 33 transition-ready, 14 single-only e una respinta. Relax
      espone 28 suoni; il manifest localhost contiene 37 file per
      2.657.446.897 byte.
- [x] La rimozione azzera le coppie musicali approvate. `Music + nature` resta
      visibile ma disabilitato come `IN PRODUCTION`; una vecchia sessione
      musicale salvata non viene convertita silenziosamente. Il percorso
      consumer parte da sessioni naturali funzionanti e il planner musicale
      fallisce chiuso finché l'utente non approva un nuovo abbinamento.
- [x] Gate della rimozione: formattazione, lint, TypeScript, 39 suite / 185
      test, regressione audio 55/55, validatori audio/asset/config/sicurezza/QA
      ed export Web verdi. Gli export iOS e Android correnti contengono
      esattamente i tre WAV ATP01 per 155.520.132 byte, nessun FLAC e nessuna
      stringa Nirvana/Stillwater; misurano 162.490.591 e 163.646.202 byte. Il
      sidecar QA Android locale è sceso a 37 FLAC / 1.635.181.380 byte.
- [U] Expo Doctor passa 18/20 controlli; schema remoto e React Native Directory
  restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` perché la sandbox non
  può raggiungere `exp.host`.
- [x] `Eclypsis` / `Eclipse Veil` escluso dal prodotto dopo il test d'ascolto
      del 4 settembre 2026: l'utente lo giudica troppo dissonante. La voce,
      l'assetKey, il mapping nativo, le relazioni Continuum e il FLAC starter da
      28.167.925 byte sono stati rimossi dal catalogo e dal pacchetto app. Il
      master esterno e il report storico di conversione restano intatti. Stato
      corrente, dopo entrambe le esclusioni: 48 entità, 40 file-backed, 37
      approvate, 47 riproducibili nella Review e 33 transition-ready;
      Meditation espone 16 suoni. L'audio nativo
      autorizzato torna ai soli tre WAV ATP01, 155.520.132 byte.
- [x] Patch Review iPhone dopo la prova reale: la schermata ricevuta ha
      identificato in precedenza `Session source 0` come Eclipse Veil. File,
      hash, decode
      completo e Range sono integri; il messaggio era generico e non provava un
      errore decoder. Metro serve ora tutti i FLAC con il media type registrato
      `audio/flac` al posto dell'alias deprecato `audio/x-flac`, senza cambiare
      i byte. Il player prepara soltanto le sorgenti attive e una futura, non
      piu tutto il piano insieme, e mostra titolo/corsia/codice media reali in
      caso di errore. HEAD e Range 206 sono stati riconfermati; sul browser
      interno la sessione musica piu onde raggiunge Playing. Gate automatici:
      config PASS, lint PASS, typecheck PASS, Jest 39 suite / 183 test. Questa
      diagnosi resta storica; l'opera è stata poi esclusa dal prodotto.
- [U] Il nuovo esito sul browser iPhone dopo refresh resta `NON DETERMINATO —
EVIDENZA INSUFFICIENTE`; il server Review è spento a chiusura.

- [x] Anteprima consumer per iPhone predisposta senza build nativa: il comando
      dedicato rileva l'IPv4 privata del Mac, autorizza soltanto quell'host in
      development, forza la radice consumer e mantiene `web`/`web:qa` su
      localhost. Il catalogo da circa 2,6 GiB non viene copiato: i file
      richiesti sono serviti dal Mac on-demand con supporto Range. Su LAN iOS
      sia il player adattivo sia quello della singola opera attendono un tap
      Play esplicito, evitando di fingere un autoplay che Safari/Chrome possono
      bloccare.
- [U] Apertura, decoder FLAC, seek e crossfade su un iPhone reale restano
  `NON DETERMINATO — EVIDENZA INSUFFICIENTE` finché l'utente non prova il
  link sulla stessa Wi-Fi. La modalità LAN è temporanea, priva di tunnel e
  va usata soltanto su rete fidata.
- [x] Prova LAN dal browser interno Codex: Home consumer completa caricata su
      `192.168.1.5:8094`; la route Relax musica+natura ha atteso il tap, è
      passata da Play a Pause con timer in avanzamento ed è tornata a 20:00
      dopo Stop. Anche la singola opera Open Tide ha atteso il tap, è passata a
      Pause con timer in avanzamento ed è stata fermata. Un FLAC Rain ha
      risposto `206 Partial Content` con `Accept-Ranges: bytes`. Il launcher ha
      mostrato la Home consumer anche partendo deliberatamente da una shell con
      `APP_RELAX_SURFACE=qa`. Questo verifica il percorso Web dal Mac, non la
      resa sonora o la compatibilità sull'iPhone dell'utente.
- [x] Modalità Review iPhone autorizzata e predisposta nello stesso launcher:
      forza la radice QA e `public`, apre direttamente `/qa-workbench` e
      conserva Home/route consumer. Espone ora 48 voci: 47 riproducibili, 33
      transition-ready e Soft Air visibile ma intenzionalmente bloccato.
- [x] Audit manifest corrente: 37/37 file hanno presenza, dimensione e hash
      coerenti per 2.657.446.897 byte; Moon Drone e Deep
      River incorporati sono serviti correttamente. Nessun path riproducibile
      manca. I problemi riferiti dall'utente sono quindi un
      gate di caricamento/decodifica sul suo browser, da identificare per titolo
      nella Review; non risultano file assenti dal server. Il controllo di
      Eclipse appartiene alla prova precedente alla sua esclusione.
- [x] Prova runtime della radice Review sul browser interno: Workbench QA,
      player consumer identico, catalogo e controlli di sessione/A-B/scrub sono
      visibili. Open Tide, FLAC naturale da 26.805.900 byte, e Aquarian Echo,
      WAV musicale da 345.312.044 byte, hanno raggiunto lo stato Playing con
      timer e posizione file in avanzamento; entrambi sono stati poi fermati.
      Questa coppia copre un FLAC naturale e il WAV più pesante, ma non prova
      la compatibilita di ogni file sul browser iPhone dell'utente.
- [x] Audit container con ffprobe 8.1.2: 14/14 WAV sono RIFF/WAVE PCM standard
      24-bit/48 kHz/stereo, 24/24 FLAC sono lossless 24-bit/48 kHz/stereo e
      durate/frame coincidono col catalogo. Nessun container, codec o metadata
      anomalo. I soli outlier sono nove WAV fra 124 e 329 MiB: costituiscono un
      rischio plausibile di latenza, banda o seek mobile, non una causa provata.

- [x] Sessioni musicali coordinate dopo la revisione d'ascolto: non resta
      alcuna coppia editoriale ammessa. Il codice conserva il contratto dei
      passaggi lenti, ma la UI consumer li dichiara `IN PRODUCTION` e il planner
      fallisce chiuso; nessun sostituto è stato inventato.
- [x] L'utente sceglie esplicitamente `Ocean waves` oppure `Rain`; la corsia
      naturale alterna lentamente due registrazioni diverse restando sempre
      nella famiglia scelta. Il player mostra un volume ambiente separato
      0–100% con mute, oltre al volume principale. Non e un mixer libero:
      esistono soltanto una corsia musica e una corsia natura, i cambi sono
      sfalsati e il piano limita l'esecuzione a tre sorgenti contemporanee.
- [x] Gate locale della revisione musica+natura: Prettier, lint e TypeScript
      verdi; Jest 39 suite / 178 test. Nel browser Codex localhost la vista
      consumer aveva mostrato, prima dell'esclusione, Eclipse Veil + Ocean
      waves, i due volumi distinti e il passaggio musicale da 180 secondi. Play
      e Stop erano stati verificati e l'ascolto fermato. Scelta famiglia,
      volume ambiente, mute/ripristino, persistenza e indipendenza dal volume
      principale sono coperti dai test automatici.
- [U] Riproduzione coordinata e controlli sono verificabili nella preview Web
  loopback. Decoder multipli, timing, CPU, background e qualita sul driver
  nativo restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino a build e
  prova autorizzata su telefono reale.
- [x] Correzione di visibilita del catalogo dopo il feedback utente: nessuna
      delle 37 opere ancora approvate manca dai manifest o dal registro, ma Home e
      le sei route outcome non esponevano piu i titoli individuali. Home usa
      ora un vero titolo approvato per ogni funzione; ogni route mantiene
      durata e Start come azione primaria e mostra sotto l'intera libreria
      pertinente (Meditation 16, Yoga 3, Massage 7, Relax 28, Sleep 16,
      Focus 14). Soundscapes apre con Sea, Rain e Stream prima delle famiglie
      cosmiche, standalone e noise.
- [x] Audit manifest -> catalogo -> disco: 40/40 opere file-backed presenti,
      cioe 13 analogiche, 24 Water/Air e tre ATP01 riusate senza duplicazione;
      con gli otto generatori il totale resta 48. I file supplementari nei
      pacchetti sono master o preview degli stessi lavori, non tracce
      consumer aggiuntive. I candidati esterni non manifestati restano esclusi.
- [x] Verifica della correzione: lint e TypeScript verdi, Jest 37 suite / 161
      test; nel browser loopback la Home mostra Open Tide, Quiet Field,
      Mineral Drift, Distant Bloom, Moonlit Veil e Astral Thread;
      Meditation mostra 16 suoni e Soundscapes apre con tutte le sette opere
      Sea, poi undici Rain e sei Stream.
- [I] Il commento utente che i suoni naturali "reggono" e registrato come
  riscontro d'ascolto positivo e criterio di priorita editoriale, non come
  nuova certificazione tecnica o sostituto del gate su telefono reale.
- [x] Revisione QA successiva al commit `72346a0`, ancora non committata: il
      Workbench riusa ora lo stesso `ConsumerPlaybackSurface` dei player
      consumer e lo stesso selettore 15/30/60 del player single-track, con
      artwork, tipografia, trasporto, timer e volume identici; i controlli di
      revisione restano aggiuntivi e confinati alla radice QA.
- [x] Il Workbench espone tutte le 48 entita del catalogo: 47 avviabili in
      ascolto singolo locale, 33 selezionabili direttamente come uscente o
      entrante e `Soft Air` visibile ma disabilitato perche respinto
      all'ascolto. Le 14 entita single-only non vengono forzate nel motore
      crossfade.
- [x] La modalita `Direct transition` costruisce esattamente la coppia A/B
      scelta, ne applica le regole ALL-OF e blocca gli abbinamenti
      incompatibili. La durata segue quella ammessa per l'outcome e la UI
      dichiara `READY` soltanto quando un safe exit registrato entra davvero
      nella finestra scelta. Ogni singola opera transition-ready ha almeno un
      partner compatibile verificato dai test. I comandi
      `OPEN A/B FILE + SCRUB` portano ciascuna sorgente nel player consumer
      completo senza perdere la coppia selezionata.
- [x] Lo scrubber Web usa coordinate normalizzate e supporta click,
      trascinamento e salti accessibili di 10 secondi. Se il piano non e ancora
      caricato, lo carica, chiude l'eventuale finestra A/B e applica il seek
      prima di Play. Ogni file singolo dispone inoltre di una barra dedicata
      che sposta la posizione dentro il file e attende l'evento `seeked` del
      browser prima di confermare il nuovo punto; i generatori continui
      dichiarano onestamente di non avere una posizione file. Lo stesso
      handshake verificato precede ora Play e ogni riposizionamento del
      dual-deck: un evento `seeked` su un punto diverso fallisce e la barra
      torna alla posizione precedente. I due deck iniziali usano inoltre una
      barriera comune: nessuno dei due puo partire finche entrambi i seek non
      sono confermati; un errore su uno ferma e pulisce l'intera sessione. Nel
      browser Codex reale Open Tide e
      stato spostato con click e drag fino a 01:56/02:28; la sessione diretta e
      stata posizionata a 09:40, avviata dopo la conferma delle sorgenti e poi
      ascoltata oltre la fine del crossfade a 09:52 e lasciata in pausa, senza
      errori o avvisi console. Un nuovo click diretto sulla timeline ha inoltre
      spostato la sessione da 00:00 a 10:00 prima del Play.
- [x] Cambio modalita, sostituzione piano e avvio sono serializzati: prima si
      ferma l'audio corrente, poi cambia la superficie. Sessione completa e
      coppia diretta conservano piani separati, quindi UI e audio non possono
      divergere tornando da una modalita all'altra. L'indice della transizione
      torna a zero a ogni cambio di modalita e un errore di load/play non puo
      produrre un falso stato `Playing`. Volume e mute restano visibili ma
      disabilitati finche il programma mostrato non e caricato, quindi non
      possono modificare una sorgente precedente nascosta.
- [x] Il catalogo completo e il dual-deck adattivo sono dichiarati e abilitati
      esclusivamente nel Workbench Web localhost. Gli script Web si legano
      esplicitamente a loopback e anche i deep link dei file locali falliscono
      chiusi su host non-loopback o in produzione. La superficie QA nativa non
      finge che i 37 file locali siano incorporati o scaricati.
- [x] Gate della revisione aggiornato: lint e TypeScript verdi; Jest 39 suite /
      185 test, regressione audio 55/55, inclusi conteggi correnti
      48/47/33/14/1, partner compatibili,
      fattibilita temporale del safe exit, programma diretto fail-closed,
      click/drag/clamp, conferma e posizione esatta dopo `seeked`, seek file e
      dual-deck, barriera Play atomica, cleanup con un deck fallito e l'altro
      pendente, seek fail-closed, rollback UI, load+seek prima di Play, reset
      dell'indice, volume confinato e fallimento load onesto.
- [x] Separazione export verificata dal checkout reale: gli script nativi e i
      tre profili EAS usano `public-mobile`, quindi il catalogo localhost resta
      disponibile al Workbench ma non viene copiato nell'output mobile. Il
      validatore nuovo ha confermato iOS 162.490.586 byte e Android 163.646.167
      byte, ciascuno con esattamente tre WAV ATP01 e nessun FLAC starter, per
      155.520.132 byte audio; nessun path `audio-catalog` e nessun file oltre
      100 MiB.
      Il comando Expo grezzo precedente aveva invece copiato il catalogo allora
      presente per 2.706.406.941 byte:
      per questo non fa piu parte del runbook. Un archivio EAS reale resta
      `NON DETERMINATO — EVIDENZA INSUFFICIENTE` finche EAS non e autorizzato.
- [ ] La revisione QA richiede approvazione visiva e d'uso dell'utente prima
      di un eventuale nuovo commit. Nessun push, EAS o build e stato eseguito.

- [x] Due modalità consumer: `Sound only` operativa esclusivamente nella
      preview QA localhost e `Guided` visibile ma bloccata con
      `RECORDED VOICES · IN PRODUCTION`. Nessuna voce sintetica, registrazione
      fittizia o account.
- [x] Home e Yoga seguono bisogno/attività → durata → Start. Le durate possibili
      sono 10/20/30/45/60/90 minuti, filtrate per Meditation, Yoga, Massage,
      Relax, Sleep e Focus. Restano letterali `What do you need right now?`,
      `Start your yoga session`, `Start your massage session` e
      `Play your last session`.
- [x] La personalizzazione è progressiva e chiusa al primo render. La scelta
      della voce compare soltanto in Guided; offline e modalità non ostacolano
      il percorso principale Sound only.
- [x] `Play your last session` persiste soltanto outcome, durata e modalità
      dopo uno Start riuscito; la Home rilegge lo stato al ritorno, genera una
      nuova variazione e non espone né conserva il seed QA nell'URL consumer.
- [x] Registro Continuum separato dal catalogo: intenti, famiglia estetica,
      famiglia armonica, energia iniziale/finale, densità, presenza melodica,
      compatibilità voce, ruolo di fase, boundary di ingresso/uscita, classe di
      transizione e stato offline. I metadata inferiti restano esplicitamente
      `PROVISIONAL — CATALOG AND FILENAME INFERENCE`, sono esclusi per default
      e richiedono un opt-in confinato alla preview QA locale.
- [x] Planner puro e riproducibile tramite seed: arco Arrival → Flow →
      Deepening → Return, nessuna opera o famiglia ripetuta nella stessa
      sessione, esclusione delle tre sessioni recenti, regole specifiche per
      fase, controlli di transizione ALL-OF e fallimento esplicito quando una
      sequenza sicura non esiste. L'identità include input e timeline completi;
      nessuno shuffle arbitrario o fallback musicale casuale.
- [x] Durata esatta calcolata in frame interi a 48 kHz. I cambi avvengono sui
      boundary di loop registrati; un finale editoriale richiesto e assente
      fallisce chiuso. In assenza di outro editoriale, il contratto dichiara un
      inviluppo finale controllato e non finge una chiusura composta.
- [x] Crossfade equal-power configurabile; il baseline M5 usava 12 secondi,
      mentre la revisione d'ascolto corrente imposta 180 secondi per le coppie
      musicali approvate. Normalmente una sola opera è udibile e soltanto il
      passaggio usa due deck. Peak combinato
      stimato sul massimo matematico dell'intera curva e trim statico calcolato
      per restare a massimo -1,1 dBTP. Ogni transizione resta
      `PROVISIONAL — LISTENING REVIEW REQUIRED`.
- [x] Preview Web Audio locale con validazione metadata di tutte le sorgenti,
      preparazione del prossimo deck, seek, pausa/ripresa, volume, audition
      outgoing/incoming/both e loop della finestra di cambio. Un errore futuro
      torna al controller. È QA browser, non prova di precisione nativa.
- [x] Workbench interno con timeline completa, fasi, entry/crossfade/exit,
      scrubber, cambio precedente/successivo, finestre ±30/60 secondi, A/B di
      durata/curva, metriche, audit regole, seed salvabile e controllo esatto di
      tutti gli intervalli senza attesa reale.
- [x] Il Workbench non è linkato dalla UI consumer. `app.config.js` seleziona
      `src/app` per default e `src/app-qa` soltanto con
      `APP_RELAX_SURFACE=qa`; `src/app-qa/` e `src/qa/` sono esclusi da
      `.easignore` e un validatore dedicato controlla il confine.
- [x] Manifest offline locale senza URL: pacchetto Water da 12 opere,
      177.645.113 byte, con ID, revisione, SHA-256 e object key. Stato
      download/verify/retry/remove, spazio libero sui byte mancanti, recovery
      da interruzione, staging streaming, riconciliazione del contenuto e porte
      atomiche source/storage sono implementati e testati. Gli adapter nativi e
      la delivery remota non esistono e non vengono dichiarati.
- [x] Il catalogo locale completo da 2.657.446.897 byte resta in
      `public/audio-catalog/`, fuori da Git e dall'archivio EAS. Il local source
      è esplicitamente read-only e non viene finto come download offline.
- [x] Il percorso tecnico `AUDIO TEST / TEST ONLY` e il player autonomo M4
      restano regressioni separate; nessun mixer è stato introdotto nelle
      sessioni consumer.
- [x] Gate logici finali eseguiti con Node 22.23.1 e pnpm 11.16.0:
      Prettier, lint e TypeScript verdi; Jest 40 suite / 207 test; regressione
      audio 8 suite / 69 test. Sono coperti durate, determinismo, vincoli,
      regole di fase, peak, audit 90 minuti, controller, persistenza, offline e
      confine QA.
- [x] Validatori placeholder, ATP01, catalogo consumer, lossless, asset,
      config, sicurezza e confine Workbench verdi. Il validatore conferma zero
      FLAC starter e conserva il confronto PCM soltanto come evidenza storica
      del master esterno. L'audit dipendenze corrente non rileva advisory.
- [U] Expo Doctor passa 18/20 controlli; i due controlli remoti falliscono per
  `ENOTFOUND exp.host` con rete sandbox disabilitata, non per un difetto
  dimostrato del progetto. `expo install --check` dichiara le dipendenze
  aggiornate usando la mappa locale Expo, ma avverte che il risultato
  offline non è una verifica remota completa.
- [x] Export isolati correnti verdi: iOS 162.493.295 byte e Android 163.648.902
      byte. I due export nativi contengono esattamente tre WAV ATP01 e nessun
      FLAC starter, per 155.520.132 byte; nessun file supera 100 MB, il catalogo
      da 2,6 GiB è assente e la scansione mirata non trova Eclypsis. Gli export
      Web consumer e QA sono stati rigenerati senza riferimenti al brano.
      Il confronto Web trova 15 artifact testuali consumer puliti e il sentinel
      QA soltanto nei 16 artifact della superficie QA.
- [ ] Un nuovo archivio sorgente EAS reale non è stato generato né caricato:
      `eas build:inspect` ed EAS restano fuori dall'autorizzazione M5. Il
      validatore dell'archivio è predisposto e `.easignore` è verificato
      staticamente, ma queste prove e gli export isolati non equivalgono a un
      archivio EAS corrente: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [x] Prova browser reale localhost a 390×844: Home e sei outcome leggibili;
      Guided mostra la voce solo come `IN PRODUCTION` e disabilita Start;
      Sound only ha avviato Open Tide con timer in decremento, Pause ha fermato
      il timer per 1,5 secondi e Play lo ha ripreso. Nessun errore console.
      L'audit Workbench riporta durata esatta, nessun gap, massimo due sorgenti
      e sette intervalli esatti; audition A avviata senza errori.
- [x] Cinque screenshot runtime Web sono in `dist/m5-screenshots/`: Home,
      Guided/offline, player in Play, piano Workbench e audit accelerato. Sono
      prova della preview locale, non approvazione d'ascolto né prova nativa.
      Metro, server localhost, emulatore e ADB risultano spenti a chiusura.
- [x] Il 3 settembre 2026 l'utente ha approvato esplicitamente i cinque
      screenshot M5. L'approvazione è visiva e non implica approvazione delle
      transizioni musicali, commit, EAS o prove native.
- [ ] Native adaptive dual-deck, seek schedulato, due decoder FLAC, pacchetti
      scaricati, background/lock-screen/Bluetooth, durata lunga, batteria e
      qualità delle transizioni: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
      Il driver nativo fallisce esplicitamente invece di simulare supporto.
- [ ] Approvazione d'ascolto delle transizioni: gate umano separato. Il giudizio
      positivo sui singoli file non approva automaticamente accoppiamenti,
      durata o curva dei passaggi.
- [ ] Non resta alcuna coppia musicale approvata. Le sessioni musicali restano
      `IN PRODUCTION` e falliscono chiuse finché non viene approvato un nuovo
      abbinamento; nessun fallback casuale è stato introdotto.

## M4 implementato localmente

- [x] Registro editoriale unico di 48 entità autonome: 40 opere file-backed (13
      derivati analogici, 24 opere Water/Air e tre ATP01) più otto generatori
      noise runtime. Ogni entità resta single-source.
- [x] Tutti e sei gli outcome hanno opere riproducibili nel localhost. Calm è
      ricondotto a Relax; Water vive in Elemental Worlds e Second Element: Air
      in Esoteric Series, senza cambiare i master o sommare sorgenti.
- [x] L'utente ha dichiarato positivo l'ascolto dei 15 lavori analogici e dei 24
      Water/Air il 3 settembre 2026; il 4 settembre ha poi respinto Eclypsis ed
      eliminato Nirvana Waves. Restano quindi 13 lavori analogici e 24
      Water/Air, 37 opere con stato
      `APPROVED — LISTENING PASSED`. Titoli e mapping restano modificabili.
- [x] Meditation occupa ora la prima posizione della Home. Nel localhost la sua
      selezione apre con `Open Tide` in evidenza e prosegue con gli altri cinque
      suoni marini già associati a Meditation; `Eclipse Veil` è escluso.
- [x] `Stillwater Halo` non compare più in Soundscapes né in alcuna selezione
      consumer; il master esterno resta archivio intatto.
- [x] `SingleTrackProgram` separato dal preset tecnico; controller, driver,
      timer assoluto, fade, interruzioni, notification lifecycle e persistenza
      supportano una sola sorgente consumer in loop: file oppure noise buffer.
- [x] Collezione `Noise Colours`: White, Pink, Brown/Red, Blue/Azure,
      Violet/Purple, Grey/Gray, Green e Black. Gli alias non duplicano
      generatori; Grey, Green e Black sono dichiarati profili non standard.
- [x] I noise vengono generati una sola volta al load in un buffer stereo
      Float32 48 kHz da 8 secondi, con boundary raccordato, sample peak 0,5 e
      gain interno -6 dB. Nessun nuovo asset audio e nessun peso audio nel
      pacchetto; circa 3,1 MB temporanei per il buffer attivo.
- [x] Player consumer con Play/Pause/Stop, timer 15/30/60, volume principale e
      mute; nessun mixer, Hz, waveform o pannello tecnico.
- [x] Flusso outcome realmente disponibile in due tocchi: Home → lista filtrata;
      il primo asset incorporato è ordinato in testa e il secondo tocco lo
      carica e avvia nel player. Le opere successive aprono il player senza
      autoplay.
- [x] Gain di ascolto calcolato per circa -18 LUFS; tutte le opere restano sotto
      -1 dBTP post-gain senza rinormalizzare master o applicare limiter.
- [x] 18 FLAC level 8 generati fuori repository e verificati: PCM decodificato
      identico ai WAV. Totale 2.563.271.952 → 1.455.254.377 byte (-43,2267%).
- [x] Lo starter consumer FLAC è vuoto dopo l'esclusione di Eclipse Veil. Moon
      Drone e Deep River riusano due ATP01 nel consumer; `SLEEP_TEXTURE_001`
      resta nei byte soltanto per AUDIO TEST dopo il rifiuto consumer di Soft
      Air.
- [x] Catalogo localhost completo: 37 file on-demand in
      `public/audio-catalog/`, ignorati da Git, per 2.657.446.897 byte. Sono i 13
      lavori analogici ancora approvati come WAV invariati e i 24 Water/Air
      come FLAC delivery invariati.
      Manifest locale, dimensioni e SHA-256 di ogni file sono validati.
- [x] Prova browser individuale storica completata sulle 38 opere allora approvate;
      Nirvana Waves è stata poi esclusa. Per le 37 opere correnti,
      ciascuna ha raggiunto lo stato Pause dopo Play, senza alert o errori
      console. Play/Pause/Stop restano verificati sul percorso Web Audio.
- [x] Gate locali M4 verdi dopo l'estensione: Prettier, lint, TypeScript, 18
      suite / 81 test, regressione audio 40/40, peer dependency, Expo install
      check, Expo Doctor 20/20, validatori placeholder/ATP01/consumer/asset/config
      e confronto PCM lossless completo.
- [x] Bundle Metro Android e iOS verdi. La tabella degli asset referenziati
      deve contenere esattamente i tre WAV ATP01, per 155.520.132 byte; gli
      SHA-256 coincidono con i manifest e non sono emersi
      path locali o segreti mirati nel bundle/metadata. Un export locale eseguito
      mentre `public/audio-catalog/` è popolata ne copia anche i 38 file di
      ascolto: non sono asset Metro nativi e l'intera cartella è ora esclusa
      esplicitamente dall'archivio EAS tramite `.easignore`.
- [x] Export web statico verde con 12 route, incluse Home, outcome filtrato,
      Soundscapes e player consumer.
- [x] Anteprima web sonora su `http://localhost:8092/`: un adattatore Web Audio
      separato usa lo stesso `AudioSessionController` senza importare il graph
      nativo nel browser. Verificati nel browser Play/Pause/Stop, timer,
      volume/mute, Pink Noise generato, Deep River WAV e il percorso tecnico
      Moon Current; la precedente prova di Eclipse Veil resta soltanto evidenza
      storica. Nessun errore console nel run.
- [x] Dipendenze allineate alle patch SDK 57 richieste da Expo il 2 settembre:
      Expo 57.0.19, Router 57.0.18 e React Native 0.86.3. L'override transitivo
      `decode-uri-component` 0.5.0 corregge GHSA-vcc3-ghjq-m6fr; audit policy
      verde con i soli due residui `image-size` già documentati.
- [x] Il nuovo GHSA-6gmq-8vp8-gcm6 emerso il 3 settembre è chiuso con override
      transitivi `@xmldom/xmldom` 0.8.15 e 0.9.12, le due release corrette
      indicate dall'advisory. Audit policy nuovamente verde.
- [ ] Runtime FLAC/loop Android: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
      ADB è bloccato dal sandbox (`Operation not permitted`) e l'emulatore non
      si avvia in questa task; la compatibilità statica non vale come ascolto.
- [x] Quattro render statici M4 ad alta risoluzione prodotti e ispezionati da
      sorgenti, copy, font e artwork correnti: Home, lista Relax filtrata,
      Soundscapes e player. Sono prove visive di layout, non screenshot runtime.
- [x] Renderer browser e server locale M4 disponibili; lo screenshot web resta
      prova visiva e il playback web prova il solo percorso Web Audio.
- [ ] Runtime M4 su telefono reale: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
      Il browser non certifica background, Bluetooth, latenza, batteria o
      qualità del percorso nativo Android/iOS.
- [x] Qualità d'ascolto dei 39 file raccolti dalla Strategia approvata
      direttamente dall'utente. [U] Naming definitivo e test del percorso
      nativo restano separati; Soft Air resta `REJECTED — REPLACEMENT REQUIRED`.

## M3 implementato finora

- [x] Tab consumer `RITUALS`, `YOGA` e `SOUNDSCAPES` con copy inglese richiesto.
- [x] Home outcome-first con CTA esplicite per Yoga, Massage, Relax,
      Meditation, Sleep e Focus; il caso Yoga espone subito
      `Start your yoga session` e poi i formati 20/30/45/60.
- [x] Home riequilibrata in una griglia 2×3 di sei box equivalenti: nessun
      outcome domina la pagina; ogni box usa il proprio artwork finale e ordina
      funzione, CTA, formato e titolo futuro in questa sequenza.
- [x] Functionality and time-to-sound first; evocative naming is secondary metadata.
- [x] La Home usa come promessa guida la frase
      `Choose your moment. Press start. Leave the phone behind.` Un avviso
      separato e immediatamente visibile chiarisce che le sessioni consumer sono
      ancora in produzione e senza audio.
- [x] Tutte le card consumer sono `IN PRODUCTION`, disabilitate e prive di
      riferimenti a preset o asset audio.
- [x] Yoga predisposto per formati futuri 20/30/45/60 minuti.
- [x] Soundscapes predisposto per opere autonome, Elemental Worlds, field
      recording, Cosmic/Zen Ambient ed Esoteric Series.
- [x] `Moon Current`, `deep-sleep-432`, ATP01 e mixer multilayer confinati nel
      percorso separato `AUDIO TEST / TEST ONLY`, raggiungibile da Settings.
- [x] Play/Pause/Stop, timer, volume e mute restano chiari e accessibili nel
      solo player tecnico; motore, controller e persistenza preservati.
- [x] Direzione visiva: impressionismo/pastello meditativo con cosmic new age
      raffinato e contemporary minimal Japanese impressionism materico:
      pigmento minerale nihonga, sumi, gouache asciutta, washi, asimmetria e
      `ma`. Differenziazione da Anima nell'interfaccia, non abbandono
      dell'immaginario cosmico.
- [x] Sei artwork outcome originali, uno per Yoga, Massage, Relax, Meditation,
      Sleep e Focus: JPEG 720×720 generati con OpenAI image generation built-in.
      Cinque restano text-only; Yoga v2 deriva da un unico edit del precedente
      sorgente Yoga originale del progetto, senza reference esterne. Byte,
      SHA-256 e confine di provenienza sono in
      `docs/M3_OUTCOME_ARTWORK_PROVENANCE.md`.
- [x] Yoga v2: susuki, luna avorio incompleta e lavatura solare pesca integrati;
      screenshot runtime Android acquisito e verificato.
- [x] Approvazione umana dello screenshot Yoga v2 ricevuta dall'utente con
      `ok` il 15 agosto 2026.
- [x] Anteprima web locale della nuova Home a griglia acquisita senza emulatore:
      `01-home-grid-painterly-background-approved-candidate.jpg` mostra la
      gerarchia iniziale e il fondale;
      `01-home-grid-painterly-background-cards-detail.jpg` mostra CTA e formati
      dei box affiancati. Sono prove visive del layout, non prove runtime Android.
- [x] Fondale Home-only originale in stile impressionismo minimale giapponese:
      carta washi, velature pastello minerali, luce lunare, acqua/nebbia e
      vegetazione rada. Asset, manifest, hash e provenienza sono registrati in
      `docs/M3_HOME_BACKGROUND_PROVENANCE.md`; le altre route non cambiano.
- [x] Il precedente `bravo` ha autorizzato il commit locale, ma la successiva
      revisione post-commit ha riaperto il gate visivo: box e barra risultavano
      troppo alti e il fondale appariva spoglio.
- [x] Correzione locale dell'anteprima web: dimensionamento intrinseco bloccato,
      sfondo 390×844, artwork 131 px, box circa 357 px e barra 52 px con target
      tab da 48 px. Il fondale e i sei artwork sono ora visibili nel layout.
- [x] Spettro pastello reso esplicito nei sei box: giada, pesca, acqua marina,
      blu minerale, lavanda e zafferano usano testata, corpo, hairline e accento
      scuro coordinati senza filtrare gli artwork o introdurre blob/gradienti.
- [x] Revisione pastello verificata: Prettier, lint, TypeScript, 15 suite/62
      test e regressione audio 26/26 verdi; anteprima web senza errori console.
- [ ] Approvazione umana della Home pastello revisionata in
      `dist/m3-screenshots/01-home-pastel-spectrum-revision.jpg` e del dettaglio
      della seconda parte della griglia in
      `dist/m3-screenshots/01-home-pastel-spectrum-cards.jpg`.
- [x] Shell consumer separata `consumer-paper`: carta washi, inchiostro AA,
      composizioni editoriali asimmetriche, sezioni aperte e hairline; rimosso
      il linguaggio generico di card arrotondate, pillole e blob. Audio Test
      conserva intenzionalmente la shell tecnica scura.
- [x] Il primo screenshot Android `consumer-paper` è stato approvato dall'utente
      con `Design ok`. Il successivo passaggio di leggibilità porta tutte le
      micro-scritte consumer ad almeno 11 px, riduce il tracking e conserva il
      contrasto anche durante la pressione; screenshot aggiornato acquisito.
- [x] Gate repository M3 consolidato prima del commit: formattazione, peer,
      Expo install check, lint, TypeScript, 15 suite/60 test, audio 26/26,
      validatori audio/asset/config/security policy ed Expo Doctor 20/20 verdi.
      Gli export Metro iOS e Android contengono esattamente i tre WAV ATP01 con
      hash canonici e 11 JPEG registrati, senza segreti mirati rilevati.
- [ ] Screenshot finale runtime Android della Home: resta distinto
      dall'anteprima web richiesta e approvata senza emulatore.

## Baseline M2 completata e preservata

- [x] Registro editoriale separato dal motore: quattro goal, quattro rituali,
      quattro temi e un solo rituale disponibile.
- [x] Titolo pubblico e notifica del preset `deep-sleep-432` aggiornati a
      `Moon Current`; nessun Hz nella Home o nella vista principale del player.
- [x] Home 2x2 senza onboarding; `Quiet Tide`, `Cedar Light` e `Aquarian Sky`
      mostrano `IN PRODUCTION` e non possono navigare o caricare audio.
- [x] Player immersivo con timer e trasporto; `Adjust sound` e
      `About the sound` separati e chiusi di default.
- [x] Quattro artwork originali ispezionati, normalizzati JPEG 1080x1440,
      tutti sotto 1,2 MB e registrati con SHA-256.
- [x] Font OFL Newsreader e Manrope incorporati localmente, senza download
      runtime; motion massimo 1.03 solo in Play e statico con Reduce Motion.
- [x] Nessun nuovo WAV: il repository contiene ancora soltanto i tre master
      autorizzati di `AUDIO TEST PACK 01`.
- [x] TypeScript, lint e 12 suite/47 test verdi dopo l'implementazione UI;
      subset audio 26/26.
- [x] Gate M2 consolidato: dipendenze/peer, Expo install check, validatori audio,
      asset e config, Expo Doctor 20/20, config prebuild ed export Metro iOS e
      Android verdi. Il raw audit resta rosso soltanto per i due advisory
      `image-size` gia allowlistati; la policy audit e verde con residui accettati.
- [x] Gli export M2 contengono esattamente i tre WAV autorizzati e i quattro
      artwork registrati, senza placeholder audio, nuovo master, path locale,
      file credenziale o pattern segreto mirato.
- [x] Cinque screenshot runtime Android 1080x2400 acquisiti in
      `dist/m2-screenshots/`: Home, card `IN PRODUCTION` non navigabile, player,
      mixer a cinque layer e `About the sound`. Nessun overlay Fast Refresh;
      mixer con stati editoriali `READY`, senza `STEM`/`BINAURAL`/`NOISE`.

## Completato e verificato localmente

- [x] Brief, istruzioni locali e perimetro letti.
- [x] Audit di host, toolchain, repository, remote e file esistenti.
- [x] Repository Git locale inizializzato; remote canonico `https://github.com/robertfultonstudio/App-Relax.git` verificato e configurato; branch di milestone `codex/deep-sleep-432-mvp`; commit locale autorizzato; nessun push.
- [x] Documentazione base e decision log.
- [x] Expo SDK 57 / React Native 0.86.2 / Expo Router / TypeScript strict.
- [x] Home, quattro categorie, lista Sleep, player, Settings e Legal.
- [x] Preset unico `Deep Sleep 432`, tre stem reali di `AUDIO TEST PACK 01`, binaural e brown noise generati; i placeholder restano soltanto fixture di test.
- [x] Controller idempotente, timer assoluto, stop sorgenti sul clock audio, fade, mute/gain, persistenza, interruzioni serializzate, focus e cleanup notification.
- [x] Profili EAS separati per development Android/iOS e preview Android autonoma, identificativo provvisorio `com.robertfultonstudio.apprelax`, config plugin e archivio `.easignore` validati offline.
- [x] Dipendenze allineate e peer dependency verdi.
- [x] Lint, TypeScript, 9 suite/37 test (audio 26/26), validatori audio/config/asset safety, policy audit dipendenze ed Expo Doctor 20/20 verdi.
- [x] Prebuild isolato `--no-install`: iOS `UIBackgroundModes=audio`; Android permessi, foreground service e `mediaPlayback` presenti.
- [x] Account Expo personale `robertfultonstudio`, organizzazione `robert-fulton-studio` e progetto `@robert-fulton-studio/app-relax` creati tramite Google; linking verificato dalla CLI con project ID `e1d77255-66f4-45c1-b1fa-c503a088b30f`.
- [x] Piano EAS Free verificato sull'organizzazione: quota Android `0/15` prima e `1/15` dopo la build; nessun add-on, overage o costo.
- [x] Archivio Android no-VCS ispezionato e validato: 49 file / 6.143.075 byte, SHA-256 manifest `4c8769a5608b328a45c0ac55be4e8a84a6d835769dc8149866366843cbef8fd4`; nessun Git metadata, path locale, segreto, symlink, docs/test/tooling o flusso parallelo; esattamente tre WAV placeholder.
- [x] EAS Android `development-android` completata: build `73cd8dfc-4692-4d85-84e7-a3be7b0d3ed7`, SDK 57, fingerprint `0d061b3ea48ae2044f80a75a232326e3cf6eee7b`, stato `FINISHED` il 10 agosto 2026 alle 21:00:58 UTC.
- [x] APK scaricato in `dist/eas/` e verificato: 299.803.135 byte, SHA-256 `d54a5333b40574baeb6560879a743ad1722619df6f6c676669e62bf7feff4ae7`, ZIP integro, manifest, otto DEX e quattro ABI presenti; nessun path locale, file credenziale o token evidente rilevato. L'artefatto e ignorato da Git.
- [x] `AUDIO TEST PACK 01` ricevuto su istruzione esplicita: tre WAV PCM24 stereo 48 kHz da 180 secondi, hash e metriche registrati nel manifest; formato, clipping, DC e raccordi automatici verdi.
- [x] Preset e driver cablati ai tre stem reali distinti; placeholder non piu referenziati ed esclusi dagli archivi EAS.
- [x] Export Metro locali iOS e Android completati con esattamente i tre WAV reali; gli SHA-256 degli asset esportati coincidono con il manifest e nessun placeholder audio e incluso.
- [x] Android Emulator API 34 x86_64 avviato con l'APK EAS esistente e bundle corrente via Metro: Home -> Sleep -> player, UI `EARLY ACCESS`/`3 sleep layers`, cache di esattamente tre WAV con SHA-256 attesi, stato Ready e selezione timer 15 minuti verificati.
- [x] Un'esecuzione precedente dello stesso motore streaming ha raggiunto Play con AAudio attivo senza riprodurre il precedente OOM full-buffer; RSS osservato circa 602-605 MB in Ready e 631-695 MB in Play. Questa prova emulatore non certifica un telefono.
- [x] Il setup notification Android e stato rimosso dal percorso critico di Play: il rerun ha mostrato `RITUAL IN PROGRESS`, timer in decremento e AAudio stereo 48 kHz attivo. L'utente ha confermato di sentire il suono dagli altoparlanti del Mac.
- [x] EAS Android `preview-android` autonoma completata: build `c3a39414-d156-4373-810a-0011296b51f8`, SDK 57, fingerprint `92f6d62d3eb36db3d9eef3db223d6552c86af6f6`, stato `FINISHED` l'11 agosto 2026 alle 19:56:53 UTC; coda Free circa 87 minuti e compilazione circa 28 minuti.
- [x] APK preview scaricato in `dist/eas/`: 289.861.086 byte, SHA-256 `47a6603108f6aee3464f6a63ae00f0b0fdb287d375a391d1a9210043e6b0a2a6`, ZIP integro, 1.328 entry, bundle Android incorporato da 3.216.244 byte, quattro DEX e 27 librerie per ciascuna delle quattro ABI.
- [x] I tre WAV incorporati nell'APK coincidono byte per byte con gli SHA-256 del Test Pack; nessun placeholder, path locale, filename credenziale o pattern segreto mirato rilevato.
- [x] Smoke standalone su emulatore API 34 dopo cancellazione dei dati app e con Metro spento: Home, player `READY WHEN YOU ARE`, `RITUAL IN PROGRESS`, timer 28:55 e AAudio avviato. Screenshot verificabile in `dist/eas/`, ignorato da Git.
- [x] Piano EAS Free dopo la preview: Android `2/15`, iOS `0/15`, totale `2/30`, overage 0, add-on assenti e costo totale stimato 0 centesimi.

## Gate aperti

- [x] [F] Su dichiarazione diretta dell'utente, l'APK precedente è stato
      installato e avviato su un telefono Android reale e Play ha prodotto suono.
- [ ] [U] Modello telefono, versione Android e verifica strutturata di
      Home/controlli nel precedente test: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [ ] EAS cloud build iOS `development-ios`: richiede approvazione, account Apple Developer attivo, credenziali e registrazione iPhone.
- [ ] Smoke test audio su telefono reale; background, lock-screen, Bluetooth, interruzioni, latenza, batteria e qualita restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [x] I glitch percepiti nell'emulatore sono stati localizzati dopo l'HAL Android, nel ponte QEMU -> CoreAudio: AAudio e AudioFlinger hanno mantenuto frame e segnale continui con zero underrun, mentre CoreAudio ha riaperto due volte `AppleHDAEngineOutput` con gap di circa 22 ms e 11 ms. Il trigger esatto delle riaperture resta `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [ ] Presenza dei glitch e comportamento su telefono: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`; nessuna accettazione di qualita audio e implicita.
- [ ] Memoria/startup dei tre WAV reali su hardware ARM, loop percepito, bilanciamento e qualita: `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino al test su telefono.

## Limiti locali verificati

- [F] Node di sistema 18.20.8 è insufficiente; il target di progetto è Node
  22.23.1. I gate M5 sono stati eseguiti con Node 22.23.1 installato nello
  spazio utente tramite nvm e pnpm 11.16.0 tramite Corepack, senza
  installazioni globali o di sistema.
- [F] macOS 13.7.8 e Xcode 15.2 non soddisfano Expo SDK 57, che richiede Node 22.13.x e Xcode 26.4+.
- [F] Nessun runtime/device iOS Simulator e installato; CocoaPods e assente.
- [F] Sono installati, su autorizzazione esplicita, Android SDK Platform Tools 37.0.1, Emulator 37.1.11, system image API 34 x86_64 e AVD `AppRelax_API_34_x86_64`. Emulator, Metro e server ADB sono spenti a chiusura test.
- [F] Android Studio, un JDK generico, SDK Platform e Build Tools restano assenti. Questi limiti impediscono build native locali, non Metro, l'APK esistente o build EAS cloud.
- [F] Nessun acquisto hardware e necessario per produrre i binari cloud; almeno un telefono fisico resta necessario per il gate audio reale.
- [U] `pnpm audit --audit-level high` segnala due DoS transitive high in `image-size` senza release corretta pubblicata. Nessun input immagine remoto e presente; il validatore vieta i formati vulnerabili per estensione e signature. La policy allowlistata e stata riverificata prima dell'upload EAS e resta un residuo upstream accettato, non un gate verde del raw audit.

## Prossimo gate

Gli screenshot M5 sono approvati e l'utente ha autorizzato separatamente un
commit locale. Resta aperto l'ascolto mirato delle tre transizioni del piano
proposto. Adapter nativo dual-deck, download mobile, asset delivery e una futura
build restano milestone distinte. Bluetooth, background, lock-screen,
interruzioni, batteria e percorso nativo restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## Lavoro parallelo escluso

`output/` e `tmp/` contengono flussi paralleli comparsi durante il lavoro, inclusi strategia e render PDF. Non appartengono a questa milestone Codex: sono preservati e ignorati integralmente per staging/upload.
