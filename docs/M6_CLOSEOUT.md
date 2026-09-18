# M6 — chiusura locale e aggiornamento PWA privata

17 settembre 2026. Ambito: Product Design System & Consumer Experience
Reconstruction, direzione 1–2 e successivo feedback su font/trasporto/tab.
Questo rapporto supera gli stati intermedi in `M6_APP_INTEGRATION.md`.

## Risultato verificato

[F] Home con sei attività sopra pittura continua; player coordinato, fondo
trasporto lavanda/cipria sfumato, simboli opachi, Stop separato. Tab con
contorno netto e selezione giada. Zen Old Mincho e Hanken Grotesk locali:
cinque font statici OFL, 329696 byte. Due dipinti M6, 883258 byte.
Nessun nuovo audio, modifica ai master o accesso audio diretto dalla UI.

[F] Chiusa la discrepanza Expo con la sola patch 57.0.22 → 57.0.23, nel
runtime riproducibile Node22.23.1/pnpm11.16.0. React Native resta0.86.3;
nessuna migrazione SDK né installazione globale. Delta transitive registrato
in `dist/m6-closeout/dependency-delta.json`; lifecycle scripts disabilitati.
Pin e validatore rigoroso aggiornati, nessuna esclusione del Doctor.
Il validatore dei font è ora parte del controllo CI di sicurezza/asset.

## Prove complete

Log e risultati grezzi: `dist/m6-closeout/`.

| Controllo                                            | Esito                                  |
| ---------------------------------------------------- | -------------------------------------- |
| TypeScript strict / ESLint completo                  | PASS, zero warning                     |
| Jest                                                 | 103 suite, 761 test PASS               |
| Subset audio incluso in Jest                         | 27 suite, 302 test PASS                |
| Tooling                                              | 55 PASS, zero skip                     |
| Peer dependencies / Expo install check               | PASS                                   |
| Expo Doctor online                                   | 20/20 PASS                             |
| Placeholder / ATP01                                  | PASS, tre WAV canonici                 |
| Font / artwork / asset safety                        | PASS                                   |
| Config / confine consumer-QA / CI / permessi Android | PASS                                   |
| Secret scan finale                                   | PASS, 579 percorsi e 539 file testuali |
| Audit dipendenze                                     | PASS WITH ACCEPTED RESIDUALS           |
| Export Web consumer, QA, PWA e controllo separazione | PASS                                   |
| Worker della PWA privata                             | 17 test PASS, build PASS               |

I soli residui audit sono gli advisory image-size già accettati:
`GHSA-w3rx-r6r6-pgpr`, `GHSA-5p2g-fcmc-qvqq`. Nessuna nuova allowlist.
Prettier ratchet conserva un solo debito storico autorizzato:
`docs/ANDROID_APK_D112.md`; non è un nuovo difetto M6.

[F] Web consumer:48 file/108913758 byte, due WAV ATP esistenti;
Web QA:57 file/162372622 byte, tre WAV ATP esistenti. Inventario e hash in
`web-inventory.json`. Questi export non sono il pacchetto PWA pubblicato.

[F] PWA:186 file/13152059 byte, **zero audio incorporato**,53 route player.
Precache shell:163 file/9071727 byte. Revisione integrità:
`802b28364d6ac87c74353a173a27e44b25e607ea9ef8af6dfa8bf39d9e4721bc`.
Bundle: `entry-8020bcaa35887e7792b106e8658c6d06.js`.
Marker: `PLAYER-REVIEW.31-M6-LOCAL`; LOCAL identifica il candidato testato,
non limita il suo funzionamento dopo la pubblicazione dello stesso artefatto.

## Browser reale e nitidezza

[F] Nel browser integrato: attività → Play, avanzamento, Pause/resume/Stop,
Rain → Ocean durante Playing, volume principale, mute/unmute naturale.
Hatha90 con Rain:8 opere musicali,9 sorgenti ambiente,15 giunzioni totali.
Join start porta a352,79s; Loop porta a322,79s, mostrando Review loop.
Le barre musica, natura e dock convergono allo stesso tempo in pausa.
Inventario individuale presente:45 registrazioni, incluse8 Hatha.
Nessun errore console nella lettura finale; audio fermato dopo la prova.

