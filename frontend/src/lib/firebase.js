// HQ | Flow — Firebase client SDK initialization.
// This config is the public client config (safe to expose).
// For Cloud Functions, see /functions/index.js.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
} from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyATA0CkykoPkYAUxFqSJUP0mFq6bUgltrk",
  authDomain: "hq-flow-dev.firebaseapp.com",
  projectId: "hq-flow-dev",
  storageBucket: "hq-flow-dev.firebasestorage.app",
  messagingSenderId: "1028871760146",
  appId: "1:1028871760146:web:0e95be4d918f7640dd6bcb",
};

export const app = initializeApp(firebaseConfig);

// ─── App Check (anti-bot) ──────────────────────────────────────────────
// In dev (NODE_ENV !== 'production'), enable a debug token. The first time
// the app runs locally, the browser console prints a debug token: copy it
// into Firebase Console → App Check → debug tokens to whitelist your dev
// machine. In production, the ReCaptcha Enterprise provider runs invisibly.

if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV !== "production"
) {
  // eslint-disable-next-line no-undef
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

let _appCheck = null;
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || "";

if (typeof window !== "undefined" && RECAPTCHA_SITE_KEY) {
  try {
    _appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    // Initializing twice (HMR) or in environments without window throws — non-fatal.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("App Check init skipped:", e?.message || e);
    }
  }
}

export const appCheck = _appCheck;

/** Returns the App Check token to attach as `X-Firebase-AppCheck`, or null. */
export async function getAppCheckToken() {
  if (!_appCheck) return null;
  try {
    const tk = await getToken(_appCheck, /* forceRefresh */ false);
    return tk?.token || null;
  } catch (e) {
    return null;
  }
}

// ─── Other SDKs ────────────────────────────────────────────────────────
// Auth providers (Email/Password and Google) are enabled in console.
// SDK is initialized but not yet exposed in the UI.
export const auth = getAuth(app);
export const db = getFirestore(app);

// Cloud Functions live in europe-west8 (Milan, colocated with eur3 multi-region).
export const functions = getFunctions(app, "europe-west8");

export default app;
