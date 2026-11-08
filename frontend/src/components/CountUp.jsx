import React, { useEffect, useRef, useState } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const formatNumber = (n, decimals) => {
  const v = decimals > 0 ? n.toFixed(decimals) : Math.round(n).toString();
  // Separatore migliaia stile italiano (3.000)
  const [intPart, decPart] = v.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decPart ? `${withSep},${decPart}` : withSep;
};

export const CountUp = ({
  to,
  from = 0,
  duration = 1400,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}) => {
  const ref = useRef(null);
  const [value, setValue] = useState(from);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setValue(to);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const tick = (now) => {
              const t = Math.min(1, (now - start) / duration);
              setValue(from + (to - from) * easeOutCubic(t));
              if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [from, to, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(value, decimals)}
      {suffix}
    </span>
  );
};

export default CountUp;
