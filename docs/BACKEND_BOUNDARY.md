# Confine client/server e percorso infrastrutturale

Stato: analisi del 15 settembre 2026. Scopo: preservare il prodotto offline e
aggiungere infrastruttura solo quando un requisito richiede autorità condivisa,
distribuzione remota o protezione di segreti.

## Decisione corrente

[F] Il prodotto nativo può funzionare senza un backend applicativo: UI,
navigazione, planner deterministico, timer, motore audio, crossfade, preferenze,
cronologia locale, verifica SHA-256, import nel private storage e playback
offline appartengono al client. Nessun login, billing, analytics o database
remoto è richiesto dalla milestone M5.

[F] L'APK interna usa un kit audio importato localmente. Il catalogo da circa
2,6 GiB resta fuori da Git, APK ed EAS. Questa soluzione prova il client e
l'offline, ma l'import manuale non è ancora una distribuzione consumer del
catalogo.

[F] La PWA privata corrente usa hosting, controllo accessi e catalogo remoto per
la review. Sono servizi esterni di consegna/prova, non il backend runtime della
futura app nativa; la loro esistenza non dimostra download mobile o offline.

[I] Il primo bisogno infrastrutturale probabile per una release commerciale è
la consegna degli audio. Può essere risolto con object storage e CDN, senza
introdurre subito API, account o database.

## Che cosa resta nel client

Rimangono client-side anche dopo l'introduzione di un server:

- rendering UI e accessibilità;
- scheduling e graph audio real-time;
- planner, timer, fade e gestione delle interruzioni;
- download in staging, verifica di byte/hash e promozione atomica;
- cache, riproduzione offline e preferenze non condivise;
- fallback sicuro quando la rete manca.

Spostare queste funzioni sul server aumenterebbe latenza e fragilità senza
creare valore. Il server deve descrivere e autorizzare contenuti; il dispositivo
deve continuare a riprodurli.

## Quando serve davvero un backend

| Funzione futura                         | Necessità                          | Componente minimo                                               | Cosa rende possibile                                                |
| --------------------------------------- | ---------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| Catalogo audio pubblico remoto          | Ragionevole                        | Object storage + CDN + manifest versionato                      | Download affidabile, cache, pacchetti aggiornabili                  |
| Catalogo protetto/licenziato            | Necessaria                         | Auth/entitlement API + URL firmati brevi                        | Accesso per utente/piano e revoca                                   |
| Account e sync tra dispositivi          | Necessaria                         | Auth + database + API                                           | Preferenze, download e session history condivisi                    |
| Abbonamenti                             | Necessaria per autorità affidabile | Store billing + verifica entitlement/webhook, oppure RevenueCat | Restore purchase, accesso multipiattaforma, stato abbonamento       |
| Guided con audio fisso                  | No                                 | CDN/statico                                                     | Nuove guide come contenuti scaricabili                              |
| Catalogo/CMS e remote config            | Ragionevole                        | Database/CMS o file firmato                                     | Pubblicazione senza nuova app, rollout graduale                     |
| Push personalizzate                     | Necessaria                         | Scheduler/API + APNs/FCM                                        | Messaggi legati a stato o account; i reminder locali restano client |
| Analytics e crash reporting             | No server proprio                  | Servizio managed con consenso                                   | Funnel, retention, errori in produzione                             |
| Esperimenti A/B                         | Ragionevole                        | Remote config + assegnazione persistente                        | Test controllati e kill switch                                      |
| Upload/community                        | Necessaria                         | Storage, API, moderazione, audit e cancellazione                | Contenuti utente e condivisione                                     |
| Generazione AI o API con chiavi segrete | Necessaria                         | API server/edge, rate limit e budget                            | Protezione chiavi, quote, sicurezza e controllo costi               |

Un file pubblico su CDN può essere copiato. URL firmati e autenticazione
controllano l'accesso, ma non sono DRM. Se i diritti richiedessero protezioni
più forti, il requisito andrebbe definito prima dell'architettura.

## Che cosa farà concretamente il server

Quando sarà introdotto, il perimetro minimo sarà:

1. autenticare l'utente solo se esistono funzioni account;
2. mantenere lo stato autorevole degli entitlement;
3. pubblicare un manifest catalogo versionato e firmato con byte, SHA-256,
   compatibilità e URL;
4. emettere URL di download a vita breve per contenuti protetti;
5. ricevere webhook degli store e riconciliare acquisti/rimborsi;
6. sincronizzare solo dati scelti dall'utente;
7. applicare rate limit, idempotenza, audit e revoca;
8. fornire un percorso amministrativo separato per pubblicare un pacchetto.

Le chiavi store, firma manifest, API di terze parti e service credentials non
devono mai essere incluse nell'app.

## Architettura evolutiva proposta

### Fase 0 — adesso: nessun backend runtime

App nativa offline, catalogo importato e stato locale. Si completa prima il
valore del prodotto, il test su telefono e il catalogo approvato. Costo runtime
backend: `0`; EAS, account store e hosting di review restano voci separate.

### Fase 1 — consegna audio

Usare object storage versionato con CDN e un manifest immutabile:

```text
app -> catalog-v3.json -> pacchetto/asset content-addressed
                         filename: sha256.ext
                         verify -> staging -> private storage -> offline play
```

