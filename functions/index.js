/**
 * HQ | Flow — Firebase Cloud Functions (2nd gen).
 *
 * Both functions enforce Firebase App Check (skipped under the Functions
 * emulator for local dev).
 *
 * - submitLead: HTTP function for the website contact form.
 *   · Validates input (email, required fields, max lengths).
 *   · Writes to Firestore collection "leads" with server timestamp,
 *     source, anonymized IP (/24), userAgent.
 *   · CORS allows hq-flow-dev.web.app + localhost for dev.
 *   · Rate limit: 5 submissions per anonymized IP per rolling hour.
 *
 * - extractDocument: HTTP function for the interactive document-extraction
 *   demo. Backed by Vertex AI (gemini-2.5-pro) with native multimodal PDF
 *   input. Returns a JSON conforming to a strict response schema.
 *   · Accepts { pdfBase64 } (max 20MB) OR { text } (max 50.000 chars).
 *   · Rate limit: 3 extractions per anonymized IP per 24h window.
 *   · Logs only metadata (request id, anonIp, sizes, durMs, tokens, outcome) —
 *     never PDF bytes, prompt text, or model output content.
 *
 * - suggestAutomations: HTTP function that takes the structured extraction
 *   output and asks Gemini 2.5 Flash for 3 short, condizional, marketing-
 *   flavored automation ideas inspired by the document. Cheap & fast — used
 *   to add a "wow" continuation to the demo. Rate limit 20/h/IP.
 *
 * - submitDemoLead: HTTP function for the soft email gate on the demo (after
 *   3 free extractions). Validates email + consent, writes to Firestore
 *   collection "demo_leads", rate limit 5/h/IP.
 *
 * - notifyOnLead / notifyOnDemoLead: Firestore onDocumentCreated triggers
 *   that send SMTP notification emails (via Gmail app password) when a new
 *   document is added to "leads" / "demo_leads". Fail-soft: failures never
 *   propagate, the source document is already persisted by design.
 *
 * Region: europe-west8 (Milan) — colocated with eur3 multi-region Firestore.
 */

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { VertexAI, SchemaType } = require("@google-cloud/vertexai");
const { getTransport } = require("./lib/mailer");

const GMAIL_USER = defineSecret("GMAIL_USER");
const GMAIL_APP_PASSWORD = defineSecret("GMAIL_APP_PASSWORD");
const LEAD_NOTIFY_TO = defineSecret("LEAD_NOTIFY_TO");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({
  region: "europe-west8",
  memory: "256MiB",
  maxInstances: 20,
});

// ─── CORS ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = new Set([
  "https://hq-flow-dev.web.app",
  "https://hq-flow-dev.firebaseapp.com",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000",
]);

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
  }
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-Firebase-AppCheck");
  res.set("Access-Control-Max-Age", "3600");
}

// ─── App Check verification ────────────────────────────────────────────
// Verifies Firebase App Check token on incoming requests. Skipped when
// running under the Functions emulator so local dev keeps working.
async function verifyAppCheckOrReject(req, res) {
  if (process.env.FUNCTIONS_EMULATOR === "true") return true;
  const token = req.headers["x-firebase-appcheck"];
  if (typeof token !== "string" || token.length < 10) {
    res.status(401).json({ ok: false, error: "Unauthorized request." });
    return false;
  }
  try {
    await admin.appCheck().verifyToken(token);
    return true;
  } catch (e) {
    res.status(401).json({ ok: false, error: "Unauthorized request." });
    return false;
  }
}

// Strip newlines and clamp length to keep error logs PII-safe.
function sanitizeErrMessage(msg) {
  const s = typeof msg === "string" ? msg : String(msg ?? "unknown_error");
  return s.replace(/[\r\n\t]/g, " ").slice(0, 200);
}

// ─── Helpers ───────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function anonymizeIp(ip) {
  if (!ip) return "unknown";
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const parts = ip.split(".");
    parts[3] = "0";
    return parts.join(".") + "/24";
  }
  if (ip.includes(":")) {
    const parts = ip.split(":").slice(0, 3).join(":");
    return `${parts}::/48`;
  }
  return "unknown";
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.ip || req.connection?.remoteAddress || "";
}

