import React from "react";

const STEPS = [
  {
    n: "01",
    title: "Audit del processo",
    desc: "Mappiamo il workflow attuale, identifichiamo i punti dove l'automazione genera ROI reale. Niente teoria.",
  },
  {
    n: "02",
    title: "Costruzione del workflow",
    desc: "Sviluppiamo l'automazione integrandola con i tuoi sistemi esistenti — gestionali, CRM, email, documenti.",
  },
  {
    n: "03",
    title: "Misurazione e iterazione",
    desc: "Monitoriamo risultati concreti — tempo risparmiato, errori ridotti — e ottimizziamo continuamente.",
  },
];

export const HowWeWork = () => {
  return (
    <section
      id="come-lavoriamo"
      className="cosmic-section cosmic-section--orbit reveal reveal-stagger py-24 lg:py-32 border-y border-[var(--border-subtle)]"
      data-testid="how-we-work-section"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="reveal-item max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--accent)] mb-4">
            Metodo
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">
            Come lavoriamo
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className={`reveal-item reveal-item-${i + 1} card-hover card-glow relative p-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]`}
              data-testid={`how-we-work-step-${s.n}`}
            >
              <div className="font-mono text-sm text-[var(--accent)] mb-6">{s.n}</div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3 tracking-tight">
                {s.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-[15px]">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowWeWork;
