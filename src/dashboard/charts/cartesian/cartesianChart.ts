import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import type { Node } from '../../../Node';
import {
  addAxes,
  addGridLines,
  addLegend,
  areaPathFromPoints,
  dataBounds,
  seriesToPoints,
  wireBarChartInteraction,
  wireChartInteraction,
  wireMultiSeriesChartInteraction,
  wireStackedBarChartInteraction,
  wireStackedHorizontalBarChartInteraction,
} from '../../chartPrimitives';
import { createWidgetGroup, setParts, setState } from '../../helpers';
import { DASHBOARD } from '../../theme';
import { attachIndexYHover } from '../core/interaction';
import { attachPlotWheelZoom } from '../core/zoom';
import { installChartRebuild } from '../core/refresh';
import { buildChartContext } from '../core/layout';
import { normalizeBumpRanks, parseSeries, stackSeries } from '../core/series';
import { bandWidth, linearScale } from '../core/scales';
import { catmullRomPath, pointsToPairs, stepPoints } from '../core/spline';
import type { ChartSeries, CartesianVariant } from '../types';

export interface CartesianBuildOptions {
  variant: CartesianVariant;
  widgetType: string;
}

function valueToY(v: number, layout: ReturnType<typeof buildChartContext>['layout'], bounds: { min: number; max: number }): number {
  const range = bounds.max - bounds.min || 1;
  return layout.plotY + layout.plotHeight - ((v - bounds.min) / range) * layout.plotHeight;
}

function addPlotChrome(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  props: Record<string, unknown>
): void {
  const { width, height, layout, bounds, yTicks } = ctx;
  const minimal = ctx.series.length === 0 || props.minimalAxes === true || ['sparkline'].includes(String(props.variant));
  group.add(app.rect({ width, height, fill: DASHBOARD.chartBg, listening: true }));
  group.add(
    app.rect({
      x: layout.plotX,
      y: layout.plotY,
      width: layout.plotWidth,
      height: layout.plotHeight,
      fill: DASHBOARD.chartPlot,
      stroke: null,
      listening: false,
    })
  );
  if (!minimal && props.showGrid !== false) {
    addGridLines(app, group, layout, yTicks, bounds);
    addAxes(app, group, layout, bounds, yTicks);
  }
}

function addInteraction(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  props: Record<string, unknown>,
  primaryData: number[],
  allSeries?: ChartSeries[]
): void {
  if (props.interactive === false) return;
  const { layout, bounds } = ctx;
  const crosshair = app.line({
    x: layout.plotX,
    y: layout.plotY,
    x2: 0,
    y2: layout.plotHeight,
    stroke: DASHBOARD.chartCrosshair,
    strokeWidth: 1,
    dash: [4, 4],
    visible: false,
    listening: false,
  });
  const dot = app.circle({
    x: 0,
    y: 0,
    radius: 5,
    fill: DASHBOARD.chartDot,
    stroke: DASHBOARD.chartLine,
    strokeWidth: 2,
    visible: false,
    listening: false,
  });
  const tooltip = app.roundedRect({
    width: 52,
    height: 24,
    cornerRadius: 6,
    fill: DASHBOARD.chartTooltipBg,
    stroke: DASHBOARD.chartTooltipBorder,
    strokeWidth: 1,
    visible: false,
    listening: false,
    zIndex: 900,
  });
  const tooltipLabel = app.text({
    text: '',
    fontSize: 11,
    fontWeight: 'bold',
    fill: DASHBOARD.text,
    textAlign: 'center',
    x: 0,
    y: 0,
    visible: false,
    listening: false,
    zIndex: 901,
  });
  const hitArea = app.rect({
    x: layout.plotX,
    y: layout.plotY,
    width: layout.plotWidth,
    height: layout.plotHeight,
    fill: 'rgba(0,0,0,0.001)',
    listening: true,
    zIndex: 800,
  });
  group.add(crosshair, dot, tooltip, tooltipLabel, hitArea);
  const seriesForHover = allSeries && allSeries.length > 1 ? allSeries : null;
  if (seriesForHover) {
    wireMultiSeriesChartInteraction(group, seriesForHover, layout, bounds, {
      tooltip,
      tooltipLabel,
      crosshair,
      dot,
      hitArea,
    });
  } else {
    wireChartInteraction(group, primaryData, layout, bounds, {
      tooltip,
      tooltipLabel,
      crosshair,
      dot,
      hitArea,
    });
  }

  if (props.zoomEnabled !== false && props.interactive !== false) {
    attachPlotWheelZoom(group, hitArea, bounds);
  }

  setParts(group, { crosshair, dot, tooltip, tooltipLabel, hitArea });
}

