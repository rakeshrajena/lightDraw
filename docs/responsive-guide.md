# Responsive Layout Guide

LightDraw supports fluid layouts at three levels: **design tokens**, **component props**, and **app/canvas sizing**. You do not need a CSS framework — the HTML renderer ships responsive rules in `lightdraw.min.css`, and canvas/dashboard demos use the same breakpoint tokens.

## Breakpoint tokens

CSS variables on `.lightdraw-html-root` (set via `lightdraw.min.css` or `app.setUiTheme()`):

| Token | CSS variable | Default | Typical use |
|-------|--------------|---------|-------------|
| `bpSm` | `--ld-bp-sm` | `480px` | Phone — full-bleed dialogs, stacked toolbars |
| `bpMd` | `--ld-bp-md` | `768px` | Tablet — form stacks, sidebar collapse |
| `bpLg` | `--ld-bp-lg` | `1024px` | Desktop — multi-column dashboards |

```javascript
app.setUiTheme({
  bpSm: '40rem',
  bpMd: '48rem',
  bpLg: '64rem',
});
```

Built-in component CSS uses `@media (max-width: 480px)` for overlay full-bleed and narrow control tweaks. Demo chrome in `examples/demo-common.css` stacks sidebars at **640px** and tightens playground iframes at **720px**.

## App and canvas sizing

### `autoResize` (default `true`)

When enabled, the app listens to `ResizeObserver` / `window.resize` and resizes the active renderer to the container.

```javascript
const app = LightDraw.createApp('#app', {
  width: 800,
  height: 600,
  autoResize: true, // default
});
```

For fixed HMI resolutions (automotive WebView), set `autoResize: false` and call `app.resize(w, h)` when the host changes orientation.

### Measure container, then create

Pattern used in `demo-ui.html`, `demo-dashboard.html`, and `demo-diagram.html`:

```javascript
const wrap = document.getElementById('canvas-wrap');
const W = Math.max(wrap.clientWidth - 8, 280);
const H = Math.max(wrap.clientHeight - 8, 320);

const app = LightDraw.createApp('#app', {
  width: W,
  height: H,
  renderer: 'html',
  autoResize: false,
});

window.addEventListener('resize', () => {
  clearTimeout(window._ldResize);
  window._ldResize = setTimeout(() => {
    const w = Math.max(wrap.clientWidth - 8, 280);
    app.resize(w, app.height);
    app.requestRender();
  }, 150);
});
```

Debounce resize handlers (120–150ms) to avoid layout thrash when diagrams call `fitToBounds` on every frame.

## Component `width` props

Many UI and dashboard factories accept explicit dimensions:

| Component / widget | Responsive props |
|--------------------|------------------|
| `input`, `textarea`, `slider`, `progressBar` | `fullWidth: true` — spans parent in HTML renderer |
| `button` | `size: 'sm' \| 'md' \| 'lg'` |
| `card`, `table`, `tabs` | `width`, `height` |
| `lineChart`, `barChart`, `areaChart` | `width`, `height` |
| `instrumentCluster` | `width`, `height` on cluster root |

```javascript
app.loadJSON({
  type: 'group',
  children: [
    { type: 'input', props: { label: 'Email', fullWidth: true, x: 16, y: 16 } },
    { type: 'slider', props: { fullWidth: true, x: 16, y: 72, width: 320 } },
  ],
});
```

On canvas, `fullWidth` is ignored — set `width` explicitly from your layout math.

## HTML renderer fluid behavior

- **Toolbar** — `flex-wrap` so items wrap on narrow widths.
- **Dialog** — centered panel; at ≤480px becomes full-bleed with safe padding.
- **Table** — horizontal scroll wrapper; sticky header stays visible.
- **Tabs** — horizontal scroll with touch momentum on small screens.

Load `lightdraw.min.css` once; no extra media queries required for default polish.

## Canvas / SVG dashboards

Dashboard and diagram demos use **canvas** for performance. Responsive layout is application code:

1. Read container `clientWidth`.
2. Rebuild or reflow JSON children with new `x` / `y` / `width`.
3. Call `app.resize(w, h)` and `app.render()`.

`demo-dashboard.html` stacks widgets vertically below 720px. `demo-diagram.html` uses `ResizeObserver` on `.demo-canvas-wrap` and `Diagram.fitToBounds()` after resize.

## Playground and embed mode

The website playground (`website/index.html`) embeds demos with `?embed=1`. `demo-embed.js` adds `html.demo-embed`, which:

- Hides demo headers and log panels
- Uses `clamp()` iframe heights in `website/public/styles.css`
- Collapses aside panels to a single column on narrow viewports

Test at **375px**, **768px**, and **1280px** widths — the same breakpoints used in the UI polish visual review checklist.

## JSON scenes for AI / low-code

Prefer numeric `width` / `height` on root `group` children and use `fullWidth` on form fields so HTML renderer reflows without post-processing:

```json
{
  "type": "group",
  "props": { "width": 360 },
  "children": [
    { "type": "card", "props": { "title": "Settings", "width": 360, "height": 200, "x": 0, "y": 0 } },
    { "type": "toggle", "props": { "label": "Notifications", "x": 16, "y": 56 } }
  ]
}
```

## Related

- [UI theme guide](./ui-theme-guide.md) — tokens including `bpSm` / `bpMd` / `bpLg`
- [UI components schema](./ui-components-schema.md) — per-component size and `fullWidth`
- [Legacy UI guide](./legacy-ui-guide.md) — flex fallbacks and old WebView targets
