# Night Birds — integrazione locale D-092

13 settembre 2026. Autorizzazione Editing esplicita; nessuna pubblicazione.

## Provenienza e identità

[F] Letti integralmente `CONSEGNA_SVILUPPO.md` e `manifest.json` della consegna
`Night_Birds_B1_Loop_2026-09-13_v01`. Copiato soltanto
`night_birds_b1_LOOP_48K24.wav`, senza nuovo editing, conversione o normalizzazione,
in `public/audio-catalog/` ignorata. Installer idempotente: destinazione presente
verificata, mai sovrascritta; file non manifestati rifiutati.

- ID `night-birds-b1`; titolo provvisorio **Night Birds**, senza B1 visibile.
- PCM24 stereo 48 kHz; 1.616.645 frame; 33,680104166666666 s; 9.699.972 byte.
- SHA file `311791d39d7d4ad52420f5456b233e9f74e96f9f0f662fd273466b77c2ca253b`.
- SHA PCM `8c0b9976c9bfe6c97a1aeb2046e4388c3bc8fb46eaa729101b71a53829406057`.
- Loop frame 0 incluso → 1.616.645 escluso. Raccordo circolare 1 s già nel WAV;
  nessun fade ripetuto aggiunto dal catalogo. Gain app 0 dB.
- −18 LUFS, LRA1, TP−6,4 dBTP: misure consegnate da Editing, non un nuovo ascolto.

[F] Copia, formato, frame e hash file/PCM verificati due volte dal validatore.
SHA del sorgente originale riletto e identico al manifest:
`35cf455a71746ef98a923fe8137674b9658a182e6275bfae92c2b48268fc545c`.
Nessuna preview seam/THREE_CYCLES/QA importata. Field Ambience e Hatha invariati.

## Catalogo e accesso reale

[F] Riusata la famiglia manuale `unclassified-nature`, con `primaryOutcome:null`,
secondaryOutcomes e collectionIds vuoti, scope local-only e ascolto pending.
Nessun profilo Continuum, assegnazione automatica, Rain/Ocean, musica o Hatha.
Birds/night deriva dal filename: specie, luogo e orario reale non certificati.

[F] Verificato nel browser integrato:
Settings → Listening preferences → Choose a recording manually →
Natural textures · local review → Night Birds →
`/qa-workbench?workId=night-birds-b1`, Single work, senza autoplay.
La famiglia mostra entrambe le texture locali. I titoli restano nel percorso
manuale/QA, non in Home o nelle attività quotidiane.

## Runtime e limiti

[F] Play, Pausa e Stop provati sul WAV locale tramite HTMLMediaElement.
Osservazione temporanea degli eventi reali `timeupdate`, senza alterare audio,
scheduling o loop: tre ritorni automatici registrati, senza seek manuali,
a 33.891,6 / 67.672,4 / 101.345,6 ms dal comando Play. Posizioni prima/dopo:
33,546667→0; 33,352679→0,010667; 33,523375→0. Durata media API 33,680104 s.
Zero eventi errore media e zero errori browser. Pausa a 00:28; Stop a 00:00,
Play nuovamente disponibile. Hook di osservazione ripristinato prima di uscire.

[F] Screenshot ispezionato: `dist/night-birds-review/01-player-stopped.png`.
Il run prova avanzamento/riavvio reale del player locale, non assenza di click
percepito, precisione sample-accurate HTML, iPhone, background o qualità musicale.
La differenza tra tempi `timeupdate` e durata non è una misura di gap audio.
Ripetitività di eventi ogni 33,68 s e classificazione: ascolto umano ancora aperto,
`NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## Gate

[F] Validatori: 37 file storici, Hatha8/8, entrambe le texture con SHA file/PCM;
asset safety509 file, QA/PWA boundary e typecheck/lint PASS. Test di null outcome,
assenza dai profili e route PWA, UI manuale senza autoplay, regressioni playback.
Consuntivo finale: 618 test/85 suite PASS, seguito da typecheck e lint con exit 0.

[F] Export Web consumer fresco `dist/night-birds-consumer-web`: 54 file,
161.490.129 byte. Contiene soltanto i tre WAV ATP01 storici (155.520.132 byte,
SHA corrispondenti ai canonici); zero nuovi byte audio e zero pattern rilevati
per segreti/path privati/QA sentinel. Non confondere questo export consumer con
la PWA privata leggera, che non incorpora audio. `.gitignore`/`.easignore`
escludono il catalogo; index Git vuoto. Nessuna nuova build nativa/EAS eseguita.

[F] Nuovo asset NON caricato online; la PWA .21 resta sui 45 file precedenti.
Nessun commit/push/deploy/installazione globale/cancellazione. Approvazione sonora
e autorizzazione a delivery privata restano gate distinti.

[F] Metro e server diagnostico terminati regolarmente, relative sessioni exit 0;
controllo finale senza processi ai PID registrati o listener sulle porte 8093/8252.
Schede di test chiuse. HEAD invariato, index vuoto; worktree complessivo con
87 file tracciati modificati e 71 voci non tracciate, in gran parte preesistenti.
