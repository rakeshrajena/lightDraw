/** SVG path hit testing and bounds (M/L/H/V/C/Q/Z subset). */

import { parsePathSegments, type PathPoint } from './pathGeometry';

export interface PathBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function pointInPolygon(x: number, y: number, pts: PathPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x;
    const yi = pts[i].y;
    const xj = pts[j].x;
    const yj = pts[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function pathContainsPoint(
  d: string,
  localX: number,
  localY: number,
  strokeWidth = 1
): boolean {
  if (typeof Path2D !== 'undefined' && typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx && 'isPointInPath' in ctx) {
        const path = new Path2D(d);
        if (ctx.isPointInPath(path, localX, localY)) return true;
        const strokeCtx = ctx as CanvasRenderingContext2D & {
          isPointInStroke?: (p: Path2D, x: number, y: number) => boolean;
        };
        if (strokeWidth > 0 && strokeCtx.isPointInStroke?.(path, localX, localY)) return true;
      }
    } catch {
      /* parser fallback */
    }
  }

  const segments = parsePathSegments(d);
  const tolerance = Math.max(strokeWidth, 4);

  for (const seg of segments) {
    if (seg.length < 2) continue;
    const closed =
      seg.length > 2 &&
      Math.hypot(seg[0].x - seg[seg.length - 1].x, seg[0].y - seg[seg.length - 1].y) < 0.01;

    if (closed && pointInPolygon(localX, localY, seg)) return true;

    for (let i = 0; i < seg.length - 1; i++) {
      if (distToSegment(localX, localY, seg[i].x, seg[i].y, seg[i + 1].x, seg[i + 1].y) <= tolerance) {
        return true;
      }
    }
  }

  return false;
}

export function pathBounds(d: string): PathBounds {
  const segments = parsePathSegments(d);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const seg of segments) {
    for (const p of seg) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export { parsePathSegments } from './pathGeometry';
