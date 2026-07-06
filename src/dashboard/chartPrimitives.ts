import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { Line, RoundedRect, TextNode } from '../shapes/index';
import { syntheticEvent } from '../components/helpers';
import { bandWidth, linearScale } from './charts/core/scales';

import { DASHBOARD } from './theme';

/** Map scene world coordinates to chart-group local space (handles nested panels). */
export function chartLocalPoint(
  group: Group,
  worldX: number,
  worldY: number
): { x: number; y: number } {
  const inv = group.getWorldMatrix().invert();
  if (inv) return inv.transformPoint(worldX, worldY);
  return { x: worldX - group.x, y: worldY - group.y };
}

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

export function defaultLayout(width: number, height: number, padding = 30, legendHeight = 0): ChartLayout {
  const legendH = Math.max(0, legendHeight);
  return {
    plotX: padding,
    plotY: 10,
    plotWidth: Math.max(8, width - padding - 10),
    plotHeight: Math.max(8, height - padding - 10 - legendH),
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
  return nearestPlotIndex(data.length, layout, localX);
}

/** Index along plot X for a given point count (multi-series charts). */
export function nearestPlotIndex(count: number, layout: ChartLayout, localX: number): number {
  if (count <= 0) return 0;
  const step = layout.plotWidth / Math.max(count - 1, 1);
  const idx = Math.round((localX - layout.plotX) / step);
  return Math.max(0, Math.min(count - 1, idx));
}

/** Bar index from plot-local X (column-based charts, band scale). */
export function barIndexAtX(count: number, layout: ChartLayout, localX: number): number {
  const step = layout.plotWidth / Math.max(count, 1);
  if (step <= 0) return 0;
  const idx = Math.floor((localX - layout.plotX) / step);
  return Math.max(0, Math.min(count - 1, idx));
}

export function barGeometry(
  index: number,
  count: number,
  value: number,
  layout: ChartLayout,
  bounds: ChartBounds,
  gap = 0.2
): { x: number; y: number; width: number; height: number; centerX: number } {
  const step = layout.plotWidth / Math.max(count, 1);
  const bw = bandWidth(count, layout.plotWidth, gap);
  const range = bounds.max - bounds.min || 1;
  const height = ((value - bounds.min) / range) * layout.plotHeight;
  const x = layout.plotX + index * step + (step - bw) / 2;
  const y = layout.plotY + layout.plotHeight - height;
  return { x, y, width: bw, height, centerX: x + bw / 2 };
}

/** Row index from plot-local Y (horizontal bar charts). */
export function barIndexAtY(count: number, layout: ChartLayout, localY: number): number {
  const slot = layout.plotHeight / Math.max(count, 1);
  if (slot <= 0) return 0;
  const idx = Math.floor((localY - layout.plotY) / slot);
  return Math.max(0, Math.min(count - 1, idx));
}

export function stackedHorizontalBarGeometry(
  index: number,
  count: number,
  total: number,
  layout: ChartLayout,
  bounds: ChartBounds,
  gap = 0.2
): { x: number; y: number; width: number; height: number; centerY: number } {
  const slot = layout.plotHeight / Math.max(count, 1);
  const bh = bandWidth(count, layout.plotHeight, gap);
  const xScale = linearScale([bounds.min, bounds.max], [0, layout.plotWidth]);
  const x0 = layout.plotX + xScale(bounds.min);
  const x1 = layout.plotX + xScale(total);
  const y = layout.plotY + index * slot + (slot - bh) / 2;
  return { x: x0, y, width: Math.max(1, x1 - x0), height: bh, centerY: y + bh / 2 };
}

const CHART_TOOLTIP_PAD_X = 8;
const CHART_TOOLTIP_PAD_Y = 5;
const CHART_TOOLTIP_LINE_H = 13;
const CHART_TOOLTIP_MAX_W = 200;

export interface TooltipBounds {
  width: number;
  height: number;
}

export function chartTooltipSize(label: string): { width: number; height: number } {
  const lines = label.split('\n');
  const maxLen = Math.max(...lines.map((l) => l.length), 1);
  const width = Math.min(
    CHART_TOOLTIP_MAX_W,
    Math.max(40, Math.ceil(maxLen * 6.2) + CHART_TOOLTIP_PAD_X * 2)
  );
  const height = Math.max(22, lines.length * CHART_TOOLTIP_LINE_H + CHART_TOOLTIP_PAD_Y * 2);
  return { width, height };
}

export function chartTooltipWidth(label: string): number {
  return chartTooltipSize(label).width;
}

/** Place tooltip box and label text inside it (works on canvas and HTML renderers). */
export function positionChartTooltip(
  tooltip: RoundedRect,
  tooltipLabel: TextNode,
  centerX: number,
  topY: number,
  label: string,
  chartBounds?: TooltipBounds
): void {
  const trimmed = label.trim();
  if (!trimmed) {
    hideChartTooltip(tooltip, tooltipLabel);
    return;
  }

  const { width: tw, height: th } = chartTooltipSize(trimmed);
  let x = centerX - tw / 2;
  let y = topY;
  if (chartBounds) {
    x = Math.max(4, Math.min(x, chartBounds.width - tw - 4));
    y = Math.max(4, Math.min(y, chartBounds.height - th - 4));
  }

  tooltip.x = x;
  tooltip.y = y;
  tooltip.width = tw;
  (tooltip as { height: number }).height = th;
  tooltip.visible = true;

  tooltipLabel.text = trimmed;
  tooltipLabel.textAlign = 'center';
  tooltipLabel.x = x + tw / 2;
  const lines = trimmed.split('\n');
  const textBlockH = lines.length * CHART_TOOLTIP_LINE_H;
  tooltipLabel.y = y + Math.max(CHART_TOOLTIP_PAD_Y, (th - textBlockH) / 2);
  tooltipLabel.visible = true;
  tooltipLabel.zIndex = Math.max(tooltipLabel.zIndex, 902);
  tooltipLabel.metadata = { ...tooltipLabel.metadata, textBoxWidth: tw, chartTooltipLabel: true };
}

export function hideChartTooltip(tooltip: RoundedRect, tooltipLabel: TextNode): void {
  tooltip.visible = false;
  tooltipLabel.visible = false;
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
  let hoverIndex = -1;

  const updateHover = (localX: number) => {
    const idx = nearestDataIndex(data, layout, localX);
    if (idx === hoverIndex && parts.tooltip.visible) return;
    hoverIndex = idx;
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

    positionChartTooltip(parts.tooltip, parts.tooltipLabel, px, py - 36, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30,
    });

    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit('hover', syntheticEvent('hover', group, { index: idx, value: val }));
    group.getApp()?.requestRender();
  };

  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible) return;
    hoverIndex = -1;
    parts.crosshair.visible = false;
    parts.dot.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };

  const localXFrom = (e: { worldX: number; worldY: number }) =>
    chartLocalPoint(group, e.worldX, e.worldY).x;

  group.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localXFrom(e));
  });

  group.on('mouseleave', clearHover);

  parts.hitArea.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localXFrom(e));
  });
  parts.hitArea.on('mouseleave', clearHover);

  group.on('click', (e: { worldX: number; worldY: number }) => {
    const idx = nearestDataIndex(data, layout, localXFrom(e));
    group.emit('select', syntheticEvent('select', group, { index: idx, value: data[idx] }));
  });
}

