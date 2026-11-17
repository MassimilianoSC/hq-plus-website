const PALETTE_TOKENS = {
  blue: "--cosmos-canvas-blue",
  violet: "--cosmos-canvas-violet",
  cyan: "--cosmos-canvas-cyan",
  chrome: "--cosmos-canvas-chrome",
  starOpacity: "--cosmos-canvas-star-opacity",
  nebulaOpacity: "--cosmos-canvas-nebula-opacity",
  pointerOpacity: "--cosmos-canvas-pointer-opacity",
};

const NEBULA_LAYOUT = [
  { x: 0.12, y: 0.18, size: 0.55, depth: 0.22, color: "blue" },
  { x: 0.78, y: 0.42, size: 0.62, depth: 0.74, color: "violet" },
  { x: 0.43, y: 0.92, size: 0.48, depth: 0.46, color: "cyan" },
  { x: 0.96, y: 0.08, size: 0.36, depth: 0.9, color: "chrome" },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const wrap = (value, length) => ((value % length) + length) % length;

function readPalette() {
  const styles = getComputedStyle(document.documentElement);
  const read = (token, fallback) =>
    styles.getPropertyValue(PALETTE_TOKENS[token]).trim() || fallback;
  const opacity = (token, fallback) =>
    Number.parseFloat(read(token, String(fallback))) || fallback;

  return {
    blue: read("blue", "60, 87, 183"),
    violet: read("violet", "126, 82, 190"),
    cyan: read("cyan", "76, 141, 183"),
    chrome: read("chrome", "155, 166, 184"),
    starOpacity: opacity("starOpacity", 0.62),
    nebulaOpacity: opacity("nebulaOpacity", 0.085),
    pointerOpacity: opacity("pointerOpacity", 0.06),
  };
}

function buildStars(width, height) {
  const count = clamp(Math.round((width * height) / 8200), 72, 180);
  return Array.from({ length: count }, () => {
    const colorRoll = Math.random();
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      depth: 0.12 + Math.random() * 0.88,
      radius:
        Math.random() < 0.12 ? 0.9 + Math.random() * 0.85 : 0.2 + Math.random() * 0.62,
      opacity: 0.35 + Math.random() * 0.65,
      twinkleSpeed: 0.35 + Math.random() * 1.25,
      phase: Math.random() * Math.PI * 2,
      driftSpeed: 0.55 + Math.random() * 0.7,
      color:
        colorRoll < 0.56
          ? "chrome"
          : colorRoll < 0.79
            ? "blue"
            : colorRoll < 0.94
              ? "violet"
              : "cyan",
    };
  });
}

