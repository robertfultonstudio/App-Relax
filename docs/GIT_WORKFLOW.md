# Workflow Git per App Relax

Stato: convenzione locale del 15 settembre 2026. Diventa obbligatoria sul
remoto solo dopo la pubblicazione del baseline, la creazione di `main` e
l'attivazione del ruleset descritto nella CI/CD.

## Modello scelto

Usiamo trunk-based development con branch brevi e pull request. `main` deve
contenere soltanto commit già verificati e potenzialmente rilasciabili. Non
introduciamo branch permanenti `develop`, `staging` o per versione: gli
environment e i tag rappresentano gli stadi di rilascio.

Ogni feature, fix, refactor o cambiamento operativo significativo ha una PR
dedicata. L'unità di lavoro è un risultato coerente e verificabile, non una
giornata di lavoro o una cartella del repository.

## Quando aprire una nuova PR

Aprire una nuova PR quando cambia almeno uno di questi elementi:

- obiettivo o comportamento osservabile;
- area di rischio o strategia di rollback;
- reviewer competente;
- momento previsto di merge;
- dipendenza di release;
- natura del lavoro, per esempio feature applicativa rispetto a pipeline,
  migrazione o aggiornamento dipendenze.

Continuare nella stessa PR quando il nuovo commit completa o corregge lo stesso
risultato già descritto, usa gli stessi gate e deve essere rilasciato insieme.
Un commento di review, un test mancante o una piccola correzione della stessa
feature non richiedono un altro branch.

Anche una modifica minima destinata a `main` passa per PR. Un branch ulteriore è
inutile solo se si sta già lavorando nella PR corretta o se l'esperimento locale
verrà scartato senza commit. Non modificare direttamente il checkout di `main`.

## Dimensione e separazione

Target di review, escluso il churn dei lockfile:

- ideale: massimo 400 righe aggiunte/rimosse e 15 file revisionabili;
- tra 401–800 righe o 16–25 file: PR ancora ragionevole, ma va controllata una
  possibile separazione;
- oltre 1.200 righe o 35 file: gate bloccante. Un maintainer può applicare
  `large-pr-approved` solo dopo aver documentato perché dividere renderebbe la
  modifica più rischiosa o non testabile.

Questi numeri sono limiti cognitivi, non obiettivi da aggirare. Test e codice che
implementano lo stesso comportamento restano insieme. Rename meccanici,
lockfile, asset binari e migrazioni vanno dichiarati perché alterano il peso
reale della review anche quando il conteggio righe è poco significativo.

Per ridurre una PR grande:

1. estrarre prima refactor senza cambi di comportamento;
2. introdurre contratti e test compatibili;
3. aggiungere il comportamento dietro il contratto;
4. integrare UI e rimuovere il percorso precedente in PR successive;
5. evitare formattazione globale, aggiornamenti dipendenze e rinomina estranea.

Ogni PR intermedia deve compilare, passare la CI e lasciare `main` utilizzabile.

## Naming

Formato branch: `<tipo>/<slug-breve-kebab-case>`, massimo 80 caratteri. Il solo
namespace automatico Dependabot conserva i nomi generati dal servizio.

| Prefisso                  | Uso                                                  |
| ------------------------- | ---------------------------------------------------- |
| `feat/`                   | nuovo comportamento utente                           |
| `fix/`                    | correzione verificabile                              |
| `refactor/`               | struttura senza cambio intenzionale di comportamento |
| `perf/`                   | prestazioni misurate                                 |
| `test/`, `docs/`          | solo test o documentazione                           |
| `ci/`, `build/`, `chore/` | pipeline, build e manutenzione                       |
| `spike/`                  | esperimento a tempo, da convertire o scartare        |
| `release/`                | branch creato dal workflow di versione               |
| `codex/`                  | lavoro isolato creato da Codex                       |
| `dependabot/`             | namespace automatico gestito da Dependabot           |

Esempi: `feat/one-tap-listening`, `fix/background-resume`,
`ci/pr-scope-gate`. Dependabot mantiene il proprio namespace gestito.

Il titolo PR usa Conventional Commits e diventa il messaggio dello squash:
`feat(player): add optional sleep timer`. I commit intermedi possono essere
piccoli checkpoint o `fixup!`; devono restare comprensibili e non mescolare
intenti incompatibili. Non serve riscriverli ossessivamente perché il merge
predefinito è squash.

## Branch e worktree

