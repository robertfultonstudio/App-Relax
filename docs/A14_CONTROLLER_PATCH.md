# A14 — Patch controller mirata, da integrare manualmente

5 settembre 2026. Questo memo e `tests/audio/SessionCompletion.test.ts` sono
gli unici nuovi file del sottoincarico A14. Il controller e i tipi nel worktree
non sono stati modificati: il root possiede contemporaneamente avvio/history.

## Difetti riprodotti

- Fine naturale consumer: callback `ended` e scadenza timer tornano a Ready e
  ripristinano il tempo invece di mantenere `completed` / zero.
- Il terminal stop accodato dal timer non cattura/ricontrolla
  `deadlineGeneration`: può fermare un programma diverso avviato prima che
  quel comando venga eseguito.
- Un callback `ended` ricevuto e accodato prima di Stop + replay dello stesso
  piano supera il solo confronto planId e può fermare la nuova esecuzione.
- Stop esplicito durante fade già funziona nel controller: mantenerlo. La UI
  deve offrire Stop anche con `status === "fadingOut"` (root scope).

## 1. Tipo di stato

In `src/domain/audio/types.ts`, aggiungere soltanto `"completed"` alla union
`PlaybackStatus`. `preparing` appartiene ad A08 e non serve a questa patch.

## 2. Unico metodo di completamento naturale

Inserire prima di `stopInternal`; non modificare il comportamento di
`stopInternal(true)` e non chiamarlo per la fine naturale consumer.

```ts
private async completeNaturally(generation: number): Promise<void> {
  if (
    generation !== this.deadlineGeneration ||
    (this.snapshot.status !== "playing" &&
      this.snapshot.status !== "fadingOut")
  ) return;

  this.deadlineGeneration += 1;
  this.terminalStopQueued = false;
  this.pausedByInterruption = false;
  this.clearTicker();
  try {
    await this.driver.stop();
  } catch (error) {
    this.patch({
      status: "error",
      deadlineMs: null,
      remainingMs: 0,
      error: `Playback could not stop: ${errorMessage(error)}`,
    });
    return; // Callback/tick fire-and-forget: no rejected promise abandoned.
  }
  this.patch({
    status: this.currentPreset ? "ready" : "completed",
    deadlineMs: null,
    remainingMs: this.currentPreset
      ? this.snapshot.selectedDurationMinutes * 60_000
      : 0,
    sources: Object.fromEntries(
      AUDIO_SOURCE_IDS.map((sourceId) => [
        sourceId,
        { ...this.snapshot.sources[sourceId], fadeState: "idle" },
      ]),
    ) as Record<AudioSourceId, SourceSnapshot>,
  });
}
```

La command chain serializza il metodo e impedisce una nuova mutazione di
programma durante `await driver.stop()`. La generazione deve essere verificata
**dentro il comando**, prima del primo stop, non soltanto nel callback timer.

## 3. Terminal stop del timer

Sostituire soltanto il blocco finale dentro `reconcileTimer`:

```ts
if (remainingMs === 0 && !this.terminalStopQueued) {
  this.terminalStopQueued = true;
  const generation = this.deadlineGeneration;
  void this.enqueue(() => this.completeNaturally(generation));
}
```

Il callback ticker conserva il suo controllo attuale di generazione. Questo
nuovo controllo serve al lavoro terminale già accodato, che prima ne era privo.

## 4. Callback ended adattivo

Sostituire il corpo di `ended` in `attachAdaptiveSessionEventHandlers`:

```ts
ended: (planId) => {
  const generation = this.deadlineGeneration;
  void this.enqueue(async () => {
    if (this.currentAdaptiveProgram?.plan.id !== planId) return;
    await this.completeNaturally(generation);
  });
},
```

Applicare lo stesso capture-at-receipt e check-at-execution al callback
`error`: dichiarare `const generation = this.deadlineGeneration` prima di
`enqueue` e aggiungere `generation !== this.deadlineGeneration` al guard
iniziale. Le successive operazioni di errore restano invariate.

Limite del contratto: gli eventi espongono solo `planId`. Un evento vecchio
ricevuto _dopo_ che lo stesso piano è già ripartito non è distinguibile dal
controller. I driver devono sopprimere eventi di run superati; A01 applica
già un controllo di identità/generazione prima di inoltrare gli eventi.
Questa patch corregge specificamente gli eventi già ricevuti ma ancora in coda.

## 5. Play da Completed: timer e posizione prima dello start

In `playFromUserGesture`, includere `"completed"` nel guard che chiama
`driver.activateUserGesture()` sincronicamente. Non rimandare l'unlock alla
command chain su WebKit.

In `playInternal`, prima di qualsiasi chiamata al driver, calcolare:

```ts
const restartingCompleted = this.snapshot.status === "completed";
const fullDurationMs = this.currentAdaptiveProgram
  ? this.currentAdaptiveProgram.plan.totalDurationSeconds * 1000
  : this.snapshot.selectedDurationMinutes * 60_000;
const remainingMs =
  !restartingCompleted && this.snapshot.remainingMs > 0
    ? this.snapshot.remainingMs
    : fullDurationMs;
```

Nella chiamata `startAdaptiveSession` usare il `remainingMs` locale al posto di
`this.snapshot.remainingMs` per calcolare la posizione. Rimuovere il successivo
calcolo duplicato di `remainingMs` prima della deadline. Per Completed non
chiamare `resume`; `isResume` resta vero esclusivamente per `paused`.

Non è necessario riscrivere prima lo snapshot a durata piena: una preparazione
fallita non deve anticipare un falso riavvio riuscito. Il patch finale
`playing` mantiene il timer completo dopo lo start riuscito.

## Test e integrazione

`SessionCompletion.test.ts` copre otto casi: deadline adattiva e duplicazione
ended, callback ended, opera consumer singola, replay completo + user gesture,
Stop durante fade, terminal stop obsoleto dopo nuovo programma, ended obsoleto
prima del replay dello stesso piano e reset tecnico invariato.

Il test è intenzionalmente un contratto RED prima dell'applicazione. Eseguire
con Node 22.23.1 e `--runInBand --cacheDirectory tmp/jest-cache`.

[F] Eseguito sul controller invariato: **6 RED / 2 GREEN**. Sono verdi Stop
durante fade e il reset tecnico preesistente; i sei RED riproducono i difetti
di completamento/replay/generazione descritti sopra. TypeScript strict,
ESLint del nuovo test e formattazione sono verdi. Non è ancora prova di una
patch implementata: occorre il rerun dopo l'integrazione manuale del root.

Aggiornare inoltre l'aspettativa preesistente in
`tests/audio/AdaptiveSessionController.test.ts`, caso
`pauses, resumes and ends once at the exact absolute deadline`:
`status: "completed", remainingMs: 0`. Non cambiare l'analogo test tecnico in
`AudioSessionController.test.ts`: deve restare Ready con timer ripristinato.

Nessuna modifica a history, onStart, cancellazione load, persistenza, UI,
pubblicazione o audio è inclusa in questo sottoincarico.
