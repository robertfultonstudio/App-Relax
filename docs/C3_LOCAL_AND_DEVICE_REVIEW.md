# C3 — prove locali e casi pronti per il telefono

14 settembre 2026. Segue C2 accettata nel solo perimetro locale. Root unico
writer; supporto read-only per estrazione e revisione dell'oracolo. Nessun
audio, UI, motore, dipendenza, build, pubblicazione o commit aggiunto in C3.
L'Obiettivo generale PWA non viene sostituito né dichiarato completato.

## Esito per ID

| ID   | Esito delimitato                                                  | Prova disponibile                                                                            | Minimo gate residuo                                                                                        |
| ---- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| AG05 | Preparazione corretta e verificata; prova fisica bloccata         | Inventario Maestro senza target mobile, casi sotto, regressione nativa automatica conservata | Android realmente collegato/autorizzato con APK identificata; lock, interruzioni, Bluetooth e durata lunga |
| AG06 | Bloccato per iOS nativo; casi predisposti                         | Stessa matrice, separazione esplicita PWA/native                                             | Adapter e build iOS autorizzati, poi iPhone; non sostituibili da questa PWA                                |
| AG07 | Oracolo tecnico corretto e verificato; ascolto aperto             | Seed fisso, quattro durate, identità WAV/FLAC, frame e associazioni dei marker               | Ascolto umano dei join/loop identificati, senza presumere compatibilità musicale                           |
| AG08 | Inventario e conteggi corretti e verificati; percezione aperta    | Undici registrazioni naturali brevi, frame/hash e conteggi di ripetizione                    | Annotazione di eventi ripetuti/fatica/glitch all'ascolto; nessuna modifica automatica dei master           |
| AG09 | Verifiche desktop circoscritte superate; assistive fisiche aperte | Screenshot 390/320, tastiera, bersagli, regressioni contrasto e Reduce Motion                | VoiceOver/TalkBack e ingrandimento testo reale sul dispositivo; pinch non prova reflow                     |
| AG18 | Seek locale misurato; tap→suono fisico aperto                     | Drag, loop marker e primo/ripetuto salto nella tab locale                                    | Misure separate di avvio udibile freddo/caldo e seek su telefono/rete noti                                 |

[U] Tutti i gate fisici/sonori indicati restano **NON DETERMINATO — EVIDENZA
INSUFFICIENTE**. Non si attende il telefono per consegnare questa preparazione.

## Identità del candidato e delle prove

[F] Base Git `53b506b8bc65284dff4c66eb0c53d60893f83c40`, branch
`codex/quiet-by-design-m2`, cambi successivi non committati e index vuoto.
Browser locale: `PLAYER-REVIEW.28-C2-LOCAL`, artefatto `dist/c2-pwa`, entry
`entry-f86f98e1b7f97a0cf269b1b1e3c93600.js`. Server statico solo loopback,
catalogo lossless esistente read-only. Non un development client né una APK.

[F] La prima apertura su localhost:8096 ha mostrato un vecchio bundle
`entry-c56213bfbae64376b501347b765fe4cb.js`, vecchio copy e un errore React418
al reload. Prova scartata come evidenza del candidato; conservati gli screenshot
01/02 per tracciabilità. Senza cancellare cache/preferenze/audio, l'indirizzo
separato 127.0.0.1:8096 ha caricato il bundle corretto. Nelle osservazioni
successive non sono comparsi errori riferiti al bundle corrente. Questo non
riapre né certifica la policy online-only del diverso hostname privato.

[F] Prove visive realmente ispezionate, tutte in `dist/c3-evidence/`:

- `03-current-home-390.png`: Home corrente, sei azioni, titoli musicali assenti.
- `04-timeline-drag.png`: barra sotto le otto micro-sequenze, linea allineata,
  posizione 44:43.60, focus visibile.
- `05-timeline-pinch-200.png`: scala visual viewport 2, ampiezza visibile195.
  È pinch/ingrandimento: **non** prova reflow, pan o accesso a ogni comando.
- `06-player-320.png`: comandi disposti su più righe, nessun overflow orizzontale
  del documento (scrollWidth320); target misurati tutti almeno44×44.
- `02-home-keyboard-focus.png`: focus Settings visibile nella copia precedente;
  non usato come prova del nuovo copy. Il focus slider corrente è nello scatto04.

[F] A390: documento390px, slider346×48, Play206.5625×52 e Stop135.4375×52.
Nessun target sotto44×44 tra button/radio/link/input nel player esaminato,
anche a320. Non significa che ogni schermata o tecnologia assistiva sia validata.
Contrasto delle coppie del tema e policy Reduce Motion coperti dai test
esistenti. Il controllo emulato reduce era attivo e poi ripristinato;
non è una prova di cadenza/focus con VoiceOver o TalkBack.

## AG07 — oracolo Hatha ripetibile

