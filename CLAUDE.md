# CLAUDE.md

Guida per future sessioni Claude su questo repo. Leggi prima di iniziare.

## Stack & decisioni architetturali

- **Frontend**: React via Create React App + craco (NON Vite, niente `import.meta.env`), TailwindCSS + shadcn/ui + lucide-react. Geist font da Google Fonts CDN. Hosting su Firebase Hosting che serve `frontend/build/`.
- **Backend**: Firebase Cloud Functions 2nd gen, Node.js 20. Firestore in `eur3` (multi-region EU). Auth providers inizializzati nel client SDK ma **non esposti in UI** (scelta del PRD). App Check enforced via reCAPTCHA Enterprise.
- **AI**: Vertex AI con `gemini-2.5-pro` per `extractDocument`, multimodale PDF nativo via `inlineData mimeType: application/pdf`. Niente OCR esterno, niente Document AI. **Seconda call** `suggestAutomations` su `gemini-2.5-flash` (output JSON di 3 idee marketing condizionali) auto-fired dopo l'estrazione → card "Spunti di automazione" nella demo. Auto-fire **solo** quando `provider !== "fallback_mock"` (no spunti su mock).
- **Region**: tutto su **`europe-west8`** (Milano), colocato col multi-region `eur3`. La region è hardcoded in **3 punti** che vanno tenuti sincronizzati: `firebase.json` (rewrite hosting), `functions/index.js` (`setGlobalOptions` + `VERTEX_LOCATION`), `frontend/src/lib/firebase.js` (`getFunctions(app, "europe-west8")`).

## Comandi essenziali

```powershell
# Frontend install — il --legacy-peer-deps è OBBLIGATORIO per il conflitto
# react-day-picker@8 (vuole date-fns 2|3) vs date-fns@4 nel progetto.
cd frontend && npm install --legacy-peer-deps

# Functions install
cd functions && npm install

# Build frontend
cd frontend && npm run build

# Deploy in step (consigliato per isolare errori al primo deploy)
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting

# Rigenerare il PDF di esempio per la demo
cd scripts && npm install && npm run build:sample-pdf
```

## Convenzioni non-ovvie

- **Env vars frontend**: `REACT_APP_*` sono inlinate **a build-time** da CRA, non runtime. Modificare `.env.local` non basta: serve un nuovo `npm run build`. Le var sono PUBBLICHE (finiscono nel bundle), niente segreti veri.
- **Sito key reCAPTCHA Enterprise**: in `frontend/.env.local` (gitignorato) come `REACT_APP_RECAPTCHA_SITE_KEY`. Senza, App Check non si inizializza sul client → tutte le chiamate alle Functions tornano 401 in produzione (atteso).
- **App Check enforcement**: attivo SEMPRE in produzione. Skip automatico quando `FUNCTIONS_EMULATOR=true` (helper `verifyAppCheckOrReject` in [functions/index.js](functions/index.js)). In dev locale, debug token attivato in `frontend/src/lib/firebase.js`: la console browser stampa il token al primo run, va whitelistato in Firebase Console → App Check → Manage debug tokens.
- **CORS**: gestito **manualmente** in `applyCors()` con whitelist origini (`hq-flow-dev.web.app`, `firebaseapp.com`, localhost). Non usare `cors: true` su `onRequest`.
- **Rate limit**: `checkRateLimit(anonIp, namespace, max, windowMs)` parametrizzato sia su soglia che su finestra. Bucket calendario UTC (`floor(Date.now() / windowMs)`), non sliding window vero. Configurazioni attive:
  - `submit:5/h/IP` per `submitLead`
  - `extract:3/giorno/IP` per `extractDocument` (cap economico Vertex)
  - `suggest:20/h/IP` per `suggestAutomations` (Flash è economico, limite più permissivo)
  - `demolead:5/h/IP` per `submitDemoLead`
- **Firestore TTL**: i doc `rate_limits` hanno `expiresAt` per la TTL policy. La policy va creata UNA VOLTA in console (link nel README). Senza, la collection cresce indefinitamente.
- **Schema risposta `extractDocument`**: 8 campi `required` (vedi `RESPONSE_SCHEMA` in [functions/index.js](functions/index.js)) + 1 OPZIONALE `dati_strutturati` (free-form OBJECT). Usare quello per dati tabellari/parametrici, non stipare tutto in `note_tecniche`.
- **Schema risposta `suggestAutomations`**: `{ spunti: [{titolo, descrizione, trigger, valore_atteso}] }` × 3 — tutti required, vedi `SUGGEST_RESPONSE_SCHEMA`. Il prompt forza linguaggio condizionale ("potresti...", "uno scenario sarebbe...") e proibisce numeri ROI/marchi/funzioni HQ Flow specifiche per evitare promesse non mantenibili. Sul client il fallimento è **silenzioso**: la card semplicemente non appare (no fallback mock — sarebbe meta-finto).
- **PDF page count**: lazy import di `pdf-lib` via `loadPdfLib()` in [InteractiveDemo.jsx](frontend/src/components/sections/InteractiveDemo.jsx). NON importarlo statico, raddoppia il bundle iniziale (~150 kB gzipped). La cache è module-scoped.
- **`extractFromDocument` con fallback mock**: in [extractDocument.js](frontend/src/lib/extractDocument.js), se la function fallisce/timeout → ricasca sul mock con `_meta.provider = "fallback_mock"`. La UI mostra badge giallo "demo (fallback)". **Il counter del soft gate NON incrementa quando provider == "fallback_mock"** (regola in `run` di InteractiveDemo).

