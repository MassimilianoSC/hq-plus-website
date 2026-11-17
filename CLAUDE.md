# Istruzioni di progetto

Per le nuove attività sul sito, leggere prima `docs/project-context.md`, poi il README e le
guide pertinenti in `docs/`. Leggere in particolare la guida di sicurezza prima di
modificare configurazione, deployment o flussi di dati.

## Stack e comandi

- Sito: Astro con output statico in `apps/site/dist`; React si usa solo per le isole
  interattive.
- Backend: Firebase Cloud Functions 2nd gen, Node.js 22, regione `europe-west8`.
- Database: Firestore in `eur3`; progetto Firebase predefinito `hq-flow-dev`.
- Sviluppo: Node.js `22.23.4` (Node 22), npm.

Comandi dalla radice:

```powershell
npm install
npm run install:functions
npm run dev
npm run emulators
npm run check
npm run build
npm run preview
```

## Invarianti di sicurezza

- Non cambiare `functions/index.js`, `functions/lib/mailer.js`, `firestore.rules`,
  `firestore.indexes.json` o i segreti Firebase durante un refactor del frontend.
- Conservare i nomi e i payload degli endpoint: `submitLead`, `extractDocument`,
  `suggestAutomations` e `submitDemoLead`.
- Conservare App Check in produzione, l'allowlist CORS, validazione server, rate limit,
  IP anonimizzati, TTL e sanitizzazione dei log.
- Non aggiungere scritture dirette Firestore dal sito. I dati passano dagli endpoint
  esistenti e dalle regole correnti.
- Le variabili `PUBLIC_*` finiscono nel client bundle: possono contenere solo valori
  pubblici. Credenziali SMTP e service account restano server-side.
- Il proxy locale deve derivare progetto, route e region da `.firebaserc` e `firebase.json`;
  non introdurre un endpoint proxy generico.
- Non eseguire `firebase deploy` durante il lavoro locale.
- Non eseguire `git push` senza una richiesta esplicita.

## Convenzioni frontend

- `pages/` definisce le route; `layouts/` la struttura HTML e i metadati.
- `components/brand`, `layout`, `sections` e `interactive` mantengono responsabilità
  distinte.
- `lib/api`, `lib/firebase` e `lib/motion` raccolgono funzioni per dominio; evitare un
  contenitore generico `utils`.
- Token di colore e stili globali vivono in `src/styles`; gli stili locali restano vicini
  ai componenti Astro quando saranno introdotti.
- Raster pubblicati in WebP, vettoriali in SVG ottimizzato. Video e scene 3D vivono in
  `public/media`.

## Protezioni operative

- L'estrazione PDF carica `pdf-lib` in modo lazy; non importarlo staticamente nell'entry
  principale.
- Caricare la scena Spline solo dopo l'azione esplicita dell'utente e rispettare
  `prefers-reduced-motion`.
- Non registrare PDF, prompt, contenuti estratti, email o IP grezzi nei log.
