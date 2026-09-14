# PWA — loop individuali e continuità UI

13 settembre 2026 · PLAYER-REVIEW.18 · D-085/D-086.

## Richiesta e perimetro

[F] Robert vuole raggiungere le registrazioni separate per ascoltare il ritorno
fine→inizio che in precedenza aveva prodotto click/interruzione. Il test del
singolo file non viene sostituito da quello delle giunzioni della playlist.

[F] `/loop-review` è un inventario della sola PWA privata: 45 file, 8 Hatha,
13 altre musiche, 24 naturali. Accesso da Settings e da ogni pannello
Development review. Nessun titolo nuovo in Home. I generatori continui non
vengono presentati come file con EOF. Esclusioni editoriali invariate.

[F] Apertura esplicita di un test: Stop della sessione precedente confermato,
poi `/listen/<id>?review=1&isolated=1`; stesso player consumer, pannello aperto,
nessuna factory ambiente. Nessun autoplay. La copia offline verificata può
avere precedenza sul FLAC online: l'interfaccia lo dichiara, senza attribuire
al test una sorgente di rete che il resolver non abbia confermato.

## Protocollo di ascolto

1. Aprire una registrazione dall'inventario e premere Play una volta.
2. Pausa → Last 5 seconds → Play; anche Last 15 seconds resta disponibile.
3. Giudicare il ritorno naturale a 00:00, non il silenzio del riposizionamento.
4. Ripetere almeno due volte; annotare titolo, dispositivo e click, silenzio o
   salto di livello. Non modificare il master durante questa verifica.

[F] Il player prima lasciava fermo il PCM dopo un seek mentre era Playing:
`prepareAt` prepara ma non riavvia. Il driver ora riprende solo se prima era
Playing e la generazione è ancora valida; Pausa resta silenziosa. Stop può
interrompere un seek singolo bloccato; timeout 15 s e conferma tardiva rifiutata.
La posizione UI non somma più l'attesa di preparazione al punto richiesto.

[U] Il superamento del marker senza errore non approva la qualità sonora.
Ascolto iPhone, tutti i 45 raccordi, long-run, interruzioni e memoria low-end:
NON DETERMINATO — EVIDENZA INSUFFICIENTE. Nessun nuovo byte audio o master
modificato. La latenza fredda documentata in D-084 resta un gate distinto.

## Audit UI ricevuto da Work

Fonte letta integralmente: `Audit_UI_UX_MVP.md` del 13 settembre nella task
Strategia Work (`outputs/audit-uiux-mvp-2026-09-13`). Due P1 osservati su .17;
gli altri rilievi sono separati fra codice, test controllati e opportunità.

| ID     | Intervento locale                                                                                                                                                          | Verifica di chiusura                                                                                                                                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-01  | Stessa attività: Return/Resume conserva selezione e livelli, anche cambiando forma daily/Hatha/natura; nuova sessione esplicita. Nessun caricamento candidato sul ritorno. | Test single, musica+Rain, Hatha, forme incrociate e natura adattiva. Browser: Back a 19:33, Return e Pausa a 19:29; nessun reset a 20:00.                                    |
| UI-02  | Durata/natura sincronizzate alla query; Off esplicito; fallback route incompleta coerente con l'attiva anche per outcome non-primary. Nuova45 non nasconde Resume/Stop20.  | Test combinati player+barra, single/natura, parametri assenti e Pink Noise/Massage. Browser: candidata45 e precedente19:29 con Stop/Resume visibili.                         |
| UI-03  | Guardia sincrona/busy, una sola navigazione per Start di Ultima sessione; errore libera il comando.                                                                        | Promise sospesa, doppio tap, rigetto e retry con stessa selezione.                                                                                                           |
| UI-04  | Durate, suoni e link review bloccati durante Starting Hatha.                                                                                                               | Start sospeso, successo/annullamento, nessuna preparazione aggiuntiva.                                                                                                       |
| UI-05  | Tab HATHA distinta dalla tile YOGA; titoli player/barra descrivono il contesto, non un comando Start.                                                                      | Regressioni copy; comprensione umana resta da verificare.                                                                                                                    |
| UI-06  | Errori consumer brevi con recupero; factory natura intercettata nel singolo player, retry stessa scelta. Diagnostica nel pannello PWA.                                     | Errori controllati, Start disabilitato, nessun fallback né schermata vuota.                                                                                                  |
| UI-07  | Radio ambiente riusa la navigazione tastiera del selettore durata; frecce/Home/End, Space/Enter e focus coerenti, disabled rispettato.                                     | Test freccia/focus/Space/Enter/disabled. Prima prova browser ha rilevato Space non attivo: corretto nel gestore condiviso; replay finale Space su Ocean e Enter su Off PASS. |
| UI-08  | Copy native allineato attività→Play; informazioni non trasformate in toggle.                                                                                               | Regressioni Settings. Compattare ulteriormente l'ambiente è una valutazione visiva ancora aperta, non perdita dei controlli.                                                 |
| DOC-01 | DoD AGENTS allineata a D-074 e distinzione PWA/Hatha/native.                                                                                                               | Documento aggiornato, gate di release preservati.                                                                                                                            |

