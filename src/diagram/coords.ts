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

/** Transform a point in node-local space into a parent group's local space */
export function localPointToParent(
  node: Node,
  parent: Group,
  lx: number,
  ly: number
): { x: number; y: number } {
  const wm = node.getWorldMatrix();
  const world = wm.transformPoint(lx, ly);
  return worldToParentLocal(parent, world.x, world.y);
}

export type CardSide = 'top' | 'bottom' | 'left' | 'right' | 'center';

/** Anchor on a diagram card edge (uses metadata size when available). */
export function getCardSideAnchor(node: Node, parent: Group, side: CardSide): { x: number; y: number } {
  const card = getDiagramCardSize(node);
  if (card) {
    let lx = card.width / 2;
    let ly = card.height / 2;
    if (side === 'top') ly = 0;
    else if (side === 'bottom') ly = card.height;
    else if (side === 'left') lx = 0;
    else if (side === 'right') lx = card.width;
    return localPointToParent(node, parent, lx, ly);
  }

  const b = node.getBounds();
  let wx = b.x + b.width / 2;
  let wy = b.y + b.height / 2;
  if (side === 'top') wy = b.y;
  else if (side === 'bottom') wy = b.y + b.height;
  else if (side === 'left') wx = b.x;
  else if (side === 'right') wx = b.x + b.width;
  return worldToParentLocal(parent, wx, wy);
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

/** Anchor points between two nodes in parent group's local coordinates */
export function getConnectorAnchors(
  from: Node,
  to: Node,
  parent: Group
): { x1: number; y1: number; x2: number; y2: number } {
  if (getDiagramCardSize(from) && getDiagramCardSize(to)) {
    const fromC = getCardSideAnchor(from, parent, 'center');
    const toC = getCardSideAnchor(to, parent, 'center');
    const dx = toC.x - fromC.x;
    const dy = toC.y - fromC.y;
    let fromSide: CardSide = 'bottom';
    let toSide: CardSide = 'top';
    if (Math.abs(dx) > Math.abs(dy)) {
      fromSide = dx >= 0 ? 'right' : 'left';
      toSide = dx >= 0 ? 'left' : 'right';
    } else {
      fromSide = dy >= 0 ? 'bottom' : 'top';
      toSide = dy >= 0 ? 'top' : 'bottom';
    }
    const a = getCardSideAnchor(from, parent, fromSide);
    const b = getCardSideAnchor(to, parent, toSide);
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }

  const toB = to.getBounds();
  const anchorWorld = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
  const toAnchorWorld = getAnchor(to, anchorWorld.x, anchorWorld.y);
  const a = worldToParentLocal(parent, anchorWorld.x, anchorWorld.y);
  const b = worldToParentLocal(parent, toAnchorWorld.x, toAnchorWorld.y);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}