function drawLineSeries(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  series: ChartSeries,
  variant: CartesianVariant
): void {
  const { layout, bounds } = ctx;
  const color = series.color ?? DASHBOARD.chartLine;
  const toXY = (i: number, v: number): [number, number] => [
    layout.plotX + (layout.plotWidth / Math.max(series.data.length - 1, 1)) * i,
    valueToY(v, layout, bounds),
  ];

  let points: number[];
  if (variant === 'step' || variant === 'run' || variant === 'control') {
    points = stepPoints(series.data, toXY);
  } else {
    points = seriesToPoints(series.data, layout, bounds);
  }

  if (variant === 'area' || variant === 'stackedArea' || variant === 'rangeArea' || variant === 'ribbon' || variant === 'horizon') {
    const baselineY = layout.plotY + layout.plotHeight;
    group.add(
      app.path({
        d: areaPathFromPoints(points, baselineY),
        fill: color,
        opacity: 0.35,
        stroke: null,
        listening: false,
      })
    );
  }

  if (variant === 'spline') {
    const path = catmullRomPath(pointsToPairs(points));
    group.add(app.path({ d: path, fill: null, stroke: color, strokeWidth: 2.5, listening: false }));
  } else {
    group.add(
      app.polyline({
        points,
        fill: null,
        stroke: color,
        strokeWidth: 2.5,
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      })
    );
  }
}

function drawBarSeries(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  series: ChartSeries,
  horizontal: boolean,
  stackBase?: number[]
): Node[] {
  const { layout, bounds } = ctx;
  const n = series.data.length;
  const gap = 0.2;
  const bars: Node[] = [];
  const color = series.color ?? DASHBOARD.barFill;

  if (horizontal) {
    const bw = bandWidth(n, layout.plotHeight, gap);
    const scale = linearScale([bounds.min, bounds.max], [0, layout.plotWidth]);
    const rowStep = layout.plotHeight / n;
    series.data.forEach((val: number, i: number) => {
      const base = stackBase?.[i] ?? bounds.min;
      const x0 = scale(base);
      const x1 = scale(val);
      const y = layout.plotY + rowStep * i + (rowStep - bw) / 2;
      const bar = app.rect({
        x: layout.plotX + x0,
        y,
        width: Math.max(1, x1 - x0),
        height: bw,
        fill: color,
        listening: false,
      });
      bars.push(bar);
      group.add(bar);
    });
  } else {
    const bw = bandWidth(n, layout.plotWidth, gap);
    series.data.forEach((val: number, i: number) => {
      const base = stackBase?.[i] ?? bounds.min;
      const yTop = valueToY(val, layout, bounds);
      const yBase = valueToY(base, layout, bounds);
      const x = layout.plotX + (layout.plotWidth / n) * i + (layout.plotWidth / n - bw) / 2;
      const bar = app.rect({
        x,
        y: Math.min(yTop, yBase),
        width: bw,
        height: Math.max(1, Math.abs(yBase - yTop)),
        fill: color,
        listening: false,
      });
      bars.push(bar);
      group.add(bar);
    });
  }
  return bars;
}

function drawWaterfall(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  data: number[]
): void {
  const { layout, bounds } = ctx;
  const n = data.length;
  const bw = bandWidth(n, layout.plotWidth, 0.25);
  let running = 0;
  data.forEach((delta, i) => {
    const start = running;
    running += delta;
    const y0 = valueToY(start, layout, bounds);
    const y1 = valueToY(running, layout, bounds);
    const x = layout.plotX + (layout.plotWidth / n) * i + (layout.plotWidth / n - bw) / 2;
    group.add(
      app.rect({
        x,
        y: Math.min(y0, y1),
        width: bw,
        height: Math.max(1, Math.abs(y1 - y0)),
        fill: delta >= 0 ? DASHBOARD.success : DASHBOARD.danger,
        listening: false,
      })
    );
  });
}

