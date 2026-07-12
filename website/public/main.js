/**
 * LightDraw website — hero canvas + playground router.
 */

const DEMOS = [
  {
    id: 'theme',
    title: 'Theme',
    blurb: 'Live Scene / Theme JSON — presets sync both ways.',
    src: 'examples/demo-theme.html?embed=1',
    full: 'examples/demo-theme.html',
  },
  {
    id: 'ui',
    title: 'UI',
    blurb: 'Buttons, forms, tables, dialogs — edit the scene tree live.',
    src: 'examples/demo-ui.html?embed=1',
    full: 'examples/demo-ui.html',
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    blurb: 'Gauges & charts — live JSON for the active layout.',
    src: 'examples/demo-dashboard.html?embed=1',
    full: 'examples/demo-dashboard.html',
  },
  {
    id: 'color-stops',
    title: 'Color stops',
    blurb: 'Value-based colorStops & dial colorZones.',
    src: 'examples/demo-color-stops.html?embed=1',
    full: 'examples/demo-color-stops.html',
  },
  {
    id: 'automotive',
    title: 'Automotive',
    blurb: 'Instrument cluster — edit cluster props live.',
    src: 'examples/demo-automotive.html?embed=1',
    full: 'examples/demo-automotive.html',
  },
  {
    id: 'diagram',
    title: 'Diagram',
    blurb: 'Flowcharts, networks, UML — config-driven rebuild.',
    src: 'examples/demo-diagram.html?embed=1',
    full: 'examples/demo-diagram.html',
  },
  {
    id: 'animation',
    title: 'Animation',
    blurb: 'Motion paths, morph, stagger — scene configs.',
    src: 'examples/demo-animation.html?embed=1',
    full: 'examples/demo-animation.html',
  },
  {
    id: 'export',
    title: 'Export',
    blurb: 'PNG, JPEG, SVG, PDF — tweak the scene then export.',
    src: 'examples/demo-export.html?embed=1',
    full: 'examples/demo-export.html',
  },
  {
    id: 'core',
    title: 'Core',
    blurb: 'Shapes, text, and the engine loop.',
    src: 'examples/demo.html?embed=1',
    full: 'examples/demo.html',
  },
  {
    id: 'a11y',
    title: 'Accessibility',
    blurb: 'Keyboard focus, ARIA, high-contrast.',
    src: 'examples/demo-a11y.html?embed=1',
    full: 'examples/demo-a11y.html',
  },
];

function currentDemoId() {
  const hash = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
  if (hash === 'playground' || hash === 'hero' || !hash) return 'theme';
  const hit = DEMOS.find((d) => d.id === hash);
  return hit ? hit.id : 'theme';
}

function mountNav() {
  const nav = document.getElementById('demo-nav');
  if (!nav) return;
  nav.innerHTML = '';
  DEMOS.forEach((demo) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rail-item';
    btn.dataset.id = demo.id;
    btn.setAttribute('role', 'tab');
    btn.innerHTML = `${demo.title}<small>${demo.blurb}</small>`;
    btn.addEventListener('click', () => selectDemo(demo.id, true));
    nav.appendChild(btn);
  });
}

function demoSrc(demo) {
  const theme =
    document.documentElement.dataset.siteTheme ||
    (window.SiteTheme && SiteTheme.preferred()) ||
    'night';
  const base = demo.src;
  const join = base.includes('?') ? '&' : '?';
  return `${base}${join}shell=${theme}`;
}

function selectDemo(id, pushHash) {
  const demo = DEMOS.find((d) => d.id === id) || DEMOS[0];
  const frame = document.getElementById('demo-frame');
  const title = document.getElementById('stage-title');
  const desc = document.getElementById('stage-desc');
  const open = document.getElementById('btn-open-full');

  document.querySelectorAll('.rail-item').forEach((el) => {
    const on = el.dataset.id === demo.id;
    el.classList.toggle('is-active', on);
    el.setAttribute('aria-selected', on ? 'true' : 'false');
  });

  if (title) title.textContent = demo.title;
  if (desc) desc.textContent = demo.blurb;
  if (open) {
    open.href = demo.full;
    open.setAttribute('aria-label', `Open ${demo.title} full demo`);
  }

  if (frame) {
    const next = demoSrc(demo);
    if (frame.dataset.src !== next) {
      frame.dataset.src = next;
      frame.src = next;
    }
  }

  if (pushHash) {
    const nextHash = `#${demo.id}`;
    if (location.hash !== nextHash) {
      history.replaceState(null, '', nextHash);
    }
  }

  // Scroll app shell into view when it's mostly off-screen (e.g. hero CTA)
  const shell = document.getElementById('playground');
  if (shell) {
    const rect = shell.getBoundingClientRect();
    if (rect.top > window.innerHeight * 0.35) {
      shell.scrollIntoView({ behavior: 'smooth' });
    }
  }
}

