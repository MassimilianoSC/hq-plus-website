// HQ | Flow — Marketing automation ideas (second Vertex call after extraction).
//
// Calls /suggestAutomations (Cloud Function backed by Vertex AI Gemini 2.5 Flash,
// europe-west8). Takes the structured extraction output and returns 3 short,
// condizional ideas of automations the customer could implement.
//
// Failure semantics: returns null on any error / timeout. The UI hides the
// suggestions card silently — no fallback mock (creative content with a mock
// would be inauthentic).

import { getAppCheckToken } from "./firebase";

const ENDPOINT =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_SUGGEST_URL) ||
  "/suggestAutomations";
const FRONT_TIMEOUT_MS = 35_000;

/**
 * Generates marketing-flavored automation ideas based on the extracted document.
 *
 * @param {object} extracted — the structured extraction payload (NOT the raw PDF).
 *                              Pass the same object that `extractFromDocument` returns,
 *                              minus _meta if you want (the function tolerates it).
 * @returns {Promise<{spunti: Array<{titolo,descrizione,trigger,valore_atteso}>, _meta?: object} | null>}
 */
export async function suggestAutomations(extracted) {
  if (!extracted || typeof extracted !== "object") return null;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FRONT_TIMEOUT_MS);

  try {
    const headers = { "Content-Type": "application/json" };
    const appCheckToken = await getAppCheckToken();
    if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({ extracted }),
      signal: ctrl.signal,
    });

    let json = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    if (!res.ok || !json || !json.ok) return null;

    const data = json.data;
    if (!data || !Array.isArray(data.spunti) || data.spunti.length === 0) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
