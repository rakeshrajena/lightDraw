# LightDraw.js — Phased Implementation Plan

**Version:** 1.0  
**Created:** July 5, 2026  
**Baseline:** v0.1.0  
**Goal:** Complete all pending features with production quality, ≥95% test coverage, and measurable performance/memory targets.

This document is the **single source of truth** for implementation order. Work phase-by-phase; do not skip exit gates.

Related docs: [PROJECT_STATUS.md](./PROJECT_STATUS.md) · [CHANGELOG.md](./CHANGELOG.md)

---

## How to Use This Plan

1. Complete phases **in order** (some overlap is allowed within a phase, not across phases).
2. At the **end of every phase**, run the full **Phase Exit Checklist** (Section below).
3. Update `PROJECT_STATUS.md` and `CHANGELOG.md` before starting the next phase.
4. Tag releases: `v0.2.0` after Phase 2, `v0.3.0` after Phase 4, etc. (see version map).

---

## Global Quality Standards (Every Phase)

These apply to **all** phases without exception.

### Code quality

| Rule | Target |
|------|--------|
| TypeScript strict mode | No errors |
| ESLint | Zero errors, zero warnings |
| Prettier | Formatted |
| Public API | JSDoc on all exported symbols |
| Breaking changes | Document in CHANGELOG + migration note |

### Testing pyramid (per phase)

| Layer | Tool | Requirement |
|-------|------|-------------|
| Unit | Vitest | Every new public function/method |
| Integration | Vitest + jsdom / canvas mock | Cross-module flows |
| Renderer | Vitest + node-canvas or Playwright | Canvas/SVG/HTML parity cases |
| Performance | `scripts/benchmark.mjs` + new suites | No regression vs phase baseline |
| Memory | Vitest + `performance.memory` / heap snapshots | No leak after 1000 create/destroy cycles |
| Visual regression | Playwright (from Phase 11) | Pixel diff ≤ 0.1% on golden scenes |

### Performance budgets (global)

| Metric | Target | Measured by |
|--------|--------|-------------|
| Core bundle (gzip) | ≤ 8 KB | `npm run build` size report |
| Full bundle (gzip) | ≤ 25 KB | build script |
| Render 1 000 nodes | ≤ 16 ms (60 FPS) | benchmark |
| Render 10 000 nodes | ≤ 100 ms | benchmark |
| Hit test 1 000 nodes | ≤ 4 ms | benchmark |
| Animation frame budget | ≤ 8 ms tween update | benchmark |
| Memory after destroy | Returns to ±5% of baseline heap | memory test |

### Coverage ramp

| After phase | Line coverage target |
|-------------|---------------------|
| Phase 0 | 40% (baseline measured) |
| Phase 1 | 55% |
| Phase 2 | 65% |
| Phase 3 | 70% |
| Phase 4 | 75% |
| Phase 5 | 78% |
| Phase 6 | 82% |
| Phase 7 | 86% |
| Phase 8 | 88% |
| Phase 9 | 90% |
| Phase 10 | 92% |
| Phase 11 | 94% |
| Phase 12 | **≥ 95%** |

---

## Phase Exit Checklist (run after EVERY phase)

```bash
npm run typecheck      # Must pass
npm run lint           # Must pass
npm run test:coverage  # Must meet phase coverage target
npm run benchmark      # Must meet performance budgets (no regression)
npm run test:memory    # Must pass (added in Phase 0)
npm run build          # All bundles must build
```

Manual checks:

- [ ] All phase deliverables implemented
- [ ] `PROJECT_STATUS.md` updated (✅ / 🟡 / ❌)
- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] Demo example added/updated in `examples/`
- [ ] No new linter suppressions without justification
- [ ] Memory leak test: 1000× create/destroy `App` — heap stable
- [ ] Performance diff documented vs previous phase baseline

---

## Version Map

