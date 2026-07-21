/* ==========================================================================
   UTILS — shared helpers used across script.js, animations.js, hero3d.js,
   particles.js and tilt3d.js. Centralizing these avoids duplicating the same
   prefers-reduced-motion check and throttle logic in five different files,
   and gives every animation loop one consistent way to pause itself when it
   isn't doing anything useful (tab hidden, element off-screen).
   ========================================================================== */
(function (global) {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * rafThrottle — ensures `fn` runs at most once per animation frame no
   * matter how often the returned function is called. Use this to wrap
   * high-frequency listeners (scroll, mousemove, pointermove) so the
   * expensive part of the handler (layout reads, DOM writes) can't run
   * more often than the screen can actually repaint.
   */
  function rafThrottle(fn) {
    let scheduled = false;
    let lastArgs = null;
    return function throttled(...args) {
      lastArgs = args;
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        fn.apply(this, lastArgs);
      });
    };
  }

  /** debounce — waits for a pause in calls before running `fn` once. */
  function debounce(fn, wait) {
    let t = null;
    return function debounced(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * runWhileVisible — drives a rAF loop but only while `el` is on-screen
   * AND the tab is active. This is what lets the WebGL hero mesh and the
   * canvas particle field stop doing any work at all once you've scrolled
   * past them, or once you've switched tabs — instead of silently burning
   * CPU/GPU forever in the background.
   *
   * `onFrame(now)` is called once per frame while active.
   * Returns a controller with `.stop()` to fully tear down the observers.
   */
  function runWhileVisible(el, onFrame, opts = {}) {
    const threshold = opts.threshold || 0;
    let rafId = null;
    let visible = false;
    let tabActive = document.visibilityState === 'visible';

    function loop(now) {
      onFrame(now);
      if (visible && tabActive) rafId = requestAnimationFrame(loop);
      else rafId = null;
    }
    function start() {
      if (rafId === null) rafId = requestAnimationFrame(loop);
    }
    function stopLoop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }

    const realIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { visible = entry.isIntersecting; });
      if (visible && tabActive) start(); else stopLoop();
    }, { threshold });
    realIo.observe(el);

    function onVisibilityChange() {
      tabActive = document.visibilityState === 'visible';
      if (visible && tabActive) start(); else stopLoop();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return {
      stop() {
        stopLoop();
        realIo.disconnect();
        document.removeEventListener('visibilitychange', onVisibilityChange);
      },
    };
  }

  /** Returns the currently focusable elements inside a container, in DOM order. */
  function getFocusable(container) {
    return Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
  }

  /**
   * trapFocus — keeps Tab/Shift+Tab cycling inside `container` while active.
   * Returns a keydown handler you attach/detach on the container yourself.
   */
  function trapFocus(container) {
    return function onKeydown(e) {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable(container);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
  }

  global.Utils = { prefersReducedMotion, rafThrottle, debounce, runWhileVisible, getFocusable, trapFocus };
})(window);
