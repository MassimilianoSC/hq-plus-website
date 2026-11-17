// HQ Plus — Document extraction (Cloud Function + mock fallback).
//
// Calls /extractDocument (Cloud Function backed by Vertex AI Gemini 2.5 Pro,
// europe-west8). Accepts pasted text or a PDF File / Blob (sent as base64).
// On any error/timeout, falls back to a local mock so the demo never breaks
// for the user.

import { getAppCheckTokenOnDemand } from "../firebase/getTokenOnDemand";

const ENDPOINT = import.meta.env.PUBLIC_EXTRACT_URL || "/extractDocument";
const FRONT_TIMEOUT_MS = 120_000;
const STATUS_INTERVAL_MS = 3500;
const STATUS_SEQUENCE = [
  "Lettura del documento...",
  "Riconoscimento del layout...",
  "Estrazione dei campi...",
  "Validazione output...",
];

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_TEXT_CHARS = 50_000;

// ─── Mock (used as fallback when the real service errors / times out) ──
const SAMPLE_RESULT = {
  campo_identificativo: "VRB-SRB-2026-04891",
  tipo_documento: "verbale_sopralluogo",
  soggetti_coinvolti: [
    "Operatore richiedente: TIM S.p.A.",
    "Tecnico incaricato: Geom. Marco Bianchi (HQ Industrial Assets)",
    "Proprietà sito: Comune di Sesto San Giovanni",
  ],
  date_chiave: [
    { etichetta: "data_sopralluogo", data: "2026-02-08" },
    { etichetta: "data_redazione", data: "2026-02-09" },
    { etichetta: "scadenza_validazione", data: "2026-03-11" },
  ],
  importi: [
    { descrizione: "canone locazione annuo", valore: 8400.0, valuta: "EUR" },
    { descrizione: "indennità una tantum", valore: 1200.0, valuta: "EUR" },
  ],
  riferimenti_normativi: ["D.Lgs. 259/2003", "L.R. Lombardia 11/2001", "DPR 380/2001"],
  scadenze: [
    { descrizione: "invio integrazione documentale", data: "2026-02-22" },
    { descrizione: "risposta ente locale", data: "2026-03-25" },
  ],
  note_tecniche:
    "SRB telco LTE banda 3 con 3 settori a 120°. Conformità FM verificata secondo CEI 211-10, nessun edificio residenziale in fascia di rispetto.",
  dati_strutturati: {
    impianto: {
      tecnologia: "LTE",
      banda: "B3",
      frequenza_mhz: 1800,
      altezza_palo: { valore: 24, unita: "m" },
      potenza_erp_per_settore: { valore: 35, unita: "dBW" },
    },
    antenne: [
      { settore: 1, azimut_gradi: 0, tipo: "pannello direttivo" },
      { settore: 2, azimut_gradi: 120, tipo: "pannello direttivo" },
      { settore: 3, azimut_gradi: 240, tipo: "pannello direttivo" },
    ],
    ubicazione: {
      coordinate_wgs84: { lat: 45.532, lon: 9.237 },
      catasto: { foglio: 12, mappale: 348, subalterno: 2 },
    },
    conformita: {
      norma_calcolo: "CEI 211-10",
      distanze_rispetto_verificate: true,
      edifici_residenziali_in_fascia: false,
    },
  },
};

const SAMPLE_TEXT = `VERBALE DI SOPRALLUOGO — SRB TIM
ID pratica: VRB-SRB-2026-04891
Data sopralluogo: 08/02/2026
Sito: Sesto San Giovanni (MI), Via Carducci 17
Operatore: TIM S.p.A.
Tecnico incaricato: Geom. Marco Bianchi (HQ Industrial Assets)
Proprietà sito: Comune di Sesto San Giovanni
Tipologia impianto: pannello direttivo 1800 MHz, altezza palo 24m
Canone locazione annuo: € 8.400,00
Indennità una tantum: € 1.200,00
Riferimenti: D.Lgs. 259/2003, L.R. Lombardia 11/2001, DPR 380/2001
Integrazione documentale entro: 22/02/2026
Risposta ente locale prevista entro: 25/03/2026
Note: conformità FM verificata, distanze di rispetto rispettate.`;

export const SAMPLE_DOCUMENT_TEXT = SAMPLE_TEXT;

// ─── Internals ─────────────────────────────────────────────────────────
function startStatusTicker(onStatus) {
  let i = 0;
  onStatus(STATUS_SEQUENCE[0]);
  const id = setInterval(() => {
    i = (i + 1) % STATUS_SEQUENCE.length;
    onStatus(STATUS_SEQUENCE[i]);
  }, STATUS_INTERVAL_MS);
  return () => clearInterval(id);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        return reject(new Error("file_read_failed"));
      }
      const idx = dataUrl.indexOf("base64,");
      if (idx < 0) return reject(new Error("file_read_failed"));
      resolve(dataUrl.slice(idx + 7));
    };
    reader.readAsDataURL(file);
  });
}

async function callExtractApi(payload, signal) {
  const headers = { "Content-Type": "application/json" };
  const appCheckToken = await getAppCheckTokenOnDemand();
  if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });
  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }
  if (!res.ok || !json || !json.ok) {
    const err = new Error((json && json.error) || `HTTP ${res.status}`);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json.data;
}

function buildMock(input, originalError) {
  const inputName =
    typeof input === "string" ? "incolla testo" : (input && input.name) || "documento";
  const inputType = typeof input === "string" ? "text" : "file";
  return {
    ...SAMPLE_RESULT,
    _meta: {
      input_type: inputType,
      input_name: inputName,
      provider: "fallback_mock",
      fallback_reason: originalError?.message || "service_unavailable",
      processed_at: new Date().toISOString(),
    },
  };
}

// ─── Public API ────────────────────────────────────────────────────────
/**
 * Extracts structured data from a document.
 *
 * @param {string|File|Blob} input — pasted text, or a PDF File/Blob
 * @param {(status: string) => void} onStatus — optional status callback
 * @returns {Promise<object>} — structured extraction (real or fallback mock)
 */
export async function extractFromDocument(input, onStatus = () => {}) {
  const stop = startStatusTicker(onStatus);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FRONT_TIMEOUT_MS);
  try {
    let payload;
    if (typeof input === "string") {
      payload = { text: input };
    } else if (
      (typeof File !== "undefined" && input instanceof File) ||
      (typeof Blob !== "undefined" && input instanceof Blob)
    ) {
      const b64 = await fileToBase64(input);
      payload = { pdfBase64: b64 };
    } else {
      throw new Error("invalid_input");
    }
    const data = await callExtractApi(payload, ctrl.signal);
    return data;
  } catch (err) {
    return buildMock(input, err);
  } finally {
    clearTimeout(timer);
    stop();
  }
}
