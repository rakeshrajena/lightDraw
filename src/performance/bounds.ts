import type { Node } from '../Node';
import type { Group } from '../shapes/Group';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** World-space axis-aligned bounds for a node (with optional padding). */
export function getWorldBounds(node: Node, padding = 2): Bounds {
  const b = node.getBounds();
  const wm = node.getWorldMatrix();
  const corners = [
    wm.transformPoint(b.x, b.y),
    wm.transformPoint(b.x + b.width, b.y),
    wm.transformPoint(b.x, b.y + b.height),
    wm.transformPoint(b.x + b.width, b.y + b.height),
  ];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of corners) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x);
    maxY = Math.max(maxY, c.y);
  }
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/** True if node or any descendant is dirty. */
export function isSubtreeDirty(node: Node): boolean {
  if (node.isDirty()) return true;
  if ('children' in node) {
    for (const child of (node as Group).children) {
      if (isSubtreeDirty(child)) return true;
    }
  }
  return false;
}

/** Collect all listening leaf nodes for spatial indexing. */
export function collectHitTargets(root: Group, out: Node[] = []): Node[] {
  for (const child of root.children) {
    if (!child.visible || !child.listening) continue;
    if ('children' in child && (child as Group).children.length > 0) {
      collectHitTargets(child as Group, out);
    } else {
      out.push(child);
    }
  }
  return out;
}

/** Count nodes in subtree. */
export function countNodes(root: Group): number {
  let n = 0;
  for (const child of root.children) {
    n++;
    if ('children' in child) n += countNodes(child as Group);
  }
  return n;
}
