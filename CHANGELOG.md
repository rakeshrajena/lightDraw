# Changelog

All notable changes to LightDraw.js will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added (Phase UI-10 — Documentation & release)

- `docs/responsive-guide.md` — breakpoints, fluid layouts, `fullWidth`, `autoResize`
- `docs/legacy-ui-guide.md` — ES5 + CSS compatibility table for HTML UI
- `examples/demo-ui-catalog.html` — Storybook-style gallery of all UI variants
- `test/ui10-docs.test.ts` — doc presence, catalog page, theme/responsive snippets
- README screenshot refresh via `npm run screenshots:readme`

### Added (Phase UI-9 — Cross-module polish & legacy)

- Shared `demo-common.css` aside layout, embed mode, reduced-motion, dark `color-scheme`
- `demo.html` migrated to shared demo shell; animation/export/a11y aside panels
- Playground responsive iframe heights (`clamp()` in `website/public/styles.css`)
- `test/ui9-cross-module.test.ts` — all 8 playground demos use shared shell
- Extended `test/phase12-legacy.test.ts` — 17 UI components on legacy bundle
- Visual smoke: ui, diagram, export, a11y golden screenshots

### Added (Phase UI-8 — Diagram module polish)

- `src/diagram/chrome.ts` — shared card chrome (sheen, accent bar, caption pills)
- Professional primitives per diagram type (flowchart, state machine, network, CAN, etc.)
- `demo-diagram.html` — view-only showcase with grouped sidebar and info panel

### Added (Phase UI-7 — Automotive module polish)

- Instrument cluster chrome, themed gauges, responsive cluster toolbar
- `demo-automotive.html` — widget catalog tab, live drive simulation, embed layout

### Added (Phase UI-6 — Dashboard module)

- `resolveDashboardTheme()` — merge UI theme tokens into dashboard palette
- Extended `DASHBOARD` semantic tokens (success, warning, meter, clock, battery, signal, etc.)
- Clock widget: live second hand via `live: true` + `setRefresh`
- `demo-dashboard.html` — all 16 widgets, 2×2 gauge grid, responsive stack @ &lt;720px, live clock
- Phase 7 tests: theme merge, pie/bar/signal/clock, chart tooltip visibility, 16-widget perf &lt;45ms

### Changed (Phase UI-6)

- Dashboard widgets use `DASHBOARD` tokens instead of hardcoded light-theme hex on dark panels
- `pieChart` default colors from `DASHBOARD.series`
- Signal strength inactive bars use dark-panel colors (`signalInactive`)

### Added (Phase UI-0 — Design system foundation)

- Spacing scale (`--ld-space-xs` … `--ld-space-xl`) and breakpoint reference tokens (`--ld-bp-sm/md/lg`) in `lightdraw.css`
- `resolveUiTheme()`, `UiThemeInput.preset`, `UI_THEME_VAR_MAP`, and `UI_THEME_TOKEN_KEYS` in `uiTheme.ts`
- `docs/ui-theme-guide.md` — customize themes without mandatory CSS
- `test/ui/theme-tokens.test.ts` — token map completeness and preset resolution
- Theme preset gallery in `examples/demo-ui.html` (light, dark, violet, emerald, slate, ocean, rose)

### Changed (Phase UI-0)

- Canvas `UI` tokens in `theme.ts` aligned 1:1 with CSS variable defaults
- `App.setUiTheme()` resolves presets and passes full token set to HTML renderer
- Global tap-highlight reset and shared disabled cursor in `lightdraw.css`

### Added (Phase UI-3 — Overlays & feedback)

- Dialog: centered panel, backdrop blur (solid fallback), mobile full-bleed @ 480px, focus trap
- Menu: scrollable panel, danger item variant (`itemVariants`), click-outside close
- Tooltip: placement arrows (`top` / `bottom` / `right`), optional `delay`, custom `anchor` text
- Toast: slide-in animation (`prefers-reduced-motion` safe), stack positions, dismiss button, variants

### Changed (Phase UI-3)