function drawPareto(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  data: number[]
): void {
  drawBarSeries(app, group, ctx, { data, color: DASHBOARD.barFill }, false);
  const sorted = [...data];
  const total = sorted.reduce((a, b) => a + b, 0) || 1;
  const cum: number[] = [];
  let acc = 0;
  for (const v of sorted) {
    acc += v;
    cum.push((acc / total) * 100);
  }
  const cumBounds = { min: 0, max: 100 };
  const pts = seriesToPoints(cum, ctx.layout, cumBounds);
  group.add(
    app.polyline({
      points: pts,
      fill: null,
      stroke: DASHBOARD.warning,
      strokeWidth: 2,
      listening: false,
    })
  );
}

function drawControlChart(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  data: number[],
  limits?: { mean: number; ucl: number; lcl: number }
): void {
  drawLineSeries(app, group, ctx, { data, color: DASHBOARD.chartLine }, 'step');
  if (!limits) {
    const mean = data.reduce((a, b) => a + b, 0) / (data.length || 1);
    const sd = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / (data.length || 1));
    limits = { mean, ucl: mean + 2 * sd, lcl: mean - 2 * sd };
  }
  for (const [val, label, color] of [
    [limits.mean, 'μ', DASHBOARD.textMuted],
    [limits.ucl, 'UCL', DASHBOARD.danger],
    [limits.lcl, 'LCL', DASHBOARD.danger],
  ] as const) {
    const y = valueToY(val, ctx.layout, ctx.bounds);
    group.add(
      app.line({
        x: ctx.layout.plotX,
        y,
        x2: ctx.layout.plotWidth,
        y2: 0,
        stroke: color,
        strokeWidth: 1,
        dash: label === 'μ' ? [] : [6, 4],
        listening: false,
      }),
      app.text({
        text: label,
        x: ctx.layout.plotX + ctx.layout.plotWidth - 24,
        y: y - 12,
        fontSize: 9,
        fill: color,
        listening: false,
      })
    );
  }
}

function drawPopulationPyramid(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  left: number[],
  right: number[]
): void {
  const max = Math.max(...left, ...right, 1);
  const bounds = { min: -max, max };
  const n = Math.max(left.length, right.length);
  const bh = ctx.layout.plotHeight / n - 2;
  for (let i = 0; i < n; i++) {
    const y = ctx.layout.plotY + i * (bh + 2);
    const cx = ctx.layout.plotX + ctx.layout.plotWidth / 2;
    const lw = ((left[i] ?? 0) / max) * (ctx.layout.plotWidth / 2 - 4);
    const rw = ((right[i] ?? 0) / max) * (ctx.layout.plotWidth / 2 - 4);
    group.add(
      app.rect({ x: cx - lw, y, width: lw, height: bh, fill: DASHBOARD.primary, listening: false }),
      app.rect({ x: cx, y, width: rw, height: bh, fill: DASHBOARD.secondary, listening: false })
    );
  }
  ctx.bounds.min = bounds.min;
  ctx.bounds.max = bounds.max;
}

function drawLollipop(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  data: number[]
): void {
  const { layout, bounds } = ctx;
  const n = data.length;
  data.forEach((val, i) => {
    const x = layout.plotX + (layout.plotWidth / Math.max(n - 1, 1)) * i;
    const y = valueToY(val, layout, bounds);
    const y0 = layout.plotY + layout.plotHeight;
    group.add(
      app.line({ x, y: y0, x2: 0, y2: y - y0, stroke: DASHBOARD.chartLine, strokeWidth: 2, listening: false }),
      app.circle({ x: x - 4, y: y - 4, radius: 4, fill: DASHBOARD.chartDot, listening: false })
    );
  });
}

function drawDotStrip(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  data: number[],
  strip = false
): void {
  const { layout, bounds } = ctx;
  data.forEach((val, i) => {
    const jitter = strip ? ((i % 5) - 2) * 4 : (Math.sin(i * 12.9898) * 43758.5453 % 1) * 10 - 5;
    const x = layout.plotX + (layout.plotWidth / Math.max(data.length, 1)) * (i + 0.5) + jitter;
    const y = valueToY(val, layout, bounds);
    group.add(app.circle({ x: x - 3, y: y - 3, radius: 3, fill: DASHBOARD.chartDot, listening: false }));
  });
}