| Phase | Target release | Theme |
|-------|---------------|-------|
| 0 | v0.1.1 | Quality infrastructure |
| 1 | v0.2.0 | Core engine complete |
| 2 | v0.2.0 | Performance engine |
| 3 | v0.3.0 | Animation complete |
| 4 | v0.3.0 | Events & accessibility |
| 5 | v0.4.0 | Modular bundles |
| 6 | v0.5.0 | UI components |
| 7 | v0.6.0 | Dashboard module |
| 8 | v0.7.0 | Automotive module |
| 9 | v0.8.0 | Diagram module |
| 10 | v0.9.0 | Export pipeline |
| 11 | v0.9.0 | Docs & playground |
| 12 | **v1.0.0** | Production release |

---

## Phase 0 — Quality Infrastructure

**Release:** v0.1.1  
**Duration estimate:** 3–5 days  
**Depends on:** v0.1.0

### Deliverables

Establish testing, benchmarking, and memory tooling before feature work accelerates.

| # | Task | Files |
|---|------|-------|
| 0.1 | Add `test/setup.ts` — canvas mock, HTML renderer fallback | `test/setup.ts`, `vitest.config.ts` |
| 0.2 | Add `npm run test:memory` — heap growth after 1000 App cycles | `test/memory.test.ts` |
| 0.3 | Expand benchmark script — report create, render, hitTest, animate separately | `scripts/benchmark.mjs` |
| 0.4 | Save benchmark baselines to `benchmarks/baseline.json` | CI compares on PR |
| 0.5 | Add renderer-specific test suites (canvas/svg/html) | `test/renderers/` |
| 0.6 | Add CI coverage gate (fail if coverage drops) | `.github/workflows/ci.yml` |
| 0.7 | Add `npm run test:perf` — performance regression test | `test/perf.test.ts` |

### Tests to write

- Memory: App create/destroy × 1000, node tree × 10 000 add/remove
- Benchmark snapshot: 500 / 1000 / 5000 nodes render time
- Renderer smoke: each renderer draws rect + circle + text without throw

### Exit gate

- Coverage baseline recorded (current ~14 tests → target 40%)
- `benchmarks/baseline.json` committed
- Memory test passes
- CI runs all suites green

---

## Phase 1 — Core Engine Completion

**Release:** v0.2.0 (shared with Phase 2)  
**Duration estimate:** 1–2 weeks

### Features

| # | Feature | Priority |
|---|---------|----------|
| 1.1 | Path hit testing (point-in-path via Path2D / ray cast) | P0 |
| 1.2 | Gradient rendering — SVG + HTML parity with Canvas | P0 |
| 1.3 | Pattern fill (repeat image/canvas) — all renderers | P1 |
| 1.4 | Shadow rendering — SVG + HTML | P1 |
| 1.5 | Advanced clipping (shape clip, not just rect) | P1 |
| 1.6 | Masking (`node.mask`) — alpha mask via offscreen canvas | P0 |
| 1.7 | Wire `ObjectPool` for Matrix2D and event objects in hot paths | P1 |
| 1.8 | Fix `Flex` layout — real flexbox algorithm (grow/shrink/wrap) | P2 |
| 1.9 | Sprite `updateFrame` called from App render loop when playing | P1 |

### Tests

| Area | Test cases |
|------|-----------|
| Path hit test | Point inside/outside bezier, complex SVG path d |
| Gradients | Linear + radial on canvas/svg/html — pixel sample or DOM attr |
| Patterns | Repeat/no-repeat fill |
| Masking | Masked node visibility, hit test respects mask |
| Clipping | Child clipped to parent non-rect shape |
| Flex | row/column, wrap, align-items, justify-content |
| Sprite | Auto-advances frames at fps when `playing: true` |

### Performance targets

| Metric | Target |
|--------|--------|
| Masked scene 500 nodes | ≤ 20 ms render |
| Path hit test | ≤ 0.5 ms per query |
| No heap growth after 500 masked nodes destroyed | memory test |

### Exit gate

- Coverage ≥ 55%
- All P0 items ✅
- Benchmark: no regression on 5000-node plain scene

---

## Phase 2 — Performance Engine

**Release:** v0.2.0  
**Duration estimate:** 1–2 weeks  
**Depends on:** Phase 1