function validate(payload) {
  const errors = [];
  const out = {};

  if (typeof payload !== "object" || payload === null) {
    return { errors: ["Invalid payload."], data: null };
  }

  const name = (payload.name || "").toString().trim();
  if (!name) errors.push("name is required.");
  else if (name.length > 120) errors.push("name too long.");
  out.name = name;

  const email = (payload.email || "").toString().trim().toLowerCase();
  if (!email) errors.push("email is required.");
  else if (!EMAIL_RE.test(email) || email.length > 254)
    errors.push("email invalid.");
  out.email = email;

  const company = (payload.company || "").toString().trim();
  if (!company) errors.push("company is required.");
  else if (company.length > 200) errors.push("company too long.");
  out.company = company;

  const role = (payload.role || "").toString().trim();
  if (role.length > 120) errors.push("role too long.");
  out.role = role;

  const message = (payload.message || "").toString().trim();
  if (message.length > 4000) errors.push("message too long.");
  out.message = message;

  return { errors, data: out };
}

// ─── Rate limit (parametrico per namespace e finestra) ─────────────────
async function checkRateLimit(anonIp, namespace, maxRequests, windowMs) {
  const bucket = Math.floor(Date.now() / windowMs);
  const safeIp = anonIp.replace(/[/:.]/g, "_");
  const docId = `${namespace}_${safeIp}_${bucket}`;
  const ref = db.collection("rate_limits").doc(docId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const count = snap.exists ? (snap.data().count || 0) : 0;
    if (count >= maxRequests) return { allowed: false, count };
    tx.set(
      ref,
      {
        count: count + 1,
        anonIp,
        namespace,
        bucket,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // TTL margin: window + 1h, so old buckets are eligible for delete
        // once the configured Firestore TTL policy on `expiresAt` runs.
        expiresAt: admin.firestore.Timestamp.fromMillis(
          Date.now() + windowMs + 60 * 60 * 1000,
        ),
      },
      { merge: true },
    );
    return { allowed: true, count: count + 1 };
  });
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// ─── submitLead ────────────────────────────────────────────────────────
exports.submitLead = onRequest(
  { cors: false },
  async (req, res) => {
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed." });
      return;
    }

    if (!(await verifyAppCheckOrReject(req, res))) return;

    try {
      const { errors, data } = validate(req.body);
      if (errors.length > 0) {
        res.status(400).json({ ok: false, error: errors.join(" ") });
        return;
      }

      const ip = clientIp(req);
      const anonIp = anonymizeIp(ip);
      const userAgent = (req.headers["user-agent"] || "").toString().slice(0, 500);

      const rl = await checkRateLimit(anonIp, "submit", 5, HOUR_MS);
      if (!rl.allowed) {
        res
          .status(429)
          .json({ ok: false, error: "Troppe richieste. Riprova fra un'ora." });
        return;
      }

      const doc = {
        ...data,
        source: "website",
        userAgent,
        ip: anonIp,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const ref = await db.collection("leads").add(doc);
      logger.info("lead.created", { id: ref.id, anonIp });

      res.status(200).json({ ok: true });
    } catch (err) {
      logger.error("submitLead.error", err);
      res.status(500).json({ ok: false, error: "Errore interno." });
    }
  },
);

// ─── extractDocument (Vertex AI Gemini 2.5 Pro) ────────────────────────

const VERTEX_LOCATION = "europe-west8";
const VERTEX_MODEL = "gemini-2.5-pro";
const MAX_PDF_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_CHARS = 50_000;
const VERTEX_TIMEOUT_MS = 110_000;

