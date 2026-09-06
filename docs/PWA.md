# PWA complementare

Stato: PWA privata aggiornata alla revisione A01-A14.5; catalogo invariato.
Robert riferisce ascolto positivo su iPhone sulla precedente revisione.
Nuovi comandi, latenza, installazione/offline e background restano da provare.

La riapertura completamente offline del sito privato NON ha superato la
prova nel browser integrato: usare online per il prossimo test iPhone.

## Aggiornamento corrente — barra compatta

[F] Su richiesta di Robert, versione 6 pubblicata: pulsanti Stop/Play/Pausa
con altezza minima 56, icona/testo su una riga, Stop color carta e posizione
fissa invariata. Audio, funzioni e stati di disponibilità non cambiano.
42 test player/PWA e 12 Worker PASS; export e validatore PASS. D-067.

[F] Deployment `appgdep_6a9cb60dc580819195a0a051ae883c9d` succeeded, env 2;
source isolata `7f9ef6c15103614a26ed83d9be15822dcbc6dec6`. Shell 111 file /
7.399.811 byte senza audio. Stesso accesso owner-only, nessun upload audio,
acquisto o commit canonico. Si attende il giudizio visivo sul telefono.

[F] Stop prima di chiudere la vecchia PWA; riaprire lo stesso link online e
verificare A01-A14.5 in Settings. Nessun takeover forzato durante l'ascolto.

## Versione 5 — crossfade e attesa del test umano

[F] Versione 5 pubblicata su richiesta di Robert: mantiene i comandi grandi
e la personalizzazione; integra D-064 (curve esatte dopo seek/resume,
composizione con il finale e riallineamento entrante limitato/cancellabile).
Nessun nuovo abbinamento musicale o audio. Identificativo Settings A01-A14.4.

[F] Deployment `appgdep_6a9ca8dca3388191981de52c1c293575` succeeded, env 2;
source isolata `b9e714a47884870b086c889cdba502146970aef9`. Shell 111 file /
7.420.963 byte senza audio, 68 HTML e 43 asset remoti verificati. Owner-only
riconfermato, anonimo 401; catalogo/Worker/AUDIO invariati. Nessun nuovo
servizio, acquisto o upload audio. Nessun commit o push del repository app.

[F] Lasciare questa revisione disponibile: il prossimo passo è il test di
Robert, poi la sua conferma prima del commit canonico. Non serve il Mac
acceso. Per evitare la vecchia shell: Stop, chiudere le finestre/PWA aperte,
riaprire il link online e verificare A01-A14.4 in Settings. Nessun takeover
forzato o reload durante una sessione in corso.

[U] Il controllo remoto della shell non certifica playback su iPhone.
La richiesta API senza identità al catalogo è respinta (401), come previsto
dal controllo Worker: non sostituisce un browser autenticato. Offline
privato, qualità, latenza e long-run restano da verificare. D-065 e
`dist/crossfade-publication.json` distinguono le prove.

## Versione 4 — comandi e personalizzazione

[F] Versione 4 pubblicata: Stop/Play/Pausa con simboli grandi, target 80 px e
posizione fissa sotto lo scroll; Home invariata. Personalize your session
mostra famiglia Rain/Ocean waves e ordine reale dei suoni. Le sessioni musica
più natura attendono nuovi abbinamenti approvati; nessuna traccia respinta
rientra. Stop durante avvio pendente esegue un solo arresto e attende la
conferma prima di Ready. La latenza sul telefono non è stata cronometrata.

[F] Deployment appgdep_6a9ca0c09b20819196171ae372b78a60 succeeded, env 2;
source isolata e3b3bae45dbcdf4673c90911df6db1aa090efdd1.
Shell 111 file / 7.419.834 byte; archivio 113 file / 7.557.120 byte; zero
audio. Stessi 37 oggetti AUDIO, accesso solo proprietario, nessun acquisto,
nuovo servizio o commit/push canonico. Suite complete 61/61, 382 test;
worker 12/12. Verifica remota: 68 HTML presenti e 43 asset byte-identici.
Il gate readiness distingue app shell pronta da file OPFS
verificato, senza forzare reload. Chiudere i vecchi client e riaprire online.

## Versione 3 — prove precedenti A01–A14.1

[F] Versione Sites 3 live; deployment
`appgdep_6a9c2e5f3f8081918d569ed24f7e2f57` riuscito, environment revision 2.
Source isolata `c0e50acd6157c83548443591e240b1358aa62e3e`;
nessun commit/push canonico. Shell: 111 file, 7.286.699 byte; zero audio.
Archivio pubblicato: 113 file, 7.413.760 byte. Accesso solo al proprietario,
nessun gruppo/ospite o nuovo servizio; catalogo AUDIO esistente riutilizzato.

