# HQ | Flow — Corporate Site

Single-page corporate website per **HQ | Flow**, sotto-azienda di **HQ | Industrial Assets** (Milano, dal 1999), specializzata in workflow automation con agenti per medie/grandi aziende e PMI italiane.

Sito interamente in **italiano**, dark mode, costruito con React + Tailwind + shadcn/ui. Backend su Firebase (Firestore + Cloud Functions + Hosting + Auth).

---

## Stack

- **Frontend**: React (Create React App + craco) + TailwindCSS + shadcn/ui + Lucide icons
- **Font**: Geist (Vercel) via Google Fonts CDN
- **Backend**: Firebase
  - Firestore (region `eur3`) — collection `leads`
  - Cloud Functions (2nd gen, Node.js 20, region `europe-west8`)
  - Firebase Auth (Email/Password + Google enabled, SDK initialized but not exposed in UI)
  - Firebase Hosting

---

## Project structure

```
/app
├── frontend/                  # React app
│   ├── src/
│   │   ├── App.js
│   │   ├── lib/
│   │   │   ├── firebase.js              # client SDK init (public config)
│   │   │   ├── extractDocument.js       # MOCKED extraction — single function, swap later
│   │   │   └── useReveal.js
│   │   └── components/
│   │       ├── Logo.jsx
│   │       └── sections/                # one component per section
│   └── package.json
├── functions/                 # Firebase Cloud Functions (Node.js 20)
│   ├── index.js               # submitLead (HTTP, CORS, rate-limit 5/h/IP)
│   └── package.json
├── firebase.json              # hosting + functions + emulators config
├── .firebaserc                # default project: hq-flow-dev
├── firestore.rules            # production-grade rules
├── firestore.indexes.json
├── .env.example
└── README.md
```

---

## Setup

```bash
# 1. Frontend deps
cd frontend
yarn install

# 2. Cloud Functions deps
cd ../functions
npm install

# 3. Login to Firebase
cd ..
firebase login
firebase use hq-flow-dev   # uses .firebaserc default
```

> Project `hq-flow-dev` is already provisioned (Firestore eur3, Auth providers enabled, Hosting active, Blaze plan). You should not need `firebase init`.

---

## Run dev

### Frontend only

```bash
cd frontend
yarn start          # http://localhost:3000
```

The contact form posts to `/submitLead`. Without Firebase Hosting locally that path 404s — see "Local end-to-end" below.

### Local end-to-end (emulators)

```bash
firebase emulators:start
# Hosting on :5000, Functions on :5001
```

Or override the endpoint at dev-time:

```bash
REACT_APP_SUBMIT_LEAD_URL="http://127.0.0.1:5001/hq-flow-dev/europe-west8/submitLead" yarn start
```

---

## Deploy

```bash
# Build the frontend
cd frontend && yarn build && cd ..

# Deploy everything
firebase deploy

# Or selectively
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

After deploy:

- Site: <https://hq-flow-dev.web.app>
- Function URL: <https://europe-west8-hq-flow-dev.cloudfunctions.net/submitLead>
- The contact form posts to `/submitLead` via Hosting rewrite → Cloud Function.

---

## Switching the demo from MOCKED to a real Cloud Function

The interactive document-extraction demo is currently **mocked entirely on the frontend**. All the mock logic is isolated in **one function**:

```
frontend/src/lib/extractDocument.js  →  extractFromDocument(input, onStatus)
```

When the real extraction service is ready (Cloud Run or another Cloud Function), swap the body of `extractFromDocument`:

```js
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function extractFromDocument(input, onStatus = () => {}) {
  onStatus("Caricamento documento...");
  const fn = httpsCallable(functions, "extractFromDocument");
  const { data } = await fn({
    text: typeof input === "string" ? input : null,
    fileName: typeof input === "string" ? null : input.name,
  });
  return data;
}
```

No UI code changes required.

---

## Firestore security rules

`firestore.rules` is **production-grade** even though the database is currently in test mode:

- `leads` — client `read/update/delete` denied; `create` allowed only with strict schema validation.
- `rate_limits` — fully locked down; only Admin SDK writes (Cloud Function).
- Default deny on everything else.

Deploy them before going live:

```bash
firebase deploy --only firestore:rules
```

---

## Setup App Check (anti-bot)

Both `submitLead` and `extractDocument` enforce Firebase App Check via reCAPTCHA Enterprise. Without a valid token the function returns `401 Unauthorized`. The Functions emulator (`FUNCTIONS_EMULATOR=true`) skips enforcement so local dev keeps working.

**One-off setup (admin):**

1. Create a reCAPTCHA Enterprise site key for the production domain(s).
   Console: <https://console.cloud.google.com/security/recaptcha?project=hq-flow-dev>
   - Type: **Score-based** (invisible)
   - Domains: `hq-flow-dev.web.app`, `hq-flow-dev.firebaseapp.com`, plus any custom domain you'll add later (e.g. `hqflow.it`).
   - Copy the site key.

2. Register the Web app in Firebase App Check.
   Console: <https://console.firebase.google.com/project/hq-flow-dev/appcheck>
   → **Apps** → Web app `hq-flow-dev` → **Register** → provider **reCAPTCHA Enterprise** → paste the site key.

3. Enforce App Check on the functions in console (already enforced server-side in code, but enabling it in console too gives Firebase a UI for monitoring + replay protection toggles).
   Same console → **APIs** → Cloud Functions → toggle **Enforce** for `submitLead` and `extractDocument`.

**Local dev:**

Copy the site key into `frontend/.env`:
```
REACT_APP_RECAPTCHA_SITE_KEY=6Lc...your-key...
```

The first run of `npm start` prints a debug token in the browser console:
```
App Check debug token: 12345678-AAAA-BBBB-CCCC-DDDDDDDDDDDD
```
Whitelist it in Firebase Console → **App Check** → **Apps** → web app → ⋯ → **Manage debug tokens** → paste.

---

## Firestore TTL on `rate_limits`

The functions write `expiresAt` on each `rate_limits` document. Configure the TTL policy once in the Firestore console so old buckets auto-delete:

<https://console.cloud.google.com/firestore/databases/-default-/ttl?project=hq-flow-dev>
→ **Crea criterio** → collection: `rate_limits`, field: `expiresAt` → **Crea**.

---

## Pre-launch checklist

- [x] Deploy `firestore.rules`.
- [x] Verify `submitLead` is deployed in `europe-west8` and reachable through `/submitLead`.
- [x] Swap mocked `extractFromDocument` for the real Cloud Function (Vertex AI Gemini 2.5 Pro).
- [ ] Test the contact form end-to-end: 1 valid + 1 invalid + rate-limit at the 6th attempt.
- [ ] Test `extractDocument` end-to-end: native PDF + scanned PDF + 4th attempt → 429.
- [ ] Create reCAPTCHA Enterprise site key + register in Firebase App Check (see above).
- [ ] Set `REACT_APP_RECAPTCHA_SITE_KEY` in the deploy environment / `.env`.
- [ ] Configure Firestore TTL policy on `rate_limits.expiresAt` (see above).
- [ ] Replace footer placeholders (`Privacy`, `Cookie`, `Modello 231`, `Codice Etico`) with real legal pages.
- [ ] Replace `og-image.png` with the real Open Graph image.
- [ ] Set the real P.IVA in the footer once registered.
- [ ] Decide whether to expose Auth (SDK is already initialized).

---

© 2026 HQ | Flow — Parte del gruppo HQ | Industrial Assets.
