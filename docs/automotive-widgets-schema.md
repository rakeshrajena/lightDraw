# Automotive Widget JSON Schema (Phase 8)

Load widgets via `app.loadJSON({ type: '<widget>', props: { ... } })`.

## Instrument cluster

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| theme | string | `"classic"` | `classic`, `sport`, or `digital` |
| width | number | 800 | Cluster width |
| height | number | 400 | Cluster height |
| speed | number | 0 | Speedometer value (km/h) |
| rpm | number | 0 | Tachometer value |
| fuel | number | 75 | Fuel level 0–100 |
| engineTemp | number | 90 | Engine temp °C |
| batteryVoltage | number | 12.4 | Battery volts |
| tpms | number[] | `[32,32,32,32]` | FL, FR, RL, RR PSI |
| gear | string | `"D"` | Gear indicator |
| parkingBrake | boolean | false | Parking brake lamp |
| headlights | boolean | false | Headlights lamp |
| cruiseSpeed | number | 0 | Cruise set speed (0 = off) |
| turnLeft / turnRight | boolean | false | Turn indicators |
| signals | object | sample | CAN viewer signal map |

## Individual widgets

| Widget | Key props | Live update |
|--------|-----------|-------------|
| speedometer | value, max, size | `setAutoValue(node, 'value', n)` |
| tachometer | value, max, size | same |
| engineTemp | value, max, size | same (color zones on dial) |
| batteryVoltage | value | same (red below 11.5 V) |
| tpms | pressures[], lowThreshold | `applyDriveState` with `tpms` array |
| parkingBrake / headlights | active | `applyDriveState` boolean props |
| cruiseControl | speed, active | `applyDriveState` with `cruiseSpeed` |
| canViewer | signals, maxRows, width | `applyDriveState` with `signals` |
| fuelGauge | value | `setAutoValue` |
| gearIndicator | gear | `applyDriveState` with `gear` |
| turnIndicators | left, right | `applyDriveState` |
| warningLamp | label, active | static |
| adasStatus | status | `off`, `standby`, `active`, `fault` |

## JSON drive simulation

```javascript
import { applyDriveState, sampleDriveFrames } from 'lightdraw/automotive';

const frames = sampleDriveFrames(120);
let i = 0;
setInterval(() => {
  applyDriveState(clusterNode, frames[i++ % frames.length]);
}, 100);
```

## JSON round-trip

```javascript
import { toJSON } from 'lightdraw/core';
const json = toJSON(speedoNode);
// { type: 'speedometer', props: { value, max, size, x, y } }
```

## Performance targets

- Full cluster live update: ≤ 16 ms per frame (canvas)
- CAN viewer 100 signals: update ≤ 16 ms
