import { useEffect, useRef } from "react";

// Aggiunge un parallax verticale all'elemento: trasla in Y di scrollY*speed.
// speed positiva → lento (l'elemento "rimane indietro"); negativa → veloce.
// L'elemento riceve la transform via CSS variable --parallax-y.
// Skippato se prefers-reduced-motion attivo.
export function useParallax(speed = 0.15) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let scrollY = window.scrollY;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--parallax-y", `${scrollY * speed}px`);
    };

    const onScroll = () => {
      scrollY = window.scrollY;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return ref;
}