const SYSTEM_INSTRUCTION = `Sei un sistema di estrazione strutturata da documenti tecnici e amministrativi italiani.
Dominio: telco (siti SRB/BTS, sopralluoghi rete, collaudi fibra), contratti di locazione/concessione siti,
fotovoltaico (preventivi, relazioni tecniche), autorizzazioni edilizie e paesaggistiche, perizie tecniche,
fatture, ordini, atti amministrativi.

REGOLE FONDAMENTALI
- Estrai esclusivamente informazioni effettivamente presenti nel documento. NON inventare nulla.
- Se un campo non è ricavabile: stringhe -> "", array -> [].
- Lingua di output: italiano. Output: solo JSON valido conforme allo schema, senza testo extra.

ABBREVIAZIONI DI SETTORE
SRB (Stazione Radio Base), BTS, PdL (Punto di Lavoro), ZTL, DIA, SCIA, CILA, PdC (Permesso di Costruire),
VIA, VAS, AIA, ROC, PRG, PGT, D.Lgs., DPR, L., L.R., DM, DPCM, DGR.

FORMATI
- campo_identificativo: codice/numero documento (es. "VRB-SRB-2026-04891", "PROT-2026-12345"). Se assente, "".
- tipo_documento: una tra: verbale_sopralluogo, contratto, perizia, autorizzazione, preventivo, fattura, altro.
  In dubbio: "altro".
- soggetti_coinvolti: array di stringhe nel formato "Ruolo: Nome Cognome (eventuale ente/azienda)".
  Es. "Operatore richiedente: TIM S.p.A.", "Tecnico incaricato: Geom. Marco Bianchi (HQ Industrial Assets)".
- date_chiave: array di { etichetta, data }. Etichetta in snake_case_italiano (es. "data_sopralluogo",
  "data_redazione", "scadenza_validazione"). Data in ISO 8601 (YYYY-MM-DD).
  Converti "08/02/2026" o "8 febbraio 2026" -> "2026-02-08".
- importi: array di { descrizione, valore, valuta }. Descrizione in italiano (es. "canone locazione annuo",
  "imponibile", "IVA 22%", "totale"). Valore numerico decimale dot-based (8400.00, NON "8.400,00").
  Valuta come codice ISO 4217 (di norma "EUR").
- riferimenti_normativi: array di stringhe standardizzate. Esempi: "D.Lgs. 152/2006", "DPR 380/2001",
  "L. 241/1990 art. 7 c. 2", "L.R. Lombardia 11/2001", "DM 29/05/2008".
  Mantieni articolo/comma se presenti nel testo.
- scadenze: array di { descrizione, data }. Descrizione in italiano. Data in ISO 8601.
- note_tecniche: stringa con dettagli tecnici (specifiche impianto, frequenze, dimensioni, conformità,
  distanze di rispetto). "" se assenti.

DATI STRUTTURATI
Se il documento contiene dati tecnici tabellari, parametrici o strutturati (esempi: elenco di siti telco
con coordinate e altezze, direttrici con misurazioni, righe di una distinta materiali, voci di un computo
metrico, parametri di un impianto, righe di una tabella clausole), estrai questi dati in
"dati_strutturati" come oggetto JSON che rispetti la struttura logica del documento.

Linee guida:
- Usa array per liste di entità omogenee (es. siti, direttrici, voci)
- Usa oggetti annidati per gerarchie (es. coordinate: { lat, lon })
- Conserva i nomi originali dei campi quando sono significativi (es. "azimut_ab" meglio di "azimut_uno")
- Numerizza i valori numerici (es. distanza_km: 14.9, NON "14.90 km")
- Estrai unità di misura come campo separato quando rilevante (es. { valore: 28, unita: "m" } per altezze)
- Se il documento è generico (lettera, comunicazione, fattura semplice) e non ha dati tabellari
  significativi: dati_strutturati = {}
- Se il documento è tecnico-strutturato (verbale tecnico, perizia, contratto SRB, autorizzazione con
  parametri): popola dati_strutturati riccamente

Quando popoli dati_strutturati con dati tecnici significativi, riduci note_tecniche a un breve
sommario testuale di 2-3 frasi anziché duplicare i contenuti.

QUALITÀ
- Documenti scansionati o di bassa qualità: best-effort, restituisci ciò che leggi con sicurezza.
- Documenti generici/ambigui: tipo_documento "altro" + best-effort sui campi disponibili.`;

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    campo_identificativo: { type: SchemaType.STRING },
    tipo_documento: {
      type: SchemaType.STRING,
      enum: [
        "verbale_sopralluogo",
        "contratto",
        "perizia",
        "autorizzazione",
        "preventivo",
        "fattura",
        "altro",
      ],
    },
    soggetti_coinvolti: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    date_chiave: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          etichetta: { type: SchemaType.STRING },
          data: { type: SchemaType.STRING },
        },
        required: ["etichetta", "data"],
      },
    },
    importi: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          descrizione: { type: SchemaType.STRING },
          valore: { type: SchemaType.NUMBER },
          valuta: { type: SchemaType.STRING },
        },
        required: ["descrizione", "valore", "valuta"],
      },
    },
    riferimenti_normativi: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    scadenze: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          descrizione: { type: SchemaType.STRING },
          data: { type: SchemaType.STRING },
        },
        required: ["descrizione", "data"],
      },
    },
    note_tecniche: { type: SchemaType.STRING },
    dati_strutturati: {
      type: SchemaType.OBJECT,
      description:
        "Free-form structured technical data when the document is tabular/parametric. {} when not applicable.",
    },
  },
  required: [
    "campo_identificativo",
    "tipo_documento",
    "soggetti_coinvolti",
    "date_chiave",
    "importi",
    "riferimenti_normativi",
    "scadenze",
    "note_tecniche",
  ],
};

