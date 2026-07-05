<p align="center">
  <img src="docs/images/logo.svg" alt="LightDraw logo" width="96" height="96" />
</p>

<h1 align="center">LightDraw.js</h1>

<p align="center">
  <strong>Ultra-lightweight, production-ready 2D graphics and UI engine for the web.</strong><br/>
  Build dashboards, automotive instrument clusters, diagrams, and interactive UIs — with zero dependencies.
</p>

<p align="center">
  <a href="https://github.com/rakeshrajena/lightDraw">GitHub</a>
  ·
  <a href="./docs/getting-started.md">Documentation</a>
  ·
  <a href="./docs/README.md">Docs index</a>
  ·
  <a href="https://www.npmjs.com/package/lightdraw">npm</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/version-0.9.0-2563eb" alt="Version 0.9.0" />
  <img src="https://img.shields.io/badge/deps-zero-success" alt="Zero dependencies" />
  <img src="https://img.shields.io/badge/renderers-Canvas%20%7C%20SVG%20%7C%20HTML-64748b" alt="Renderers" />
</p>

---

## What is LightDraw?

**LightDraw** is a retained-mode 2D scene graph for browsers and embedded WebViews. It ships as small, tree-shakeable bundles and targets use cases where you need **real graphics performance** without pulling in React, D3, or a charting framework.

Use it when you want to:

- Render **live dashboards** (gauges, charts, clocks) on canvas or HTML
- Build **automotive digital cockpits** with tachometers, TPMS, ADAS status, and themes
- Draw **flowcharts, org charts, UML, and network diagrams** with smart connector routing
- Ship **accessible UI components** (buttons, forms, tables, dialogs) via the HTML renderer
- Load scenes from **JSON** — ideal for AI-generated UIs and low-code tools
- Support **legacy ES5 browsers** in automotive and industrial embedded targets

