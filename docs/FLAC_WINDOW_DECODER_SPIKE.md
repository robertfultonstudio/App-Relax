# FLAC a finestre — prova locale, non integrazione PWA

Data: 13 settembre 2026. [F] PLAYER-REVIEW.9 rimane la versione pubblicata.
Nessun nuovo upload audio, dipendenza nel progetto, commit app o costo.

## Risultato dimostrato

- [F] 45 FLAC locali, 2.371.806.490 byte, verificati contro SHA-256 e byte
  dei manifest approvati: 24 file FLAC esistenti e 21 derivati D-073.
- [F] Decodifica completa Node: PCM24 ricostruito uguale al MD5 STREAMINFO
  su ciascuno dei 45 file; nessun frame saltato nell'indicizzazione.
- [F] 225 finestre deterministiche (cinque posizioni per file) coincidono
  con la rispettiva porzione del flusso PCM completo verificato. Le 105
  finestre delle 21 musiche coincidono anche col data chunk WAV canonico.
  Questo secondo confronto riguarda le finestre, non un nuovo confronto
  integrale di tutti i WAV; quello D-073 resta una prova distinta.
- [F] 4.500 alternanze ultimo/primo frame dopo reset nel decoder Node danno
  risultati ripetibili. Non sono 4.500 loop audio ascoltati o schedulati.
- [F] Browser integrato (user agent Chrome/152): worker ESM su Rain 005,
  Sea 005 e Hatha 01, 15/15 finestre con SHA-256 identico alla baseline.
  Quindici richieste HTTP 206, Range finiti, massimo 1.960.354 byte.
- [F] Nel run browser finale la fase slicing/decode worker/ricostruzione/hash
  arriva a 69,5 ms. Esclude rete, reset e avvio worker; NON è latenza Play.
  Il payload compresso NON è memoria RAM. Nessun dato di RAM iPhone ottenuto.
- [F] Gate server: falso report PASS incompleto rifiutato, GET audio senza
  Range e Range troppo grande rifiutati; rapporto valido rimane immutato.

## Decoder esaminato e due problemi da non ignorare

[F] `@wasm-audio-decoders/flac@0.2.11`, pubblicato il 27 agosto 2026,
installato SOLO nel laboratorio temporaneo con script di installazione
disabilitati. Audit del laboratorio: zero advisory noti riportati; non
cambia l'audit del progetto D-069. Il validatore verifica la versione esatta.
Dipendenze dirette: common 9.0.7 e codec-parser 2.5.0.

[F] Il wrapper C divide PCM24 per 8.388.607. Per confrontarlo col PCM signed
canonico bisogna recuperare `round(float * 8388607)`, poi eventualmente usare
la scala Web Audio `/ 8388608`. Il primo controllo a scala convenzionale è
fallito; il successivo confronto MD5 completo dimostra l'esatta ricostruzione
per i 45 file, non per qualsiasi formato immaginabile. Fonte primaria:
[wrapper FLAC ufficiale](https://raw.githubusercontent.com/eshaz/wasm-audio-decoders/main/src/flac/src/flac_decoder.c).

[F] La prima prova browser del bundle minificato distribuito fallisce perché
la proprietà attesa `errors` appare come `U`. Osservazione diretta della
pagina di prova, non dedotta dai report PASS ESM. SHA-256 del bundle esaminato:
`c7c5e35a1b633f0057e6d4e5f21c6c7fcfdaf521689ac1a51b393a2fe58e6f83`.
Nessuna tolleranza/alias della proprietà introdotta per far passare il test:
si è testato invece il sorgente ESM ufficiale, che conserva il contratto.
Un futuro bundle Metro minificato deve essere verificato separatamente.

[F] Il package e common dichiarano MIT; codec-parser dichiara
LGPL-3.0-or-later; libFLAC richiede i relativi avvisi di licenza. Non descrivere
il pacchetto come interamente MIT. Gestione delle licenze e packaging vanno
risolti prima di adottarlo/distribuirlo nell'app. Fonti:
[package](https://raw.githubusercontent.com/eshaz/wasm-audio-decoders/main/src/flac/package.json),
[codec-parser](https://raw.githubusercontent.com/eshaz/codec-parser/main/package.json),
[libFLAC](https://raw.githubusercontent.com/xiph/flac/master/COPYING.Xiph).

## Cosa questa prova NON dimostra

[F] Gli indici sono costruiti con una scansione completa locale preventiva;
i 45 JSON totalizzano 4.585.392 byte. Il browser riceve confini frame già
conosciuti. Non è un sistema runtime di ricerca degli offset e non va
incorporato indiscriminatamente nella shell iniziale. Le tre fixture non
hanno SEEKTABLE; un indice verificato separato è necessario per questo percorso.

[U] Restano da implementare/verificare: lettore a finestre nell'app,
trasporto dei metadati/index, cancellazione/reset concorrenti, cache e RAM
limitate, integrazione nel clock audio e precaricamento, bundle finale,
loop e giunzioni reali, iPhone, rete cellulare, interruzioni/background.
NON DETERMINATO — EVIDENZA INSUFFICIENTE. Ogg FLAC e formati diversi da native
FLAC stereo PCM24/48 kHz non sono coperti. Il futuro lettore deve rifiutarli
se non testati. La libreria non espone un'API seek pronta:
[API ufficiale](https://github.com/eshaz/wasm-audio-decoders/blob/main/src/flac/README.md),
[specifica FLAC](https://www.rfc-editor.org/rfc/rfc9639.html).

## Riproduzione e prossima integrazione

[F] Strumenti manuali di verifica, fuori dal codice consumer:

```text
node scripts/verify-flac-window-decoder.mjs <node_modules-isolato> <file.flac> <cartella-report> [file.wav-canonico]
node scripts/verify-flac-catalog-spike.mjs <node_modules-isolato> <cartella-derivati-D073> <cartella-report>
node scripts/verify-flac-browser.mjs <node_modules-isolato> <cartella-derivati-D073>
```

Il terzo serve esclusivamente `localhost:8252`; non avvia audio e va spento
con SIGTERM dopo il test. Report/indici in `dist/flac-window-spike/`, ignorati
da Git. Nessun byte audio è copiato o modificato.

[I] Sequenza necessaria: risolvere packaging/licenze → lettore worker a
finestre con indice verificato → integrarlo dietro il controller senza
modificare la UI → test del vero export e del clock audio → attivazione nella
PWA privata → ascolto iPhone. L'attuale fattibilità non autorizza a saltare
questi passaggi. Il passaggio delle 21 musiche ai nuovi file remoti resta
distinto dalla correzione dei FLAC naturali già presenti; nessun upload è stato
eseguito da questo laboratorio.
