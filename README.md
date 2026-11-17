# HQ Plus website

Sito corporate HQ Plus realizzato con Astro: la pagina è statica e React è caricato solo
per le sezioni interattive. Le Firebase Cloud Functions restano in `functions/` e gestiscono
invio lead e demo documentale.

## Requisiti

- Node.js `22.23.4` (Node 22, allineato al runtime delle Functions).
- npm.
- Firebase CLI, inclusa nelle dipendenze del repository.
- Java JDK `21+` per usare l'emulatore Firestore.

Su Windows, con nvm-windows, selezionare la versione così:

```powershell
nvm install 22.23.4
nvm use 22.23.4
node --version
```

L'ultima riga deve mostrare `v22.23.4`.

## Prima installazione

Eseguire dalla radice del repository:

```powershell
npm install
npm run install:functions
npm run install:scripts
```

## Sviluppo locale

Terminale 1:

```powershell
npm run dev
```

Aprire `http://127.0.0.1:4321`. Per provare i form e gli endpoint con Firebase Emulator,
aprire un secondo terminale:

```powershell
npm run emulators
```

Astro inoltra al Functions Emulator le route HTTP già configurate in `firebase.json`.
I dati restano negli emulatori locali. La Emulator UI è disponibile su
`http://127.0.0.1:4000`.

Per provare il salvataggio dei form senza spedire notifiche email, creare
`functions/.secret.local` con `GMAIL_USER=`, `GMAIL_APP_PASSWORD=` e `LEAD_NOTIFY_TO=`.
I lead restano nell'emulatore Firestore. Il file è escluso da Git. Per testare le email,
usare credenziali SMTP di test e una casella di destinazione controllata.

Le funzioni di estrazione e suggerimento usano Vertex AI, che non viene emulato. Se
l'ambiente dispone di credenziali Google Cloud valide, le richieste possono raggiungere
il servizio reale; durante le prove usare documenti sintetici.

## Controllo e build

```powershell
npm run check
npm run build
npm run preview
```

La build statica viene generata in `apps/site/dist`; `preview` la serve su
`http://127.0.0.1:4321`.

Per visualizzare la build tramite Firebase Hosting Emulator e verificare i rewrite:

```powershell
npm run emulators:hosting
```

Aprire `http://127.0.0.1:5000`.

Per fermare qualsiasi server locale, usare `Ctrl+C` nel terminale corrispondente.

## Struttura

```text
apps/site/       Sito Astro, contenuti, componenti e asset
functions/       Cloud Functions Firebase e relative dipendenze
docs/            Architettura, sviluppo locale e sicurezza
scripts/         Strumenti di progetto
firestore.*      Regole e indici Firestore
firebase.json    Hosting, rewrite ed emulatori
```

## Documentazione

- [Contesto e passaggio di consegne](docs/project-context.md)
- [Architettura](docs/architecture/overview.md)
- [Sviluppo locale](docs/development/local.md)
- [Guida operativa e passaggio di consegne](docs/development/implementation-guide.md)
- [Controlli di sicurezza](docs/security/controls.md)
- [Asset e logo](docs/brand/README.md)

## Variabili d'ambiente

La configurazione client Firebase già in uso resta pubblica e invariata. Per App Check
in produzione, impostare `PUBLIC_RECAPTCHA_SITE_KEY` in `apps/site/.env.local` o nella
configurazione di build. Non inserire mai password, service account o altri segreti in
variabili `PUBLIC_*`. `PUBLIC_SITE_URL` e `PUBLIC_ALLOW_INDEXING=true` si impostano solo
quando è confermato il dominio definitivo; senza entrambi il sito è marcato `noindex`.

## Backend e sicurezza

Le Functions mantengono i nomi, le regioni, i controlli App Check, CORS, rate limit e
validazioni correnti. Le regole Firestore negano accesso diretto alle raccolte lead e
rate-limit: il sito invia i dati alle Functions, che scrivono con Admin SDK. Per i punti
ancora da configurare prima del rilascio, consultare
[Controlli di sicurezza](docs/security/controls.md) e
[contesto progetto](docs/project-context.md).

Il lavoro corrente è locale: non eseguire push Git o deploy Firebase senza una richiesta
esplicita.