Per contenuti pubblici bastano file statici. Per contenuti protetti, aggiungere
una piccola Edge Function/Worker che verifica un entitlement e restituisce URL
firmati. Il client già separa `PackageSource`, store e verifica, quindi la fonte
remota può essere aggiunta senza riscrivere il motore audio.

### Fase 2 — account e ricavi

Solo quando i test commerciali giustificano login o abbonamento:

- provider Auth gestito;
- Postgres gestito per utenti, catalogo ed entitlement;
- poche Edge Functions per webhook, manifest e URL firmati;
- RevenueCat oppure verifica ricevute store gestita;
- object storage/CDN separato per i byte audio.

Separare audio e dati evita di trasferire file grandi attraverso l'API. Le
funzioni devono essere stateless; database e manifest mantengono lo stato
autorevole. Questo confine permette di cambiare provider senza toccare playback
e dominio client.

### Fase 3 — servizio custom, solo con un motivo misurabile

Un'API su container e un database dedicato hanno senso con logica complessa,
carichi costanti, esigenze di portabilità, code/processi audio o limiti
documentati dei servizi managed. Non sono necessari per l'MVP.

## Alternative managed e trade-off

Prezzi indicativi verificati sui listini pubblici il 15 settembre 2026, in USD,
al netto di imposte, account store e consumo eccedente. Vanno ricontrollati al
gate di acquisto.

| Opzione                         | Quando preferirla                                                 | Costo iniziale indicativo                                                                                       | Operazioni e rischi                                                              |
| ------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Nessun backend                  | Catalogo incorporato/importato, nessun account                    | $0 runtime                                                                                                      | Minima superficie di attacco; nessun sync o controllo remoto                     |
| Cloudflare R2 + CDN             | Audio pubblico o URL firmati, egress elevato                      | Free tier: 10 GB-month, 1M Class A e 10M Class B/mese; Standard da $0,015/GB-month, egress Internet R2 gratuito | Bassa manutenzione; richieste, Worker e abuso vanno limitati                     |
| Cloudflare Worker               | Manifest firmato o entitlement sottile                            | Free 100.000 richieste/giorno; Paid da $5/mese più uso                                                          | Patching ridotto; runtime e vendor lock-in edge                                  |
| Supabase                        | Auth, Postgres, RLS e funzioni in un unico stack                  | Free per sviluppo; Pro da $25/mese più uso                                                                      | Molto rapido; RLS, backup, egress e limiti progetto vanno governati              |
| Firebase                        | Forte integrazione mobile, push, remote config e sync documentale | Spark senza costo entro limiti; Blaze pay-as-you-go                                                             | Ecosistema maturo; costi letture/egress e portabilità dati richiedono attenzione |
| RevenueCat                      | Abbonamenti iOS/Android senza costruire receipt service           | $0 fino a $2.500 di monthly tracked revenue, poi 1%                                                             | Riduce webhook/store edge cases; dipendenza e costo percentuale                  |
| API/container custom + Postgres | Logica o scale non coperte dai managed                            | Variabile; compute, DB, storage, monitoring e backup separati                                                   | Massimo controllo, massimo onere di patch, incidenti e reperibilità              |

Per i circa 2,6 GiB attuali, il solo volume memorizzato rientrerebbe nel free
tier R2; questo non garantisce costo totale zero, perché traffico applicativo,
operazioni, Worker, log e protezione abuso dipendono dall'uso reale.

## Sicurezza, privacy e manutenzione

**Client-only.** È il perimetro più piccolo. Occorre comunque proteggere file
locali, dichiarare correttamente i dati raccolti dagli SDK e firmare le build.

**Managed/serverless.** Il provider gestisce sistema operativo, alta
disponibilità di base e patch della piattaforma. Il progetto resta responsabile
di RLS/IAM, rotazione segreti, webhook firmati, retention, backup/restore,
budget alert, log senza dati sensibili e risposta agli incidenti.

**Custom.** Oltre a quanto sopra, richiede patch OS/runtime, deploy graduale,
health check, autoscaling, database migration, backup testati, monitoraggio,
on-call e disaster recovery. Senza un bisogno dimostrato, questo costo operativo
distoglie lavoro dal prodotto.

## Gate per introdurre la Fase 1

Non scegliere un provider finché non sono definiti:

- catalogo approvato e diritti di distribuzione;
- pubblico o protetto, dimensione e bitrate dei derivati;
- utenti/download mensili e paesi target;
- requisito offline e politica di aggiornamento/rimozione;
- budget mensile e soglia di arresto;
- dati personali realmente necessari;
- prova di restore, revoca e rollback manifest.

[U] Utenti attesi, traffico, willingness to pay, modello di abbonamento e costo
di delivery per sessione sono `NON DETERMINATO — EVIDENZA INSUFFICIENTE`.
Quindi oggi la decisione corretta è preservare il confine, non creare il server.

Fonti prezzi e capacità: [Expo](https://expo.dev/pricing),
[Cloudflare R2](https://developers.cloudflare.com/r2/pricing/),
[Cloudflare Workers](https://developers.cloudflare.com/workers/platform/pricing/),
[Supabase](https://supabase.com/pricing),
[Firebase](https://firebase.google.com/pricing) e
[RevenueCat](https://www.revenuecat.com/pricing/).
