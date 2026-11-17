import React from "react";

const CLIENTS = ["Fastweb", "Vodafone", "Cellnex", "INWIT", "Leonardo", "TIM"];

export const HeritageStrip = () => {
  return (
    <section
      className="cosmic-section cosmic-section--horizon reveal reveal-stagger py-16 border-y border-[var(--border-subtle)]"
      data-testid="heritage-strip"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <p className="reveal-item text-xs uppercase tracking-[0.2em] font-mono text-[var(--text-tertiary)] mb-8">
          Vent'anni di esperienza al fianco di
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6">
          {CLIENTS.map((c, i) => (
            <span
              key={c}
              className={`reveal-item reveal-item-${i + 1} text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors`}
              data-testid={`client-logo-${c.toLowerCase()}`}
            >
              {c}
            </span>
          ))}
        </div>
        <p className="mt-8 text-xs text-[var(--text-tertiary)] max-w-2xl">
          Loghi mostrati in qualità di clienti del gruppo HQ | Industrial Assets.
        </p>
      </div>
    </section>
  );
};

export default HeritageStrip;
