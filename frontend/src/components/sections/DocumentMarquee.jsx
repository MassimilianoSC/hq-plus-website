import React from "react";
import { FileText } from "lucide-react";

const DOCS = [
  "Fatture",
  "DDT",
  "Contratti",
  "Email tecniche",
  "Verbali",
  "Autorizzazioni",
  "Perizie",
  "Permessi",
  "Capitolati",
  "Offerte",
  "Manuali",
  "Comunicazioni",
];

export const DocumentMarquee = () => {
  return (
    <section
      className="marquee-section py-10 bg-[var(--bg-secondary)] border-y border-[var(--border-subtle)] overflow-hidden"
      data-testid="document-marquee"
      aria-label="Tipi di documento processabili"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 mb-3">
        <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--text-tertiary)]">
          Cosa elaboriamo
        </p>
      </div>
      <div className="marquee-track" aria-hidden="true">
        {/* Doppia lista per loop seamless */}
        {[0, 1].map((seq) => (
          <div className="marquee-row" key={seq}>
            {DOCS.map((d, i) => (
              <span className="marquee-item" key={`${seq}-${i}`}>
                <FileText
                  size={14}
                  className="text-[var(--accent)] opacity-70"
                />
                <span>{d}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default DocumentMarquee;
