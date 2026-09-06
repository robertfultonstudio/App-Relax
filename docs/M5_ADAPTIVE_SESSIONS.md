# M5 — Adaptive Sessions & QA Workbench

Data: 3 settembre 2026

## Risultato locale

[F] La shell consumer conserva il percorso più breve: bisogno o attività →
durata → Start. Le durate strutturali sono 10, 20, 30, 45, 60 e 90 minuti; ogni
outcome mostra soltanto il proprio subset in `src/content/sessionPolicies.ts`.
La personalizzazione resta facoltativa e chiusa all'apertura.

[F] `Sound only` e `Guided` sono contratti distinti. Guided mostra la futura
scelta voce soltanto dopo la selezione della modalità e resta `IN PRODUCTION`:
non esistono registrazioni, sintesi o placeholder vocali.

[F] `Play your last session` salva soltanto outcome, durata e modalità dopo uno
Start riuscito. La Home rilegge lo stato quando torna in primo piano e crea una
nuova variazione; il seed riproducibile appartiene soltanto al Workbench.

## Continuum

[F] `SessionWorkProfile` è separato da `ConsumerAudioWork` e contiene intenti,
famiglia estetica e armonica, energia iniziale/finale, densità, presenza
melodica, compatibilità voce, ruoli di fase, entry/exit, classe di transizione,
ending policy e disponibilità offline.

[I] I valori correnti sono dedotti dal catalogo e in parte dai filename. Sono
marcati `PROVISIONAL — CATALOG AND FILENAME INFERENCE`, esclusi dal planner per
default e abilitabili soltanto con l'opt-in della preview QA locale. Non sono
una revisione musicale.

[F] Il planner è puro e deterministico. Costruisce Arrival → Flow → Deepening →
Return, applica regole specifiche di fase e compatibilità ALL-OF, evita opera e
famiglia duplicate e riceve le ultime tre sessioni come finestra
anti-ripetizione. Se non trova quattro opere e tre passaggi compatibili,
restituisce un errore esplicito.

[F] Dopo l'esclusione di Eclypsis e la successiva eliminazione di Nirvana
Waves, non resta alcuna coppia musicale revisionata. Nessun sostituto viene
dedotto: le sessioni `Music + nature` sono visibili ma disabilitate come `IN
PRODUCTION`, i deep link musicali precedenti falliscono chiusi e le sessioni
naturali restano il percorso predefinito finché non viene approvata una nuova
relazione.

[F] La timeline usa frame interi a 48 kHz. Gli ingressi e le uscite provengono
dai marker del profilo. L'ID include input e timeline completi. Il crossfade
ambient predefinito è equal-power da 12 secondi; il bound peak considera il
massimo dell'intera curva e applica soltanto trim statico. Nessun limiter e
nessuna modifica ai master.

[I] Per i loop continui senza outro, una durata che non coincide con un'uscita
editoriale termina con un inviluppo controllato dichiarato. Se un profilo
richiede una chiusura editoriale e il target non la consente, il planner
fallisce. La qualità di ogni cambio resta un gate d'ascolto umano.

## Playback e QA

[F] La preview adattiva funziona soltanto su Web e in ambiente non-production.
Il default accetta `localhost`/`127.0.0.1`; il comando consumer esplicito per
iPhone ammette in development soltanto l'IPv4 LAN privata esatta rilevata dal
Mac, senza tunnel, e attende un tap Play diretto richiesto dai browser iOS. La
route non accetta seed o modalità tecniche nell'URL. Il player usa una sola
opera fuori dal passaggio e due deck soltanto durante il cambio; verifica in
anticipo che tutte le sorgenti siano decodificabili e segnala al controller
anche un errore futuro.

[F] Il Workbench è nella radice Router separata `src/app-qa`, con timeline,
marker, scrubber, cambio precedente/successivo, loop ±30/60 s,
outgoing/incoming/both, confronto A/B di durata e curva, metriche, regole, seed
salvabile e audit esatto degli intervalli. Non è linkato dal consumer e
`src/app-qa/` più `src/qa/` sono esclusi da `.easignore`.

[F] Per il gate umano autorizzato, `web:iphone:review` può esporre
temporaneamente questa radice su una LAN privata fidata, senza tunnel e senza
modificare gli export consumer. La route diretta è `/qa-workbench`; lo stesso
root conserva anche Home e player consumer. Il launcher forza `public` per
rendere disponibile il catalogo locale on-demand e non lo incorpora in alcun
artifact.

