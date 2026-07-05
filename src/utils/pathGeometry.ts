/** SVG path geometry: sampling, length, morphing. */

import { lerp, radToDeg } from './index';

export interface PathPoint {
  x: number;
  y: number;
}

/** Flatten an SVG path `d` into polylines (M/L/H/V/C/Q/Z subset). */
export function parsePathSegments(d: string): PathPoint[][] {
  const segments: PathPoint[][] = [];
  let current: PathPoint[] = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;

  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  let i = 0;
  const readNum = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    const cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const c = cmd.toUpperCase();

    if (c === 'M') {
      if (current.length > 1) segments.push(current);
      cx = readNum();
      cy = readNum();
      sx = cx;
      sy = cy;
      current = [{ x: cx, y: cy }];
    } else if (c === 'L') {
      const px = readNum();
      const py = readNum();
      cx = rel ? (current[current.length - 1]?.x ?? 0) + px : px;
      cy = rel ? (current[current.length - 1]?.y ?? 0) + py : py;
      current.push({ x: cx, y: cy });
    } else if (c === 'H') {
      const px = readNum();
      cx = rel ? (current[current.length - 1]?.x ?? 0) + px : px;
      cy = current[current.length - 1]?.y ?? cy;
      current.push({ x: cx, y: cy });
    } else if (c === 'V') {
      const py = readNum();
      cy = rel ? (current[current.length - 1]?.y ?? 0) + py : py;
      cx = current[current.length - 1]?.x ?? cx;
      current.push({ x: cx, y: cy });
    } else if (c === 'Z') {
      if (current.length > 0) {
        current.push({ x: sx, y: sy });
        segments.push(current);
        current = [];
      }
      cx = sx;
      cy = sy;
    } else if (c === 'C') {
      const x1 = readNum();
      const y1 = readNum();
      const x2 = readNum();
      const y2 = readNum();
      const x = readNum();
      const y = readNum();
      const p0 = current[current.length - 1] ?? { x: cx, y: cy };
      if (rel) {
        flattenCubic(
          p0,
          { x: p0.x + x1, y: p0.y + y1 },
          { x: p0.x + x2, y: p0.y + y2 },
          { x: p0.x + x, y: p0.y + y },
          current
        );
        cx = p0.x + x;
        cy = p0.y + y;
      } else {
        flattenCubic(p0, { x: x1, y: y1 }, { x: x2, y: y2 }, { x, y }, current);
        cx = x;
        cy = y;
      }
    } else if (c === 'Q') {
      const x1 = readNum();
      const y1 = readNum();
      const x = readNum();
      const y = readNum();
      const p0 = current[current.length - 1] ?? { x: cx, y: cy };
      if (rel) {
        flattenQuadratic(
          p0,
          { x: p0.x + x1, y: p0.y + y1 },
          { x: p0.x + x, y: p0.y + y },
          current
        );
        cx = p0.x + x;
        cy = p0.y + y;
      } else {
        flattenQuadratic(p0, { x: x1, y: y1 }, { x, y }, current);
        cx = x;
        cy = y;
      }
    }
  }

  if (current.length > 1) segments.push(current);
  return segments;
}

function flattenCubic(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint,
  out: PathPoint[],
  steps = 8
): void {
  for (let t = 1; t <= steps; t++) {
    const u = t / steps;
    const u2 = u * u;
    const u3 = u2 * u;
    const mt = 1 - u;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    out.push({
      x: mt3 * p0.x + 3 * mt2 * u * p1.x + 3 * mt * u2 * p2.x + u3 * p3.x,
      y: mt3 * p0.y + 3 * mt2 * u * p1.y + 3 * mt * u2 * p2.y + u3 * p3.y,
    });
  }
}

function flattenQuadratic(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  out: PathPoint[],
  steps = 6
): void {
  for (let t = 1; t <= steps; t++) {
    const u = t / steps;
    const mt = 1 - u;
    out.push({
      x: mt * mt * p0.x + 2 * mt * u * p1.x + u * u * p2.x,
      y: mt * mt * p0.y + 2 * mt * u * p1.y + u * u * p2.y,
    });
  }
}

