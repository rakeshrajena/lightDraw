import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import type { Node } from '../../../Node';
import { syntheticEvent } from '../../../components/helpers';
import type { ChartLayout } from '../../chartPrimitives';
import { chartLocalPoint, hideChartTooltip, positionChartTooltip } from '../../chartPrimitives';
import { getState, num, setParts } from '../../helpers';
import { DASHBOARD } from '../../theme';

export function isInteractive(props: Record<string, unknown>): boolean {
  return props.interactive !== false;
}

export interface HoverRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HoverParts {
  tooltip: Node & { visible: boolean; x: number; y: number; width: number; markDirty: () => void };
  tooltipLabel: Node & { text: string; x: number; y: number; textAlign: string; markDirty: () => void };
  hitArea: Node;
  highlight?: Node & { visible: boolean; x: number; y: number; markDirty: () => void };
}

function localXY(group: Group, e: { worldX: number; worldY: number }): { x: number; y: number } {
  return chartLocalPoint(group, e.worldX, e.worldY);
}

function chartSize(group: Group): { width: number; height: number } {
  const state = getState(group);
  const w = num(state, 'width', 0) || num(state, 'size', 300);
  const h = num(state, 'height', 0) || num(state, 'size', 150);
  return { width: w, height: h };
}

function showTooltip(
  group: Group,
  parts: HoverParts,
  label: string,
  centerX: number,
  topY: number,
  highlight?: HoverRect
): void {
  if (!label.trim()) {
    clearTooltip(group, parts);
    return;
  }
  if (highlight && parts.highlight) {
    parts.highlight.x = highlight.x;
    parts.highlight.y = highlight.y;
    const hi = parts.highlight as unknown as { width: number; height: number };
    hi.width = highlight.width;
    hi.height = highlight.height;
    parts.highlight.visible = true;
    parts.highlight.markDirty();
  }
  const bounds = chartSize(group);
  positionChartTooltip(
    parts.tooltip as Parameters<typeof positionChartTooltip>[0],
    parts.tooltipLabel as Parameters<typeof positionChartTooltip>[1],
    centerX,
    topY,
    label,
    bounds
  );
  parts.tooltip.markDirty();
  parts.tooltipLabel.markDirty();
  group.markDirty();
  group.getApp()?.requestRender();
}

function clearTooltip(group: Group, parts: HoverParts): void {
  if (!parts.tooltip.visible && !(parts.highlight?.visible)) return;
  hideChartTooltip(
    parts.tooltip as Parameters<typeof hideChartTooltip>[0],
    parts.tooltipLabel as Parameters<typeof hideChartTooltip>[1]
  );
  if (parts.highlight) parts.highlight.visible = false;
  parts.tooltip.markDirty();
  parts.tooltipLabel.markDirty();
  parts.highlight?.markDirty();
  group.markDirty();
  group.getApp()?.requestRender();
}

function bindHover(
  group: Group,
  parts: HoverParts,
  onMove: (x: number, y: number) => { label: string; centerX: number; topY: number; highlight?: HoverRect; payload?: unknown } | null
): void {
  let lastHoverKey = '';

  const handleMove = (e: { worldX: number; worldY: number }) => {
    const { x, y } = localXY(group, e);
    const hit = onMove(x, y);
    if (!hit) {
      lastHoverKey = '';
      clearTooltip(group, parts);
      return;
    }
    const key = `${hit.label}|${hit.centerX}|${hit.topY}`;
    if (key === lastHoverKey) return;
    lastHoverKey = key;
    showTooltip(group, parts, hit.label, hit.centerX, hit.topY, hit.highlight);
    group.emit('hover', syntheticEvent('hover', group, (hit.payload ?? { value: hit.label }) as Record<string, unknown>));
  };

  const handleClear = () => {
    lastHoverKey = '';
    clearTooltip(group, parts);
  };

  group.on('mousemove', handleMove);
  group.on('mouseleave', handleClear);
  parts.hitArea.on('mousemove', handleMove);
  parts.hitArea.on('mouseleave', handleClear);

  group.on('click', (e: { worldX: number; worldY: number }) => {
    const { x, y } = localXY(group, e);
    const hit = onMove(x, y);
    if (hit) group.emit('select', syntheticEvent('select', group, (hit.payload ?? { value: hit.label }) as Record<string, unknown>));
  });
}

