import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { matrixPool } from '../utils';
import type { Obstacle } from './types';
import { getAnchor } from './router';

/** Convert world coordinates to a parent group's local space */
export function worldToParentLocal(parent: Group, wx: number, wy: number): { x: number; y: number } {
  const wm = parent.getWorldMatrix();
  const inv = matrixPool.acquire();
  if (!wm.invertInto(inv)) {
    matrixPool.release(inv);
    return { x: wx, y: wy };
  }
  const local = inv.transformPoint(wx, wy);
  matrixPool.release(inv);
  return local;
}

/** Convert obstacle bbox from world space to parent local space */
export function obstacleToParentLocal(parent: Group, obs: Obstacle): Obstacle {
  const tl = worldToParentLocal(parent, obs.x, obs.y);
  const br = worldToParentLocal(parent, obs.x + obs.width, obs.y + obs.height);
  return {
    x: Math.min(tl.x, br.x),
    y: Math.min(tl.y, br.y),
    width: Math.abs(br.x - tl.x),
    height: Math.abs(br.y - tl.y),
  };
}

/**
 * Card size from metadata — ignores nested child groups (org/mind leaves).
 * Critical for correct connector anchors on nested diagram trees.
 */
export function getDiagramCardSize(node: Node): { width: number; height: number } | null {
  const w =
    (node.metadata?.orgCardWidth as number | undefined) ??
    (node.metadata?.diagramCardWidth as number | undefined);
  const h =
    (node.metadata?.orgCardHeight as number | undefined) ??
    (node.metadata?.diagramCardHeight as number | undefined);
  if (typeof w === 'number' && w > 0 && typeof h === 'number' && h > 0) {
    return { width: w, height: h };
  }
  return null;
}

/**
 * Accumulate node.x/y from `node` up to (but not including) `parent`.
 * Uses live position values — correct during drag even if world matrices are stale.
 */
export function positionInParent(node: Node, parent: Group): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let cur: Node | null = node;
  while (cur && cur !== parent) {
    x += cur.x;
    y += cur.y;
    cur = cur.parent;
  }
  return { x, y };
}

/**
 * Map a point in the node's unscaled local card space into parent-local coords,
 * applying the node's scale then rotation (same order as Node.getLocalMatrix).
 */
export function nodeLocalToParent(
  node: Node,
  parent: Group,
  lx: number,
  ly: number
): { x: number; y: number } {
  const pos = positionInParent(node, parent);
  const sx = Number.isFinite(node.scaleX) && node.scaleX !== 0 ? node.scaleX : 1;
  const sy = Number.isFinite(node.scaleY) && node.scaleY !== 0 ? node.scaleY : 1;
  const rx = lx * sx;
  const ry = ly * sy;
  const rad = ((node.rotation || 0) * Math.PI) / 180;
  if (!rad) return { x: pos.x + rx, y: pos.y + ry };
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: pos.x + rx * cos - ry * sin,
    y: pos.y + rx * sin + ry * cos,
  };
}

