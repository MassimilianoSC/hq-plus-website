// HQ Plus — Firebase client SDK initialization.
// This config is the public client config (safe to expose).
// For Cloud Functions, see /functions/index.js.

import { initializeApp } from "firebase/app";
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

if (typeof window !== "undefined" && import.meta.env.DEV) {
  // eslint-disable-next-line no-undef
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

let _appCheck = null;
let appCheckInitializationAttempted = false;
export let appCheck = null;
const RECAPTCHA_SITE_KEY = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY || "";

function getOrInitializeAppCheck() {
  if (_appCheck || typeof window === "undefined" || !RECAPTCHA_SITE_KEY) {
    return _appCheck;
  }
  if (appCheckInitializationAttempted) return null;
  appCheckInitializationAttempted = true;

  try {
    _appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
    });
    appCheck = _appCheck;
  } catch (e) {
    // Initializing twice (HMR) or in environments without window throws — non-fatal.
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("App Check init skipped:", e?.message || e);
    }
  }
  return _appCheck;
}

/** Initializes App Check only when a protected request needs its token. */
export async function getAppCheckToken() {
  const instance = getOrInitializeAppCheck();
  if (!instance) return null;
  try {
    const tk = await getToken(instance, /* forceRefresh */ false);
    return tk?.token || null;
  } catch (e) {
    return null;
  }
}

export default app;
