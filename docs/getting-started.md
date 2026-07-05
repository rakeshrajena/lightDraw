# Getting Started

## Installation

```bash
npm install lightdraw
```

Or use the CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/lightdraw/dist/lightdraw.min.js"></script>
```

## Basic Usage

```javascript
const app = LightDraw.createApp('#app', {
  width: 800,
  height: 600,
  renderer: 'auto', // canvas | svg | html
  background: '#1e293b'
});

const circle = app.circle({
  x: 200,
  y: 200,
  radius: 50,
  fill: '#2563eb',
  draggable: true
});

app.add(circle);

circle.on('click', () => {
  circle.animate({ scale: 1.5, duration: 300, easing: 'easeOutBounce' });
});
```

## Animation

```javascript
circle.animate({
  x: 500,
  y: 200,
  rotation: 360,
  duration: 1200,
  easing: 'easeOutBounce'
});

const timeline = app.timeline();
timeline
  .move(car, { x: 300, duration: 800 })
  .rotate(car, 360)
  .scale(car, 1.2)
  .play();
```

## JSON / AI Integration

```javascript
app.loadJSON({
  type: 'dashboard',
  children: [
    { type: 'speedometer', props: { value: 82, x: 50, y: 50 } },
    { type: 'fuelGauge', props: { value: 64, x: 300, y: 50 } }
  ]
});

const json = app.exportJSON();
```

## Plugins

```javascript
LightDraw.use({
  name: 'my-plugin',
  install(LD) {
    LD.registerComponent('myWidget', (props, app) => app.group(props));
  }
});
```

See [examples/demo.html](../examples/demo.html) for a live demo.
