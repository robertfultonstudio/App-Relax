# D-101 — APK consumer Android 1.0.2 / 3

13–14 settembre 2026. Autorizzata una sola build interna Android, senza costi,
retry cloud automatici, pubblicazione PWA, store, commit o push.

**Esito finale: APK compilata e installabile, gate di consegna FAIL.**
Hatha90+Rain funziona nel test circoscritto; Ocean waves non si avvia,
anche dopo Retry e riavvio pulito. NON una consegna completamente funzionante.

[F] Aggiornamento successivo D-102: la correzione locale supera avvio Ocean,
prima giunzione musicale e ritorno da Rain nel development client. Non è
contenuta in questa APK e non ne cambia l'esito storico. Vedere
`ANDROID_OCEAN_D102_FIX.md`; nessuna build aggiuntiva avviata.

## Prima della build

- [F] Runtime locale Node 22.23.1 / pnpm 11.16.0; Expo 57.0.22,
  React Native 0.86.3, React Native Audio API 0.13.2. CLI EAS esistente
  21.7.1, nessun aggiornamento globale.
- [F] Correzione D-097 delle curve native preservata. Aggiunto un probe
  seriale per distinguere uno seek vicino alla fine del file da un decoder
  ancora fermo a zero. Nessun cambiamento a master, formato o guadagno audio.
- [F] Jest: 647/647, 89 suite, 53,196 s (`dist/d101-jest.json`). Include
  regressione nativa, Hatha 30/45/60/90, due corsie, curve e teardown.
  Lint, typecheck, Prettier e diff-check PASS. Expo Doctor 20/20,
  `expo install --check`, config, boundary QA/PWA e asset safety PASS.
- [F] Ripetizione dedicata audio: 251/251 test, 22 suite, 9,398 s
  (`dist/d101-audio-jest.json`).
- [F] Security: PASS WITH ACCEPTED RESIDUALS, esclusivamente i due advisory
  image-size già documentati; nessuna nuova eccezione introdotta.
- [F] Validatori audio consumer/Hatha/texture e artwork PASS. Kit esterno
  ricontrollato integralmente: 47/47 hash e dimensioni, 2.434.210.564 byte,
  manifest SHA-256
  `70c026c7e8ad8c8bae6e7711382420a43df9bbdae55e0a6e035f2e2055bdfcac`.
- [F] Archivio EAS ispezionato senza upload: 177 file, 160.158.967 byte,
  contenuti identici ai sorgenti per tutti i 177 file. Nessun segreto,
  percorso locale, catalogo consumer o superficie PWA/Workbench. Restano
  soltanto i tre WAV ATP01 previsti dal contratto del pacchetto base.
- [F] Export Metro correnti: Android 53 file / 163.941.939 byte, iOS
  49 file / 162.785.069 byte. Entrambi superano il validatore hash/audio:
  esattamente tre WAV ATP01, 155.520.132 byte, nessun catalogo esterno.
  L'export iOS è soltanto un controllo JavaScript, non una build iOS.
- [F] Quota Free ricontrollata prima dell'upload: Android 1/15 utilizzate,
  14 disponibili; overage e totale stimato 0 centesimi.

## Prova nativa prima del cloud

[F] Riutilizzato il development APK esistente su AVD Android API 34 x86_64,
senza nuove build né cancellazione dei dati. I 47 file importati sono rimasti
disponibili. App consumer corrente servita da Metro, non PWA.

[F] Da UI pulita: Hatha 30 senza ambiente e Hatha 90 con Rain avviate.
Hatha 90: pausa e ripresa osservate, countdown e volumi distinti visibili.
AudioFlinger riporta il client dell'app e un segnale non nullo. Screenshot
in `dist/d101-native/`: `hatha-ninety-rain-clean`, `-pause`, `-resume`,
`-running` e `-running-six`. Queste prove non certificano la qualità sonora.

