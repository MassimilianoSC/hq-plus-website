import React from "react";
import { Logo } from "../Logo";

const scrollTo = (href) => (e) => {
  e.preventDefault();
  document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
};

export const Footer = () => {
  return (
    <footer
      className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]"
      data-testid="site-footer"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Col 1 */}
          <div>
            <Logo size="md" variant="cyan" />
            <p className="mt-4 text-sm text-[var(--text-tertiary)] leading-relaxed">
              Workflow automation, dal gruppo HQ dal 1999.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--text-tertiary)] mb-4">
              Servizi
            </p>
            <ul className="space-y-2 text-sm">
              {[
                ["Come lavoriamo", "#come-lavoriamo"],
                ["Casi d'uso", "#casi"],
                ["Demo", "#demo"],
                ["Inizio", "#inizio"],
                ["FAQ", "#faq"],
              ].map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={scrollTo(href)}
                    className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    data-testid={`footer-link-${label.toLowerCase().replace(/[^a-z]/g, "-")}`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--text-tertiary)] mb-4">
              Gruppo
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.hqe.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                  data-testid="footer-link-hq-group"
                >
                  HQ | Industrial Assets
                </a>
              </li>
              {/* TODO: replace # with real legal pages */}
              {[
                ["Privacy", "#"],
                ["Cookie", "#"],
                ["Modello 231", "#"],
                ["Codice Etico", "#"],
              ].map(([label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                    data-testid={`footer-link-${label.toLowerCase().replace(/[^a-z]/g, "-")}`}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--text-tertiary)] mb-4">
              Contatti
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:info@hqflow.it"
                  className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                  data-testid="footer-email"
                >
                  info@hqflow.it
                </a>
              </li>
              <li className="text-[var(--text-secondary)]">
                Via Stephenson 29
                <br />
                Milano, Italia
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--text-tertiary)] font-mono">
            © 2026 HQ | Flow — Parte del gruppo HQ | Industrial Assets — P.IVA da definire
          </p>
          <p className="text-xs text-[var(--text-tertiary)] font-mono">
            Certificazioni del gruppo: ISO 9001, ISO 14001, ISO 45001
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