- Overlay z-index scale (`--ld-z-menu` … `--ld-z-dialog`) in `lightdraw.css`
- `demo-ui.html` Overlays section: menu, tooltips, toasts, dialog playground
- Canvas parity for dialog, menu, tooltip, toast in `definitions.ts`
- Extended `test/phase6.test.ts` and `test/coverage-v09-gate.test.ts` with UI-3 overlay tests

### Added (Phase UI-4 — Data display)

- Table: zebra rows, sticky header, sortable column headers, horizontal/vertical scroll wrapper
- Tree: indent guides, chevron expand/collapse icons, selectable leaves with highlight

### Changed (Phase UI-4)

- `demo-ui.html` Data section: 10-row project table + file-tree sidebar mock
- Canvas parity for table and tree in `definitions.ts`
- Extended `test/phase6.test.ts` with UI-4 data display tests

### Added (Phase UI-5 — UI integration & canvas parity)

- `canvasSurface()` helper for consistent canvas chrome (radius, border, shadow)
- High-contrast refinements: `data-ld-high-contrast` attribute + expanded CSS token overrides
- `docs/ui-components-schema.md` — full variant/size props for all 20 UI factories
- JSON round-trip documentation in `docs/ui-theme-guide.md`

### Changed (Phase UI-5)

- `demo-ui.html` showcase: hero, section sidebar nav, theme gallery, HTML/canvas toggle, high-contrast control
- `test/renderers/canvas.test.ts` — all UI components render on canvas
- `test/renderers/html.test.ts` — high-contrast and uiTheme variable tests
- Extended `test/phase6.test.ts` with UI-5 integration tests

### Added (Phase UI-2 — Surfaces & layout)

- Card: subtitle, actions slot, hover elevation (`elevated` prop)
- Tabs: sliding underline indicator, horizontal scroll, arrow-key navigation
- Accordion: animated expand/collapse panel, toggle-to-close, `aria-expanded`
- Toolbar: icon+label buttons, `|` separator items, flex-wrap on narrow screens
- StatusBar: `primaryIndex`, optional `mono` monospace segments

### Changed (Phase UI-2)

- `demo-ui.html` Layout section: dashboard mock (card + tabs + accordion + toolbar + statusBar)
- Canvas parity for all 5 surface components in `definitions.ts`
- Extended `test/phase6.test.ts` with UI-2 surface variant tests

### Added (Phase UI-1 — Form controls)

- Form control states: `disabled`, `invalid`, `error` props on input/textarea; disabled on checkbox, toggle, radio, slider
- Size modifiers (`sm` / `md` / `lg`) for buttons, fields, checkbox, toggle, progress bar
- `fullWidth` prop on input, textarea, slider, progressBar for responsive layouts
- Legacy-friendly form CSS: margin-based spacing (no `gap`), `-webkit-appearance` resets
- Canvas parity: button sizes/variants, invalid/disabled field strokes, progress variants

### Changed (Phase UI-1)

- `demo-ui.html` forms section: validation example, disabled row, all 9 controls, responsive stack @ &lt;768px
- Extended `test/phase6.test.ts` and `test/renderers/html.test.ts` for form variants

### Added (Phase 12 — Production Release Hardening)

- Cross-browser Playwright smoke (Chromium, Firefox, WebKit)
- Legacy ES5 bundle smoke tests (`test/phase12-legacy.test.ts`)
- GitHub Release workflow (`.github/workflows/release.yml`) — tag-triggered, optional npm publish
- `docs/VERSIONING.md`, `docs/RELEASE.md`, `docs/v1-release-notes.md`
- Memory test: App create/destroy × 10 000
- `LICENSE` (MIT), npm `files` + `publishConfig`
- CI: `npm audit --audit-level=critical`, coverage gate **≥95%**

### Changed

- `package.json` author, repository, publish metadata
- README author section and GitHub links
- Playwright: visual regression on Chromium only; cross-browser smoke without screenshots

### Added (Phase 11 — Documentation & Playground)

