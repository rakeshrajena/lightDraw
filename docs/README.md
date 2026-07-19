# LightDraw.js Documentation

<p align="center">
  <a href="https://github.com/rakeshrajena/lightDraw"><img src="https://img.shields.io/github/v/release/rakeshrajena/lightDraw?label=GitHub" alt="GitHub release" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
</p>

**Version:** 1.1.0 · **Install:** `npm install lightdraw@1.1.0` · **Live:** [Playground](https://rakeshrajena.github.io/lightDraw/) · [Help](https://rakeshrajena.github.io/lightDraw/help.html) · [Diagram](https://rakeshrajena.github.io/lightDraw/#diagram)

## Guides

| Guide | Description |
|-------|-------------|
| [Getting Started](./getting-started.md) | Install, basic usage, JSON, local playground |
| [Animation](./animation-guide.md) | Easing, timelines, path motion, stagger |
| [Plugins](./plugin-guide.md) | Custom components, renderers, registration |
| [Performance](./performance-guide.md) | Benchmarks, spatial index, dirty regions |
| [Legacy Browsers](./legacy-browser-guide.md) | ES5 build, polyfills, WebView |
| [UI Theme](./ui-theme-guide.md) | Presets, tokens, high contrast — no mandatory CSS |
| [Theme architecture](./theme-architecture.md) | Library-wide theme contract, phases, resolve order |
| [Pipeline symbol structure](./diagram-pipeline-structure.md) | Modular catalog layout — how to add/remove pipeline glyphs |
| [Responsive Layout](./responsive-guide.md) | Breakpoints, `fullWidth`, `autoResize` |
| [Legacy UI & CSS](./legacy-ui-guide.md) | ES5 + `lightdraw.min.css` compatibility |
| [Automotive Examples](./automotive-examples.md) | Cluster, CAN viewer, drive simulation |
| [AI Integration](./ai-integration-guide.md) | JSON schema, validation with expected values, prompts |
| [Export Pipeline](./export-pipeline.md) | PNG, SVG, PDF, `validateSceneJSON` / `validateThemePack` |
| [Versioning](./VERSIONING.md) | Semantic versioning policy |
| [Release workflow](./RELEASE.md) | GitHub Release + npm publish steps |
| [v1.1.0 notes](./v1.1-release-notes.md) | Diagram studio, playground, migration from 1.0 |
| [v1.0.0 notes](./v1-release-notes.md) | Migration from v0.1 |

## Module schemas

| Schema | Module |
|--------|--------|
| [UI Components](./ui-components-schema.md) | Button, slider, dialog, … |
| [Dashboard](./dashboard-widgets-schema.md) | Charts, gauges, thermometer |
| [Automotive](./automotive-widgets-schema.md) | Cluster, TPMS, CAN |
| [Diagram](./diagram-module-schema.md) | Flowchart, network icons, org chart, editor (resize / bends / collapse) |

## API reference

Generate locally (output is gitignored):

```bash
npm run docs:api
```

Output: `docs/api/` (TypeDoc HTML). The website build copies guides into `website/public/docs/` via `npm run prepare:website`.

## Live playground & help

```bash
npm run build          # build library first
npm run prepare:website  # copy bundles + examples into website/public
npm run dev:website    # http://localhost:5173
npm run build:website  # static site → website/dist/ (gitignored)
```

| Surface | What it is |
|---------|------------|
| [Playground hub](https://rakeshrajena.github.io/lightDraw/) | Single-stage demo rail (Theme, UI, Charts, Auto, …) |
| [Help center](https://rakeshrajena.github.io/lightDraw/help.html) | Short topics with live iframe embeds |
| Day / Night | Site chrome theme; defaults to **Night**; syncs into demo iframes |
| Live code dock | JSON · API — auto-apply with **Live** on; put `theme` on the scene root |

### JSON validation in demos

Editors use `parseAndValidateSceneJSON` / `validateThemePack`. Errors include:

- **Parse:** line, column, caret snippet
- **Schema / enums:** JSON path + `expected one of: …` + `did you mean …?`

## Examples

Interactive HTML demos live in [`../examples/`](../examples/) (source of truth; `website/public/examples/` is a prepared copy):

| File | Focus |
|------|--------|
| `demo.html` | Core shapes & animation |
| `demo-animation.html` | Motion path, morph, stagger |
| `demo-ui.html` | 17 UI components + live dock |
| `demo-ui-catalog.html` | Storybook-style variant gallery |
| `demo-dashboard.html` | Live charts & gauges |
| `demo-automotive.html` | Instrument cluster + catalog |
| `demo-diagram.html` | Interactive diagrams — resize, wire bends, org collapse, live JSON |
| `demo-export.html` | Download all export formats |
| `demo-a11y.html` | Keyboard & ARIA |
| `demo-theme.html` | Theme lab (presets, Scene/Theme/API editors, dark default) |
| `demo-color-stops.html` | Conditional `colorStops` / `colorZones` |
| `demo-live-playground.js` | Shared Scene / Theme / API live dock |
| `demo-embed.js` | Embed layout + shell theme sync |
| `demo-common.css` | Shared demo chrome, scrollbars, dock |

## Source of truth vs generated

| Keep in git | Generated / local (gitignored) |
|-------------|-------------------------------|
| `docs/*.md`, `examples/`, `src/` | `docs/api/`, `dist/`, `coverage/` |
| `website/index.html`, `help.html`, `public/{main,site-theme,styles}.*` | `website/dist/`, `website/public/{examples,docs,lightdraw*}` |
| Module schemas | Internal `*_PLAN.md`, `PROJECT_STATUS.md`, blog fixtures |
