# LightDraw — UI Beautification, Responsiveness & Legacy Plan

**Version:** 1.0  
**Created:** July 6, 2026  
**Baseline:** v0.9.0 (Phase 12 complete)  
**Goal:** Every component looks **professional and elegant out of the box**. End users call `createApp` / `loadJSON` and get polished UI — custom CSS is **optional**, not required.

**Scope rule:** Changes live in the **library** (`src/`), not demo-only CSS. Demos only **showcase** library defaults.

Related: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) · [PROJECT_STATUS.md](./PROJECT_STATUS.md) · [docs/ui-components-schema.md](./docs/ui-components-schema.md)

---

## Design principles

| Principle | Implementation |
|-----------|----------------|
| **Zero mandatory CSS** | Ship `dist/lightdraw.min.css`; HTML renderer applies classes + variables automatically |
| **Override when needed** | `app.setUiTheme({ ... })` or CSS variables on `.lightdraw-html-root` |
| **Library-first** | Polish `definitions.ts` (canvas/SVG), `htmlComponents.ts` (HTML), `lightdraw.css` (styles) |
| **Responsive by default** | Fluid widths, `min()`/`max()`, touch targets ≥ 44px, readable at 320px–1920px |
| **Legacy-safe** | Flexbox + transforms; vendor prefixes; no CSS Grid requirement; ES5 `.legacy.js` bundles tested |
| **Accessible motion** | `prefers-reduced-motion`, focus rings, contrast presets |
| **Per-phase demos** | Update matching `examples/demo-*.html` + `website/public/examples/` each phase |

---

## Architecture (where work happens)

```
src/styles/lightdraw.css     ← HTML component styles (primary CSS surface)
src/components/uiTheme.ts    ← Programmatic theme API → CSS variables
src/components/theme.ts      ← Canvas/SVG draw tokens (fill, stroke, radius)
src/renderers/htmlComponents.ts  ← Native DOM sync per component
src/renderers/HTMLRenderer.ts    ← Root theme persistence, class application
src/components/definitions.ts    ← Canvas fallback shapes for non-HTML renderer

Per module:
src/dashboard/theme.ts + definitions.ts
src/automotive/themes.ts + definitions.ts
src/diagram/theme.ts + primitives.ts
```

**Renderer matrix per phase:**

| Renderer | Styling mechanism |
|----------|-------------------|
| HTML | `lightdraw.css` + `htmlComponents.ts` |
| Canvas | `theme.ts` tokens in `definitions.ts` |
| SVG | Same tokens; stroke/fill on shapes |
| Legacy ES5 | Same CSS file; test in older WebView profile |

---

## Inventory

### UI module — 17 components (core priority)

| Group | Components |
|-------|------------|
| **Forms** | `button`, `label`, `input`, `textarea`, `checkbox`, `toggle`, `radio`, `slider`, `progressBar` |
| **Surfaces** | `card`, `tabs`, `accordion`, `toolbar`, `statusBar` |
| **Overlays** | `dialog`, `menu`, `tooltip`, `toast` |
| **Data** | `table`, `tree` |

### Dashboard module — 16 widgets

`gauge`, `speedometer`, `lineChart`, `areaChart`, `barChart`, `pieChart`, `legend`, `thermometer`, `compass`, `calendar`, `timeline`, `signalStrength`, `knob`, `meter`, `battery`, `clock`

### Automotive module — 15 widgets

`speedometer`, `tachometer`, `engineTemp`, `batteryVoltage`, `tpms`, `fuelGauge`, `gearIndicator`, `turnIndicators`, `warningLamp`, `parkingBrake`, `headlights`, `cruiseControl`, `canViewer`, `adasStatus`, `instrumentCluster`

### Diagram module — 9 types

`flowchart`, `stateMachine`, `classDiagram`, `mindMap`, `networkTopology`, `orgChart`, `electricalSchematic`, `canNetwork`, `processPipeline`

---

## Phase exit checklist (every UI phase)

Run before closing any phase:

```bash
npm run build
npm run typecheck
npm run lint
npm test -- test/phase6.test.ts test/renderers/html.test.ts   # UI-focused
npm run test:coverage -- --exclude test/perf.test.ts          # maintain ≥95%
```

**Per phase also:**

- [ ] Library CSS/tokens updated (not demo-only hacks)
- [ ] Canvas + HTML renderer parity spot-checked
- [ ] Responsive check: 375px, 768px, 1280px viewports
- [ ] Legacy check: `lightdraw.legacy.js` + CSS in Chromium 49 / ES5 smoke
- [ ] `examples/demo-*.html` updated
- [ ] `website/public/examples/demo-*.html` synced (via `npm run prepare:website` or copy)
- [ ] README screenshot regen if visuals changed: `npm run screenshots:readme`
- [ ] `CHANGELOG.md` + `PROJECT_STATUS.md` updated

