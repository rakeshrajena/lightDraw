import { attachIndexXHover, attachIndexYHover } from '../core/interaction';
import { registerDashboard } from '../../registryCore';
import { createWidgetGroup, num, setState } from '../../helpers';
import { getActiveDashboard } from '../../theme';
import { defaultLayout, dataBounds, computeTicks, addAxes, addGridLines } from '../../chartPrimitives';
import { linearScale } from '../core/scales';
import {
  SAMPLE_OHLC,
  toHeikinAshi,
  toKagi,
  toPointAndFigure,
  toRenko,
  volumeProfile,
} from '../core/financial';
import type { OhlcBar } from '../types';

function ohlcLabel(b: OhlcBar): string {
  return `C:${b.close} H:${b.high} L:${b.low}`;
}

function attachOhlcHover(
  app: import('../../../App').App,
  group: import('../../../shapes/Group').Group,
  props: Record<string, unknown>,
  layout: ReturnType<typeof defaultLayout>,
  bars: OhlcBar[]
): void {
  attachIndexXHover(app, group, props, layout, bars.length, (i) => ohlcLabel(bars[i]), undefined, (i) => ({
    index: i,
    bar: bars[i],
    value: bars[i].close,
  }));
}

function getOhlc(props: Record<string, unknown>): OhlcBar[] {
  return (props.data as OhlcBar[]) ?? SAMPLE_OHLC;
}

function plotFinancial(
  app: import('../../../App').App,
  group: import('../../../shapes/Group').Group,
  bars: OhlcBar[],
  width: number,
  height: number,
  props: Record<string, unknown>,
  style: 'candle' | 'ohlc' | 'hilo' = 'candle'
): ReturnType<typeof defaultLayout> {
  const lows = bars.map((b) => b.low);
  const highs = bars.map((b) => b.high);
  const bounds = { min: Math.min(...lows), max: Math.max(...highs) };
  const layout = defaultLayout(width, height);
  const yTicks = computeTicks(bounds.min, bounds.max, 5);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  group.add(app.rect({ x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight, fill: getActiveDashboard().chartPlot, listening: false }));
  addGridLines(app, group, layout, yTicks, bounds);
  addAxes(app, group, layout, bounds, yTicks);
  const slot = layout.plotWidth / Math.max(bars.length, 1);
  const yScale = linearScale([bounds.min, bounds.max], [layout.plotY + layout.plotHeight, layout.plotY]);

  bars.forEach((b, i) => {
    const cx = layout.plotX + slot * i + slot / 2;
    const yH = yScale(b.high);
    const yL = yScale(b.low);
    const up = b.close >= b.open;
    const color = up ? getActiveDashboard().financialUp : getActiveDashboard().financialDown;
    if (style === 'ohlc') {
      group.add(
        app.line({ x: cx, y: yH, x2: 0, y2: yL - yH, stroke: color, strokeWidth: 1, listening: false }),
        app.line({ x: cx - slot * 0.3, y: yScale(b.open), x2: slot * 0.3, y2: 0, stroke: color, strokeWidth: 2, listening: false }),
        app.line({ x: cx, y: yScale(b.close), x2: slot * 0.3, y2: 0, stroke: color, strokeWidth: 2, listening: false })
      );
    } else if (style === 'hilo') {
      group.add(app.line({ x: cx, y: yH, x2: 0, y2: yL - yH, stroke: color, strokeWidth: 2, listening: false }));
    } else {
      const yO = yScale(b.open);
      const yC = yScale(b.close);
      const bodyTop = Math.min(yO, yC);
      const bodyH = Math.max(2, Math.abs(yC - yO));
      group.add(
        app.line({ x: cx, y: yH, x2: 0, y2: yL - yH, stroke: color, strokeWidth: 1, listening: false }),
        app.rect({ x: cx - slot * 0.25, y: bodyTop, width: slot * 0.5, height: bodyH, fill: up ? color : getActiveDashboard().chartBg, stroke: color, strokeWidth: 1, listening: false })
      );
    }
  });
  attachOhlcHover(app, group, props, layout, bars);
  return layout;
}

function registerOhlcChart(type: string, style: 'candle' | 'ohlc' | 'hilo', transform?: (bars: OhlcBar[]) => OhlcBar[]): void {
  registerDashboard(type, (props, app) => {
    const width = num(props, 'width', 300);
    const height = num(props, 'height', 150);
    let bars = getOhlc(props);
    const group = createWidgetGroup(app, type, props);
    if (transform) bars = transform(bars);
    plotFinancial(app, group, bars, width, height, props, style);
    setState(group, { width, height, data: bars });
    return group;
  });
}