let _generativeModel = null;
function getGenerativeModel() {
  if (_generativeModel) return _generativeModel;
  const vertex = new VertexAI({
    project: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT,
    location: VERTEX_LOCATION,
  });
  _generativeModel = vertex.getGenerativeModel({
    model: VERTEX_MODEL,
    systemInstruction: { role: "system", parts: [{ text: SYSTEM_INSTRUCTION }] },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
  return _generativeModel;
}

function newRequestId() {
  return Math.random().toString(36).slice(2, 10);
}

exports.extractDocument = onRequest(
  {
    cors: false,
    timeoutSeconds: 120,
    memory: "1GiB",
    concurrency: 4,
  },
  async (req, res) => {
    const reqId = newRequestId();
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed." });
      return;
    }

    if (!(await verifyAppCheckOrReject(req, res))) return;

    const body = (typeof req.body === "object" && req.body !== null) ? req.body : {};
    const text = typeof body.text === "string" ? body.text : null;
    const pdfBase64 = typeof body.pdfBase64 === "string" ? body.pdfBase64 : null;

    if ((text && pdfBase64) || (!text && !pdfBase64)) {
      res
        .status(400)
        .json({ ok: false, error: "Fornire esattamente uno tra 'pdfBase64' e 'text'." });
      return;
    }

    if (text !== null) {
      if (text.trim().length < 10) {
        res.status(400).json({ ok: false, error: "Testo troppo corto." });
        return;
      }
      if (text.length > MAX_TEXT_CHARS) {
        res
          .status(413)
          .json({ ok: false, error: `Testo oltre ${MAX_TEXT_CHARS} caratteri.` });
        return;
      }
    }

    let pdfBytes = 0;
    if (pdfBase64 !== null) {
      pdfBytes = Math.floor(pdfBase64.length * 0.75);
      if (pdfBytes > MAX_PDF_BYTES) {
        res.status(413).json({ ok: false, error: "PDF oltre 20 MB." });
        return;
      }
      if (pdfBytes < 100) {
        res.status(400).json({ ok: false, error: "PDF non valido." });
        return;
      }
    }

    const ip = clientIp(req);
    const anonIp = anonymizeIp(ip);

    try {
      const rl = await checkRateLimit(anonIp, "extract", 3, DAY_MS);
      if (!rl.allowed) {
        logger.info("extract.rate_limited", { reqId, anonIp });
        res.status(429).json({
          ok: false,
          error:
            "Hai raggiunto il limite di 3 estrazioni/giorno per questo IP. Per uso intensivo, contattaci.",
        });
        return;
      }
    } catch (err) {
      logger.error("extract.rate_limit_error", {
        reqId,
        err: sanitizeErrMessage(err?.message),
      });
      res.status(500).json({ ok: false, error: "Errore interno." });
      return;
    }

    const startedAt = Date.now();
    const mode = pdfBase64 ? "pdf" : "text";
    const inputSize = pdfBase64 ? pdfBytes : text.length;
    logger.info("extract.start", { reqId, mode, inputSize });

    try {
      const parts = pdfBase64
        ? [{ inlineData: { mimeType: "application/pdf", data: pdfBase64 } }]
        : [{ text }];

      const model = getGenerativeModel();
      const generation = model.generateContent({
        contents: [{ role: "user", parts }],
      });

      const result = await Promise.race([
        generation,
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("vertex_timeout")), VERTEX_TIMEOUT_MS),
        ),
      ]);

      const candidate = result?.response?.candidates?.[0];
      const raw = candidate?.content?.parts?.[0]?.text || "{}";
      const usage = result?.response?.usageMetadata || {};

      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        // Do NOT log `raw` content: model output may echo parts of the input
        // document and we don't want any document content in our logs.
        logger.error("extract.json_parse_failed", { reqId });
        throw new Error("invalid_model_output");
      }

      const durMs = Date.now() - startedAt;
      logger.info("extract.ok", {
        reqId,
        mode,
        inputSize,
        durMs,
        promptTokens: usage.promptTokenCount,
        outputTokens: usage.candidatesTokenCount,
      });

      res.status(200).json({
        ok: true,
        data: {
          ...data,
          _meta: {
            input_type: mode,
            input_size: inputSize,
            provider: "vertex-ai",
            model: VERTEX_MODEL,
            region: VERTEX_LOCATION,
            duration_ms: durMs,
            processed_at: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      const durMs = Date.now() - startedAt;
      logger.error("extract.error", {
        reqId,
        durMs,
        mode,
        inputSize,
        err: sanitizeErrMessage(err?.message),
      });
      res.status(502).json({ ok: false, error: "Estrazione non riuscita." });
    }
  },
);

// ─── suggestAutomations (Gemini 2.5 Flash — marketing ideas) ──────────

const SUGGEST_MODEL = "gemini-2.5-flash";
const SUGGEST_TIMEOUT_MS = 30_000;
const MAX_SUGGEST_INPUT_BYTES = 50_000;

const SUGGEST_SYSTEM_INSTRUCTION = `Sei un consulente esperto di automazione di processo per aziende italiane (PMI e mid-market).
Riceverai dati strutturati estratti da un documento (verbale tecnico telco, contratto, perizia, autorizzazione,
preventivo, fattura, ecc.). Il tuo compito: suggerire 3 idee concrete di workflow automatizzati che l'azienda
destinataria potrebbe implementare partendo da questo tipo di dato, ispirate ai contenuti specifici del documento.

REGOLE DI TONO
- Linguaggio condizionale: "potresti", "uno scenario sarebbe", "si potrebbe pensare a".
- Tono propositivo, professionale, stimolante. NON promesse, NON garanzie.
- Italiano. Nessun anglicismo gratuito, nessun marketing vuoto.

REGOLE DI CONTENUTO
- Ogni idea deve essere ispirata da almeno UN campo del documento (es. una scadenza presente, un importo, un soggetto,
  una sezione di dati_strutturati). Quando possibile, cita il valore o il campo specifico.
- Plausibilità operativa: idee che un team operations/IT capirebbe e troverebbe sensate.
- 3 idee, non 2 e non 4.
- Per ogni idea genera:
  · titolo: 5-9 parole, azione chiara (es. "Promemoria automatici sulle scadenze del contratto")
  · descrizione: 2-3 frasi, max 320 caratteri, descrive cosa farebbe l'automazione e quale problema risolverebbe
  · trigger: cosa farebbe partire il workflow, max 80 caratteri (es. "ogni nuovo verbale caricato in cartella condivisa")
  · valore_atteso: in 1 frase, qualitativo (es. "minor rischio di perdere scadenze legali"). NIENTE percentuali, NIENTE numeri ROI inventati.

DA NON FARE
- NON inventare numeri di ROI o di risparmio ("riduzione del 40%", "tempo risparmiato del 70%").
- NON citare strumenti commerciali specifici (Salesforce, SAP, HubSpot, Zapier, ecc.). Resta agnostico.
- NON promettere funzionalità di prodotti specifici di HQ Flow.
- NON duplicare la stessa idea con sinonimi diversi: 3 angoli di automazione differenti.
- NON dire "i nostri esperti", "ti possiamo aiutare", "contattaci". Niente sales pitch diretto.
- Output: solo JSON valido conforme allo schema.`;

const SUGGEST_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    spunti: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          titolo: { type: SchemaType.STRING },
          descrizione: { type: SchemaType.STRING },
          trigger: { type: SchemaType.STRING },
          valore_atteso: { type: SchemaType.STRING },
        },
        required: ["titolo", "descrizione", "trigger", "valore_atteso"],
      },
    },
  },
  required: ["spunti"],
};

