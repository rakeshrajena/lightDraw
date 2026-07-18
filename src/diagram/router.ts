import type { App } from '../App';
import type { Node } from '../Node';
import { Line, Polyline } from '../shapes/index';
import { getCardObstacle } from './coords';
import { roundOrthogonalCorners } from './pathUtils';
import type { Obstacle } from './types';
import { getActiveDiagram } from './theme';

export type RouteStyle = 'straight' | 'orthogonal' | 'smart';

/** Default fillet radius for orthogonal / smart routes (px). */
export const ROUTE_CORNER_RADIUS = 10;

/** Check if a horizontal segment intersects a rectangle */
function hSegIntersectsRect(
  x1: number,
  x2: number,
  y: number,
  obs: Obstacle
): boolean {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  return y >= obs.y && y <= obs.y + obs.height && maxX >= obs.x && minX <= obs.x + obs.width;
}

/** Check if a vertical segment intersects a rectangle */
function vSegIntersectsRect(
  y1: number,
  y2: number,
  x: number,
  obs: Obstacle
): boolean {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return x >= obs.x && x <= obs.x + obs.width && maxY >= obs.y && minY <= obs.y + obs.height;
}

function pathHitsObstacles(points: number[], obstacles: Obstacle[]): boolean {
  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[i + 2];
    const y2 = points[i + 3];
    for (const obs of obstacles) {
      if (x1 === x2) {
        if (vSegIntersectsRect(y1, y2, x1, obs)) return true;
      } else if (y1 === y2) {
        if (hSegIntersectsRect(x1, x2, y1, obs)) return true;
      }
    }
  }
  return false;
}

/** Expand obstacles by padding for clearance */
function padObstacle(obs: Obstacle, pad: number): Obstacle {
  return {
    x: obs.x - pad,
    y: obs.y - pad,
    width: obs.width + pad * 2,
    height: obs.height + pad * 2,
  };
}

/** Simple orthogonal route with obstacle avoidance via waypoint search */
function smartOrthogonalRoute(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  obstacles: Obstacle[]
): number[] {
  const padded = obstacles.map((o) => padObstacle(o, 8));

  const candidates: number[][] = [
    [x1, y1, x1, y2, x2, y2],
    [x1, y1, x2, y1, x2, y2],
    [x1, y1, x1, (y1 + y2) / 2, x2, (y1 + y2) / 2, x2, y2],
    [x1, y1, (x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2],
  ];

  for (const path of candidates) {
    if (!pathHitsObstacles(path, padded)) return path;
  }

  // Detour above or below all obstacles
  const minY = Math.min(y1, y2, ...padded.map((o) => o.y)) - 30;
  const maxY = Math.max(y1, y2, ...padded.map((o) => o.y + o.height)) + 30;
  const above = [x1, y1, x1, minY, x2, minY, x2, y2];
  const below = [x1, y1, x1, maxY, x2, maxY, x2, y2];
  if (!pathHitsObstacles(above, padded)) return above;
  if (!pathHitsObstacles(below, padded)) return below;
  return candidates[0];
}

/** Collect bounding boxes from node groups as routing obstacles */
export function collectObstacles(nodes: Node[], exclude?: Node[]): Obstacle[] {
  const skip = new Set(exclude ?? []);
  const result: Obstacle[] = [];
  for (const node of nodes) {
    if (skip.has(node)) continue;
    const card = getCardObstacle(node);
    if (card && card.width > 0 && card.height > 0) {
      result.push(card);
      continue;
    }
    const b = node.getBounds();
    if (b.width > 0 && b.height > 0) {
      result.push({ x: b.x, y: b.y, width: b.width, height: b.height });
    }
  }
  return result;
}

/** Compute routed polyline points between two anchors */
export function computeRoutePoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: RouteStyle = 'orthogonal',
  obstacles: Obstacle[] = [],
  cornerRadius: number = ROUTE_CORNER_RADIUS
): number[] {
  // Near-colinear → straight segment (avoids zero-width elbows / kink artifacts)
  if (Math.abs(x1 - x2) < 1.5 || Math.abs(y1 - y2) < 1.5) {
    return [x1, y1, x2, y2];
  }
  if (style === 'straight') {
    return [x1, y1, x2, y2];
  }
  let points: number[];
  if (style === 'smart') {
    points = smartOrthogonalRoute(x1, y1, x2, y2, obstacles);
  } else {
    const midY = (y1 + y2) / 2;
    points = [x1, y1, x1, midY, x2, midY, x2, y2];
  }
  points = collapseColinearPoints(points);
  if (points.length <= 4) return points;
  return cornerRadius > 0 ? roundOrthogonalCorners(points, cornerRadius) : points;
}

/** Drop zero-length / colinear intermediate vertices before filleting */
function collapseColinearPoints(points: number[]): number[] {
  if (points.length < 6) return points;
  const out: number[] = [points[0], points[1]];
  for (let i = 2; i < points.length - 2; i += 2) {
    const x0 = out[out.length - 2];
    const y0 = out[out.length - 1];
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[i + 2];
    const y2 = points[i + 3];
    const d01 = Math.hypot(x1 - x0, y1 - y0);
    const d12 = Math.hypot(x2 - x1, y2 - y1);
    if (d01 < 0.75 || d12 < 0.75) continue;
    const colinear =
      (Math.abs(x0 - x1) < 0.75 && Math.abs(x1 - x2) < 0.75) ||
      (Math.abs(y0 - y1) < 0.75 && Math.abs(y1 - y2) < 0.75);
    if (colinear) continue;
    out.push(x1, y1);
  }
  out.push(points[points.length - 2], points[points.length - 1]);
  return out;
}

/** Route connector between two points */
export function routeConnector(
  app: App,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: RouteStyle = 'orthogonal',
  obstacles: Obstacle[] = [],
  stroke = getActiveDiagram().edge
): Line | Polyline {
  const points = computeRoutePoints(x1, y1, x2, y2, style, obstacles);
  if (style === 'straight' && points.length === 4) {
    return app.line({
      x: x1,
      y: y1,
      x2: x2 - x1,
      y2: y2 - y1,
      stroke,
      strokeWidth: 2,
      lineCap: 'round',
    });
  }
  return app.polyline({
    points,
    fill: null,
    stroke,
    strokeWidth: 2,
    lineJoin: 'round',
    lineCap: 'round',
  });
}

/** Get anchor point on node edge toward target (ray–box intersection) */
export function getAnchor(
  node: Node,
  targetX: number,
  targetY: number
): { x: number; y: number } {
  const b = node.getBounds();
  const cx = b.x + b.width / 2;
  const cy = b.y + b.height / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: b.y };
  const hw = Math.max(b.width / 2, 1);
  const hh = Math.max(b.height / 2, 1);
  const scale = Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh);
  return { x: cx + dx / scale, y: cy + dy / scale };
}