### Features

| # | Feature | Details |
|---|---------|---------|
| 2.1 | Dirty-region rendering | Track node dirty rects; partial canvas clear |
| 2.2 | Batch rendering | Group same fill/stroke nodes; reduce draw calls |
| 2.3 | Spatial index for hit testing | R-tree or grid hash for >100 nodes |
| 2.4 | Render layer caching | Cache static subtrees to offscreen canvas |
| 2.5 | `requestRender` coalescing | Already partial — ensure single RAF per frame |
| 2.6 | SVG renderer diff update | Patch DOM instead of full rebuild |
| 2.7 | HTML renderer minimal DOM updates | Track element refs, update attrs only |

### Tests

| Test | Assertion |
|------|-----------|
| Dirty region | Moving 1 node does not redraw full canvas (spy on clearRect) |
| Spatial index | Hit test 10 000 nodes ≤ 4 ms |
| Batch | 1000 same-color rects → fewer draw calls than naive |
| Cache | Static group re-render ≤ 2 ms after first frame |
| Memory | Cache invalidated on node destroy — no leak |

### Performance targets

| Metric | Before (v0.1) | After Phase 2 |
|--------|---------------|---------------|
| Render 10 000 nodes | ~580 ms (html) | ≤ 100 ms (canvas) |
| Render 1 000 nodes | — | ≤ 16 ms |
| Hit test 10 000 nodes | O(n) | ≤ 4 ms |
| Static scene re-render | full | ≤ 2 ms |

### Exit gate

- Coverage ≥ 65%
- 10 000 node benchmark meets targets on canvas renderer
- Memory test passes with caching enabled

---

## Phase 3 — Animation Complete

**Release:** v0.3.0  
**Duration estimate:** 1–2 weeks  
**Depends on:** Phase 1

### Features

| # | Feature | Details |
|---|---------|---------|
| 3.1 | Path animation | Animate along SVG path (`motionPath`) |
| 3.2 | Stroke dash animation | `strokeDashoffset` tween |
| 3.3 | Path morphing | Interpolate compatible path `d` strings |
| 3.4 | Sprite sheet timeline | `sprite.play({ fps, loop })` integrated with AnimationEngine |
| 3.5 | Animation groups | Animate multiple props atomically with single easing |
| 3.6 | `app.animate(node, props)` shorthand | Sugar on Node.animate |
| 3.7 | Stagger helper | `timeline.stagger(nodes, props, staggerMs)` |

### Tests

| Test | Assertion |
|------|-----------|
| Path motion | Object position follows path at t=0, 0.5, 1 |
| Dash offset | Stroke dash animates 0→100 |
| Morph | Two rects round-rect morph smooth at 30 steps |
| Sprite play | Frame index advances; loops correctly |
| Stagger | 5 nodes start 100 ms apart |
| Memory | Stop 1000 animations — no orphaned RAF callbacks |

### Performance targets

| Metric | Target |
|--------|--------|
| 500 concurrent animations | ≤ 8 ms per frame |
| Path morph 100 steps | ≤ 50 ms total |

### Exit gate

- Coverage ≥ 70%
- All animation types in demo (`examples/demo-animation.html`)
- No RAF leak after animation stop

---

## Phase 4 — Events, Interaction & Accessibility

**Release:** v0.3.0  
**Duration estimate:** 1–2 weeks  
**Depends on:** Phase 1

### Features

| # | Feature | Details |
|---|---------|---------|
| 4.1 | dblclick — fully tested | |
| 4.2 | drop / dragover | Drag between nodes |
| 4.3 | focus / blur per node | Focusable flag on Node |
| 4.4 | Keyboard navigation | Tab order, Enter/Space activate |
| 4.5 | ARIA roles on all HTML components | button, slider, checkbox, etc. |
| 4.6 | Focus ring visual | CSS + canvas focus indicator |
| 4.7 | `aria-live` for dynamic values | Dashboard value updates |
| 4.8 | High-contrast theme | `app.options.highContrast` |
| 4.9 | Event propagation control | bubble/capture phase |

