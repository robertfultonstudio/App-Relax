# Lettore FLAC indicizzato e clock — integrazione locale

13 settembre 2026. [F] Questa modifica NON è pubblicata: online rimane
PLAYER-REVIEW.9. Nessun upload audio, master modificato, dipendenza aggiunta
all'app, commit o build nativa/cloud.

## Implementazione e prove

- [F] `FlacWindowReader` fornisce PCM24 canonico al medesimo scheduler dei WAV.
  Indici contigui verificati, formato native FLAC stereo/48 kHz/24 bit,
  probe limitata ai metadata, finestre fino a 8 secondi / 4 MiB compressi.
  Decodifica serializzata per lettore; reset/cambio sorgente invalida il lavoro
  precedente. Nessuna decodifica dell'intero file nel browser.
- [F] Il decoder e il resolver dell'indice sono iniettati. NON esiste ancora
  un adapter di produzione: la prova browser impiega il worker ESM del laboratorio
  D-078, senza distribuirne dipendenze nella PWA. Il resolver finale deve
  autenticare gli indici; i controlli di struttura/header non sostituiscono SHA-256.
- [F] Lo scheduler ora cancella le richieste dei seek superati, chiude lo stato
  seeking su Pause, deduplica le finestre concorrenti e precarica quella seguente
  quando rimangono meno di due secondi prima di un confine/EOF.
- [F] Avvio e ripresa PCM hanno un anchor esplicito condiviso con la sessione,
  senza sommare un nuovo ritardo a ogni ripresa. I timer usano il clock effettivo.
  Il bus resta silenzioso durante la preparazione; l'avanzamento preliminare dei
  media HTML viene scartato prima dell'avvio. Test con 200 ms di preparazione,
  tre riprese e mock HTML che avanza realmente insieme al tempo simulato.
- [F] Browser integrato, vero `OfflineAudioContext`: Rain 005, Sea 005 e
  Hatha 01; 576.000 campioni confrontati per caso, errore massimo ZERO.
  I sei secondi renderizzati attraversano EOF/inizio a 0,31 s e una giunzione
  fra finestre a 2,31 s. Le finestre di riferimento sono verificate contro gli
  hash della decodifica completa D-078, non dedotte dall'uscita dello scheduler.
  Report: `dist/flac-window-spike/browser-clock-report.json`.
- [F] Run finale: lint, typecheck e 73 suite / 516 test PASS. Gli otto render
  WAV di regressione sono PASS (errore massimo 1,82e-12). Test specifico:
  Pausa durante preparazione PCM annulla l'avvio; nessun Play tardivo.
- [F] Export locale finale in `dist/flac-clock-pwa`: 122 file / 7.764.933 byte,
  validatore PWA PASS; 120 file / 7.752.569 byte nel precache (esclude worker
  e manifest precache), zero audio, revisione precache
  `13458047569421c5af010793393518596491dfe52c42500330a4024460649816`.
  Non contiene ancora il decoder FLAC attivato e non è stato pubblicato.
- [F] Asset safety/config/boundary PASS; scan di 12 file di implementazione
  e diagnostica senza pattern di segreti o path RF. Nessun file staged.
  Il validatore archivio inizialmente invocato senza argomento restituisce
  correttamente Usage. Ripetuto sull'archivio storico `dist/hatha-archive-simulation`:
  PASS 154 file / 160.006.936 byte, esattamente tre WAV ATP01. Non è un
  nuovo archivio del codice corrente né una build EAS.
- [F] Server HTTP: 13/13 test PASS, incluse risposte iniziali/finali identiche
  ai byte dei 45 file. Server diagnostici 8250/8252 terminati e schede chiuse;
  nessun emulatore avviato. Questi controlli non validano l'export su iPhone.

## Limiti che restano aperti

[U] Il lettore FLAC non è selezionato dal driver PWA e non sostituisce ancora
gli elementi HTML. Packaging/licenze, indici autenticati caricati a richiesta,
worker finale cancellabile e vero export minificato restano da completare.
La prova NRT attende il riempimento iniziale: non misura rete lenta, deadline
in tempo reale, RAM iPhone, background, interruzioni o batteria.

[U] L'anchor comune chiude l'accumulo di drift su avvio/ripresa PCM, non tutti
i casi di attivazione delle tracce successive: `activate` deve ancora usare
lo stesso contratto. Il percorso HTML legacy non garantisce allineamento al
campione; il test misto tollera esplicitamente i 60 ms dell'anchor futuro,
non li dichiara risolti. La pubblicazione è quindi rinviata.

[U] I lettori verificano Content-Range e lunghezza. Rimane da vincolare ogni
finestra alla stessa revisione HTTP forte (ETag/If-Range o contenuto immutabile
verificato); i file locali e remoti approvati non sono stati sostituiti.
I master potrebbero avere una propria discontinuità sonora: render identico
alla sorgente non equivale ad approvazione musicale del loop.

[U] NON DETERMINATO — EVIDENZA INSUFFICIENTE per ascolto e solidità finale
su iPhone. I residui dependency audit/Doctor D-069 restano distinti e invariati.

## Ripetizione della prova

```text
node scripts/verify-flac-browser.mjs <node_modules-isolato-D078> <derivati-D073>
```

Aprire `http://localhost:8252/clock` nel browser integrato e avviare il confronto.
Solo tre file ammessi, nessun output sugli speaker, report locale. Il server
rifiuta un report incompleto. Spegnerlo e chiudere le schede diagnostiche alla fine.
La routine di cleanup del laboratorio attende la liberazione dei worker:
non dimostra ancora la terminazione immediata del futuro worker di produzione.
