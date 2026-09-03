# Stato progetto

Aggiornato: 3 settembre 2026

## Milestone attiva

M4 `Lossless Autonomous Catalog Foundation`: catalogo consumer single-source,
derivati FLAC lossless, noise colours runtime e UI outcome-first. M3 resta
preservata nel worktree.
Il commit locale M3/M4 e autorizzato il 2 settembre 2026. EAS, build
native/cloud, push, PR, Git LFS e asset delivery restano esclusi.

## M4 implementato localmente

- [x] Registro editoriale unico di 50 entità autonome: 42 opere file-backed (15
      derivati analogici, 24 opere Water/Air e tre ATP01) più otto generatori
      noise runtime. Ogni entità resta single-source.
- [x] Tutti e sei gli outcome hanno opere riproducibili nel localhost. Calm è
      ricondotto a Relax; Water vive in Elemental Worlds e Second Element: Air
      in Esoteric Series, senza cambiare i master o sommare sorgenti.
- [x] L'utente ha dichiarato positivo l'ascolto dei 15 lavori analogici e dei 24
      Water/Air il 3 settembre 2026: 39 opere hanno stato
      `APPROVED — LISTENING PASSED`. Titoli e mapping restano modificabili come
      metadata editoriali.
- [x] Meditation occupa ora la prima posizione della Home. Nel localhost la sua
      selezione apre con `Open Tide` in evidenza e prosegue con gli altri cinque
      suoni marini già associati a Meditation; `Eclipse Veil` resta disponibile
      ma non è più il brano principale.
- [x] In Soundscapes, `Stillwater Halo` chiude ora la raccolta
      `Cosmic / Zen Ambient`; catalogazione, disponibilità e audio restano
      invariati.
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
- [x] Starter locale limitato a `Eclipse Veil` (28.167.925 byte). Moon Drone e
      Deep River riusano due ATP01 nel consumer; `SLEEP_TEXTURE_001` resta nei
      byte soltanto per AUDIO TEST dopo il rifiuto consumer di Soft Air.
- [x] Catalogo localhost completo: 38 file on-demand in
      `public/audio-catalog/`, ignorati da Git, per 2.706.406.941 byte; Eclipse
      Veil resta nello starter incorporato. I 14 lavori analogici mancanti sono
      serviti come WAV invariati, i 24 Water/Air come FLAC delivery invariati.
      Manifest locale, dimensioni e SHA-256 di ogni file sono validati.
- [x] Prova browser individuale completata su tutte le 39 opere approvate:
      ciascuna ha raggiunto lo stato Pause dopo Play, senza alert o errori
      console. Play/Pause/Stop restano verificati sul percorso Web Audio.
- [x] Gate locali M4 verdi dopo l'estensione: Prettier, lint, TypeScript, 18
      suite / 81 test, regressione audio 40/40, peer dependency, Expo install
      check, Expo Doctor 20/20, validatori placeholder/ATP01/consumer/asset/config
      e confronto PCM lossless completo.
- [x] Bundle Metro Android e iOS verdi. La tabella degli asset referenziati
      contiene esattamente quattro audio, tre WAV ATP01 e lo starter FLAC, per
      183.688.057 byte; gli SHA-256 coincidono con i manifest e non sono emersi
      path locali o segreti mirati nel bundle/metadata. Un export locale eseguito
      mentre `public/audio-catalog/` è popolata ne copia anche i 38 file di
      ascolto: non sono asset Metro nativi e l'intera cartella è ora esclusa
      esplicitamente dall'archivio EAS tramite `.easignore`.
- [x] Export web statico verde con 12 route, incluse Home, outcome filtrato,
      Soundscapes e player consumer.
- [x] Anteprima web sonora su `http://localhost:8092/`: un adattatore Web Audio
      separato usa lo stesso `AudioSessionController` senza importare il graph
      nativo nel browser. Verificati nel browser Play/Pause/Stop, timer,
      volume/mute, Pink Noise generato, Deep River WAV, Eclipse Veil FLAC e il
      percorso tecnico Moon Current; nessun errore console nel run.
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

- [F] Node di sistema 18.20.8 e insufficiente; il target di progetto e Node 22.23.1. I gate di questa sessione sono stati eseguiti con il runtime isolato Codex Node 24.19.0 e pnpm 11.16.0.
- [F] macOS 13.7.8 e Xcode 15.2 non soddisfano Expo SDK 57, che richiede Node 22.13.x e Xcode 26.4+.
- [F] Nessun runtime/device iOS Simulator e installato; CocoaPods e assente.
- [F] Sono installati, su autorizzazione esplicita, Android SDK Platform Tools 37.0.1, Emulator 37.1.11, system image API 34 x86_64 e AVD `AppRelax_API_34_x86_64`. Emulator, Metro e server ADB sono spenti a chiusura test.
- [F] Android Studio, un JDK generico, SDK Platform e Build Tools restano assenti. Questi limiti impediscono build native locali, non Metro, l'APK esistente o build EAS cloud.
- [F] Nessun acquisto hardware e necessario per produrre i binari cloud; almeno un telefono fisico resta necessario per il gate audio reale.
- [U] `pnpm audit --audit-level high` segnala due DoS transitive high in `image-size` senza release corretta pubblicata. Nessun input immagine remoto e presente; il validatore vieta i formati vulnerabili per estensione e signature. La policy allowlistata e stata riverificata prima dell'upload EAS e resta un residuo upstream accettato, non un gate verde del raw audit.

## Prossimo gate

Il catalogo sonoro completo è pronto per il confronto in localhost. Il prossimo
gate richiesto dall'utente è la revisione estetica e della gerarchia editoriale.
La consegna mobile dei 39 file richiede una decisione separata su asset delivery
o Git LFS; nessuna EAS è autorizzata. Bluetooth, background, lock-screen,
interruzioni, batteria e percorso nativo restano `NON DETERMINATO — EVIDENZA
INSUFFICIENTE`.

## Lavoro parallelo escluso

`output/` e `tmp/` contengono flussi paralleli comparsi durante il lavoro, inclusi strategia e render PDF. Non appartengono a questa milestone Codex: sono preservati e ignorati integralmente per staging/upload.