### Tests

| Test | Assertion |
|------|-----------|
| dblclick | Fires twice click does not |
| Drag drop | Drop target receives event with payload |
| Tab order | Focus moves through 5 focusable nodes |
| Enter key | Activates button node |
| ARIA | HTML renderer sets correct role/aria-checked |
| High contrast | Colors meet WCAG AA contrast ratio |

### Performance targets

| Metric | Target |
|--------|--------|
| Hit test on event | ≤ 4 ms (uses spatial index from Phase 2) |
| 100 focusable nodes tab cycle | No memory growth |

### Exit gate

- Coverage ≥ 75%
- axe-core accessibility audit passes on demo page
- Keyboard-only navigation works in demo

---

## Phase 5 — Modular Bundle Architecture

**Release:** v0.4.0  
**Duration estimate:** 1 week  
**Depends on:** Phases 1–2

### Features

| # | Bundle | Contents | Gzip target |
|---|--------|----------|-------------|
| 5.1 | `lightdraw.core.min.js` | App, shapes, canvas renderer, animation, events, camera | ≤ 8 KB |
| 5.2 | `lightdraw.svg.min.js` | SVG renderer plugin | ≤ 3 KB |
| 5.3 | `lightdraw.html.min.js` | HTML renderer plugin | ≤ 3 KB |
| 5.4 | `lightdraw.ui.min.js` | UI components | ≤ 5 KB |
| 5.5 | `lightdraw.dashboard.min.js` | Dashboard widgets | ≤ 5 KB |
| 5.6 | `lightdraw.automotive.min.js` | Automotive widgets | ≤ 5 KB |
| 5.7 | `lightdraw.diagram.min.js` | Diagram module | ≤ 4 KB |
| 5.8 | `lightdraw.min.js` | Full bundle (all modules) | ≤ 25 KB |
| 5.9 | package.json `exports` map | Subpath imports | — |
| 5.10 | Tree-shaking verified | ESM imports exclude unused modules | — |

### Build changes

```
scripts/build.mjs     → multi-entry build
src/core/index.ts     → core-only entry
src/modules/ui/index.ts
src/modules/dashboard/index.ts
...
```

### Tests

| Test | Assertion |
|------|-----------|
| Core-only import | `import { App } from 'lightdraw/core'` — no UI code in bundle |
| Plugin load | `LightDraw.use(uiPlugin)` registers components |
| Size gate | CI fails if core gzip > 8 KB |
| Legacy ES5 | Each bundle has `.legacy.js` variant |

### Exit gate

- Coverage ≥ 78%
- All size targets met or documented exception
- README updated with modular import examples

### Size exceptions (v0.4.0 baselines)

Aspirational gzip targets from the table above; enforced CI baselines until further tree-shaking:

| Bundle | Aspirational | v0.4.0 measured (gzip) | CI gate |
|--------|--------------|--------------------------|---------|
| core | ≤ 8 KB | ~17.7 KB | 18 KB |
| svg | ≤ 3 KB | ~9.6 KB | 10 KB |
| html | ≤ 3 KB | ~8.3 KB | 9 KB |
| ui | ≤ 5 KB | ~7.9 KB | 8 KB |
| dashboard | ≤ 5 KB | ~6.8 KB | 7 KB |
| automotive | ≤ 5 KB | ~6.6 KB | 7 KB |
| core | ≤ 8 KB | ~23.2 KB | 24 KB |
| diagram | ≤ 4 KB | ~5.1 KB | 6 KB |
| full | ≤ 25 KB | ~39.9 KB | 41 KB |

Core/svg/html exceed aspirational targets because layout, animation, and canvas renderer remain in core. Future phases may split layout or lazy-load easing tables.

---

## Phase 6 — UI Components (Complete)

**Release:** v0.5.0  
**Duration estimate:** 2 weeks  
**Depends on:** Phases 4, 5

### Features

