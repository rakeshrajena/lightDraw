import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { TextNode } from '../shapes/index';
import { syntheticEvent } from '../components/helpers';

export interface ChartLayout {
  plotX: number;
  plotY: number;
  plotWidth: number;
  plotHeight: number;
}

export interface ChartBounds {
  min: number;
  max: number;
}

/** Compute evenly spaced tick values for a numeric range. */
export function computeTicks(min: number, max: number, count = 5): number[] {
  if (count < 2) return [min];
  if (min === max) return [min, max];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round((min + i * step) * 100) / 100);
}

export function dataBounds(data: number[], minY?: number, maxY?: number): ChartBounds {
  const dataMin = data.length ? Math.min(...data) : 0;
  const dataMax = data.length ? Math.max(...data) : 1;
  const min = minY ?? Math.min(dataMin, 0);
  let max = maxY ?? dataMax;
  if (max <= min) max = min + 1;
  return { min, max };
}

export function defaultLayout(width: number, height: number, padding = 30): ChartLayout {
  return {
    plotX: padding,
    plotY: 10,
    plotWidth: width - padding - 10,
    plotHeight: height - padding - 10,
  };
}

export function seriesToPoints(
  data: number[],
  layout: ChartLayout,
  bounds: ChartBounds
): number[] {
  const step = layout.plotWidth / Math.max(data.length - 1, 1);
  const range = bounds.max - bounds.min || 1;
  const points: number[] = [];
  for (let i = 0; i < data.length; i++) {
    points.push(
      layout.plotX + i * step,
      layout.plotY + layout.plotHeight - ((data[i] - bounds.min) / range) * layout.plotHeight
    );
  }
  return points;
}

export function areaPathFromPoints(points: number[], baselineY: number): string {
  if (points.length < 4) return '';
  let d = `M ${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) {
    d += ` L ${points[i]} ${points[i + 1]}`;
  }
  const lastX = points[points.length - 2];
  d += ` L ${lastX} ${baselineY} L ${points[0]} ${baselineY} Z`;
  return d;
}

export function addGridLines(
  app: App,
  group: Group,
  layout: ChartLayout,
  yTicks: number[],
  bounds: ChartBounds,
  xDivisions = 4
): void {
  const range = bounds.max - bounds.min || 1;
  for (const tick of yTicks) {
    const y =
      layout.plotY + layout.plotHeight - ((tick - bounds.min) / range) * layout.plotHeight;
    group.add(
      app.line({
        x: layout.plotX,
        y,
        x2: layout.plotX + layout.plotWidth,
        y2: y,
        stroke: '#374151',
        strokeWidth: 1,
        dash: [4, 4],
        listening: false,
      })
    );
  }
  for (let i = 0; i <= xDivisions; i++) {
    const x = layout.plotX + (layout.plotWidth / xDivisions) * i;
    group.add(
      app.line({
        x,
        y: layout.plotY,
        x2: x,
        y2: layout.plotY + layout.plotHeight,
        stroke: '#374151',
        strokeWidth: 1,
        dash: [4, 4],
        listening: false,
      })
    );
  }
}

export function addAxes(
  app: App,
  group: Group,
  layout: ChartLayout,
  bounds: ChartBounds,
  yTicks: number[],
  tickCount = 5
): void {
  group.add(
    app.line({
      x: layout.plotX,
      y: layout.plotY,
      x2: layout.plotX,
      y2: layout.plotY + layout.plotHeight,
      stroke: '#9ca3af',
      strokeWidth: 1,
      listening: false,
    })
  );
  group.add(
    app.line({
      x: layout.plotX,
      y: layout.plotY + layout.plotHeight,
      x2: layout.plotX + layout.plotWidth,
      y2: layout.plotY + layout.plotHeight,
      stroke: '#9ca3af',
      strokeWidth: 1,
      listening: false,
    })
  );

  const range = bounds.max - bounds.min || 1;
  const ticks = yTicks.length ? yTicks : computeTicks(bounds.min, bounds.max, tickCount);
  for (const tick of ticks) {
    const y =
      layout.plotY + layout.plotHeight - ((tick - bounds.min) / range) * layout.plotHeight;
    group.add(
      app.text({
        text: String(tick),
        x: 2,
        y: y - 6,
        fontSize: 10,
        fill: '#9ca3af',
        listening: false,
      })
    );
  }
}

export function addLegend(
  app: App,
  group: Group,
  items: { label: string; color: string }[],
  x: number,
  y: number
): void {
  items.forEach((item, i) => {
    const ly = y + i * 18;
    group.add(
      app.rect({ x, y: ly, width: 12, height: 12, fill: item.color, listening: false }),
      app.text({ text: item.label, x: x + 16, y: ly - 1, fontSize: 11, fill: '#d1d5db', listening: false })
    );
  });
}

export function nearestDataIndex(
  data: number[],
  layout: ChartLayout,
  localX: number
): number {
  const step = layout.plotWidth / Math.max(data.length - 1, 1);
  const idx = Math.round((localX - layout.plotX) / step);
  return Math.max(0, Math.min(data.length - 1, idx));
}

export function wireChartInteraction(
  group: Group,
  data: number[],
  layout: ChartLayout,
  tooltip: Node,
  tooltipLabel: Node
): void {
  group.on('mousemove', (e: { worldX: number; worldY: number }) => {
    const localX = e.worldX - group.x;
    const idx = nearestDataIndex(data, layout, localX);
    const pts = seriesToPoints(data, layout, dataBounds(data));
    const px = pts[idx * 2];
    const py = pts[idx * 2 + 1];
    tooltip.x = px - 20;
    tooltip.y = py - 28;
    tooltip.visible = true;
    (tooltipLabel as TextNode).text = String(data[idx]);
    group.emit('hover', syntheticEvent('hover', group, { index: idx, value: data[idx] }));
    group.getApp()?.requestRender();
  });

  group.on('mouseleave', () => {
    tooltip.visible = false;
    group.getApp()?.requestRender();
  });

  group.on('click', (e: { worldX: number }) => {
    const idx = nearestDataIndex(data, layout, e.worldX - group.x);
    group.emit('select', syntheticEvent('select', group, { index: idx, value: data[idx] }));
  });
}