[F] Controllo remoto della nuova shell: 68 HTML validi e 43 asset non HTML
byte-identici. Revisione visibile in Settings e metadata: `A01-A14.1`.
Start remoto Meditation conferma Play senza secondo tap, timer 19:57 → 18:20,
poi Stop. Non viene dichiarata approvazione sonora o prova iPhone.

[F] Download espliciti di singole opere o Rain starter (Quiet Weather,
Sheltered Rain, Soft Weather: 16.622.588 byte), OPFS privato, SHA-256 del
trasferimento e della rilettura, spazio, retry/cancel, rimozione reversibile.
La copia locale viene ricontrollata prima della riproduzione. Il browser può
rimuovere lo storage: non promettere conservazione indefinita o download in
background. Il piccolo starter permette ascolti singoli; non garantisce
offline una sessione adattiva che richiede altre opere non scaricate.

[F] La shell è precacheata integralmente; audio/Range non entrano in Cache
Storage. Gli aggiornamenti aspettano la chiusura dei vecchi client e non
forzano reload o takeover durante Play. Per vedere la revisione nuova,
fermarsi, chiudere le vecchie finestre dell'app e riaprire il link online.
Gli script export puliscono la cache di trasformazioni tra superfici per
impedire residui di Audio Test nella PWA.

[F] Prova locale reale: starter verificato, rete del browser disattivata,
pagina chiusa con about:blank e riaperta, Quiet Weather in Play da 10:00 a
09:18. Remove/Undo verificati. Non è un riavvio del browser o installazione
iPhone. Matrice e protocollo: `AUDIT_A01_A14.md`.

[F] Prova remota distinta: Rain starter scaricato e verificato, ma chiusura
pagina e riapertura della URL privata senza rete falliscono. [U] Causa e
supporto effettivo alla riapertura offline privata: `NON DETERMINATO —
EVIDENZA INSUFFICIENTE`. Il risultato locale non chiude questo gate.

Le prove Versione 2 sotto costituiscono la storia della prima pubblicazione,
non le dimensioni o il contratto offline correnti.

## Prova privata da iPhone remoto