**Local full gate (pre-release):** `npm run ci:local`

---

## Phase UI-0 — Foundation & design system

**Duration:** ~1 week  
**Demo:** `examples/demo-ui.html` (theme showcase section only)

### Objectives

- Single source of truth for tokens (CSS variables ↔ `UiThemeTokens` ↔ canvas `UI` object)
- Responsive spacing scale (`--ld-space-xs` … `--ld-space-xl`)
- Breakpoint tokens (`--ld-bp-sm: 480px`, `--ld-bp-md: 768px`, `--ld-bp-lg: 1024px`)
- Legacy CSS pass: autoprefixer audit, `box-sizing`, `-webkit-tap-highlight-color`, flex fallbacks

### Library deliverables

| File | Work |
|------|------|
| `src/styles/lightdraw.css` | Add spacing/breakpoint vars; normalize focus/hover/disabled states globally |
| `src/components/uiTheme.ts` | Map new tokens; add `preset` docs for `default`, `dark`, `violet`, `emerald`, `slate`, `ocean`, `rose` |
| `src/components/theme.ts` | Align canvas colors 1:1 with CSS vars |
| `src/renderers/HTMLRenderer.ts` | Ensure theme survives `render()` / resize |
| `docs/ui-theme-guide.md` | **New** — how to customize without breaking defaults |

### Testing

- `test/renderers/html.test.ts` — theme persistence, dark mode, preset application
- `test/phase6.test.ts` — no regression on all 17 component types
- New: `test/ui/theme-tokens.test.ts` — token map completeness

### Demo updates

- Add **Theme gallery** strip to `demo-ui.html`: light / dark / 4 presets, one button each

---

## Phase UI-1 — Form controls (9 components)

**Duration:** ~1.5 weeks  
**Demo:** `examples/demo-ui.html` → **Forms** section

### Components

`button` · `label` · `input` · `textarea` · `checkbox` · `toggle` · `radio` · `slider` · `progressBar`

### Per-component polish checklist

| Item | Detail |
|------|--------|
| States | default, hover, active, focus-visible, disabled, invalid (where applicable) |
| Sizes | `sm` / `md` / `lg` via props → CSS modifier classes |
| Responsive | Full-width option on `input`/`textarea`; slider track scales with container |
| Legacy | No `gap` dependency; use margins; `-webkit-appearance` resets for inputs |
| Canvas parity | `definitions.ts` draws equivalent visual weight (shadow, radius, label) |

### Library files

- `src/styles/lightdraw.css` — `.lightdraw-btn`, `.lightdraw-field`, `.lightdraw-checkbox`, etc.
- `src/renderers/htmlComponents.ts` — size/variant props, `aria-*`, error state
- `src/components/definitions.ts` — canvas shapes match HTML chrome

### Testing

- `test/phase6.test.ts` — extend: each form control × variants (primary/secondary, sm/lg, disabled)
- `test/renderers/html.test.ts` — native element queries, class modifiers
- Visual: Playwright snapshot `demo-ui-forms.png` (add to `test/visual/`)

### Demo updates

- Form layout grid: all 9 controls with labels, validation example, disabled row
- Mobile stack @ 375px (toolbar wraps, inputs 100% width)

---

## Phase UI-2 — Surfaces & layout (5 components)

**Duration:** ~1 week  
**Demo:** `examples/demo-ui.html` → **Layout** section

### Components

`card` · `tabs` · `accordion` · `toolbar` · `statusBar`

### Polish targets

- **Card** — header band, subtitle, optional actions slot, elevation on hover
- **Tabs** — underline indicator animation, overflow scroll on narrow screens
- **Accordion** — smooth expand chevron, section dividers, keyboard navigation styles
- **Toolbar** — icon+label buttons, separator, wraps on small screens
- **StatusBar** — segmented layout, primary segment highlight, monospace optional

### Library files

- `src/styles/lightdraw.css` — surface components block
- `src/renderers/htmlComponents.ts` — tab indicator DOM, accordion `aria-expanded`

### Testing

- `test/phase6.test.ts` — tabs switch, accordion expand, toolbar render
- a11y: focus order in tabs/accordion (`test/phase11-integration.test.ts`)

### Demo updates

- Dashboard-style layout mock using only UI components (card + tabs + statusBar)

---

## Phase UI-3 — Overlays & feedback (4 components)

**Duration:** ~1 week  
**Demo:** `examples/demo-ui.html` → **Overlays** section

### Components

`dialog` · `menu` · `tooltip` · `toast`

### Polish targets

- **Dialog** — backdrop blur (with solid fallback), centered panel, mobile full-bleed @ 480px
- **Menu** — dropdown shadow, danger item style, click-outside, max-height scroll
- **Tooltip** — arrow/pointer, delay optional, never clip viewport
- **Toast** — slide-in animation (respect `prefers-reduced-motion`), stack position, variants

