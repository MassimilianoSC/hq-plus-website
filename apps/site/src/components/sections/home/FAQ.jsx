import React from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Lavorate solo con grandi aziende o anche con PMI?",
    a: "Lavoriamo con entrambe. Le PMI sono spesso il caso più interessante: meno legacy, decisioni rapide, ROI immediato. Il primo workflow a costo fisso è pensato proprio per partire piccoli e scalare.",
  },
  {
    q: "I miei dati dove vanno a finire?",
    a: "I documenti caricati nella demo non vengono mai salvati né da noi né da Google. Il PDF viene inviato a Google Gemini per l'estrazione e processato in memoria; al termine viene immediatamente cancellato. Conserviamo solo metadati operativi anonimizzati (IP hashato, durata, esito) per 30 giorni a fini di sicurezza e prevenzione abuso. Per il servizio professionale offriamo data residency dedicata e contratti DPA — parlane con noi.",
  },
  {
    q: "Quanto tempo serve per vedere risultati?",
    a: "Il primo workflow va in produzione in 2-4 settimane. I risultati misurabili (tempo risparmiato, errori ridotti) sono visibili entro 60 giorni — è la finestra della nostra garanzia di valore.",
  },
  {
    q: "Quali sistemi/gestionali integrate?",
    a: "I principali ERP (SAP, Oracle, Microsoft Dynamics), CRM (Salesforce, HubSpot, Pipedrive), suite documentali (M365, Google Workspace), database SQL/NoSQL, sistemi custom via API o RPA. Se ha un'API o un export, ci si integra.",
  },
  {
    q: "Cosa succede se cambia il processo dopo che è automatizzato?",
    a: "I workflow sono modulari per design. Una variazione di processo richiede un intervento di poche ore o giorni, non la riscrittura completa. Includiamo manutenzione evolutiva nei contratti annuali.",
  },
  {
    q: "Cosa significa essere parte del gruppo HQ | Industrial Assets?",
    a: "Significa solidità finanziaria, vent'anni di operatività su processi industriali reali, certificazioni (ISO 9001, 14001, 45001) e clienti come Fastweb, TIM, Vodafone, Cellnex, INWIT, Leonardo. Non siamo una startup che sparirà tra 18 mesi.",
  },
];

export const FAQ = () => {
  return (
    <section
      id="faq"
      className="cosmic-section cosmic-section--quiet reveal py-24 lg:py-32"
      data-testid="faq-section"
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--accent)] mb-4">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">
            Domande frequenti
          </h2>
        </div>

        <div className="w-full">
          {FAQS.map((item, i) => (
            <details
              key={i}
              name="hq-plus-faq"
              className="group border-b border-[var(--border-subtle)]"
              data-testid={`faq-item-${i + 1}`}
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left text-base font-medium tracking-tight text-[var(--text-primary)] transition-colors hover:text-[var(--accent)] sm:text-lg [&::-webkit-details-marker]:hidden"
                data-testid={`faq-trigger-${i + 1}`}
              >
                {item.q}
                <ChevronDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
                />
              </summary>
              <div
                className="pr-8 pb-6 text-[15px] leading-relaxed text-[var(--text-secondary)]"
                data-testid={`faq-content-${i + 1}`}
              >
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
