import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Loader2, MousePointer2 } from "lucide-react";
import { useReveal } from "../../lib/useReveal";

// Lazy import: Spline runtime + react binding (~700 kB) caricati SOLO quando
// la sezione entra in viewport. Niente costo sul first paint dell'home.
const Spline = lazy(() => import("@splinetool/react-spline"));

const SCENE_URL = "/spline/scene.splinecode";

// Hook: triggera quando un ref entra in viewport (con threshold + rootMargin),
// rimane true per sempre (non rimonta lo Spline se l'utente scrolla via).
function useInViewportOnce(rootMargin = "200px") {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [inView, rootMargin]);

  return [ref, inView];
}

const SkeletonSpline = () => (
  <div
    className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[var(--text-tertiary)]"
    aria-hidden="true"
  >
    <Loader2 size={28} className="text-[var(--accent)] spin" />
    <p className="text-xs font-mono">Caricamento agente 3D...</p>
  </div>
);

export const RobotShowcase = () => {
  const revealRef = useReveal();
  const [viewRef, inView] = useInViewportOnce("200px");
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const shouldRenderSpline = inView && !reduced;

  return (
    <section
      ref={revealRef}
      id="agente"
      className="reveal py-24 lg:py-32 bg-[var(--bg-secondary)] border-y border-[var(--border-subtle)]"
      data-testid="robot-showcase-section"
    >
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-xs uppercase tracking-[0.2em] font-mono text-[var(--accent)] mb-4">
            Agenti
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">
            Non solo software. Agenti.
          </h2>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
            Software che esegue. Agenti che decidono. Quando i processi
            richiedono giudizio — non solo regole — costruiamo agenti che
            ragionano sui dati e agiscono al posto delle persone.
          </p>
        </div>

        <div
          ref={viewRef}
          className="relative w-full rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-elevated)] aspect-[16/10] lg:aspect-[16/9]"
          data-testid="robot-canvas"
        >
          {!shouldRenderSpline && <SkeletonSpline />}
          {shouldRenderSpline && (
            <Suspense fallback={<SkeletonSpline />}>
              <Spline scene={SCENE_URL} className="!w-full !h-full" />
            </Suspense>
          )}

          {!reduced && (
            <div
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-primary)]/70 backdrop-blur-sm border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] pointer-events-none"
              aria-hidden="true"
            >
              <MousePointer2 size={12} className="text-[var(--accent)]" />
              <span>Muovi il mouse</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default RobotShowcase;
