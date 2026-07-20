<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/logo.svg" alt="LightDraw logo" width="96" height="96" />
</p>

<h1 align="center">LightDraw.js</h1>

<p align="center">
  <strong>One library for dashboards, automotive HMIs, diagrams, and UI — zero dependencies.</strong><br/>
  Canvas · SVG · HTML renderers · JSON-first for AI · ES5 for embedded WebViews.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  <img src="https://img.shields.io/badge/deps-zero-success" alt="Zero dependencies" />
  <img src="https://img.shields.io/badge/renderers-Canvas%20%7C%20SVG%20%7C%20HTML-64748b" alt="Renderers" />
</p>

<p align="center">
  <a href="https://github.com/rakeshrajena/lightDraw">GitHub</a>
  ·
  <a href="https://rakeshrajena.github.io/lightDraw/">Live playground</a>
  ·
  <a href="https://rakeshrajena.github.io/lightDraw/#diagram">Diagram demo</a>
  ·
  <a href="https://www.npmjs.com/package/lightdraw">npm</a>
  ·
  <a href="https://github.com/rakeshrajena/lightDraw#install">Install</a>
  ·
  <a href="https://github.com/rakeshrajena/lightDraw/blob/main/docs/v1.1-release-notes.md">v1.1 notes</a>
</p>

---

## The problem LightDraw solves

Building **interactive 2D graphics** in the browser usually means stacking tools:

| Typical stack | Pain |
|---------------|------|
| React + Chart.js + D3 + diagram lib | Large bundle, framework lock-in, many APIs to learn |
| Raw Canvas API | No scene graph, manual hit-testing, no animation timeline |
| Low-code / AI UI generators | Output is React/HTML code — hard to embed in WebView or validate |
| Automotive HMI tools | Expensive, closed, or not web-native |

**LightDraw** replaces that stack with **one zero-dependency engine**:

- **Retained-mode scene graph** — add/move/animate nodes; renderer draws efficiently
- **Three renderers** — pick Canvas (performance), SVG (vectors), or HTML (accessibility + legacy WebView)
- **JSON scenes** — validate, load, export; ideal for **AI agents** and config-driven UIs
- **Domain modules** — dashboard widgets, automotive cluster, diagrams, UI components — same API
- **ES5 legacy build** — ship to Chromium 49+ infotainment without a transpiler at runtime

---

## What you get (benefits)

| Benefit | What it means for you |
|---------|------------------------|
| **Zero runtime deps** | No `npm install react chart.js d3`. Smaller attack surface, simpler audits. |
| **Pay for what you load** | `lightdraw/core` ~39 KB gzip; add `dashboard`, `automotive`, or `diagram` plugins only if needed. |
| **Ship faster** | `loadJSON(scene)` for whole dashboards; `app.setUiTheme({ preset: 'dark' })` — no custom CSS required. |
| **AI-ready** | Schema docs + `validateSceneJSON` / `parseAndValidateSceneJSON` with path + expected-value hints — LLM output becomes a live UI in one call. |
| **Embed anywhere** | CDN script tag, npm ESM, or ES5 UMD in Android WebView / Qt WebEngine. |
| **Export & audit** | PNG, SVG, PDF, JSON, offline HTML from the same scene. |
| **Production tested** | 1 600+ tests, size gates, benchmark regression, visual smoke on demos. |

---

## When to use LightDraw (and when not to)

| ✅ Use LightDraw when… | ❌ Consider something else when… |
|------------------------|----------------------------------|
| Embedded dashboard or HMI in WebView | You need a full SPA framework (routing, SSR) — use React/Vue *with* LightDraw in a panel, or alone |
| AI/low-code generates **JSON** UIs | You only need static marketing pages |
| Automotive cluster, gauges, CAN-style visuals | 3D / WebGL games (use Three.js / Babylon) |
| Flowcharts, network topology, org charts | Heavy document editing (Google Docs–class) |
| Canvas performance + interaction (drag, zoom) | You already have D3-only data-viz and don't need widgets/HMI |
| Legacy ES5 targets without bundlers | You need native mobile UI (use Swift/Kotlin) |

---

## Use cases

### 1. IoT / ops dashboard (JSON or JS)

**Problem:** Show live sensor data without pulling in React + three chart libraries.

```javascript
app.loadJSON({
  type: 'group',
  children: [
    { type: 'thermometer', props: { value: 72, x: 24, y: 24 } },
    { type: 'lineChart', props: { data: [18, 22, 31, 28, 35], width: 400, height: 160, x: 24, y: 120 } },
    { type: 'gauge', props: { value: 68, size: 110, x: 480, y: 40 } },
    { type: 'statusBar', props: { segments: ['Connected', 'MQTT', '1.2k msg/s'], x: 24, y: 300 } },
  ],
});
// Update: find widget → set value → app.requestRender()
```