[F] `tests/fixtures/c3-hatha-review.json` è un oracolo tecnico congelato,
seed `C3-20260914`, sample rate48000. Non è materiale consumer o approvazione.
Contiene titoli, filename/SHA WAV sorgente **distinti** dai filename/SHA/byte
FLAC di delivery, più segmenti, join con fromId/toId e loop con workId/index.
Il test collega queste identità ai manifest Hatha, native e indici PWA.
I master non sono stati ricalcolati o modificati. I byte fisici del kit sono
stati verificati nel preflight C2; gli assert C3 verificano i manifest correnti.

| Durata | Ordine tecnico          | Join | Loop musicali interni                                   |
| ------ | ----------------------- | ---: | ------------------------------------------------------- |
| 30     | 02→04→05→08             |    3 | Nessuno                                                 |
| 45     | 02→03→04→05→07→08       |    5 | Nessuno                                                 |
| 60     | 01→02→03→04→05→06→07→08 |    7 | Nessuno                                                 |
| 90     | 01→02→03→04→05→06→07→08 |    7 | 03 a79011428 frame (27:26.07); 05 a180738856 (62:45.39) |

[F] Le durate totali sono esatte; l'ultimo frame è durata×60×48000.
Tutti i join sono equal-power; fadeIn/fadeOut3s, solo ultimo segmento con
finalEnvelope3s. Fonte completa entry0→frameCount. I numeri in UI sono
arrotondati ai centesimi; i frame nel fixture sono l'autorità. Il join iniziale
90m è 16933714→22356000, non un salto casuale. La preparazione mantiene gli
stati source-file/extended-loop review-only e listening review required.

Procedura breve per ogni durata, senza ascoltare ripetutamente l'intera sessione:

1. Identificare versione, seed/piano, file di delivery e hash; annotare dispositivo,
   OS, uscita audio e volume. Se il seed runtime differisce, prima confrontare
   l'ordine/frame visibili; non attribuire automaticamente l'oracolo a quel piano.
2. Per ogni join usare Preview30s prima, verificare inizio/fine esatti;
   ascoltare entrante, uscente, entrambe e uscire dal loop QA senza salto.
3. Per90m usare i due Preview loop15s prima. Per ogni singolo file il confine
   autonomo è frameCount→0, separato dai cambi tra opere.
4. Annotare clic, gap, dissonanza, inviluppo e carico percepito come esiti umani,
   non dedurli dal controllo frame. Nessun editing audio autorizzato da un FAIL.

## AG08 — file naturali brevi

[F] Nel fixture anche dieci Rain≤45s e Night Birds33.680104s non classificato,
con delivery/hash/frame/provenienza separati. Silver Canopy45.5s non rientra nel
filtro. Nessuna nuova assegnazione a Rain/Ocean di materiale non classificato.
Confini attraversati prima della fine = floor((sessionFrames−1)/fileFrames):

| Registrazione            | Confini20m | Confini90m |
| ------------------------ | ---------: | ---------: |
| Soft Weather             |         39 |        177 |
| Deep Rain                |         59 |        269 |
| Fine Rain                |         27 |        122 |
| Misted Garden            |         26 |        119 |
| Quiet Weather            |         58 |        263 |
| Rain Veil                |         27 |        122 |
| Sheltered Rain           |         54 |        245 |
| Distant Shower           |         27 |        125 |
| Low Rain                 |         79 |        359 |
| Rain Receding            |         49 |        224 |
| Night Birds — local-only |         35 |        160 |

[U] Conteggi non equivalgono a monotonia o glitch. Per la prova: prima singolo
loop con evento riconoscibile annotato al secondo esatto; poi ascolto continuo
e registrazione delle ricorrenze percepite e della fatica. Tenere distinti:
boundary tecnico, evento naturale ricorrente, passaggio tra registrazioni.
Night Birds resta fuori dall'hosting e dagli automatismi Rain/Ocean; nessun
luogo/specie/orario inferito.

## AG18 — misure locali, non latenza percepita su telefono

[F] Campioni UI del medesimo browser/artefatto su disco locale:

| Azione                                | Seek riportato | Limite della misura                                |
| ------------------------------------- | -------------: | -------------------------------------------------- |
| Tastiera sulla barra, posizione15.40s |           14ms | Richiesta già calda; non primo avvio               |
| Drag a44:43.60                        |           69ms | Un range letto; non rete mobile                    |
| Loop3.1 a27:26.07                     |           71ms | Due hit memoria; non cold                          |
| Primo salto osservato al join05:52.79 |           95ms | 3 tentativi HTTP/1 hit; stato misto, non cold puro |
| Ritorno allo stesso join dopo Back30  |           11ms | Nessuna nuova apertura/lettura                     |

