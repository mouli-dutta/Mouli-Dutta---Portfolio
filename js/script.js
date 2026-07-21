/* ==========================================================================
   SCRIPT — loader, navigation, data rendering, filters, modal, form, extras
   ========================================================================== */
(function () {
  'use strict';

  /* ========================================================================
     LOADER
     ======================================================================== */
  const loader = document.getElementById('loader');
  const loaderBar = document.getElementById('loaderBar');
  const loaderPct = document.getElementById('loaderPct');
  const loaderStatus = document.getElementById('loaderStatus');
  const statusMsgs = ['initializing sensors', 'loading detection rules', 'normalizing telemetry', 'mapping mitre att&ck', 'ready'];

  let pct = 0;
  const loaderInterval = setInterval(() => {
    pct += Math.random() * 18 + 6;
    if (pct >= 100) {
      pct = 100;
      clearInterval(loaderInterval);
      setTimeout(finishLoading, 280);
    }
    loaderBar.style.width = pct + '%';
    loaderPct.textContent = String(Math.floor(pct)).padStart(2, '0');
    const msgIndex = Math.min(Math.floor((pct / 100) * (statusMsgs.length - 1)), statusMsgs.length - 1);
    loaderStatus.textContent = statusMsgs[msgIndex];
  }, 220);

  function finishLoading() {
    loader.classList.add('is-hidden');
    document.body.style.overflow = '';
    window.dispatchEvent(new CustomEvent('portfolio:loaded'));
  }
  // Safety fallback in case interval logic stalls
  window.addEventListener('load', () => setTimeout(() => {
    if (!loader.classList.contains('is-hidden')) finishLoading();
  }, 2600));

  /* ========================================================================
     NAV: burger + mobile menu
     ======================================================================== */
  const navBurger = document.getElementById('navBurger');
  const navMobile = document.getElementById('navMobile');
  navBurger.addEventListener('click', () => {
    const open = navBurger.classList.toggle('is-open');
    navMobile.classList.toggle('is-open', open);
    navBurger.setAttribute('aria-expanded', String(open));
  });
  navMobile.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    navBurger.classList.remove('is-open');
    navMobile.classList.remove('is-open');
  }));

  /* ========================================================================
     COMMAND PALETTE (⌘K / Ctrl+K)
     ======================================================================== */
  const cmdk = document.getElementById('cmdk');
  const cmdkInput = document.getElementById('cmdkInput');
  const cmdkList = document.getElementById('cmdkList');
  const cmdkTrigger = document.getElementById('cmdkTrigger');

  const cmdItems = [
    { label: 'Go to About', tag: 'section', action: () => scrollToId('about') },
    { label: 'Go to Skills', tag: 'section', action: () => scrollToId('skills') },
    { label: 'Go to Projects', tag: 'section', action: () => scrollToId('projects') },
    { label: 'Go to Experience', tag: 'section', action: () => scrollToId('experience') },
    { label: 'Go to Certifications', tag: 'section', action: () => scrollToId('certifications') },
    { label: 'Go to GitHub', tag: 'section', action: () => scrollToId('github') },
    { label: 'Go to Contact', tag: 'section', action: () => scrollToId('contact') },
    { label: 'Email Mouli', tag: 'action', action: () => window.location.href = 'mailto:mouliduttawork@gmail.com' },
    { label: 'Open GitHub profile', tag: 'link', action: () => window.open('https://github.com/mouli-dutta', '_blank') },
    { label: 'Open LinkedIn profile', tag: 'link', action: () => window.open('https://linkedin.com/in/mouli-dutta', '_blank') },
  ];

  function scrollToId(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  function renderCmdList(filter) {
    const q = (filter || '').toLowerCase();
    const filtered = cmdItems.filter((i) => i.label.toLowerCase().includes(q));
    cmdkList.innerHTML = filtered.map((i, idx) =>
      `<li data-idx="${idx}" class="${idx === 0 ? 'is-active' : ''}"><span>${i.label}</span><span class="tag">${i.tag}</span></li>`
    ).join('') || '<li style="color:var(--text-muted)">No results</li>';
    cmdkList._filtered = filtered;
  }

  function openCmdk() {
    cmdk.classList.add('is-open');
    cmdk.setAttribute('aria-hidden', 'false');
    cmdkInput.value = '';
    renderCmdList('');
    setTimeout(() => cmdkInput.focus(), 30);
  }
  function closeCmdk() {
    cmdk.classList.remove('is-open');
    cmdk.setAttribute('aria-hidden', 'true');
  }

  cmdkTrigger.addEventListener('click', openCmdk);
  document.getElementById('modalBackdrop'); // noop reference guard
  cmdk.addEventListener('click', (e) => { if (e.target === cmdk) closeCmdk(); });
  cmdkInput.addEventListener('input', () => renderCmdList(cmdkInput.value));
  cmdkList.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-idx]');
    if (!li) return;
    const item = cmdkList._filtered[Number(li.dataset.idx)];
    if (item) { item.action(); closeCmdk(); }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      cmdk.classList.contains('is-open') ? closeCmdk() : openCmdk();
    }
    if (e.key === 'Escape') closeCmdk();
    if (cmdk.classList.contains('is-open') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const items = [...cmdkList.querySelectorAll('li[data-idx]')];
      if (!items.length) return;
      let idx = items.findIndex((li) => li.classList.contains('is-active'));
      items[idx]?.classList.remove('is-active');
      idx = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
      items[idx].classList.add('is-active');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
    if (cmdk.classList.contains('is-open') && e.key === 'Enter') {
      const active = cmdkList.querySelector('li.is-active');
      if (active) {
        const item = cmdkList._filtered[Number(active.dataset.idx)];
        if (item) { item.action(); closeCmdk(); }
      }
    }
  });

  /* ========================================================================
     DATA — sourced from CV
     ======================================================================== */
    const SKILLS = [
      // Security Operations
      { name: 'Google SecOps (Chronicle SIEM/SOAR)', cat: 'detection', meta: 'Primary SIEM & SOAR platform' },
      { name: 'YARA-L Detection Engineering', cat: 'detection', meta: 'Custom detection rules' },
      { name: 'Unified Data Model (UDM)', cat: 'detection', meta: 'Log normalization' },
      { name: 'Threat Hunting', cat: 'detection', meta: 'Proactive investigations' },
      { name: 'Log Analysis', cat: 'detection', meta: 'Event investigation' },
      { name: 'Incident Response', cat: 'detection', meta: 'Alert triage & response' },
      { name: 'MITRE ATT&CK', cat: 'detection', meta: 'Threat mapping framework' },

      // LLM-Assisted Security
      { name: 'OWASP Top 10 for LLM Applications', cat: 'ai', meta: 'LLM security risks' },
      { name: 'Prompt Injection Defense', cat: 'ai', meta: 'LLM attack mitigation' },
      { name: 'Output Handling & Validation', cat: 'ai', meta: 'Secure AI responses' },
      { name: 'Prompt Engineering', cat: 'ai', meta: 'Security workflows' },
      { name: 'RAG Pipelines', cat: 'ai', meta: 'Knowledge retrieval systems' },

      // Programming & AI/ML
      { name: 'Python', cat: 'python', meta: 'Automation & scripting' },
      { name: 'SQL', cat: 'python', meta: 'Data querying' },
      { name: 'REST APIs', cat: 'python', meta: 'Security integrations' },
      { name: 'Scikit-learn', cat: 'python', meta: 'ML modeling' },
      { name: 'Pandas', cat: 'python', meta: 'Data analysis' },
      { name: 'NumPy', cat: 'python', meta: 'Numerical computing' },

      // Cloud & Development Tools
      { name: 'Google Cloud Platform (GCP)', cat: 'cloud', meta: 'Cloud infrastructure' },
      { name: 'Git', cat: 'cloud', meta: 'Version control' },
      { name: 'GitHub', cat: 'cloud', meta: 'Code collaboration' },
      { name: 'VS Code', cat: 'cloud', meta: 'Development environment' },
      { name: 'Jupyter Notebook', cat: 'cloud', meta: 'Data experimentation' },
      { name: 'Windsurf', cat: 'cloud', meta: 'AI code editor' },
      { name: 'Claude Code', cat: 'cloud', meta: 'AI coding assistant' },
    ];

  const PROJECTS = [
    {
      id: 'triage',
      cat: 'security',
      title: 'SecOpsGPT: LLM-Assisted Alert Triage for Google SecOps',
      desc: 'AI-powered tool that summarizes Google SecOps alerts and recommends YARA-L tuning, cutting investigation time in half.',
      metric: '↓50% triage time',
      badges: ['Python', 'Claude API', 'Chronicle API', 'HTML/CSS/JavaScript'],
      role: 'Solo build',
      timeline: '2026',
      overview: 'A proof-of-concept AI assistant integrated with Google SecOps that analyzes raw logs to deliver actionable alert summaries and precise YARA-L tuning recommendations.',
      features: ['Summarizes multi-event alert chains into plain-language narratives', 'Recommends specific YARA-L threshold and condition tuning', 'Flags likely false-positive patterns before an analyst opens the case'],
      architecture: 'Python web app that uses REST APIs to pull Google SecOps alert data, and the Claude API to output streamlined triage summaries and YARA-L recommendations.',
      challenges: 'Keeping LLM output grounded to actual log fields (not hallucinated ones) required strict prompt scaffolding and post-generation validation against the UDM schema.',
    },

    {
      id: "ai-detection-rule-generator",
      cat: "security",
      title: "AI Detection Rule Generator",
      desc: "Offline AI-powered detection engineering assistant that converts natural language into production-ready detection rules for multiple SIEM platforms using a locally trained Scikit-learn model.",
      metric: "↓80% rule creation time",
      badges: ["Python", "Scikit-learn", "FastAPI", "YARA-L"],
      role: "Solo build",
      timeline: "2026",
      overview: "An AI assistant that transforms plain-English detection requests into Sigma, Google SecOps YARA-L, Splunk SPL, Microsoft Sentinel KQL, and Elastic detection rules. The application runs entirely offline using a locally trained NLP model, while also explaining detection logic, false positives, MITRE ATT&CK coverage, and potential detection gaps.",
      features: [
        "Generates Sigma, Google SecOps YARA-L, Splunk SPL, Sentinel KQL, and Elastic detection rules from natural-language prompts",
        "Explains detection logic, likely false positives, coverage gaps, and recommended improvements for every generated rule",
        "Maps detections to MITRE ATT&CK tactics and techniques with severity and confidence scoring",
        "Runs entirely offline using a Scikit-learn NLP model without relying on external AI APIs"
      ],
      architecture: "A FastAPI backend hosts a Scikit-learn TF-IDF + Linear SVM intent classification model trained on Sigma Rules, MITRE ATT&CK mappings, and community detection content. Classified intents are mapped to reusable rule templates before generating platform-specific detection rules and AI-generated explanations through a React frontend.",
      challenges: "Creating high-quality detection rules without an LLM required designing an explainable template-based generation pipeline. The biggest challenge was producing accurate, platform-specific rules while maintaining MITRE alignment, minimizing false positives, and ensuring consistent outputs across multiple SIEM query languages."
    },

    {
      id: 'email',
      cat: 'automation',
      title: 'MailQuery: Automated Email Data Extraction Tool',
      desc: 'Automated extraction of structured Outlook email data into Excel reports, eliminating manual reporting effort.',
      metric: '100% manual removal',
      badges: ['Python', 'Pandas', 'Regex', 'OpenPyXL'],
      role: 'Solo build',
      timeline: '2025',
      overview: 'A reporting pipeline that reads structured fields out of recurring Outlook emails and compiles them straight into formatted Excel workbooks, removing a fully manual copy-paste reporting task from the week.',
      features: ['Regex-based field extraction tuned to recurring email templates', 'Pandas-driven cleaning and structuring of extracted records', 'One-click Excel report generation with OpenPyXL formatting'],
      architecture: 'A scheduled Python script parses the mailbox, applies extraction rules per template, normalizes the results into a DataFrame, and writes a formatted .xlsx report.',
      challenges: 'Email templates drift over time — the extraction rules needed to be resilient to minor formatting changes without silently dropping data.',
    },
    {
      id: 'algoviz',
      cat: 'dev',
      title: 'Algorithm Visualizer',
      desc: 'Interactive open-source platform demonstrating data structures and algorithms.',
      metric: 'Open source',
      badges: ['JavaScript', 'HTML', 'CSS', 'Data Structures'],
      role: 'Solo build · Open source',
      timeline: '2026',
      overview: 'An interactive teaching tool that animates classic algorithms and data structures step by step, built to make abstract CS concepts tangible for learners.',
      features: ['Step-by-step animated execution of sorting and search algorithms', 'Visual representations of core data structures', 'Adjustable speed and input controls for experimentation'],
      architecture: 'Vanilla JS state machine drives canvas/DOM redraws on each algorithm step, decoupled from the algorithm implementations themselves so new algorithms are easy to add.',
      challenges: 'Balancing animation smoothness with accuracy — every visual step had to map to a real, correct operation in the underlying algorithm.',
    },
    {
      id: 'equation',
      cat: 'dev',
      title: 'Equation Orchestra',
      desc: 'Mathematical visualization and sound generation platform that converts equations into audio-visual experiences.',
      metric: 'Open source',
      badges: ['Python', 'Audio Synthesis', 'Visualization'],
      role: 'Solo build · Open source',
      timeline: '2026',
      overview: 'An experimental platform that parses mathematical equations and renders them as synchronized visual and audio output — treating a function as something you can see and hear at once.',
      features: ['Equation parsing into visual plots and motion', 'Sound generation mapped to mathematical properties', 'Interactive parameter tweaking in real time'],
      architecture: 'Equation parser feeds both a visualization renderer and an audio synthesis engine in parallel, keeping the two outputs in sync against a shared time base.',
      challenges: 'Designing a mapping from mathematical properties to sound that felt musically coherent rather than arbitrary.',
    },

    {
      id: "pokedex",
      cat: "dev",
      title: "AI-Powered Pokédex",
      desc: "A modern browser-based Pokédex that combines a nostalgic retro interface with AI-powered Pokémon recognition, official Pokédex data, authentic cries, and interactive animations.",
      metric: "1,025+ Pokémon supported",
      badges: [
        "HTML5",
        "CSS3",
        "JavaScript",
        "PokéAPI",
        "Transformers.js",
        "Hugging Face ONNX Model",
        "MediaDevices API",
        "Web Speech API"
      ],
      role: "Solo build",
      timeline: "2026",
      overview: "A fully interactive Pokédex inspired by the original handheld device, built with modern web technologies. Users can search every Pokémon from Generation I–IX, listen to authentic cries, read official Pokédex entries, navigate through detailed stats, and identify Pokémon from camera or uploaded images using an AI model running entirely inside the browser.",
      features: [
        "Search Pokémon by name or National Pokédex number across all nine generations",
        "Identify Pokémon using AI-powered image recognition from camera capture or uploaded photos",
        "Play authentic Pokémon cries with animated audio indicators and multiple fallback sources",
        "Display official Pokédex entries, stats, abilities, types, height, weight, and battle attributes",
        "Read Pokédex descriptions aloud using the browser's Speech Synthesis API",
        "Retro-inspired Pokédex interface featuring boot animations, flip-card transitions, sound effects, LED indicators, and responsive design"
      ],
      architecture: "Built with Vanilla JavaScript, HTML5, and CSS3, the application integrates PokéAPI for Pokémon data, Pokémon Showdown for official cries, and a Hugging Face ONNX image classification model executed locally through Transformers.js for browser-based AI recognition. Camera access is handled through the MediaDevices API, while Web Speech API provides text-to-speech functionality.",
      challenges: "Implementing AI image recognition entirely within the browser required optimizing ONNX model loading and inference performance while maintaining responsiveness across devices. Additional challenges included handling alternate Pokémon forms, integrating multiple API fallback mechanisms, and recreating an authentic Pokédex experience using modern web technologies."
    },
  ];

  // `cat` is a stable, URL-safe slug used for filtering; `issuer` stays the
  // human-readable label. `verifyUrl` is left null where a real credential
  // link isn't known yet — the UI simply omits the "Verify" button in that
  // case rather than link to a guessed URL. Replace with real credential IDs
  // as they become available (e.g. Credly, Coursera, or issuer badge pages).
  const CERTS = [
    { name: 'Machine Learning Specialization', issuer: 'DeepLearning.AI', cat: 'deeplearning', status: 'Certified', mark: 'DL', date: '2025', verifyUrl: null },
    { name: 'Finetuning Large Language Models', issuer: 'DeepLearning.AI', cat: 'deeplearning', status: 'Certified', mark: 'DL', date: '2025', verifyUrl: null },
    { name: 'Full Stack LLM Development', issuer: 'DeepLearning.AI', cat: 'deeplearning', status: 'Certified', mark: 'DL', date: '2025', verifyUrl: null },
    { name: 'AI LLM Technology Architecture', issuer: 'DeepLearning.AI', cat: 'deeplearning', status: 'Certified', mark: 'DL', date: '2025', verifyUrl: null },
    { name: 'Claude Code in Action', issuer: 'Anthropic', cat: 'anthropic', status: 'Certified', mark: 'A\\', date: '2026', verifyUrl: null },
    { name: 'Claude 101', issuer: 'Anthropic', cat: 'anthropic', status: 'Certified', mark: 'A\\', date: '2026', verifyUrl: null },
    { name: 'Claude API', issuer: 'Anthropic', cat: 'anthropic', status: 'Certified', mark: 'A\\', date: '2026', verifyUrl: null },
    { name: 'Al Fluency Framework & Foundations', issuer: 'Anthropic', cat: 'anthropic', status: 'Certified', mark: 'A\\', date: '2026', verifyUrl: null },
    { name: 'Microsoft DP-900', issuer: 'Microsoft', cat: 'microsoft', status: 'Certified', mark: 'MS', date: '2025', verifyUrl: null },
    { name: 'Google Cloud Associate Data Practitioner', issuer: 'Google Cloud', cat: 'google', status: 'Certified', mark: 'GC', date: '2025', verifyUrl: null },
    { name: 'Google Cloud Generative AI Leader', issuer: 'Google Cloud', cat: 'google', status: 'Certified', mark: 'GC', date: '2025', verifyUrl: null },
    { name: 'Oracle OCI AI Foundations Associate', issuer: 'Oracle', cat: 'oracle', status: 'Certified', mark: 'OR', date: '2025', verifyUrl: null },
    { name: 'Google Cloud Digital Leader', issuer: 'Google Cloud', cat: 'google', status: 'Certified', mark: 'GC', date: '2025', verifyUrl: null },
    { name: 'Microsoft SC-900', issuer: 'Microsoft', cat: 'microsoft', status: 'Certified', mark: 'MS', date: '2025', verifyUrl: null },
    { name: 'Fortinet Certified Associate Cybersecurity', issuer: 'Fortinet', cat: 'fortinet', status: 'Certified', mark: 'FT', date: '2024', verifyUrl: null },
  ];
  CERTS.forEach((c, i) => { c.id = 'cert-' + i; });

  const REPOS = [
    { name: 'AI-SOC-Detection-Rule-Generator', desc: 'Offline AI detection rule generator', lang: 'Python', color: '#3572A5', stars: 1 },
    { name: 'AI-Powered-Pokedex', desc: 'Retro Pokédex with AI recognition', lang: 'JavaScript', color: '#f1e05a', stars: 1 },
    { name: 'Equation-Orchestra', desc: 'Equations rendered as sound & motion', lang: 'JavaScript', color: '#f1e05a', stars: 1 },
    { name: 'Algorithm-Visualizer', desc: 'Interactive DSA visualization platform', lang: 'JavaScript', color: '#f1e05a', stars: 1 },
  ];

  /* ========================================================================
     RENDER: skills
     ======================================================================== */
  const skillCloud = document.getElementById('skillCloud');
  skillCloud.innerHTML = SKILLS.map((s) => `
    <div class="skill-tag tilt-3d" data-tilt data-tilt-max="6" data-cat="${s.cat}">
      <p class="skill-tag-name">${s.name}</p>
      <p class="skill-tag-meta">${s.meta}</p>
    </div>
  `).join('');

  document.getElementById('filterRow').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    document.querySelectorAll('#filterRow .filter-chip').forEach((c) => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.skill-tag').forEach((tag) => {
      tag.classList.toggle('is-hidden', filter !== 'all' && tag.dataset.cat !== filter);
    });
  });

  /* ========================================================================
     RENDER: projects + search + filter + modal
     ======================================================================== */
  const projectGrid = document.getElementById('projectGrid');
  const projectsLoadMoreBtn = document.getElementById('projectsLoadMore');
  const PROJECTS_PAGE_SIZE = 4;
  let projectsVisibleCount = PROJECTS_PAGE_SIZE;

  function renderProjects(list) {
    const shown = list.slice(0, projectsVisibleCount);
    projectGrid.innerHTML = shown.map((p, i) => `
      <article class="project-card tilt-3d" data-tilt data-id="${p.id}" data-reveal tabindex="0" role="button" aria-haspopup="dialog" aria-label="View case study: ${p.title}">
        <div class="project-top">
          <span class="project-index">0${i + 1} · ${p.timeline}</span>
          <span class="project-metric">${p.metric}</span>
        </div>
        <h3 class="project-title">${p.title}</h3>
        <p class="project-desc">${p.desc}</p>
        <div class="project-badges">${p.badges.map((b) => `<span class="badge">${b}</span>`).join('')}</div>
        <div class="project-foot">
          <span class="project-role">${p.role}</span>
          <span class="project-open">Read case study</span>
        </div>
      </article>
    `).join('');
    // (re)observe reveals for freshly injected cards
    projectGrid.querySelectorAll('[data-reveal]').forEach((el) => {
      el.classList.add('is-visible'); // already-loaded section: show immediately, no jank
    });
    // Re-bind the pointer-tilt effect to the cards we just injected
    // (tilt3d.js skips anything already bound, so this is cheap to call often).
    if (window.applyTilt) window.applyTilt(projectGrid);

    // Show "Load more" only if there's more of the *filtered* list left to reveal.
    const remaining = list.length - shown.length;
    if (projectsLoadMoreBtn) {
      projectsLoadMoreBtn.hidden = remaining <= 0;
      projectsLoadMoreBtn.textContent = remaining > 0 ? `Load more projects (${remaining} more)` : '';
    }
  }

  let activeCatFilter = 'all';
  let lastFilteredProjects = PROJECTS;
  function applyProjectFilters() {
    const q = document.getElementById('projectSearch').value.trim().toLowerCase();
    lastFilteredProjects = PROJECTS.filter((p) => {
      const matchesCat = activeCatFilter === 'all' || p.cat === activeCatFilter;
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || p.badges.some((b) => b.toLowerCase().includes(q));
      return matchesCat && matchesQuery;
    });
    projectsVisibleCount = PROJECTS_PAGE_SIZE; // reset paging whenever the result set changes
    renderProjects(lastFilteredProjects);
  }
  renderProjects(PROJECTS);

  document.getElementById('projectFilterRow').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-chip');
    if (!btn) return;
    document.querySelectorAll('#projectFilterRow .filter-chip').forEach((c) => c.classList.remove('is-active'));
    btn.classList.add('is-active');
    activeCatFilter = btn.dataset.pfilter;
    applyProjectFilters();
  });
  document.getElementById('projectSearch').addEventListener('input', applyProjectFilters);
  if (projectsLoadMoreBtn) {
    projectsLoadMoreBtn.addEventListener('click', () => {
      projectsVisibleCount += PROJECTS_PAGE_SIZE;
      renderProjects(lastFilteredProjects);
    });
  }

  // Cards are keyboard-focusable (tabindex="0" above); Enter/Space opens
  // the same modal a click would, matching native button behaviour.
  projectGrid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.project-card');
    if (!card) return;
    e.preventDefault();
    openModal('project', card.dataset.id);
  });

  /* -- modal: shared by both project case studies and certification previews -- */
  const modal = document.getElementById('projectModal');
  const modalPanel = modal.querySelector('.modal-panel');
  const modalContent = document.getElementById('modalContent');
  const modalCloseBtn = document.getElementById('modalClose');
  let modalCloseTimer = null;
  let lastFocusedEl = null; // so focus returns to whatever card/button opened the modal
  const onModalKeydown = Utils.trapFocus(modalPanel);

  function projectModalMarkup(p) {
    return `
      <p class="modal-eyebrow">${p.role}</p>
      <h3 class="modal-title">${p.title}</h3>
      <div class="project-badges">${p.badges.map((b) => `<span class="badge">${b}</span>`).join('')}</div>
      <div class="modal-meta-grid">
        <div><p>Timeline</p><p>${p.timeline}</p></div>
        <div><p>Role</p><p>${p.role}</p></div>
        <div><p>Impact</p><p>${p.metric}</p></div>
      </div>
      <div class="modal-section"><h4>Overview</h4><p>${p.overview}</p></div>
      <div class="modal-section"><h4>Features</h4><ul>${p.features.map((f) => `<li>${f}</li>`).join('')}</ul></div>
      <div class="modal-section"><h4>Architecture</h4><p>${p.architecture}</p></div>
      <div class="modal-section"><h4>Challenges & lessons</h4><p>${p.challenges}</p></div>
    `;
  }

  function certModalMarkup(c) {
    const statusLabel = c.status === 'In Progress' ? '● In progress' : '✓ Certified';
    return `
      <div class="cert-icon" style="margin-bottom:20px">${c.mark}</div>
      <h3 class="modal-title">${c.name}</h3>
      <div class="modal-meta-grid">
        <div><p>Issuer</p><p>${c.issuer}</p></div>
        <div><p>Date</p><p>${c.date}</p></div>
        <div><p>Status</p><p>${statusLabel}</p></div>
      </div>
      ${c.verifyUrl
        ? `<div class="modal-links"><a class="btn btn-primary btn-small" href="${c.verifyUrl}" target="_blank" rel="noopener">Verify credential</a></div>`
        : `<div class="modal-section"><p style="color:var(--text-muted)">Verification link not yet published for this credential.</p></div>`}
    `;
  }

  function openModal(type, id) {
    const p = type === 'project' ? PROJECTS.find((x) => x.id === id) : CERTS.find((x) => x.id === id);
    if (!p) return;
    lastFocusedEl = document.activeElement;
    modal.dataset.type = type;
    modalContent.innerHTML = type === 'project' ? projectModalMarkup(p) : certModalMarkup(p);
    if (modalCloseTimer) { clearTimeout(modalCloseTimer); modalCloseTimer = null; }
    modal.classList.remove('is-closing');
    modal.classList.add('is-open');
    modalPanel.classList.remove('flip-out');
    // force reflow so the flip-in animation restarts every time the modal reopens
    void modalPanel.offsetWidth;
    modalPanel.classList.add('flip-in');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalPanel.addEventListener('keydown', onModalKeydown);
    modalCloseBtn.focus();
  }
  function closeModal() {
    if (!modal.classList.contains('is-open')) return;
    modalPanel.classList.remove('flip-in');
    modalPanel.classList.add('flip-out');
    modal.classList.add('is-closing');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modalPanel.removeEventListener('keydown', onModalKeydown);
    if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
    modalCloseTimer = window.setTimeout(() => {
      modal.classList.remove('is-open', 'is-closing');
      modalPanel.classList.remove('flip-out');
    }, 380);
  }
  projectGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (card) openModal('project', card.dataset.id);
  });
  modalCloseBtn.addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ========================================================================
     RENDER: certifications — gallery grid, provider filters, pagination,
     and a preview modal (reusing the same modal as projects).
     ======================================================================== */
  const certGrid = document.getElementById('certGrid');
  const certFilterRow = document.getElementById('certFilterRow');
  const certsLoadMoreBtn = document.getElementById('certsLoadMore');
  const CERTS_PAGE_SIZE = 6;
  let certsVisibleCount = CERTS_PAGE_SIZE;

  // Build filter chips straight from the data (issuer names actually present)
  // rather than hard-coding a provider list that could drift out of sync.
  if (certFilterRow) {
    const issuers = [...new Map(CERTS.map((c) => [c.cat, c.issuer])).entries()];
    certFilterRow.innerHTML = [
      `<button class="filter-chip is-active" data-cfilter="all">All</button>`,
      ...issuers.map(([cat, issuer]) => `<button class="filter-chip" data-cfilter="${cat}">${issuer}</button>`),
    ].join('');
  }

  function renderCerts(list) {
    const shown = list.slice(0, certsVisibleCount);
    certGrid.innerHTML = shown.map((c) => `
      <div class="cert-card tilt-3d" data-tilt data-tilt-max="8" data-reveal data-id="${c.id}" tabindex="0" role="button" aria-haspopup="dialog" aria-label="View certificate: ${c.name}">
        <div class="cert-icon">${c.mark}</div>
        <p class="cert-name">${c.name}</p>
        <p class="cert-issuer">${c.issuer} · ${c.date}</p>
        <span class="cert-status ${c.status === 'In Progress' ? 'in-progress' : ''}">${c.status === 'In Progress' ? '● In progress' : '✓ Certified'}</span>
      </div>
    `).join('');
    certGrid.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
    if (window.applyTilt) window.applyTilt(certGrid);

    const remaining = list.length - shown.length;
    if (certsLoadMoreBtn) {
      certsLoadMoreBtn.hidden = remaining <= 0;
      certsLoadMoreBtn.textContent = remaining > 0 ? `Load more certifications (${remaining} more)` : '';
    }
  }

  let activeCertFilter = 'all';
  let lastFilteredCerts = CERTS;
  function applyCertFilter() {
    lastFilteredCerts = activeCertFilter === 'all' ? CERTS : CERTS.filter((c) => c.cat === activeCertFilter);
    certsVisibleCount = CERTS_PAGE_SIZE;
    renderCerts(lastFilteredCerts);
  }
  renderCerts(CERTS);

  if (certFilterRow) {
    certFilterRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      certFilterRow.querySelectorAll('.filter-chip').forEach((c) => c.classList.remove('is-active'));
      btn.classList.add('is-active');
      activeCertFilter = btn.dataset.cfilter;
      applyCertFilter();
    });
  }
  if (certsLoadMoreBtn) {
    certsLoadMoreBtn.addEventListener('click', () => {
      certsVisibleCount += CERTS_PAGE_SIZE;
      renderCerts(lastFilteredCerts);
    });
  }
  certGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.cert-card');
    if (card) openModal('cert', card.dataset.id);
  });
  certGrid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.cert-card');
    if (!card) return;
    e.preventDefault();
    openModal('cert', card.dataset.id);
  });

  /* ========================================================================
     RENDER: github repos
     ======================================================================== */
  const repoList = document.getElementById('repoList');
  repoList.innerHTML = REPOS.map((r) => `
    <a class="repo-card tilt-3d" data-tilt data-tilt-max="6" href="https://github.com/mouli-dutta/${r.name}" target="_blank" rel="noopener">
      <div>
        <p class="repo-name">${r.name}</p>
        <p class="repo-desc">${r.desc}</p>
      </div>
      <div class="repo-meta">
        <span><span class="repo-lang-dot" style="background:${r.color}"></span>${r.lang}</span>
        <span>★ ${r.stars}</span>
      </div>
    </a>
  `).join('');

  /* ========================================================================
     CONTACT FORM — client-side validation only (no backend)
     ======================================================================== */
  const form = document.getElementById('contactForm');
  const successMsg = document.getElementById('formSuccess');
  const submitBtn = form.querySelector('.btn-submit');

  function setError(id, msg) {
    const field = document.getElementById(id).closest('.form-field');
    field.classList.toggle('has-error', Boolean(msg));
    document.getElementById('err-' + id).textContent = msg || '';
  }

  function validate() {
    let ok = true;
    const name = document.getElementById('fName').value.trim();
    const email = document.getElementById('fEmail').value.trim();
    const subject = document.getElementById('fSubject').value.trim();
    const message = document.getElementById('fMessage').value.trim();

    if (!name) { setError('fName', 'Tell me your name.'); ok = false; } else setError('fName', '');
    if (!email) { setError('fEmail', 'An email is needed to reply.'); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('fEmail', 'That email doesn\'t look right.'); ok = false; }
    else setError('fEmail', '');
    if (!subject) { setError('fSubject', 'Add a short subject.'); ok = false; } else setError('fSubject', '');
    if (!message || message.length < 10) { setError('fMessage', 'A few more details would help (10+ characters).'); ok = false; } else setError('fMessage', '');

    return ok;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;
    submitBtn.classList.add('is-loading');
    successMsg.classList.remove('is-visible');
    setTimeout(() => {
      submitBtn.classList.remove('is-loading');
      successMsg.classList.add('is-visible');
      form.reset();
    }, 1100);
  });

  /* ========================================================================
     FOOTER: year + back to top
     ======================================================================== */
  document.getElementById('footerYear').textContent = new Date().getFullYear();
  const backToTop = document.getElementById('backToTop');
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ========================================================================
     EASTER EGGS
     ======================================================================== */
  const toast = document.getElementById('konamiToast');
  function showToast(msg) {
    toast.querySelector('span').textContent = msg;
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let konamiProgress = 0;
  let typedBuffer = '';

  document.addEventListener('keydown', (e) => {
    const key = e.key;
    konamiProgress = (key === konami[konamiProgress]) ? konamiProgress + 1 : (key === konami[0] ? 1 : 0);
    if (konamiProgress === konami.length) {
      konamiProgress = 0;
      showToast('🛰️ Developer mode unlocked. Detections armed.');
      document.body.classList.add('dev-mode');
    }

    if (key.length === 1) {
      typedBuffer = (typedBuffer + key).slice(-5).toLowerCase();
      if (typedBuffer === 'hello') showToast('👋 Hey there — thanks for poking around the console.');
    }
  });
})();
