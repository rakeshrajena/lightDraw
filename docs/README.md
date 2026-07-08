# LightDraw.js Documentation

<p align="center">
  <a href="https://www.npmjs.com/package/lightdraw"><img src="https://img.shields.io/npm/v/lightdraw.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/lightdraw"><img src="https://img.shields.io/npm/dm/lightdraw.svg?label=downloads%2Fmonth" alt="npm downloads per month" /></a>
  <a href="https://www.npmjs.com/package/lightdraw"><img src="https://img.shields.io/npm/dt/lightdraw.svg?label=total%20downloads" alt="npm total downloads" /></a>
  <a href="https://github.com/rakeshrajena/lightDraw"><img src="https://img.shields.io/github/v/release/rakeshrajena/lightDraw?label=GitHub" alt="GitHub release" /></a>
</p>

**Version:** 1.0.0 · **Install:** `npm install lightdraw`

## Guides

| Guide | Description |
|-------|-------------|
| [Getting Started](./getting-started.md) | Install, basic usage, JSON |
| [Animation](./animation-guide.md) | Easing, timelines, path motion, stagger |
| [Plugins](./plugin-guide.md) | Custom components, renderers, registration |
| [Performance](./performance-guide.md) | Benchmarks, spatial index, dirty regions |
| [Legacy Browsers](./legacy-browser-guide.md) | ES5 build, polyfills, WebView |
| [UI Theme](./ui-theme-guide.md) | Presets, tokens, high contrast — no mandatory CSS |
| [Responsive Layout](./responsive-guide.md) | Breakpoints, `fullWidth`, `autoResize` |
| [Legacy UI & CSS](./legacy-ui-guide.md) | ES5 + `lightdraw.min.css` compatibility |
| [Automotive Examples](./automotive-examples.md) | Cluster, CAN viewer, drive simulation |
| [AI Integration](./ai-integration-guide.md) | JSON schema, prompts, round-trip |
| [Export Pipeline](./export-pipeline.md) | PNG, SVG, PDF, unified `app.export()` |
| [Versioning](./VERSIONING.md) | Semantic versioning policy |
| [Release workflow](./RELEASE.md) | GitHub Release + npm publish steps |
| [v1.0.0 notes](./v1-release-notes.md) | Migration from v0.1 |

## Module schemas

| Schema | Module |
|--------|--------|
| [UI Components](./ui-components-schema.md) | Button, slider, dialog, … |
| [Dashboard](./dashboard-widgets-schema.md) | Charts, gauges, thermometer |
| [Automotive](./automotive-widgets-schema.md) | Cluster, TPMS, CAN |
| [Diagram](./diagram-module-schema.md) | Flowchart, state machine, network |

## API reference

Generate locally:

```bash
npm run docs:api
```

Output: `docs/api/` (TypeDoc HTML).

## Playground

```bash
npm run build          # build library first
npm run dev:website    # http://localhost:5173
npm run build:website  # static site → website/dist/
```

## Examples

Interactive HTML demos live in [`../examples/`](../examples/):

- `demo.html` — core shapes & animation
- `demo-animation.html` — motion path, morph, stagger
- `demo-ui.html` — 17 UI components
- `demo-ui-catalog.html` — Storybook-style variant gallery
- `demo-dashboard.html` — live charts & gauges
- `demo-automotive.html` — instrument cluster
- `demo-diagram.html` — flowchart, state machine, network
- `demo-export.html` — download all export formats
- `demo-a11y.html` — keyboard & ARIA
