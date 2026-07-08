# Automotive Examples

Recipes for instrument clusters, CAN viewers, and drive simulation.

## Instrument cluster from JSON

```javascript
import LightDraw from 'lightdraw';

const app = LightDraw.createApp('#cluster', {
  width: 860,
  height: 420,
  renderer: 'html',
  background: '#0f172a',
});

app.loadJSON({
  type: 'instrumentCluster',
  props: {
    theme: 'sport',
    speed: 72,
    rpm: 3200,
    fuel: 65,
    engineTemp: 95,
    batteryVoltage: 12.6,
    tpms: [32, 31, 33, 30],
    gear: 'D',
    parkingBrake: false,
  },
});

const cluster = app.stage.children[0];
```

## Live drive simulation

```javascript
import { applyDriveState, sampleDriveFrames } from 'lightdraw/automotive';

const frames = sampleDriveFrames(120);
let i = 0;

setInterval(() => {
  applyDriveState(cluster, frames[i++ % frames.length]);
}, 100);
```

## Individual widgets

```javascript
app.loadJSON({ type: 'engineTemp', props: { value: 88, size: 140, x: 20, y: 20 } });
app.loadJSON({ type: 'tpms', props: { pressures: [32, 32, 18, 32], x: 200, y: 20 } });
app.loadJSON({ type: 'canViewer', props: { signals: { '0x100': 42 }, maxRows: 20, x: 20, y: 120 } });
```

## Themes

`classic` · `sport` · `digital` — set on cluster `props.theme`.

```javascript
import { getTheme } from 'lightdraw/automotive';
const palette = getTheme('digital');
```

## Needle updates without animation

```javascript
import { setAutoValue } from 'lightdraw/automotive';
setAutoValue(speedoNode, 'value', 120);
```

## Demo

Open [`examples/demo-automotive.html`](../examples/demo-automotive.html) after `npm run build`.

Schema reference: [automotive-widgets-schema.md](./automotive-widgets-schema.md).
