# UI Theme Guide

LightDraw ships polished HTML UI **without mandatory custom CSS**. The bundled `lightdraw.min.css` applies design tokens automatically when you use `renderer: 'html'`.

## Default usage

```javascript
const app = LightDraw.createApp('#app', { renderer: 'html' });
app.loadJSON({ type: 'button', props: { label: 'Save', variant: 'primary' } });
```

No stylesheet edits required — buttons, inputs, cards, and overlays use the built-in design system.

## Programmatic themes

### Named presets

```javascript
const app = LightDraw.createApp('#app', {
  renderer: 'html',
  uiTheme: { preset: 'violet' },
});

// Switch at runtime
app.setUiTheme({ preset: 'dark' });
app.setUiTheme({ preset: 'emerald', mode: 'light' });
```

| Preset | Description |
|--------|-------------|
| `default` | Light mode — CSS file defaults |
| `dark` | Full dark palette, blue primary |
| `violet` | Purple accent |
| `emerald` | Green accent |
| `slate` | Neutral corporate accent |
| `ocean` | Sky-blue accent |
| `rose` | Rose / marketing accent |
| `darkViolet` | Dark mode with violet accent |

Presets set brand colors and optional `mode`. Surface, border, and text tokens come from `lightdraw.css` unless overridden.

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
  mode: 'light',
});
```

### Spread presets (alternative API)

```javascript
import { UI_PRESETS } from 'lightdraw';

LightDraw.createApp('#app', {
  renderer: 'html',
  uiTheme: { ...UI_PRESETS.rose, mode: 'dark' },
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

Or target dark mode:

```css
.lightdraw-html-root[data-ld-theme='dark'] {
  --ld-surface: #0f172a;
}
```

**Step 3 is never required** for a polished result — use `uiTheme` when possible so canvas and HTML stay in sync.

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

## Related

- [UI components schema](./ui-components-schema.md)
- [UI_POLISH_PLAN.md](../UI_POLISH_PLAN.md) — phased beautification roadmap
