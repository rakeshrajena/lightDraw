# UI Theme Guide

LightDraw ships polished HTML UI **without mandatory custom CSS**. The bundled `lightdraw.min.css` applies design tokens automatically when you use `renderer: 'html'`.

## Default usage

```javascript
const app = LightDraw.createApp('#app', { renderer: 'html' });
app.loadJSON({ type: 'button', props: { label: 'Save', variant: 'primary' } });
```

No stylesheet edits required — buttons, inputs, cards, and overlays use the built-in design system.

## Programmatic themes

### Theme pack (recommended)

One JSON/JS object themes UI, charts, and diagrams:

```javascript
app.applyTheme({
  preset: 'dark',
  primary: '#0ea5e9',
  series: ['#0ea5e9', '#f43f5e', '#22c55e', '#f59e0b'],
  dashboard: { chartGrid: '#1e293b' },
  diagram: { nodeStroke: '#38bdf8' },
});
```

Or embed in scene JSON — `loadJSON` applies `theme` before mounting children:

```json
{
  "theme": { "preset": "darkViolet" },
  "type": "group",
  "children": [{ "type": "button", "props": { "label": "Save" } }]
}
```

Each **preset** can be:
- a **built-in pack** (`dark`, `violet`, `rose`, …) — full surfaces + text + primary
- any **CSS color** (`pink`, `#f472b6`, `rgba(...)`) — sets brand primary
- an **image file path** (absolute or relative, with image extension) — sets stage background

```javascript
app.applyTheme({ preset: 'dark' });
app.applyTheme({ preset: 'pink' });
app.applyTheme({ preset: '#f472b6' });
app.applyTheme({ preset: './assets/bg.png' });
app.applyTheme({ preset: '/images/hero.jpg' });
app.applyTheme({
  preset: 'https://example.com/bg.jpg',
  primary: 'pink',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  fontSize: '12px',
  fontSizeSm: '10px',
});
app.applyTheme({ preset: 'dark', primary: 'rgba(244, 114, 182, 1)' });
```

Image presets also load dark chrome (surfaces + light text) so charts stay readable over photos. Override with `text` / `fontSize` as needed.

### Typography (`fontSize`)

`fontSize` / `fontSizeSm` / `fontSizeLg` apply across modules from one pack:

| Module | Effect |
|--------|--------|
| **HTML UI** | CSS `--ld-font-size*` on `.lightdraw-html-root` |
| **Canvas UI** | Buttons, inputs, **labels**, etc. |
| **Dashboard** | Chart axis / legend sizes |
| **Diagram** | Scales `xs`…`xl` from base (default 12px) |
| **Automotive** | Scales fluid label sizes (`fontSize` / 14); **colors** stay `classic` / `sport` / `digital` |

```javascript
app.applyTheme({
  fontSize: '16px',
  fontSizeSm: '12px',
  fontSizeLg: '18px',
  // optional per-module overrides:
  diagram: { fontSize: { sm: 9, base: 11 } },
  dashboard: { fontSize: 11, fontSizeSm: 9 },
});
```

### Named presets

```javascript
const app = LightDraw.createApp('#app', {
  renderer: 'html',
  uiTheme: { preset: 'violet' },
});

// Switch at runtime
app.setUiTheme({ preset: 'dark' });
app.setUiTheme({ preset: 'emerald' });
```

| Preset | Description |
|--------|-------------|
| `default` | Full light pack |
| `dark` | Full dark pack, blue primary |
| `violet` | Light pack + purple accent |
| `emerald` | Light pack + green accent |
| `slate` | Light pack + slate accent |
| `ocean` | Light pack + sky accent |
| `rose` | Light pack + rose accent |
| `darkViolet` | Full dark pack + violet accent |

### Token overrides

Override any token on top of a preset:

```javascript
app.setUiTheme({
  preset: 'ocean',
  primary: '#0ea5e9',
  radius: '10px',
  spaceMd: '20px',
});
```

