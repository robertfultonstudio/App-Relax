# M6 — quattro draft 12ui, non approvati

16 settembre 2026. Skill utilizzata: 12ui-design. Ambito: riferimenti Home,
non codice, audio, PWA o pubblicazione. Autorizzazione: quattro varianti,
tetto0,122 USD, solo immagine Home; conversione esclusa.

## Prove

[F] Un solo run `crt-fa836794bdaa7e9f3239bc61f4f63a21a2e9579c`, concluso
alle19:29:52 UTC. Kit `tmp/m6-12ui-authorized/`: README, improve.json,
journal.jsonl, spend.json. Capture/draft settled; pick/convert/plan non richiesti.
Input `output/m6-design-review/01-home.png`, SHA-256
`dbbd21e9e8b8509a87925e9684a5423f9706e116f041f0603b0593555af692e2`.
La sorgente è un concept generato, non uno screenshot dell'app funzionante.

Ledger acquisto, riportato dal kit (il README arrotonda il tetto):

| purchase                                       | stage | invocation                                          | price ceiling         |
| ---------------------------------------------- | ----- | --------------------------------------------------- | --------------------- |
| `crt-fa836794bdaa7e9f3239bc61f4f63a21a2e9579c` | draft | `improve` pid70224, started2026-09-16T19:28:36.472Z | $0.12 (stage ceiling) |

[F] Tetto esatto in improve.json:0,122 USD. spend.json: fundingSource sponsored,
chargedMicros0, un run, nessuna conversione. Provider cost non disponibile;
non confonderlo con l'addebito all'utente, riportato come0 USD.

## Ispezione visiva reale

[F] Tutti e quattro i PNG sono1536×1024, landscape, non la viewport mobile
390×844 richiesta nel brief. Il manifest registra viewport CLI1440×900;
non è prova di un layout responsive. Non rigenerato né convertito.

| Variante | Esito                                                                                                                                     |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A        | Sei attività presenti, ma Hatha duplicata anche tra le attività; Meditation molto dominante.                                              |
| B        | Relax omessa e sostituita da Hatha; artwork Yoga non coerente col riferimento. Non conforme.                                              |
| C        | Sei attività presenti, Hatha separata nel footer. La più coerente come gerarchia, ma card arrotondate e formato non mobile da correggere. |
| D        | Sei attività presenti; gerarchia molto sbilanciata verso Meditation, footer mescola resume e navigazione.                                 |

[I] C è una base di discussione, non una selezione né approvazione automatica.
Palette e pittura sono coerenti; nessuna variante supera tutti i vincoli.
Non certificati contrasto raster, target touch, reflow o accessibilità.

Copie integrali conservate in `output/m6-design-review/12ui/`:

| File  | SHA-256                                                          |
| ----- | ---------------------------------------------------------------- |
| A.png | cf14bb1dac661267bb65126e0fb20bf7a9ba72a4d78600e601a0427603be01a3 |
| B.png | 1a3b731655980131b9dd1416aefa6cff6a58413f90180ed4e745ac5cfdcc63b6 |
| C.png | ebb0d6419f27d4d9fd3135fb14fb1a1dcbde3a8747033b8d516ad59cf6b226e2 |
| D.png | cf8b266070784fcd149355142826313d5807d66655206718d1b5e1f69c69aaff |

[U] Gate: scelta visuale e correzione mobile, consolidamento Figma e approvazione
prima del codice. Nessuna nuova generazione/conversione autorizzata da questa
consegna. Nessun test app rilanciato: questo incremento contiene solo riferimenti
e documentazione, non una modifica al prodotto. Nessun commit, build o deploy.
