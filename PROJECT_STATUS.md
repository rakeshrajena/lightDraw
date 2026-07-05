# LightDraw.js — Project & Feature Status

**Version:** 0.9.0  
**Last updated:** July 5, 2026  
**License:** MIT  
**Status:** Phase 12 in progress — production hardening, GitHub repo, release workflow; npm publish after manual verification.

---

## Overview

LightDraw.js is an open-source, zero-dependency 2D graphics and UI engine for the web. It targets dashboards, diagrams, automotive HMIs, animations, and AI-driven scene generation via JSON.

The project was bootstrapped from an empty repository and shipped as **v0.1.0** with a modular architecture, build pipeline, tests, and a working demo.

---

## What's New in v0.1.0

Initial release. Major additions:

| Area | Update |
|------|--------|
| **Core engine** | Retained-mode scene graph, transforms, hit testing, dirty rendering |
| **Shapes** | 14 primitives (Rect, Circle, Ellipse, Line, Arc, Polygon, Polyline, Path, Star, Text, Image, Sprite, Group, Layer) |
| **Renderers** | Canvas (full), SVG (full), HTML/CSS (fallback) with `renderer: 'auto'` |
| **Animation** | Property tweens, 20+ easing functions, timelines, parallel animations |
| **Events** | Click, drag, hover, wheel; pointer/touch/mouse delegation |
| **Camera** | Pan, zoom, rotate, follow target, screen ↔ world coordinates |
| **Layout** | Grid, stack, flex, flow, tree, circular, align, distribute |
| **JSON I/O** | `app.loadJSON()` / `app.exportJSON()` for AI-friendly scenes |
| **Plugins** | `LightDraw.use(plugin)` with component/dashboard/automotive registration |
| **Build** | ESM, UMD, legacy ES5, TypeScript declarations, CSS |
| **Tooling** | Vitest, ESLint, Prettier, GitHub Actions CI, benchmark script |
| **Docs & demo** | README, getting started, `examples/demo.html` |

---

## Feature Status Matrix

Legend: ✅ Done · 🟡 Partial · ❌ Not started

### Core Graphics Engine

| Feature | Status | Notes |
|---------|--------|-------|
| Scene graph (Group, Layer) | ✅ | Unlimited nesting |
| Rectangle, Circle, Ellipse | ✅ | Full transform support |
| Line, Arc, Polygon, Polyline | ✅ | Hit testing included |
| Path, Star, Rounded Rect | ✅ | Path hit test via ray-cast parser |
| Text | ✅ | Font size/family/weight |
| Image | ✅ | Async load via `load()` |
| Sprite | ✅ | Auto-play in render loop when `playing: true` |
| Position, rotation, scale, skew | ✅ | Via `Node` + `Matrix2D` |
| Opacity, visibility, z-index | ✅ | |
| Fill, stroke, dash, shadow | ✅ | Canvas renderer fully supports |
| Gradients | ✅ | Linear/radial on Canvas, SVG defs, HTML CSS |
| Patterns | 🟡 | Canvas pattern fill; SVG/HTML partial |
| Clipping | ✅ | Shape clip on Canvas; SVG clipPath; HTML overflow |
| Masking | 🟡 | `node.mask` hit-test + Canvas clip; SVG/HTML partial |
| Metadata, custom properties | ✅ | Via `metadata` and `attr()` |
| Object pooling | 🟡 | `matrixPool` in hit-test path; broader wiring in Phase 2 |

### Rendering

| Feature | Status | Notes |
|---------|--------|-------|
| Canvas renderer | ✅ | Primary, most complete |
| SVG renderer | ✅ | Incremental DOM sync each frame |
| HTML/CSS renderer | ✅ | Fallback for legacy/embedded browsers |
| Auto renderer detection | ✅ | Canvas → SVG → HTML |
| Dirty-region rendering | ✅ | Partial canvas clear on dirty rects |
| Batch rendering | ✅ | Same-fill rect batching on canvas |
| Spatial index hit testing | ✅ | Grid hash when ≥100 nodes |
| Layer caching | ✅ | `Group.cacheAsBitmap` + offscreen canvas |
| SVG/HTML diff updates | ✅ | Patch DOM attrs, prune orphans |
| Object pooling | 🟡 | `matrixPool` in hit-test path |
| `toDataURL()` (PNG) | ✅ | Via canvas |
| Pixel ratio / HiDPI | ✅ | |

