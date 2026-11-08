import React from "react";
import { Radio, Mail, FileSearch, Target } from "lucide-react";
import { useReveal } from "../../lib/useReveal";
import CountUp from "../CountUp";

const CASES = [
  {
    icon: Radio,
    title: "Grande operatore telco italiano",
    desc: "Automazione del workflow di acquisizione e rinegoziazione siti SRB: estrazione dati da contratti, generazione documenti, tracking iter autorizzativi.",
    metric: { prefix: "−", value: 70, suffix: "% tempo per pratica" },
  },
  {
    icon: Mail,
    title: "Triage email tecniche",
    desc: "Classificazione automatica e routing di richieste tecniche tra reparti, con bozza di risposta pre-compilata.",
    metric: { prefix: "~", value: 600, suffix: " ore/mese risparmiate" },
  },
  {
    icon: FileSearch,
    title: "Estrazione dati da documentazione di permessi",
    desc: "Lettura automatica di verbali, autorizzazioni, perizie tecniche con output strutturato verso gestionale.",
    metric: { prefix: "−", value: 85, suffix: "% errori di trascrizione" },
  },
  {
    icon: Target,
    title: "Qualificazione lead B2B",
    desc: "Scoring automatico di lead inbound con arricchimento dati e routing al commerciale giusto.",
    metric: { prefix: "", value: 3, suffix: "x conversion rate" },
  },
];

export const UseCases = () => {
  const ref = useReveal();
  return (
    <section
      ref={ref}
      id="casi"
      className="reveal reveal-stagger py-24 lg:py-32"
      data-testid="use-cases-section"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="reveal-item max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--accent)] mb-4">
            Casi d'uso
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--text-primary)]">
            Cosa abbiamo automatizzato
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {CASES.map((c, i) => {
            const Icon = c.icon;
            return (
              <article
                key={c.title}
                className={`reveal-item reveal-item-${i + 1} card-hover card-glow group relative p-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)]`}
                data-testid={`use-case-card-${i + 1}`}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-md bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center">
                    <Icon size={18} className="text-[var(--accent)]" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3 tracking-tight">
                  {c.title}
                </h3>
                <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed mb-6">
                  {c.desc}
                </p>
                <div
                  className="font-mono text-[var(--accent)] text-sm pt-5 border-t border-[var(--border-subtle)]"
                  data-testid={`use-case-metric-${i + 1}`}
                >
                  <CountUp
                    to={c.metric.value}
                    prefix={c.metric.prefix}
                    suffix={c.metric.suffix}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
