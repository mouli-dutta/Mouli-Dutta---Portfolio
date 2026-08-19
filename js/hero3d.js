/* ==========================================================================
   HERO3D — immersive WebGL background: a rotating 3D detection-network mesh
   (icosahedron core + orbiting node cloud + connecting signal lines) that
   responds to mouse parallax and scroll. Falls back silently if WebGL/Three
   is unavailable, leaving the existing 2D canvas particle field intact.
   ========================================================================== */
(function () {
  function start() {
    const canvas = document.getElementById('heroCanvas3D');
    const heroSection = document.getElementById('hero');
    if (!canvas || !heroSection || typeof THREE === 'undefined') return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) { return; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const COLORS = [0x3ea6ff, 0x8b5cf6, 0x22e5d0, 0xff3b81];

    // -- group that holds everything so we can rotate/parallax as one unit --
    const rig = new THREE.Group();
    scene.add(rig);

    // -- wireframe icosahedron core: the "detection engine" centerpiece --
    const coreGeo = new THREE.IcosahedronGeometry(2.15, 1);
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreMat = new THREE.LineBasicMaterial({ color: 0x3ea6ff, transparent: true, opacity: 0.38 });
    const core = new THREE.LineSegments(coreEdges, coreMat);
    rig.add(core);

    const coreFillMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.035, side: THREE.DoubleSide });
    const coreFill = new THREE.Mesh(coreGeo, coreFillMat);
    rig.add(coreFill);

    // -- inner pulsing node --
    const pulseGeo = new THREE.IcosahedronGeometry(0.14, 1);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x22e5d0, transparent: true, opacity: 0.9 });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    rig.add(pulse);

    // -- orbiting node cloud: points scattered on a sphere shell --
    const NODE_COUNT = window.innerWidth < 700 ? 46 : 90;
    const nodePositions = [];
    const nodeColors = [];
    const colorObj = new THREE.Color();
    for (let i = 0; i < NODE_COUNT; i++) {
      const radius = 3.1 + Math.random() * 1.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      nodePositions.push(x, y, z);
      colorObj.set(COLORS[i % COLORS.length]);
      nodeColors.push(colorObj.r, colorObj.g, colorObj.b);
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
    nodeGeo.setAttribute('color', new THREE.Float32BufferAttribute(nodeColors, 3));
    const nodeMat = new THREE.PointsMaterial({ size: 0.055, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true });
    const nodeCloud = new THREE.Points(nodeGeo, nodeMat);
    rig.add(nodeCloud);

    // -- faint connecting lines between nearby orbiting nodes (signal graph) --
    const lineVerts = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      const ax = nodePositions[i * 3], ay = nodePositions[i * 3 + 1], az = nodePositions[i * 3 + 2];
      let closest = -1, closestDist = Infinity;
      for (let j = 0; j < NODE_COUNT; j++) {
        if (i === j) continue;
        const bx = nodePositions[j * 3], by = nodePositions[j * 3 + 1], bz = nodePositions[j * 3 + 2];
        const d = (ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2;
        if (d < closestDist) { closestDist = d; closest = j; }
      }
      if (closest !== -1 && closestDist < 3) {
        lineVerts.push(ax, ay, az, nodePositions[closest * 3], nodePositions[closest * 3 + 1], nodePositions[closest * 3 + 2]);
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lineVerts, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.12 });
    const nodeLines = new THREE.LineSegments(lineGeo, lineMat);
    rig.add(nodeLines);

    // -- responsive sizing --
    let w, h;
    function resize() {
      const rect = heroSection.getBoundingClientRect();
      w = rect.width; h = rect.height;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rig.position.x = w > 900 ? 1.6 : 0;
      rig.scale.setScalar(w < 700 ? 0.72 : 1);
    }

    // -- mouse parallax --
    let mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
    window.addEventListener('pointermove', (e) => {
      mouseX = (e.clientX / window.innerWidth) - 0.5;
      mouseY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });

    // -- scroll fade / drift --
    let scrollFactor = 0;
    window.addEventListener('scroll', () => {
      const heroHeight = heroSection.offsetHeight || 1;
      scrollFactor = Math.min(Math.max(window.scrollY / heroHeight, 0), 1.4);
    }, { passive: true });

    window.addEventListener('resize', resize);
    resize();

    let t = 0;
    let lastFrame = 0;
    function tick(now) {
      if (now - lastFrame < 16) return; // ~60fps cap
      lastFrame = now;
      t += prefersReduced ? 0.0009 : 0.0026;

      targetRotY += (mouseX * 0.6 - targetRotY) * 0.035;
      targetRotX += (mouseY * 0.35 - targetRotX) * 0.035;

      rig.rotation.y = t + targetRotY;
      rig.rotation.x = targetRotX * 0.6 + Math.sin(t * 0.5) * 0.06;
      rig.position.y = -scrollFactor * 1.6;
      rig.rotation.z = scrollFactor * 0.15;

      const pulseScale = 1 + Math.sin(t * 12) * 0.12;
      pulse.scale.setScalar(pulseScale);
      core.material.opacity = 0.32 + Math.sin(t * 3) * 0.06;

      const op = Math.max(0, 1 - scrollFactor * 0.9);
      canvas.style.opacity = op;

      renderer.render(scene, camera);
    }

    // Only spend GPU/CPU time on this mesh while the hero is actually on
    // screen and the tab is active. Once the visitor scrolls past the hero
    // (or switches tabs), the render loop stops completely instead of
    // rendering an invisible canvas 60 times a second forever.
    if (window.Utils && window.Utils.runWhileVisible) {
      window.Utils.runWhileVisible(heroSection, tick, { threshold: 0.01 });
    } else {
      // Fallback if utils.js failed to load for any reason.
      (function loop(now) { requestAnimationFrame(loop); tick(now); })();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
