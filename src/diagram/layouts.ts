import type { Group } from '../shapes/Group';
import { treeLayout } from '../layout/index';
import { seededRandom } from './helpers';
import type { DiagramEdge, DiagramNode } from './types';

export interface ForceLayoutOptions {
  width?: number;
  height?: number;
  iterations?: number;
  seed?: number;
  repulsion?: number;
  attraction?: number;
  damping?: number;
}

export interface ForceNode {
  id: string;
  x?: number;
  y?: number;
}

export interface ForceEdge {
  from: string;
  to: string;
}

/** Physics-based force-directed layout with seeded reproducibility. */
export function forceDirectedLayout(
  nodes: ForceNode[],
  edges: ForceEdge[],
  options: ForceLayoutOptions = {}
): Map<string, { x: number; y: number }> {
  const {
    width = 600,
    height = 400,
    iterations = 100,
    seed = 42,
    repulsion = 4000,
    attraction = 0.05,
    damping = 0.85,
  } = options;

  const rand = seededRandom(seed);
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();

  for (const n of nodes) {
    positions.set(n.id, {
      x: n.x ?? rand() * width,
      y: n.y ?? rand() * height,
      vx: 0,
      vy: 0,
    });
  }

  for (let iter = 0; iter < iterations; iter++) {
    const forces = new Map<string, { fx: number; fy: number }>();
    for (const n of nodes) forces.set(n.id, { fx: 0, fy: 0 });

    // Repulsion between all pairs
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id)!;
        const b = positions.get(nodes[j].id)!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 1) {
          dx = rand() - 0.5;
          dy = rand() - 0.5;
          dist = 1;
        }
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        forces.get(nodes[i].id)!.fx += fx;
        forces.get(nodes[i].id)!.fy += fy;
        forces.get(nodes[j].id)!.fx -= fx;
        forces.get(nodes[j].id)!.fy -= fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const a = positions.get(edge.from);
      const b = positions.get(edge.to);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * attraction;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      forces.get(edge.from)!.fx += fx;
      forces.get(edge.from)!.fy += fy;
      forces.get(edge.to)!.fx -= fx;
      forces.get(edge.to)!.fy -= fy;
    }

    // Apply forces with damping and center gravity
    const cx = width / 2;
    const cy = height / 2;
    for (const n of nodes) {
      const p = positions.get(n.id)!;
      const f = forces.get(n.id)!;
      f.fx += (cx - p.x) * 0.01;
      f.fy += (cy - p.y) * 0.01;
      p.vx = (p.vx + f.fx) * damping;
      p.vy = (p.vy + f.fy) * damping;
      p.x = Math.max(20, Math.min(width - 20, p.x + p.vx));
      p.y = Math.max(20, Math.min(height - 20, p.y + p.vy));
    }
  }

  const result = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const p = positions.get(n.id)!;
    result.set(n.id, { x: p.x, y: p.y });
  }
  return result;
}

/** Radial layout for mind maps — children arranged in a circle around center. */
export function radialLayout(
  group: Group,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number
): void {
  const children = group.children;
  if (children.length === 0) return;

  // First child is center
  if (children.length === 1) {
    children[0].x = cx;
    children[0].y = cy;
    children[0].markDirty();
    return;
  }

  children[0].x = cx;
  children[0].y = cy;
  children[0].markDirty();

  const outer = children.slice(1);
  const n = outer.length;
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const r = n <= 4 ? innerRadius : outerRadius;
    outer[i].x = cx + r * Math.cos(angle) - outer[i].getBounds().width / 2;
    outer[i].y = cy + r * Math.sin(angle) - outer[i].getBounds().height / 2;
    outer[i].markDirty();
  }
}

/** Auto-layout diagram nodes in a tree structure */
export function layoutDiagram(group: Group, levelGap = 80, siblingGap = 40): void {
  treeLayout(group, levelGap, siblingGap);
}

/** Horizontal pipeline layout — stages in a row */
export function pipelineLayout(group: Group, gap = 40, padding = 10): void {
  let x = padding;
  const y = padding;
  for (const child of group.children) {
    child.x = x;
    child.y = y;
    child.markDirty();
    x += child.getBounds().width + gap;
  }
}

/** Position diagram nodes from data using force layout */
export function layoutNodesForce(
  nodes: DiagramNode[],
  edges: DiagramEdge[],
  options?: ForceLayoutOptions
): Map<string, { x: number; y: number }> {
  return forceDirectedLayout(
    nodes.map((n) => ({ id: n.id, x: n.x, y: n.y })),
    edges.map((e) => ({ from: e.from, to: e.to })),
    options
  );
}
