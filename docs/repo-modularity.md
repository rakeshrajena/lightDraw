# Repo-wide modularity roadmap

> **Status: complete (R1–R7).** Living overview: [architecture.md](./architecture.md). Diagram catalogs: [diagram-pipeline-structure.md](./diagram-pipeline-structure.md).

This page keeps the historical split checklist for contributors.

Same goals as the diagram catalog split: small editable files, stable public façades, structure tests that catch dead aliases / missing registrations.

Diagram catalog work is **done** (see [diagram-pipeline-structure.md](./diagram-pipeline-structure.md)). This doc tracks the rest of the library.

## Principles

1. **Façade stays** — `definitions.ts`, `*Icons.ts`, registry entrypoints keep the same import path.
2. **Split by domain** — not by arbitrary line count; group things that change together.
3. **Side-effect registration** — `import './definitions'` still registers everything.
4. **Structure tests** — every registered id has a factory; catalogs stay consistent.
5. **One module phase at a time** — ship green tests/build before the next hotspot.

## Hotspots (by size)

| Priority | Path | ~LOC | Status |
|----------|------|------|--------|
| Done | `diagram/pipeline|schematic|network` | — | **Done** (Phases 1–4) |
| **R1** | `components/definitions.ts` | 1400 | **Done** → `components/definitions/` |
| **R2** | `renderers/htmlComponents.ts` | 1270 | **Done** → `renderers/htmlComponents/` |
| **R3** | `diagram/primitives.ts` | 1260 | **Done** → `diagram/primitives/` |
| **R4** | `automotive/widgets/custom.ts` (+ panels) | 1000+ | **Done** → `widgets/custom/` + `widgets/panels/` |
| **R5** | `dashboard/definitions.ts` | 900 | **Done** → `dashboard/definitions/` |
| **R6** | `diagram/definitions.ts` + editor | 880+ | **Done** → `diagram/definitions/` (editor already modular) |
| **R7** | `App.ts` / `io/schema.ts` | 650/545 | **Done** → `io/schema/` + `app/hitTest.ts` |

## Phase R1 — UI components (Done)

```
src/components/
├── definitions.ts              # thin façade (side-effect import)
├── definitions/
│   ├── shared.ts               # UI(), createGroup, canvasSurface
│   ├── controls.ts             # button, slider, input, …
│   ├── overlays.ts             # tooltip, menu, dialog, toast
│   ├── navigation.ts           # tabs, accordion, toolbar, statusBar
│   ├── dataViews.ts            # table, tree
│   └── index.ts                # registers all
├── registry.ts                 # still `import './definitions'`
└── …
```

**Add a UI component:** edit the matching domain file under `definitions/` → `registerComponent(...)`. Run `npx vitest run test/ui/` / `test/ui9-cross-module.test.ts`.

## Phase R2 — HTML renderer components (Done)

```
src/renderers/
├── htmlComponents.ts           # thin façade (same exports for HTMLRenderer)
└── htmlComponents/
    ├── types.ts                # NativeSyncContext, FormModifiers
    ├── shared.ts               # position/state/modifiers + dialog/menu helpers
    ├── controls.ts             # button, checkbox, input, slider, card, …
    ├── navigation.ts           # tabs, accordion, toolbar, statusBar
    ├── dataViews.ts            # table, tree
    ├── overlays.ts             # toast, menu, dialog, tooltip
    ├── catalog.ts              # NATIVE_HTML_COMPONENTS set
    └── index.ts
```

**Add a native HTML sync:** implement `syncNativeX` in the matching domain file, export from `index.ts` / façade, wire `HTMLRenderer.syncNativeComponent`, and update `catalog.ts` when it belongs in the Set (`input`/`textarea` stay special-cased).

Tests: `test/renderers/html.test.ts`, `test/renderers/htmlComponents-structure.test.ts`.

## Phase R3 — Diagram primitives (Done)

```
src/diagram/
├── primitives.ts                 # thin façade
└── primitives/
    ├── measure.ts                # measureTextWidth, centerTextX
    ├── labeledBox.ts             # shared card chrome
    ├── flowchart.ts / classNode.ts / networkNode.ts
    ├── org.ts                    # org cards, palette, collapse
    ├── pipelineStage.ts / stateNode.ts / canEcu.ts
    ├── edgeLabel.ts
    └── index.ts
```

