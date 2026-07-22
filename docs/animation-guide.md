# Animation Guide

LightDraw includes a zero-dependency animation engine with easing, timelines, path motion, and sprite playback.

## Property animation

Animate any numeric node property:

```javascript
import LightDraw from 'lightdraw';

const app = LightDraw.createApp('#app', { width: 600, height: 400 });
const box = app.rect({ x: 50, y: 100, width: 60, height: 40, fill: '#2563eb' });
app.add(box);

box.animate({
  x: 400,
  rotation: 180,
  opacity: 0.6,
  duration: 800,
  easing: 'easeOutCubic',
  onComplete: () => console.log('done'),
});
```

### Shorthand

```javascript
app.animate(box, { y: 200, duration: 500 });
```

## Easing

Built-in easings (string name or function):

| Family | Names |
|--------|-------|
| Quad | `easeIn`, `easeOut`, `easeInOut` |
| Cubic | `easeInCubic`, `easeOutCubic`, `easeInOutCubic` |
| Elastic / Bounce | `easeOutElastic`, `easeOutBounce`, … |
| Expo / Circ / Back | `easeInExpo`, `easeOutCirc`, `easeInOutBack`, … |

```javascript
import { getEasing, registerEasing } from 'lightdraw/core';

const fn = getEasing('easeOutBounce');
registerEasing('myEase', (t) => t * t);
```

## Timelines

Sequence animations with `app.timeline()`:

```javascript
const tl = app.timeline();
tl.move(car, { x: 300, duration: 600 })
  .rotate(car, 90, 400)
  .fade(car, 0.3, 300)
  .wait(200)
  .call(() => console.log('checkpoint'))
  .play();

tl.pause();
tl.play(); // resume
tl.stop();
```

### Stagger

Start the same animation on multiple nodes with offset delays:

```javascript
const nodes = [app.circle({ radius: 10, fill: '#f00' }), /* … */];
nodes.forEach((n) => app.add(n));

tl.stagger(nodes, { opacity: 1, duration: 400 }, 100); // 100 ms apart
```

## Path motion

Move a node along an SVG path:

```javascript
pathNode.animate({
  motionPath: 'M 0 0 Q 100 50 200 0 T 400 0',
  duration: 2000,
  easing: 'linear',
});
```

## Stroke dash animation

```javascript
line.animate({ dashOffset: 100, duration: 1500, loop: true });
```

## Path morphing

```javascript
pathA.animate({ morphTo: pathB, duration: 1000 });
```

## Sprite sheets

```javascript
const sprite = app.sprite({ src: 'sheet.png', frameWidth: 32, frameHeight: 32 });
sprite.play({ fps: 12, loop: true });
```

## Parallel animations

```javascript
import { parallel } from 'lightdraw/core';

await parallel([
  { target: a, options: { x: 100, duration: 500 } },
  { target: b, options: { y: 200, duration: 500 } },
]);
```

## Performance tips

- Stop animations when nodes are destroyed (`animation.stop()`).
- Prefer `timeline.stagger` over hundreds of individual `setTimeout` calls.
- See [Performance Guide](./performance-guide.md) for frame budgets.

## Diagram wire flow

For **flowchart / network / pipeline / CAN** connectors (marching dashes, traveling packets, status tint, multi-path runs, play/pause), use the diagram API — not raw `dashOffset` alone:

```javascript
LightDraw.Diagram.applyFlow(app, chart, {
  mode: 'both',
  playback: 'loop',
  statusHighlight: true,
  paths: [['a', 'b', 'c'], ['a', 'd', 'c']],
  pathGapMs: 500,
});
```

Full guide: [Diagram wire-flow animation](./diagram-flow.md).