[F] Titolo visibile: ZenMinchoRegular30px, opacity1, filter none,
textShadow none, transform none; documento390px senza overflow.
Font custom reale verificato, non fallback. Regressione aggiunta contro
effetti su testo/root. Non è stata inventata una correzione al font quando
il codice non applicava sfocatura.

Screenshot validi: `home-visible.png`, `player-visible.png` e confronti
`home-comparison.png`, `player-comparison.png`, tutti in `dist/m6-closeout/`.
I confronti sono stati ispezionati. Gli scatti CDP di diagnostica, inclusi
`home.png`/`player.png` e le prove high-DPR precedenti, presentano scala/crop
incoerenti e **non sono prova di nitidezza**. Per il giudizio usare gli scatti
visible a scala nativa e soprattutto la PWA sul telefono; nessun falso Retina.
Il test touch/VoiceOver sul dispositivo resta distinto dalla prova browser.

## Pubblicazione autorizzata

[F] Autorizzazione testuale: «Sì, aggiorna la PWA privata a costo zero».
Riutilizzati il Site esistente, il Worker e il catalogo; policy owner-only
verificata prima della pubblicazione: un account, zero visitatori/gruppi,
revisione accessi1. Nessun nuovo servizio, acquisto, upload audio o apertura
dell'accesso. Nessuna azione di fatturazione eseguita; il connettore non
fornisce un estratto contabile, quindi non si inventa una certificazione.

[F] Solo checkout isolato `tmp/pwa-private-site`: commit di pubblicazione
`3d63a7b827c19e9b6eade35c6ab804a9379bc548`, artefatto186 file byte-identico
al candidato. Vecchia cartella public conservata in
`/tmp/app-relax-m6-site-backup.GRbXaf/public`; nessun asset irreversibilmente
cancellato. Worker, catalogo, binding AUDIO e import chiuso invariati.
Il repository canonico resta non committato e non inviato a GitHub.

[F] Sites40: `succeeded`, ambiente6 invariato, policy owner-only revision1
riverificata dopo la pubblicazione. Home online aperta nel browser Codex:
carica l'entry M6 attesa e usa ZenMinchoRegular. URL stabile:
<https://app-relax-private-review.robfulton.chatgpt.site/>.
Nessun import audio eseguito. Il verificatore storico online non gestiva
`update.html` (pagina senza bundle Expo): corretto soltanto il test esterno
di audit, non l'app o il Worker già pubblicati.

[F] Controllo online finale PASS:79 pagine HTML con identità del candidato,
107 asset non-HTML byte-identici,186 file totali. Accesso anonimo401.
Log `dist/m6-closeout/hosted-verification.log`. La versione pubblicata coincide
con quella verificata: non è la vecchia anteprima né un mockup statico.

## Stato Git e chiusura processi

[F] Canonico invariato a `53b506b8bc65284dff4c66eb0c53d60893f83c40`, branch
`codex/quiet-by-design-m2`; index vuoto,161 voci di worktree contro160 iniziali.
Delta di questo consolidamento: package.json/lockfile/pin validator, marker
review, test m6Surface, STATO/DECISIONS/design-qa, M6_APP_INTEGRATION e nuovo
M6_CLOSEOUT; sola formattazione per M6_12UI_VARIANTS e M6_VISUAL_REVIEW.
Nessun file preesistente rimosso: inventario `git-final.json`.
Le altre modifiche restano ereditate, non attribuite a questo consolidamento.

[F] Audio fermato; server locale8104 spento normalmente, nessun listener
residuo su quella porta. Nessun emulatore/Metro avviato. Scheda del vecchio
prototipo chiusa e viewport di test ripristinata. Resta aperta la PWA online,
che non dipende dal Mac acceso.

## Limiti e prossimo gate

[U] Ascolto/latency su iPhone della nuova versione, touch, VoiceOver/TalkBack,
offline, Bluetooth, background, lock-screen e long-run restano
**NON DETERMINATO — EVIDENZA INSUFFICIENTE**. La chiusura locale M6 non è una
certificazione native o musicale. Nessun APK/EAS/export nativo eseguito.
Figma contiene i due riferimenti raster dichiarati, non una libreria editabile.
Prossimo gate: prova dell'utente sulla PWA privata; commit canonico separato.
