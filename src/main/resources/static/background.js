/* Decorative document particles. No document content is read by this effect. */
(() => {
  "use strict";
  const canvas = document.getElementById("ambient-background");
  const context = canvas?.getContext("2d");
  if (!context) return;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0, height = 0, frame = 0, previous = 0;
  let points = [];
  const pointer = {x: -1000, y: -1000};

  function resize() {
    width = innerWidth; height = innerHeight;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    points = Array.from({length: width < 700 ? 20 : 42}, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      radius: 1 + Math.random() * 1.2
    }));
  }

  function paint(now) {
    if (now && now - previous < 33) { frame = requestAnimationFrame(paint); return; }
    const delta = previous ? Math.min((now - previous) / 33, 2) : 1;
    previous = now;
    context.clearRect(0, 0, width, height);
    const visible = points.map((point) => {
      if (!reducedMotion.matches) {
        point.x = (point.x + point.vx * delta + width) % width;
        point.y = (point.y + point.vy * delta + height) % height;
      }
      const dx = point.x - pointer.x, dy = point.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const push = !reducedMotion.matches && distance < 180 ? (180 - distance) * 0.12 : 0;
      return {x: point.x + dx / (distance || 1) * push, y: point.y + dy / (distance || 1) * push, radius: point.radius};
    });
    for (let i = 0; i < visible.length; i++) {
      const point = visible[i];
      context.fillStyle = i % 5 ? "rgba(131,239,192,0.32)" : "rgba(234,213,165,0.4)";
      context.beginPath(); context.arc(point.x, point.y, point.radius, 0, Math.PI * 2); context.fill();
      for (let j = i + 1; j < visible.length; j++) {
        const other = visible[j];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance > 150) continue;
        context.strokeStyle = "rgba(131,239,192," + (0.1 * (1 - distance / 150)) + ")";
        context.lineWidth = 0.7; context.beginPath(); context.moveTo(point.x, point.y);
        context.lineTo(other.x, other.y); context.stroke();
      }
    }
    if (!reducedMotion.matches && !document.hidden) frame = requestAnimationFrame(paint);
  }

  function restart() {
    cancelAnimationFrame(frame); previous = 0;
    if (!document.hidden) paint(0);
  }
  addEventListener("resize", () => { resize(); restart(); }, {passive: true});
  addEventListener("pointermove", (event) => {
    if (reducedMotion.matches) return;
    pointer.x = event.clientX; pointer.y = event.clientY;
    document.body.style.setProperty("--pointer-x", (pointer.x / width * 100) + "%");
    document.body.style.setProperty("--pointer-y", (pointer.y / height * 100) + "%");
  }, {passive: true});
  document.documentElement.addEventListener("pointerleave", () => { pointer.x = pointer.y = -1000; });
  document.addEventListener("visibilitychange", restart);
  reducedMotion.addEventListener("change", () => {
    pointer.x = pointer.y = -1000;
    document.body.style.removeProperty("--pointer-x"); document.body.style.removeProperty("--pointer-y");
    restart();
  });
  resize(); restart();
})();