**Where:** Factory floor tablets, NOC wall displays, edge gateway local UI.

---

### 2. Automotive digital cockpit (JS + CAN feed)

**Problem:** Instrument cluster must run in old WebView, update at 30–60 FPS from vehicle data.

```javascript
const app = LightDraw.createApp('#cluster', { width: 800, height: 480, renderer: 'canvas' });
app.loadJSON({
  type: 'instrumentCluster',
  props: { theme: 'classic', width: 800, height: 480, speed: 0, rpm: 800, fuel: 100 },
});
const cluster = app.stage.children[0];

// Each frame from CAN / simulator:
LightDraw.applyDriveState(cluster, { speed: 95, rpm: 3200, fuel: 68 });
app.requestRender();
```

**Where:** Infotainment, EV cluster prototypes, bench HMI, driving simulators.  
**Demo:** [demo-automotive.html](https://github.com/rakeshrajena/lightDraw/blob/main/examples/demo-automotive.html)

---

### 3. AI-generated admin panel (JSON)

**Problem:** Agent outputs UI; you need validation before render.

```javascript
const scene = await fetch('/api/agent/scene.json').then((r) => r.json());
const { valid, errors } = LightDraw.validateSceneJSON(scene);
if (!valid) return showErrors(errors);

app.clear();
app.loadJSON(scene);
app.setUiTheme({ preset: 'dark' });
```

**Where:** Internal tools, copilot builders, config-driven SCADA screens.  
**Schemas:** [ui-components](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ui-components-schema.md) · [dashboard](https://github.com/rakeshrajena/lightDraw/blob/main/docs/dashboard-widgets-schema.md)

---

### 4. Interactive diagrams (JSON + editor)

**Problem:** Draw topology and org charts with routed connectors — then let users rearrange them.

```javascript
const net = LightDraw.Diagram.network(app, {
  nodes: [
    { id: 'gw', label: 'Gateway', type: 'router', x: 400, y: 40 },
    { id: 'api', label: 'API', type: 'server', x: 200, y: 160 },
    { id: 'db', label: 'Database', type: 'sql_database', x: 400, y: 160 },
  ],
  edges: [
    { from: 'gw', to: 'api' },
    { from: 'gw', to: 'db' },
  ],
});
app.add(net);
LightDraw.Diagram.fitToBounds(net, 800, 480, 24);
LightDraw.Diagram.installEditor(app, net, { mode: 'arrange', allowResize: true });
```

**Also included**

| Feature | Behavior |
|---------|----------|
| Wire flow | Marching dashes + packets; status tint; `paths` / play·pause; **CAN bus** hops; see [diagram-flow.md](./docs/diagram-flow.md) |
| Smart routers | 90° orthogonal / obstacle-aware; free-port fan-out; live re-route on drag |
| Wire bends | Double-click a wire → drag bend handles |
| 8-handle resize | Edges + corners, grow/shrink |
| Rotate | Handle above selection; Shift = free angle |
| Org collapse | `−N` / `+N` on cards (N = total people under that node) |
| Branch colors | Unique colors for any number of top-level teams |
| JSON dock | Demo shows full `{ type, props }` via `Diagram.toJSON` |

**Where:** Docs, runbooks, incident boards, LLM-generated architecture / org views.  
**Demo:** [demo-diagram.html](https://github.com/rakeshrajena/lightDraw/blob/main/examples/demo-diagram.html) · **Schema:** [diagram-module-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/diagram-module-schema.md) · **Flow:** [diagram-flow.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/diagram-flow.md)

---

### 5. Embedded control panel (CDN, no build step)

**Problem:** Device firmware UI — single HTML file, no npm on device.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.css">
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.js"></script>
<script>
  const app = LightDraw.createApp('#app', { width: 480, height: 320, renderer: 'html' });
  app.loadJSON({
    type: 'group',
    children: [
      { type: 'toggle', props: { label: 'Pump A', value: true, x: 20, y: 20 } },
      { type: 'slider', props: { value: 60, width: 200, x: 20, y: 70 } },
      { type: 'button', props: { label: 'Emergency stop', variant: 'danger', x: 20, y: 130 } },
    ],
  });
</script>
```

**Where:** Raspberry Pi kiosk, industrial panel PC, offline-first HMIs.

---

## Install

```bash
npm install lightdraw
```

```html
<!-- CDN: full bundle + CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.css">
<script src="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.js"></script>
```

```javascript
import LightDraw from 'lightdraw';
const app = LightDraw.createApp('#app', { renderer: 'html' });
```

| Import path | Use case |
|-------------|----------|
| `lightdraw` | Everything in one bundle |
| `lightdraw/core` | Shapes + canvas only (~39 KB gzip) |
| `lightdraw/dashboard` | Charts & gauges |
| `lightdraw/automotive` | Cluster & vehicle widgets |
| `lightdraw/diagram` | Flowchart, network, org chart, interactive editor |
| `lightdraw/legacy` | ES5 UMD for WebView |

TypeScript types included. See [getting started](https://github.com/rakeshrajena/lightDraw/blob/main/docs/getting-started.md).

---

## Three ways to build a UI

| Method | Best for | Example |
|--------|----------|---------|
| **JavaScript API** | Custom logic, animation, events | `app.circle({...}).animate({...})` |
| **JSON `loadJSON`** | AI, configs, CMS, reproducible scenes | `{ type: 'gauge', props: { value: 72 } }` |
| **HTML host page** | CDN / embedded — *not* custom tags | `<div id="app">` + script above |

LightDraw does **not** use `<lightdraw-button>` web components. HTML is the shell; **JS or JSON** builds the scene.

---

## Benchmarks

Measured on Node + canvas renderer (`npm run benchmark`). Reproduce locally:

```bash
npm run build && npm run benchmark && npm run benchmark:compare
```

### Render & interaction (canvas, avg per frame)

| Nodes | Create + add | Render | Hit test | Animate 1 node |
|------:|-------------:|-------:|---------:|---------------:|
| 500 | ~53 ms | **~0.29 ms** | ~0.03 ms | ~0.27 ms |
| 1 000 | ~1.5 s | **~0.46 ms** | ~0.01 ms | ~0.05 ms |
| 5 000 | ~39 s | **~1.16 ms** | ~0.01 ms | ~0.07 ms |

At 1 000 nodes, **render stays under 0.5 ms** — headroom for 60 FPS on mid-range hardware. Spatial indexing kicks in at ≥100 nodes.

### Bundle size (gzip, v1.1.0 measured)

| Package | Size | Typical use |
|---------|-----:|-------------|
| `lightdraw/core` | ~43 KB | Games, custom canvas apps |
| `lightdraw` (full) | ~167 KB | All modules, CDN one-liner |
| `lightdraw/dashboard` | ~43 KB | Charts + gauges + dataTable |
| `lightdraw/automotive` | ~31 KB | Cluster + 160+ widgets |
| `lightdraw/diagram` | ~71 KB | Diagram types + editor (resize, bends, rotate, flow + status, CAN) |
| `lightdraw/ui` | ~16 KB | Form controls (pair with HTML renderer) |

---

## How LightDraw compares

Honest positioning — pick the right tool for the job.

| | **LightDraw** | **React + Chart.js** | **D3.js** | **GoJS / commercial diagram** |
|--|---------------|----------------------|-----------|-------------------------------|
| **Runtime deps** | 0 | React + chart lib | D3 | License + lib |
| **Full HMI in one pkg** | ✅ dashboard + auto + UI | ❌ assemble yourself | ❌ data-viz focus | Partial |
| **JSON → live UI** | ✅ `loadJSON` + schemas | ❌ usually codegen | ❌ | Some import/export |
| **Canvas 60 FPS scene** | ✅ retained graph | Via chart canvas | Manual | Varies |
| **ES5 / old WebView** | ✅ `*.legacy.js` | ❌ needs build | ❌ | Varies |
| **AI agent friendly** | ✅ schema docs | ❌ outputs JSX | ❌ | ❌ |
| **Open source (MIT)** | ✅ | ✅ | ✅ | ❌ often paid |
| **Best fit** | Embedded HMI, AI JSON UI, interactive diagrams | React shops, simple charts | Custom data viz | Heavy enterprise diagram product |

**LightDraw is not a replacement for React** — it is a **graphics engine** you embed inside any page or framework.

---

## What's new in v1.1.0

Full notes: [docs/v1.1-release-notes.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/v1.1-release-notes.md) · [CHANGELOG](./CHANGELOG.md)

- Interactive diagram editor: drag, **8-handle resize**, **wire bend points**, rotate, wire flow (+ CAN bus hops, status tint, smart 90° ports)
- Professional **network device icons** and **org chart** minimize with descendant counts
- **Unique branch colors** for any number of org teams
- Live playground JSON shows real `{ type, props }` diagram state
- Theme lab + Day/Night website hub with validated Scene / API docks

**Since v1.1 (unreleased):** multi-series charts with auto colors + grouped bars; dashboard **`dataTable`** (search + stripes); automotive P0 telltales + **Individual dash** demo. See [CHANGELOG](./CHANGELOG.md).

**Try it live:** [Playground](https://rakeshrajena.github.io/lightDraw/) · [Dashboard](https://rakeshrajena.github.io/lightDraw/#dashboard) · [Automotive](https://rakeshrajena.github.io/lightDraw/#automotive) · [Help](https://rakeshrajena.github.io/lightDraw/help.html)

```bash
npm install lightdraw@1.1.0
```

---

## Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/dashboard.png" alt="Dashboard widgets" width="100%" />
</p>
<p align="center"><em>Dashboard — multi-series charts, gauges, dataTable</em></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/automotive.png" alt="Automotive cluster" width="100%" />
</p>
<p align="center"><em>Automotive — cluster, Individual dash, MIL / beams / ADAS lamps</em></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/diagram.png" alt="Diagrams" width="100%" />
</p>
<p align="center"><em>Diagrams — flowchart, network icons, org chart with branch colors & collapse</em></p>

<p align="center">
  <img src="https://raw.githubusercontent.com/rakeshrajena/lightDraw/main/docs/images/ui-components.png" alt="UI components" width="100%" />
</p>
<p align="center"><em>UI — 17 components, theme presets, HTML renderer</em></p>

---

## AI & LLM integration

```
User prompt → LLM + schema docs → scene JSON → parseAndValidateSceneJSON → loadJSON → live UI
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.css">
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.js"></script>
<script>
  const app = LightDraw.createApp('#app', { width: 960, height: 540, renderer: 'html' });
  const scene = { type: 'group', children: [
    { type: 'card', props: { title: 'Server health', x: 16, y: 16, width: 420, height: 200 } },
    { type: 'lineChart', props: { data: [22,35,28,48,41,55], x: 32, y: 56, width: 380, height: 140 } },
    { type: 'button', props: { label: 'Acknowledge', variant: 'primary', x: 480, y: 200 } },
  ]};
  const check = LightDraw.validateSceneJSON(scene);
  if (check.valid) app.loadJSON(scene);
  else console.error(check.errors.join('\n'));
  // Invalid enums report expected values, e.g. variant "primry" → did you mean "primary"?
</script>
```

| Schema | Link |
|--------|------|
| UI (17 components) | [ui-components-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ui-components-schema.md) |
| Dashboard | [dashboard-widgets-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/dashboard-widgets-schema.md) |
| Automotive | [automotive-widgets-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/automotive-widgets-schema.md) |
| Diagram | [diagram-module-schema.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/diagram-module-schema.md) · [diagram-flow.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/diagram-flow.md) |

Full guide: [ai-integration-guide.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ai-integration-guide.md)

---

## Live demos & docs

| | |
|--|--|
| **Playground** | [rakeshrajena.github.io/lightDraw](https://rakeshrajena.github.io/lightDraw/) |
| **Help center** | [help.html](https://rakeshrajena.github.io/lightDraw/help.html) |
| **npm** | [npmjs.com/package/lightdraw](https://www.npmjs.com/package/lightdraw) |
| **All guides & schemas** | [docs/README.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/README.md) |
| Local | `npm run build && npm run prepare:website && npm run dev:website` → http://localhost:5173 |

Quick reads: [Getting started](https://github.com/rakeshrajena/lightDraw/blob/main/docs/getting-started.md) · [UI themes](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ui-theme-guide.md) · [AI + JSON](https://github.com/rakeshrajena/lightDraw/blob/main/docs/ai-integration-guide.md) · [v1.1 notes](https://github.com/rakeshrajena/lightDraw/blob/main/docs/v1.1-release-notes.md)

Demo HTML lives in [`examples/`](./examples/) (listed in the docs index). Night chrome + live JSON/API dock by default; Pages updates on `main`.

---

## Browser support

Chromium 49+, Chrome, Firefox, Edge, Safari, Android WebView, Qt WebEngine.

Legacy ES5 / WebView: [legacy-browser-guide.md](https://github.com/rakeshrajena/lightDraw/blob/main/docs/legacy-browser-guide.md).

---

## Development

```bash
git clone https://github.com/rakeshrajena/lightDraw.git
cd lightDraw && npm install && npm run build
npm test                  # 1 600+ unit tests
npm run ci:local          # full gate: lint, size, coverage, benchmarks
npm run test:ci:visual    # Playwright golden screenshots
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## License

MIT — [LICENSE](https://github.com/rakeshrajena/lightDraw/blob/main/LICENSE)

---

## Author

**Rakesh Ranjan Jena** · [GitHub](https://github.com/rakeshrajena/lightDraw) · [Website](https://rakeshranjanjena.com)

Made with ❤️ for embedded web, dashboards, and AI-built UIs.