[F] Un tentativo diagnostico separato, con valutazione asincrona nel debugger
Hermes, ha causato un SIGSEGV prima del successivo riavvio pulito. Non viene
conteggiato come prova del flusso UI né usato per attribuire una causa al
motore. Nessuna iniezione/debug hook di quel tentativo entra nei sorgenti
consegnabili. Anche il log diagnostico temporaneo è stato rimosso.

[F] Il client di sviluppo non prova l'APK standalone. Ispezione e installazione
dell'artefatto esatto sono state eseguite separatamente sotto, con Metro spento.
[U] Qualità
dei loop/crossfade, latenza, Bluetooth, schermo bloccato e long-run su telefono
restano NON DETERMINATO — EVIDENZA INSUFFICIENTE. La prova umana non è
sostituita dai test automatici o dall'emulatore senza uscita audio host.

## Catalogo e consegna

[F] Il kit separato contiene 13 musiche, 8 Hatha, 24 suoni naturali e due
texture manuali: 45 FLAC e 2 WAV, senza Eclypsis/Nirvana/Soft Air.
Moon Drone/Deep River riusano ATP01; gli otto noise sono generati a runtime.
L'import locale iniziale richiede tempo e spazio, ma non si ripete a Play.
I file del kit sono esterni a Git, archivio EAS e APK.

[F] Build interna Android avviata il 13 settembre 2026 alle 21:28:16 UTC:
`71e00fbe-bc05-4a61-ab70-13a2dc7d75a3`, versione 1.0.2 / versionCode 3,
firma esistente congelata. Nessun retry cloud. FINISHED alle 21:50:55 UTC;
Gradle BUILD SUCCESSFUL in 21m12s. Quota live finale Android 2/15 utilizzate,
13 residue; overage e totale stimato 0 centesimi.

[F] APK scaricata: `AppRelax-1.0.2-android-consumer.apk`, 293.083.762 byte,
SHA-256 `676ba51bb369588d52b335eac70de2e2c765c6f7217f737d1b4967a09d2a1780`.
Audit statico indipendente PASS: ZIP CRC, package/versioni, non-debuggable,
allowBackup false, quattro ABI, servizio mediaPlayback, tre WAV ATP01
byte-identici alla baseline, zero FLAC/catalogo esterno. Certificato v2
identico alla baseline. La firma è accettata anche dal Package Manager:
installazione in aggiornamento `Success`, senza cancellazione dei dati.

[F] APK esatta avviata senza Metro né reverse ADB: COLD 1.663 ms sul solo
AVD API34 x86_64 (non latenza del suono su telefono). Settings mostra
versione1.0.2 e47/47 importati. Hatha90Rain si avvia, pausa/ripresa osservate,
mute principale e ambiente separati. AudioFlinger riporta segnale non nullo;
durante il mute principale l'attenuazione osservata scende sotto−100dB,
non una misura certificata di silenzio digitale. Screenshot `apk-*` e rapporti
AudioFlinger in `dist/d101-native/`.

## Esito runtime del candidato esatto

- [F] Hatha90+Rain: Play, pausa, ripresa, main mute/unmute, ambience mute/unmute
  e Stop→Ready90:00 osservati nella UI consumer reale.
- [F] Playing81:38 (502s trascorsi), senza errore, oltre la prima uscita
  pianificata a465,75s; segnale AudioFlinger corrente non nullo dopo tale
  punto. Non prova continuità percepita o assenza di clic.
- [F] FAIL Ocean waves: dopo Stop→Ready della sessione Rain, selezione Ocean
  e Play, compare Could not play a90:00. Il nuovo client audio viene rimosso
  dopo circa5,2s. Retry loading non ripristina la riproduzione.
- [F] Ripetizione indipendente: force-stop dell'app, Home→Hatha→90min→Ocean
  waves→Start. Stesso errore a90:00, confermato dalla UI fresca e screenshot.
  L'errore non è quindi osservato soltanto nel passaggio da Rain a Ocean.
