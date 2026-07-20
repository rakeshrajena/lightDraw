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

/**
 * Connection port on a node edge, in parent local space — respects rotation.
 * @param along 0..1 position along the side (0.5 = mid). Top/bottom: left→right;
 *              left/right: top→bottom. Ignored for `center`.
 */
export function getCardSideAnchor(
  node: Node,
  parent: Group,
  side: CardSide,
  along = 0.5
): { x: number; y: number } {
  const card = getDiagramCardSize(node) ?? { width: 40, height: 32 };
  const w = card.width;
  const h = card.height;
  const t = Math.max(0.05, Math.min(0.95, along));
  let lx = w / 2;
  let ly = h / 2;
  if (side === 'top') {
    lx = w * t;
    ly = 0;
  } else if (side === 'bottom') {
    lx = w * t;
    ly = h;
  } else if (side === 'left') {
    lx = 0;
    ly = h * t;
  } else if (side === 'right') {
    lx = w;
    ly = h * t;
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
 *
 * Optional `fromAlong` / `toAlong` (0..1) fan multiple wires off the same side
 * so decision branches and parallel connectors do not stack on one point.
 */
export function getConnectorAnchors(
  from: Node,
  to: Node,
  parent: Group,
  opts?: { fromAlong?: number; toAlong?: number }
): { x1: number; y1: number; x2: number; y2: number; fromSide: CardSide; toSide: CardSide } {
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

  const fromAlong = opts?.fromAlong ?? 0.5;
  const toAlong = opts?.toAlong ?? 0.5;
  const a = getCardSideAnchor(from, parent, bestFrom, fromAlong);
  const b = getCardSideAnchor(to, parent, bestTo, toAlong);
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y, fromSide: bestFrom, toSide: bestTo };
}

/** Evenly spaced `along` values in (0.2, 0.8) so stacked ports stay on the card edge. */
export function fanAlongSlots(count: number): number[] {
  if (count <= 1) return [0.5];
  const lo = 0.2;
  const hi = 0.8;
  return Array.from({ length: count }, (_, i) => lo + ((hi - lo) * i) / (count - 1));
}

export interface EdgeFanPlan {
  fromAlong: number;
  toAlong: number;
  fromSide: CardSide;
  toSide: CardSide;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Parallel-rail offset (px) so stacked orthogonal paths do not coincide. */
  railOffset: number;
}

/**
 * Assign connection ports so wires use free sides of each symbol when possible.
 *
 * Rules:
 * 1. Each edge prefers the side facing its peer (left target → left port, etc.).
 * 2. Edges that share the same side fan along that side (distinct along slots).
 * 3. Parallel routes get a railOffset so mid-segments do not paint on top of each other.
 *
 * Does not force every outbound edge onto one side — free sides stay available.
 */
export function planEdgeFanAnchors(
  edges: Array<{ key: string; from: Node; to: Node }>,
  parent: Group
): Map<string, EdgeFanPlan> {
  type Prel = {
    key: string;
    from: Node;
    to: Node;
    fromId: string;
    toId: string;
    fromSide: CardSide;
    toSide: CardSide;
  };

  const prelim: Prel[] = edges.map((e) => {
    const fromC = getCardSideAnchor(e.from, parent, 'center');
    const toC = getCardSideAnchor(e.to, parent, 'center');
    const fromSide = preferredExitSide(toC.x - fromC.x, toC.y - fromC.y);
    const toSide = preferredExitSide(fromC.x - toC.x, fromC.y - toC.y);
    return {
      key: e.key,
      from: e.from,
      to: e.to,
      fromId: String(e.from.metadata?.diagramId ?? e.from.id ?? ''),
      toId: String(e.to.metadata?.diagramId ?? e.to.id ?? ''),
      fromSide,
      toSide,
    };
  });

  const fromAlong = new Map<string, number>();
  const toAlong = new Map<string, number>();
  const railOffset = new Map<string, number>();

  // Fan along each (node, side) group — do NOT collapse all edges onto one side
  const fromGroups = new Map<string, Prel[]>();
  for (const e of prelim) {
    const gkey = `${e.fromId}::${e.fromSide}`;
    const list = fromGroups.get(gkey) ?? [];
    list.push(e);
    fromGroups.set(gkey, list);
  }
  for (const [, group] of fromGroups) {
    const side = group[0].fromSide;
    group.sort((a, b) => sortPeersAlongSide(a.to, b.to, parent, side));
    const slots = fanAlongSlots(group.length);
    group.forEach((e, i) => fromAlong.set(e.key, slots[i]));
  }

  const toGroups = new Map<string, Prel[]>();
  for (const e of prelim) {
    const gkey = `${e.toId}::${e.toSide}`;
    const list = toGroups.get(gkey) ?? [];
    list.push(e);
    toGroups.set(gkey, list);
  }
  for (const [, group] of toGroups) {
    const side = group[0].toSide;
    group.sort((a, b) => sortPeersAlongSide(a.from, b.from, parent, side));
    const slots = fanAlongSlots(group.length);
    group.forEach((e, i) => toAlong.set(e.key, slots[i]));
  }

  // Lane offsets for edges that share an exit corridor (same from node + side)
  for (const [, group] of fromGroups) {
    if (group.length <= 1) {
      railOffset.set(group[0].key, 0);
      continue;
    }
    const gap = 14;
    const mid = (group.length - 1) / 2;
    group.forEach((e, i) => {
      railOffset.set(e.key, (i - mid) * gap);
    });
  }
  for (const e of prelim) {
    if (!railOffset.has(e.key)) railOffset.set(e.key, 0);
  }

  const out = new Map<string, EdgeFanPlan>();
  for (const e of prelim) {
    const fa = fromAlong.get(e.key) ?? 0.5;
    const ta = toAlong.get(e.key) ?? 0.5;
    const a = getCardSideAnchor(e.from, parent, e.fromSide, fa);
    const b = getCardSideAnchor(e.to, parent, e.toSide, ta);
    out.set(e.key, {
      fromAlong: fa,
      toAlong: ta,
      fromSide: e.fromSide,
      toSide: e.toSide,
      x1: a.x,
      y1: a.y,
      x2: b.x,
      y2: b.y,
      railOffset: railOffset.get(e.key) ?? 0,
    });
  }

  // If an arrow/edge would override a symbol border or land on an occupied port,
  // snap that end to the nearest free port on the same symbol.
  return resolvePortsAwayFromBorderOverrides(out, prelim, parent);
}

export interface PortCandidate {
  side: CardSide;
  along: number;
  x: number;
  y: number;
}

/** Sample ports around a card border (4 sides × several along slots). */
export function enumerateCardPorts(
  node: Node,
  parent: Group,
  alongSamples: number[] = [0.15, 0.3, 0.5, 0.7, 0.85]
): PortCandidate[] {
  const sides: CardSide[] = ['top', 'right', 'bottom', 'left'];
  const out: PortCandidate[] = [];
  for (const side of sides) {
    for (const along of alongSamples) {
      const p = getCardSideAnchor(node, parent, side, along);
      out.push({ side, along, x: p.x, y: p.y });
    }
  }
  return out;
}

function portOccupancyRadius(node: Node, parent: Group): number {
  const box = getNodeBoxInParent(node, parent);
  return Math.max(14, Math.min(28, Math.min(box.width, box.height) * 0.18));
}

function portsTooClose(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  minDist: number
): boolean {
  return Math.hypot(ax - bx, ay - by) < minDist;
}

/**
 * True when the first route stub from an attachment point goes into the card
 * interior (arrow/edge overrides the border) instead of leaving cleanly.
 */
export function attachmentOverridesBorder(
  attachX: number,
  attachY: number,
  peerX: number,
  peerY: number,
  box: { x: number; y: number; width: number; height: number },
  side: CardSide
): boolean {
  const outward =
    side === 'top'
      ? { x: 0, y: -1 }
      : side === 'bottom'
        ? { x: 0, y: 1 }
        : side === 'left'
          ? { x: -1, y: 0 }
          : { x: 1, y: 0 };

  const towardPeerX = peerX - attachX;
  const towardPeerY = peerY - attachY;
  const plen = Math.hypot(towardPeerX, towardPeerY) || 1;
  // Positive = leaving the card toward the peer; negative = aiming back into the symbol
  const outwardDot =
    outward.x * (towardPeerX / plen) + outward.y * (towardPeerY / plen);
  if (outwardDot < -0.2) return true;

  // Attachment must sit on the border, not deep inside the fill
  const slop = 4;
  const onBorder =
    Math.abs(attachX - box.x) <= slop ||
    Math.abs(attachX - (box.x + box.width)) <= slop ||
    Math.abs(attachY - box.y) <= slop ||
    Math.abs(attachY - (box.y + box.height)) <= slop;
  const deepInside =
    attachX > box.x + slop &&
    attachX < box.x + box.width - slop &&
    attachY > box.y + slop &&
    attachY < box.y + box.height - slop;
  if (deepInside && !onBorder) return true;
  return false;
}

/**
 * Pick nearest free port on the same symbol that faces the peer and is not
 * already taken by another edge endpoint.
 */
export function nearestFreePortOnSymbol(
  node: Node,
  parent: Group,
  peerX: number,
  peerY: number,
  occupied: Array<{ x: number; y: number }>,
  preferSide?: CardSide
): PortCandidate | null {
  const box = getNodeBoxInParent(node, parent);
  const minDist = portOccupancyRadius(node, parent);
  const center = getCardSideAnchor(node, parent, 'center');
  const faceSide = preferredExitSide(peerX - center.x, peerY - center.y);
  const preferred = preferSide ?? faceSide;

  const candidates = enumerateCardPorts(node, parent);
  // Rank: free → facing side → not overriding → closest to ideal mid of preferred side
  const ideal = getCardSideAnchor(node, parent, preferred, 0.5);

  let best: PortCandidate | null = null;
  let bestScore = Infinity;

  for (const c of candidates) {
    const taken = occupied.some((o) => portsTooClose(c.x, c.y, o.x, o.y, minDist));
    if (taken) continue;
    if (attachmentOverridesBorder(c.x, c.y, peerX, peerY, box, c.side)) continue;

    const sidePenalty = c.side === preferred ? 0 : c.side === faceSide ? 40 : 120;
    const distIdeal = Math.hypot(c.x - ideal.x, c.y - ideal.y);
    const distPeer = Math.hypot(c.x - peerX, c.y - peerY);
    const score = sidePenalty + distIdeal * 0.5 + distPeer * 0.15;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }

  // Fallback: any free port even if slightly imperfect
  if (!best) {
    for (const c of candidates) {
      const taken = occupied.some((o) => portsTooClose(c.x, c.y, o.x, o.y, minDist));
      if (taken) continue;
      const dist = Math.hypot(c.x - ideal.x, c.y - ideal.y);
      if (dist < bestScore) {
        bestScore = dist;
        best = c;
      }
    }
  }
  return best;
}

type PrelEdge = {
  key: string;
  from: Node;
  to: Node;
  fromId: string;
  toId: string;
  fromSide: CardSide;
  toSide: CardSide;
};

/**
 * Second pass: when an endpoint overrides a symbol border or collides with
 * another arrow on the same component, reconnect to the nearest free port
 * on that same symbol.
 */
function resolvePortsAwayFromBorderOverrides(
  plan: Map<string, EdgeFanPlan>,
  prelim: PrelEdge[],
  parent: Group
): Map<string, EdgeFanPlan> {
  const occupiedByNode = new Map<string, Array<{ x: number; y: number; key: string; end: 'from' | 'to' }>>();

  const take = (nodeId: string, x: number, y: number, key: string, end: 'from' | 'to') => {
    const list = occupiedByNode.get(nodeId) ?? [];
    list.push({ x, y, key, end });
    occupiedByNode.set(nodeId, list);
  };

  // Process twice so target-side snaps can free source conflicts on the next pass
  for (let pass = 0; pass < 2; pass++) {
    occupiedByNode.clear();
    for (const e of prelim) {
      const cur = plan.get(e.key);
      if (!cur) continue;
      let fromSide = cur.fromSide;
      let toSide = cur.toSide;
      let fromAlong = cur.fromAlong;
      let toAlong = cur.toAlong;
      let x1 = cur.x1;
      let y1 = cur.y1;
      let x2 = cur.x2;
      let y2 = cur.y2;

      const fromBox = getNodeBoxInParent(e.from, parent);
      const toBox = getNodeBoxInParent(e.to, parent);
      const fromMin = portOccupancyRadius(e.from, parent);
      const toMin = portOccupancyRadius(e.to, parent);

      const fromOcc = (occupiedByNode.get(e.fromId) ?? []).map((o) => ({ x: o.x, y: o.y }));
      const toOcc = (occupiedByNode.get(e.toId) ?? []).map((o) => ({ x: o.x, y: o.y }));

      const fromConflict =
        fromOcc.some((o) => portsTooClose(x1, y1, o.x, o.y, fromMin)) ||
        attachmentOverridesBorder(x1, y1, x2, y2, fromBox, fromSide);

      if (fromConflict) {
        const next = nearestFreePortOnSymbol(e.from, parent, x2, y2, fromOcc, fromSide);
        if (next) {
          fromSide = next.side;
          fromAlong = next.along;
          x1 = next.x;
          y1 = next.y;
        }
      }

      const toConflict =
        toOcc.some((o) => portsTooClose(x2, y2, o.x, o.y, toMin)) ||
        attachmentOverridesBorder(x2, y2, x1, y1, toBox, toSide);

      if (toConflict) {
        const next = nearestFreePortOnSymbol(e.to, parent, x1, y1, toOcc, toSide);
        if (next) {
          toSide = next.side;
          toAlong = next.along;
          x2 = next.x;
          y2 = next.y;
        }
      }

      plan.set(e.key, {
        ...cur,
        fromSide,
        toSide,
        fromAlong,
        toAlong,
        x1,
        y1,
        x2,
        y2,
      });
      take(e.fromId, x1, y1, e.key, 'from');
      take(e.toId, x2, y2, e.key, 'to');
    }
  }

  return plan;
}

function sortPeersAlongSide(
  a: Node,
  b: Node,
  parent: Group,
  side: CardSide
): number {
  const ac = getCardSideAnchor(a, parent, 'center');
  const bc = getCardSideAnchor(b, parent, 'center');
  if (side === 'top' || side === 'bottom') return ac.x - bc.x || ac.y - bc.y;
  return ac.y - bc.y || ac.x - bc.x;
}

/**
 * Prefer the card side facing the peer. Uses a lower lateral threshold so
 * left/right ports are chosen when free instead of stacking everything on bottom/top.
 */
export function preferredExitSide(dx: number, dy: number): CardSide {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  // Significant horizontal component → use free left/right ports
  if (ax >= ay * 0.55) return dx >= 0 ? 'right' : 'left';
  if (ay >= ax * 0.55) return dy >= 0 ? 'bottom' : 'top';
  if (ay >= ax) return dy >= 0 ? 'bottom' : 'top';
  return dx >= 0 ? 'right' : 'left';
}

/** @deprecated use preferredExitSide — kept for call-site clarity in older notes */
export function dominantSideFromDelta(dx: number, dy: number): CardSide {
  return preferredExitSide(dx, dy);
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
