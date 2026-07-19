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

// P0 telltales
app.loadJSON({ type: 'checkEngineLamp', props: { active: true, width: 44, height: 44, x: 20, y: 280 } });
app.loadJSON({ type: 'lowBeamStatus', props: { active: true, width: 44, height: 44, x: 72, y: 280 } });
app.loadJSON({ type: 'parkingLightStatus', props: { active: true, width: 44, height: 44, x: 124, y: 280 } });
app.loadJSON({ type: 'pedestrianDetection', props: { status: 'detecting', width: 140, height: 36, x: 180, y: 284 } });
```

Drive feed keys for simulation: `checkEngine`, `lowBeam`, `parkingLight`, `pedestrian` (`clear` | `detecting` | `warning`).

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

- **Instrument cluster** tab — composite cluster + drive simulation
- **Individual dash** tab — compose lighting / MIL / pedestrian / climate from individual widgets
- **Widget catalog** — full automotive type gallery

Schema reference: [automotive-widgets-schema.md](./automotive-widgets-schema.md).
