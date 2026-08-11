# Contratto asset audio

## Scopo

Questo contratto definisce come nominare, validare e integrare gli stem reali dopo il gate. I placeholder iniziali sono autoprodotti, chiaramente marcati e servono solo a testare caricamento, loop, mix, fade, timer e lifecycle.

## AUDIO TEST PACK 01

File richiesti:

1. `SLEEP_DRONE_001.wav`
2. `SLEEP_AMBIENCE_001.wav`
3. `SLEEP_TEXTURE_001.wav`

Specifiche obbligatorie:

- WAV PCM;
- 24 bit;
- 48 kHz;
- stereo;
- circa 180 secondi;
- loop continuo;
- nessun binaural beat incorporato;
- nessun white, pink o brown noise incorporato;
- nessun limiter aggressivo.

## Contenuto e responsabilita

- `DRONE`: fondazione tonale stabile con margine dinamico.
- `AMBIENCE`: field recording o spazio organico senza eventi dominanti al punto di loop.
- `TEXTURE`: dettaglio leggero che non maschera gli altri layer.
- Ogni file deve essere fornito con conferma di titolarita/licenza e permesso d'uso nell'app.
- Nessun file deve contenere dati personali, watermark vocali o materiale non autorizzato.

## Validazione automatica prevista

- nome e numero esatto dei file;
- contenitore/codec PCM WAV;
- sample rate, bit depth, canali e durata;
- file leggibile e non corrotto;
- peak, true peak se disponibile, RMS/LUFS e DC offset;
- silenzio anomalo, clipping e sample non finiti;
- confronto tra testa e coda per individuare discontinuita di loop;
- hash SHA-256 e manifest deterministico.

La prima misurazione del pack e registrata in `assets/audio/test-pack-01/manifest.json`. I tre file superano formato, integrita, clipping, DC e confronto testa/coda. Questi valori costituiscono la baseline del pack, non soglie universali per asset futuri. Loudness percepito, true peak e loop click restano `NON DETERMINATO — EVIDENZA INSUFFICIENTE` fino all'ascolto e al test su telefono.

## Manifest

Il manifest deve registrare almeno:

- schema version;
- asset id e ruolo;
- filename e SHA-256;
- codec, bit depth, sample rate, canali, durata;
- peak/RMS/LUFS disponibili;
- punti di loop;
- provenienza e licenza;
- data di validazione e tool/versione;
- esito automatico e note di ascolto.

## Placeholder

I placeholder sono generati localmente con codice deterministico e non derivano da registrazioni o opere di terzi. Restano nel repository come fixture tecniche, ma sono esclusi dagli archivi EAS dopo l'integrazione degli asset reali e non sono piu referenziati dal preset.

## Gate di integrazione

Dopo la consegna del pack:

1. validazione automatica;
2. manifest;
3. integrazione nel solo preset `Deep Sleep 432`;
4. test di loop, gain, fade, timer e background;
5. checklist di ascolto su telefono reale e cuffie;
6. approvazione umana prima di qualsiasi ulteriore richiesta di asset.
