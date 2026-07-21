/* ==========================================================================
   PARTICLES — lightweight canvas particle field + mouse spotlight for hero
   ========================================================================== */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let w, h, dpr, particles = [];
  const COLORS = ['62,166,255', '139,92,246', '34,229,208', '255,59,129'];
  const COUNT = window.innerWidth < 700 ? 34 : 68;

  let mouse = { x: -9999, y: -9999 };
  // Cached so the mousemove handler never has to force a synchronous layout
  // (getBoundingClientRect) on every single event — only on resize/scroll.
  let canvasRect = { left: 0, top: 0 };

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    w = rect.width; h = rect.height;
    canvasRect = rect;
  }

  function makeParticle() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.2,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: COUNT }, makeParticle);
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    // connective lines near cursor
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
      if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160) {
        p.x += dx * 0.0018 * (160 - dist) / 160;
        p.y += dy * 0.0018 * (160 - dist) / 160;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(120,140,160,${0.08 * (1 - dist / 110)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX - canvasRect.left;
    mouse.y = e.clientY - canvasRect.top;
  }, { passive: true });
  window.addEventListener('resize', Utils.debounce(resize, 150));

  init();

  if (prefersReduced) {
    step(); // draw a single static frame, no animation loop at all
  } else {
    // Only animate while the hero is on-screen and the tab is active —
    // once scrolled past, this canvas would otherwise keep computing
    // O(n^2) particle-link distances 60x/sec for nothing visible.
    Utils.runWhileVisible(canvas.parentElement, step, { threshold: 0.01 });
  }
})();