function drawErrorBars(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  series: ChartSeries
): void {
  const { layout, bounds } = ctx;
  const errors = series.errorY ?? series.data.map((v: number) => [v - 5, v + 5] as [number, number]);
  series.data.forEach((val: number, i: number) => {
    const x = layout.plotX + (layout.plotWidth / Math.max(series.data.length - 1, 1)) * i;
    const [lo, hi] = errors[i] ?? [val - 5, val + 5];
    const yLo = valueToY(lo, layout, bounds);
    const yHi = valueToY(hi, layout, bounds);
    group.add(
      app.line({ x, y: yLo, x2: 0, y2: yHi - yLo, stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false }),
      app.line({ x: x - 4, y: yLo, x2: 8, y2: 0, stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false }),
      app.line({ x: x - 4, y: yHi, x2: 8, y2: 0, stroke: DASHBOARD.textMuted, strokeWidth: 1, listening: false }),
      app.circle({ x: x - 3, y: valueToY(val, layout, bounds) - 3, radius: 3, fill: DASHBOARD.chartLine, listening: false })
    );
  });
}

function drawRangeBand(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  series: ChartSeries,
  filled: boolean
): void {
  const mins = series.rangeMin ?? series.data.map((v: number) => v - 8);
  const maxs = series.rangeMax ?? series.data.map((v: number) => v + 8);
  const { layout, bounds } = ctx;
  const ptsTop: number[] = [];
  const ptsBot: number[] = [];
  for (let i = 0; i < series.data.length; i++) {
    const x = layout.plotX + (layout.plotWidth / Math.max(series.data.length - 1, 1)) * i;
    ptsTop.push(x, valueToY(maxs[i], layout, bounds));
    ptsBot.unshift(valueToY(mins[i], layout, bounds), x);
  }
  const all = [...ptsTop, ...ptsBot];
  if (filled) {
    let d = `M ${all[0]} ${all[1]}`;
    for (let i = 2; i < all.length; i += 2) d += ` L ${all[i]} ${all[i + 1]}`;
    d += ' Z';
    group.add(app.path({ d, fill: DASHBOARD.chartArea, stroke: null, listening: false }));
  } else {
    group.add(
      app.polyline({ points: ptsTop, fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 1.5, listening: false }),
      app.polyline({ points: ptsBot.reverse(), fill: null, stroke: DASHBOARD.chartLine, strokeWidth: 1.5, listening: false })
    );
  }
  drawLineSeries(app, group, ctx, series, 'line');
}

function drawHorizon(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  series: ChartSeries,
  bands = 4,
  rowLayout?: ReturnType<typeof buildChartContext>['layout']
): void {
  const layout = rowLayout ?? ctx.layout;
  const { bounds } = ctx;
  const bandH = layout.plotHeight / bands;
  const offset = (bounds.max - bounds.min) / bands;
  for (let b = 0; b < bands; b++) {
    const subBounds = { min: bounds.min + b * offset, max: bounds.min + (b + 1) * offset };
    const pts = seriesToPoints(series.data, { ...layout, plotY: layout.plotY + b * bandH, plotHeight: bandH }, subBounds);
    group.add(
      app.path({
        d: areaPathFromPoints(pts, layout.plotY + (b + 1) * bandH),
        fill: series.color ?? DASHBOARD.series[b % DASHBOARD.series.length],
        opacity: 0.55,
        stroke: null,
        listening: false,
      })
    );
  }
}

function drawHorizonRows(
  app: App,
  group: Group,
  ctx: ReturnType<typeof buildChartContext>,
  allSeries: ChartSeries[]
): void {
  const rowH = ctx.layout.plotHeight / allSeries.length;
  allSeries.forEach((s, si) => {
    const rowLayout = {
      ...ctx.layout,
      plotY: ctx.layout.plotY + si * rowH,
      plotHeight: Math.max(8, rowH - 2),
    };
    const rowBounds = dataBounds(s.data);
    drawHorizon(app, group, { ...ctx, bounds: rowBounds }, s, 3, rowLayout);
    group.add(
      app.text({
        text: s.name ?? `S${si + 1}`,
        x: ctx.layout.plotX - 2,
        y: rowLayout.plotY + 2,
        fontSize: 9,
        fill: DASHBOARD.textMuted,
        listening: false,
      })
    );
  });
}

