# Getting Started

## Installation

```bash
npm install lightdraw
```

Or use the CDN:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.min.css">
<script src="https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.min.js"></script>
```

## Basic usage

```javascript
const app = LightDraw.createApp('#app', {
  width: 800,
  height: 600,
  renderer: 'auto', // canvas | svg | html
  background: '#1e293b',
  uiTheme: { preset: 'dark' },
});

const circle = app.circle({
  x: 200,
  y: 200,
  radius: 50,
  fill: '#2563eb',
  draggable: true,
});

app.add(circle);

circle.on('click', () => {
  circle.animate({ scale: 1.5, duration: 300, easing: 'easeOutBounce' });
});
```

## Theme in one call

```javascript
app.applyTheme({
  preset: 'dark',
  primary: '#0ea5e9',
  fontSize: '14px',
});
```

See [UI Theme Guide](./ui-theme-guide.md) and [Theme architecture](./theme-architecture.md).

## Animation

```javascript
circle.animate({
  x: 500,
  y: 200,
  rotation: 360,
  duration: 1200,
  easing: 'easeOutBounce',
});

const timeline = app.timeline();
timeline
  .move(car, { x: 300, duration: 800 })
  .rotate(car, 360)
  .scale(car, 1.2)
  .play();
```

## JSON / AI integration

```javascript
import { parseAndValidateSceneJSON, formatValidationErrors } from 'lightdraw/core';

const raw = await fetch('/scene.json').then((r) => r.text());
const { json, validation } = parseAndValidateSceneJSON(raw);
if (!validation.valid) {
  throw new Error(formatValidationErrors(validation));
  // e.g. root.children[0].props.variant: invalid value "primry";
  //      expected one of: "primary" | "secondary" | … did you mean "primary"?
}

app.loadJSON(json);
const exported = app.exportJSON({ includeTheme: true });
```

Full guide: [AI Integration](./ai-integration-guide.md) · schemas under [docs/README](./README.md).

## Local playground

```bash
npm run build
npm run prepare:website   # copies dist + examples into website/public (gitignored copies)
npm run dev:website       # http://localhost:5173
```

- **Playground** — theme lab, UI, charts, automotive, diagrams with a live Scene / Theme / API dock  
- **Help** — `/help.html` topics with live embeds  
- Site chrome defaults to **Night**; toggle Day/Night in the rail  

Open full demos from `examples/` (e.g. `demo-theme.html`) or via the hub’s **Open full** button.

## Plugins

```javascript
LightDraw.use({
  name: 'my-plugin',
  install(LD) {
    LD.registerComponent('myWidget', (props, app) => app.group(props));
  },
});
```

Next: [examples/demo.html](../examples/demo.html) · [UI Theme](./ui-theme-guide.md) · [Export](./export-pipeline.md).