**Add a diagram node primitive:** put the factory in the matching file (or a new domain file), export from `primitives/index.ts` and the façade. Prefer reusing `createLabeledBox` / chrome helpers.

Tests: `test/diagram/primitives-structure.test.ts`, org/network/editor suites.

## Phase R4 — Automotive widgets (Done)

```
src/automotive/widgets/
├── custom.ts / panels.ts         # thin façades (side-effect imports)
├── custom/
│   ├── shared.ts                 # themedDial
│   ├── gauges.ts / indicators.ts / infotainment.ts
│   ├── diagnostics.ts / cluster.ts
│   └── index.ts
├── panels/
│   ├── shared.ts                 # lines()
│   ├── climate.ts / navigation.ts / media.ts
│   ├── alerts.ts / camera.ts / ambient.ts
│   └── index.ts
├── panelPrimitives.ts            # shared panel chrome (unchanged)
├── registerCatalog.ts            # catalog-driven defaults
└── aliases.ts
```

**Add a custom automotive widget:** edit the matching `custom/*.ts` file → `registerAutomotive(...)`.  
**Add a panel:** edit `panels/*.ts` (reuse `panelPrimitives`).  
Both façades stay imported from `automotive/definitions.ts`.

Tests: `test/automotive/structure.test.ts`, `test/phase8.test.ts`.

## Phase R5 — Dashboard definitions (Done)

```
src/dashboard/
├── definitions.ts                # thin façade (side-effect + re-exports)
├── definitions/
│   ├── gauges.ts                 # gauge, speedometer, meter, knob, battery
│   ├── indicators.ts             # legend, thermometer, compass, signalStrength
│   ├── calendar.ts / clock.ts
│   ├── chartPanel.ts             # framed chart host
│   └── index.ts                  # also imports charts/registerAll
├── charts/                       # already modular (cartesian, polar, …)
└── …
```

**Add a dashboard widget:** edit the matching `definitions/*.ts` file → `registerDashboard(...)`. Charts stay under `charts/*/register.ts`.

Tests: `test/dashboard/structure.test.ts`, `test/phase7.test.ts`, `test/charts/`.

## Phase R6 — Diagram definitions (Done)

```
src/diagram/
├── definitions.ts                # thin façade
├── definitions/
│   ├── flowchart.ts / stateMachine.ts / classDiagram.ts / mindMap.ts
│   ├── network.ts / org.ts / schematic.ts / canNetwork.ts / pipeline.ts
│   ├── forceLayout.ts / fromProps.ts
│   └── index.ts
├── editor/                       # already split (DiagramEditor, resize, reroute, …)
└── …
```

**Add a diagram type:** add `createX` in a domain file under `definitions/`, export from `index.ts` + façade, and wire a `case` in `fromProps.ts`.

Tests: `test/diagram/definitions-structure.test.ts`, `test/phase9.test.ts`.

## Phase R7 — App + IO schema (Done)

```
src/io/
├── schema.ts                     # thin façade
└── schema/
    ├── types.ts / colorHelpers.ts / issues.ts
    ├── jsonLocate.ts             # parse error line/col + caret
    ├── theme.ts / scene.ts / format.ts / parse.ts
    └── index.ts

src/app/
└── hitTest.ts                    # spatial + tree hit-test (used by App)

src/App.ts                        # still the App class façade (theme/lifecycle stay here)
```

**Add validation rules:** edit `io/schema/scene.ts` or `theme.ts`; keep exports on `io/schema.ts`.  
**Hit-test changes:** edit `app/hitTest.ts`.

Tests: `test/io/schema-structure.test.ts`, `test/io/json-validation.test.ts`, `test/phase10.test.ts`.

## Roadmap complete (R1–R7)

Further splits are optional polish (`chartPrimitives.ts`, `App` theme section) — only if a file becomes hard to navigate again.

## Verification per phase

```bash
npx tsc --noEmit
npx vitest run <affected tests>
npm run build && node scripts/size-gate.mjs
```

## Related

- [Diagram symbol structure](./diagram-pipeline-structure.md) — completed catalog modularity
- [Contributing](../CONTRIBUTING.md) — where to edit
- [Theme architecture](./theme-architecture.md)