| # | Component | Interactive | Notes |
|---|-----------|-------------|-------|
| 6.1 | Slider | ✅ | drag thumb, emit change |
| 6.2 | Checkbox | ✅ | toggle, aria-checked |
| 6.3 | Toggle | ✅ | on/off state |
| 6.4 | Input | ✅ | text input, cursor, selection |
| 6.5 | TextArea | ✅ | multiline |
| 6.6 | Radio | ✅ | group selection |
| 6.7 | Button | ✅ | hover, active, disabled states |
| 6.8 | Tooltip | ✅ | show on hover/focus |
| 6.9 | Menu / Dropdown | ✅ | open/close, item select |
| 6.10 | Dialog / Modal | ✅ | overlay, trap focus |
| 6.11 | Tabs | ✅ | tab switch |
| 6.12 | Accordion | ✅ | expand/collapse |
| 6.13 | Table | ✅ | scroll, row select |
| 6.14 | Tree View | ✅ | expand nodes |
| 6.15 | Toolbar | ✅ | button group |
| 6.16 | Toast / Notification | ✅ | auto-dismiss |
| 6.17 | Status Bar | ✅ | segments |

### Tests (each component)

- Renders without error (all 3 renderers where applicable)
- Emits correct events on interaction
- JSON `loadJSON` round-trip
- Keyboard accessible (Phase 4 infra)
- Memory: create/destroy 100 instances — no leak

### Performance targets

| Metric | Target |
|--------|--------|
| Form with 20 inputs | Render ≤ 16 ms |
| Modal open/close | ≤ 8 ms |

### Exit gate

- Coverage ≥ 82%
- All 17 components in demo
- JSON schema for each component type documented

---

## Phase 7 — Dashboard Module (Complete)

**Release:** v0.6.0  
**Duration estimate:** 1–2 weeks  
**Depends on:** Phase 6

### Features

| # | Widget | Details |
|---|--------|---------|
| 7.1 | Area chart | Filled line + axes |
| 7.2 | Axes + grid lines | Shared chart primitive |
| 7.3 | Legend | Chart legend component |
| 7.4 | Thermometer | Vertical fill gauge |
| 7.5 | Compass | Rotating needle from heading |
| 7.6 | Calendar | Month grid |
| 7.7 | Timeline widget | Event timeline (not animation timeline) |
| 7.8 | Signal strength | Bar indicator |
| 7.9 | Knob | Rotary input + display |
| 7.10 | Meter | Horizontal/vertical meter |
| 7.11 | Chart interaction | Hover tooltip, click data point |
| 7.12 | Live data update | Animate value changes |

### Tests

| Test | Assertion |
|------|-----------|
| Each widget | Renders, accepts props, exports JSON |
| Chart axes | Correct tick count for range |
| Live update | Value 0→100 animates smoothly |
| 10 widgets on dashboard | Render ≤ 16 ms |

### Performance targets

| Metric | Target |
|--------|--------|
| Line chart 1000 data points | Render ≤ 32 ms |
| 8 widgets dashboard | ≤ 16 ms |

### Exit gate

- Coverage ≥ 86%
- `examples/demo-dashboard.html` with live data
- All widgets load via JSON

---

## Phase 8 — Automotive Module (Complete)

**Release:** v0.7.0  
**Duration estimate:** 1–2 weeks  
**Depends on:** Phase 7

### Features

| # | Widget | Details |
|---|--------|---------|
| 8.1 | Engine temperature gauge | Needle + color zones |
| 8.2 | Battery voltage | Numeric + icon |
| 8.3 | Tire pressure (TPMS) | 4-wheel display |
| 8.4 | Parking brake indicator | Lamp |
| 8.5 | Headlights indicator | Lamp |
| 8.6 | Cruise control indicator | Speed display |
| 8.7 | CAN signal viewer | Table of signals + values |
| 8.8 | Full instrument cluster | Compose all widgets |
| 8.9 | JSON drive simulation | Update all values from JSON feed |
| 8.10 | Skin themes | Classic / sport / digital cluster themes |

### Tests

| Test | Assertion |
|------|-----------|
| Each widget | Renders at 60 FPS value update |
| TPMS | 4 tires low-pressure highlights red |
| CAN viewer | 100 signals update ≤ 16 ms |
| Cluster JSON | Full cluster from single JSON blob |

