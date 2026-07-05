# Dashboard Widget JSON Schema (Phase 7)

Load widgets via `app.loadJSON({ type: '<widget>', props: { ... } })`.

## Chart widgets (shared props)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | number | 300 | Chart width |
| height | number | 150 | Chart height |
| data | number[] | sample | Data series |
| minY | number | auto | Y-axis minimum |
| maxY | number | auto | Y-axis maximum |
| tickCount | number | 5 | Y-axis tick count |
| showLegend | boolean | true | Show legend |
| interactive | boolean | true | Hover tooltip + click select |
| seriesLabel | string | `"Series"` | Legend label |

### lineChart / areaChart

Line chart draws axes + grid. Area chart adds filled region under the line.

Events: `hover` `{ index, value }`, `select` `{ index, value }`

## Gauge widgets

| Widget | Key props | Live update |
|--------|-----------|-------------|
| gauge | value, max, size | `animateLiveValue(node, 'value', n)` |
| speedometer | value, max, size | same |
| thermometer | value, height, width | same |
| compass | heading, size | animate `heading` |
| meter | value, width, height, vertical | same |
| knob | value, size | click +10, or animate |
| battery | value | same |
| signalStrength | value (0–5) | same |

## Other widgets

| Widget | Props |
|--------|-------|
| barChart | data, width, height |
| pieChart | data, size, colors |
| legend | items: `{label, color}[]` |
| calendar | year, month, highlightDay |
| timeline | events: `{label, time?}[]`, height |
| clock | size |

## Live data update

```javascript
import { animateLiveValue } from 'lightdraw/dashboard';

animateLiveValue(gaugeNode, 'value', 82, 400);
```

## JSON round-trip

```javascript
import { toJSON } from 'lightdraw/core';
const json = toJSON(chartNode);
// { type: 'areaChart', props: { data: [...], width, height } }
```

## Performance targets

- 8 widgets dashboard: render ≤ 16 ms (canvas)
- Line chart 1000 points: render ≤ 32 ms
