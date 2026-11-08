import { useEffect, useRef } from "react";

// Aggiorna --spot-x e --spot-y (in px relativi all'elemento) sul ref passato.
// Usa requestAnimationFrame per limitare la frequenza di repaint.
// Su touch/coarse pointer non si attiva — risparmia listener mobile.
export function useMouseSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    let raf = 0;
    let lastX = 0;
    let lastY = 0;

    const apply = () => {
      raf = 0;
      el.style.setProperty("--spot-x", `${lastX}px`);
      el.style.setProperty("--spot-y", `${lastY}px`);
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      el.style.setProperty("--spot-opacity", "0");
    };

    const onEnter = () => {
      el.style.setProperty("--spot-opacity", "1");
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return ref;
}