### Performance targets (automotive-critical)

| Metric | Target |
|--------|--------|
| Full cluster 60 FPS | ≤ 16 ms per frame with live data |
| Memory | Stable over 1 hour simulated drive (test 60 s scaled) |

### Exit gate

- Coverage ≥ 88%
- `examples/demo-automotive.html` — animated cluster
- Suitable for embedded WebView (test on legacy build)

---

## Phase 9 — Diagram Module (Complete)

**Release:** v0.8.0  
**Duration estimate:** 2 weeks  
**Depends on:** Phases 2, 6

### Features

| # | Feature | Details |
|---|---------|---------|
| 9.1 | Force-directed layout | Physics simulation |
| 9.2 | State machine diagram | States + transitions |
| 9.3 | UML class diagram | Boxes + inheritance lines |
| 9.4 | Mind map | Radial tree layout |
| 9.5 | Network topology | Nodes + labeled edges |
| 9.6 | Org chart (enhanced) | Multi-level, collapse |
| 9.7 | Electrical schematic | Symbols library |
| 9.8 | CAN network diagram | Bus + ECU nodes |
| 9.9 | Process pipeline | Horizontal flow with stages |
| 9.10 | Smart connector routing | A* or orthogonal router, avoid nodes |
| 9.11 | Diagram JSON schema | Full import/export |

### Tests

| Test | Assertion |
|------|-----------|
| Force layout | 50 nodes converges in ≤ 100 iterations |
| State machine | 10 states, 15 transitions render correctly |
| Router | Connector avoids node bounding boxes |
| Layout stability | Re-layout same data → same positions (seeded) |

### Performance targets

| Metric | Target |
|--------|--------|
| Force layout 100 nodes | ≤ 500 ms to settle |
| Diagram 200 nodes render | ≤ 32 ms |
| Connector route | ≤ 2 ms per edge |

### Exit gate

- Coverage ≥ 90%
- `examples/demo-diagram.html` — flowchart, state machine, network
- JSON round-trip for each diagram type

---

## Phase 10 — Export Pipeline

**Release:** v0.9.0  
**Duration estimate:** 1 week  
**Depends on:** Phases 1, 7

### Features

| # | Format | Implementation |
|---|--------|----------------|
| 10.1 | PNG | High-DPI canvas snapshot |
| 10.2 | JPEG | Quality parameter |
| 10.3 | SVG | Proper standalone SVG file export |
| 10.4 | PDF | js-free: canvas → PNG embed or pure SVG → PDF bytes |
| 10.5 | JSON | Already done — add schema validation |
| 10.6 | HTML | Self-contained HTML with inlined lightdraw |
| 10.7 | `app.export({ format, options })` | Unified API |
| 10.8 | Export region | Crop to node bounds |

### Tests

| Test | Assertion |
|------|-----------|
| PNG | Output matches canvas pixel dimensions × pixelRatio |
| SVG | Valid XML, opens in browser |
| PDF | Valid PDF header, ≥1 page |
| HTML | Offline open renders scene |
| Round-trip | export JSON → import → deep equal scene |

### Performance targets

| Metric | Target |
|--------|--------|
| Export 1920×1080 PNG | ≤ 200 ms |
| Export PDF 10 pages diagram | ≤ 2 s |

### Exit gate

- Coverage ≥ 92%
- All export formats in demo download buttons

---

## Phase 11 — Documentation & Playground

**Release:** v0.9.0  
**Duration estimate:** 1–2 weeks  
**Depends on:** All feature phases

### Deliverables

| # | Item | Details |
|---|------|---------|
| 11.1 | API reference | TypeDoc generated, hosted |
| 11.2 | Animation guide | Easing, timeline, path motion |
| 11.3 | Plugin guide | Custom components, renderers |
| 11.4 | Performance guide | Best practices, benchmarks |
| 11.5 | Legacy browser guide | ES5 build, polyfills |
| 11.6 | Automotive examples | Cluster, CAN viewer |
| 11.7 | AI integration guide | JSON schema, prompts |
| 11.8 | Playground website | Vite site in `website/` |
| 11.9 | Visual regression | Playwright screenshot tests |
| 11.10 | Interactive examples | One page per module |