/** Local content box of a node (card metadata or children AABB), ignoring nested diagram nodes. */
export function getLocalNodeBox(node: Node): { x: number; y: number; width: number; height: number } {
  const sx = Number.isFinite(node.scaleX) && node.scaleX !== 0 ? node.scaleX : 1;
  const sy = Number.isFinite(node.scaleY) && node.scaleY !== 0 ? node.scaleY : 1;
  const card = getDiagramCardSize(node);
  if (card) return { x: 0, y: 0, width: card.width * sx, height: card.height * sy };

  const group = node as Group;
  if (!Array.isArray(group.children) || group.children.length === 0) {
    const b = node.getBounds();
    // getBounds on leaves is local; on groups it may be world — prefer a safe fallback
    if (node.type !== 'group') {
      return {
        x: b.x * sx,
        y: b.y * sy,
        width: Math.max(b.width, 24) * sx,
        height: Math.max(b.height, 24) * sy,
      };
    }
    return { x: 0, y: 0, width: 40 * sx, height: 32 * sy };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const child of group.children) {
    if (child.metadata?.isDiagramHitTarget) continue;
    if (child.metadata?.orgNode) continue;
    if (child.metadata?.diagramEditorOverlay) continue;
    if (child.visible === false) continue;
    const cw =
      (child.metadata?.orgCardWidth as number | undefined) ??
      (child.metadata?.diagramCardWidth as number | undefined);
    const ch =
      (child.metadata?.orgCardHeight as number | undefined) ??
      (child.metadata?.diagramCardHeight as number | undefined);
    if (typeof cw === 'number' && typeof ch === 'number') {
      minX = Math.min(minX, child.x);
      minY = Math.min(minY, child.y);
      maxX = Math.max(maxX, child.x + cw);
      maxY = Math.max(maxY, child.y + ch);
      continue;
    }
    if (child.type === 'group' && (child as Group).children?.length) continue;
    const cb = child.getBounds();
    minX = Math.min(minX, child.x + cb.x);
    minY = Math.min(minY, child.y + cb.y);
    maxX = Math.max(maxX, child.x + cb.x + Math.max(cb.width, 1));
    maxY = Math.max(maxY, child.y + cb.y + Math.max(cb.height, 1));
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: 40 * sx, height: 32 * sy };
  return {
    x: minX * sx,
    y: minY * sy,
    width: Math.max(maxX - minX, 24) * sx,
    height: Math.max(maxY - minY, 24) * sy,
  };
}

/** Node content box in a parent group's local coordinates (drag-safe, rotation-aware AABB). */
export function getNodeBoxInParent(
  node: Node,
  parent: Group
): { x: number; y: number; width: number; height: number } {
  const card = getDiagramCardSize(node);
  if (card) {
    const w = card.width;
    const h = card.height;
    const corners = [
      nodeLocalToParent(node, parent, 0, 0),
      nodeLocalToParent(node, parent, w, 0),
      nodeLocalToParent(node, parent, w, h),
      nodeLocalToParent(node, parent, 0, h),
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
      x: minX,
      y: minY,
      width: Math.max(maxX - minX, 1),
      height: Math.max(maxY - minY, 1),
    };
  }

  const pos = positionInParent(node, parent);
  const box = getLocalNodeBox(node);
  // Fallback without card metadata: axis-aligned (legacy)
  return {
    x: pos.x + box.x,
    y: pos.y + box.y,
    width: box.width,
    height: box.height,
  };
}

/** Transform a point in node-local space into a parent group's local space */
export function localPointToParent(
  node: Node,
  parent: Group,
  lx: number,
  ly: number
): { x: number; y: number } {
  return nodeLocalToParent(node, parent, lx, ly);
}

export type CardSide = 'top' | 'bottom' | 'left' | 'right' | 'center';

/** Connection port on a node edge (mid-side), in parent local space — respects rotation. */
export function getCardSideAnchor(node: Node, parent: Group, side: CardSide): { x: number; y: number } {
  const card = getDiagramCardSize(node) ?? { width: 40, height: 32 };
  const w = card.width;
  const h = card.height;
  let lx = w / 2;
  let ly = h / 2;
  if (side === 'top') {
    lx = w / 2;
    ly = 0;
  } else if (side === 'bottom') {
    lx = w / 2;
    ly = h;
  } else if (side === 'left') {
    lx = 0;
    ly = h / 2;
  } else if (side === 'right') {
    lx = w;
    ly = h / 2;
  }
  return nodeLocalToParent(node, parent, lx, ly);
}

/**
 * Pick the best pair of connection ports so the wire attaches to node edges
 * and stretches as nodes move (draw.io-style).
 */
