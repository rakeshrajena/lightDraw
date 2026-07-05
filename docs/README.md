# LightDraw.js Documentation

**Version:** 0.9.0

## Guides

| Guide | Description |
|-------|-------------|
| [Getting Started](./getting-started.md) | Install, basic usage, JSON |
| [Animation](./animation-guide.md) | Easing, timelines, path motion, stagger |
| [Plugins](./plugin-guide.md) | Custom components, renderers, registration |
| [Performance](./performance-guide.md) | Benchmarks, spatial index, dirty regions |
| [Legacy Browsers](./legacy-browser-guide.md) | ES5 build, polyfills, WebView |
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
- `demo-dashboard.html` — live charts & gauges
- `demo-automotive.html` — instrument cluster
- `demo-diagram.html` — flowchart, state machine, network
- `demo-export.html` — download all export formats
- `demo-a11y.html` — keyboard & ARIA