function wireChrome() {
  document.getElementById('btn-reload')?.addEventListener('click', () => {
    const frame = document.getElementById('demo-frame');
    if (frame?.src) frame.src = frame.src;
  });

  window.addEventListener('hashchange', () => {
    const id = currentDemoId();
    selectDemo(id, false);
    if ((location.hash || '').includes('playground')) {
      document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

/** Soft orbiting hero mark — product presence without competing with the brand. */
function bootHeroCanvas() {
  const host = document.getElementById('hero-canvas-host');
  if (!host || typeof LightDraw === 'undefined') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function measure() {
    const rect = host.getBoundingClientRect();
    return {
      w: Math.max(320, Math.floor(rect.width || window.innerWidth)),
      h: Math.max(180, Math.floor(rect.height || 320)),
    };
  }

  let { w, h } = measure();
  const app = LightDraw.createApp('#hero-canvas-host', {
    width: w,
    height: h,
    background: 'transparent',
    renderer: 'canvas',
    autoResize: false,
  });

  const cx = w * 0.5;
  const cy = h * 0.42;

  for (let i = 0; i < 18; i++) {
    app.add(
      app.circle({
        x: (w / 18) * i + 10,
        y: h * 0.15 + (i % 3) * 28,
        radius: 1.2,
        fill: 'rgba(62, 207, 207, 0.2)',
        listening: false,
      })
    );
  }

  app.add(
    app.circle({
      x: cx,
      y: cy,
      radius: Math.min(w, h) * 0.16,
      fill: null,
      stroke: 'rgba(62, 207, 207, 0.22)',
      strokeWidth: 1,
      listening: false,
    })
  );

  const ball = app.circle({
    x: cx,
    y: cy,
    radius: 7,
    fill: '#f0a202',
    shadow: { color: 'rgba(240,162,2,0.45)', blur: 14, offsetX: 0, offsetY: 0 },
  });
  app.add(ball);

  const card = app.group({ x: cx - 120, y: cy - 36 });
  card.add(
    app.roundedRect({
      width: 240,
      height: 72,
      cornerRadius: 12,
      fill: 'rgba(20, 26, 36, 0.72)',
      stroke: 'rgba(62, 207, 207, 0.28)',
      strokeWidth: 1,
    }),
    app.text({
      text: 'createApp → loadJSON → live',
      x: 18,
      y: 28,
      fontSize: 14,
      fill: '#e8eef8',
      fontFamily: 'IBM Plex Mono, monospace',
    }),
    app.text({
      text: 'Scene · Theme · Export',
      x: 18,
      y: 48,
      fontSize: 12,
      fill: '#8b97ad',
      fontFamily: 'IBM Plex Mono, monospace',
    })
  );
  app.add(card);

  let t0 = performance.now();
  function tick(now) {
    if (!reduceMotion) {
      const t = (now - t0) / 1000;
      const r = Math.min(w, h) * 0.16;
      ball.x = cx + Math.cos(t * 0.9) * r;
      ball.y = cy + Math.sin(t * 0.9) * r;
      app.requestRender();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.addEventListener('resize', () => {
    ({ w, h } = measure());
    if (typeof app.resize === 'function') app.resize(w, h);
  });
}

mountNav();
wireChrome();
selectDemo(currentDemoId(), false);
bootHeroCanvas();

// Deep-link into playground when hash is a demo id
if (location.hash && location.hash !== '#hero') {
  requestAnimationFrame(() => {
    document.getElementById('playground')?.scrollIntoView({ behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  });
}
