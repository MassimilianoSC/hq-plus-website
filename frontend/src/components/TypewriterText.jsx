import React, { useEffect, useRef, useState } from "react";

// Stampa progressivamente `text` come se fosse digitato.
// `charsPerTick` = caratteri per frame (~60fps), default 8 → ~480 char/sec.
// Skip su prefers-reduced-motion: testo intero subito.
// Click sul pannello completa subito.
export const TypewriterText = ({
  text = "",
  charsPerTick = 8,
  className,
  caret = true,
  ...rest
}) => {
  const [shown, setShown] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    setShown(0);
    if (!text) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text.length);
      return;
    }
    startRef.current = 0;
    const tick = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsedFrames = (ts - startRef.current) / 16.67; // ~60fps base
      const next = Math.min(text.length, Math.floor(elapsedFrames * charsPerTick));
      setShown(next);
      if (next < text.length) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [text, charsPerTick]);

  const skipToEnd = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setShown(text.length);
  };

  const isDone = shown >= text.length;

  return (
    <pre
      {...rest}
      className={className}
      onClick={!isDone ? skipToEnd : undefined}
      style={!isDone ? { cursor: "pointer" } : undefined}
      title={!isDone ? "Click per completare" : undefined}
    >
      {text.slice(0, shown)}
      {caret && !isDone && <span className="typewriter-caret">▍</span>}
    </pre>
  );
};

export default TypewriterText;
