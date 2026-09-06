# Consumer selection — regressione dell'avvio esplicito

5 settembre 2026. Sottoincarico test-only nel worktree isolato.

## Esito verificato

[F] Creato `tests/audio/ConsumerSelectionStart.test.ts`: **12/12 PASS nel rerun
finale**, dopo le due correzioni applicate dal root. Il primo run aveva
riprodotto 10 PASS e 2 FAIL, conservati sotto come evidenza storica risolta.
Nessuna modifica al controller canonico o alle sue
copie locali oltre al refresh read-only richiesto. I quattro file sorgente
copiati sono soltanto fixture dello snapshot e non vanno reintegrati dal root.

Snapshot controller SHA-256:
`a9ab94c76f1db421e2b3e296ada15e4d35c62533edce5aa6607bcce537513860`.

Snapshot storico del run RED:
`b14f88b5641d1b73dfc856e731db91958793b72a58fb031ef138998b5a84975f`.

Comando eseguito con Node 22.23.1:

```bash
node node_modules/jest/bin/jest.js tests/audio/ConsumerSelectionStart.test.ts --runInBand --cacheDirectory tmp/jest-cache
```

## Casi verdi

1. Candidate caricato separatamente, senza Stop/dispose del player attivo;
   lo stesso titolo resta Playing e il suo timer continua.
2. Unlock del candidate sincrono, dentro il gesto originale e prima di
   qualsiasi await/dispose/start.
3. Doppio Start riuscito: una sola activation e un solo graph.
4. Errore di load del candidate: dispose e audio corrente preservato.
5. Cancel durante load: dispose e rifiuto del risultato tardivo, senza start.
6. Cancel del candidate già pronto: dispose e audio corrente preservato.
7. Candidate adattivo instradato senza avviare single-track.
8. Start fallito, cleanup e nuovo candidate al retry; listeningRun cresce
   soltanto dopo il successo.
9. Stop durante Play pendente sblocca la coda; la conferma tardiva non rimette
   Playing e non lascia timeout.
10. Volume principale 0,35 e Massage 90 minuti restano 0,35 e 90 minuti, inclusa
    la durata del fade schedulato.

Il caso Cancel pending verifica disposal e invalidazione del risultato
tardivo, non la risoluzione immediata della Promise di load: nello snapshot
questa può restare pendente fino alla risposta o al timeout di 15 secondi.

## FAIL 1 storico, risolto — Candidate perso se il vecchio dispose fallisce

[F] `startSelectionFromUserGesture` rimuove subito `preparedSelection`, poi
attende `this.driver.dispose()`. Se quella chiamata rigetta, il candidate non
viene adottato e non viene ripulito. Test: `candidate.disposeCalls` atteso 1,
osservato 0.

[I] Patch minima nello stesso comando accodato:

```ts
let adopted = false;
try {
  // ... invalidate ticker/deadline as today
  await this.driver.dispose();
  this.driver = candidate.driver;
  adopted = true;
  // ... existing adoption and playInternal
} catch (error) {
  if (!adopted) await candidate.driver.dispose().catch(() => undefined);
  throw error;
} finally {
  this.startPending = false;
  // clear exact in-flight Start promise, see FAIL 2
}
```

Il driver precedente può essersi chiuso soltanto in parte: non dedurre che
resti udibile da un dispose rigettato. L'eventuale stato/error UX va conciliato
dal root con A08.

## FAIL 2 storico, risolto — Deduplicazione che trasforma l'errore in successo

[F] Con due tap consecutivi e Start che fallisce, `Promise.allSettled` restituisce
`[rejected, fulfilled]`. Il ramo `if (this.startPending) return this.commandChain`
ritorna la catena privata che contiene già `.catch(() => undefined)`, non la
Promise dell'avvio originale. Il graph è deduplicato ma il suo esito no.

[I] Conservare una `Promise<void> | null` dedicata allo Start in corso:

```ts
private pendingSelectionStart: Promise<void> | null = null;

// Before acquiring/removing the candidate:
if (this.pendingSelectionStart) return this.pendingSelectionStart;

// Keep activateUserGesture synchronously before enqueue, as today.
const start = this.enqueue(async () => {
  try { /* existing adoption and play, plus FAIL 1 cleanup */ }
  finally {
    this.startPending = false;
    this.pendingSelectionStart = null;
  }
});
this.pendingSelectionStart = start;
return start;
```

Non spostare `activateUserGesture` dentro `enqueue` per risolvere questo bug:
si perderebbe la proprietà verificata dal test del gesto WebKit originale.
Per robustezza, un'eccezione sincrona dell'unlock deve ripristinare
`startPending`; questa è una nota di analisi statica, non un tredicesimo caso
eseguito.

## Consegna

Integrare soltanto il nuovo test e questo rapporto. Non copiare dal worktree
`AudioSessionController.ts`, `types.ts`, `consumerSelection.ts` o
`consumerTypes.ts`: appartengono al lavoro corrente del root. Dopo le due
correzioni questo file è stato rieseguito: **1 suite / 12 test PASS**, 1,869
secondi. Candidate cleanup e identico esito d'errore per il doppio Start sono
ora verificati. La regressione completa A14/audio resta il gate integrato del
root; nessun helper legacy è stato modificato in questo sottoincarico.

Nessun commit, browser, Sites, upload, installazione o byte audio modificato.
