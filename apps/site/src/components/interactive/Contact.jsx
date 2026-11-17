import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getAppCheckTokenOnDemand } from "@/lib/firebase/getTokenOnDemand";

// In production this resolves via Firebase Hosting rewrite to Cloud Function `submitLead`.
// Optional override; defaults to the same-origin Firebase Hosting rewrite.
const SUBMIT_URL = import.meta.env.PUBLIC_SUBMIT_LEAD_URL || "/submitLead";

const initialState = {
  name: "",
  email: "",
  company: "",
  role: "",
  message: "",
};

const validate = (v) => {
  const errs = {};
  if (!v.name.trim()) errs.name = "Inserisci nome e cognome.";
  if (!v.email.trim()) errs.email = "Inserisci la tua email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
    errs.email = "Email non valida.";
  if (!v.company.trim()) errs.company = "Inserisci il nome della tua azienda.";
  return errs;
};

export const Contact = () => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState("idle"); // idle | loading | success | error
  const [serverMsg, setServerMsg] = useState("");

  const onChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setState("loading");
    setServerMsg("");
    try {
      const headers = { "Content-Type": "application/json" };
      const appCheckToken = await getAppCheckTokenOnDemand();
      if (appCheckToken) headers["X-Firebase-AppCheck"] = appCheckToken;
      const res = await fetch(SUBMIT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setState("success");
      setValues(initialState);
    } catch (err) {
      setState("error");
      setServerMsg(
        err.message ||
          "Invio non riuscito. Riprova tra qualche minuto o scrivici a info@hqflow.it.",
      );
    }
  };

  return (
    <section
      id="contatti"
      className="cosmic-section cosmic-section--contact reveal py-24 lg:py-32"
      data-testid="contact-section"
    >
      <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
        <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--accent)] mb-4">
          Contatti
        </p>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">
          Vediamoci.
        </h2>
        <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-12">
          Un'ora del tuo tempo, una mappatura concreta di cosa possiamo automatizzare.
          Zero PowerPoint.
        </p>

        {state === "success" ? (
          <div
            className="p-8 rounded-lg border border-[var(--accent)] bg-[var(--accent-tint-04)] text-left"
            data-testid="contact-success-message"
          >
            <CheckCircle2 className="text-[var(--accent)] mb-3" size={24} />
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              Richiesta ricevuta.
            </h3>
            <p className="text-[var(--text-secondary)]">
              Ti rispondiamo entro 24 ore lavorative all'indirizzo che hai indicato.
            </p>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="text-left space-y-5"
            data-testid="contact-form"
            noValidate
          >
            <Field
              id="name"
              label="Nome e cognome"
              required
              value={values.name}
              onChange={onChange}
              error={errors.name}
              testId="contact-input-name"
            />
            <Field
              id="email"
              label="Email aziendale"
              type="email"
              required
              value={values.email}
              onChange={onChange}
              error={errors.email}
              testId="contact-input-email"
            />
            <Field
              id="company"
              label="Azienda"
              required
              value={values.company}
              onChange={onChange}
              error={errors.company}
              testId="contact-input-company"
            />
            <Field
              id="role"
              label="Ruolo"
              value={values.role}
              onChange={onChange}
              testId="contact-input-role"
            />
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
              >
                Cosa vorresti automatizzare?
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={values.message}
                onChange={onChange}
                placeholder="Es. processo di onboarding clienti, triage email, estrazione dati da contratti..."
                className="w-full px-4 py-3 rounded-[4px] bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-[15px] focus:border-[var(--accent)] focus:outline-none transition-colors resize-y"
                data-testid="contact-input-message"
              />
            </div>

            {state === "error" && (
              <div
                className="flex items-start gap-2 p-3 rounded-md border border-[var(--border-subtle)] bg-[rgba(239,68,68,0.08)] text-sm text-[var(--text-secondary)]"
                data-testid="contact-error-message"
              >
                <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <span>{serverMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={state === "loading"}
              className="button-primary cta-glow w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[var(--accent)] text-[var(--accent-foreground)] font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-60"
              data-testid="contact-submit-button"
            >
              {state === "loading" ? (
                <>
                  <Loader2 size={16} className="spin" /> Invio...
                </>
              ) : (
                <>
                  Invia richiesta <Send size={14} />
                </>
              )}
            </button>

            <p className="text-xs text-[var(--text-tertiary)] text-center">
              Ti rispondiamo entro 24 ore lavorative.
            </p>
          </form>
        )}
      </div>
    </section>
  );
};

const Field = ({
  id,
  label,
  type = "text",
  required,
  value,
  onChange,
  error,
  testId,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
    >
      {label} {required && <span className="text-[var(--accent)]">*</span>}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={onChange}
      autoComplete={id === "email" ? "email" : "off"}
      className={`w-full px-4 py-3 rounded-[4px] bg-[var(--bg-primary)] border ${
        error ? "border-red-500" : "border-[var(--border-subtle)]"
      } text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-[15px] focus:border-[var(--accent)] focus:outline-none transition-colors`}
      data-testid={testId}
    />
    {error && (
      <p className="mt-1.5 text-xs text-red-400" data-testid={`${testId}-error`}>
        {error}
      </p>
    )}
  </div>
);

export default Contact;