Or pass a full token object without a preset:

```javascript
app.setUiTheme({
  primary: '#7c3aed',
  primaryHover: '#6d28d9',
  surface: '#fafafa',
});
```

### Spread presets (alternative API)

```javascript
import { UI_PRESETS } from 'lightdraw';

LightDraw.createApp('#app', {
  renderer: 'html',
  uiTheme: { ...UI_PRESETS.darkViolet },
});
```

## CSS variable overrides (optional)

For apps that already load `lightdraw.min.css`, you can override tokens on the root:

```css
.lightdraw-html-root {
  --ld-primary: #7c3aed;
  --ld-radius: 10px;
  --ld-space-md: 20px;
}
```

Or override CSS variables on the root:

```css
.lightdraw-html-root {
  --ld-primary: #7c3aed;
  --ld-radius: 10px;
  --ld-space-md: 20px;
}
```

Prefer `uiTheme` / `applyTheme` with a preset (`dark`, `violet`, …) so canvas and HTML stay in sync.

## Token reference

### Brand & semantic

| Token key | CSS variable | Default (light) |
|-----------|--------------|-----------------|
| `primary` | `--ld-primary` | `#2563eb` |
| `primaryHover` | `--ld-primary-hover` | `#1d4ed8` |
| `primaryActive` | `--ld-primary-active` | `#163eb8` |
| `primarySubtle` | `--ld-primary-subtle` | `#eff6ff` |
| `secondary` | `--ld-secondary` | `#475569` |
| `danger` | `--ld-danger` | `#dc2626` |
| `success` | `--ld-success` | `#059669` |
| `warning` | `--ld-warning` | `#d97706` |

### Surfaces & text

| Token key | CSS variable |
|-----------|--------------|
| `surface` | `--ld-surface` |
| `surfaceMuted` | `--ld-surface-muted` |
| `border` | `--ld-border` |
| `text` | `--ld-text` |
| `textMuted` | `--ld-text-muted` |

### Layout

| Token key | CSS variable | Default |
|-----------|--------------|---------|
| `spaceXs` … `spaceXl` | `--ld-space-xs` … `--ld-space-xl` | 4 / 8 / 16 / 24 / 32 px |
| `bpSm` / `bpMd` / `bpLg` | `--ld-bp-sm` … | 480 / 768 / 1024 px |
| `radius` | `--ld-radius` | `8px` |
| `controlHeight` | `--ld-control-h` | `40px` |

Use `UI_THEME_VAR_MAP` in TypeScript for the full key → variable mapping.

## Canvas renderer parity

Canvas-drawn UI components read from `src/components/theme.ts` (`UI` object), aligned with the same hex values as `lightdraw.css`. HTML renderer uses CSS variables; canvas uses the `UI` constants directly.

**Color formats:** theme tokens accept `#rgb` / `#rrggbb` / `#rrggbbaa`, `rgb()` / `rgba()`, `hsl()` / `hsla()` (comma or space syntax), and common named colors. Soft fills (chart area, glows, primary shadow) are derived from any of these via `colorWithAlpha`.

## JSON round-trip

Components and themes survive export → import:

```javascript
// Component state
const slider = app.stage.children[0].children[0];
const json = app.exportJSON(); // or toJSON(slider)
app.clear();
app.loadJSON(json);

// Single component
import { toJSON } from 'lightdraw';
const btnJson = toJSON(buttonNode);
// { type: 'button', props: { label, variant, size, disabled, ... } }

// Theme tokens (HTML renderer)
app.setUiTheme({ preset: 'violet', radius: '10px' });
// Variables applied on .lightdraw-html-root; preset + overrides merge via resolveUiTheme()
```

`componentToJSON()` and `app.exportJSON()` preserve `componentState` fields added in UI phases (variants, `sortable`, `selectedNode`, etc.). See [ui-components-schema.md](./ui-components-schema.md).

