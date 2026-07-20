import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import type { DiagramData, DiagramEdge, DiagramNode } from './types';
import { createLabeledBox } from './primitives';

export { centerTextX, measureTextWidth } from './primitives';

export function num(props: Record<string, unknown>, key: string, fallback: number): number {
  const v = props[key];
  return typeof v === 'number' ? v : fallback;
}

export function str(props: Record<string, unknown>, key: string, fallback = ''): string {
  const v = props[key];
  return typeof v === 'string' ? v : fallback;
}

export function bool(props: Record<string, unknown>, key: string, fallback = false): boolean {
  const v = props[key];
  return typeof v === 'boolean' ? v : fallback;
}

export function arr<T>(props: Record<string, unknown>, key: string, fallback: T[] = []): T[] {
  const v = props[key];
  return Array.isArray(v) ? (v as T[]) : fallback;
}

export function getDiagramState(node: Node): Record<string, unknown> {
  const state = node.metadata?.diagramState;
  if (state && typeof state === 'object') return state as Record<string, unknown>;
  return {};
}

export function setDiagramState(node: Node, patch: Record<string, unknown>): void {
  node.metadata.diagramState = { ...getDiagramState(node), ...patch };
}

/** Create a diagram group with metadata for JSON round-trip. */
export function createDiagramGroup(
  app: App,
  type: string,
  props: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): Group {
  const group = app.group({
    ...(props as Record<string, unknown>),
    metadata: {
      diagramType: type,
      diagramState: { ...props },
      ...(props.demoId != null ? { demoId: props.demoId } : {}),
    },
    ...extra,
  }) as Group;
  setDiagramState(group, { ...props });
  return group;
}

/** Serialize a diagram node back to JSON. */
export function diagramToJSON(node: Node): { type: string; props: Record<string, unknown> } {
  const type = str(node.metadata, 'diagramType', 'diagram');
  const state = getDiagramState(node);
  return {
    type,
    props: {
      x: node.x,
      y: node.y,
      ...state,
    },
  };
}

/** Seeded PRNG for reproducible layouts. */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export interface GridLayoutSpec {
  cols: number;
  cellW: number;
  cellH: number;
  paddingX: number;
  paddingY: number;
}

export function readCanvasSize(
  options: Record<string, unknown>,
  fallbackW = 800,
  fallbackH = 500
): { width: number; height: number } {
  return {
    width: typeof options.width === 'number' ? options.width : fallbackW,
    height: typeof options.height === 'number' ? options.height : fallbackH,
  };
}

/** Compute responsive grid columns and spacing for diagram auto-layout */
export function resolveGridLayout(
  nodeCount: number,
  canvasW: number,
  canvasH: number,
  nodeW = 130,
  nodeH = 80,
  minPadding = 16
): GridLayoutSpec {
  const tight = canvasW < 520 || canvasH < 360;
  const maxCols = tight
    ? Math.max(1, Math.floor((canvasW - minPadding * 2) / (nodeW * 0.9)))
    : Math.max(2, Math.ceil(Math.sqrt(nodeCount * (canvasW / Math.max(canvasH, 1)))));
  const cols = Math.max(1, Math.min(maxCols, nodeCount));
  const rows = Math.ceil(nodeCount / cols);
  const paddingX = Math.max(minPadding, Math.round(canvasW * 0.04));
  const paddingY = Math.max(minPadding, Math.round(canvasH * 0.05));
  const availW = Math.max(nodeW, canvasW - paddingX * 2);
  const availH = Math.max(nodeH, canvasH - paddingY * 2);
  const cellW = cols <= 1 ? nodeW : Math.max(nodeW * 0.72, (availW - nodeW) / Math.max(cols - 1, 1));
  const cellH = rows <= 1 ? nodeH : Math.max(nodeH * 0.72, (availH - nodeH) / Math.max(rows - 1, 1));
  return { cols, cellW, cellH, paddingX, paddingY };
}

/** Auto-place diagram nodes on a grid when positions are missing */
export function autoLayoutNodes(
  nodes: Array<{ id: string; x?: number; y?: number }>,
  cols = 3,
  cellW = 150,
  cellH = 80,
  paddingX = 24,
  paddingY = 24
): void {
  const needs = nodes.some((n) => n.x === undefined || n.y === undefined);
  if (!needs) return;
  nodes.forEach((n, i) => {
    if (n.x === undefined) n.x = paddingX + (i % cols) * cellW;
    if (n.y === undefined) n.y = paddingY + Math.floor(i / cols) * cellH;
  });
}