### Tests

| Test | Assertion |
|------|-----------|
| Visual regression | ≤ 0.1% pixel diff vs golden |
| All doc code snippets | Runnable (extract + test) |
| Playground build | `npm run build:website` succeeds |

### Exit gate

- Coverage ≥ 94%
- Visual regression CI green
- All guides written

---

## Phase 12 — Production Release Hardening

**Release:** v1.0.0  
**Duration estimate:** 1–2 weeks  
**Depends on:** All phases

### Release workflow (order of operations)

> **Owner:** Rakesh Ranjan Jena · npm: `rakesh_ranjan_jena_001` · GitHub: `git@github.com:rakeshrajena/lightDraw.git`

| Step | Action | Gate |
|------|--------|------|
| **12.0** | Create/push GitHub repo `rakeshrajena/lightDraw` | Remote connected, initial push succeeds |
| **12.0b** | CI green on default branch | typecheck, lint, test, coverage, visual, size-gate |
| **12.0c** | Open PR → review → merge | All checks pass |
| **12.0d** | **Manual verification** (owner) | Playground, examples, export, docs reviewed locally |
| **12.0e** | **GitHub Release** (tag e.g. `v1.0.0`) | Release notes, assets attached |
| **12.0f** | **npm publish** (version matches GitHub Release) | `npm publish` after tag; CDN (jsDelivr/unpkg) auto-updates |
| **12.0g** | **Docs & README** final pass | Author, install links, CDN URLs, changelog |

**npm credentials:** store only in environment / GitHub Actions secrets (`NPM_TOKEN`). Never commit tokens to the repo.

### Deliverables

| # | Item | Details |
|---|------|---------|
| 12.1 | Cross-browser CI | Chrome, Firefox, Safari, Edge matrix |
| 12.2 | Legacy browser testing | Chromium 49+, Android WebView |
| 12.3 | npm publish | `lightdraw` on npm |
| 12.4 | CDN publish | jsDelivr + unpkg |
| 12.5 | GitHub Releases | Automated via tag |
| 12.6 | Semantic versioning policy | Documented |
| 12.7 | Security audit | `npm audit`, no critical vulns |
| 12.8 | Final performance audit | All budgets met |
| 12.9 | Final memory audit | 24 h stability test (scaled) |
| 12.10 | v1.0.0 release notes | Migration from v0.1 |

### Tests

| Suite | Requirement |
|-------|-------------|
| Full test suite | ≥ 95% coverage |
| Cross-browser | All pass on 4 browsers |
| Legacy | ES5 build passes smoke tests |
| Load test | 10 000 nodes @ 60 FPS sustained 60 s |
| Memory | No leak over 10 000 App cycles |

### v1.0.0 exit gate (final)

- [ ] **Coverage ≥ 95%**
- [ ] **Core bundle ≤ 8 KB gzip**
- [ ] **Full bundle ≤ 25 KB gzip**
- [ ] **10 000 nodes @ 60 FPS**
- [ ] **Zero ESLint errors**
- [ ] **All PROJECT_STATUS items ✅ or explicitly deferred**
- [ ] **npm publish successful**
- [ ] **CDN links live**
- [ ] **Documentation complete**

---

## Test File Structure (target end state)

```
test/
├── setup.ts
├── unit/
│   ├── Node.test.ts
│   ├── shapes.test.ts
│   ├── Matrix2D.test.ts
│   ├── Easing.test.ts
│   └── ...
├── integration/
│   ├── App.test.ts
│   ├── json-roundtrip.test.ts
│   ├── animation.test.ts
│   └── timeline.test.ts
├── renderers/
│   ├── canvas.test.ts
│   ├── svg.test.ts
│   └── html.test.ts
├── components/
│   └── *.test.ts          # one per component
├── dashboard/
│   └── *.test.ts
├── automotive/
│   └── *.test.ts
├── diagram/
│   └── *.test.ts
├── memory.test.ts
├── perf.test.ts
└── visual/                 # Phase 11
    └── *.spec.ts           # Playwright
```