- **Guides:** animation, plugin, performance, legacy browser, automotive examples, AI integration (`docs/*.md`)
- `docs/README.md` — documentation index
- **API reference:** TypeDoc config (`typedoc.json`), `npm run docs:api` → `docs/api/`
- **Playground website:** Vite site in `website/` with embedded example iframes
- `scripts/prepare-website.mjs` — copies bundles, examples, docs into `website/public/`
- `npm run dev:website`, `npm run build:website`
- **Visual regression:** Playwright screenshot tests (`test/visual/smoke.spec.ts`, 4 golden scenes)
- `test/phase11.test.ts` — guides, playground build, API docs (8 tests)
- `test/doc-snippets.test.ts` — runnable code snippets from guides (13 tests)
- `test/phase11-coverage.test.ts`, `phase11-integration.test.ts`, `phase11-shapes.test.ts`, `phase11-renderers.test.ts`

### Changed

- Line coverage gate: ≥92% → **≥94%** (Phase 11 gate)
- `examples/demo-animation.html` — static auto-start frame for gallery/visual tests
- CI: Phase 11 tests, Playwright install, visual regression suite

## [1.0.0] - 2026-07-08

### Summary — UI polish program complete

LightDraw **v1.0.0** completes the phased UI beautification program (UI-0 through UI-10): design tokens, 17 HTML/canvas UI components, dashboard and automotive widgets, diagram chrome, cross-demo consistency, legacy ES5 hardening, and documentation for themes, responsive layout, and legacy CSS targets.

**Highlights:**

- `lightdraw.min.css` — single stylesheet for polished HTML renderer UI
- `app.setUiTheme({ preset })` — eight presets, no mandatory custom CSS
- Playground + 8 demo pages synced (`npm run prepare:website`)
- Legacy bundle renders all UI components on HTML renderer (`test/phase12-legacy.test.ts`)
- Guides: [ui-theme](./docs/ui-theme-guide.md), [responsive](./docs/responsive-guide.md), [legacy UI](./docs/legacy-ui-guide.md)
- Visual regression: 8 golden scenes (`npm run test:ci:visual`)

See [Unreleased] above for per-phase detail. Migration from v0.9: no breaking API changes; demos and CSS tokens are additive.

## [0.9.0] - 2026-07-05

### Added (Phase 10 — Export Pipeline)

- `src/io/exportTypes.ts` — `ExportOptions`, `ExportResult`, format types
- `src/io/schema.ts` — lightweight JSON scene validation
- `src/io/pdf.ts` — zero-dependency PDF writer (JPEG embed)
- `src/io/snapshot.ts` — offscreen raster/SVG snapshot with region crop
- **Unified API:** `app.export({ format, options })` — PNG, JPEG, SVG, PDF, JSON, HTML
- Export options: `pixelRatio`, `quality`, `region`, `background`, `validate`, `pages`
- `downloadExport()` browser download helper
- `scenesEqual()` for JSON round-trip tests
- `test/phase10.test.ts` — 15 tests (formats, PDF, validation, perf, region crop)
- `examples/demo-export.html` — download buttons for all formats
- `docs/export-pipeline.md`

### Changed

- `exportScene()` extended with PDF + options; delegates to `exportApp`
- `App.getPixelRatio()`, `getBackground()`, `getRenderer()` for export pipeline
- Line coverage gate: ≥90% → **≥92%** (Phase 10 gate)

## [0.8.0] - 2026-07-05

### Added (Phase 9 — Diagram Module Complete)

- `src/diagram/layouts.ts` — force-directed layout (seeded), radial mind-map layout, pipeline layout
- `src/diagram/router.ts` — smart orthogonal routing with obstacle avoidance
- `src/diagram/symbols.ts` — electrical schematic symbol library
- `src/diagram/helpers.ts` — `diagramToJSON`, diagram group factory
- **New diagram types:** stateMachine, classDiagram, mindMap, networkTopology, electricalSchematic, canNetwork, processPipeline
- **Enhanced:** flowchart/orgChart with smart connectors; org chart collapse via `toggleOrgCollapse`
- JSON resolver registration for all diagram types via `diagramPlugin`
- `test/phase9.test.ts` — 24 tests (force layout, router, perf, JSON round-trip)
- `examples/demo-diagram.html` — flowchart, state machine, network, CAN, pipeline demos
- `docs/diagram-module-schema.md`

