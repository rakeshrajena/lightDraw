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

/** Build a labeled node box used across diagram types. */
export function createNodeBox(
  app: App,
  label: string,
  width: number,
  height: number,
  style: { fill?: string; stroke?: string; cornerRadius?: number } = {}
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
