# HQ | Flow — Corporate Site PRD

## Original problem statement
Build a single-page corporate website for HQ | Flow, an Italian B2B sub-brand of HQ | Industrial Assets, specialized in workflow automation with AI agents for medium-large enterprises and SMEs. All copy in Italian, dark mode, design vocabulary inspired by Linear/Vercel/Resend, full Firebase backend (Firestore + Cloud Functions + Auth + Hosting).

## User personas
- **Warm prospect** landing after a sales call from the HQ Industrial Assets relationship network — needs heritage proof, concrete cases, ROI stats.
- **Cold Italian SME** decision maker — needs a working demo, plain pricing (free audit, fixed price first workflow), and reachable contact form.

## Architecture
- Frontend: React (CRA + craco) + TailwindCSS + shadcn/ui + lucide-react. Geist font via Google Fonts.
- Backend: Firebase Cloud Functions 2nd gen (`submitLead`, region europe-west8), Firestore (eur3), Hosting + rewrites, Auth providers initialized.
- Demo extraction is intentionally mocked on the frontend in `extractFromDocument()`.

## What's been implemented (Feb 2026)
- Italian dark-mode single-page site with 11 sections: Navbar, Hero, HeritageStrip, OriginStory, HowWeWork, InteractiveDemo (mocked), UseCases (4 cards w/ metrics), HowWeStart (2 pricing cards), FAQ (6-item accordion), Contact form, Footer.
- Logo HQ | Flow inline (heritage-navy pill + cyan Flow).
- Brand tokens (cyan #00D4FF, dark backgrounds, Geist mono) + scroll-reveal animations + hero glow + grid bg.
- Firebase package: `firebase.json`, `.firebaserc`, `firestore.rules` (production-grade), `firestore.indexes.json`, `functions/index.js` (CORS, validation, rate-limit 5/h/IP, anonymized IP, server timestamp), `functions/package.json`.
- README + `.env.example`.

## Prioritized backlog (P0/P1/P2)
- **P0 before live**: deploy `firestore.rules`; deploy `submitLead` Cloud Function; replace footer legal links; configure Firestore TTL on `rate_limits.expiresAt`; replace OG image.
- **P1**: swap mocked `extractFromDocument` with real Cloud Run / Cloud Function endpoint.
- **P2**: expose Firebase Auth (login for an internal admin lead inbox view); add proper case-study detail pages; add a thank-you page after form submit; add multilingual EN switch for international prospects.

## Files of interest
- `frontend/src/lib/extractDocument.js` — single-point mock to swap.
- `frontend/src/components/sections/Contact.jsx` — POSTs to `/submitLead`.
- `functions/index.js` — production-ready Cloud Function.
- `firestore.rules` — strict create-only on `leads`.