export interface SeriesHoverItem {
  name?: string;
  data: number[];
  color?: string;
}

/** Crosshair hover showing all series values at the hovered index. */
export function wireMultiSeriesChartInteraction(
  group: Group,
  seriesList: SeriesHoverItem[],
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
  const primaryData = seriesList[0]?.data ?? [];
  const pointCount = Math.max(...seriesList.map((s) => s.data.length), 1);
  let hoverIndex = -1;

  const updateHover = (localX: number) => {
    const idx = nearestPlotIndex(pointCount, layout, localX);
    if (idx === hoverIndex && parts.tooltip.visible) return;
    hoverIndex = idx;
    const label = seriesList
      .map((s) => `${s.name ?? 'Series'}: ${s.data[idx] ?? '—'}`)
      .join('\n');

    const anchor = primaryData.length ? primaryData : seriesList[0]?.data ?? [0];
    const pts = seriesToPoints(anchor, layout, bounds);
    const px = pts[idx * 2] ?? layout.plotX;
    const py = pts[idx * 2 + 1] ?? layout.plotY;

    parts.crosshair.x = px;
    parts.crosshair.y = layout.plotY;
    parts.crosshair.x2 = 0;
    parts.crosshair.y2 = layout.plotHeight;
    parts.crosshair.visible = true;

    parts.dot.x = px - 4;
    parts.dot.y = py - 4;
    parts.dot.visible = true;

    positionChartTooltip(parts.tooltip, parts.tooltipLabel, px, py - 36, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30,
    });

    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit('hover', syntheticEvent('hover', group, { index: idx, series: seriesList.map((s) => s.data[idx]) } as Record<string, unknown>));
    group.getApp()?.requestRender();
  };

  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible) return;
    hoverIndex = -1;
    parts.crosshair.visible = false;
    parts.dot.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.crosshair.markDirty();
    parts.dot.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };

  const localXFrom = (e: { worldX: number; worldY: number }) =>
    chartLocalPoint(group, e.worldX, e.worldY).x;

  group.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localXFrom(e));
  });
  group.on('mouseleave', clearHover);
  parts.hitArea.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localXFrom(e));
  });
  parts.hitArea.on('mouseleave', clearHover);
  group.on('click', (e: { worldX: number; worldY: number }) => {
    const idx = nearestPlotIndex(pointCount, layout, localXFrom(e));
    group.emit('select', syntheticEvent('select', group, { index: idx, series: seriesList.map((s) => s.data[idx]) } as Record<string, unknown>));
  });
}

