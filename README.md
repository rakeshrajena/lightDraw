<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/logo.svg" alt="LightDraw logo" width="96" height="96" />
</p>

<h1 align="center">LightDraw.js</h1>

<p align="center">
  <strong>Ultra-lightweight, production-ready 2D graphics and UI engine for the web.</strong><br/>
  Dashboards, automotive clusters, diagrams, and interactive UI — zero dependencies.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/lightdraw"><img src="https://img.shields.io/npm/v/lightdraw.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/lightdraw"><img src="https://img.shields.io/npm/dm/lightdraw.svg" alt="npm downloads" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/deps-zero-success" alt="Zero dependencies" />
  <img src="https://img.shields.io/badge/renderers-Canvas%20%7C%20SVG%20%7C%20HTML-64748b" alt="Renderers" />
</p>

<p align="center">
  <a href="https://github.com/rakeshrajena/lightDraw">GitHub</a>
  ·
  <a href="https://github.com/rakeshrajena/lightDraw#install">Install</a>
  ·
  <a href="https://github.com/rakeshrajena/lightDraw/blob/main/docs/getting-started.md">Docs</a>
  ·
  <a href="https://github.com/rakeshrajena/lightDraw#ai--llm-integration">AI / JSON</a>
  ·
  <a href="https://www.npmjs.com/package/lightdraw">npm</a>
</p>

---

## What is LightDraw?

**LightDraw** is a retained-mode 2D scene graph for browsers and embedded WebViews. Tree-shakeable bundles, three renderers (Canvas, SVG, HTML), and a **JSON-first API** for AI-generated dashboards, HMIs, and diagrams — without React, D3, or a charting framework.

| Module | What you get |
|--------|----------------|
| **Core** | Shapes, animation, events, camera, layouts |
| **UI** | 17 components (button, slider, dialog, table, …) + `lightdraw.min.css` |
| **Dashboard** | Gauges, 82+ chart types, clocks, thermometers |
| **Automotive** | 160 widgets, instrument cluster, TPMS, CAN, ADAS |
| **Diagram** | 9 types — flowchart, state machine, UML, network, CAN bus |
| **Export** | PNG, JPEG, SVG, PDF, JSON, offline HTML |

---

## Install

```bash
npm install lightdraw
```

**CDN (full bundle + CSS for HTML UI):**

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.css">
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.js"></script>
<script>
  const app = LightDraw.createApp('#app', { width: 800, height: 600, renderer: 'html' });
  app.loadJSON({ type: 'button', props: { label: 'Hello', x: 40, y: 40 } });
</script>
```

**ESM (tree-shake plugins):**

```javascript
import LightDraw from 'lightdraw';
// or: import LightDraw from 'lightdraw/core' + LightDraw.use(uiPlugin)

const app = LightDraw.createApp('#app', { renderer: 'html' });
app.add(app.circle({ x: 120, y: 120, radius: 48, fill: '#2563eb' }));
app.render();
```

**TypeScript:** types ship in `dist/index.d.ts`. Subpath types: `lightdraw/core`, `lightdraw/ui`, `lightdraw/dashboard`, etc.

**Legacy / WebView:** `import 'lightdraw/legacy'` or `dist/lightdraw.legacy.js` (ES5 UMD).

---

## Quick example

```javascript
import LightDraw from 'lightdraw';

const app = LightDraw.createApp('#app', { width: 800, height: 500, background: '#0d1322' });
const ball = app.circle({ x: 100, y: 250, radius: 28, fill: '#3b82f6', draggable: true });
app.add(ball);
ball.animate({ x: 650, duration: 2000, easing: 'easeInOutCubic', loop: true, reverse: true });
```

Load a dashboard from JSON:

```javascript
app.loadJSON({
  type: 'group',
  children: [
    { type: 'speedometer', props: { value: 95, size: 160, x: 40, y: 40 } },
    { type: 'lineChart', props: { data: [20, 45, 30, 60, 55, 80], width: 320, height: 140, x: 240, y: 50 } },
    { type: 'gauge', props: { value: 68, size: 100, x: 600, y: 60 } },
  ],
});
```

---

## Screenshots

Full demo pages at 1280×800 (playground + examples on GitHub).

### Dashboard

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/dashboard.png" alt="LightDraw dashboard — gauges and charts" width="100%" />
</p>

### Automotive cluster

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/automotive.png" alt="LightDraw automotive instrument cluster" width="100%" />
</p>

### Diagrams

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/diagram.png" alt="LightDraw diagrams — flowchart and network" width="100%" />
</p>

### UI components

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/ui-components.png" alt="LightDraw UI component library" width="100%" />
</p>

### Animation

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/animation.png" alt="LightDraw animation demo" width="100%" />
</p>

---

## Modular bundles

| npm import | File | Gzip (approx.) |
|------------|------|----------------|
| `lightdraw` | `lightdraw.min.js` | ~101 KB |
| `lightdraw/core` | `lightdraw.core.min.js` | ~26 KB |
| `lightdraw/html` | `lightdraw.html.min.js` | ~18 KB |
| `lightdraw/ui` | `lightdraw.ui.min.js` | ~11 KB |
| `lightdraw/svg` | `lightdraw.svg.min.js` | ~10 KB |
| `lightdraw/dashboard` | `lightdraw.dashboard.min.js` | ~32 KB |
| `lightdraw/automotive` | `lightdraw.automotive.min.js` | ~29 KB |
| `lightdraw/diagram` | `lightdraw.diagram.min.js` | ~15 KB |

Each bundle has a matching `*.legacy.js` (ES5) build. CSS: `dist/lightdraw.min.css`.

```javascript
import LightDraw from 'lightdraw/core';
import htmlPlugin from 'lightdraw/html';
import uiPlugin from 'lightdraw/ui';