/** Responsive grid auto-layout using canvas dimensions from options */
export function autoLayoutNodesResponsive(
  nodes: Array<{ id: string; x?: number; y?: number }>,
  canvasW: number,
  canvasH: number,
  nodeW = 130,
  nodeH = 80
): void {
  const needs = nodes.some((n) => n.x === undefined || n.y === undefined);
  if (!needs) return;
  const { cols, cellW, cellH, paddingX, paddingY } = resolveGridLayout(
    nodes.length,
    canvasW,
    canvasH,
    nodeW,
    nodeH
  );
  nodes.forEach((n, i) => {
    if (n.x === undefined) n.x = paddingX + (i % cols) * cellW;
    if (n.y === undefined) n.y = paddingY + Math.floor(i / cols) * cellH;
  });
}

/**
 * Push overlapping diagram nodes apart so symbols do not stack on render.
 * Uses card metadata sizes when available; iterates a few times for stability.
 * Skips mind-map / org nested trees (call only on flat diagram node lists).
 */
export function separateOverlappingNodes(
  nodes: Node[],
  opts?: { gap?: number; iterations?: number; canvasW?: number; canvasH?: number }
): void {
  if (nodes.length < 2) return;
  const gap = opts?.gap ?? 16;
  const iterations = opts?.iterations ?? 8;
  const canvasW = opts?.canvasW;
  const canvasH = opts?.canvasH;

  const sizeOf = (n: Node): { w: number; h: number } => {
    const w =
      (n.metadata?.diagramCardWidth as number | undefined) ??
      (n.metadata?.orgCardWidth as number | undefined) ??
      120;
    const h =
      (n.metadata?.diagramCardHeight as number | undefined) ??
      (n.metadata?.orgCardHeight as number | undefined) ??
      48;
    return { w: Math.max(24, w), h: Math.max(20, h) };
  };

  for (let iter = 0; iter < iterations; iter++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const sa = sizeOf(a);
        const sb = sizeOf(b);
        const ax1 = a.x;
        const ay1 = a.y;
        const ax2 = a.x + sa.w;
        const ay2 = a.y + sa.h;
        const bx1 = b.x;
        const by1 = b.y;
        const bx2 = b.x + sb.w;
        const by2 = b.y + sb.h;
        const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1);
        const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1);
        if (overlapX <= -gap || overlapY <= -gap) continue;

        // Separate along the smaller penetration axis
        const acx = a.x + sa.w / 2;
        const acy = a.y + sa.h / 2;
        const bcx = b.x + sb.w / 2;
        const bcy = b.y + sb.h / 2;
        const needX = overlapX + gap;
        const needY = overlapY + gap;
        if (needX < needY) {
          const dir = bcx >= acx ? 1 : -1;
          const push = needX / 2;
          a.x -= dir * push;
          b.x += dir * push;
        } else {
          const dir = bcy >= acy ? 1 : -1;
          const push = needY / 2;
          a.y -= dir * push;
          b.y += dir * push;
        }
        moved = true;
      }
    }
    if (canvasW != null || canvasH != null) {
      for (const n of nodes) {
        const s = sizeOf(n);
        if (canvasW != null) n.x = Math.max(8, Math.min(canvasW - s.w - 8, n.x));
        if (canvasH != null) n.y = Math.max(8, Math.min(canvasH - s.h - 8, n.y));
      }
    }
    if (!moved) break;
  }
  for (const n of nodes) n.markDirty?.();
}

/** Union bounds of diagram content nodes (excludes connector layers). */
/**
 * Axis-aligned content box in the node's own local space.
 * Avoids Group.getBounds() which returns world coordinates and would
 * double-count when composed with parent offsets in fitToBounds.
 */