export function createHoverParts(app: App, rect: HoverRect, withHighlight = true): HoverParts {
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
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    fill: 'rgba(0,0,0,0.001)',
    listening: true,
    zIndex: 800,
  });
  const highlight = withHighlight
    ? app.rect({
        fill: 'rgba(96,165,250,0.28)',
        stroke: DASHBOARD.chartLine,
        strokeWidth: 2,
        visible: false,
        listening: false,
      })
    : undefined;
  return { tooltip, tooltipLabel, hitArea, highlight };
}

export function mountHover(
  group: Group,
  app: App,
  props: Record<string, unknown>,
  rect: HoverRect,
  onMove: (x: number, y: number) => { label: string; centerX: number; topY: number; highlight?: HoverRect; payload?: unknown } | null,
  withHighlight = true
): void {
  if (!isInteractive(props)) return;
  const parts = createHoverParts(app, rect, withHighlight);
  const nodes = parts.highlight
    ? [parts.highlight, parts.tooltip, parts.tooltipLabel, parts.hitArea]
    : [parts.tooltip, parts.tooltipLabel, parts.hitArea];
  group.add(...nodes);
  bindHover(group, parts, onMove);
  setParts(group, parts as unknown as Record<string, Node>);
}

/** Index from plot-local X (columns, time series slots). */
export function attachIndexXHover(
  app: App,
  group: Group,
  props: Record<string, unknown>,
  layout: ChartLayout,
  count: number,
  labelAt: (index: number) => string,
  highlightAt?: (index: number) => HoverRect,
  payloadAt?: (index: number) => unknown
): void {
  if (!isInteractive(props) || count <= 0) return;
  const slot = layout.plotWidth / Math.max(count, 1);
  mountHover(
    group,
    app,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    (x) => {
      const idx = Math.max(0, Math.min(count - 1, Math.floor((x - layout.plotX) / slot)));
      const centerX = layout.plotX + slot * idx + slot / 2;
      return {
        label: labelAt(idx),
        centerX,
        topY: layout.plotY - 8,
        highlight: highlightAt?.(idx),
        payload: payloadAt ? payloadAt(idx) : { index: idx, value: labelAt(idx) },
      };
    }
  );
}

/** Index from plot-local Y (horizontal bars, row bands). */
export function attachIndexYHover(
  app: App,
  group: Group,
  props: Record<string, unknown>,
  layout: ChartLayout,
  count: number,
  labelAt: (index: number) => string,
  highlightAt?: (index: number) => HoverRect
): void {
  if (!isInteractive(props) || count <= 0) return;
  const slot = layout.plotHeight / Math.max(count, 1);
  mountHover(
    group,
    app,
    props,
    { x: layout.plotX, y: layout.plotY, width: layout.plotWidth, height: layout.plotHeight },
    (_x, y) => {
      const idx = Math.max(0, Math.min(count - 1, Math.floor((y - layout.plotY) / slot)));
      const centerY = layout.plotY + slot * idx + slot / 2;
      return {
        label: labelAt(idx),
        centerX: layout.plotX + layout.plotWidth / 2,
        topY: centerY - 32,
        highlight: highlightAt?.(idx),
        payload: { index: idx, value: labelAt(idx) },
      };
    }
  );
}

/** Vertical bands across full widget height (funnel, pyramid). */
export function attachBandYHover(
  app: App,
  group: Group,
  props: Record<string, unknown>,
  width: number,
  height: number,
  count: number,
  labelAt: (index: number) => string
): void {
  if (!isInteractive(props) || count <= 0) return;
  const band = height / count;
  mountHover(group, app, props, { x: 0, y: 0, width, height }, (_x, y) => {
    const idx = Math.max(0, Math.min(count - 1, Math.floor(y / band)));
    return {
      label: labelAt(idx),
      centerX: width / 2,
      topY: idx * band + 4,
      highlight: { x: 0, y: idx * band, width, height: band },
      payload: { index: idx, value: labelAt(idx) },
    };
  });
}

