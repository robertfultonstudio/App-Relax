# App Relax - Istruzioni operative

## Ambito

Questo repository contiene una vera app mobile consumer iOS/Android basata su React Native ed Expo. La milestone attiva e una sola vertical slice: `Deep Sleep 432`, inizialmente con tre stem placeholder, binaural beat e brown noise generati.

Il materiale in `output/strategia-app-audio/` e `tmp/strategia-app-audio/` appartiene a un flusso parallelo e non va modificato, spostato, cancellato, staged o assorbito senza istruzione esplicita.

## Ordine delle fonti

1. Istruzioni dell'utente e policy globale della sessione.
2. Questo file.
3. `STATO.md` e `docs/DECISIONS.md`.
4. Specifiche in `docs/`.
5. Codice e test verificati.

In caso di conflitto, fermarsi, registrare il conflitto e non inventare una soluzione.

## Regole non negoziabili

- Consumer first, mobile first; nessuna PWA o web demo come sostituto del prodotto.
- TypeScript strict, Expo SDK 57, React Native 0.86, Expo Router e development build con `expo-dev-client`.
- La UI parla con `AudioSessionController`; non usa direttamente API audio native.
- `AudioEngine` resta indipendente dall'implementazione.
- `tuningLabel`, `carrierHz` e `beatHz` sono concetti distinti.
- Nessun claim medico, terapeutico o clinico.
- Nessun backend, login, billing, community, marketplace o catalogo esteso nella prima milestone.
- Nessun file audio reale oltre `AUDIO TEST PACK 01` prima del relativo gate.
- Non dichiarare background audio o qualita sonora validati senza prove su telefono reale.
- Usare le etichette `[F]`, `[I]`, `[U]`; quando manca evidenza scrivere `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
- Nessun nuovo Mac o altro acquisto hardware e un prerequisito di progetto.

## Workflow

Prima di cambiare file, leggere `STATO.md`, `docs/DECISIONS.md` e `git status --short --branch`. Mantenere modifiche piccole e reversibili. Non usare staging globale: aggiungere solo percorsi confermati.

Runtime riproducibile: Node `22.23.1` e pnpm `11.16.0`, registrati in `.nvmrc`, `.node-version`, `package.json` ed `eas.json`. Il Node di sistema non va usato. I controlli in questo ambiente possono usare il runtime Node isolato fornito da Codex.

Comandi locali autorizzabili senza toolchain nativa:

```bash
pnpm install --frozen-lockfile
pnpm peers check
pnpm lint
pnpm typecheck
pnpm test
pnpm audio:validate-placeholders
pnpm config:validate
pnpm expo:doctor
pnpm exec expo install --check
pnpm exec expo export --platform ios
pnpm exec expo export --platform android
```

`expo run:*`, `eas login`, `eas init`, `eas device:create`, `eas build`, upload, submission e registrazione dispositivi richiedono approvazione esplicita. Android e iOS sono gate cloud separati; non usare `--platform all`.

## Definition of Done

Il gate repository/non nativo e chiuso solo quando:

- Home, lista Sleep, player, Settings e Legal sono implementati;
- esiste un solo preset `Deep Sleep 432`;
- tre stem placeholder separati, binaural e brown noise sono cablati senza playback duplicato;
- gain, mute, loading, error e fade sono esposti per ogni sorgente;
- timer assoluto, fade, stop nativo schedulato e persistenza minima sono coperti da test;
- lint, typecheck, test, validatori, Expo Doctor ed export Metro iOS/Android sono verdi;
- `eas.json`, config plugin e identificativi sono validati offline;
- nessun segreto o asset audio reale e presente.

La milestone prodotto non e completa finche una development build cloud o locale non viene installata e provata. I test su telefono reale restano obbligatori per speaker, cuffie/Bluetooth, background/lock-screen, interruzioni, latenza, batteria e qualita sonora. Solo dopo questo smoke test si puo aprire `AUDIO TEST PACK 01`.

## Autorizzazioni

Sono richieste istruzioni esplicite prima di installazioni globali o di sistema, credenziali/account, acquisti, project linking EAS, build cloud, upload, registrazione dispositivi, deploy, pubblicazione, push, invii esterni, cancellazioni o migrazioni irreversibili. Commit locale, push e pull request sono azioni distinte; non inferire l'una dall'altra.