**Repository:** [github.com/rakeshrajena/lightDraw](https://github.com/rakeshrajena/lightDraw)

## Screenshots

Full demo pages at 1280×800 — header, controls, and canvas included (not cropped).

### Dashboard widgets

Live gauges, line charts, progress bars, and status cards — interactive hover tooltips included.

<p align="center">
  <img src="docs/images/dashboard.png" alt="LightDraw dashboard widgets — gauges and charts" width="100%" />
</p>

### Automotive instrument cluster

Full digital cockpit with speedometer, tachometer, fuel, TPMS (FL/FR/RL/RR), and warning lamps.

<p align="center">
  <img src="docs/images/automotive.png" alt="LightDraw automotive instrument cluster" width="100%" />
</p>

### Diagram module

Flowcharts, state machines, class diagrams, mind maps, and network topology with routed connectors.

<p align="center">
  <img src="docs/images/diagram.png" alt="LightDraw diagram module — flowchart and network" width="100%" />
</p>

### UI component library

17 built-in components with professional CSS theming — buttons, forms, tabs, tables, dialogs, and more.

<p align="center">
  <img src="docs/images/ui-components.png" alt="LightDraw UI component library" width="100%" />
</p>

### Animation engine

Timelines, easing, motion paths, and stagger — no GSAP or third-party animation library required.

<p align="center">
  <img src="docs/images/animation.png" alt="LightDraw animation demo" width="100%" />
</p>

> Regenerate screenshots after UI changes: `npm run screenshots:readme`

## Features

- **Zero dependencies** — no React, jQuery, GSAP, or other libraries required
- **Multiple renderers** — Canvas, SVG, and HTML/CSS with automatic detection
- **Retained-mode scene graph** — unlimited nesting, transforms, clipping, shadows
- **Animation engine** — timelines, easing, chaining (no third-party libs)
- **Event system** — pointer, touch, drag, keyboard with optimized hit testing
- **Camera** — pan, zoom, rotate, follow object, coordinate conversion
- **Layout engine** — grid, stack, flex, flow, tree, circular layouts
- **UI components** — button, card, slider, progress bar, toggle, and more
- **Dashboard widgets** — charts, gauges, speedometer, clock, battery
- **Automotive module** — instrument cluster, tachometer, ADAS, warning lamps
- **Diagram module** — flowcharts, org charts, connector routing
- **AI-friendly JSON** — load and export scenes as JSON definitions
- **Plugin system** — extend with custom components, renderers, themes
- **Legacy browser support** — ES5 build for embedded/automotive browsers

## Quick Start

### CDN

```html
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.min.js"></script>
<script>
  const app = LightDraw.createApp('#app', { width: 800, height: 600 });

  const circle = app.circle({ x: 200, y: 200, radius: 60, fill: '#2563eb' });
  app.add(circle);

  circle.animate({ x: 500, rotation: 360, duration: 1200, easing: 'easeOutBounce' });
</script>
```

### npm

```bash
npm install lightdraw
```

```javascript
import LightDraw from 'lightdraw';

const app = LightDraw.createApp('#app');
const rect = app.rect({ width: 100, height: 50, fill: '#ef4444' });
app.add(rect);
```

### Modular imports (v0.4+)

Load only what you need — smaller bundles and faster startup:

```javascript
import LightDraw from 'lightdraw/core';
import svgPlugin from 'lightdraw/svg';
import htmlPlugin from 'lightdraw/html';
import uiPlugin from 'lightdraw/ui';

LightDraw.use(svgPlugin);
LightDraw.use(htmlPlugin);
LightDraw.use(uiPlugin);

const app = LightDraw.createApp('#app', { renderer: 'html' });
```

| Subpath | Bundle | Contents |
|---------|--------|----------|
| `lightdraw/core` | `lightdraw.core.min.js` | App, shapes, canvas, animation, events |
| `lightdraw/svg` | `lightdraw.svg.min.js` | SVG renderer plugin |
| `lightdraw/html` | `lightdraw.html.min.js` | HTML renderer plugin |
| `lightdraw/ui` | `lightdraw.ui.min.js` | UI components |
| `lightdraw/dashboard` | `lightdraw.dashboard.min.js` | Dashboard widgets |
| `lightdraw/automotive` | `lightdraw.automotive.min.js` | Automotive widgets |
| `lightdraw/diagram` | `lightdraw.diagram.min.js` | Diagram module |
| `lightdraw` | `lightdraw.min.js` | Full bundle (all modules, backward compatible) |

Each bundle also ships an ES5 `.legacy.js` variant for embedded browsers.

```html
<!-- Core + HTML plugin via CDN -->
<script src="https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.core.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.html.min.js"></script>
<script>
  LightDraw.use(LightDrawHtml.default);
  const app = LightDraw.createApp('#app', { renderer: 'html' });
</script>
```

### AI JSON Integration

```javascript
app.loadJSON({
  type: 'dashboard',
  children: [
    { type: 'speedometer', props: { value: 82, x: 50, y: 50 } },
    { type: 'fuelGauge', props: { value: 64, x: 300, y: 50 } },
    { type: 'lineChart', props: { data: [10, 30, 45, 25, 60], x: 50, y: 280 } }
  ]
});
```

## Build Outputs

| File | Description |
|------|-------------|
| `dist/lightdraw.core.min.js` | Core only (canvas, shapes, animation) |
| `dist/lightdraw.svg.min.js` | SVG renderer plugin |
| `dist/lightdraw.html.min.js` | HTML renderer plugin |
| `dist/lightdraw.ui.min.js` | UI components plugin |
| `dist/lightdraw.dashboard.min.js` | Dashboard widgets plugin |
| `dist/lightdraw.automotive.min.js` | Automotive widgets plugin |
| `dist/lightdraw.diagram.min.js` | Diagram module plugin |
| `dist/lightdraw.esm.js` | Full ES Module build |
| `dist/lightdraw.js` | Full UMD / IIFE (development) |
| `dist/lightdraw.min.js` | Full UMD minified (CDN) |
| `dist/*.legacy.js` | ES5 variants for each bundle |
| `dist/index.d.ts` | TypeScript declarations (full) |
| `dist/lightdraw.min.css` | HTML renderer styles |

## Documentation & Playground

| Resource | Path |
|----------|------|
| **Docs index** | [docs/README.md](./docs/README.md) |
| Getting started | [docs/getting-started.md](./docs/getting-started.md) |
| Animation / Plugins / Performance | [docs/](./docs/) |
| API reference | `npm run docs:api` → `docs/api/` |
| Playground | `npm run dev:website` → http://localhost:5173 |
| Examples | [examples/](./examples/) |

```bash
npm run docs:api        # TypeDoc API reference
npm run dev:website     # Vite playground (build library first)
npm run build:website   # Static site → website/dist/
npm run screenshots:readme  # Refresh README demo images
npm run ci:local        # Full local test + benchmark suite
```

## Development

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the phased roadmap (quality, tests, performance, memory gates per phase).
See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current feature status.

```bash
npm install
npm run build
npm test
npm run ci:local      # coverage, perf, phase tests, benchmarks
```

## Browser Support

Chromium 49+, Chrome, Firefox, Edge, Safari, Android WebView, embedded Chromium, automotive infotainment browsers.

Use `lightdraw.legacy.js` for ES5 environments.

## License

MIT — see [LICENSE](./LICENSE).

---

## Author

**Rakesh Ranjan Jena**

- Website: [rakeshranjanjena.com](https://rakeshranjanjena.com)
- Blog: [rrjprince.com](https://www.rrjprince.com/)
- LinkedIn: [linkedin.com/in/rrjprince](https://www.linkedin.com/in/rrjprince/)
- GitHub: [github.com/rakeshrajena/lightDraw](https://github.com/rakeshrajena/lightDraw)

Made with ❤️ for the web developer & AI community.