## High contrast

```javascript
app.setHighContrast(true);
```

Adds `lightdraw-high-contrast` and `data-ld-high-contrast="true"` on the HTML root and adjusts canvas stroke/fill for accessibility. CSS token overrides widen borders and use yellow focus rings.

## Canvas UI parity (Phase 2)

Canvas controls read `getActiveUi()` / `resolveUiCanvasTheme(app.getResolvedTheme())`.
On `setUiTheme`, LightDraw:

1. Syncs the active canvas palette
2. Applies HTML CSS vars (HTML renderer)
3. Calls `refreshCanvasUi(stage)` to update button/slider/toggle/… part colors
4. Emits `themechange` and re-renders

Custom `fill` on buttons (`hasCustomFill`) is preserved across theme changes.

## Dashboard theme (Phase 3)

Dashboard gauges and charts read `getActiveDashboard()` (from `resolveDashboardTheme(app.getResolvedTheme())`).

Gauges, meters, batteries, thermometers, and bar charts also support **value-based colors** via `colorStops` (and dial `colorZones`). See [dashboard-widgets-schema.md](./dashboard-widgets-schema.md#conditional-colors-colorstops--colorzones).
On `setUiTheme`, widgets with `chartRebuild` are rebuilt so needles, series colors, and chart strokes pick up the new primary/surface tokens.

## Diagram theme (Phase 4)

Diagrams read `getActiveDiagram()` (from `resolveDiagramTheme`).
On `setUiTheme`, diagram roots with `diagramRebuild` recreate nodes/edges with the new stroke/edge palette.

## Automotive presets (Phase 5)

Automotive widgets use `props.theme`: `classic` | `sport` | `digital`.
They are **not** retinted by `setUiTheme`. Switch with:

```javascript
updateAutoWidgetProps(cluster, { theme: 'sport' });
```

## Per-node uiTheme (Phase 6)

```javascript
{ type: 'gauge', props: { value: 72, uiTheme: 'violet' } }
{ type: 'button', props: { label: 'OK', uiTheme: { primary: '#e11d48' } } }
```

### Typography cascade (text + fontSize)

Priority:

1. Flat component props: `textColor` / `color`, `fontSize`, `textMuted`
2. Node `uiTheme: { text, fontSize, … }`
3. App `setUiTheme` / `applyTheme`
4. Module defaults

```javascript
// Sticky on this gauge only — survives later global fontSize/text changes
{ type: 'gauge', props: { value: 40, textColor: '#fbbf24', fontSize: 18 } }

// Via uiTheme tokens
{ type: 'label', props: { text: 'Hi', uiTheme: { text: '#94a3b8', fontSize: '12px' } } }
```

Node override wins over app theme. See [theme-architecture.md](./theme-architecture.md).

## App theme getters (Phase 1)

```javascript
app.getUiTheme();        // stored input (may include preset)
app.getResolvedTheme();  // flat tokens after resolve

app.on('themechange', (e) => {
  // e.payload = { config, resolved }
});

// Merge (default) — omitted keys stick
app.setUiTheme({ primary: '#ff00aa' });

// Clean preset switch — drop sticky overrides
app.setUiTheme({ preset: 'ocean' }, { replace: true });
app.clearUiTheme();
```

Library-wide contract (all modules): [theme-architecture.md](./theme-architecture.md).

Live demo: [`examples/demo-theme.html`](../examples/demo-theme.html) — live playground with Scene JSON (root `theme`), API code, presets, and automotive independence.

## Related

- [Theme architecture](./theme-architecture.md)
- [UI components schema](./ui-components-schema.md)
- [Responsive layout guide](./responsive-guide.md)
- [Legacy browser & UI guide](./legacy-browser-guide.md)
- [UI_POLISH_PLAN.md](../UI_POLISH_PLAN.md) — phased beautification roadmap
