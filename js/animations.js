/* ==========================================================================
   ANIMATIONS — scroll reveal observer, counters, timeline progress, console typer
   ========================================================================== */
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -- generic reveal on scroll -- */
  const revealTargets = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealTargets.forEach((el) => revealObserver.observe(el));

  /* -- animated counters (About stats) -- */
  const stats = document.querySelectorAll('.stat');
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('is-visible');
      const target = parseInt(el.dataset.count, 10);
      const countEl = el.querySelector('.count');
      if (prefersReduced) { countEl.textContent = target; statObserver.unobserve(el); return; }
      let start = 0;
      const duration = 1400;
      const startTime = performance.now();
      function tick(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        countEl.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      statObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  stats.forEach((el) => statObserver.observe(el));

  /* -- vertical timeline fill on scroll -- */
  const vTimeline = document.getElementById('vTimeline');
  const vLineFill = document.getElementById('vLineFill');
  if (vTimeline && vLineFill) {
    function updateTimelineFill() {
      const rect = vTimeline.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height;
      const visible = Math.min(Math.max(vh * 0.7 - rect.top, 0), total);
      const pct = total > 0 ? (visible / total) * 100 : 0;
      vLineFill.style.height = pct + '%';
    }
    window.addEventListener('scroll', Utils.rafThrottle(updateTimelineFill), { passive: true });
    window.addEventListener('resize', Utils.debounce(updateTimelineFill, 150));
    updateTimelineFill();
  }

  /* -- navbar: shrink on scroll + active section link -- */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-links a, .nav-mobile a');
  const sections = document.querySelectorAll('main .section, .hero');

  function onScroll() {
    if (window.scrollY > 30) navbar.classList.add('is-scrolled');
    else navbar.classList.remove('is-scrolled');

    let currentId = '';
    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 140 && rect.bottom >= 140) currentId = sec.id;
    });
    navLinks.forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + currentId);
    });
  }
  // rAF-throttled: without this, every native scroll event (which can fire
  // dozens of times per second) would immediately call getBoundingClientRect
  // on every section, forcing a synchronous layout each time. Capping the
  // work to once per animation frame keeps scrolling smooth.
  const throttledScroll = Utils.rafThrottle(onScroll);
  window.addEventListener('scroll', throttledScroll, { passive: true });
  onScroll();

  /* -- project card spotlight (mouse position CSS vars) --
     Delegated to the grid container (not `document`) so the browser only
     has to check ancestry against one relevant subtree, and rAF-throttled
     so the getBoundingClientRect() read can't fire more than once per
     frame no matter how fast the mouse moves. */
  const projectGridEl = document.getElementById('projectGrid');
  const handleSpotlight = Utils.rafThrottle((clientX, clientY, card) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', (clientX - rect.left) + 'px');
    card.style.setProperty('--my', (clientY - rect.top) + 'px');
  });
  if (projectGridEl) {
    projectGridEl.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.project-card');
      if (card) handleSpotlight(e.clientX, e.clientY, card);
    }, { passive: true });
  }

  /* -- hero console: typed detection triage log (signature element) -- */
  const consoleOutput = document.getElementById('consoleOutput');
  const consoleLines = [
    { html: `<span class="ln-num">01</span><span class="kw">rule</span> <span class="str">suspicious_oauth_grant</span> {` },
    { html: `<span class="ln-num">02</span>  <span class="field">meta:</span> severity = <span class="str">"high"</span>` },
    { html: `<span class="ln-num">03</span>  <span class="field">meta:</span> mitre = <span class="str">"T1550.001"</span>` },
    { html: `<span class="ln-num">04</span>  <span class="kw">events:</span>` },
    { html: `<span class="ln-num">05</span>    $e.metadata.event_type = <span class="str">"USER_LOGIN"</span>` },
    { html: `<span class="ln-num">06</span>    $e.principal.user.email != <span class="str">""</span>` },
    { html: `<span class="ln-num">07</span>  <span class="kw">condition:</span> $e` },
    { html: `<span class="ln-num">08</span>}` },
    { html: `<span class="ln-num">09</span>` },
    { html: `<span class="ln-num">10</span><span class="match">▶ MATCH</span>  detections/hr: <span class="str">12</span>  false_positive_rate: <span class="str">↓30%</span>` },
    { html: `<span class="ln-num">11</span><span class="match">▶ MATCH</span>  MTTR: <span class="str">↓25%</span>  analyst_effort: <span class="str">↓40%</span>` },
  ];

  async function typeConsole() {
    if (!consoleOutput) return;
    if (prefersReduced) {
      consoleOutput.innerHTML = consoleLines.map(l => l.html).join('\n');
      return;
    }
    for (const line of consoleLines) {
      const div = document.createElement('div');
      consoleOutput.appendChild(div);
      const plain = line.html.replace(/<[^>]+>/g, '');
      // reveal char by char using a hidden full-html swap at the end for styling
      let shown = '';
      for (let i = 0; i <= plain.length; i++) {
        shown = plain.slice(0, i);
        div.textContent = shown;
        await new Promise(r => setTimeout(r, 8));
      }
      div.innerHTML = line.html; // apply syntax highlight once fully typed
      await new Promise(r => setTimeout(r, 90));
    }
  }

  // Kick off once loader finishes (see script.js dispatch) or immediately if reduced motion
  window.addEventListener('portfolio:loaded', typeConsole, { once: true });

  /* Animated Fractal Tree */
  const treeCanvas=document.getElementById("heatmapCanvas");
  if(treeCanvas){
  const ctx=treeCanvas.getContext("2d");
  let width,height,sway=0,last=0;
  const MAX_DEPTH=9,colors=[],offsets=[];
  for(let i=0;i<=MAX_DEPTH;i++)colors[i]=`hsla(${170+i*2},90%,65%,${0.25+i*0.06})`;

  function resize(){
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  width=treeCanvas.parentElement.clientWidth;
  height=320;
  treeCanvas.width=width*dpr;
  treeCanvas.height=height*dpr;
  treeCanvas.style.width=width+"px";
  treeCanvas.style.height=height+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.shadowColor="#22e5d0";
  }

  function drawBranch(x,y,len,angle,depth){
  if(!depth)return;
  const c=Math.cos(angle),s=Math.sin(angle),x2=x+c*len,y2=y+s*len;
  ctx.beginPath();
  ctx.moveTo(x,y);
  ctx.lineTo(x2,y2);
  ctx.lineWidth=depth*.9;
  ctx.strokeStyle=colors[depth];
  ctx.shadowBlur=depth>5?6:0;
  ctx.stroke();
  const next=len*.75,off=offsets[depth];
  drawBranch(x2,y2,next,angle-.45+off,depth-1);
  drawBranch(x2,y2,next,angle+.45+off,depth-1);
  }

  function animate(t){
  requestAnimationFrame(animate);
  if(t-last<33)return;
  last=t;
  for(let i=0;i<=MAX_DEPTH;i++)offsets[i]=Math.sin(sway+i*.5)*.12;
  ctx.fillStyle="#05060a";
  ctx.fillRect(0,0,width,height);
  drawBranch(width/2,height-20,85,-Math.PI/2,MAX_DEPTH);
  sway+=0.015;
  }

  resize();
  animate(0);
  window.addEventListener("resize",Utils.debounce(resize,150));
  }
  
})();