### Animation

| Feature | Status | Notes |
|---------|--------|-------|
| Property animation (x, y, rotation, scale, opacity) | ✅ | |
| Color interpolation | ✅ | fill/stroke/color props |
| Easing (linear, cubic, bounce, elastic, back, etc.) | ✅ | 20+ built-in |
| Delay, repeat, reverse, loop | ✅ | |
| Pause, resume, stop | ✅ | |
| onStart / onUpdate / onComplete | ✅ | |
| Timeline (sequence) | ✅ | move, rotate, scale, fade helpers |
| Parallel animations | ✅ | `parallel()` helper |
| Path animation | ✅ | `motionPath` option (string or Path node) |
| Morphing | ✅ | `morphTo` on Path nodes via `morphPath()` |
| Stroke animation | ✅ | `dashOffset` tween on canvas/SVG |
| Sprite sheet animation | ✅ | `sprite.play({ fps, loop })` via AnimationEngine |
| Stagger helper | ✅ | `timeline.stagger(nodes, props, ms)` |
| App.animate shorthand | ✅ | `app.animate(node, props)` |

### Events

| Feature | Status | Notes |
|---------|--------|-------|
| click, dblclick | ✅ | dblclick tested; bubble propagation |
| pointer / mouse / touch | ✅ | Unified handler |
| drag (draggable nodes) | ✅ | With dragPayload |
| dragover / drop | ✅ | Cross-node drop targets |
| hover (enter/leave) | ✅ | |
| wheel (camera pan) | ✅ | |
| keyboard (Tab, Enter, Space) | ✅ | Focus cycle + activation |
| focus / blur | ✅ | Per-node `focusable` flag |
| Event propagation | ✅ | Bubble + `stopPropagation()` |
| Custom events | ✅ | Via `EventEmitter.on()` |

### Camera

| Feature | Status | Notes |
|---------|--------|-------|
| Pan, zoom, rotate | ✅ | |
| Follow object | ✅ | |
| Viewport | ✅ | |
| Screen ↔ world coordinates | ✅ | |

### Layout Engine

| Feature | Status | Notes |
|---------|--------|-------|
| Grid | ✅ | |
| Stack | ✅ | |
| Flex | 🟡 | Alias of stack |
| Flow | ✅ | Wrap grid |
| Tree | ✅ | Hierarchical |
| Circular | ✅ | |
| Force-directed graph | ✅ | Seeded `forceDirectedLayout` |
| Auto alignment / spacing | ✅ | `align`, `distribute` |
| Smart connectors | ✅ | Orthogonal + smart obstacle avoidance |

### UI Components

| Component | Status |
|-----------|--------|
| Button | ✅ |
| Label | ✅ |
| Card | ✅ |
| Progress Bar | ✅ |
| Slider | 🟡 Visual only; no input handling |
| Checkbox | 🟡 Visual only |
| Toggle | 🟡 Visual only |
| Input | ❌ |
| TextArea | ❌ |
| Radio | ❌ |
| Tooltip | ❌ |
| Menu / Dropdown | ❌ |
| Dialog / Modal | ❌ |
| Tabs / Accordion | ❌ |
| Table / Tree View | ❌ |
| Toolbar | ❌ |
| Notification / Toast | ❌ |
| Status Bar | ❌ |

### Dashboard Widgets

| Widget | Status |
|--------|--------|
| Gauge | ✅ |
| Speedometer | ✅ |
| Line Chart | ✅ Basic |
| Bar Chart | ✅ Basic |
| Pie Chart | ✅ Basic |
| Battery Indicator | ✅ |
| Clock | ✅ |
| Area Chart | ❌ |
| Thermometer | ❌ |
| Compass | ❌ |
| Calendar / Timeline widget | ❌ |
| Signal Strength | ❌ |
| Knob / Meter | ❌ |

### Automotive Module

| Widget | Status |
|--------|--------|
| Instrument Cluster | ✅ Composite |
| Speedometer | ✅ |
| Tachometer | ✅ |
| Fuel Gauge | ✅ |
| Gear Indicator | ✅ |
| Turn Indicators | ✅ |
| Warning Lamp (ABS, etc.) | ✅ |
| ADAS Status | ✅ |
| Engine Temperature | ✅ | Color zones + needle |
| Battery Voltage | ✅ | Numeric + icon |
| Tire Pressure (TPMS) | ✅ | 4-wheel, low-pressure red |
| Parking Brake / Headlights / Cruise | ✅ | Indicator lamps + cruise speed |
| CAN Signal Viewer | ✅ | Table of signals + live refresh |
| JSON drive simulation | ✅ | `applyDriveState`, `sampleDriveFrames` |
| Cluster themes | ✅ | classic / sport / digital |