LightDraw.use(htmlPlugin);
LightDraw.use(uiPlugin);

const app = LightDraw.createApp('#app', {
  renderer: 'html',
  uiTheme: { preset: 'dark' },
});
```

---

## AI & LLM Integration

LightDraw is **JSON-first**: an LLM outputs a scene tree → `validateSceneJSON` → `app.loadJSON()` → live UI. No React/Vue codegen.

```
Prompt → LLM + schema docs → scene JSON → validate → loadJSON → canvas / HTML
```

**Minimal host page (CDN):**

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.css">
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.js"></script>
<script>
  const app = LightDraw.createApp('#app', { width: 960, height: 540, renderer: 'html', background: '#0d1322' });
  const scene = {
    type: 'group',
    children: [
      { type: 'card', props: { title: 'Server health', x: 16, y: 16, width: 420, height: 200 } },
      { type: 'lineChart', props: { data: [22, 35, 28, 48, 41, 55], x: 32, y: 56, width: 380, height: 140 } },
      { type: 'gauge', props: { value: 68, size: 120, x: 480, y: 40 } },
      { type: 'button', props: { label: 'Acknowledge', variant: 'primary', x: 480, y: 200 } },
    ],
  };
  const { valid, errors } = LightDraw.validateSceneJSON(scene);
  if (valid) { app.loadJSON(scene); app.setUiTheme({ preset: 'dark' }); }
  else console.error(errors);
</script>
```

**Schema catalogs (attach to LLM context):**

| Domain | Doc on GitHub |
|--------|----------------|
| UI (17 components) | [ui-components-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ui-components-schema.md) |
| Dashboard | [dashboard-widgets-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/dashboard-widgets-schema.md) |
| Automotive | [automotive-widgets-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/automotive-widgets-schema.md) |
| Diagram | [diagram-module-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/diagram-module-schema.md) |

Full guide: [docs/ai-integration-guide.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ai-integration-guide.md)

**System prompt snippet:**

```text
Generate LightDraw scene JSON only.
Root: { "type": "group", "children": [...] }
Each child: { "type": "<widget>", "props": { "x", "y", ... } }
Use only types from the schema catalog. Colors: #rrggbb. No JS. No markdown fences.
```

---

## Live demos & playground

Clone the [GitHub repo](https://github.com/rakeshrajena/lightDraw) for interactive HTML demos:

| Demo | Description |
|------|-------------|
| [demo-dashboard.html](https://github.com/rakeshrajena/lightDraw/blob/main/examples/demo-dashboard.html) | Widgets + 82 chart types |
| [demo-ui.html](https://github.com/rakeshrajena/lightDraw/blob/main/examples/demo-ui.html) | 17 UI components + themes |
| [demo-ui-catalog.html](https://github.com/rakeshrajena/lightDraw/blob/main/examples/demo-ui-catalog.html) | Variant gallery for AI prompting |
| [demo-diagram.html](https://github.com/rakeshrajena/lightDraw/blob/main/examples/demo-diagram.html) | 9 diagram types |
| [demo-automotive.html](https://github.com/rakeshrajena/lightDraw/blob/main/examples/demo-automotive.html) | Instrument cluster |

```bash
git clone https://github.com/rakeshrajena/lightDraw.git
cd lightDraw && npm install && npm run build && npm run dev:website
# → http://localhost:5173
```

---

## Documentation

| Guide | Link |
|-------|------|
| Getting started | [docs/getting-started.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/getting-started.md) |
| AI integration | [docs/ai-integration-guide.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ai-integration-guide.md) |
| UI themes | [docs/ui-theme-guide.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ui-theme-guide.md) |
| Responsive layout | [docs/responsive-guide.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/responsive-guide.md) |
| Legacy ES5 + CSS | [docs/legacy-ui-guide.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/legacy-ui-guide.md) |
| Export pipeline | [docs/export-pipeline.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/export-pipeline.md) |
| v1.0 release notes | [docs/v1-release-notes.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/v1-release-notes.md) |
| All docs | [docs/README.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/README.md) |

---

## Features

- Zero runtime dependencies
- Canvas, SVG, and HTML/CSS renderers
- Retained-mode scene graph with transforms, clipping, shadows
- Animation engine — timelines, easing, motion paths, stagger
- Pointer, touch, drag, keyboard + ARIA / high-contrast mode
- `app.setUiTheme({ preset })` — polished UI without custom CSS
- `app.export()` — PNG, JPEG, SVG, PDF, JSON, HTML
- Plugin architecture + ES5 legacy bundles for WebView / automotive

---

## Browser support

Chromium 49+, Chrome, Firefox, Edge, Safari, Android WebView, embedded Chromium, automotive HMIs.

Use `lightdraw.legacy.js` + `lightdraw.min.css` for ES5 targets.

---

## Development

```bash
npm install
npm run build
npm test
npm run ci:local    # typecheck, lint, size gate, full tests, benchmarks
```

See [IMPLEMENTATION_PLAN.md](https://github.com/rakeshrajena/lightDraw/blob/main/IMPLEMENTATION_PLAN.md) and [PROJECT_STATUS.md](https://github.com/rakeshrajena/lightDraw/blob/main/PROJECT_STATUS.md) on GitHub.

---

## License

MIT — see [LICENSE](https://github.com/rakeshrajena/lightDraw/blob/main/LICENSE).

---

## Author

**Rakesh Ranjan Jena**

- Website: [rakeshranjanjena.com](https://rakeshranjanjena.com)
- GitHub: [github.com/rakeshrajena/lightDraw](https://github.com/rakeshrajena/lightDraw)
- LinkedIn: [linkedin.com/in/rrjprince](https://www.linkedin.com/in/rrjprince/)

Made with ❤️ for the web developer & AI community.
