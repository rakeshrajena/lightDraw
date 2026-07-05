import type { App } from '../App';
import type { Node } from '../Node';
import { Line, Polyline } from '../shapes/index';
import type { Obstacle } from './types';

export type RouteStyle = 'straight' | 'orthogonal' | 'smart';

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
    const b = node.getBounds();
    if (b.width > 0 && b.height > 0) {
      result.push({ x: b.x, y: b.y, width: b.width, height: b.height });
    }
  }
  return result;
}

/** Route connector between two points */
export function routeConnector(
  app: App,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: RouteStyle = 'orthogonal',
  obstacles: Obstacle[] = []
): Line | Polyline {
  if (style === 'straight') {
    return app.line({ x: x1, y: y1, x2: x2 - x1, y2: y2 - y1, stroke: '#64748b', strokeWidth: 2 });
  }

  const points =
    style === 'smart'
      ? smartOrthogonalRoute(x1, y1, x2, y2, obstacles)
      : (() => {
          const midY = (y1 + y2) / 2;
          return [x1, y1, x1, midY, x2, midY, x2, y2];
        })();

  return app.polyline({ points, fill: null, stroke: '#64748b', strokeWidth: 2 });
}

/** Get anchor point on node edge toward target */
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
  if (Math.abs(dx) > Math.abs(dy)) {
    return { x: dx > 0 ? b.x + b.width : b.x, y: cy };
  }
  return { x: cx, y: dy > 0 ? b.y + b.height : b.y };
}