### Changed

- Diagram module split into `helpers`, `layouts`, `router`, `symbols`, `definitions`, `registryCore`
- `toJSON()` recognizes `metadata.diagramType` for diagram round-trip
- Diagram bundle gzip baseline: ~1.3 KB → **~5.1 KB** (CI gate 6 KB)
- Full bundle gzip baseline: ~33 KB → **~36.6 KB** (CI gate 38 KB)
- Line coverage gate: ≥88% → **≥90%** (Phase 9 gate)

## [0.7.0] - 2026-07-05

### Added (Phase 8 — Automotive Module Complete)

- `src/automotive/helpers.ts` — auto widget state, `animateAutoValue`, `setAutoValue`, `automotiveToJSON`
- `src/automotive/themes.ts` — classic / sport / digital cluster palettes
- `src/automotive/simulation.ts` — `applyDriveState`, `sampleDriveFrames` JSON drive feed
- **New widgets:** engineTemp, batteryVoltage, tpms, parkingBrake, headlights, cruiseControl, canViewer
- **Enhanced:** instrumentCluster composes all widgets with theme support; live needle refresh on gauges
- `test/phase8.test.ts` — widget render, TPMS, CAN perf, cluster JSON, drive simulation
- `examples/demo-automotive.html` — animated instrument cluster demo
- `docs/automotive-widgets-schema.md`

### Changed

- Automotive registry split into `registryCore.ts` + `definitions.ts`
- `toJSON()` recognizes `metadata.autoType` for automotive round-trip
- Line coverage gate: ≥86% → **≥88%** (Phase 8 gate)

## [0.6.0] - 2026-07-05

### Added (Phase 7 — Dashboard Module Complete)

- `src/dashboard/chartPrimitives.ts` — shared axes, grid, legend, area paths, chart interaction
- `src/dashboard/helpers.ts` — widget state, `animateLiveValue`, `dashboardToJSON`
- **New widgets:** areaChart, legend, thermometer, compass, calendar, timeline, signalStrength, knob, meter
- **Enhanced:** lineChart/barChart with axes + grid; gauge/speedometer live needle updates
- Chart hover tooltip + click `select` on line/area charts
- `test/phase7.test.ts` — 28 tests (widgets, ticks, live update, perf, JSON)
- `examples/demo-dashboard.html` — live dashboard demo
- `docs/dashboard-widgets-schema.md`

### Changed

- Dashboard registry split into `registryCore.ts` + `definitions.ts`
- Line coverage gate: ≥82% → **≥86%** (Phase 7 gate)
- CI coverage gate raised to 86%

## [0.5.0] - 2026-07-05

### Added (Phase 6 — UI Components Complete)

- Interactive wiring for all 17 UI components (`src/components/definitions.ts`, `interaction.ts`, `helpers.ts`)
- **New components:** input, textarea, radio, tooltip, menu, dialog, tabs, accordion, table, tree, toolbar, toast, statusBar
- **Enhanced:** button (hover/active/disabled), slider (drag + change), checkbox/toggle (toggle + change)
- HTML renderer native `<input>` / `<textarea>` with `input` and `change` events
- `componentToJSON()` for JSON round-trip of component state
- `test/phase6.test.ts` — render, interaction, JSON, perf, memory tests
- `examples/demo-ui.html` — all 17 components showcase
- `docs/ui-components-schema.md` — JSON schema per component type

### Changed

- Line coverage gate: ≥78% → **≥82%** (Phase 6 gate)
- CI coverage gate raised to 82%

## [0.4.0] - 2026-07-05

### Added (Phase 5 — Modular Bundle Architecture)

