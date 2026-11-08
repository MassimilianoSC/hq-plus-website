import React from "react";
import { ArrowRight, PlayCircle } from "lucide-react";

const scrollTo = (href) => (e) => {
  e.preventDefault();
  const el = document.querySelector(href);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

// Hook minimale per matchMedia (inline, no nuove dipendenze).
const useMediaQuery = (query) => {
  const [matches, setMatches] = React.useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  React.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};

// Velocità di riproduzione del video di sfondo. 1.0 = velocità reale.
// 0.5 = metà (slow-motion percepibile). Valori 0.6–0.8 sono "rallentati ma naturali".
const HERO_VIDEO_SPEED = 0.45;

// Sfondo full-bleed dell'hero. Mobile/reduced-motion → solo poster statico.
const HeroBgMedia = () => {
  const isLg = useMediaQuery("(min-width: 1024px)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const showVideo = isLg && !reduced;
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = HERO_VIDEO_SPEED;
    }
  }, [showVideo]);

  if (!showVideo) {
    return (
      <div
        className="hero-bg-poster"
        style={{ backgroundImage: "url(/videos/hero-poster.webp)" }}
        aria-hidden="true"
        data-testid="hero-bg-poster"
      />
    );
  }
  return (
    <video
      ref={videoRef}
      className="hero-bg-video"
      autoPlay
      loop
      muted
      playsInline
      poster="/videos/hero-poster.webp"
      preload="metadata"
      aria-hidden="true"
      data-testid="hero-bg-video"
    >
      <source src="/videos/hero.webm" type="video/webm" />
      <source src="/videos/hero.mp4" type="video/mp4" />
    </video>
  );
};

export const Hero = () => {
  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-start overflow-hidden pt-24 pb-20"
      data-testid="hero-section"
    >
      <HeroBgMedia />
      <div className="hero-bg-overlay" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto w-full px-6 lg:px-8">
        <div className="max-w-4xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/70 backdrop-blur-sm text-xs text-[var(--text-secondary)] font-mono mb-8 animate-fade-up"
            data-testid="hero-badge"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
            <span>Workflow automation · dal gruppo HQ dal 1999</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-[64px] leading-[1.05] font-semibold tracking-tight text-[var(--text-primary)] animate-fade-up"
            style={{ animationDelay: "80ms" }}
            data-testid="hero-headline"
          >
            Automatizziamo i processi che la tua azienda{" "}
            <span className="text-[var(--accent)]">esegue ogni giorno</span>.
          </h1>

          <p
            className="mt-6 text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed animate-fade-up"
            style={{ animationDelay: "180ms" }}
            data-testid="hero-subheadline"
          >
            Software, agenti e workflow che fanno il lavoro ripetitivo al posto
            delle persone. Costruiti dentro un gruppo industriale italiano, ora
            disponibili anche per te.
          </p>

          <div
            className="mt-10 flex flex-col sm:flex-row gap-3 animate-fade-up"
            style={{ animationDelay: "280ms" }}
          >
            <a
              href="#contatti"
              onClick={scrollTo("#contatti")}
              className="cta-glow inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:bg-[var(--accent-hover)] transition-colors text-[15px]"
              data-testid="hero-primary-cta"
            >
              Prenota un audit gratuito
              <ArrowRight size={16} strokeWidth={2.2} />
            </a>
            <a
              href="#demo"
              onClick={scrollTo("#demo")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-md border border-[var(--border-strong)] bg-[var(--bg-primary)]/30 backdrop-blur-sm text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-[15px]"
              data-testid="hero-secondary-cta"
            >
              <PlayCircle size={16} strokeWidth={2} />
              Guarda la demo
            </a>
          </div>

          <p
            className="mt-8 text-xs font-mono text-[var(--text-tertiary)] animate-fade-up"
            style={{ animationDelay: "380ms" }}
            data-testid="hero-heritage-line"
          >
            Parte del gruppo HQ | Industrial Assets, dal 1999
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
