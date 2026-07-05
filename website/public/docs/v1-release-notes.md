# LightDraw.js v1.0.0 Release Notes

**Release date:** TBD (after manual verification)  
**npm:** `lightdraw@1.0.0`  
**GitHub:** [rakeshrajena/lightDraw](https://github.com/rakeshrajena/lightDraw)

---

## Summary

v1.0.0 is the first **production** release of LightDraw.js — a zero-dependency 2D graphics and UI engine for dashboards, automotive HMIs, diagrams, and AI-driven JSON scenes.

## What's included

| Module | Highlights |
|--------|------------|
| **Core** | Scene graph, Canvas/SVG/HTML renderers, animation, events, camera, layout |
| **UI** | 17 interactive components (button, slider, dialog, tabs, …) |
| **Dashboard** | Charts, gauges, speedometer, thermometer, compass, live data |
| **Automotive** | Instrument cluster, TPMS, CAN viewer, drive simulation |
| **Diagram** | Flowchart, state machine, mind map, network, force layout, smart routing |
| **Export** | PNG, JPEG, SVG, PDF, HTML, JSON via `app.export()` |
| **Docs** | Guides, TypeDoc API, Vite playground, Playwright visual regression |

## Migration from v0.1.x

### CDN / script tag

```html
<!-- Before (v0.1) -->
<script src="path/to/lightdraw.min.js"></script>

<!-- After (v1.0) -->
<script src="https://cdn.jsdelivr.net/npm/lightdraw@1/dist/lightdraw.min.js"></script>
```

### npm

```bash
npm install lightdraw@1
```

```javascript
// Full bundle (unchanged API surface)
import LightDraw from 'lightdraw';
const app = LightDraw.createApp('#app');
```

### Modular imports (recommended, v0.4+)

```javascript
import LightDraw from 'lightdraw/core';
import htmlPlugin from 'lightdraw/html';
LightDraw.use(htmlPlugin);
```

### JSON scenes

- `app.loadJSON()` / `app.exportJSON()` unchanged
- Dashboard widgets use `metadata.widgetType` for round-trip
- Diagram nodes use `metadata.diagramType`
- Automotive widgets use `metadata.autoType`

### Breaking changes from early v0.1

None intentional since v0.2.0 modular architecture. If you pinned `0.1.0`:

1. Rebuild with `lightdraw@1` full bundle or modular subpaths
2. Replace any direct `dist/` paths with npm/CDN URLs
3. Enable plugins explicitly when using `lightdraw/core` only

## Bundle sizes (gzip, CI gates)

| Bundle | Size gate |
|--------|-----------|
| Core | ≤ 24 KB |
| Full | ≤ 41 KB |
| Per-plugin | ≤ 10 KB each |

Original aspirational targets (8 KB core / 25 KB full) are documented in `IMPLEMENTATION_PLAN.md` as deferred goals.

## Browser support

- Modern: Chrome, Firefox, Safari, Edge (Chromium)
- Legacy: `*.legacy.js` ES5 builds for WebView / embedded targets

## Quality gates (v1.0.0)

- Line coverage ≥ 95%
- Memory tests (1000+ App cycles)
- Visual regression (Playwright)
- Cross-browser smoke (Chromium, Firefox, WebKit)
- Size gate on all bundles

## Links

- [Documentation](./README.md)
- [Getting Started](./getting-started.md)
- [Versioning policy](./VERSIONING.md)
- [Release workflow](./RELEASE.md)

---

**Made with ❤️ by [Rakesh Ranjan Jena](https://rakeshranjanjena.com)**
