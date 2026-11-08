import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { useReveal } from "../../lib/useReveal";

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
  const ref = useReveal();
  return (
    <section
      ref={ref}
      id="faq"
      className="reveal py-24 lg:py-32"
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

        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border-b border-[var(--border-subtle)]"
              data-testid={`faq-item-${i + 1}`}
            >
              <AccordionTrigger
                className="text-left py-6 text-[var(--text-primary)] hover:text-[var(--accent)] hover:no-underline text-base sm:text-lg font-medium tracking-tight"
                data-testid={`faq-trigger-${i + 1}`}
              >
                {item.q}
              </AccordionTrigger>
              <AccordionContent
                className="pb-6 text-[var(--text-secondary)] text-[15px] leading-relaxed pr-8"
                data-testid={`faq-content-${i + 1}`}
              >
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