function localContentBox(node: Node): { x: number; y: number; width: number; height: number } {
  const cardW =
    (node.metadata?.orgCardWidth as number | undefined) ??
    (node.metadata?.diagramCardWidth as number | undefined);
  const cardH =
    (node.metadata?.orgCardHeight as number | undefined) ??
    (node.metadata?.diagramCardHeight as number | undefined);
  if (typeof cardW === 'number' && typeof cardH === 'number' && cardW > 0 && cardH > 0) {
    const tap = typeof node.metadata?.diagramTapPad === 'number' ? node.metadata.diagramTapPad : 0;
    return { x: 0, y: -tap, width: cardW, height: cardH + tap };
  }

  const group = node as Group;
  if (Array.isArray(group.children) && group.children.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const child of group.children) {
      if (child.visible === false) continue;
      const lb = localContentBox(child);
      minX = Math.min(minX, child.x + lb.x);
      minY = Math.min(minY, child.y + lb.y);
      maxX = Math.max(maxX, child.x + lb.x + lb.width);
      maxY = Math.max(maxY, child.y + lb.y + lb.height);
    }
    if (!Number.isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  return node.getBounds();
}

function diagramContentBounds(group: Group): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const nodes: Node[] = [];
  const walk = (parent: Group): void => {
    for (const child of parent.children) {
      if (
        child.metadata?.diagramId ||
        child.metadata?.orgNode ||
        child.metadata?.symbolType ||
        child.metadata?.pipelineStatus !== undefined
      ) {
        nodes.push(child);
      }
      if ('children' in child && (child as Group).children?.length) {
        walk(child as Group);
      }
    }
  };
  walk(group);

  const sources: Node[] =
    nodes.length > 0 ? [...nodes] : group.children.filter((c) => c.zIndex >= 0);

  // Include root-level chrome (CAN bus rails, labels, terminators) so fit does not crop them
  if (nodes.length > 0) {
    const seen = new Set(sources);
    for (const child of group.children) {
      if (child.metadata?.diagramEdgeLayer) continue;
      if (seen.has(child)) continue;
      if (child.metadata?.diagramId || child.metadata?.orgNode) continue;
      sources.push(child);
      seen.add(child);
    }
  }

  if (sources.length === 0) return group.getBounds();

  const posInRoot = (node: Node): { x: number; y: number } => {
    let x = 0;
    let y = 0;
    let cur: Node | null = node;
    while (cur && cur !== group) {
      x += cur.x;
      y += cur.y;
      cur = cur.parent;
    }
    return { x, y };
  };

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const child of sources) {
    const b = localContentBox(child);
    const p = posInRoot(child);
    minX = Math.min(minX, p.x + b.x);
    minY = Math.min(minY, p.y + b.y);
    maxX = Math.max(maxX, p.x + b.x + b.width);
    maxY = Math.max(maxY, p.y + b.y + b.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Scale and translate a diagram group to fit within canvas bounds */
export function fitDiagramToBounds(
  group: Group,
  canvasW: number,
  canvasH: number,
  padding = 20,
  options: { allowScaleUp?: boolean; maxScaleUp?: number } = {}
): { scale: number; offsetX: number; offsetY: number } {
  const allowScaleUp = options.allowScaleUp ?? true;
  const maxScaleUp = options.maxScaleUp ?? 2.1;
  const b = diagramContentBounds(group);
  const contentW = Math.max(b.width, 1);
  const contentH = Math.max(b.height, 1);
  const availW = canvasW - padding * 2;
  const availH = canvasH - padding * 2;
  let scale = Math.min(availW / contentW, availH / contentH);
  if (scale > 1 && allowScaleUp) scale = Math.min(scale, maxScaleUp);
  else if (scale > 1) scale = 1;
  const offsetX = padding + (availW - contentW * scale) / 2 - b.x * scale;
  const offsetY = padding + (availH - contentH * scale) / 2 - b.y * scale;
  group.scaleX = scale;
  group.scaleY = scale;
  group.x = offsetX;
  group.y = offsetY;
  group.markDirty();
  return { scale, offsetX, offsetY };
}

/** Build a labeled node box used across diagram types. */
export function createNodeBox(
  app: App,
  label: string,
  width: number,
  height: number,
  style: {
    fill?: string;
    stroke?: string;
    cornerRadius?: number;
    accentColor?: string;
  } = {}
): Group {
  return createLabeledBox(app, label, width, height, style);
}

/** Apply positions from a map to diagram node groups by diagramId. */
export function applyPositions(
  group: Group,
  positions: Map<string, { x: number; y: number }>
): void {
  for (const child of group.children) {
    const id = child.metadata?.diagramId as string | undefined;
    if (id && positions.has(id)) {
      const pos = positions.get(id)!;
      child.x = pos.x;
      child.y = pos.y;
      child.markDirty();
    }
  }
}

/** Collect diagram nodes and edges from generic data. */
export function normalizeDiagramData(data: DiagramData): {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
} {
  return {
    nodes: data.nodes ?? [],
    edges: data.edges ?? [],
  };
}