let _suggestModel = null;
function getSuggestModel() {
  if (_suggestModel) return _suggestModel;
  const vertex = new VertexAI({
    project: process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT,
    location: VERTEX_LOCATION,
  });
  _suggestModel = vertex.getGenerativeModel({
    model: SUGGEST_MODEL,
    systemInstruction: { role: "system", parts: [{ text: SUGGEST_SYSTEM_INSTRUCTION }] },
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: SUGGEST_RESPONSE_SCHEMA,
    },
  });
  return _suggestModel;
}

exports.suggestAutomations = onRequest(
  {
    cors: false,
    timeoutSeconds: 60,
    memory: "512MiB",
    concurrency: 8,
  },
  async (req, res) => {
    const reqId = newRequestId();
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed." });
      return;
    }

    if (!(await verifyAppCheckOrReject(req, res))) return;

    const body = (typeof req.body === "object" && req.body !== null) ? req.body : {};
    const extracted = body.extracted;

    if (!extracted || typeof extracted !== "object") {
      res.status(400).json({ ok: false, error: "Campo 'extracted' richiesto (object)." });
      return;
    }

    let serialized;
    try {
      serialized = JSON.stringify(extracted);
    } catch (e) {
      res.status(400).json({ ok: false, error: "Payload non serializzabile." });
      return;
    }
    if (serialized.length > MAX_SUGGEST_INPUT_BYTES) {
      res.status(413).json({ ok: false, error: "Payload troppo grande." });
      return;
    }

    const ip = clientIp(req);
    const anonIp = anonymizeIp(ip);

    try {
      const rl = await checkRateLimit(anonIp, "suggest", 20, HOUR_MS);
      if (!rl.allowed) {
        logger.info("suggest.rate_limited", { reqId, anonIp });
        res.status(429).json({ ok: false, error: "Troppe richieste. Riprova tra un'ora." });
        return;
      }
    } catch (err) {
      logger.error("suggest.rate_limit_error", { reqId, err: sanitizeErrMessage(err?.message) });
      res.status(500).json({ ok: false, error: "Errore interno." });
      return;
    }

    const startedAt = Date.now();
    logger.info("suggest.start", { reqId, inputSize: serialized.length });

    try {
      const userPrompt = `Ecco i dati strutturati estratti dal documento. Genera 3 idee di automazione ispirate a questi dati.\n\n${serialized}`;

      const generation = getSuggestModel().generateContent({
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      });

      const result = await Promise.race([
        generation,
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("suggest_timeout")), SUGGEST_TIMEOUT_MS),
        ),
      ]);

      const candidate = result?.response?.candidates?.[0];
      const raw = candidate?.content?.parts?.[0]?.text || "{}";
      const usage = result?.response?.usageMetadata || {};

      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        logger.error("suggest.json_parse_failed", { reqId });
        throw new Error("invalid_model_output");
      }

      const durMs = Date.now() - startedAt;
      const count = Array.isArray(data?.spunti) ? data.spunti.length : 0;
      logger.info("suggest.ok", {
        reqId,
        durMs,
        count,
        promptTokens: usage.promptTokenCount,
        outputTokens: usage.candidatesTokenCount,
      });

      res.status(200).json({
        ok: true,
        data: {
          ...data,
          _meta: {
            provider: "vertex-ai",
            model: SUGGEST_MODEL,
            region: VERTEX_LOCATION,
            duration_ms: durMs,
            generated_at: new Date().toISOString(),
          },
        },
      });
    } catch (err) {
      const durMs = Date.now() - startedAt;
      logger.error("suggest.error", {
        reqId,
        durMs,
        err: sanitizeErrMessage(err?.message),
      });
      res.status(502).json({ ok: false, error: "Generazione spunti non riuscita." });
    }
  },
);

