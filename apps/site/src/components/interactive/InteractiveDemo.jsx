import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Mail,
  Lock,
  Lightbulb,
  Zap,
} from "lucide-react";
import {
  extractFromDocument,
  SAMPLE_DOCUMENT_TEXT,
  MAX_PDF_BYTES,
  MAX_TEXT_CHARS,
} from "@/lib/api/extractDocument";
import { suggestAutomations } from "@/lib/api/suggestAutomations";
import { getAppCheckTokenOnDemand } from "@/lib/firebase/getTokenOnDemand";
import TypewriterText from "@/components/motion/TypewriterText";

const SAMPLE_PDF_URL = "/documents/sample-verbale.pdf";
const MAX_PDF_PAGES = 30;
const WARN_PDF_PAGES = 10;

// Soft email gate thresholds.
// Soft gate: localStorage counter è UX nudge, non security boundary.
// Hard cap economico è server-side rate limit (3/giorno/IP)
// implementato in extractDocument. Se l'utente cancella localStorage
// o usa incognito, il rate limit server-side lo prende comunque.
const FREE_EXTRACTIONS = 3;
const EMAIL_BONUS = 5;
const HARD_CAP = FREE_EXTRACTIONS + EMAIL_BONUS;
const LS_COUNT = "hqplus_demo_count";
const LS_EMAIL = "hqplus_demo_email";
const LEGACY_LS_COUNT = "hqflow_demo_count";
const LEGACY_LS_EMAIL = "hqflow_demo_email";

const DEMO_LEAD_URL = import.meta.env.PUBLIC_DEMO_LEAD_URL || "/submitDemoLead";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readLs(key, fallback = null) {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

function writeLs(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e) {
    // storage disabled / quota — gate is best-effort UX only
    return false;
  }
}

function removeLs(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch (e) {
    // storage disabled — migration remains best-effort
  }
}

// Lazy-load pdf-lib only when the user actually drops a PDF: keeps it out
// of the initial bundle (~150 kB gzipped). Cached at module scope so a
// second file in the same session doesn't re-fetch.
let pdfLibCache = null;
async function loadPdfLib() {
  if (!pdfLibCache) pdfLibCache = await import("pdf-lib");
  return pdfLibCache;
}

function formatMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isPdfFile(file) {
  if (!file) return false;
  const name = (file.name || "").toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

// ─── JsonTree (custom, no external deps) ──────────────────────────────
function JsonValue({ value }) {
  if (value === null) {
    return <span className="text-[var(--text-tertiary)] italic">null</span>;
  }
  if (typeof value === "number") {
    return <span className="text-[var(--accent)]">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-[var(--text-tertiary)] italic">{String(value)}</span>;
  }
  if (typeof value === "string") {
    return <span className="text-[var(--text-secondary)]">&quot;{value}&quot;</span>;
  }
  return <span className="text-[var(--text-tertiary)]">…</span>;
}

function JsonNode({ name, value, depth = 0, isLast = true }) {
  const isObj = value !== null && typeof value === "object";
  const isArr = Array.isArray(value);
  const [open, setOpen] = useState(depth < 2);

  if (!isObj) {
    return (
      <div className="flex items-baseline gap-2 leading-relaxed">
        {name !== undefined && (
          <span className="text-[var(--text-secondary)]">
            {typeof name === "number" ? `[${name}]` : `"${name}":`}
          </span>
        )}
        <JsonValue value={value} />
        {!isLast && <span className="text-[var(--text-tertiary)]">,</span>}
      </div>
    );
  }

  const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
  const count = entries.length;
  const openBracket = isArr ? "[" : "{";
  const closeBracket = isArr ? "]" : "}";

  return (
    <div className="leading-relaxed">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 hover:text-[var(--accent)] transition-colors"
      >
        {open ? (
          <ChevronDown size={12} className="text-[var(--text-tertiary)]" />
        ) : (
          <ChevronRight size={12} className="text-[var(--text-tertiary)]" />
        )}
        {name !== undefined && (
          <span className="text-[var(--text-secondary)]">
            {typeof name === "number" ? `[${name}]` : `"${name}":`}
          </span>
        )}
        <span className="text-[var(--text-tertiary)]">
          {openBracket}
          {!open && (
            <span className="ml-1 text-[var(--text-tertiary)]">
              {count} {isArr ? "elementi" : "campi"}
            </span>
          )}
          {!open && closeBracket}
        </span>
      </button>
      {open && (
        <div className="pl-5 border-l border-[var(--border-subtle)] ml-1.5">
          {entries.map(([k, v], i) => (
            <JsonNode
              key={k}
              name={k}
              value={v}
              depth={depth + 1}
              isLast={i === entries.length - 1}
            />
          ))}
          <div className="text-[var(--text-tertiary)]">
            {closeBracket}
            {!isLast && ","}
          </div>
        </div>
      )}
    </div>
  );
}

function JsonTree({ data }) {
  return (
    <div className="text-xs font-mono" data-testid="demo-structured-tree">
      <JsonNode value={data} depth={0} />
    </div>
  );
}

export const InteractiveDemo = () => {
  const fileRef = useRef(null);
  const [pastedText, setPastedText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");

  // Optional marketing automation suggestions (a second Vertex call on demand).
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(false);
  const suggestRunIdRef = useRef(0);

  // Soft email gate — see comment near constants.
  // Stable initial values keep Astro's server HTML and the first client render aligned.
  const [demoCount, setDemoCount] = useState(0);
  const [demoEmail, setDemoEmail] = useState(null);
  const [emailValue, setEmailValue] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [gateError, setGateError] = useState("");
  const [gateSubmitting, setGateSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const gateLoggedRef = useRef(false);
  const toastTimerRef = useRef(null);

  const needsEmailGate = !demoEmail && demoCount >= FREE_EXTRACTIONS;
  const isExhausted = !!demoEmail && demoCount >= HARD_CAP;
  const isBlocked = needsEmailGate || isExhausted;

  useEffect(() => {
    const currentCount = readLs(LS_COUNT, null);
    const legacyCount = currentCount === null ? readLs(LEGACY_LS_COUNT, null) : null;
    if (legacyCount !== null && writeLs(LS_COUNT, legacyCount)) {
      removeLs(LEGACY_LS_COUNT);
    }

    const currentEmail = readLs(LS_EMAIL, null);
    const legacyEmail = currentEmail === null ? readLs(LEGACY_LS_EMAIL, null) : null;
    if (legacyEmail !== null && writeLs(LS_EMAIL, legacyEmail)) {
      removeLs(LEGACY_LS_EMAIL);
    }

    const storedCount = Number.parseInt(currentCount ?? legacyCount ?? "0", 10);
    setDemoCount(Number.isFinite(storedCount) && storedCount >= 0 ? storedCount : 0);
    setDemoEmail(currentEmail ?? legacyEmail);
  }, []);

  useEffect(() => {
    if (needsEmailGate && !gateLoggedRef.current) {
      gateLoggedRef.current = true;
      // eslint-disable-next-line no-console
      console.log("demo_email_gate_shown");
    }
  }, [needsEmailGate]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 4000);
  };

  const isFallback = result?._meta?.provider === "fallback_mock";
  const datiStrutturati = result?.dati_strutturati;
  const hasStructured =
    datiStrutturati &&
    typeof datiStrutturati === "object" &&
    Object.keys(datiStrutturati).length > 0;
  const resultForJsonView = result
    ? Object.fromEntries(
        Object.entries(result).filter(([k]) => k !== "dati_strutturati"),
      )
    : null;

  const run = useCallback(async (input) => {
    setLoading(true);
    setResult(null);
    setError(null);
    setStatus("Avvio...");
    setSuggestions(null);
    setSuggestionsLoading(false);
    setSuggestionsError(false);
    ++suggestRunIdRef.current;
    try {
      const data = await extractFromDocument(input, setStatus);
      setResult(data);
      setStatus("");
      // Increment counter ONLY on real backend success (not fallback mock).
      const provider = data?._meta?.provider;
      if (provider && provider !== "fallback_mock") {
        setDemoCount((prev) => {
          const next = prev + 1;
          writeLs(LS_COUNT, String(next));
          return next;
        });
      }
    } catch (err) {
      setStatus("");
      setError("Errore imprevisto durante l'estrazione.");
    } finally {
      setLoading(false);
    }
  }, []);

  const generateSuggestions = async () => {
    if (!result || isFallback || suggestionsLoading) return;
    const myRunId = ++suggestRunIdRef.current;
    const { _meta, ...extractedForModel } = result;
    setSuggestions(null);
    setSuggestionsError(false);
    setSuggestionsLoading(true);
    try {
      const data = await suggestAutomations(extractedForModel);
      if (suggestRunIdRef.current === myRunId) {
        if (data) setSuggestions(data);
        else setSuggestionsError(true);
      }
    } catch {
      if (suggestRunIdRef.current === myRunId) setSuggestionsError(true);
    } finally {
      if (suggestRunIdRef.current === myRunId) setSuggestionsLoading(false);
    }
  };

  const validateAndRunFile = async (file) => {
    if (!file) return;
    if (isBlocked) return;
    setError(null);
    setWarning("");
    if (!isPdfFile(file)) {
      setError("Sono supportati solo file PDF (.pdf).");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`PDF troppo grande (max ${formatMB(MAX_PDF_BYTES)}).`);
      return;
    }

    let pageCount = 0;
    try {
      const [{ PDFDocument }, buf] = await Promise.all([
        loadPdfLib(),
        file.arrayBuffer(),
      ]);
      const pdf = await PDFDocument.load(buf, { updateMetadata: false });
      pageCount = pdf.getPageCount();
    } catch (err) {
      setError(
        "Impossibile leggere questo PDF. Verifica che non sia protetto da password o danneggiato.",
      );
      return;
    }

    if (pageCount > MAX_PDF_PAGES) {
      setError(
        <>
          Demo limitata a {MAX_PDF_PAGES} pagine (questo PDF ne ha {pageCount}). Per
          documenti più grandi,{" "}
          <a href="#contatti" className="underline hover:text-[var(--accent)]">
            parla con noi
          </a>
          .
        </>,
      );
      return;
    }
    if (pageCount > WARN_PDF_PAGES) {
      setWarning(
        `Documento di ${pageCount} pagine — l'analisi può richiedere 20-40 secondi.`,
      );
    }
    setFileName(file.name);
    run(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    validateAndRunFile(file);
  };

  const onFilePick = (e) => {
    const file = e.target.files?.[0];
    validateAndRunFile(file);
  };

  const onSample = async () => {
    if (isBlocked) return;
    setError(null);
    setWarning("");
    try {
      const res = await fetch(SAMPLE_PDF_URL);
      if (!res.ok) throw new Error("sample_fetch_failed");
      const blob = await res.blob();
      const file = new File([blob], "sample-verbale.pdf", {
        type: "application/pdf",
      });
      setFileName(file.name);
      setPastedText("");
      run(file);
    } catch (err) {
      // se il PDF di esempio non è raggiungibile, ricasca sul testo di esempio
      setPastedText(SAMPLE_DOCUMENT_TEXT);
      setFileName("");
      run(SAMPLE_DOCUMENT_TEXT);
    }
  };

  const onSubmitText = () => {
    if (isBlocked) return;
    setError(null);
    setWarning("");
    const txt = pastedText.trim();
    if (txt.length === 0) return;
    if (txt.length > MAX_TEXT_CHARS) {
      setError(`Testo oltre ${MAX_TEXT_CHARS} caratteri.`);
      return;
    }
    setFileName("");
    run(pastedText);
  };

  const onSubmitEmailGate = async (e) => {
    e.preventDefault();
    setGateError("");
    const email = emailValue.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || !consentChecked) {
      setGateError("Compila tutti i campi obbligatori.");
      return;
    }
    setGateSubmitting(true);
    try {
      const headers = { "Content-Type": "application/json" };
      const appCheckToken = await getAppCheckTokenOnDemand();
      if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;
      const res = await fetch(DEMO_LEAD_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          consent: true,
          extractionsBefore: demoCount,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }
      setDemoEmail(email);
      writeLs(LS_EMAIL, email);
      setEmailValue("");
      setConsentChecked(false);
      // eslint-disable-next-line no-console
      console.log("demo_email_submitted");
      showToast("Email registrata. Hai 5 estrazioni in più disponibili.");
    } catch (err) {
      setGateError(
        "Invio non riuscito. Riprova tra qualche minuto o scrivici dalla sezione contatti.",
      );
    } finally {
      setGateSubmitting(false);
    }
  };

  return (
    <section
      id="demo"
      className="cosmic-section cosmic-section--observatory reveal py-24 lg:py-32"
      data-testid="interactive-demo-section"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--accent)] mb-4">
            Demo live
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">
            Provala adesso
          </h2>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
            Carica un PDF tecnico e guarda cosa estraiamo in tempo reale. Nessuna
            registrazione, nessun dato salvato.
          </p>
        </div>

        <div className="relative grid lg:grid-cols-2 gap-6">
          <div
            className={`demo-beam ${loading ? "is-active" : ""}`}
            aria-hidden="true"
          />
          {/* Input panel */}
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`relative p-10 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                dragOver
                  ? "border-[var(--accent)] bg-[var(--accent-tint-04)]"
                  : "border-[var(--border-strong)] bg-[var(--bg-elevated)] hover:border-[var(--accent)]"
              }`}
              onClick={() => fileRef.current?.click()}
              data-testid="demo-dropzone"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={onFilePick}
                data-testid="demo-file-input"
              />
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-tint-08)] flex items-center justify-center mb-4">
                  <Upload size={20} className="text-[var(--accent)]" />
                </div>
                <p className="text-[var(--text-primary)] font-medium mb-1">
                  Trascina qui un PDF
                </p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  oppure clicca per selezionarlo · max {formatMB(MAX_PDF_BYTES)}
                </p>
                {fileName && (
                  <div
                    className="mt-4 flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]"
                    data-testid="demo-file-selected"
                  >
                    <FileText size={14} />
                    {fileName}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div
                role="alert"
                data-testid="demo-error"
                className="flex items-start gap-2 px-4 py-3 rounded-md border border-[rgba(255,95,87,0.4)] bg-[rgba(255,95,87,0.06)] text-sm text-[#ff8a82]"
              >
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="text-center text-xs text-[var(--text-tertiary)] font-mono">
              — oppure incolla testo —
            </div>

            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Incolla qui il testo del documento e clicca "Estrai dati"...`}
              rows={6}
              maxLength={MAX_TEXT_CHARS}
              className="w-full p-4 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm font-mono focus:border-[var(--accent)] focus:outline-none transition-colors resize-y"
              data-testid="demo-text-input"
            />

            {!isBlocked && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={onSubmitText}
                  disabled={loading || pastedText.trim().length === 0}
                  className="button-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  data-testid="demo-extract-button"
                >
                  <Sparkles size={14} />
                  Estrai dati
                </button>
                <button
                  onClick={onSample}
                  disabled={loading}
                  className="button-secondary inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-[var(--border-strong)] text-[var(--text-primary)] text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-40"
                  data-testid="demo-sample-button"
                >
                  Prova con un esempio
                </button>
              </div>
            )}

            {needsEmailGate && (
              <form
                onSubmit={onSubmitEmailGate}
                className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 space-y-4"
                data-testid="demo-email-gate"
                noValidate
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent-tint-08)] flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <h4 className="text-[var(--text-primary)] font-semibold mb-1">
                      Continua a esplorare la demo
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Hai usato {FREE_EXTRACTIONS} estrazioni gratuite. Lascia la tua
                      email aziendale per altre {EMAIL_BONUS} — nessun account, nessuna
                      password.
                    </p>
                  </div>
                </div>

                <input
                  type="email"
                  required
                  placeholder="nome@azienda.it"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-[4px] bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-[15px] focus:border-[var(--accent)] focus:outline-none transition-colors"
                  data-testid="demo-gate-email"
                  autoComplete="email"
                />

                <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 accent-[var(--accent)]"
                    data-testid="demo-gate-consent"
                  />
                  <span>
                    Ho letto la{" "}
                    <a href="#" className="underline hover:text-[var(--accent)]">
                      privacy policy
                    </a>{" "}
                    e accetto il trattamento dell'email per finalità di contatto
                    commerciale.
                  </span>
                </label>

                {gateError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 px-3 py-2 rounded-md border border-[rgba(255,95,87,0.4)] bg-[rgba(255,95,87,0.06)] text-xs text-[#ff8a82]"
                    data-testid="demo-gate-error"
                  >
                    <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{gateError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={gateSubmitting}
                  className="button-primary cta-glow w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
                  data-testid="demo-gate-submit"
                >
                  {gateSubmitting ? (
                    <>
                      <Loader2 size={14} className="spin" />
                      Invio...
                    </>
                  ) : (
                    <>Sblocca altre estrazioni</>
                  )}
                </button>

                <a
                  href="#contatti"
                  className="block text-center text-xs text-[var(--text-tertiary)] hover:text-[var(--accent)]"
                >
                  oppure parliamo direttamente →
                </a>
              </form>
            )}

            {isExhausted && (
              <div
                className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-6 flex items-start gap-3"
                data-testid="demo-exhausted"
              >
                <div className="w-9 h-9 rounded-full bg-[rgba(254,188,46,0.08)] flex items-center justify-center flex-shrink-0">
                  <Lock size={16} className="text-[#febc2e]" />
                </div>
                <div className="flex-1">
                  <p className="text-[var(--text-primary)] font-medium mb-1">
                    Hai esaurito le prove gratuite.
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    <a
                      href="#contatti"
                      className="text-[var(--accent)] underline hover:text-[var(--accent-hover)]"
                    >
                      Parliamone
                    </a>{" "}
                    →
                  </p>
                </div>
              </div>
            )}

            {toast && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-md border border-[var(--accent)] bg-[var(--accent-tint-06)] text-sm text-[var(--accent)]"
                role="status"
                data-testid="demo-toast"
              >
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
                <span>{toast}</span>
              </div>
            )}
          </div>

          {/* Right column: output + structured data continuation */}
          <div className="space-y-6">
            <div
              className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] min-h-[480px] flex flex-col"
              data-testid="demo-output-panel"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--text-tertiary)]">
                  <span className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                  <span className="w-2 h-2 rounded-full bg-[#febc2e]" />
                  <span className="w-2 h-2 rounded-full bg-[#28c840]" />
                  <span className="ml-2">extracted_data.json</span>
                </div>
                {result && !loading && !isFallback && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--accent)] font-mono">
                    <CheckCircle2 size={12} /> ready
                  </span>
                )}
                {result && !loading && isFallback && (
                  <span
                    className="inline-flex items-center gap-1 text-xs text-[#febc2e] font-mono"
                    data-testid="demo-fallback-badge"
                    title="Servizio temporaneamente non disponibile, output di esempio"
                  >
                    <Info size={12} /> demo (fallback)
                  </span>
                )}
              </div>

              <div className="flex-1 p-5 overflow-auto">
                {loading && warning && (
                  <div
                    role="status"
                    data-testid="demo-warning"
                    className="mb-4 flex items-start gap-2 px-3 py-2 rounded-md border border-[rgba(254,188,46,0.4)] bg-[rgba(254,188,46,0.06)] text-xs text-[#febc2e]"
                  >
                    <Info size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{warning}</span>
                  </div>
                )}
                {loading && (
                  <div
                    className="h-full flex flex-col items-center justify-center gap-4 text-center"
                    data-testid="demo-loading"
                  >
                    <Loader2 size={28} className="text-[var(--accent)] spin" />
                    <p
                      className="text-sm font-mono text-[var(--text-secondary)]"
                      data-testid="demo-loading-status"
                    >
                      {status}
                    </p>
                  </div>
                )}

                {!loading && !result && (
                  <div className="h-full flex items-center justify-center text-center px-6">
                    <p className="text-sm text-[var(--text-tertiary)] font-mono">
                      {"// In attesa di un documento. Prova con l'esempio →"}
                    </p>
                  </div>
                )}

                {!loading && result && (
                  <TypewriterText
                    text={JSON.stringify(resultForJsonView, null, 2)}
                    charsPerTick={10}
                    className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap break-words"
                    data-testid="demo-result-json"
                  />
                )}
              </div>
            </div>

            {!loading && result && hasStructured && (
              <div
                className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5"
                data-testid="demo-structured-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-tertiary)]">
                    // dati strutturati estratti
                  </h3>
                  <span className="font-mono text-[10px] text-[var(--text-tertiary)]">
                    {Object.keys(datiStrutturati).length} chiavi top-level
                  </span>
                </div>
                <JsonTree data={datiStrutturati} />
              </div>
            )}

            {!loading && result && !isFallback && (
              <div
                className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-5"
                data-testid="demo-suggestions-card"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <Lightbulb size={14} className="text-[var(--accent)]" />
                    <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-[var(--text-primary)]">
                      Spunti di automazione
                    </h3>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed mb-4">
                  Idee generate dall'AI partendo dai dati estratti. Spunti per
                  esplorare, non analisi vincolante.
                </p>

                {!suggestionsLoading && !suggestions && (
                  <button
                    type="button"
                    onClick={generateSuggestions}
                    className="button-secondary inline-flex items-center gap-2 rounded-md border border-[var(--accent-border-20)] bg-[var(--accent-tint-06)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent-tint-08)]"
                    data-testid="demo-suggestions-button"
                  >
                    <Sparkles size={14} /> Genera spunti (facoltativo)
                  </button>
                )}

                {suggestionsError && (
                  <p
                    className="mt-3 text-sm text-[var(--text-secondary)]"
                    role="status"
                  >
                    Non è stato possibile generare gli spunti. Puoi riprovare.
                  </p>
                )}

                {suggestionsLoading && !suggestions && (
                  <p
                    className="mt-3 inline-flex items-center gap-2 text-xs text-[var(--text-tertiary)]"
                    role="status"
                    data-testid="demo-suggestions-loading"
                  >
                    <Loader2 size={13} className="spin" /> Sto generando gli spunti...
                  </p>
                )}

                {suggestions && suggestions.spunti?.length > 0 && (
                  <ul className="space-y-3" data-testid="demo-suggestions-list">
                    {suggestions.spunti.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-full bg-[var(--accent-tint-08)] flex items-center justify-center flex-shrink-0">
                            <Zap size={13} className="text-[var(--accent)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[var(--text-primary)] text-[14px] font-medium leading-snug mb-1.5">
                              {s.titolo}
                            </h4>
                            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-2">
                              {s.descrizione}
                            </p>
                            {(s.trigger || s.valore_atteso) && (
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-mono text-[var(--text-tertiary)]">
                                {s.trigger && (
                                  <span>
                                    <span className="text-[var(--accent)]">
                                      trigger
                                    </span>{" "}
                                    · {s.trigger}
                                  </span>
                                )}
                                {s.valore_atteso && (
                                  <span>
                                    <span className="text-[var(--accent)]">valore</span>{" "}
                                    · {s.valore_atteso}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-[var(--text-tertiary)] max-w-3xl">
          Il modello reale gira su Vertex AI in Europa (Milano). I dati restano nel
          perimetro Google Cloud del tuo progetto.
        </p>
      </div>
    </section>
  );
};

export default InteractiveDemo;
