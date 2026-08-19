/* ==========================================================================
   TILT-3D — lightweight pointer-driven 3D tilt + specular glare for cards.
   Applies to any element with [data-tilt]. Respects reduced-motion & touch.
   ========================================================================== */
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;

  /**
   * bindTilt — attaches the pointer-tilt behaviour to every [data-tilt]
   * element inside `root` that hasn't already been bound. Safe to call
   * repeatedly (e.g. after script.js re-renders the project/cert grid on
   * filter, search, or "Load more"), because already-bound elements are
   * skipped via a data attribute guard instead of double-attaching listeners.
   */
  function bindTilt(root) {
    if (prefersReduced) return;
    const els = Array.from(root.querySelectorAll('[data-tilt]:not([data-tilt-bound])'));
    if (!els.length) return;

    els.forEach((el) => {
    el.dataset.tiltBound = 'true';
    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';

    const maxTilt = parseFloat(el.dataset.tiltMax || '12');
    let raf = null;
    let targetRX = 0, targetRY = 0, curRX = 0, curRY = 0;
    let hovering = false;

    function apply() {
      curRX += (targetRX - curRX) * 0.12;
      curRY += (targetRY - curRY) * 0.12;
      el.style.transform = `perspective(900px) rotateX(${curRX}deg) rotateY(${curRY}deg) translateZ(${hovering ? 10 : 0}px)`;
      if (hovering || Math.abs(curRX) > 0.02 || Math.abs(curRY) > 0.02) {
        raf = requestAnimationFrame(apply);
      } else {
        el.style.transform = '';
        raf = null;
      }
    }

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      targetRY = (px - 0.5) * maxTilt * 2;
      targetRX = -(py - 0.5) * maxTilt * 2;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      el.style.setProperty('--glare-o', 0.55);
      if (!raf) raf = requestAnimationFrame(apply);
    }

    function onEnter() { hovering = true; if (!raf) raf = requestAnimationFrame(apply); }
    function onLeave() {
      hovering = false; targetRX = 0; targetRY = 0;
      el.style.setProperty('--glare-o', 0);
      if (!raf) raf = requestAnimationFrame(apply);
    }

      if (!isCoarsePointer) {
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointerleave', onLeave);
      }
    });
  }

  // Bind everything present at initial page load…
  bindTilt(document);
  // …and expose the function so script.js can re-bind newly injected
  // project/cert cards after a filter, search, or "Load more" re-render,
  // without this file needing to know anything about that logic.
  window.applyTilt = bindTilt;

  // -- scroll-linked depth parallax for decorative background orbs only --
  // (Independent of dynamic content, so this only needs to run once.)
  const depthTargets = Array.from(document.querySelectorAll('.depth-orb'));
  if (depthTargets.length && !prefersReduced) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const vh = window.innerHeight;
        depthTargets.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
          el.style.transform = `translate3d(0, ${centerOffset * 50}px, 0)`;
        });
        ticking = false;
      });
    }, { passive: true });
  }
})();
