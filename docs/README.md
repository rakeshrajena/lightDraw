# LightDraw.js Documentation

**Version:** 1.1.0 · `npm install lightdraw@1.1.0`  
**Live:** [Playground](https://rakeshrajena.github.io/lightDraw/) · [Help](https://rakeshrajena.github.io/lightDraw/help.html) · [API](https://rakeshrajena.github.io/lightDraw/docs/api/index.html)

This folder is the **single source of truth** for guides and schemas. The website copies them into `website/public/docs/` via `npm run prepare:website`.

---

## Start here

| Doc | Audience |
|-----|----------|
| [Getting started](./getting-started.md) | Install, first scene, JSON, playground |
| [JSON format](./json-format.md) | Shared `{ type, props }` rules, export round-trip |
| [Architecture](./architecture.md) | Entry points, `src/` layout, plugins |
| [API overview](./api-overview.md) | Key functions (TypeDoc for full detail) |
| [Root README](../README.md) | Product overview, use cases, CDN / npm |
| [v1.1 release notes](./v1.1-release-notes.md) | What changed in the current minor |

---

## User guides

| Guide | Topic |
|-------|--------|
| [Animation](./animation-guide.md) | Easing, timelines, path motion, stagger |
| [Diagram wire flow](./diagram-flow.md) | Dashes, packets, multi-path runs, play/pause |
| [Plugins](./plugin-guide.md) | `LightDraw.use`, custom components / renderers / JSON types |
| [Performance](./performance-guide.md) | Spatial index, dirty regions, benchmarks |
| [UI theme](./ui-theme-guide.md) | Presets, tokens, `applyTheme` — no mandatory CSS |
| [Theme architecture](./theme-architecture.md) | Resolve order, packs, automotive vs UI themes |
| [Responsive layout](./responsive-guide.md) | Breakpoints, `fullWidth`, `autoResize` |
| [Export](./export-pipeline.md) | PNG, SVG, PDF, scene / theme validation |
| [AI + JSON](./ai-integration-guide.md) | Schemas, validation, prompts |
| [Automotive examples](./automotive-examples.md) | Cluster, CAN, drive simulation |
| [Legacy browsers & UI](./legacy-browser-guide.md) | ES5 / WebView, CSS table, a11y |

---

## Module schemas (props / JSON types)

| Schema | Module |
|--------|--------|
| [UI components](./ui-components-schema.md) | Button, slider, dialog, … |
| [Dashboard](./dashboard-widgets-schema.md) | Charts (85), gauges, dataTable |
| [Automotive](./automotive-widgets-schema.md) | Cluster, telltales, Individual dash |
| [Diagram](./diagram-module-schema.md) | Flowchart, network, org chart, editor, [wire flow](./diagram-flow.md) |

---

## Maintainers / contributors

| Doc | Topic |
|-----|--------|
| [Architecture](./architecture.md) | Entry points, `src/` layout, plugins, runtime flow |
| [API overview](./api-overview.md) | Key functions (TypeDoc for full reference) |
| [Contributing](../CONTRIBUTING.md) | Dev setup, PR checklist |
| [Versioning](./VERSIONING.md) | SemVer policy |
| [Release](./RELEASE.md) | GitHub Release + npm publish |
| [Changelog](../CHANGELOG.md) | Full history |
| [v1.0 notes](./v1-release-notes.md) | Migration from 0.x |
| [Diagram catalog layout](./diagram-pipeline-structure.md) | Pipeline / schematic / network glyph split |
| [Repo modularity](./repo-modularity.md) | Completed R1–R7 split history |

---

## Doc inventory (keep / merge / drop)

| Path | Status | Notes |
|------|--------|--------|
| `README.md` (root) | **Keep** | Product entry; trim overlapping guide lists in later phase |
| `CHANGELOG.md` | **Keep** | History |
| `CONTRIBUTING.md` | **Keep** | Contributor entry |
| `docs/getting-started.md` … schemas | **Keep** | User-facing |
| `docs/ui-theme-guide.md` + `theme-architecture.md` | **Keep (dedupe later)** | Overlap on `applyTheme`; architecture stays for resolve-order detail |
| `docs/legacy-browser-guide.md` | **Keep** | Merged former `legacy-ui-guide` (CSS / a11y) |
| `docs/legacy-ui-guide.md` | **Stub** | Redirects to legacy-browser-guide |
| `docs/repo-modularity.md` | **Keep → fold into architecture** | Done roadmap; replace with short `architecture.md` later |
| `docs/v1-release-notes.md` | **Keep** | Linked from tests / migration |
| `docs/api/` | **Generated** | `npm run docs:api` — gitignored |
| `DATA_FEED_PLAN.md`, `*_PLAN.md`, `PROJECT_STATUS.md` | **Drop** | Gitignored internals — do not publish |
| Root `*.pid`, empty `node` / `npm` / `lightdraw@*` | **Drop** | Accidental leftovers |

---

## Local website & API

```bash
npm run build
npm run prepare:website   # bundles + docs + examples → website/public
npm run dev:website       # http://localhost:5173
npm run docs:api          # TypeDoc → docs/api/ (gitignored)
```

| Surface | Role |
|---------|------|
| Playground hub | Demo rail (Theme, UI, Charts, Auto, Diagram, …) |
| Help center (`help.html`) | Short topics + live iframe embeds |
| Doc viewer (`doc.html`) | Renders these Markdown guides |
| TypeDoc API | Function / class reference |

### Examples (`examples/`)

Source of truth for demos. Prepared copy lands in `website/public/examples/`.

| File | Focus |
|------|--------|
| `demo.html` | Core shapes & animation |
| `demo-animation.html` | Motion path, morph, stagger |
| `demo-ui.html` / `demo-ui-catalog.html` | UI components |
| `demo-dashboard.html` / `demo-charts.html` | Charts, gauges, dataTable |
| `demo-automotive.html` | Cluster + Individual dash + catalog |
| `demo-diagram.html` | Interactive diagrams + wire flow (paths, play/pause) |
| `demo-export.html` | Export formats |
| `demo-a11y.html` | Keyboard & ARIA |
| `demo-theme.html` | Theme lab |
| `demo-color-stops.html` | Conditional color stops |
| `demo-component-lab.html` | Component / chart lab (Help embed) |
| `demo-live-playground.js` | Shared Scene / Theme / API dock |
| `demo-embed.js` / `demo-common.css` | Embed chrome |

---

## Source of truth vs generated

| In git | Generated / local (gitignored) |
|--------|--------------------------------|
| `docs/*.md`, `examples/`, `src/` | `docs/api/`, `dist/`, `coverage/` |
| `website/{index,help,doc}.html`, `website/public/{main,site-theme,styles,doc-viewer}.*` | `website/dist/`, `website/public/{examples,docs,blog,lightdraw*}` |
| Module schemas | `*_PLAN.md`, `blog/`, audit scratch HTML |