## Gate separati invariati

- G-02: delivery e adapter nativi; pool attuale non equivale a catalogo native pronto.
- G-03: iPhone/ascolto completo, background, Bluetooth, batteria e interruzioni.
- G-04: riapertura offline della shell distinta da file starter verificati.
- G-05: residui dipendenze/Doctor D-069 e informazioni release.
- G-06: owner-only non è distribuzione a partecipanti o prova di utilità autonoma.

## Esiti di consolidamento

[F] Prettier globale, lint e typecheck PASS; Jest 81 suite / 587 test PASS; audio dedicati 19
suite / 208 test PASS. Safety, config e QA/PWA boundary PASS. Export PWA
senza byte audio; validatore dello stato statico conservato: Loading sound
con Play e Stop disabilitati prima dell'idratazione della route isolata.

[F] Browser locale reale, viewport 390×844: Threshold of Breath supera due
EOF→zero (contatore 00:14 e 00:07, Playing); Tidal Breath supera EOF dopo seek
durante Playing (00:15). Seek pronti in 166/127/99 ms, clock lead ≤60 ms:
misure localhost, non iPhone né ascolto. Nessun errore console nel test Hatha.
HTTP: 50 richieste FLAC, tutte 206, massimo 1.837.873 byte per richiesta,
zero WAV, nessun download integrale. Rapporto locale in
`dist/audio-continuity-audit/review18-loop-requests.json`.

[F] Screenshot locali 390×844 in `dist/loop-review18-screenshots/`:
`01-individual-catalogue.png`, `02-individual-loop-controls.png`,
`03-return-active-session.png`, `04-timer-keeps-old-controls.png`.
Le immagini provano UI, non qualità sonora o comportamento iPhone.

[F] Replay P1 sull'export finale: Return a 19:54 senza riavvio; Pausa a 19:51,
poi candidata45 con Stop/Resume19:51 visibili. Screenshot 03/04 ricatturati.
Space seleziona Ocean, Enter seleziona Off, focus coerente. Nessun errore
console nel controllo finale. Resta valutazione umana dell'estetica/UI-08.

[F] Export: 184 file, 12.413.613 byte, zero byte audio; precache161 file,
8.333.025 byte. PWA/safety/config/boundary PASS. Worker privato17/17 PASS.
Scansione segreti/path locali sull'artefatto PWA e Worker: 145 file di testo,
zero corrispondenze alle regole chiavi/token/path del repository. Non equivale
a un audit esaustivo; residui dipendenze D-069 invariati, non rilanciati.

[F] Pubblicazione privata completata e controllata nel browser:
`https://app-relax-private-review.robfulton.chatgpt.site/loop-review`, .18,
45 tracce, Threshold isolata Ready con Play e controlli EOF presenti.
Accesso owner/custom, 1 account, 0 gruppi/esterni; nessun nuovo costo.
Sites versione29, ambiente6; deployment
`appgdep_6aa6a6ec56748191bfd97a805fc742ed` succeeded.
Commit solo del checkout di pubblicazione Sites:
`91694c5cc7e0d214c458bab69a9cd8d16872d3f1`;
versione `appgprj_6a9bed84f78c81919575b1cbe1876cd1~appgver_0d07913972e08191b622df11cb47a341`.
Screenshot online `05-private-player-ready.png`, `06-private-catalogue.png`.

[F] Checkout canonico ancora HEAD `6549f0117f2d7623fe20816cbf2c687385af6b8d`:
indice vuoto, 80 percorsi tracked modificati +60 voci untracked, inclusi i
77+53 ereditati. Nessun commit canonico, push GitHub, EAS o nuovo byte audio.
`git diff --check` PASS. I file Strategia restano esclusi/intatti.
Server locale8251 spento, tab locale chiusa, override viewport rimosso;
nessun emulatore o Metro attivo. La sola PWA privata resta aperta e silenziosa.