[U] Scheduling sample-accurate, due decoder FLAC, seek, background,
lock-screen, interruzioni, Bluetooth, batteria e qualità su Android/iOS sono
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`. `ReactNativeAudioDriver` rifiuta il
programma adattivo invece di fingere supporto.

## Offline

[F] Il primo manifest logico contiene 12 opere Water per 177.645.113 byte e
nessun URL. Ogni voce registra work ID, object key, byte, SHA-256 e media type.
I dati coincidono con catalogo e manifest M4.

[F] `OfflinePackageManager` modella spazio, retry, stato, recovery da
interruzione, verifica e rimozione. La sorgente scrive in uno staging streaming;
lo store binario deve verificare e promuovere atomicamente l'intero tentativo o
annullarlo. Uno stato persistito `available` viene riconciliato contro i file
committed reali. Le operazioni sul medesimo pacchetto sono serializzate.

[U] Source remota, autenticità del manifest, resume/range, adapter storage
nativo, lease durante playback e download reale non esistono. Il pannello
consumer dice quindi `IN PRODUCTION`. `public/audio-catalog/` è soltanto una
sorgente read-only della preview locale e i suoi 2.657.446.897 byte restano
fuori da Git/EAS.

## PWA complementare

[F] `src/app-pwa` riusa il percorso consumer con un driver Web a sorgenti
iniettate. La shell statica non contiene il catalogo né i tre WAV ATP01; sono
predisposti player per 37 opere approvate da richiedere on-demand dallo stesso
origin e otto noise generator implementati nel browser. Workbench, Audio Test
e route tecniche restano esclusi.

[F] La disponibilità PWA di produzione richiede il flag esplicito di delivery
same-origin e un secure context. Il service worker precachea un fallback
minimo, usa network-first per risorse non audio visitate e non intercetta audio
o richieste Range. Offline audio resta `IN PRODUCTION`.

[U] Export e validatori statici non provano decoder, seek, crossfade o
installazione su iPhone. Questi aspetti restano `NON DETERMINATO — EVIDENZA
INSUFFICIENTE` fino a hosting HTTPS e prova reale autorizzati. Il contratto
operativo completo è in `docs/PWA.md`.

## Gate

Eseguire in serie con Node 22.23.1 e pnpm 11.16.0:

```bash
pnpm install --frozen-lockfile
pnpm peers check
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:audio
pnpm audio:validate-placeholders
pnpm audio:validate-test-pack
pnpm audio:validate-consumer
pnpm audio:verify-lossless
pnpm assets:validate-safety
pnpm assets:validate-rituals
pnpm security:audit
pnpm config:validate
pnpm qa:validate-boundary
pnpm expo:doctor
pnpm exec expo install --check
```

Il comando senza argomenti verifica che non esista alcun FLAC starter consumer,
che Eclypsis sia assente dal registro e che la conversione PCM-identica resti
documentata soltanto nel report storico. La modalita completa resta disponibile con
`pnpm audio:verify-lossless -- <wav-dir> <flac-dir> <flac-binary>`.

Gli export Android, iOS e Web vanno eseguiti da una copia locale temporanea che
esclude `public/audio-catalog/`, quindi ispezionati. I due export Web devono
essere separati e verificati con `pnpm qa:validate-exports`.

Non eseguire EAS, build native/cloud, commit, push, PR o pubblicazione senza una
nuova autorizzazione esplicita.

## Evidenza di consolidamento

[F] Il 3 settembre 2026 i gate sono passati con Node 22.23.1 e pnpm 11.16.0:
33 suite / 131 test, audio 44/44, Expo Doctor 20/20, dipendenze Expo allineate e
validatori locali verdi. I quattro export isolati sono riusciti e il confronto
consumer/QA ha confermato il confine del Workbench.

[U] Non è stato generato un nuovo archivio sorgente EAS. Il validatore è pronto
e `.easignore` è stato verificato staticamente, ma `eas build:inspect` resta
fuori dal perimetro autorizzato. Gli export isolati non sostituiscono questa
prova: `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino a un gate EAS separato.

[F] La prova localhost ha verificato Start, timer, Pause/Play e audit accelerato
del piano. I cinque screenshot 390×844 sono in `dist/m5-screenshots/`.

[F] Il 3 settembre 2026 l'utente ha approvato esplicitamente i cinque
screenshot M5. L'approvazione riguarda la superficie visiva; non approva
automaticamente le transizioni, il runtime nativo o un commit.

[F] Dopo il gate visivo l'utente ha autorizzato separatamente un solo commit
locale M5. L'autorizzazione non comprende push, EAS, build o pubblicazione.

[U] Gli screenshot e il playback Web non approvano i passaggi musicali e non
provano il dual-deck nativo. L'ascolto umano delle transizioni e le prove su
telefono restano gate successivi.