Un branch isola la storia. Un worktree aggiunge un secondo checkout fisico e ha
valore quando servono contemporaneamente due stati di file indipendenti:

- una feature è sporca e arriva un fix urgente;
- due feature o esperimenti procedono davvero in parallelo;
- più agenti lavorano su moduli distinti;
- occorre conservare un ambiente di test mentre un altro cambia dipendenze.

Non usare un worktree per lavoro sequenziale, audit read-only, una correzione
breve o semplicemente perché esiste un branch. Ogni worktree aumenta directory,
installazioni, cache e responsabilità di pulizia. Una branch può essere attiva
in un solo worktree; due agenti non devono condividere lo stesso checkout.

Dopo che `origin/main` esisterà:

```bash
git fetch origin
git worktree add ../app-relax-fix-resume -b fix/background-resume origin/main
git worktree list
```

Usare directory sorelle chiaramente nominate e non creare worktree dentro il
repository. Copiare solo configurazioni locali non versionate strettamente
necessarie; non duplicare credenziali senza motivo. Installazioni e output
rimangono separati.

## Sincronizzazione e merge

1. Creare il branch dall'ultimo `origin/main` verificato.
2. Fare fetch regolarmente; sincronizzare prima di chiedere la review finale.
3. Su un branch personale breve, usare `git rebase origin/main`. Se era già
   pubblicato, usare soltanto `git push --force-with-lease`, mai `--force`.
4. Su un branch condiviso, non riscrivere commit altrui: integrare `main` con un
   merge esplicito oppure coordinare prima il rebase.
5. Risolvere i conflitti nel branch, rieseguire i gate pertinenti e lasciare che
   la CI controlli il nuovo SHA.
6. Usare squash merge come default. Merge commit solo per una sequenza che deve
   conservare intenzionalmente la propria storia, con motivazione nella PR.
7. Cancellare il branch remoto dopo il merge; rimuovere il worktree e poi il
   branch locale.

```bash
git worktree remove ../app-relax-fix-resume
git branch -d fix/background-resume
git worktree prune
```

Non rebasare con file non committati e non usare stash come deposito a lungo
termine. Prima di operazioni sulla storia, verificare branch, worktree e scope.

## Evitare conflitti e contaminazione

- concordare chi tocca i file hotspot: controller audio, configurazione Expo,
  manifest, lockfile e workflow;
- dividere per slice verticale quando ogni slice è verificabile, non assegnare a
  più lavori contemporanei lo stesso modulo centrale;
- integrare presto contratti condivisi piccoli prima delle implementazioni;
- tenere aggiornamenti dipendenze e riformattazioni in PR dedicate;
- non usare `git add .` o `git add -A`: aggiungere soltanto percorsi revisionati;
- confrontare sempre lo scope con `git diff --stat` e `git diff --name-status`;
- evitare PR stacked; usarle solo per dipendenze reali, indicando chiaramente la
  base temporanea e ritargettando dopo il merge della PR precedente.

## Integrazione con CI e review

Ogni PR verso `main` deve superare:

1. `PR policy / Policy gate`: branch, titolo, quattro sezioni descrittive e
   limite per le PR molto grandi;
2. `CI / Required gate`: static analysis e ratchet, test/coverage, sicurezza,
   confini prodotto ed export;
3. review umana, conversazioni risolte e branch aggiornato;
4. Code Owner review per pipeline, release, quality gate e configurazioni.

Il template distingue motivazione, modifica, prove, rischio e rollback. Un test
locale riduce il feedback remoto, ma solo i check sullo SHA della PR valgono per
il merge. Dopo il merge, il tag di release può riferirsi soltanto a uno SHA di
`main` che abbia già una CI verde.

## Bootstrap del repository attuale

[F] Il remoto è ancora privo di `main`, mentre il checkout locale contiene una
milestone ampia e cambi di infrastruttura non ancora pubblicati. Il bootstrap
deve prima creare `main` dall'ultimo commit locale pulito e già verificato, poi
attivare le protezioni. Il lavoro accumulato passa quindi in una PR dedicata,
inevitabilmente grande: va revisionato per scope, etichettato
`large-pr-approved` e verificato integralmente. Non costituisce un precedente
per le feature successive.

Dopo il bootstrap: proteggere `main`, abilitare cancellazione automatica dei
branch merged, richiedere i due status check e Code Owner review. La procedura
non è operativa finché queste impostazioni remote non sono state applicate.