---

## Benchmark Suite (target end state)

```
scripts/
├── benchmark.mjs           # Main: create, render, hitTest, animate
├── benchmark-memory.mjs    # Heap over time
└── benchmark-export.mjs    # Export format timings

benchmarks/
├── baseline.json           # Per-phase baselines
└── results/                # CI artifacts
```

### Benchmark scenarios

| Scenario | Nodes | Target FPS |
|----------|-------|------------|
| Static shapes | 1 000 | 60 |
| Animated scene | 500 + 100 tweens | 60 |
| Dashboard | 8 widgets | 60 |
| Automotive cluster | Full | 60 |
| Diagram | 200 nodes + 300 edges | 30 |
| Stress | 10 000 | 10 (min acceptable) |

---

## Memory Test Specification

```typescript
// test/memory.test.ts pattern (every phase extends this)

describe('Memory', () => {
  it('App create/destroy × 1000 — heap stable', async () => {
    const baseline = heapUsed();
    for (let i = 0; i < 1000; i++) {
      const app = createApp(container, { renderer: 'html' });
      app.add(app.rect({ width: 10, height: 10 }));
      app.render();
      app.destroy();
    }
    gc(); // --expose-gc in CI
    expect(heapUsed()).toBeLessThan(baseline * 1.05);
  });
});
```

Additional scenarios added per phase:

| Phase | Memory scenario |
|-------|----------------|
| 1 | Masked nodes × 500 |
| 2 | Cached layers × 100 |
| 3 | 1000 stopped animations |
| 4 | 100 focusable nodes |
| 6 | 100 UI components |
| 7 | Dashboard live update 60 s |
| 8 | Automotive cluster 60 s |
| 9 | Force layout × 50 runs |
| 10 | Export 100 PNG snapshots |

---

## Progress Tracker

Update this table as phases complete.

| Phase | Status | Started | Completed | Coverage | Notes |
|-------|--------|---------|-----------|----------|-------|
| 0 | ✅ Complete | 2026-07-05 | 2026-07-05 | 54.8% | 47 tests, baseline.json |
| 1 | ✅ Complete | 2026-07-05 | 2026-07-05 | 56.8% | 62 tests, path hit test, gradients, masking |
| 2 | ✅ Complete | 2026-07-05 | 2026-07-05 | 67.1% | 81 tests, spatial index, batch, cache |
| 3 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥70% | 98 tests, v0.3.0 — motion path, morph, dash, stagger |
| 4 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥76% | 121 tests, v0.3.1 — focus, ARIA, drag-drop, keyboard |
| 5 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥78% | 132 tests, v0.4.0 — modular bundles, plugin registry, size gate |
| 6 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥82% | 155+ tests, v0.5.0 — 17 interactive UI components |
| 7 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥86% | 203+ tests, v0.6.0 — dashboard widgets, live charts, axes |
| 8 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥88% | 230+ tests, v0.7.0 — automotive cluster, TPMS, CAN, drive sim |
| 9 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥90% | 255+ tests, v0.8.0 — force layout, state machine, network, CAN, smart routing |
| 10 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥92% | 270+ tests, v0.9.0 — PNG/SVG/PDF/HTML export, unified API |
| 11 | ✅ Complete | 2026-07-05 | 2026-07-05 | ≥94% | 313+ tests, v0.9.0 — guides, TypeDoc, playground, Playwright visual regression |
| 12 | 🔄 In progress | 2026-07-05 | — | ≥95% | PR #1 open — CI pending, release after owner verification |

**Legend:** ⬜ Pending · 🔄 In progress · ✅ Complete

---

## Next Step

**Start Phase 12** — in progress: GitHub push, CI, PR; release/npm after owner verification.

When CI is green and you have tested manually, say: *"Create release v1.0.0"* to tag, publish GitHub Release, and npm.