### Diagram Module

| Feature | Status | Notes |
|---------|--------|-------|
| Flowcharts | ✅ | Node/edge data → shapes + smart routing |
| Org charts | ✅ | Tree layout + collapse toggle |
| State machines | ✅ | Initial/final states, transitions |
| UML class diagrams | ✅ | Compartments + inheritance arrows |
| Mind maps | ✅ | Radial layout |
| Network topology | ✅ | Typed nodes + labeled edges |
| Electrical schematic | ✅ | Resistor, capacitor, ground, battery, switch, LED |
| CAN network diagram | ✅ | Bus line + ECU nodes |
| Process pipeline | ✅ | Horizontal stages with status colors |
| Force-directed layout | ✅ | Seeded physics simulation |
| Smart connector routing | ✅ | `straight`, `orthogonal`, `smart` (avoids obstacles) |
| Diagram JSON schema | ✅ | `loadJSON` + `diagramToJSON` round-trip |

### AI Integration

| Feature | Status | Notes |
|---------|--------|-------|
| JSON → scene (`loadJSON`) | ✅ | Shapes, UI, dashboard, automotive |
| Scene → JSON (`exportJSON`) | ✅ | |
| Custom type registration | ✅ | `registerJSONType`, plugins |

### Export

| Format | Status | Notes |
|--------|--------|-------|
| JSON | ✅ | Schema validation via `validate: true` |
| SVG | ✅ | Standalone XML document |
| PNG | ✅ | Hi-DPI via `pixelRatio`, region crop |
| JPEG | ✅ | Quality parameter |
| HTML | ✅ | Self-contained page with embedded scene |
| PDF | ✅ | Zero-dep JPEG-embedded pages |
| Unified API | ✅ | `app.export({ format, options })` |
| Region crop | ✅ | Crop to node bounds |

### Accessibility

| Feature | Status | Notes |
|---------|--------|-------|
| ARIA on HTML renderer | 🟡 | `role="img"`, `aria-label` |
| Keyboard navigation | ❌ | |
| Focus management | ❌ | |
| High-contrast mode | 🟡 | CSS media query in HTML styles |
| Screen-reader HTML renderer | 🟡 | Minimal |

### Build & Distribution

| Output | Status | Size (approx.) |
|--------|--------|----------------|
| `lightdraw.core.min.js` | ✅ | Core-only (canvas, shapes, animation) |
| `lightdraw.svg.min.js` | ✅ | SVG renderer plugin |
| `lightdraw.html.min.js` | ✅ | HTML renderer plugin |
| `lightdraw.ui.min.js` | ✅ | UI components plugin |
| `lightdraw.dashboard.min.js` | ✅ | Dashboard widgets plugin |
| `lightdraw.automotive.min.js` | ✅ | Automotive widgets plugin |
| `lightdraw.diagram.min.js` | ✅ | Diagram module plugin |
| `lightdraw.esm.js` | ✅ | Full ES Module |
| `lightdraw.js` (UMD dev) | ✅ | Full bundle |
| `lightdraw.min.js` (CDN) | ✅ | Full bundle minified |
| `*.legacy.js` | ✅ | ES5 variant per bundle |
| `index.d.ts` + subpath `.d.ts` | ✅ | Generated via `tsc` |
| `lightdraw.min.css` | ✅ | HTML renderer styles |
| npm package exports map | ✅ | `lightdraw/core`, `lightdraw/ui`, etc. |
| CDN publish | ❌ | Not published to jsDelivr/npm yet |

**Bundle size gate:** CI enforces gzip targets via `npm run size-gate` (core ≤ 8 KB, full ≤ 25 KB).

### Testing & Quality

