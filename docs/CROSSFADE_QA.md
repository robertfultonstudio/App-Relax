# Crossfade: solidità del codice separata dall'ascolto

Data: 6 settembre 2026 · D-064 · modifiche solo locali, non pubblicate

[F] Aggiornamento successivo D-065: su richiesta dell'utente questa patch è
stata pubblicata come A01-A14.4 sul Site privato (versione 5). Il repository
canonico resta non committato in attesa del test iPhone. I risultati sotto
documentano il run tecnico locale precedente alla pubblicazione.

## Scopo e confine

[F] Il Workbench precedente già offriva timeline, seek, loop di una finestra,
A/B, isolamento outgoing/incoming e audit accelerato del piano. Il mandato
attuale distingue la verifica di questi meccanismi dalla scelta dei brani.
Non occorre approvare nuove coppie musicali per eseguire test tecnici.

[F] `tests/fixtures/crossfadeProgram.ts` crea quattro identità inventate,
due corsie coordinate e finestre sfalsate. Importa solo tipi; non legge il
catalogo né risolve manifest o file. Titoli e provenance sono TEST ONLY.
I campi necessari al contratto non costituiscono approvazione editoriale.
`tests/fakes/AdaptiveWebHarness.ts` sostituisce media/AudioContext con double
che registrano i comandi e respingono curve non finite o sovrapposte.
Nessun byte audio, richiesta di rete, sintesi udibile o nuovo asset.

## Difetti riprodotti e correzioni

1. [F] Seek fra due campioni della curva: il ritaglio arrotondato tornava
   indietro nella forma. A progresso 0,413, equal-power outgoing dava
   0,8032075 invece di 0,7968464. Ora ogni intervallo parte dal valore
   analitico della posizione effettiva.
2. [F] Pausa/Riprendi riutilizzava i GainNode senza eliminare le vecchie
   automazioni. Ora cancella prima le curve e ancora il gain alla posizione
   della sessione, anche quando il clock del contesto è avanzato in pausa.
3. [F] La final envelope non era inclusa nel gain iniziale; se coincideva
   con un ingresso erano pianificate due curve sovrapposte sullo stesso
   parametro. Ora i fattori vengono moltiplicati e campionati in intervalli
   non sovrapposti, senza accorciare il finale o il crossfade.
4. [F] Un seek entrante ritardato di 5 secondi avviava il file da 11 s invece
   di 16 s, mentre il gain seguiva già il tempo corrente. Prima di Play ora
   verifica la posizione sul clock, con massimo due riallineamenti e
   tolleranza 100 ms. Se non riesce, arresta esplicitamente; Stop annulla
   anche questo passaggio. Non è una promessa sample-accurate.
5. [F] Un piano vuoto risultava verde per verifiche sulle corsie vuote.
   L'audit ora lo respinge: `pass`, `exactEnd`, `noGap` sono falsi.