- [F] Nessun fatal nativo nell'ultimo logcat filtrato. L'assenza di crash
  non trasforma l'errore gestito in un test passato.
- [U] Il rapporto `apk-ocean-signal.txt` contiene la precedente storia Rain,
  non segnale Ocean corrente: non viene usato come prova di playback Ocean.
- [U] Tutti47 file importati non significa tutti47 decoder validati.
  Telefono reale, qualità loop/crossfade, Bluetooth, lock-screen, batteria,
  latenza acustica e sessione completa restano NON DETERMINATO — EVIDENZA
  INSUFFICIENTE. Emulatore avviato senza audio host: nessun ascolto dichiarato.

### Diagnosi circoscritta, non correzione presunta

[I] Audit read-only su `AdaptiveNativePlayback.prepareAt/prepare` e
`StreamingStemSource.waitForStreamingPosition`: le preparazioni iniziali
partono via `Promise.allSettled(initial.map(...))`; un decoder può essere
già avviato mentre la creazione sincrona del successivo blocca JS. La
conferma richiede progresso strettamente positivo entro100ms; uno stallo
oltre tale finestra può portare al timeout5000ms. Questo spiega un possibile
meccanismo ed è compatibile con il tempo visto, ma non dimostra la causa
del run Ocean: il messaggio tecnico interno non è disponibile nel log release.

[U] Causa esatta NON DETERMINATO — EVIDENZA INSUFFICIENTE. Prima di modificare
il payload: riprodurre l'errore con il development client esistente, senza
cloud, e aggiungere regressione fedele. Non aumentare tolleranze né introdurre
una patch speculativa. Nuovo APK solo dopo fix verificato e nuova approvazione
esplicita. Nessun secondo job EAS è stato avviato in questa autorizzazione.

### Evidenze e conservazione

[F] SHA-256 screenshot principali, sotto `dist/d101-native/`:

- `apk-hatha-first-join-completed.png`:
  `97861a17f69c30f22b4d21ae9d14169711e58099a95ac13a49ea5fe0b392bad0`.
- `apk-hatha-stop-ready.png`:
  `5ed605daa1c301cb50ae3767f33d7a96a2e9960972d11758d3e23b0065459878`.
- `apk-ocean-playing.png` (nome diagnostico precedente, contenuto FAIL):
  `6a3a322d297117a10b4c9833cfb117909ec1d7a65feea4db8b3af385e933b049`.
- `apk-ocean-cold-error.png`:
  `b85ed8ab892d7a173fe76e8816518abd1b2e94f8c5b71c058e2e7f0cc1d24e25`.

[F] APK e audit conservati in
`/Users/RF/Documents/App Relax Android Test 20260913/`; `LEGGIMI.md` segnala
il gate fallito. La precedente1.0.1/2 non viene cancellata, rinominata o
presentata come corretta. Il kit audio esterno resta invariato.

[F] App fermata, emulator terminato normalmente, ADB spento; PID emulatore
86468 e precedenti processi84096/83517 assenti. Nessun listener su
5037/5554/5555/8081. Dati importati nell'AVD conservati. Nessun commit/push,
modifica PWA, pubblicazione o ulteriore upload.

[F] Git finale: HEAD `6549f0117f2d7623fe20816cbf2c687385af6b8d`, index vuoto;
100 file tracciati modificati e92 voci non tracciate, incluse le modifiche
ereditate. D-101 modifica il probe seek e il suo test, versione1.0.2/3 e
documentazione di gate; nessuno staging globale o assorbimento di Strategia.

[F] Controllo finale di stile: pnpm aveva riserializzato il lockfile;
Prettier segnala il solo `pnpm-lock.yaml`. Normalizzazione meccanica e nuovo
check dell'intero progetto PASS. Confronto del lockfile corrente con quello
archiviato, formattato con le stesse opzioni: identità completa, quindi
nessuna modifica di dipendenze rispetto al payload compilato. Diff-check PASS.
