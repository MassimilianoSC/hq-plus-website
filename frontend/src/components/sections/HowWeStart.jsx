import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { useReveal } from "../../lib/useReveal";

const scrollToContact = (e) => {
  e.preventDefault();
  document
    .querySelector("#contatti")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export const HowWeStart = () => {
  const ref = useReveal();
  return (
    <section
      ref={ref}
      id="inizio"
      className="reveal reveal-stagger py-24 lg:py-32 bg-[var(--bg-secondary)] border-y border-[var(--border-subtle)]"
      data-testid="how-we-start-section"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="reveal-item max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--accent)] mb-4">
            Inizio
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">
            Come iniziamo a lavorare insieme
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card 1 — Audit gratuito */}
          <div
            className="reveal-item reveal-item-1 card-glow relative p-8 lg:p-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col"
            data-testid="start-card-audit"
          >
            <p className="text-xs uppercase tracking-[0.18em] font-mono text-[var(--text-tertiary)] mb-4">
              Step 1
            </p>
            <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-2 tracking-tight">
              Audit gratuito
            </h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-mono font-semibold text-[var(--text-primary)]">
                0€
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                / call di 60 minuti
              </span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6 text-[15px]">
              Una call di 60 minuti. Mappiamo insieme 1-2 dei tuoi processi,
              identifichiamo dove l'automazione ha senso, ti diamo una stima di
              ROI concreta. Senza impegno.
            </p>
            <ul className="space-y-2 mb-8 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <Check size={14} className="text-[var(--accent)] mt-1 shrink-0" />
                Mappa di 1-2 processi candidati
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-[var(--accent)] mt-1 shrink-0" />
                Stima di ROI in tempo e costo
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-[var(--accent)] mt-1 shrink-0" />
                Nessun impegno post-call
              </li>
            </ul>
            <a
              href="#contatti"
              onClick={scrollToContact}
              className="mt-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md border border-[var(--border-strong)] text-[var(--text-primary)] font-medium text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              data-testid="start-cta-audit"
            >
              Prenotala <ArrowRight size={14} />
            </a>
          </div>

          {/* Card 2 — Primo workflow (highlighted) */}
          <div
            className="reveal-item reveal-item-2 relative p-8 lg:p-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--accent)] flex flex-col cta-glow"
            data-testid="start-card-workflow"
          >
            <span className="absolute -top-3 left-8 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-mono bg-[var(--accent)] text-[var(--bg-primary)] rounded-full font-semibold">
              Più scelto
            </span>
            <p className="text-xs uppercase tracking-[0.18em] font-mono text-[var(--accent)] mb-4">
              Step 2
            </p>
            <h3 className="text-2xl font-semibold text-[var(--text-primary)] mb-2 tracking-tight">
              Primo workflow a costo fisso
            </h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-sm text-[var(--text-tertiary)]">da</span>
              <span className="text-4xl font-mono font-semibold text-[var(--text-primary)]">
                3.000€
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                / 2-4 settimane
              </span>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-6 text-[15px]">
              Implementiamo la prima automazione end-to-end in 2-4 settimane.
              Costo definito in anticipo. Se non genera valore misurabile entro
              60 giorni, ti rimborsiamo.
            </p>
            <ul className="space-y-2 mb-8 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <Check size={14} className="text-[var(--accent)] mt-1 shrink-0" />
                Prezzo fisso, nessuna sorpresa
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-[var(--accent)] mt-1 shrink-0" />
                Integrazione coi tuoi sistemi
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-[var(--accent)] mt-1 shrink-0" />
                Garanzia di valore a 60 giorni
              </li>
            </ul>
            <a
              href="#contatti"
              onClick={scrollToContact}
              className="mt-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-[var(--accent)] text-[var(--bg-primary)] font-medium text-sm hover:bg-[var(--accent-hover)] transition-colors"
              data-testid="start-cta-workflow"
            >
              Parliamone <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowWeStart;