## Soft email gate (funnel demo)

- Stato in `localStorage`: `hqflow_demo_count` (int) e `hqflow_demo_email` (string|null).
- Soglia: 3 estrazioni gratis, poi mini-form email → +5 estrazioni. Hard cap a 8 (banner "esaurito" + CTA contatti).
- **Soft gate è UX nudge, non security boundary**. Chi cancella localStorage o usa incognito riparte da zero — ma il rate limit server-side `extract:3/giorno/IP` lo prende comunque (basato su IP `/24` anonimizzato).
- Stub analytics in console: `demo_email_gate_shown`, `demo_email_submitted`. Quando aggiungeremo GA/Mixpanel/Posthog è una sostituzione di 2 righe.
- Email salvate su collection **`demo_leads`** (rules write-only client, schema strict via `keys().hasOnly`).

## Sicurezza & log sanitization

- **Mai loggare contenuti**: niente PDF bytes, niente prompt text, niente output del modello. Solo metadati: `reqId, anonIp, mode, inputSize, durMs, tokens, esito`. Helper `sanitizeErrMessage` clamp a 200 char, strip newline/tab.
- **IP anonymization**: IPv4 → `/24`, IPv6 → `/48` (helper `anonymizeIp`). Nessun IP grezzo in Firestore.
- **Firestore rules**: production-grade, default deny, `leads`/`demo_leads` write-only client con validazione campi e lunghezze. `rate_limits` chiuso al client, solo Admin SDK.

## Tech debt aperto (in ordine di priorità)

1. **Sito key reCAPTCHA da creare e registrare** (vedi sezione "Setup App Check" del README). Senza, prod risponde 401 su tutto.
2. **Legal pages**: `Privacy`, `Cookie`, `Modello 231`, `Codice Etico` in [Footer.jsx](frontend/src/components/sections/Footer.jsx) hanno `href="#"`. Sito B2B italiano senza Privacy + Cookie è problema GDPR.
3. **`og-image.png` mancante**: referenziato in [index.html](frontend/public/index.html) ma il file non esiste in `frontend/public/`. Anteprima social rotta.
4. **P.IVA placeholder** nel footer.
5. **Sliding window vero per rate limit**: ora è bucket calendario UTC. Per `extract:3/giorno` significa che alle 00:00 UTC il counter si resetta anche dopo 3 estrazioni alle 23:55. Trascurabile per il blast-radius economico.
6. **TTL policy `rate_limits`**: la function scrive `expiresAt` ma manca la policy. Va creata in console (3 click, link nel README). Senza, la collection cresce.
7. **No reset CTA del gate via UI**: per QA/test serve passare da DevTools (`localStorage.removeItem(...)`) o Console Firestore (per cancellare i bucket `rate_limits`). Per MVP ok.
8. **Bypass via incognito/clearLS** del gate client: il rate limit server lo cappa a 3/giorno/IP comunque, ma su QA è frizione (tipico: alzare temporaneamente a 30 in dev).

## Pre-deploy checklist

- [x] Region migrata a `europe-west8`
- [x] Cloud Functions deployate (submitLead, extractDocument, suggestAutomations, submitDemoLead, notifyOnLead, notifyOnDemoLead)
- [x] Firestore rules production-grade deployed
- [x] Hosting deploy
- [x] App Check enforce nel codice
- [x] Soft email gate
- [ ] Sito key reCAPTCHA Enterprise creata e registrata in Firebase App Check
- [ ] `REACT_APP_RECAPTCHA_SITE_KEY` settata e build pubblicato
- [ ] TTL policy su `rate_limits.expiresAt` configurata in console
- [ ] Legal pages reali (Privacy, Cookie, 231, Etico)
- [ ] `og-image.png` (1200×630)
- [ ] P.IVA reale nel footer

## File chiave

- [functions/index.js](functions/index.js) — submitLead, extractDocument, suggestAutomations, submitDemoLead, notifyOnLead, notifyOnDemoLead
- [functions/lib/mailer.js](functions/lib/mailer.js) — nodemailer SMTP transport factory (Gmail app password, secret-injected)
- [firestore.rules](firestore.rules) — rules production-grade
- [firebase.json](firebase.json) — hosting, rewrites, emulators
- [frontend/src/lib/firebase.js](frontend/src/lib/firebase.js) — init SDK + App Check
- [frontend/src/lib/extractDocument.js](frontend/src/lib/extractDocument.js) — chiamata API + fallback mock
- [frontend/src/lib/suggestAutomations.js](frontend/src/lib/suggestAutomations.js) — chiamata API spunti (silent-fail, no fallback)
- [frontend/src/components/sections/InteractiveDemo.jsx](frontend/src/components/sections/InteractiveDemo.jsx) — UI demo + soft gate + JsonTree + card spunti
- [frontend/src/components/sections/Contact.jsx](frontend/src/components/sections/Contact.jsx) — form contatti
- [scripts/build-sample-pdf.cjs](scripts/build-sample-pdf.cjs) — generatore del sample PDF demo
- [README.md](README.md) — setup operativo (App Check, TTL, deploy)
- [memory/PRD.md](memory/PRD.md) — PRD originale del sito