// ─── submitDemoLead (soft email gate after 3 free extractions) ─────────

exports.submitDemoLead = onRequest(
  { cors: false, memory: "512MiB" },
  async (req, res) => {
    applyCors(req, res);

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed." });
      return;
    }

    if (!(await verifyAppCheckOrReject(req, res))) return;

    const body =
      typeof req.body === "object" && req.body !== null ? req.body : {};

    const email = (body.email || "").toString().trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || email.length > 254) {
      res
        .status(400)
        .json({ ok: false, error: "Validation failed", field: "email" });
      return;
    }

    if (body.consent !== true) {
      res
        .status(400)
        .json({ ok: false, error: "Validation failed", field: "consent" });
      return;
    }

    const extractionsBefore = Number.isInteger(body.extractionsBefore)
      ? body.extractionsBefore
      : 0;

    const ip = clientIp(req);
    const anonIp = anonymizeIp(ip);
    const userAgent = (req.headers["user-agent"] || "").toString().slice(0, 500);

    try {
      const rl = await checkRateLimit(anonIp, "demolead", 5, HOUR_MS);
      if (!rl.allowed) {
        res
          .status(429)
          .json({ ok: false, error: "Troppe richieste. Riprova fra un'ora." });
        return;
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const ref = await db.collection("demo_leads").add({
        email,
        consentAt: now,
        createdAt: now,
        anonIp,
        userAgent,
        source: "demo_extraction_gate",
        extractionsBefore,
      });
      logger.info("demoLead.created", { id: ref.id, anonIp, extractionsBefore });

      res.status(200).json({ ok: true });
    } catch (err) {
      logger.error("submitDemoLead.error", {
        err: sanitizeErrMessage(err?.message),
      });
      res.status(500).json({ ok: false, error: "Errore interno." });
    }
  },
);

// ─── Email notification helpers ────────────────────────────────────────

const FIRESTORE_CONSOLE_BASE =
  "https://console.firebase.google.com/project/hq-flow-dev/firestore/databases/-default-/data";

