# Automotive Widget JSON Schema (Phase 8)

Load widgets via `app.loadJSON({ type: '<widget>', props: { ... } })`.

**160 widget types** are registered via the declarative catalog (`src/automotive/catalog.ts`) plus rich custom overrides (`src/automotive/widgets/custom.ts`). Use `listAutomotiveWidgets()` from `lightdraw/automotive` for the full sorted list.

## Widget categories

| Category | Examples | Key props |
|----------|----------|-----------|
| **Dials** | speedometer, tachometer, turboBoostGauge, oilPressure | value, max, size, theme |
| **Bars** | fuelGauge, stateOfCharge, chargingPower | value (0–100) |
| **Numeric** | odometer, outsideTemperature, eta | value, decimals |
| **Lamps** | parkingBrake, absStatus, laneKeepAssist | active |
| **Badges** | cruiseControl, bluetoothStatus, chargingStatus | status, active |
| **Panels** | mediaPlayer, gpsNavigationMap, warningAlertPanel | title, rows |
| **Composite** | instrumentCluster, digitalInstrumentCluster | theme, speed, rpm, fuel, … |

### Aliases

| Alias | Canonical |
|-------|-----------|
| gearPositionIndicator | gearIndicator |
| tirePressureMonitoring | tpms |
| turnIndicator | turnIndicators |

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

## Live updates

`applyDriveState(cluster, state)` walks `autoPart` metadata and updates matching widgets:

- **Numbers** — `speed`, `rpm`, `fuel`, `engineTemp`, `batteryVoltage`, or any key matching `autoPart`
- **Booleans** — `parkingBrake`, `headlights`, ADAS lamps, etc.
- **Strings** — `gear`, `adasStatus`
- **Arrays** — `tpms` pressures
- **Objects** — `signals` for CAN viewer

```javascript
import { applyDriveState, sampleDriveFrames, listAutomotiveWidgets } from 'lightdraw/automotive';

console.log(listAutomotiveWidgets().length); // 160

const frames = sampleDriveFrames(120);
let i = 0;
setInterval(() => {
  applyDriveState(clusterNode, frames[i++ % frames.length]);
}, 100);
```

## Responsive layout

Widgets rebuild from `autoState` when size props change — no manual destroy/remount needed.

```javascript
import {
  createAutomotiveFromJSON,
  installAutoWidgetResizeObserver,
  detachAutoWidgetResizeObserver,
  updateAutoWidgetProps,
} from 'lightdraw/automotive';

const root = createAutomotiveFromJSON('speedometer', { value: 72, width: 200, height: 160, x: 0, y: 0 }, app);
app.add(root);

// Option A: observe a container element (recommended)
installAutoWidgetResizeObserver(root, containerElement, { padding: 8 });

// Option B: patch props directly
updateAutoWidgetProps(root, { width: 300, height: 180, value: 88 });

// Cleanup
detachAutoWidgetResizeObserver(root);
```

`display: 'analog' | 'digital'` on supported widgets switches needle dials vs LCD readouts (`resolveDisplay()` in builders).

All widgets use `resolveBounds()` for fluid width/height/size. `fitAutoWidgetToContainer()` delegates to the same helper so resize observers and manual `updateAutoWidgetProps()` stay consistent across the full catalog (160+ types). Instrument cluster layouts scale proportionally via `resolveClusterLayout()`.

## JSON round-trip

```javascript
import { toJSON } from 'lightdraw/core';
const json = toJSON(speedoNode);
// { type: 'speedometer', props: { value, max, size, x, y } }
```

## Performance targets

- Full cluster live update: ≤ 32 ms per frame (canvas, 20 frames)
- CAN viewer 100 signals: update ≤ 16 ms
- Automotive bundle: ~14.8 KB gzip (160 widgets)
