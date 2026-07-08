# Legacy UI & CSS Compatibility

Use this guide when shipping **HTML renderer UI** on ES5 bundles (`lightdraw.legacy.js`) or embedded WebViews (Chromium 49+, older Android automotive stacks).

For general ES5 loading and polyfills, see [legacy-browser-guide.md](./legacy-browser-guide.md).

## Recommended stack

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
| `lightdraw.legacy.js` | ES5 UMD — all modules, `createComponentFromJSON` |
| `lightdraw.html.legacy.js` + `lightdraw.ui.legacy.js` | Smaller split load when full bundle is too large |
| `lightdraw.min.css` | Required for HTML UI polish (tokens, states, a11y) |

## CSS feature compatibility

`lightdraw.min.css` is written for **legacy flexbox** and **dual declarations** (fallback + `var()`). Summary:

| Feature | Chromium 49 / old WebView | IE11 | LightDraw approach |
|---------|---------------------------|------|-------------------|
| ES5 JavaScript | ✅ via `.legacy.js` | ✅ with polyfills | No `const` / arrow in legacy bundle |
| Canvas 2D | ⚠️ varies | ⚠️ | Prefer `renderer: 'html'` on weak GPUs |
| CSS custom properties | ✅ | ❌ | Duplicate hex/px before each `var(--ld-*)` rule |
| Flexbox | ✅ | ✅ (`-ms-` prefixes) | `display: -ms-flexbox` + `inline-flex` |
| `gap` in flex | ❌ on some targets | ❌ | Margin-based spacing in form rows |
| `border-radius` | ✅ | ✅ | Used on controls and cards |
| `box-shadow` | ✅ | ✅ | Elevation tokens |
| `@media (prefers-reduced-motion)` | ignored if unsupported | ignored | Animations degrade to instant state |
| `@supports selector(:focus-visible)` | partial | ❌ | `:focus` fallback rings |
| `backdrop-filter` (dialog) | partial | ❌ | Solid backdrop fallback color |

## Accessibility on legacy targets

- Focus rings use **`:focus`** fallback when `:focus-visible` is unavailable.
- `app.setHighContrast(true)` sets `data-ld-high-contrast="true"` and widens borders — works without modern CSS selectors.
- Native `<input>` / `<textarea>` in HTML renderer support keyboard and screen readers without extra polyfills.

## `prefers-reduced-motion`

Toast slide-in, button transitions, and demo chrome respect:

```css
@media (prefers-reduced-motion: reduce) {
  .ld-toast { animation: none; }
  .ld-btn { transition: none; }
}
```

If the media query is unsupported, animations still run — disable at app level with shorter durations or static overlays for critical HMIs.

## `prefers-color-scheme`

Demo shell (`demo-common.css`) sets `color-scheme: dark` when the OS prefers dark and no explicit `data-demo-theme` is set. Library default theme is **light** inside `#app`; use `app.setUiTheme({ preset: 'dark' })` for in-canvas dark UI regardless of OS.

## Bundle matrix

| Target | JS | CSS | Renderer |
|--------|----|-----|----------|
| Modern browser | `lightdraw.min.js` | `lightdraw.min.css` | `html` or `canvas` |
| ES5 infotainment | `lightdraw.legacy.js` | `lightdraw.min.css` | `html` recommended |
| Core + UI only | `lightdraw.core.legacy.js` + `lightdraw.ui.legacy.js` + `lightdraw.html.legacy.js` | `lightdraw.min.css` | `html` |
| Dashboard HMI | `+ lightdraw.dashboard.legacy.js` | optional | `canvas` if GPU OK |

## Testing checklist

```bash
npm run build
npm run test:phase12          # legacy bundle + 17 UI components (HTML)
npx vitest run test/ui9-cross-module.test.ts
```

Manual:

- [ ] Load `dist/lightdraw.legacy.js` in target WebView
- [ ] Confirm `lightdraw.min.css` loads (controls are unstyled without it)
- [ ] Tab through button → input → checkbox → slider
- [ ] Toggle `app.setHighContrast(true)`
- [ ] Verify dialog and menu open/close with touch + keyboard

## Known limitations

- **IE11** — not a primary target; requires `core-js` and may lack CSS variables (fallback hex still applies from duplicate declarations in many rules, not all).
- **gap / grid** — catalog layouts in demos use grid; legacy-critical UIs should use stack layout or margin spacing inside `#app` only.
- **PDF export** — uses modern APIs in main bundle; not required for legacy UI display.

## Related

- [Legacy browser guide](./legacy-browser-guide.md) — polyfills, bundle list, automotive checklist
- [UI theme guide](./ui-theme-guide.md) — programmatic themes without editing CSS
- [Responsive guide](./responsive-guide.md) — `autoResize: false` for fixed HMI resolution