export function wireBarChartInteraction(
  group: Group,
  data: number[],
  layout: ChartLayout,
  bounds: ChartBounds,
  gap = 0.2,
  parts: {
    tooltip: RoundedRect;
    tooltipLabel: TextNode;
    highlight: Node;
    hitArea: Node;
  }
): void {
  const count = data.length;
  let hoverIndex = -1;

  const updateHover = (localX: number) => {
    const idx = barIndexAtX(count, layout, localX);
    if (idx === hoverIndex && parts.tooltip.visible) return;
    hoverIndex = idx;
    const val = data[idx];
    const geo = barGeometry(idx, count, val, layout, bounds, gap);
    const label = String(val);

    parts.highlight.x = geo.x;
    parts.highlight.y = geo.y;
    const hi = parts.highlight as unknown as { width: number; height: number };
    hi.width = geo.width;
    hi.height = geo.height;
    parts.highlight.visible = true;

    positionChartTooltip(parts.tooltip, parts.tooltipLabel, geo.centerX, geo.y - 32, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30,
    });

    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit('hover', syntheticEvent('hover', group, { index: idx, value: val }));
    group.getApp()?.requestRender();
  };

  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible) return;
    hoverIndex = -1;
    parts.highlight.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };

  const localXFrom = (e: { worldX: number; worldY: number }) =>
    chartLocalPoint(group, e.worldX, e.worldY).x;

  group.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localXFrom(e));
  });
  group.on('mouseleave', clearHover);

  parts.hitArea.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localXFrom(e));
  });
  parts.hitArea.on('mouseleave', clearHover);

  group.on('click', (e: { worldX: number; worldY: number }) => {
    const idx = barIndexAtX(count, layout, localXFrom(e));
    group.emit('select', syntheticEvent('select', group, { index: idx, value: data[idx] }));
  });
}

export function stackedBarHoverLabel(seriesList: SeriesHoverItem[], index: number): string {
  return seriesList.map((s) => `${s.name ?? 'Series'}: ${s.data[index] ?? '—'}`).join('\n');
}