[F] Linea e barra avanzano insieme in Play: slider2683.8→2700.2s in16.359s
di orologio osservato, linea49.7006%→50.0036%. È un controllo di coerenza
con risoluzione UI, non una misura di FPS/perdita frame. Stop riporta90:00,
Ready e posizione0. Click Play restituito in49ms: **non** viene usato come
tap→suono; lo stato Playing non prova l'istante udibile. Nessun p95 dedotto
da questi pochi campioni. Aprire/leggere/decodificare possono sovrapporsi:
non sommare quei tempi come ritardi consecutivi.

Protocollo fisico da registrare in `C3_DEVICE_TEST_REGISTER.csv`:

- Freddo: prima sorgente non ancora aperta nel processo, cache nota e descritta;
  non cancellare dati del telefono per simulare cold senza autorizzazione.
- Caldo: stessa sorgente e punto, ripetuto; registrare almeno10 tentativi per
  condizione prima di usare mediana; indicare sempre n e non stimare p95 affidabile
  da una piccola serie. Separare tap→stato, tap→suono, rilascio→seek pronto.
- Annotare rete/telefono/OS/uscita e cancellazioni. Stop durante caricamento deve
  annullare l'intenzione senza avviare audio dopo il ritorno Ready.
- Nessun obiettivo di latenza quasi nulla è dichiarato raggiunto su telefono.

## AG05/06/09 — minimo run sul dispositivo disponibile

[F] Aggiornamento D-112,14 settembre: per il prossimo test fisico usare
APK1.0.4/code5, hash e consegna in `ANDROID_APK_D112.md`. Contiene C1/C2;
audit e smoke su AVD superati. I riferimenti1.0.3 del paragrafo seguente
descrivono la disponibilità storica al momento di C3, non la consegna corrente.

Usare l'APK già consegnata1.0.3/code4/SHA56c64c… solo per ciò che contiene:
non certifica C2 locale. Per C2 nativa occorrerà prima una build autorizzata.
Usare `ANDROID_CONSUMER_OFFLINE_KIT.md`, `ANDROID_APK_D103_PREFLIGHT.md`
e la matrice/il registro C3 di questo documento. Il runbook
`runbooks/ANDROID_PHYSICAL_DEVICE.md` è storico M3/DevClient e non è una
checklist per la standalone1.0.3/4. Non creare un emulatore come sostituto.
Per iOS tenere separate PWA e app nativa ancora da autorizzare.

1. Identità APK/catalogo, Start/Pause/Resume/Stop, volume principale/ambiente,
   Rain/Ocean e timer; nessuna deduzione del percorso audio dal solo stato UI.
2. Background e lock5min, ritorno senza nuovo avvio; chiamata/interruzione,
   ripresa controllata e disconnessione cuffie/Bluetooth senza picchi inattesi.
3. Un long-run90m per piattaforma su alimentazione/stato batteria annotati:
   timestamp iniziale/finale, eventuali gap/interruzioni, fine una sola volta,
   consumo e temperatura osservati. Questa prova non è stata eseguita ora.
4. TalkBack/VoiceOver: nomi/ordine/focus dei controlli, Play/Pause/Stop e slider,
   modifica valore annunciata, disabled/errori. Testo ingrandito200%, pan/reflow,
   focus non nascosto dalla barra fissa; preferenza Reduce Motion reale.

## Verifiche e arresto

[F] Cinque nuovi casi passati; suite consolidata748/748 in100 suite,
297 test audio preesistenti inclusi. Lint/typecheck PASS. Dopo la revisione
dell'oracolo sono stati aggiunti i riferimenti di delivery e le associazioni
dei marker: solo i cinque casi interessati vengono rieseguiti, senza un altro
ciclo completo. Dettagli raw: `dist/c3-jest-final.json` e receipt mirato.
Nessuna modifica app dopo gli export C2: non si rigenerano bundle identici.

[F] Verifica finale dopo gli ultimi assert: typecheck e lint mirato PASS,
asset safety559 file PASS, scansione firme credenziali480 testi senza riscontri,
diff whitespace PASS. La scansione per firme non certifica assenza universale
di segreti. Stato complessivo95 percorsi non committati, inclusi i cambi
preesistenti; nessun percorso staged. I tre file route marcati D sono stati
trasferiti nella radice QA durante C2, non sono perdita del motore tecnico.

[F] Audio fermato via Stop, tab locale3 chiusa; unica tab utente online1
preservata. Override viewport/zoom/Reduce Motion ripristinati. Server8096
terminato ordinatamente e porta non più in ascolto; nessun emulatore/Metro
avviato. C4 resta nella task Work; nessun file Strategy incorporato.

Il registro dispositivo ha solo l'intestazione: **nessuna riga equivale a nessuna
prova eseguita**, non a zero difetti. Hash finali e elenco file in
`dist/c3-evidence/artifacts.json`. Stop alla consegna locale; gate umano e
autorizzazioni esterne restano distinti.
