# Stato progetto

Aggiornato: 10 agosto 2026

## Milestone attiva

Vertical slice placeholder `Deep Sleep 432` fino al gate `AUDIO TEST PACK 01`.

## Completato e verificato localmente

- [x] Brief, istruzioni locali e perimetro letti.
- [x] Audit di host, toolchain, repository, remote e file esistenti.
- [x] Repository Git locale inizializzato; remote canonico `https://github.com/robertfultonstudio/App-Relax.git` verificato e configurato; branch di milestone `codex/deep-sleep-432-mvp`; commit locale autorizzato; nessun push.
- [x] Documentazione base e decision log.
- [x] Expo SDK 57 / React Native 0.86.2 / Expo Router / TypeScript strict.
- [x] Home, quattro categorie, lista Sleep, player, Settings e Legal.
- [x] Preset unico `Deep Sleep 432`, tre WAV placeholder deterministici, binaural e brown noise generati.
- [x] Controller idempotente, timer assoluto, stop sorgenti sul clock audio, fade, mute/gain, persistenza, interruzioni serializzate, focus e cleanup notification.
- [x] Profili EAS Android e iOS separati, identificativo provvisorio `com.robertfultonstudio.apprelax`, config plugin e archivio `.easignore` validati offline.
- [x] Dipendenze allineate e peer dependency verdi.
- [x] Lint, TypeScript, 8 suite/30 test (audio 19/19), validatori audio/config/asset safety, policy audit dipendenze ed Expo Doctor 20/20 verdi.
- [x] Prebuild isolato `--no-install`: iOS `UIBackgroundModes=audio`; Android permessi, foreground service e `mediaPlayback` presenti.
- [x] Account Expo personale `robertfultonstudio`, organizzazione `robert-fulton-studio` e progetto `@robert-fulton-studio/app-relax` creati tramite Google; linking verificato dalla CLI con project ID `e1d77255-66f4-45c1-b1fa-c503a088b30f`.
- [x] Piano EAS Free verificato sull'organizzazione: quota Android `0/15`, nessun add-on, overage e costo stimato pari a zero prima della build.
- [x] Archivio Android no-VCS ispezionato e validato: 49 file / 6.143.006 byte, nessun Git metadata, path locale, segreto, symlink, docs/test/tooling o flusso parallelo; esattamente tre WAV placeholder.

## Gate aperti

- [ ] EAS cloud build Android `development-android`: autorizzata entro la quota Free, senza acquisti o submission; archivio validato e pronto all'upload no-VCS.
- [ ] Installazione APK e smoke test su telefono Android reale: disponibilita del dispositivo `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [ ] EAS cloud build iOS `development-ios`: richiede approvazione, account Apple Developer attivo, credenziali e registrazione iPhone.
- [ ] Smoke test audio su telefono reale; background, lock-screen, Bluetooth, interruzioni, latenza, batteria e qualita restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- [ ] `AUDIO TEST PACK 01`: resta bloccato finche la development build placeholder non passa lo smoke test.

## Limiti locali verificati

- [F] Node di sistema 18.20.8 e insufficiente; il target di progetto e Node 22.23.1. I gate di questa sessione sono stati eseguiti con il runtime isolato Codex Node 24.14.0.
- [F] macOS 13.7.8 e Xcode 15.2 non soddisfano Expo SDK 57, che richiede Node 22.13.x e Xcode 26.4+.
- [F] Nessun runtime/device iOS Simulator e installato; CocoaPods e assente.
- [F] Android Studio, Android SDK, emulator, JDK e AVD sono assenti.
- [F] Questi limiti impediscono build native locali, non le build EAS cloud.
- [F] Nessun acquisto hardware e necessario per produrre i binari cloud; almeno un telefono fisico resta necessario per il gate audio reale.
- [U] `pnpm audit --audit-level high` segnala due DoS transitive high in `image-size` senza release corretta pubblicata. Nessun input immagine remoto e presente; il validatore vieta i formati vulnerabili per estensione e signature. La policy allowlistata deve essere riverificata prima di EAS.

## Prossimo gate

Riconfermare worktree, audit e quota, quindi avviare esclusivamente la build Android `development-android` gia autorizzata con `EAS_NO_VCS=1`. Non eseguire iOS, registrazione dispositivi, submission, push o acquisti.

## Lavoro parallelo escluso

`output/` e `tmp/` contengono flussi paralleli comparsi durante il lavoro, inclusi strategia e render PDF. Non appartengono a questa milestone Codex: sono preservati e ignorati integralmente per staging/upload.