| Item | Status | Notes |
|------|--------|-------|
| Unit tests | ✅ | 270+ tests passing |
| Integration tests | 🟡 | JSON, animation, layout, a11y, diagram, export covered |
| Coverage target (95%) | 🟡 | **≥94%** (Phase 11 gate: 94% ✅) |
| Performance benchmarks | ✅ | `benchmark.mjs` + `baseline.json` + CI compare |
| Memory leak tests | ✅ | `test:memory` — 6 scenarios |
| Perf regression tests | ✅ | `test:perf` — 9 tests |
| Renderer smoke tests | ✅ | canvas, svg, html suites |
| ESLint / Prettier | ✅ | |
| TypeScript strict mode | ✅ | |
| GitHub Actions CI | ✅ | build, lint, test, benchmark |
| JSDoc | 🟡 | Partial on public APIs |

### Documentation

| Document | Status |
|----------|--------|
| README | ✅ |
| Getting Started | ✅ `docs/getting-started.md` |
| API Reference | ✅ | TypeDoc → `docs/api/` via `npm run docs:api` |
| Animation / Plugin / Performance guides | ✅ | `docs/*-guide.md` |
| Legacy browser guide | ✅ | `docs/legacy-browser-guide.md` |
| Playground / demo site | ✅ | `website/` Vite playground + `npm run build:website` |
| CONTRIBUTING | ✅ |
| CHANGELOG | ✅ |

---

## Build & Test Commands

```bash
npm install          # Install dependencies
npm run build        # ESM + UMD + legacy + .d.ts + CSS
npm test             # Run 14 unit tests
npm run test:coverage
npm run benchmark    # 5000-object stress test
npm run lint
npm run typecheck
```

---

## Architecture Summary

```
src/
├── App.ts              # Main application entry
├── Node.ts             # Base scene graph node
├── core/               # EventEmitter
├── shapes/             # Primitives + Group/Layer
├── renderers/          # Canvas, SVG, HTML
├── animation/          # Engine, easing, timeline
├── events/             # EventManager
├── camera/             # Camera
├── layout/             # Layout algorithms
├── components/         # UI widget registry
├── dashboard/          # Chart/gauge registry
├── automotive/         # HMI widget registry
├── diagram/            # Flowchart/org chart
├── io/                 # JSON import/export
├── plugins/            # Plugin installer
└── utils/              # Matrix2D, pooling, color lerp
```

---

## Pending Work (Roadmap)

> **Full phased plan with test, performance, and memory gates:** see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

### High priority

1. **Interactive UI** — Wire slider, checkbox, toggle, input to events and state
2. **Test coverage** — Expand to 95%; add renderer and animation integration tests
3. **SVG/HTML parity** — Gradients, patterns, shadows on all renderers
4. **Masking & advanced clipping** — Per-node mask support

### Medium priority

6. **Remaining UI components** — Input, modal, tabs, table, menu, toast
7. **Dashboard widgets** — Area chart, thermometer, compass, knob
8. **Automotive widgets** — TPMS, engine temp, CAN viewer
9. **Diagram layouts** — Force-directed, state machine, network topology
10. **Path & stroke animation** — SVG path morphing, dash offset animation
11. **Sprite auto-animation** — Hook `Sprite.updateFrame` into render loop
12. **PDF export** — Via canvas snapshot or SVG pipeline
13. **Accessibility** — Full keyboard nav, focus ring, live regions

### Lower priority / polish

14. **Demo website** — ✅ `website/` playground (`npm run dev:website`)
15. **API reference docs** — ✅ TypeDoc (`npm run docs:api`)
16. **Visual regression tests** — ✅ Playwright (`npm run test:visual`)
17. **Cross-browser CI** — BrowserStack or similar
18. **npm + CDN publish** — jsDelivr/unpkg registration
19. **Release workflow** — Automated versioning, GitHub Releases
20. **Performance** — Dirty-region rendering, batch draw calls, hit-test spatial index

---

## Known Limitations (v0.1.0)

- Full bundle exceeds the original 20 KB core size goal (all modules ship together)
- HTML renderer is layout fallback, not a full UI toolkit
- Dashboard charts are simplified (no axes, legends, or interaction)
- Hit testing on `Path` shapes always returns false
- `Flex` layout is currently an alias for stack layout
- Legacy ES5 build is larger (80 KB) due to TypeScript downlevel output
- Benchmark runs with HTML renderer under jsdom (no native canvas)

---

## How to Track Updates

- **Implementation plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — phased roadmap with test/perf/memory gates
- **Release notes:** [CHANGELOG.md](./CHANGELOG.md)
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **This file:** Update when features move from ❌ → 🟡 → ✅

When closing a pending item, update the matrix above and add an entry to `CHANGELOG.md` under `[Unreleased]` or the next version section.