export function initCosmicField() {
  const canvas = document.querySelector("[data-cosmos-canvas]");
  const context = canvas?.getContext("2d", { alpha: true, desynchronized: true });
  if (!canvas || !context) return;

  const root = document.documentElement;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const connection = navigator.connection;
  const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, active: false };
  const introStartedAt =
    window.scrollY < window.innerHeight * 0.25 ? performance.now() : 0;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let stars = [];
  let colors = readPalette();
  let scrollY = window.scrollY;
  let frame = 0;
  let lastFrame = 0;
  let warpStartedAt = 0;
  let lastWarpAt = 0;
  let activeSection = "";
  let visible = !document.hidden;

  const warpRays = Array.from({ length: 72 }, () => ({
    angle: Math.random() * Math.PI * 2,
    length: 0.45 + Math.random() * 0.75,
    inner: 0.12 + Math.random() * 0.2,
    color: ["blue", "violet", "cyan"][Math.floor(Math.random() * 3)],
    opacity: 0.25 + Math.random() * 0.55,
  }));

  const saveDataEnabled = () => connection?.saveData === true;
  const motionEnabled = () => !motionQuery.matches && !saveDataEnabled();

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, coarsePointer.matches ? 1.25 : 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = buildStars(width, height);
    render(performance.now(), false);
  }

  function drawNebulae(time, animate) {
    const drift = animate ? time * 0.00008 : 0;
    const parallaxX = animate ? pointer.x * 18 : 0;
    const parallaxY = animate ? pointer.y * 12 : 0;
    const radiusUnit = Math.min(width, height);

    NEBULA_LAYOUT.forEach((nebula, index) => {
      const phase = drift + index * 1.7;
      const x =
        nebula.x * width +
        Math.sin(phase) * width * 0.02 +
        parallaxX * nebula.depth -
        (animate ? scrollY * 0.008 * nebula.depth : 0);
      const y =
        nebula.y * height +
        Math.cos(phase * 0.8) * height * 0.017 +
        parallaxY * nebula.depth -
        (animate ? scrollY * 0.012 * nebula.depth : 0);
      const radius = radiusUnit * nebula.size;
      const strength = colors.nebulaOpacity * (nebula.color === "chrome" ? 0.42 : 0.86);
      const gradient = context.createRadialGradient(x, y, radius * 0.02, x, y, radius);

      gradient.addColorStop(0, `rgba(${colors[nebula.color]}, ${strength})`);
      gradient.addColorStop(0.36, `rgba(${colors[nebula.color]}, ${strength * 0.5})`);
      gradient.addColorStop(0.72, `rgba(${colors[nebula.color]}, ${strength * 0.14})`);
      gradient.addColorStop(1, `rgba(${colors[nebula.color]}, 0)`);

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawStars(time, animate) {
    stars.forEach((star) => {
      const drift = time * 0.000024 * star.driftSpeed + star.phase;
      const pulse = animate
        ? 0.72 + 0.28 * Math.sin(time * 0.001 * star.twinkleSpeed + star.phase)
        : 0.82;
      const x = wrap(
        star.x +
          (animate
            ? pointer.x * star.depth * 16 + Math.sin(drift) * star.depth * 3.5
            : 0),
        width,
      );
      const y = wrap(
        star.y +
          (animate
            ? scrollY * 0.035 * star.depth +
              pointer.y * star.depth * 12 +
              Math.cos(drift * 0.83) * star.depth * 2.5
            : 0),
        height,
      );
      const alpha = star.opacity * colors.starOpacity * pulse;
      const rgb = colors[star.color];

      if (star.radius > 1.35) {
        const glow = context.createRadialGradient(x, y, 0, x, y, star.radius * 7);
        glow.addColorStop(0, `rgba(${rgb}, ${alpha * 0.38})`);
        glow.addColorStop(1, `rgba(${rgb}, 0)`);
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, star.radius * 7, 0, Math.PI * 2);
        context.fill();
      }

      context.fillStyle = `rgba(${rgb}, ${alpha})`;
      context.beginPath();
      context.arc(x, y, star.radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawPointerGlow() {
    if (!pointer.active || !motionEnabled() || coarsePointer.matches) return;
    const radius = Math.min(width, height) * 0.32;
    const gradient = context.createRadialGradient(
      pointer.x * width,
      pointer.y * height,
      0,
      pointer.x * width,
      pointer.y * height,
      radius,
    );
    gradient.addColorStop(0, `rgba(${colors.blue}, ${colors.pointerOpacity})`);
    gradient.addColorStop(
      0.5,
      `rgba(${colors.violet}, ${colors.pointerOpacity * 0.42})`,
    );
    gradient.addColorStop(1, `rgba(${colors.violet}, 0)`);
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(pointer.x * width, pointer.y * height, radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawIntroBloom(time, animate) {
    if (!animate || !introStartedAt) return;
    const progress = (time - introStartedAt) / 1450;
    if (progress <= 0 || progress >= 1) return;

    const eased = 1 - (1 - progress) ** 3;
    const radius = Math.min(width, height) * (0.06 + eased * 0.88);
    const alpha = Math.sin(progress * Math.PI) * 0.18;
    const x = width * 0.5;
    const y = height * 0.44;
    const bloom = context.createRadialGradient(x, y, 0, x, y, radius);
    bloom.addColorStop(0, `rgba(${colors.chrome}, ${alpha * 0.46})`);
    bloom.addColorStop(0.18, `rgba(${colors.blue}, ${alpha})`);
    bloom.addColorStop(0.56, `rgba(${colors.violet}, ${alpha * 0.28})`);
    bloom.addColorStop(1, `rgba(${colors.violet}, 0)`);
    context.fillStyle = bloom;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  function drawWarp(time, animate) {
    if (!animate || !warpStartedAt) return;
    const progress = (time - warpStartedAt) / 520;
    if (progress >= 1) {
      warpStartedAt = 0;
      return;
    }

    const alpha = Math.sin(progress * Math.PI) * (coarsePointer.matches ? 0.065 : 0.11);
    const radius = Math.min(width, height) * (0.12 + progress * 0.82);
    const centerX = width * 0.5;
    const centerY = height * 0.48;

    warpRays.forEach((ray, index) => {
      if (coarsePointer.matches && index % 2) return;
      const inner = radius * ray.inner;
      const outer = radius * ray.length;
      const x1 = centerX + Math.cos(ray.angle) * inner;
      const y1 = centerY + Math.sin(ray.angle) * inner;
      const x2 = centerX + Math.cos(ray.angle) * outer;
      const y2 = centerY + Math.sin(ray.angle) * outer;
      const line = context.createLinearGradient(x1, y1, x2, y2);
      line.addColorStop(0, `rgba(${colors[ray.color]}, 0)`);
      line.addColorStop(0.62, `rgba(${colors[ray.color]}, ${alpha * ray.opacity})`);
      line.addColorStop(1, `rgba(${colors[ray.color]}, 0)`);
      context.strokeStyle = line;
      context.lineWidth = ray.opacity > 0.62 ? 1 : 0.65;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
    });
  }

  function render(time, animate) {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);

    if (animate) {
      pointer.x += (pointer.targetX - pointer.x) * 0.045;
      pointer.y += (pointer.targetY - pointer.y) * 0.045;
    }

    drawNebulae(time, animate);
    drawStars(time, animate);
    drawPointerGlow();
    drawIntroBloom(time, animate);
    drawWarp(time, animate);
  }

  function stop() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
  }

  function tick(time) {
    frame = 0;
    if (!visible || !motionEnabled()) return;
    const frameInterval = coarsePointer.matches ? 42 : 32;
    if (time - lastFrame >= frameInterval) {
      render(time, true);
      lastFrame = time;
    }
    frame = window.requestAnimationFrame(tick);
  }

  function start() {
    if (!visible || !motionEnabled() || frame) return;
    render(performance.now(), true);
    frame = window.requestAnimationFrame(tick);
  }

  function syncMotion() {
    if (connection?.saveData) root.classList.add("save-data");
    else root.classList.remove("save-data");

    if (!motionEnabled()) {
      stop();
      render(performance.now(), false);
      return;
    }

    start();
  }

  function onPointerMove(event) {
    pointer.targetX = clamp(event.clientX / width, 0, 1);
    pointer.targetY = clamp(event.clientY / height, 0, 1);
    pointer.active = true;
  }

  function onPointerLeave() {
    pointer.active = false;
    pointer.targetX = 0.5;
    pointer.targetY = 0.5;
  }

  function onVisibilityChange() {
    visible = !document.hidden;
    root.classList.toggle("page-hidden", !visible);
    if (visible) start();
    else stop();
  }

  function startSectionObserver() {
    const sections = [...document.querySelectorAll(".cosmic-section[id]")];
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const ratios = new Map(sections.map((section) => [section, 0]));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => ratios.set(entry.target, entry.intersectionRatio));
        const nextSection = [...ratios.entries()]
          .filter(([, ratio]) => ratio >= 0.42)
          .sort((a, b) => b[1] - a[1])[0]?.[0];
        if (!nextSection) return;

        if (
          activeSection &&
          nextSection.id !== activeSection &&
          motionEnabled() &&
          performance.now() - lastWarpAt > 1200
        ) {
          warpStartedAt = performance.now();
          lastWarpAt = warpStartedAt;
        }
        activeSection = nextSection.id;
      },
      { threshold: [0.42, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
  }

  function onResize() {
    resize();
  }

  resize();
  visible = !document.hidden;
  render(performance.now(), false);

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.scrollY;
    },
    { passive: true },
  );
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  motionQuery.addEventListener?.("change", syncMotion);
  coarsePointer.addEventListener?.("change", onResize);
  connection?.addEventListener?.("change", syncMotion);

  new MutationObserver(() => {
    colors = readPalette();
    render(performance.now(), false);
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  startSectionObserver();
  syncMotion();
}
