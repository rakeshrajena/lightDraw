# Legacy Browser Guide

LightDraw ships an **ES5 legacy bundle** for embedded WebViews and older browsers.

## Bundles

| File | Use |
|------|-----|
| `dist/lightdraw.legacy.js` | Full ES5 UMD |
| `dist/lightdraw.core.legacy.js` | Core only |
| `dist/lightdraw.*.legacy.js` | Per-module plugins |

```html
<script src="dist/lightdraw.legacy.js"></script>
<script>
  var app = LightDraw.createApp('#app', { renderer: 'html' });
</script>
```

## Renderer on legacy targets

Prefer **`renderer: 'html'`** when Canvas 2D is missing or slow (old Android WebView).

```javascript
LightDraw.createApp('#app', {
  renderer: 'html',
  width: 800,
  height: 480,
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

## Size

Legacy full bundle ≈ 50 KB gzip (larger than modern ESM due to downlevel output). Use **core + plugin** legacy bundles when possible.

## Testing

```bash
npm run build
# Smoke: load dist/lightdraw.legacy.js in target WebView
npm run test:phase5   # asserts *.legacy.js exist
```

## Automotive WebView checklist

- [ ] `lightdraw.automotive.legacy.js` + `lightdraw.html.legacy.js`
- [ ] `renderer: 'html'`
- [ ] `autoResize: false` with fixed HMI resolution
- [ ] `applyDriveState` for CAN feed instead of per-widget DOM updates