const EMAIL_PALETTE = {
  bg: "#0A0A0A",
  surface: "#111111",
  border: "#1F1F1F",
  text: "#FAFAFA",
  textMuted: "#A1A1AA",
  accent: "#00D4FF",
};

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatItalianDate(ts) {
  try {
    const d =
      ts && typeof ts.toDate === "function" ? ts.toDate() : new Date(ts);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("it-IT", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: "Europe/Rome",
    }).format(d);
  } catch {
    return "";
  }
}

function firestoreConsoleUrl(collection, docId) {
  return `${FIRESTORE_CONSOLE_BASE}/~2F${encodeURIComponent(collection)}~2F${encodeURIComponent(docId)}`;
}

function renderRow(label, value) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid ${EMAIL_PALETTE.border};color:${EMAIL_PALETTE.textMuted};font-size:13px;text-transform:uppercase;letter-spacing:0.06em;width:140px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 16px;border-bottom:1px solid ${EMAIL_PALETTE.border};color:${EMAIL_PALETTE.text};font-size:15px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(value)}</td>
    </tr>`;
}

function renderEmailShell({ title, intro, rowsHtml, footerNote, ctaUrl, ctaLabel }) {
  return `<!doctype html>
<html lang="it">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${EMAIL_PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${EMAIL_PALETTE.bg};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${EMAIL_PALETTE.surface};border:1px solid ${EMAIL_PALETTE.border};border-radius:8px;overflow:hidden;">
        <tr><td style="padding:24px 24px 8px 24px;border-bottom:1px solid ${EMAIL_PALETTE.border};">
          <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:${EMAIL_PALETTE.accent};font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">HQ | Flow</div>
          <h1 style="margin:0;color:${EMAIL_PALETTE.text};font-size:22px;font-weight:600;letter-spacing:-0.01em;">${escapeHtml(title)}</h1>
          ${intro ? `<p style="margin:8px 0 0 0;color:${EMAIL_PALETTE.textMuted};font-size:14px;line-height:1.55;">${escapeHtml(intro)}</p>` : ""}
        </td></tr>
        <tr><td style="padding:8px 8px 16px 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
        </td></tr>
        ${ctaUrl ? `<tr><td style="padding:0 24px 24px 24px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:10px 18px;background:${EMAIL_PALETTE.accent};color:${EMAIL_PALETTE.bg};text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">${escapeHtml(ctaLabel || "Apri")}</a>
        </td></tr>` : ""}
        ${footerNote ? `<tr><td style="padding:16px 24px 24px 24px;border-top:1px solid ${EMAIL_PALETTE.border};color:${EMAIL_PALETTE.textMuted};font-size:12px;line-height:1.55;">${escapeHtml(footerNote)}</td></tr>` : ""}
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function shouldSkipNotification(data) {
  if (!data) return true;
  if (data.internal === true) return true;
  if (data.source === "test_loopback") return true;
  return false;
}

// ─── notifyOnLead (Firestore trigger on leads/{leadId}) ────────────────

exports.notifyOnLead = onDocumentCreated(
  {
    document: "leads/{leadId}",
    region: "europe-west8",
    memory: "256MiB",
    secrets: [GMAIL_USER, GMAIL_APP_PASSWORD, LEAD_NOTIFY_TO],
  },
  async (event) => {
    const startedAt = Date.now();
    const leadId = event.params.leadId;
    const data = event.data?.data();

    try {
      if (shouldSkipNotification(data)) {
        logger.info("notifyOnLead.skipped", { leadId, reason: "loopback_or_internal" });
        return;
      }

      if (!process.env.GMAIL_APP_PASSWORD || !process.env.GMAIL_USER || !process.env.LEAD_NOTIFY_TO) {
        logger.warn("notifyOnLead.skipped", { leadId, reason: "missing_smtp_secrets" });
        return;
      }

      const company = (data.company || "").toString().trim() || "azienda non indicata";
      const subject = `🎯 Nuovo lead da HQ Flow — ${company}`;
      const createdAt = formatItalianDate(data.createdAt) || "—";
      const consoleUrl = firestoreConsoleUrl("leads", leadId);

      const rowsHtml = [
        renderRow("Nome", data.name),
        renderRow("Email", data.email),
        renderRow("Azienda", data.company),
        renderRow("Ruolo", data.role),
        renderRow("Messaggio", data.message),
        renderRow("Ricevuto", createdAt),
      ].join("");

      const html = renderEmailShell({
        title: "Nuovo lead dal form Contatti",
        intro: "Un nuovo contatto ha compilato il form sul sito.",
        rowsHtml,
        ctaUrl: consoleUrl,
        ctaLabel: "Apri su Firestore",
        footerNote:
          "Rispondi direttamente a questa email per scrivere al cliente: il reply-to è impostato sul suo indirizzo.",
      });

      const text = [
        "Nuovo lead da HQ Flow",
        "",
        `Nome: ${data.name || "—"}`,
        `Email: ${data.email || "—"}`,
        `Azienda: ${data.company || "—"}`,
        `Ruolo: ${data.role || "—"}`,
        `Messaggio: ${data.message || "—"}`,
        `Ricevuto: ${createdAt}`,
        "",
        `Visualizza su Firestore: ${consoleUrl}`,
      ].join("\n");

      const to = process.env.LEAD_NOTIFY_TO;
      await getTransport().sendMail({
        from: `"HQ Flow Notifiche" <${process.env.GMAIL_USER}>`,
        to,
        replyTo: data.email || undefined,
        subject,
        text,
        html,
      });

      logger.info("notifyOnLead.sent", {
        leadId,
        to,
        durMs: Date.now() - startedAt,
      });
    } catch (err) {
      logger.error("notifyOnLead.failed", {
        leadId,
        durMs: Date.now() - startedAt,
        error: sanitizeErrMessage(err?.message),
      });
    }
  },
);

// ─── notifyOnDemoLead (Firestore trigger on demo_leads/{leadId}) ───────

exports.notifyOnDemoLead = onDocumentCreated(
  {
    document: "demo_leads/{leadId}",
    region: "europe-west8",
    memory: "256MiB",
    secrets: [GMAIL_USER, GMAIL_APP_PASSWORD, LEAD_NOTIFY_TO],
  },
  async (event) => {
    const startedAt = Date.now();
    const leadId = event.params.leadId;
    const data = event.data?.data();

    try {
      if (shouldSkipNotification(data)) {
        logger.info("notifyOnDemoLead.skipped", { leadId, reason: "loopback_or_internal" });
        return;
      }

      if (!process.env.GMAIL_APP_PASSWORD || !process.env.GMAIL_USER || !process.env.LEAD_NOTIFY_TO) {
        logger.warn("notifyOnDemoLead.skipped", { leadId, reason: "missing_smtp_secrets" });
        return;
      }

      const subject = `💡 Demo lead — ${data.email || "(no email)"}`;
      const createdAt = formatItalianDate(data.createdAt) || "—";
      const consoleUrl = firestoreConsoleUrl("demo_leads", leadId);
      const extractionsBefore =
        typeof data.extractionsBefore === "number" ? data.extractionsBefore : 0;

      const rowsHtml = [
        renderRow("Email", data.email),
        renderRow("Estrazioni pre-gate", String(extractionsBefore)),
        renderRow("IP (anon)", data.anonIp),
        renderRow("Ricevuto", createdAt),
      ].join("");

      const html = renderEmailShell({
        title: "Nuovo demo lead",
        intro:
          "Questo utente ha provato la demo 3 volte e ha lasciato l'email per continuare.",
        rowsHtml,
        ctaUrl: consoleUrl,
        ctaLabel: "Apri su Firestore",
        footerNote:
          "Reply-to impostato sull'email del lead: rispondi a questa mail per scrivergli direttamente.",
      });

      const text = [
        "Nuovo demo lead da HQ Flow",
        "",
        `Email: ${data.email || "—"}`,
        `Estrazioni prima del gate: ${extractionsBefore}`,
        `IP (anon): ${data.anonIp || "—"}`,
        `Ricevuto: ${createdAt}`,
        "",
        "Questo utente ha provato la demo 3 volte e ha lasciato l'email per continuare.",
        "",
        `Visualizza su Firestore: ${consoleUrl}`,
      ].join("\n");

      const to = process.env.LEAD_NOTIFY_TO;
      await getTransport().sendMail({
        from: `"HQ Flow Notifiche" <${process.env.GMAIL_USER}>`,
        to,
        replyTo: data.email || undefined,
        subject,
        text,
        html,
      });

      logger.info("notifyOnDemoLead.sent", {
        leadId,
        to,
        durMs: Date.now() - startedAt,
      });
    } catch (err) {
      logger.error("notifyOnDemoLead.failed", {
        leadId,
        durMs: Date.now() - startedAt,
        error: sanitizeErrMessage(err?.message),
      });
    }
  },
);
