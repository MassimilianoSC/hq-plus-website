# Controlli di sicurezza

I form e la demo passano dalle Cloud Functions. Il browser non ha accesso diretto alle
raccolte Firestore dei lead o ai contatori interni.

## Richieste dal browser

- Il client usa gli endpoint HTTP già pubblicati da Firebase Hosting.
- Il client invia il token App Check quando disponibile; le Functions lo verificano in
  produzione e saltano tale controllo solo nell'emulatore locale.
- La validazione, il rate limit e la scrittura Admin SDK rimangono nel backend secondo il
  comportamento corrente.
- Le raccolte `leads`, `demo_leads` e `rate_limits` negano tutte le operazioni dai client.
  Le Cloud Functions continuano a scrivere con Admin SDK, che non applica le regole
  Firestore client.
- Il proxy Astro in sviluppo inoltra solo le route per le quali esiste un rewrite funzione
  in `firebase.json`; non apre una route generica al backend.

## Configurazione e dati

- Le variabili `PUBLIC_*` sono pubbliche per definizione. Nessun segreto server deve
  essere inserito in `apps/site/.env*` o nel bundle.
- Il client non deve iniziare nuove scritture dirette a Firestore.
- Gli ambienti locali usano gli emulatori. Le chiamate alle API reali richiedono una
  configurazione esplicita e non sono il flusso di sviluppo predefinito.

## Regole Firestore

Le scritture pubbliche dirette a `leads` e `demo_leads` sono state chiuse: il sito usa
endpoint HTTP con validazione e rate limit lato server. Anche letture e scritture su
`rate_limits` sono negate ai client. Non aggiungere scritture client per aggirare queste
regole; per nuovi flussi usare una Cloud Function con validazione e limiti appropriati.

## Audit dipendenze locale

Verifica del 17 novembre 2026: `npm audit --omit=dev --workspace @hq-plus/site` segnala
zero vulnerabilità runtime. `npm audit` segnala inoltre 19 vulnerabilità moderate nella
toolchain di sviluppo, incluse dipendenze transitive di Firebase CLI. Il workspace Functions
segnala 12 vulnerabilità runtime (1 high, 10 moderate, 1 low), tra cui diverse in Nodemailer,
Firebase Admin e dipendenze transitive. L'audit npm corrente non propone correzioni
compatibili per i pacchetti segnalati. Non è stato forzato un aggiornamento major: richiede
revisione mirata del trasporto email e dei client Firebase, con verifiche funzionali prima
del rilascio.