[Apri la PWA privata](https://app-relax-private-review.robfulton.chatgpt.site).
Aprire dal browser iPhone, accedere con lo stesso account ChatGPT proprietario
del Site e premere Play. Non servono il Mac acceso, la stessa Wi-Fi, un account
Apple Developer o un'installazione Android. Occorre connessione per i file
non ancora scaricati e per il primo accesso; non viene scaricato tutto il
catalogo automaticamente.

[F] Il 5 settembre 2026 l'utente autorizza la pubblicazione privata della PWA
e dei 37 audio approvati, con arresto prima di qualsiasi costo (D-058).
Sites è incluso durante la beta nei piani ChatGPT idonei; rispettare le quote,
senza sottoscrizioni esterne, upgrade o acquisti.

[F] Site registrato: `appgprj_6a9bed84f78c81919575b1cbe1876cd1`, titolo
`App Relax — Private iPhone Review`. Accesso ricontrollato: owner, una sola
persona ammessa, nessun ospite o gruppo. Versione 2 live, deployment
`appgdep_6a9bf8cd69b481919471b35af980a511` riuscito, environment revision 2.
Riutilizzare questo id: non creare un altro Site.

[F] Il progetto di pubblicazione separato è `tmp/pwa-private-site/`, ignorato
da Git/EAS. Contiene lo snapshot identico della shell già esportata
(109 file, 7.282.973 byte), Worker, catalogo metadata, test, script operativi e
registrazione Sites con binding R2 `AUDIO`. Nessun audio o segreto nel codice.
Sorgente privata pubblicata `e519d75889430b033b1bb4f16f27bb5dcabd1013`;
nessun commit/push del repository canonico. Archivio 111 file/7.424.000 byte.

[F] I 37 audio sono stati caricati senza alterare gli originali sul Mac:
2.657.446.897 byte, massimo 345.312.044 byte;
17 superano 25 MiB. Manifest SHA-256:
`bba41e7db9c8debbe16b8c595a2db900ec0f7f8e82af6f45ad98540cc5f46591`.
Non inserire i file audio negli asset statici o nel Git del Site.

[F] Il precedente blocco DNS è superato dopo l'abilitazione della rete.
Completati source push nel solo repository Sites, packaging, versione salvata,
deployment privato e import di tutti i 37 audio. HEAD, SHA-256, dimensioni e
primi/ultimi 16 byte remoti verificati su ciascun file. Rimosse chiave e
scadenza import, nuova configurazione pubblicata: la vecchia chiave non
autorizza più richieste (401). Anche Home/catalogo anonimi ricevono 401.

[F] Controlli locali Worker: 12/12. Audit dipendenze Site: zero vulnerabilità.
Controlli remoti: 109/109 file della shell, di cui 67 route app più fallback
offline e 41 asset non HTML byte-identici. Sites aggiunge il proprio bridge
HTML; non dichiarare identità byte per le pagine HTML.

[F] Play verificato nel browser Codex con Low Rain e Misted Garden, timer in
avanzamento. Il primo Play Misted Garden è stato interrotto da una nuova
richiesta di caricamento; dopo ricarica completa è riuscito (30:00 → 29:34) ed
è stato fermato. L'ascolto dei 37 file e l'installazione sul vero iPhone restano
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

Per una futura pubblicazione: riusare Site e audience owner-only, trasferire
l'esatto stato sorgente e confezionare quello stesso commit; salvare prima la
versione, quindi pubblicarla privatamente. Nessun pagamento o upgrade
automatico. Non riaprire l'import senza una necessità e un perimetro approvati.

L'avvio dal Finder e `localhost` sono soltanto controlli sul Mac: non sono
la consegna richiesta dall'utente remoto. Nessuna azione sul Mac viene
presentata come prova PWA già disponibile sul telefono.

### Contratto R2 implementato e verificato

- [F] Il binding Workers accetta `put(key, stream, {sha256, onlyIf})`;
  `If-None-Match: *` consente inserimento atomico soltanto se assente. Il digest
  deve essere verificato da R2, non soltanto scritto come custom metadata.
- [F] Il limite del corpo HTTP resta distinto dalla memoria: il file massimo
  non entra in una richiesta da 100 MB. Usare multipart ufficiale con parti da
  64 MiB verso chiave temporanea, poi `get(temp)` e `put(final, body, {sha256,
onlyIf})` streaming per integrità e pubblicazione atomica. Verificare il
  risultato prima di rimuovere esclusivamente la copia temporanea creata dalla
  prova. Gli ETag multipart non sono il SHA-256 dell'intero file.
- [F] Il delivery deve usare `head` per HEAD e `get` con Range per GET,
  restituendo lo stream, 206/Content-Range e Content-Length dell'intervallo;
  Range non soddisfacibile -> 416. Mai `arrayBuffer()` dell'audio completo.
- [F] Il Worker verifica identità di piattaforma, allowlist e integrità degli
  oggetti prima dello streaming. L'import è idempotente e chiuso a consegna.
  Gli asset statici sono serviti da Sites prima del Worker: il suo gate
  `review-ready` vale per il fallback Worker, non blocca globalmente la Home.

Riferimenti tecnici:
[R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/),
[multipart Workers](https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/),
[limiti Workers](https://developers.cloudflare.com/workers/platform/limits/).

Fonti: [Sites](https://learn.chatgpt.com/docs/sites),
[costi Sites](https://learn.chatgpt.com/docs/pricing#how-much-does-sites-cost),
[permessi](https://learn.chatgpt.com/docs/sandboxing).

## Scopo

[F] La PWA riusa la superficie consumer di App Relax per predisporre una
preview installabile dal browser anche su iPhone. Non sostituisce l'app nativa:
background audio affidabile, lock screen, Bluetooth, batteria e comportamento
su telefono reale restano gate nativi separati.

[F] La radice Router dedicata è `src/app-pwa`. Include Home, Yoga,
Soundscapes, i sei outcome, le sessioni adattive, i player delle opere,
Settings e Legal. Esclude Workbench QA, `AUDIO TEST / TEST ONLY`, preset
tecnici e route legacy.

## Contratto audio

[F] L'export PWA contiene zero WAV/FLAC e non contiene
`public/audio-catalog/`. Il catalogo locale da circa 2,6 GiB non viene quindi
copiato nella shell, in Git, in EAS o in un pacchetto da installare.

[F] La PWA genera player statici predisposti soltanto per:

- 37 opere approvate disponibili nella delivery same-origin privata;
- 8 noise generator implementati nel browser;
- totale: 45 route player consumer predisposte.

[F] `Soft Air`, `Moon Drone` e `Deep River` non hanno una route PWA
riproducibile. `Eclypsis` / `Eclipse Veil` e `Nirvana Waves` / `Stillwater
Halo` restano esclusi per decisione dell'utente.

[F] In produzione i file devono essere esposti dallo stesso origin della PWA
nel percorso `/audio-catalog/<nome-file>`. Il server deve:

- usare HTTPS;
- conservare nomi e byte previsti dal catalogo;
- dichiarare il media type corretto, incluso `audio/flac` per FLAC;
- supportare richieste `Range` e risposte `206 Partial Content`;
- non richiedere credenziali o redirect incompatibili con un elemento audio.

[F] Il service worker corrente precachea tutte le risorse della shell con una
revisione verificabile. Audio, `Range`, WAV, FLAC e `/audio-catalog/` bypassano
Cache Storage. Il resolver preferisce una lease OPFS verificata, altrimenti
usa la delivery same-origin online. L'offline è selettivo ed esplicito;
supporto e conservazione sul vero iPhone restano da collaudare.

## Esecuzione locale

Sul Mac, aprire con doppio clic `Avvia PWA.command` nel repository e tenere
aperta la finestra Terminale. Quando compare `PWA pronta`, aprire
`http://localhost:8095/` nel browser Codex. Per spegnere usare `Ctrl+C` nella
finestra Terminale. Il comando usa Node 22.23.1 già installato tramite nvm;
non avvia installazioni, Metro o altri browser.

Non aprire `dist/m5-pwa/index.html` direttamente: la PWA usa URL dalla radice
del server e il protocollo `file://` non risolve app, audio e service worker.

Da terminale, con Node 22.23.1 e pnpm 11.16.0:

```bash
pnpm web:pwa
```

Il launcher:

- serve l'export `dist/m5-pwa` con un singolo processo Node su loopback;
- risolve le URL pulite delle pagine, incluse le route player;
- serve soltanto i 37 audio elencati nel manifest locale, dalla posizione
  originale, con stream da 64 KiB e supporto GET/HEAD/Range 206;
- usa MIME espliciti `audio/wav` e `audio/flac`, e 404 per gli audio assenti;
- non copia audio, non crea symlink e non esegue compilazioni all'apertura;
- rifiuta host esterni, scritture, traversal e file non autorizzati.

L'export deve già esistere. Dopo modifiche alla UI o al motore occorre
rigenerarlo con `pnpm export:web:pwa`; l'avvio statico non usa Fast Refresh.

Per indicare una porta diversa:

```bash
pnpm web:pwa -- --port 8095
```

Questa preview `localhost` è un controllo Web sul Mac. Non prova
installabilità o resa sonora su iPhone.

[F] `pnpm pwa:check-local` verifica export, 37 file e dimensioni senza aprire
porte. `pnpm pwa:test-server` esegue 12 prove sul gestore HTTP, inclusi HEAD e
intervalli iniziali/finali byte-identici per ogni file reale. Sono prove del
gestore con richieste simulate, non di rete o decoder.

[F] Nella precedente sessione con rete/bind limitati, il loopback falliva con
`EPERM`. È una prova storica, non lo stato dell'hosting remoto corrente.
Il processo locale non va dichiarato acceso prima del messaggio `PWA pronta`
emesso dopo un bind riuscito; non è necessario per il link privato HTTPS.

## Export e validazione

```bash
pnpm export:web:pwa
pnpm pwa:validate
```

Il validatore controlla manifest, icone e hash, registrazione del service
worker, route concrete, confini consumer, assenza di audio e dimensioni della
shell.

## Requisiti di hosting

[F] L'artefatto statico è `dist/m5-pwa/` e deve essere pubblicato alla radice
di un origin HTTPS dedicato. Manifest, scope e service worker usano `/`.

[F] L'host deve risolvere le URL pulite alle pagine `.html` esportate, per
esempio `/outcome/meditation` verso `/outcome/meditation.html`, senza far
passare le richieste `/audio-catalog/` attraverso una fallback HTML.

[U] Hosting effettivo, certificato del deployment, delivery dei 2,6 GiB,
cache CDN e prova su iPhone sono `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
La prova privata è autorizzata; non sono autorizzati costi o upgrade.

## Installazione su iPhone

Dopo una futura pubblicazione HTTPS, aprire l'URL in Safari, usare
`Altro → Condividi → Aggiungi alla schermata Home`, attivare `Apri come app web`
e scegliere `Aggiungi`. Il primo Play richiede un gesto esplicito dell'utente.
La compatibilità audio effettiva di ogni opera e la riapertura offline completa
devono essere verificate sul telefono; l'export statico non le dimostra.

Riferimenti ufficiali:

- [Apple — Trasformare un sito web in un'app su iPhone](https://support.apple.com/it-it/guide/iphone/iphea86e5236/ios)
- [MDN — Requisiti di installabilità PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [WebKit — Le chiamate Play devono nascere dal gesto dell'utente](https://webkit.org/blog/6784/new-video-policies-for-ios/)
