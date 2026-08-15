# Test su telefono Android fisico

## Scopo e confine

Questo percorso prova il checkout M3 corrente su un telefono Android via USB,
usando il Dev Client gia compilato e Metro locale. Non esegue Gradle,
`expo run:android`, EAS, upload, submission o pubblicazione.

Il Dev Client in `dist/eas/` e precedente alla UI M3, ma la combinazione
**Dev Client + Metro** carica JavaScript e asset correnti del checkout. L'APK
standalone `app-relax-preview-android-c3a39414.apk` incorpora invece la UI
pre-M3 e non va usato per approvare la shell `Product Shell`.

## Percorsi gia pronti

```text
Repository: /Users/RF/Documents/ChatGPT/New project
ADB:        /Users/RF/Library/Android/sdk/platform-tools/adb
Dev Client: /Users/RF/Documents/ChatGPT/New project/dist/eas/app-relax-development-android-73cd8dfc.apk
Package:    com.robertfultonstudio.apprelax
Metro USB:  127.0.0.1:8081 tramite adb reverse
```

Il wrapper di progetto e `scripts/android-physical-device.sh`. Risolve questi
percorsi senza modificare globalmente `PATH`, `ANDROID_HOME` o la shell.

## Preparazione una tantum sul telefono

1. In **Impostazioni > Informazioni sul telefono**, toccare sette volte
   **Numero build** per abilitare le Opzioni sviluppatore.
2. In **Opzioni sviluppatore**, attivare **Debug USB**. Non serve sblocco OEM.
3. Collegare al Mac un cavo USB dati, sbloccare il telefono e scegliere
   **Trasferimento file** se Android lo chiede.
4. Accettare sul telefono la finestra **Consenti debug USB** e, se il device e
   personale, selezionare **Consenti sempre da questo computer**.

## Sequenza operativa

Terminale 1:

```bash
cd "/Users/RF/Documents/ChatGPT/New project"
bash scripts/android-physical-device.sh check
bash scripts/android-physical-device.sh install
bash scripts/android-physical-device.sh metro
```

Lasciare Metro aperto. In un secondo terminale:

```bash
cd "/Users/RF/Documents/ChatGPT/New project"
bash scripts/android-physical-device.sh open
```

Se Expo mostra il Dev Launcher invece dell'app, scegliere il server locale
`http://127.0.0.1:8081`; il reverse USB rende quell'indirizzo raggiungibile dal
telefono. Per vedere i log nativi e JavaScript:

```bash
bash scripts/android-physical-device.sh logs
```

## Fine prova

Fermare Metro con `Ctrl-C`, poi:

```bash
bash scripts/android-physical-device.sh cleanup
```

Il cleanup ferma l'app, rimuove soltanto il reverse `tcp:8081` e spegne il
server ADB. Non disinstalla l'app e non cancella i suoi dati.

## Smoke test minimo

- annotare modello, Android e ABI restituiti da `check`;
- Home M3: Yoga, Massage, Relax, Meditation, Sleep e Focus visibili in ordine
  outcome-first; tutte le azioni sono `IN PRODUCTION` e prive di audio;
- tab Rituals, Yoga e Soundscapes navigabili; nessun tab apre il player;
- Settings -> `Audio Test — Test only` -> player tecnico, con confine
  `TEST ONLY` chiaramente visibile;
- nel solo Audio Test: Play udibile entro un tempo ragionevole, timer in
  decremento, Pause/Resume, volume e mute senza playback duplicato;
- speaker, cuffie cablate se disponibili e Bluetooth;
- blocco schermo/background per almeno cinque minuti;
- chiamata/notifica o cambio route audio e rientro nell'app;
- ascolto lungo, loop percepito, glitch, temperatura e consumo batteria.

Installazione, launch e Play non certificano da soli qualita, Bluetooth,
background, interruzioni, sessione lunga, memoria o batteria. Finche non vengono
provati sul telefono: `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.

## Problemi comuni

- `unauthorized`: sbloccare il telefono e accettare la chiave RSA; se la
  finestra non appare, revocare le autorizzazioni Debug USB e ricollegare.
- nessun device: provare un altro cavo/porta e verificare che sia un cavo dati.
- piu telefoni: impostare `APP_RELAX_ANDROID_SERIAL=<seriale>` usando il valore
  mostrato da `adb devices -l`.
- Dev Client senza server: rieseguire `reverse`, verificare che Metro sia
  aperto e poi eseguire `open`.
- app standalone con vecchia UI: e stata installata la preview pre-M3; usare il
  Dev Client indicato sopra insieme a Metro.
