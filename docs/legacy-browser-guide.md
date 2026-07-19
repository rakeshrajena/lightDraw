# Legacy Browser & UI Guide

LightDraw ships an **ES5 legacy bundle** for embedded WebViews and older browsers, plus CSS that works on Chromium 49+ infotainment stacks.

For modern apps, prefer `lightdraw.min.js` + `lightdraw.min.css`. Use this guide only when you must target ES5 / old WebView.

## Bundles

| File | Use |
|------|-----|
| `dist/lightdraw.legacy.js` | Full ES5 UMD |
| `dist/lightdraw.core.legacy.js` | Core only |
| `dist/lightdraw.*.legacy.js` | Per-module plugins (`html`, `ui`, `dashboard`, `automotive`, …) |

```html
<link rel="stylesheet" href="dist/lightdraw.min.css">
<script src="dist/lightdraw.legacy.js"></script>
<script>
  var app = LightDraw.createApp('#app', {
    renderer: 'html',
    width: 800,
    height: 480,
    autoResize: false,
  });
  app.loadJSON({ type: 'button', props: { label: 'OK', variant: 'primary' } });
</script>
```

| Asset | Role |
|-------|------|
| `lightdraw.legacy.js` | ES5 UMD — all modules |
| `lightdraw.html.legacy.js` + `lightdraw.ui.legacy.js` | Smaller split load |
| `lightdraw.min.css` | Required for HTML UI polish (tokens, states, a11y) |

## Renderer on legacy targets

Prefer **`renderer: 'html'`** when Canvas 2D is missing or slow (old Android WebView).

```javascript
LightDraw.createApp('#app', {
  renderer: 'html',
  width: 800,
  height: 480,
  autoResize: false,
});
```

## Polyfills

Legacy build targets ES5 syntax but still expects:

- `Object.assign` (IE11+ or polyfill)
- `requestAnimationFrame` (polyfill for very old engines)
- Basic DOM Level 2 events

For IE11, include minimal polyfills before LightDraw:

```html
<script src="https://cdn.jsdelivr.net/npm/core-js-bundle/minified.js"></script>
```

## CSS feature compatibility

`lightdraw.min.css` uses **legacy flexbox** and **dual declarations** (fallback + `var()`):

| Feature | Chromium 49 / old WebView | IE11 | LightDraw approach |
|---------|---------------------------|------|-------------------|
| ES5 JavaScript | ✅ via `.legacy.js` | ✅ with polyfills | No `const` / arrow in legacy bundle |
| Canvas 2D | ⚠️ varies | ⚠️ | Prefer `renderer: 'html'` on weak GPUs |
| CSS custom properties | ✅ | ❌ | Duplicate hex/px before each `var(--ld-*)` rule |
| Flexbox | ✅ | ✅ (`-ms-` prefixes) | `display: -ms-flexbox` + `inline-flex` |
| `gap` in flex | ❌ on some targets | ❌ | Margin-based spacing in form rows |
| `border-radius` / `box-shadow` | ✅ | ✅ | Controls and elevation tokens |
| `@media (prefers-reduced-motion)` | ignored if unsupported | ignored | Animations degrade to instant state |
| `@supports selector(:focus-visible)` | partial | ❌ | `:focus` fallback rings |
| `backdrop-filter` (dialog) | partial | ❌ | Solid backdrop fallback |

## Accessibility on legacy targets

- Focus rings use **`:focus`** fallback when `:focus-visible` is unavailable.
- `app.setHighContrast(true)` sets `data-ld-high-contrast="true"` and widens borders.
- Native `<input>` / `<textarea>` in the HTML renderer support keyboard and screen readers.

## `prefers-reduced-motion`

Toast slide-in, button transitions, and demo chrome respect:

```css
@media (prefers-reduced-motion: reduce) {
  .ld-toast { animation: none; }
  .ld-btn { transition: none; }
}
```

If the media query is unsupported, animations still run — disable at app level for critical HMIs.

## Bundle matrix

| Target | JS | CSS | Renderer |
|--------|----|-----|----------|
| Modern browser | `lightdraw.min.js` | `lightdraw.min.css` | `html` or `canvas` |
| ES5 infotainment | `lightdraw.legacy.js` | `lightdraw.min.css` | `html` recommended |
| Core + UI only | `lightdraw.core.legacy.js` + `lightdraw.ui.legacy.js` + `lightdraw.html.legacy.js` | `lightdraw.min.css` | `html` |
| Dashboard HMI | `+ lightdraw.dashboard.legacy.js` | optional | `canvas` if GPU OK |

Legacy full bundle ≈ 50 KB gzip. Prefer **core + plugin** legacy bundles when possible.

## Testing

```bash
npm run build
npm run test:phase5          # asserts *.legacy.js exist
npm run test:phase12         # legacy bundle + UI components (HTML)
```

Manual checklist:

- [ ] Load `dist/lightdraw.legacy.js` in target WebView
- [ ] Confirm `lightdraw.min.css` loads (controls are unstyled without it)
- [ ] Tab through button → input → checkbox → slider
- [ ] Toggle `app.setHighContrast(true)`
- [ ] Automotive: `lightdraw.automotive.legacy.js` + `html`, `autoResize: false`, `applyDriveState` for CAN

## Known limitations

- **IE11** — not a primary target; needs `core-js`; CSS variables fall back to duplicate hex where declared.
- **gap / grid** — demos may use grid; legacy-critical UIs should use stack/margin spacing inside `#app`.
- **PDF export** — uses modern APIs; not required for legacy UI display.

## Related

- [UI theme guide](./ui-theme-guide.md) — programmatic themes without editing CSS
- [Responsive guide](./responsive-guide.md) — `autoResize: false` for fixed HMI resolution