export function buildCartesianChart(
  group: Group,
  app: App,
  props: Record<string, unknown>,
  options: CartesianBuildOptions
): void {
  const variant = options.variant;
  let series = parseSeries(props);
  const rawSeries = series.map((s) => ({
    name: s.name,
    data: [...s.data],
    color: s.color,
  }));
  const mirror = props.mirrorData as number[] | undefined;

  if (variant === 'stackedBar' || variant === 'stackedColumn' || variant === 'stackedArea') {
    series = stackSeries(series);
  }
  if (variant === 'bump') {
    series = normalizeBumpRanks(series);
  }

  const ctx = buildChartContext(props, series);
  addPlotChrome(app, group, ctx, { ...props, variant });

  const horizontal =
    variant === 'horizontalBar' ||
    variant === 'stackedBar' ||
    variant === 'populationPyramid' ||
    props.orientation === 'horizontal';

  if (variant === 'waterfall') {
    drawWaterfall(app, group, ctx, series[0]?.data ?? []);
  } else if (variant === 'pareto') {
    drawPareto(app, group, ctx, series[0]?.data ?? []);
  } else if (variant === 'control') {
    drawControlChart(app, group, ctx, series[0]?.data ?? [], props.controlLimits as { mean: number; ucl: number; lcl: number });
  } else if (variant === 'populationPyramid') {
    drawPopulationPyramid(app, group, ctx, series[0]?.data ?? [], mirror ?? series[1]?.data ?? []);
  } else if (variant === 'lollipop') {
    drawLollipop(app, group, ctx, series[0]?.data ?? []);
  } else if (variant === 'dotPlot') {
    drawDotStrip(app, group, ctx, series[0]?.data ?? [], false);
  } else if (variant === 'stripPlot') {
    drawDotStrip(app, group, ctx, series[0]?.data ?? [], true);
  } else if (variant === 'errorBar') {
    drawErrorBars(app, group, ctx, series[0]);
  } else if (variant === 'range' || variant === 'band') {
    drawRangeBand(app, group, ctx, series[0], false);
  } else if (variant === 'rangeArea') {
    drawRangeBand(app, group, ctx, series[0], true);
  } else if (variant === 'horizon') {
    if (series.length > 1) {
      drawHorizonRows(app, group, ctx, series);
    } else {
      drawHorizon(app, group, ctx, series[0]);
    }
  } else if (
    variant === 'bar' ||
    variant === 'horizontalBar' ||
    variant === 'stackedBar' ||
    variant === 'stackedColumn' ||
    variant === 'combination' ||
    variant === 'mixed'
  ) {
    const stacked = variant === 'stackedBar' || variant === 'stackedColumn';
    series.forEach((s, si) => {
      const base = stacked ? (s as ChartSeries & { _base?: number[] })._base : undefined;
      const kind = variant === 'mixed' || variant === 'combination' ? s.type ?? (si === 0 ? 'bar' : 'line') : 'bar';
      if (kind === 'line' || kind === 'area') {
        drawLineSeries(app, group, ctx, s, kind === 'area' ? 'area' : 'line');
      } else {
        drawBarSeries(app, group, ctx, s, horizontal, base);
      }
    });
  } else if (variant === 'ribbon') {
    series.forEach((s) => drawLineSeries(app, group, ctx, s, 'area'));
  } else {
    series.forEach((s) => {
      drawLineSeries(app, group, ctx, s, variant === 'stackedArea' ? 'stackedArea' : variant);
    });
  }

  if (props.showLegend !== false && variant !== 'sparkline') {
    addLegend(
      app,
      group,
      series.map((s) => ({ label: s.name ?? 'Series', color: s.color ?? DASHBOARD.chartLine })),
      ctx.layout.plotX,
      ctx.layout.plotY + ctx.layout.plotHeight + 4
    );
  }

  const primaryData = series[0]?.data ?? [];
  const isStacked = variant === 'stackedBar' || variant === 'stackedColumn';
  const stackedMulti = isStacked && rawSeries.length > 1;
  const stackedTotals = isStacked ? (series[series.length - 1]?.data ?? primaryData) : primaryData;

  if (['bar', 'horizontalBar', 'stackedBar', 'stackedColumn', 'waterfall', 'pareto'].includes(variant)) {
    if (horizontal) {
      const n = primaryData.length;
      if (stackedMulti) {
        const highlight = app.rect({
          fill: 'rgba(96,165,250,0.28)',
          stroke: DASHBOARD.chartLine,
          strokeWidth: 2,
          visible: false,
          listening: false,
        });
        const tooltip = app.roundedRect({
          width: 52,
          height: 24,
          cornerRadius: 6,
          fill: DASHBOARD.chartTooltipBg,
          stroke: DASHBOARD.chartTooltipBorder,
          strokeWidth: 1,
          visible: false,
          listening: false,
        });
        const tooltipLabel = app.text({
          text: '',
          fontSize: 11,
          fontWeight: 'bold',
          fill: DASHBOARD.text,
          textAlign: 'center',
          x: 0,
          y: 0,
          listening: false,
        });
        const hitArea = app.rect({
          x: ctx.layout.plotX,
          y: ctx.layout.plotY,
          width: ctx.layout.plotWidth,
          height: ctx.layout.plotHeight,
          fill: 'rgba(0,0,0,0.001)',
          listening: true,
        });
        group.add(highlight, tooltip, tooltipLabel, hitArea);
        if (props.interactive !== false) {
          wireStackedHorizontalBarChartInteraction(group, rawSeries, ctx.layout, ctx.bounds, stackedTotals, 0.2, {
            tooltip,
            tooltipLabel,
            highlight,
            hitArea,
          });
        }
        setParts(group, { highlight, tooltip, tooltipLabel, hitArea });
      } else {
        const bw = bandWidth(n, ctx.layout.plotHeight, 0.2);
        const xScale = linearScale([ctx.bounds.min, ctx.bounds.max], [0, ctx.layout.plotWidth]);
        attachIndexYHover(
          app,
          group,
          props,
          ctx.layout,
          n,
          (i) => String(primaryData[i]),
          (i) => {
            const slot = ctx.layout.plotHeight / Math.max(n, 1);
            const val = primaryData[i];
            const x0 = ctx.layout.plotX + xScale(ctx.bounds.min);
            const x1 = ctx.layout.plotX + xScale(val);
            const y = ctx.layout.plotY + slot * i + (slot - bw) / 2;
            return { x: x0, y, width: Math.max(1, x1 - x0), height: bw };
          }
        );
      }
    } else {
      const highlight = app.rect({ fill: 'rgba(96,165,250,0.28)', stroke: DASHBOARD.chartLine, strokeWidth: 2, visible: false, listening: false });
      const tooltip = app.roundedRect({ width: 52, height: 24, cornerRadius: 6, fill: DASHBOARD.chartTooltipBg, stroke: DASHBOARD.chartTooltipBorder, strokeWidth: 1, visible: false, listening: false });
      const tooltipLabel = app.text({ text: '', fontSize: 11, fontWeight: 'bold', fill: DASHBOARD.text, textAlign: 'center', x: 0, y: 0, listening: false });
      const hitArea = app.rect({ x: ctx.layout.plotX, y: ctx.layout.plotY, width: ctx.layout.plotWidth, height: ctx.layout.plotHeight, fill: 'rgba(0,0,0,0.001)', listening: true });
      group.add(highlight, tooltip, tooltipLabel, hitArea);
      if (props.interactive !== false) {
        if (stackedMulti) {
          wireStackedBarChartInteraction(group, rawSeries, ctx.layout, ctx.bounds, stackedTotals, 0.2, {
            tooltip,
            tooltipLabel,
            highlight,
            hitArea,
          });
        } else {
          wireBarChartInteraction(group, primaryData, ctx.layout, ctx.bounds, 0.2, {
            tooltip,
            tooltipLabel,
            highlight,
            hitArea,
          });
        }
      }
      setParts(group, { highlight, tooltip, tooltipLabel, hitArea });
    }
  } else if (variant !== 'sparkline') {
    addInteraction(app, group, ctx, props, primaryData, series.length > 1 ? series : undefined);
  }

  setState(group, {
    width: ctx.width,
    height: ctx.height,
    data: primaryData,
    series,
    variant,
  });
}

export function createCartesianWidget(
  app: App,
  type: string,
  props: Record<string, unknown>,
  variant: CartesianVariant
): Group {
  const group = createWidgetGroup(app, type, props);
  installChartRebuild(group, app, (g, a, p) =>
    buildCartesianChart(g, a, p, { variant, widgetType: type })
  );
  return group;
}
