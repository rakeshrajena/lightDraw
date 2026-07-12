# Dashboard Widget JSON Schema (Phase 7+)

Load widgets via `app.loadJSON({ type: '<widget>', props: { ... } })`.

## Common props

| Prop | Type | Description |
|------|------|-------------|
| uiTheme | string \| object | Optional Phase 6 override — UI preset name (`violet`) or token patch. Wins over app `setUiTheme`. |
| theme | string \| object | Alias for `uiTheme` when value is a UI preset or object (not automotive) |

## Chart catalog (82 types)

All chart types ship in `lightdraw.dashboard`. Open `examples/demo-dashboard.html` and switch to **Chart catalog (82)**.

### Cartesian charts (shared props)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | number | 300 | Chart width |
| height | number | 150 | Chart height |
| data | number[] | sample | Single-series values |
| series | ChartSeries[] | — | Multi-series (`name`, `data`, `type`, `color`, `colorStops`) |
| categories | string[] | auto | X-axis labels |
| minY / maxY | number | auto | Y-axis bounds |
| tickCount | number | 5 | Y-axis ticks |
| showLegend | boolean | true | Legend |
| interactive | boolean | true | Hover tooltip + select |
| orientation | `vertical` \| `horizontal` | vertical | Bar orientation |
| colorStops | `{ upTo?: number; color: string }[]` | — | Per-bar colors by value (alias: `thresholds`) |

**Cartesian types:** `lineChart`, `areaChart`, `barChart`, `columnChart` (alias), `horizontalBarChart`, `stackedColumnChart`, `stackedBarChart`, `stackedAreaChart`, `stepChart`, `splineChart`, `errorBarChart`, `lollipopChart`, `dotPlot`, `stripPlot`, `sparklineChart`, `rangeChart`, `rangeAreaChart`, `bandChart`, `ribbonChart`, `combinationChart`, `mixedChart`, `waterfallChart`, `paretoChart`, `runChart`, `controlChart`, `populationPyramidChart`, `bumpChart`, `horizonChart`

### Polar & funnel

`pieChart`, `doughnutChart` (`innerRadius`), `radarChart`, `spiderChart` (alias), `polarAreaChart`, `bulletChart`, `funnelChart`, `pyramidChart`, `coneChart`

### Statistical

`histogram`, `boxPlot`, `boxAndWhiskerChart`, `violinPlot`, `densityPlot`, `heatmap` (`matrix`), `hexbinChart`, `contourChart`, `qqPlot`, `beeswarmChart`, `ridgelinePlot`, `parallelCoordinatesPlot`, `mosaicChart`, `marimekkoChart`, `mekkoChart`, `waffleChart`, `calendarHeatmap`, `stemLeafPlot`, `scatterChart`, `bubbleChart`

### Financial

```ts
data: { time: string|number; open: number; high: number; low: number; close: number; volume?: number }[]
```

Types: `candlestickChart`, `kLineChart`, `ohlcChart`, `heikinAshiChart`, `renkoChart`, `kagiChart`, `pointAndFigureChart`, `volumeChart`, `candlestickVolumeChart`, `highLowChart`, `volumeProfileChart`

### Hierarchical & flow

`treemap`, `sunburstChart`, `treeChart`, `dendrogramChart`, `sankeyChart` (`nodes`, `links`), `chordChart`, `alluvialChart`, `streamgraph`, `networkChart`, `timeline`, `ganttChart`

### 3D & specialty

`surfaceChart3d`, `wireframeChart3d`, `meshChart3d` (`zGrid`), `vectorFieldChart`, `pictogramChart`, `wordCloudChart`

## Gauge widgets

| Widget | Key props | Live update |
|--------|-----------|-------------|
| gauge | value, max, size, `colorStops`, `colorZones` | `animateLiveValue(node, 'value', n)` |
| speedometer | value, max, size, `colorStops`, `colorZones` | same |
| thermometer | value, height, width, `colorStops` | same |
| compass | heading, size | animate `heading` |
| meter | value, width, height, vertical, `colorStops` | same |
| knob | value, size | click +10, or animate |
| battery | value, `colorStops` | same |
| signalStrength | value (0–5) | same |

### Conditional colors (`colorStops` / `colorZones`)

Value-based colors for gauges, meters, batteries, thermometers, and bar/column charts.
Semantic tokens (`primary` | `success` | `warning` | `danger` | `secondary`) resolve against the active dashboard theme; any CSS color (`#hex`, `rgb()`, `hsl()`, named) passes through.

```js
{
  type: 'gauge',
  props: {
    value: 82,
    max: 100,
    // Needle / fill color by value (alias: thresholds)
    colorStops: [
      { upTo: 40, color: 'success' },
      { upTo: 75, color: 'warning' },
      { color: 'danger' },          // catch-all
    ],
    // Static dial arc segments (alias: zones). from/to are 0–1 of max, or absolute if > 1
    colorZones: [
      { from: 0, to: 0.55, color: 'success' },
      { from: 0.55, to: 0.78, color: 'warning' },
      { from: 0.78, to: 1, color: 'danger' },
    ],
  },
}
```

Bar charts accept the same `colorStops` (chart-level or per `series` entry) so each bar fill follows its value:

```js
{
  type: 'barChart',
  props: {
    data: [12, 45, 78, 30],
    colorStops: [
      { upTo: 30, color: 'success' },
      { upTo: 60, color: 'warning' },
      { color: 'danger' },
    ],
  },
}
```

Helpers: `resolveValueColor`, `readColorStops` from `lightdraw/dashboard`.

**Demo:** [examples/demo-color-stops.html](../examples/demo-color-stops.html)

## Live data & responsive updates

```javascript
import {
  animateLiveValue,
  updateChartProps,
  pushChartValue,
  installChartResizeObserver,
  detachChartResizeObserver,
} from 'lightdraw/dashboard';

animateLiveValue(gaugeNode, 'value', 82, 400);
updateChartProps(chartNode, { width: 400, height: 220 });

// Auto-fit chart when container resizes (panels, maximize, grid)
installChartResizeObserver(chartNode, containerEl, { minWidth: 120, minHeight: 80 });
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| zoomEnabled | boolean | true | Wheel Y-axis zoom on cartesian charts |
| responsive | boolean | — | Pair with `installChartResizeObserver` |

**`chartPanel`** — framed chart: `{ chartType: 'lineChart', title: 'Latency', width, height, data }`

**`calendar`** — pass `width` and `height`; cell size scales to fit.

## Performance targets

- 8 widgets dashboard: render ≤ 16 ms (canvas)
- Line chart 1000 points: render ≤ 32 ms
- Full chart gallery smoke: all 82 types render without error