- `src/core/index.ts` — core-only entry (canvas renderer, shapes, animation, events)
- Plugin modules: `src/modules/{svg,html,ui,dashboard,automotive,diagram}/`
- Renderer registry (`src/registry/renderers.ts`) and JSON resolver registry (`src/registry/jsonResolvers.ts`)
- Multi-entry build: `lightdraw.core.min.js`, `.svg`, `.html`, `.ui`, `.dashboard`, `.automotive`, `.diagram`, full `lightdraw.min.js`
- ES5 `.legacy.js` variant for each bundle
- `package.json` `exports` map with subpath imports (`lightdraw/core`, `lightdraw/ui`, etc.)
- `scripts/size-gate.mjs` — CI gzip size enforcement (core ≤ 8 KB)
- `test/phase5.test.ts` — core-only import, plugin load, size gate, legacy builds

### Changed

- `App` and `fromJSON` use registries instead of hard-coded renderer/component imports
- Full `src/index.ts` auto-installs all plugins for backward compatibility
- Line coverage gate: ≥75% → **≥78%** (Phase 5 gate)
- CI adds bundle size gate step (`npm run size-gate`)

### Known limitations

- Aspirational core gzip target (8 KB) not yet met; v0.4.0 core baseline ~17.7 KB gzip (documented exception, CI gate 18 KB)
- SVG/HTML plugin bundles exceed 3 KB aspirational targets; tracked for future tree-shaking

## [0.3.1] - 2026-07-05

### Added (Phase 4 — Events, Interaction & Accessibility)

- `Node.focusable`, `dropTarget`, `dragPayload`, ARIA props (`role`, `ariaChecked`, `ariaValueNow`, etc.)
- Event bubbling with `stopPropagation()` up the scene graph parent chain
- Drag-and-drop between nodes (`dragover`, `drop` with payload)
- Keyboard navigation: Tab / Shift+Tab focus cycle, Enter/Space activation
- `App.focusNode()`, `getFocusedNode()`, `getFocusableNodes()`, `setHighContrast()`
- Canvas focus ring; HTML ARIA roles on button, checkbox, slider, switch, progressbar
- `aria-live` on dashboard gauge value text
- `src/utils/a11y.ts` — WCAG contrast helpers, high-contrast palette
- `src/utils/focusOrder.ts` — tab-order collection
- `test/phase4.test.ts` — 21 tests (dblclick, drag-drop, focus, ARIA, propagation)
- `examples/demo-a11y.html` — keyboard + drag-drop accessibility demo

### Changed

- `EventManager` — bubble dispatch, focus manager, drag-drop, keyboard handler
- Line coverage: ≥70% → **≥76%** (Phase 4 gate: 75% ✅)
- CI coverage gate raised to 75%

## [0.3.0] - 2026-07-05

### Added (Phase 3 — Animation Complete)

- `src/utils/pathGeometry.ts` — path length, `getPointAtLength`, `morphPath`, `rectPath`
- Motion path animation via `motionPath` option (string or `Path` node)
- Path morphing via `morphTo` on `Path` nodes
- `Node.dashOffset` with canvas/SVG stroke-dashoffset rendering
- `Sprite.play({ fps, loop })` integrated with `AnimationEngine`
- `App.animate(node, props)` shorthand API
- `Timeline.stagger(nodes, props, staggerMs)` for staggered parallel animations
- `AnimationEngine.isTickScheduled()` test hook; RAF cleanup on stop/stopAll
- `test/phase3.test.ts` — 17 tests (motion, dash, morph, sprite, stagger, RAF)
- `examples/demo-animation.html` — interactive Phase 3 animation demo

### Changed

- Line coverage: 67.1% → **≥70%** (Phase 3 gate: 70% ✅)
- CI coverage gate raised to 70%

## [0.2.1] - 2026-07-05

### Added (Phase 2 — Performance Engine)

- `src/performance/SpatialIndex.ts` — grid hash spatial index for O(1) hit-test queries
- `src/performance/LayerCache.ts` — offscreen bitmap cache for `cacheAsBitmap` groups
- `src/performance/bounds.ts` — world bounds, subtree dirty checks, node counting
- `src/performance/styleKey.ts` — paint style keys for batch rendering
- `test/phase2.test.ts` — 11 tests (dirty regions, batch, spatial index, cache, diff DOM)
- `PerformanceOptions` on `AppOptions` — spatial index, dirty regions, batch, layer cache toggles
- `Group.cacheAsBitmap` — cache static subtrees to offscreen canvas

