# Sviluppo locale

## Requisiti

- Node.js `22.23.4` (Node 22, come il runtime Firebase Functions).
- npm 11 o compatibile con il lockfile di root.
- Firebase CLI, installata nel progetto tramite `npm install`.
- Java JDK 21 o superiore per il Firestore Emulator.

Su Windows, se è installato nvm-windows:

```powershell
nvm install 22.23.4
nvm use 22.23.4
node --version
```

## Installazione iniziale

Dalla radice del repository:

```powershell
npm install
npm run install:functions
npm run install:scripts
```

## Sito con aggiornamento live

Terminale 1:

```powershell
npm run dev
```

Aprire `http://127.0.0.1:4321`.
La pagina si carica anche senza emulatori; per provare i form occorre avviare il secondo
terminale qui sotto.

Terminale 2, per usare gli endpoint locali:

```powershell
npm run emulators
```

Le route HTTP definite in `firebase.json` sono inoltrate dal server Astro al Functions
Emulator. L'emulatore Functions salta la verifica App Check come previsto dal codice;
gli endpoint continuano ad applicare le altre verifiche implementate.

### Segreti locali per i form

Per provare il salvataggio dei form senza spedire notifiche email, creare
`functions/.secret.local` con questi valori vuoti:

```dotenv
GMAIL_USER=
GMAIL_APP_PASSWORD=
LEAD_NOTIFY_TO=
```

Il file è ignorato da Git. Il trigger email registra lo skip e i lead rimangono nel
Firestore Emulator; consultarli da `http://127.0.0.1:4000/firestore/default/data`.
Per verificare email, usare credenziali SMTP di test e una casella controllata.

Le funzioni `extractDocument` e `suggestAutomations` usano Vertex AI, che non viene
emulato. Se l'ambiente dispone di credenziali Google Cloud valide, le richieste possono
raggiungere il servizio reale; usare file sintetici durante le prove.

## Build e anteprima statica

```powershell
npm run check
npm run build
npm run preview
```

La build statica è in `apps/site/dist`. `npm run preview` serve la build, senza hot reload.
Per provare la build insieme ai rewrite Firebase:

```powershell
npm run emulators:hosting
```

Aprire `http://127.0.0.1:5000`.

## Fermare i processi

Premere `Ctrl+C` nel terminale in cui gira ciascun server o emulatore.

## Debug

- Dev server Astro: terminale che esegue `npm run dev`.
- Funzioni: output di `npm run emulators`.
- Emulator UI: `http://127.0.0.1:4000` quando attiva nella configurazione Firebase.
- Le chiamate HTTP possono essere controllate dal pannello Network del browser.
- Gli override `PUBLIC_*_URL` sono facoltativi; senza override si usano le route same-origin.

## Variabili pubbliche

Copiare `apps/site/.env.example` in `apps/site/.env.local` solo se serve configurare
variabili locali. I valori `PUBLIC_*` sono inclusi nel bundle e non devono mai contenere
segreti server. La site key App Check è una chiave pubblica; password SMTP, service
account e token privati restano nelle configurazioni server delle Functions.

Per dettagli ufficiali su [Java e Local Emulator Suite](https://firebase.google.com/docs/emulator-suite/install_and_configure)
e sulla [configurazione di variabili e segreti](https://firebase.google.com/docs/functions/config-env),
consultare la documentazione Firebase.