export function pickConnectionSides(
  fromBox: { x: number; y: number; width: number; height: number },
  toBox: { x: number; y: number; width: number; height: number }
): { fromSide: CardSide; toSide: CardSide } {
  const fromCx = fromBox.x + fromBox.width / 2;
  const fromCy = fromBox.y + fromBox.height / 2;
  const toCx = toBox.x + toBox.width / 2;
  const toCy = toBox.y + toBox.height / 2;
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;

  if (Math.abs(dx) > Math.abs(dy) * 1.05) {
    return {
      fromSide: dx >= 0 ? 'right' : 'left',
      toSide: dx >= 0 ? 'left' : 'right',
    };
  }
  if (Math.abs(dy) > Math.abs(dx) * 1.05) {
    return {
      fromSide: dy >= 0 ? 'bottom' : 'top',
      toSide: dy >= 0 ? 'top' : 'bottom',
    };
  }
  // Near-diagonal: prefer vertical stack (TB) for flowchart-like layouts
  if (Math.abs(dy) >= Math.abs(dx)) {
    return {
      fromSide: dy >= 0 ? 'bottom' : 'top',
      toSide: dy >= 0 ? 'top' : 'bottom',
    };
  }
  return {
    fromSide: dx >= 0 ? 'right' : 'left',
    toSide: dx >= 0 ? 'left' : 'right',
  };
}

/** Card-only obstacle box in parent-local space (excludes nested children). */
export function getCardObstacleInParent(node: Node, parent: Group): Obstacle | null {
  const box = getNodeBoxInParent(node, parent);
  if (box.width <= 0 || box.height <= 0) return null;
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

/** Card-only obstacle box in world space (excludes nested children). */
export function getCardObstacle(node: Node): Obstacle | null {
  const card = getDiagramCardSize(node);
  if (!card) {
    const b = node.getBounds();
    if (b.width <= 0 || b.height <= 0) return null;
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  }
  const tl = node.getWorldMatrix().transformPoint(0, 0);
  const br = node.getWorldMatrix().transformPoint(card.width, card.height);
  return {
    x: Math.min(tl.x, br.x),
    y: Math.min(tl.y, br.y),
    width: Math.abs(br.x - tl.x),
    height: Math.abs(br.y - tl.y),
  };
}

/**
 * Anchor points between two nodes in parent group's local coordinates.
 * Chooses facing mid-side ports on the rotated cards so wires attach cleanly
 * after move/resize/rotate; users can still add manual bend points later.
 */
export function getConnectorAnchors(
  from: Node,
  to: Node,
  parent: Group
): { x1: number; y1: number; x2: number; y2: number } {
  const sides: CardSide[] = ['top', 'right', 'bottom', 'left'];
  const fromC = getCardSideAnchor(from, parent, 'center');
  const toC = getCardSideAnchor(to, parent, 'center');
  let bestFrom: CardSide = 'right';
  let bestTo: CardSide = 'left';
  let bestScore = Infinity;

  for (const fromSide of sides) {
    const a = getCardSideAnchor(from, parent, fromSide);
    const outFrom =
      (a.x - fromC.x) * (toC.x - fromC.x) + (a.y - fromC.y) * (toC.y - fromC.y);
    for (const toSide of sides) {
      const b = getCardSideAnchor(to, parent, toSide);
      const outTo =
        (b.x - toC.x) * (fromC.x - toC.x) + (b.y - toC.y) * (fromC.y - toC.y);
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      // Prefer ports that face the other node; heavily penalize inward ports
      const facePenalty = (outFrom < 0 ? 400 : 0) + (outTo < 0 ? 400 : 0);
      const score = dist + facePenalty;
      if (score < bestScore) {
        bestScore = score;
        bestFrom = fromSide;
        bestTo = toSide;
      }
    }
  }

  // Fallback when all ports score poorly: AABB heuristic
  if (!Number.isFinite(bestScore) || bestScore > 1e9) {
    const fromBox = getNodeBoxInParent(from, parent);
    const toBox = getNodeBoxInParent(to, parent);
    const picked = pickConnectionSides(fromBox, toBox);
    bestFrom = picked.fromSide;
    bestTo = picked.toSide;
  }

  const a = getCardSideAnchor(from, parent, bestFrom);
  const b = getCardSideAnchor(to, parent, bestTo);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

/** Legacy world-space anchors (when no parent group is provided). */
export function getConnectorAnchorsWorld(
  from: Node,
  to: Node
): { x1: number; y1: number; x2: number; y2: number } {
  const toB = to.getBounds();
  const anchorWorld = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
  const toAnchorWorld = getAnchor(to, anchorWorld.x, anchorWorld.y);
  return { x1: anchorWorld.x, y1: anchorWorld.y, x2: toAnchorWorld.x, y2: toAnchorWorld.y };
}