/** Pie / doughnut slice by angle from center. */
export function attachPolarSliceHover(
  app: App,
  group: Group,
  props: Record<string, unknown>,
  size: number,
  data: number[],
  labels?: string[],
  innerRadius = 0
): void {
  if (!isInteractive(props) || !data.length) return;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 10;
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let start = -Math.PI / 2;
  const slices = data.map((val, i) => {
    const sweep = (val / total) * Math.PI * 2;
    const slice = { start, end: start + sweep, val, i };
    start += sweep;
    return slice;
  });
  mountHover(
    group,
    app,
    props,
    { x: 0, y: 0, width: size, height: size },
    (x, y) => {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.hypot(dx, dy);
      if (r < innerRadius || r > outerR) return null;
      let angle = Math.atan2(dy, dx);
      if (angle < -Math.PI / 2) angle += Math.PI * 2;
      const hit = slices.find((s) => angle >= s.start && angle < s.end);
      if (!hit) return null;
      const mid = (hit.start + hit.end) / 2;
      const lr = (outerR + innerRadius) / 2;
      const tx = cx + lr * Math.cos(mid);
      const ty = cy + lr * Math.sin(mid);
      const name = labels?.[hit.i];
      const label = name ?? String(hit.val);
      return {
        label,
        centerX: tx,
        topY: ty - 28,
        payload: { index: hit.i, value: hit.val, label: name },
      };
    },
    false
  );
}

/** Matrix / grid cell hover. */
export function attachGridHover(
  app: App,
  group: Group,
  props: Record<string, unknown>,
  width: number,
  height: number,
  rows: number,
  cols: number,
  valueAt: (row: number, col: number) => string
): void {
  if (!isInteractive(props) || rows <= 0 || cols <= 0) return;
  const cw = width / cols;
  const ch = height / rows;
  mountHover(group, app, props, { x: 0, y: 0, width, height }, (x, y) => {
    const col = Math.max(0, Math.min(cols - 1, Math.floor(x / cw)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(y / ch)));
    const label = valueAt(row, col);
    if (!label.trim()) return null;
    return {
      label,
      centerX: col * cw + cw / 2,
      topY: row * ch - 4,
      highlight: { x: col * cw, y: row * ch, width: cw, height: ch },
      payload: { row, col, value: valueAt(row, col) },
    };
  });
}

export interface PlotPoint {
  x: number;
  y: number;
  label: string;
  payload?: unknown;
}

/** Nearest point in plot space (scatter, bubble, network nodes). */
export function attachNearestHover(
  app: App,
  group: Group,
  props: Record<string, unknown>,
  rect: HoverRect,
  points: PlotPoint[],
  radius = 80
): void {
  if (!isInteractive(props) || !points.length) return;
  mountHover(group, app, props, rect, (x, y) => {
    let best: PlotPoint | null = null;
    let bestD = radius * radius;
    for (const p of points) {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (!best) return null;
    const label = best.label ?? '';
    if (!label.trim()) return null;
    return {
      label,
      centerX: best.x,
      topY: best.y - 28,
      payload: best.payload ?? { label },
    };
  }, false);
}

/** Hit-test axis-aligned regions (treemap, gantt, sankey nodes). */
export function attachRegionsHover(
  app: App,
  group: Group,
  props: Record<string, unknown>,
  width: number,
  height: number,
  regions: { x: number; y: number; width: number; height: number; label: string; payload?: unknown }[]
): void {
  if (!isInteractive(props) || !regions.length) return;
  mountHover(group, app, props, { x: 0, y: 0, width, height }, (x, y) => {
    const hit = regions.find(
      (r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
    );
    if (!hit) return null;
    const label = hit.label ?? '';
    if (!label.trim()) return null;
    return {
      label,
      centerX: hit.x + hit.width / 2,
      topY: hit.y - 8,
      highlight: { x: hit.x, y: hit.y, width: hit.width, height: hit.height },
      payload: hit.payload ?? { label },
    };
  });
}

/** Single-value or static tooltip on hover (bullet, pictogram). */
export function attachValueHover(
  app: App,
  group: Group,
  props: Record<string, unknown>,
  width: number,
  height: number,
  label: string
): void {
  if (!isInteractive(props)) return;
  mountHover(
    group,
    app,
    props,
    { x: 0, y: 0, width, height },
    () => ({
      label,
      centerX: width / 2,
      topY: height * 0.2,
      payload: { value: label },
    }),
    false
  );
}