### Library files

- `src/styles/lightdraw.css` — overlay z-index scale, animations
- `src/renderers/htmlComponents.ts` — dialog focus trap hooks, toast auto-dismiss styling

### Testing

- `test/phase6.test.ts` — dialog open/close, menu select, toast dismiss
- `test/coverage-v09-gate.test.ts` — extend overlay interaction paths

### Demo updates

- Interactive overlay playground: open dialog, menu, show toasts, hover tooltips

---

## Phase UI-4 — Data display (2 components)

**Duration:** ~1 week  
**Demo:** `examples/demo-ui.html` → **Data** section

### Components

`table` · `tree`

### Polish targets

- **Table** — zebra rows, sticky header, sortable header style, horizontal scroll on mobile
- **Tree** — indent guides, expand/collapse icons, selected row highlight

### Library files

- `src/styles/lightdraw.css` — table/tree blocks
- `src/renderers/htmlComponents.ts` — semantic `<table>`, tree `role="tree"`

### Testing

- `test/phase6.test.ts` — table rows, tree nodes render
- Responsive: table `overflow-x: auto` wrapper

### Demo updates

- Sample data table (10 rows) + file-tree sidebar mock

---

## Phase UI-5 — UI module integration & canvas parity

**Duration:** ~1 week  
**Demo:** `examples/demo-ui.html` — full page polish

### Objectives

- All 17 components visually consistent (same radius, shadow, typography)
- Canvas renderer gallery: every component without HTML (embedded targets)
- `uiTheme` JSON round-trip documented
- High-contrast mode polish (`app.setHighContrast(true)`)

### Library deliverables

- `src/components/definitions.ts` — final canvas pass all 17
- `src/styles/lightdraw.css` — `[data-ld-high-contrast]` refinements
- `docs/ui-components-schema.md` — variant/size props for each component

### Testing

- Full `test/phase6.test.ts` (41 tests)
- `test/renderers/html.test.ts` (12 tests)
- `test/renderers/canvas.test.ts` — UI groups render
- Coverage gate ≥ 95%

### Demo updates

- `demo-ui.html` becomes **showcase page**: hero, theme switcher, all sections, responsive sidebar nav
- Sync `website/public/examples/demo-ui.html`
- Regenerate `docs/images/ui-components.png`

---

## Phase UI-6 — Dashboard module

**Duration:** ~2 weeks  
**Demo:** `examples/demo-dashboard.html`

### Widgets (16)

Polish in groups:

| Group | Widgets |
|-------|---------|
| **Gauges** | `gauge`, `speedometer`, `knob`, `meter`, `thermometer`, `compass` |
| **Charts** | `lineChart`, `areaChart`, `barChart`, `pieChart`, `legend` |
| **Status** | `battery`, `signalStrength`, `clock`, `calendar`, `timeline` |

### Approach

- Extend `src/dashboard/theme.ts` (mirror UI token names)
- Shared primitives: `chartPrimitives.ts`, `dialGauge.ts` — consistent typography, grid lines, tooltips
- Responsive: charts reflow `plotWidth` from container; gauges scale with `size` prop
- Legacy: canvas-only (no CSS); test ES5 bundle

### Testing

- `test/phase7.test.ts` — all dashboard widgets
- Chart hover tooltip tests (`chartPrimitives.ts`)
- Perf budget: dashboard render < 45ms (phase7)

### Demo updates

- Live dashboard layout: 2×2 gauges + line chart + bar chart
- Randomize + live feed buttons (existing) with polished toolbar
- Responsive: stack panels on mobile

---

## Phase UI-7 — Automotive module

**Duration:** ~2 weeks  
**Demo:** `examples/demo-automotive.html`

### Widgets (15)

| Group | Widgets |
|-------|---------|
| **Dials** | `speedometer`, `tachometer`, `engineTemp`, `fuelGauge`, `batteryVoltage` |
| **Indicators** | `tpms`, `gearIndicator`, `turnIndicators`, `warningLamp`, `parkingBrake`, `headlights`, `cruiseControl`, `adasStatus` |
| **Data** | `canViewer` |
| **Composite** | `instrumentCluster` |

### Approach

- `src/automotive/themes.ts` — classic / sport / digital palettes refined
- `instrumentCluster` layout responsive to `width`/`height` props
- TPMS, lamps, ADAS — consistent panel chrome (match dashboard card style)
- Legacy: ES5 + canvas; no CSS dependency

### Testing

- `test/phase8.test.ts` — all automotive widgets + cluster
- Theme switching test
- `sampleDriveFrames` animation smoothness

### Demo updates

- Theme selector + drive simulation (existing) with polished chrome
- Show individual widgets grid + full cluster tab
- Regenerate `docs/images/automotive.png`

