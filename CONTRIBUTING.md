# Contribuire ad App Relax

App Relax usa `main` come branch stabile e sviluppa ogni cambiamento coerente
tramite una pull request breve. La guida operativa, inclusi branch, commit,
worktree, sincronizzazione, merge e pulizia, è in
[`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md).

Prima di aprire una PR:

```bash
pnpm ci:static
pnpm ci:test
```

Eseguire inoltre i gate mirati al rischio della modifica. La CI remota esegue
sempre il contratto completo e `PR policy / Policy gate` verifica naming,
descrizione e dimensione. Nessun test locale autorizza automaticamente commit,
push, build cloud o pubblicazione.