function flattenSegments(segments: PathPoint[][]): PathPoint[] {
  const pts: PathPoint[] = [];
  for (const seg of segments) {
    for (const p of seg) pts.push(p);
  }
  return pts;
}

function segmentLength(a: PathPoint, b: PathPoint): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Total polyline length of a path. */
export function getPathLength(d: string): number {
  const segments = parsePathSegments(d);
  let len = 0;
  for (const seg of segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      len += segmentLength(seg[i], seg[i + 1]);
    }
  }
  return len;
}

export interface PointOnPath {
  x: number;
  y: number;
  angle: number;
}

/** Point and tangent angle (degrees) at distance along path. */
export function getPointAtLength(d: string, distance: number): PointOnPath {
  const segments = parsePathSegments(d);
  if (segments.length === 0 || segments.every((s) => s.length === 0)) {
    return { x: 0, y: 0, angle: 0 };
  }

  let remaining = Math.max(0, distance);
  let prev = segments[0][0] ?? { x: 0, y: 0 };

  for (const seg of segments) {
    for (let i = 0; i < seg.length - 1; i++) {
      const a = seg[i];
      const b = seg[i + 1];
      const len = segmentLength(a, b);
      if (len === 0) continue;
      if (remaining <= len) {
        const t = remaining / len;
        const x = lerp(a.x, b.x, t);
        const y = lerp(a.y, b.y, t);
        const angle = radToDeg(Math.atan2(b.y - a.y, b.x - a.x));
        return { x, y, angle };
      }
      remaining -= len;
      prev = b;
    }
  }

  const lastSeg = segments[segments.length - 1];
  const last = lastSeg[lastSeg.length - 1] ?? prev;
  const prevPt = lastSeg.length > 1 ? lastSeg[lastSeg.length - 2] : prev;
  const angle = radToDeg(Math.atan2(last.y - prevPt.y, last.x - prevPt.x));
  return { x: last.x, y: last.y, angle };
}

/** Uniformly sample path into N points for morphing. */
export function samplePath(d: string, samples: number): PathPoint[] {
  const total = getPathLength(d);
  if (total === 0 || samples < 2) {
    const flat = flattenSegments(parsePathSegments(d));
    return flat.length > 0 ? flat : [{ x: 0, y: 0 }];
  }
  const pts: PathPoint[] = [];
  for (let i = 0; i < samples; i++) {
    const pt = getPointAtLength(d, (i / (samples - 1)) * total);
    pts.push({ x: pt.x, y: pt.y });
  }
  return pts;
}

/** Interpolate between two path `d` strings (resampled to equal point count). */
export function morphPath(from: string, to: string, t: number, samples = 32): string {
  const fromPts = samplePath(from, samples);
  const toPts = samplePath(to, samples);
  const pts: PathPoint[] = [];
  for (let i = 0; i < samples; i++) {
    pts.push({
      x: lerp(fromPts[i].x, toPts[i].x, t),
      y: lerp(fromPts[i].y, toPts[i].y, t),
    });
  }
  if (pts.length === 0) return from;
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

/** Rect outline as closed path (for morph demos). */
export function rectPath(width: number, height: number, cornerRadius = 0): string {
  const r = Math.min(cornerRadius, width / 2, height / 2);
  if (r <= 0) {
    return `M0 0 L${width} 0 L${width} ${height} L0 ${height} Z`;
  }
  return [
    `M${r} 0`,
    `L${width - r} 0`,
    `Q${width} 0 ${width} ${r}`,
    `L${width} ${height - r}`,
    `Q${width} ${height} ${width - r} ${height}`,
    `L${r} ${height}`,
    `Q0 ${height} 0 ${height - r}`,
    `L0 ${r}`,
    `Q0 0 ${r} 0`,
    'Z',
  ].join(' ');
}