---

## Phase UI-8 — Diagram module

**Duration:** ~2 weeks  
**Demo:** `examples/demo-diagram.html`

### Types (9)

All diagram factories in `src/diagram/definitions.ts` + `primitives.ts`

### Approach

- Canvas-native theming (already started in `diagram/theme.ts`)
- Responsive auto-layout: tighter grids on small canvases
- Print-friendly stroke widths
- Edge labels, node shadows consistent across types

### Testing

- `test/phase9.test.ts` — all 9 types
- Connector routing visual sanity
- `test/coverage-v09-gate.test.ts` — primitives/connectors

### Demo updates

- Sidebar diagram picker (existing) with polished chrome matching `demo-common.css`
- Default canvas size responsive to viewport
- Regenerate `docs/images/diagram.png`

---

## Phase UI-9 — Cross-module polish & legacy hardening

**Duration:** ~1.5 weeks  
**Demo:** `website/index.html` playground + all demos

### Objectives

- Shared `demo-common.css` aligned with library tokens (import vars from lightdraw.css where possible)
- Animation demos: easing showcase with library styling
- Export / a11y demos: consistent header/toolbar
- **Legacy matrix:**

| Target | Test |
|--------|------|
| `lightdraw.legacy.js` | All UI components render (HTML renderer) |
| Chromium 49 WebView profile | CSS flex + vars fallbacks |
| `prefers-reduced-motion` | No transform animations |
| `prefers-color-scheme: dark` | Auto dark if no explicit theme |

### Testing

- `test/phase12-legacy.test.ts`
- `test/visual/smoke.spec.ts` — update golden screenshots
- `npm run benchmark:local` — no regression

### Demo updates

- Full playground (`website/index.html`) iframe heights responsive
- All 8 demo pages pass visual smoke

---

## Phase UI-10 — Documentation, release & maintenance

**Duration:** ~1 week

### Deliverables

- `docs/ui-theme-guide.md` — customization without mandatory CSS
- `docs/responsive-guide.md` — breakpoints, fluid layouts, `width` props
- `docs/legacy-ui-guide.md` — ES5 + CSS compatibility table
- Update `README.md` screenshots
- `CHANGELOG.md` v1.0.0 UI polish section
- Optional: Storybook-style single-page `examples/demo-ui-catalog.html` (all components, all variants)

### Testing

- `npm run ci:local`
- `npm run test:ci:visual`
- Coverage ≥ 95%

---

## Timeline summary

| Phase | Focus | Components | Demo page |
|-------|-------|------------|-----------|
| **UI-0** | Design system foundation | Tokens, breakpoints, legacy CSS | `demo-ui` theme strip |
| **UI-1** | Form controls | 9 | `demo-ui` forms |
| **UI-2** | Surfaces & layout | 5 | `demo-ui` layout |
| **UI-3** | Overlays | 4 | `demo-ui` overlays |
| **UI-4** | Data display | 2 | `demo-ui` data |
| **UI-5** | UI integration | All 17 | `demo-ui` full showcase |
| **UI-6** | Dashboard | 16 widgets | `demo-dashboard` |
| **UI-7** | Automotive | 15 widgets | `demo-automotive` |
| **UI-8** | Diagram | 9 types | `demo-diagram` |
| **UI-9** | Cross-module + legacy | All | playground + all demos |
| **UI-10** | Docs & release | — | README + docs |

**Estimated total:** ~14–16 weeks (can parallelize UI-6/7/8 after UI-5)

---

## Customization contract (for end users)

End users get professional UI **without** writing CSS:

```javascript
// 1. Default — just works
const app = LightDraw.createApp('#app', { renderer: 'html' });
app.loadJSON({ type: 'button', props: { label: 'Save', variant: 'primary' } });

// 2. Programmatic theme (no CSS file edits)
app.setUiTheme({ preset: 'violet', mode: 'dark' });

// 3. Optional CSS override (only when needed)
// .lightdraw-html-root { --ld-primary: #7c3aed; }
```

**We never require step 3** for a polished result.

---

## Success criteria (program complete)

- [ ] All **17 UI components** pass visual review at 375px, 768px, 1280px
- [ ] All **dashboard / automotive / diagram** widgets match design system quality
- [ ] `lightdraw.min.css` is the only stylesheet needed for HTML renderer
- [ ] `lightdraw.legacy.js` + CSS works in ES5 targets
- [ ] Every phase demo page updated and synced to website
- [ ] Tests ≥ 95% coverage maintained
- [ ] `npm run ci:local` green before v1.0.0 tag

---

## Next step

Start **Phase UI-0** (foundation tokens + theme guide + demo theme strip).

When ready to implement, say: *"Start Phase UI-0"* and we work library-first with tests and demo updates in the same PR.