/** Column hover for stacked bar charts — lists each series segment at the hovered index. */
export function wireStackedBarChartInteraction(
  group: Group,
  seriesList: SeriesHoverItem[],
  layout: ChartLayout,
  bounds: ChartBounds,
  totals: number[],
  gap = 0.2,
  parts: {
    tooltip: RoundedRect;
    tooltipLabel: TextNode;
    highlight: Node;
    hitArea: Node;
  }
): void {
  const count = totals.length;
  let hoverIndex = -1;

  const updateHover = (localX: number) => {
    const idx = barIndexAtX(count, layout, localX);
    if (idx === hoverIndex && parts.tooltip.visible) return;
    hoverIndex = idx;
    const total = totals[idx] ?? 0;
    const geo = barGeometry(idx, count, total, layout, bounds, gap);
    const label = stackedBarHoverLabel(seriesList, idx);

    parts.highlight.x = geo.x;
    parts.highlight.y = geo.y;
    const hi = parts.highlight as unknown as { width: number; height: number };
    hi.width = geo.width;
    hi.height = geo.height;
    parts.highlight.visible = true;

    positionChartTooltip(parts.tooltip, parts.tooltipLabel, geo.centerX, geo.y - 32, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30,
    });

    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit(
      'hover',
      syntheticEvent('hover', group, {
        index: idx,
        series: seriesList.map((s) => s.data[idx]),
      } as Record<string, unknown>)
    );
    group.getApp()?.requestRender();
  };

  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible) return;
    hoverIndex = -1;
    parts.highlight.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };

  const localXFrom = (e: { worldX: number; worldY: number }) =>
    chartLocalPoint(group, e.worldX, e.worldY).x;

  group.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localXFrom(e));
  });
  group.on('mouseleave', clearHover);
  parts.hitArea.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localXFrom(e));
  });
  parts.hitArea.on('mouseleave', clearHover);
  group.on('click', (e: { worldX: number; worldY: number }) => {
    const idx = barIndexAtX(count, layout, localXFrom(e));
    group.emit(
      'select',
      syntheticEvent('select', group, {
        index: idx,
        series: seriesList.map((s) => s.data[idx]),
      } as Record<string, unknown>)
    );
  });
}

/** Row hover for stacked horizontal bar charts — lists each series segment at the hovered index. */
export function wireStackedHorizontalBarChartInteraction(
  group: Group,
  seriesList: SeriesHoverItem[],
  layout: ChartLayout,
  bounds: ChartBounds,
  totals: number[],
  gap = 0.2,
  parts: {
    tooltip: RoundedRect;
    tooltipLabel: TextNode;
    highlight: Node;
    hitArea: Node;
  }
): void {
  const count = totals.length;
  let hoverIndex = -1;

  const updateHover = (localY: number) => {
    const idx = barIndexAtY(count, layout, localY);
    if (idx === hoverIndex && parts.tooltip.visible) return;
    hoverIndex = idx;
    const total = totals[idx] ?? 0;
    const geo = stackedHorizontalBarGeometry(idx, count, total, layout, bounds, gap);
    const label = stackedBarHoverLabel(seriesList, idx);

    parts.highlight.x = geo.x;
    parts.highlight.y = geo.y;
    const hi = parts.highlight as unknown as { width: number; height: number };
    hi.width = geo.width;
    hi.height = geo.height;
    parts.highlight.visible = true;

    positionChartTooltip(parts.tooltip, parts.tooltipLabel, layout.plotX + layout.plotWidth / 2, geo.y - 32, label, {
      width: layout.plotX + layout.plotWidth + 10,
      height: layout.plotY + layout.plotHeight + 30,
    });

    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.emit(
      'hover',
      syntheticEvent('hover', group, {
        index: idx,
        series: seriesList.map((s) => s.data[idx]),
      } as Record<string, unknown>)
    );
    group.getApp()?.requestRender();
  };

  const clearHover = () => {
    if (hoverIndex < 0 && !parts.tooltip.visible) return;
    hoverIndex = -1;
    parts.highlight.visible = false;
    hideChartTooltip(parts.tooltip, parts.tooltipLabel);
    parts.highlight.markDirty();
    parts.tooltip.markDirty();
    parts.tooltipLabel.markDirty();
    group.markDirty();
    group.getApp()?.requestRender();
  };

  const localYFrom = (e: { worldX: number; worldY: number }) =>
    chartLocalPoint(group, e.worldX, e.worldY).y;

  group.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localYFrom(e));
  });
  group.on('mouseleave', clearHover);
  parts.hitArea.on('mousemove', (e: { worldX: number; worldY: number }) => {
    updateHover(localYFrom(e));
  });
  parts.hitArea.on('mouseleave', clearHover);
  group.on('click', (e: { worldX: number; worldY: number }) => {
    const idx = barIndexAtY(count, layout, localYFrom(e));
    group.emit(
      'select',
      syntheticEvent('select', group, {
        index: idx,
        series: seriesList.map((s) => s.data[idx]),
      } as Record<string, unknown>)
    );
  });
}
