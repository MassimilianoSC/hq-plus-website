import { animate } from "motion/mini";

export function initIntegrationMotion() {
  const stage = document.querySelector("[data-integration-core]");
  if (!stage || !("IntersectionObserver" in window)) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  let stageIsVisible = false;
  let animations = [];

  const shouldAnimate = () =>
    stageIsVisible &&
    !document.hidden &&
    !reducedMotion.matches &&
    connection?.saveData !== true;

  function stopAnimations() {
    animations.forEach((animation) => animation.stop());
    animations = [];
  }

  function startAnimations() {
    if (animations.length || !shouldAnimate()) return;

    const outerOrbit = stage.querySelector('[data-motion-orbit="outer"]');
    const innerOrbit = stage.querySelector('[data-motion-orbit="inner"]');
    const coreRing = stage.querySelector("[data-motion-core-ring]");
    const core = stage.querySelector("[data-motion-core]");
    const flows = stage.querySelectorAll("[data-motion-flow]");
    const signals = stage.querySelectorAll("[data-motion-signal]");

    if (outerOrbit) {
      animations.push(
        animate(
          outerOrbit,
          { transform: ["rotate(0deg)", "rotate(360deg)"] },
          { duration: 116, repeat: Infinity, ease: "linear" },
        ),
      );
    }
    if (innerOrbit) {
      animations.push(
        animate(
          innerOrbit,
          { transform: ["rotate(-32deg)", "rotate(-392deg)"] },
          { duration: 82, repeat: Infinity, ease: "linear" },
        ),
      );
    }
    if (coreRing) {
      animations.push(
        animate(
          coreRing,
          { transform: ["scale(0.94) rotate(0deg)", "scale(0.94) rotate(360deg)"] },
          { duration: 32, repeat: Infinity, ease: "linear" },
        ),
      );
    }
    if (core) {
      animations.push(
        animate(
          core,
          { transform: ["scale(1)", "scale(1.035)", "scale(1)"] },
          { duration: 7, repeat: Infinity, ease: "easeInOut" },
        ),
      );
    }

    flows.forEach((flow, index) => {
      animations.push(
        animate(
          flow,
          { strokeDashoffset: [0, -42] },
          { duration: 5.4, delay: index * 0.55, repeat: Infinity, ease: "linear" },
        ),
      );
    });

    signals.forEach((signal, index) => {
      animations.push(
        animate(
          signal,
          { offsetDistance: ["0%", "100%"] },
          {
            duration: index === 0 ? 21 : 28,
            delay: index === 0 ? 0 : -13,
            repeat: Infinity,
            ease: "linear",
          },
        ),
      );
    });
  }

  function syncAnimations() {
    if (shouldAnimate()) startAnimations();
    else stopAnimations();
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      stageIsVisible = entry.isIntersecting;
      syncAnimations();
    },
    { threshold: 0.2 },
  );
  observer.observe(stage);

  document.addEventListener("visibilitychange", syncAnimations);
  reducedMotion.addEventListener?.("change", syncAnimations);
  connection?.addEventListener?.("change", syncAnimations);

  return () => {
    observer.disconnect();
    stopAnimations();
    document.removeEventListener("visibilitychange", syncAnimations);
    reducedMotion.removeEventListener?.("change", syncAnimations);
    connection?.removeEventListener?.("change", syncAnimations);
  };
}
