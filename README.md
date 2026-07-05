# LightDraw.js

Ultra-lightweight, production-ready 2D graphics and UI engine for the web.

**Repository:** [github.com/rakeshrajena/lightDraw](https://github.com/rakeshrajena/lightDraw)

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
npm run test:visual     # Playwright screenshot regression
```

## Development

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the phased roadmap (quality, tests, performance, memory gates per phase).
See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current feature status.

```bash
npm install
npm run build
npm test
npm run benchmark
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