registerOhlcChart('candlestickChart', 'candle');
registerOhlcChart('kLineChart', 'candle');
registerOhlcChart('ohlcChart', 'ohlc');
registerOhlcChart('highLowChart', 'hilo');
registerOhlcChart('heikinAshiChart', 'candle', toHeikinAshi);
registerOhlcChart('renkoChart', 'candle', (b) => toRenko(b, 3));
registerOhlcChart('pointAndFigureChart', 'candle', (b) => toPointAndFigure(b, 2));

registerDashboard('kagiChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const bars = getOhlc(props);
  const pts = toKagi(bars, num(props, 'reversal', 4));
  const group = createWidgetGroup(app, 'kagiChart', props);
  const layout = defaultLayout(width, height);
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  const ys = pts.map((p) => p.y);
  const bounds = dataBounds(ys);
  const yScale = linearScale([bounds.min, bounds.max], [layout.plotY + layout.plotHeight, layout.plotY]);
  const linePts: number[] = [];
  pts.forEach((p, i) => {
    linePts.push(layout.plotX + (layout.plotWidth * i) / Math.max(pts.length - 1, 1), yScale(p.y));
  });
  group.add(app.polyline({ points: linePts, fill: null, stroke: getActiveDashboard().chartLine, strokeWidth: 2, listening: false }));
  attachIndexXHover(app, group, props, layout, pts.length, (i) => `price: ${pts[i].y.toFixed(2)}`);
  setState(group, { width, height, data: bars });
  return group;
});

registerDashboard('volumeChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 120);
  const bars = getOhlc(props);
  const group = createWidgetGroup(app, 'volumeChart', props);
  const layout = defaultLayout(width, height);
  const maxVol = Math.max(...bars.map((b) => b.volume ?? 0), 1);
  const slot = layout.plotWidth / bars.length;
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  bars.forEach((b, i) => {
    const v = b.volume ?? 0;
    const h = (v / maxVol) * layout.plotHeight;
    const up = b.close >= b.open;
    group.add(
      app.rect({
        x: layout.plotX + i * slot,
        y: layout.plotY + layout.plotHeight - h,
        width: slot - 2,
        height: h,
        fill: up ? getActiveDashboard().financialUp : getActiveDashboard().financialDown,
        listening: false,
      })
    );
  });
  attachIndexXHover(app, group, props, layout, bars.length, (i) => `vol: ${bars[i].volume ?? 0}`);
  setState(group, { width, height, data: bars });
  return group;
});

registerDashboard('candlestickVolumeChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 220);
  const bars = getOhlc(props);
  const group = createWidgetGroup(app, 'candlestickVolumeChart', props);
  plotFinancial(app, group, bars, width, height * 0.65, props, 'candle');
  const volH = height * 0.3;
  const layout = defaultLayout(width, volH);
  layout.plotY = height * 0.68;
  const maxVol = Math.max(...bars.map((b) => b.volume ?? 0), 1);
  const slot = layout.plotWidth / bars.length;
  bars.forEach((b, i) => {
    const v = b.volume ?? 0;
    const h = (v / maxVol) * layout.plotHeight;
    group.add(
      app.rect({
        x: layout.plotX + i * slot,
        y: layout.plotY + layout.plotHeight - h,
        width: slot - 2,
        height: h,
        fill: getActiveDashboard().inactiveBar,
        listening: false,
      })
    );
  });
  attachIndexXHover(app, group, props, layout, bars.length, (i) => `vol: ${bars[i].volume ?? 0}`);
  setState(group, { width, height, data: bars });
  return group;
});

registerDashboard('volumeProfileChart', (props, app) => {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const bars = getOhlc(props);
  const profile = volumeProfile(bars, num(props, 'bins', 12));
  const group = createWidgetGroup(app, 'volumeProfileChart', props);
  const layout = defaultLayout(width, height);
  const maxV = Math.max(...profile.map((p) => p.volume), 1);
  const minP = Math.min(...profile.map((p) => p.price));
  const maxP = Math.max(...profile.map((p) => p.price));
  group.add(app.rect({ width, height, fill: getActiveDashboard().chartBg, listening: true }));
  profile.forEach((p) => {
    const y = layout.plotY + layout.plotHeight - ((p.price - minP) / (maxP - minP || 1)) * layout.plotHeight;
    const w = (p.volume / maxV) * layout.plotWidth * 0.4;
    group.add(app.rect({ x: layout.plotX, y: y - 4, width: w, height: 8, fill: getActiveDashboard().primary, listening: false }));
  });
  attachIndexYHover(app, group, props, layout, profile.length, (i) => `price ${profile[i].price.toFixed(1)} vol ${profile[i].volume}`);
  setState(group, { width, height, data: bars });
  return group;
});
