import React from "react";

export const OriginStory = () => {
  return (
    <section
      id="origine"
      className="cosmic-section cosmic-section--birth reveal py-24 lg:py-32"
      data-testid="origin-story-section"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div className="lg:sticky lg:top-32">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--accent)] mb-6">
            La nostra origine
          </p>
          <blockquote
            className="font-mono text-3xl sm:text-4xl lg:text-5xl leading-[1.15] text-[var(--text-primary)] tracking-tight"
            data-testid="origin-pull-quote"
          >
            <span className="text-[var(--accent)]">40+</span> workflow automatizzati
            internamente.
            <br />
            In <span className="text-[var(--accent)]">18 mesi</span>.
          </blockquote>
        </div>

        <div className="space-y-8 text-[var(--text-secondary)] text-base sm:text-lg leading-relaxed">
          <p data-testid="origin-paragraph-1">
            Il gruppo HQ ha vent'anni di operatività su processi tecnici complessi:
            telecomunicazioni, energie rinnovabili, e-mobility, infrastrutture
            elettriche. Sappiamo cosa significa far girare un backoffice industriale
            ogni giorno.
          </p>
          <p data-testid="origin-paragraph-2">
            Negli ultimi 18 mesi abbiamo automatizzato oltre 40 processi interni —
            dall'estrazione dati da documentazione tecnica alla qualificazione lead,
            dalla gestione permessi alla triage email. Tutto costruito da chi quei
            processi li vive.
          </p>
          <p
            className="text-[var(--text-primary)] font-medium"
            data-testid="origin-paragraph-3"
          >
            Funziona così bene che abbiamo creato HQ Plus per portarlo fuori.
          </p>
        </div>
      </div>
    </section>
  );
};

export default OriginStory;