[F] La cancellazione di una curva attiva segue il contratto di
[`AudioParam.cancelScheduledValues`](https://www.w3.org/TR/2021/REC-webaudio-20210617/#dom-audioparam-cancelscheduledvalues)
del W3C. Il nuovo valore viene impostato nello stesso turno prima di Play.
Questo riferimento non equivale a una nuova prova del motore WebKit.

## Prove ripetibili

Runtime locale: Node 22.23.1, pnpm 11.16.0; usare il runtime del progetto.

```bash
pnpm test:crossfade --json --outputFile=dist/crossfade-targeted-jest.json
pnpm test --json --outputFile=dist/crossfade-full-jest.json
```

[F] Suite dedicata: **10 suite / 92 test PASS**. Regressione completa:
**62 suite / 400 test PASS**. Nuovi casi: 17 test scheduler più un test
del validatore di piano vuoto. Typecheck e lint PASS.

- sessioni virtuali complete di 10/20/30/45/60/90 minuti; crossfade di 60 s
  nel caso 10 min, 180 s negli altri;
- musica più natura, massimo tre sorgenti attive, pool fisso di quattro
  elementi media, un solo evento End al termine;
- seek fra campioni, curve linear/equal-power, final envelope composita;
- 12 cicli di seek/Pausa/Riprendi senza crescita del pool;
- Stop durante seek e riallineamento, arrivo tardivo di `seeked`, errore di
  Play della sorgente futura, lease rilasciate una sola volta e zero timer;
- determinismo, compatibilità, fase, durata, headroom, Workbench/persistenza
  e regressione software nativa già esistenti, riuniti nel comando dedicato.

[F] Le prove rosse conservate in `dist/crossfade-red.json` e
`dist/crossfade-empty-plan-red.json` precedono le relative correzioni.
I report completi verdi sono nei due JSON dei comandi sopra.

## Consolidamento locale

[F] Regressione audio separata: 13 suite / 145 test PASS. Formattazione
mirata PASS; Expo Doctor 20/20; `expo install --check` aggiornato. PASS anche
placeholder, ATP01, catalogo consumer, immagini, configurazione e confine
QA/PWA. Audit dipendenze: PASS WITH ACCEPTED RESIDUALS, soltanto i due
advisory image-size già documentati; non viene dichiarato zero advisory.

[F] Export PWA locale `dist/crossfade-pwa`: 111 file / 7.420.963 byte;
precache 109 file / 7.410.107 byte, hash
`f784ec04171eac88a09cff025b7a8469d4c091cd7a2a09174bc51ea0ccebc7b7`.
Validatore PASS: zero audio, Audio Test o Workbench. Fixture tecniche,
segreti riconoscibili e path sorgente assenti dalla shell ispezionata.

[F] Archivio simulato con `.easignore`: 149 file / 159.973.328 byte,
validatore PASS, esattamente tre WAV ATP01, nessun catalogo consumer,
segreto riconoscibile o path locale. Catalogo esterno verificato e immutato:
37 file / 2.657.446.897 byte. Questa simulazione non è una build EAS.
Gli export nativi non vengono rieseguiti: la modifica al driver è Web e il
gate nativo reale resta aperto.

[F] Dieci percorsi interessati da questo intervento:

- `src/audio/web/AdaptiveWebPlayback.ts`
- `src/domain/sessions/workbench.ts`
- `tests/audio/CrossfadeRobustness.test.ts`
- `tests/fakes/AdaptiveWebHarness.ts`
- `tests/fixtures/crossfadeProgram.ts`
- `tests/domain/workbench.test.ts`
- `package.json`
- `docs/CROSSFADE_QA.md`
- `docs/DECISIONS.md`
- `STATO.md`

[F] Worktree precedente preservato; index vuoto, HEAD invariato
`72346a089fca9d9235b1788acceab6eb0dcd455c`. Stato complessivo e diff-stat
in `dist/crossfade-git-status.txt` e `dist/crossfade-git-diff-stat.txt`:
includono il lavoro precedente, non soltanto questa patch. `git diff --check`
PASS. Nessun server, emulatore o processo di test lasciato attivo dal run.

## Cosa NON è dimostrato

[U] Il tempo virtuale controlla il codice di scheduling reale con API
simulate. Non è un render PCM/NRT, un decoder reale o 90 minuti di playback
su dispositivo. Non misura glitch, latenza hardware, buffering di rete,
ritardo di `play()` del browser, CPU/batteria, background o lock-screen.
Questi aspetti restano **NON DETERMINATO — EVIDENZA INSUFFICIENTE** fino alle
rispettive prove. La race nativa documentata in `A01_NATIVE_GATE.md` resta
separata; nessun codice nativo è modificato da questo intervento.

[F] Il catalogo e le coppie editoriali non cambiano. Le tracce respinte non
rientrano. L'ascolto umano giudicherà la qualità delle transizioni fra opere
reali; non blocca la verifica automatica del motore. Il Workbench resta QA,
non viene aggiunto alla navigazione o alla PWA consumer.

[F] Nessun commit, push, EAS, upload o pubblicazione in questo intervento.
Al termine del run D-064 la PWA era A01-A14.3 e le correzioni erano locali;
la successiva pubblicazione autorizzata D-065 è documentata sopra.
