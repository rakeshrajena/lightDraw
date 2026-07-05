import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { Line, RoundedRect, TextNode } from '../shapes/index';
import { syntheticEvent } from '../components/helpers';

import { DASHBOARD } from './theme';

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
        x2: layout.plotWidth,
        y2: 0,
        stroke: DASHBOARD.chartGrid,
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
        x2: 0,
        y2: layout.plotHeight,
        stroke: DASHBOARD.chartGrid,
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
      x2: 0,
      y2: layout.plotHeight,
      stroke: DASHBOARD.chartAxis,
      strokeWidth: 1,
      listening: false,
    })
  );
  group.add(
    app.line({
      x: layout.plotX,
      y: layout.plotY + layout.plotHeight,
      x2: layout.plotWidth,
      y2: 0,
      stroke: DASHBOARD.chartAxis,
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
        fill: DASHBOARD.textMuted,
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
      app.text({ text: item.label, x: x + 16, y: ly - 1, fontSize: 11, fill: DASHBOARD.text, listening: false })
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
  bounds: ChartBounds,
  parts: {
    tooltip: RoundedRect;
    tooltipLabel: TextNode;
    crosshair: Line;
    dot: Node;
    hitArea: Node;
  }
): void {
  const updateHover = (localX: number) => {
    const idx = nearestDataIndex(data, layout, localX);
    const pts = seriesToPoints(data, layout, bounds);
    const px = pts[idx * 2];
    const py = pts[idx * 2 + 1];
    const val = data[idx];
    const label = String(val);

    parts.crosshair.x = px;
    parts.crosshair.y = layout.plotY;
    parts.crosshair.x2 = 0;
    parts.crosshair.y2 = layout.plotHeight;
    parts.crosshair.visible = true;

    parts.dot.x = px - 4;
    parts.dot.y = py - 4;
    parts.dot.visible = true;

    const tw = Math.max(44, label.length * 8 + 20);
    parts.tooltip.x = px - tw / 2;
    parts.tooltip.y = py - 36;
    parts.tooltip.width = tw;
    parts.tooltip.visible = true;

    parts.tooltipLabel.text = label;
    parts.tooltipLabel.x = px - tw / 2 + 10;
    parts.tooltipLabel.y = py - 28;

    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit('hover', syntheticEvent('hover', group, { index: idx, value: val }));
    group.getApp()?.requestRender();
  };

  const clearHover = () => {
    parts.crosshair.visible = false;
    parts.dot.visible = false;
    parts.tooltip.visible = false;
    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };

  group.on('mousemove', (e: { worldX: number }) => {
    updateHover(e.worldX - group.x);
  });

  group.on('mouseleave', clearHover);

  parts.hitArea.on('mousemove', (e: { worldX: number }) => {
    updateHover(e.worldX - group.x);
  });
  parts.hitArea.on('mouseleave', clearHover);

  group.on('click', (e: { worldX: number }) => {
    const idx = nearestDataIndex(data, layout, e.worldX - group.x);
    group.emit('select', syntheticEvent('select', group, { index: idx, value: data[idx] }));
  });
}
