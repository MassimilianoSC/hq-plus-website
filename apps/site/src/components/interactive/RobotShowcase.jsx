import React, { Suspense, lazy, useEffect, useState } from "react";
import { Loader2, MousePointer2 } from "lucide-react";

// Lazy import: il runtime Spline viene richiesto solo dopo il click esplicito;
// i chunk pesanti restano fuori dal caricamento iniziale della homepage.
const Spline = lazy(() => import("@splinetool/react-spline"));

const SCENE_URL = "/media/interactive/scene.splinecode";

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
  const [activated, setActivated] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mql.matches);
    const onChange = (e) => setReduced(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const shouldRenderSpline = activated && !reduced;

  return (
    <section
      id="agente"
      className="cosmic-section cosmic-section--nebula reveal py-24 lg:py-32 border-y border-[var(--border-subtle)]"
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
            Software che esegue. Agenti che decidono. Quando i processi richiedono
            giudizio — non solo regole — costruiamo agenti che ragionano sui dati e
            agiscono al posto delle persone.
          </p>
        </div>

        <div
          className="relative w-full rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-elevated)] aspect-[16/10] lg:aspect-[16/9]"
          data-testid="robot-canvas"
        >
          {!activated && !reduced && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="max-w-md text-sm text-[var(--text-secondary)]">
                L'esperienza 3D è facoltativa e viene caricata solo su richiesta.
              </p>
              <button
                type="button"
                onClick={() => setActivated(true)}
                className="button-primary inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-5 py-3 text-sm font-medium text-[var(--accent-foreground)] transition-colors hover:bg-[var(--accent-hover)]"
                data-testid="robot-load-button"
              >
                <MousePointer2 size={15} /> Carica esperienza 3D
              </button>
            </div>
          )}
          {reduced && (
            <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-[var(--text-secondary)]">
              Esperienza 3D disattivata in base alle preferenze di movimento del
              dispositivo.
            </p>
          )}
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