### Changed

- Canvas: partial `clearRect` dirty regions, fill batching for same-style rects
- Canvas: `lastClearRectCount` / `lastFillCallCount` metrics for tests
- App: spatial-index hit testing when node count ≥ 100
- App: `markNodeDirty()` propagates dirty rects to renderer
- SVG renderer: incremental DOM sync (patch attrs, prune orphans)
- HTML renderer: element ref map, update styles without `innerHTML` reset
- `Matrix2D.invertInto()` used with `matrixPool` in hit-test path
- Test count: 62 → **81**
- Line coverage: 56.8% → **67.1%** (Phase 2 gate: 65% ✅)

## [0.2.0] - 2026-07-05

### Added (Phase 1 — Core Engine Completion)

- `src/utils/pathHitTest.ts` — SVG path parser, `pathContainsPoint()`, `pathBounds()`
- `src/renderers/styles.ts` — shared gradient, pattern, shadow helpers for all renderers
- `src/renderers/clipUtils.ts` — shape clipping and mask hit-test utilities
- `test/phase1.test.ts` — 15 tests for path hit test, gradients, masking, flex, sprite, matrix pool
- `Matrix2D.invertInto()` and `matrixPool` wired into App hit-test hot path
- Flex layout: wrap, align, justify, explicit `width`/`height` container options

### Changed

- Path hit testing uses ray-cast on parsed subpaths
- Gradients render on Canvas, SVG (`<defs>`), and HTML (CSS gradients)
- Shadows on SVG (feGaussianBlur filter) and HTML (box-shadow)
- Canvas shape clipping and mask support; SVG/HTML partial mask via clipPath/overflow
- Sprite auto-advances frames in App render loop when `playing: true`
- Test count: 47 → **62**
- Line coverage: 54.8% → **56.8%** (Phase 1 gate: 55% ✅)

## [0.1.1] - 2026-07-05

### Added (Phase 0 — Quality Infrastructure)

- `test/setup.ts` with canvas 2D mock and `toDataURL` stub for jsdom
- `test/helpers.ts` shared test utilities
- `test/memory.test.ts` — heap growth bounds (6 tests, up to 1000 App cycles)
- `test/perf.test.ts` — performance regression vs baseline (9 tests)
- `test/renderers/` — canvas, SVG, HTML smoke suites (18 tests)
- Expanded `scripts/benchmark.mjs` — create, render, hitTest, animate metrics
- `benchmarks/baseline.json` — recorded performance baselines
- `npm run test:memory`, `test:perf`, `benchmark:save`, `benchmark:compare`
- CI coverage gate (≥40% lines), memory tests, perf tests, benchmark compare

### Changed

- Test count: 14 → 47
- Line coverage: ~40% → **54.8%**
- Version bumped to 0.1.1

## [0.1.0] - 2026-07-05

### Added

- Core scene graph with retained-mode rendering
- Shape primitives: Rect, Circle, Ellipse, Line, Arc, Polygon, Polyline, Path, Star, Text, Image, Sprite
- Renderers: Canvas, SVG, HTML/CSS with auto-detection
- Animation engine with 20+ easing functions, timelines, and chaining
- Event system with pointer, touch, drag, and keyboard support
- Camera with pan, zoom, rotate, and coordinate conversion
- Layout engine: grid, stack, flex, flow, tree, circular
- UI components: button, card, label, progress bar, slider, checkbox, toggle
- Dashboard widgets: gauge, speedometer, line/bar/pie charts, battery, clock
- Automotive module: instrument cluster, tachometer, fuel gauge, gear indicator, ADAS
- Diagram module: flowcharts, org charts, connector routing
- JSON import/export for AI-friendly scene definitions
- Plugin system for extending components, renderers, and themes
- Build outputs: ESM, UMD, legacy ES5, TypeScript declarations
- Unit tests, benchmarks, CI/CD pipeline
- Demo application and documentation
