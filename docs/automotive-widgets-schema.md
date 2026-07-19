# Automotive Widget JSON Schema (Phase 8)

Load widgets via `app.loadJSON({ type: '<widget>', props: { ... } })`.

**160+ widget types** are registered via the declarative catalog (`src/automotive/catalog.ts`) plus rich custom overrides (`src/automotive/widgets/custom.ts`). Use `listAutomotiveWidgets()` from `lightdraw/automotive` for the full sorted list.

## Widget categories

| Category | Examples | Key props |
|----------|----------|-----------|
| **Dials** | speedometer, tachometer, turboBoostGauge, oilPressure | value, max, size, theme |
| **Bars** | fuelGauge, stateOfCharge, chargingPower | value (0–100) |
| **Numeric** | odometer, outsideTemperature, eta | value, decimals |
| **Lamps** | parkingBrake, checkEngineLamp, lowBeamStatus, parkingLightStatus, absStatus | active |
| **Badges** | cruiseControl, pedestrianDetection, bluetoothStatus, chargingStatus | status, active |
| **Panels** | mediaPlayer, gpsNavigationMap, warningAlertPanel | title, rows |
| **Composite** | instrumentCluster, digitalInstrumentCluster | theme, speed, rpm, fuel, … |

### Aliases

| Alias | Canonical |
|-------|-----------|
| gearPositionIndicator | gearIndicator |
| tirePressureMonitoring | tpms |
| turnIndicator | turnIndicators |
| milStatus / checkEngine / engineStatus | checkEngineLamp |

## Instrument cluster

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| theme | string | `"classic"` | `classic`, `sport`, or `digital` — **not** driven by `app.setUiTheme()` |

## Theming (Phase 5 — dual system)

App brand theme (`setUiTheme` / UI presets) styles UI, dashboard, and diagram modules.

Automotive HMI widgets use **named presets** only:

| Preset | Character |
|--------|-----------|
| `classic` | Dark dials, red speed needle, green tach |
| `sport` | Orange/yellow sport needles, red accent |
| `digital` | Cyan digital cluster look |

```javascript
// Create
{ type: 'instrumentCluster', props: { theme: 'sport', speed: 95, rpm: 3200 } }

// Live switch (rebuilds chrome; keeps values)
import { updateAutoWidgetProps } from 'lightdraw/automotive';
updateAutoWidgetProps(cluster, { theme: 'digital' });
```

Calling `app.setUiTheme({ preset: 'violet' })` will **not** change cluster needle colors.

See [theme-architecture.md](./theme-architecture.md).

## Live updates

`applyDriveState(cluster, state)` walks `autoPart` metadata and updates matching widgets:

- **Numbers** — `speed`, `rpm`, `fuel`, `engineTemp`, `batteryVoltage`, or any key matching `autoPart`
- **Booleans** — `parkingBrake`, `headlights`, `checkEngine`, `lowBeam`, `parkingLight`, ADAS lamps, etc.
- **Strings** — `gear`, `adasStatus`, `pedestrian` (`clear` / `detecting` / `warning`)
- **Arrays** — `tpms` pressures
- **Objects** — `signals` for CAN viewer

```javascript
import { applyDriveState, sampleDriveFrames, listAutomotiveWidgets } from 'lightdraw/automotive';

console.log(listAutomotiveWidgets().length); // 160+

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
