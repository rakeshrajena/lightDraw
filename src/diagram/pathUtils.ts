/**
 * Geometry helpers for professional connector paths.
 * Orthogonal polylines get filleted corners; mind-map branches use quadratic curves.
 */

/** Sample a quadratic Bézier into polyline points (flat [x,y,...]). */
export function quadraticToPoints(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  steps = 16
): number[] {
  const out: number[] = [x0, y0];
  const n = Math.max(4, steps);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1);
  }
  return out;
}

/** SVG path `d` for a quadratic mind-map branch. */
export function quadraticPathD(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number
): string {
  return `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`;
}

/**
 * Replace sharp orthogonal corners with arc fillets approximated as polylines.
 * Keeps endpoints exact; skips fillets when a segment is too short.
 */
export function roundOrthogonalCorners(points: number[], radius = 10, segments = 6): number[] {
  if (points.length < 6 || radius <= 0) return points.slice();

  const out: number[] = [points[0], points[1]];

  for (let i = 2; i < points.length - 2; i += 2) {
    const x0 = points[i - 2];
    const y0 = points[i - 1];
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[i + 2];
    const y2 = points[i + 3];

    const dx0 = x1 - x0;
    const dy0 = y1 - y0;
    const dx1 = x2 - x1;
    const dy1 = y2 - y1;
    const len0 = Math.hypot(dx0, dy0);
    const len1 = Math.hypot(dx1, dy1);

    // Only fillet true axis-aligned corners
    const orthog =
      (Math.abs(dx0) < 0.01 || Math.abs(dy0) < 0.01) &&
      (Math.abs(dx1) < 0.01 || Math.abs(dy1) < 0.01) &&
      Math.abs(dx0 * dx1 + dy0 * dy1) < 0.01;

    if (!orthog || len0 < 1 || len1 < 1) {
      out.push(x1, y1);
      continue;
    }

    const r = Math.min(radius, len0 * 0.45, len1 * 0.45);
    if (r < 2.5 || len0 < radius || len1 < radius) {
      out.push(x1, y1);
      continue;
    }

    const ux0 = dx0 / len0;
    const uy0 = dy0 / len0;
    const ux1 = dx1 / len1;
    const uy1 = dy1 / len1;

    const enterX = x1 - ux0 * r;
    const enterY = y1 - uy0 * r;
    const exitX = x1 + ux1 * r;
    const exitY = y1 + uy1 * r;

    out.push(enterX, enterY);

    // Circular arc from enter → exit around corner (x1,y1)
    const startAng = Math.atan2(enterY - y1, enterX - x1);
    const endAng = Math.atan2(exitY - y1, exitX - x1);
    let delta = endAng - startAng;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    // Prefer the short turn matching the corner (≤ 90°)
    if (Math.abs(delta) > Math.PI / 2 + 0.01) {
      delta = delta > 0 ? delta - Math.PI * 2 : delta + Math.PI * 2;
    }

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const a = startAng + delta * t;
      out.push(x1 + Math.cos(a) * r, y1 + Math.sin(a) * r);
    }
  }

  out.push(points[points.length - 2], points[points.length - 1]);
  return out;
}

/** Sample a cubic Bézier into polyline points (flat [x,y,...]). */
export function cubicToPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  steps = 20
): number[] {
  const out: number[] = [x0, y0];
  const n = Math.max(6, steps);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    const uu = u * u;
    const tt = t * t;
    const a = uu * u;
    const b = 3 * uu * t;
    const c = 3 * u * tt;
    const d = tt * t;
    out.push(a * x0 + b * x1 + c * x2 + d * x3, a * y0 + b * y1 + c * y2 + d * y3);
  }
  return out;
}

/**
 * Mermaid-style horizontal link: exits source horizontally, enters target horizontally.
 * Smooth cubic when y differs (flowchart LR / mindmap look).
 */
export function mermaidHorizontalLink(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  steps = 22
): number[] {
  const dx = Math.abs(x2 - x1);
  const pull = Math.max(28, dx * 0.45);
  const dir = x2 >= x1 ? 1 : -1;
  return cubicToPoints(x1, y1, x1 + dir * pull, y1, x2 - dir * pull, y2, x2, y2, steps);
}

/**
 * L-bend as a single cubic — exits along the first leg, enters along the second
 * (string / cable elbow, not a sharp corner).
 */
export function stringLCurve(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tension = 0.58,
  steps = 28
): number[] {
  const t = Math.min(0.85, Math.max(0.35, tension));
  const c1x = x0 + (x1 - x0) * t;
  const c1y = y0 + (y1 - y0) * t;
  const c2x = x2 + (x1 - x2) * t;
  const c2y = y2 + (y1 - y2) * t;
  return cubicToPoints(x0, y0, c1x, c1y, c2x, c2y, x2, y2, steps);
}

/**
 * U-bend as a single cubic — vertical exit, horizontal span, vertical entry.
 * Control points sit on the rail so the wire bows like a flexible string.
 */
export function stringUCurve(
  x0: number,
  y0: number,
  railY: number,
  x3: number,
  y3: number,
  steps = 32
): number[] {
  // Pull controls toward the rail; more separation → deeper, softer U
  const span = Math.abs(railY - y0) + Math.abs(y3 - railY);
  const soft = Math.min(1, Math.max(0.45, span / 120));
  const c1y = y0 + (railY - y0) * (0.55 + soft * 0.25);
  const c2y = y3 + (railY - y3) * (0.55 + soft * 0.25);
  return cubicToPoints(x0, y0, x0, c1y, x3, c2y, x3, y3, steps);
}

/**
 * Horizontal U (C-bend): leave left/right, span vertically, enter left/right.
 */
export function stringCCurve(
  x0: number,
  y0: number,
  railX: number,
  x3: number,
  y3: number,
  steps = 32
): number[] {
  const span = Math.abs(railX - x0) + Math.abs(x3 - railX);
  const soft = Math.min(1, Math.max(0.45, span / 120));
  const c1x = x0 + (railX - x0) * (0.55 + soft * 0.25);
  const c2x = x3 + (railX - x3) * (0.55 + soft * 0.25);
  return cubicToPoints(x0, y0, c1x, y0, c2x, y3, x3, y3, steps);
}

function nearlyEqual(a: number, b: number, eps = 1.25): boolean {
  return Math.abs(a - b) < eps;
}

/**
 * Convert an orthogonal polyline skeleton into string-like U / L / S curves.
 * Keeps endpoints exact so arrows stay glued to connection ports.
 */
export function stringCurveFromOrthogonal(points: number[], steps = 28): number[] {
  if (points.length < 6) return points.slice();

  const n = points.length / 2;

  // L: 3 points
  if (n === 3) {
    return stringLCurve(
      points[0],
      points[1],
      points[2],
      points[3],
      points[4],
      points[5],
      0.6,
      steps
    );
  }

  // U / C / Z: 4 points
  if (n === 4) {
    const x0 = points[0];
    const y0 = points[1];
    const x1 = points[2];
    const y1 = points[3];
    const x2 = points[4];
    const y2 = points[5];
    const x3 = points[6];
    const y3 = points[7];

    // Classic U (TB): vertical, horizontal rail, vertical
    if (nearlyEqual(x0, x1) && nearlyEqual(y1, y2) && nearlyEqual(x2, x3)) {
      return stringUCurve(x0, y0, y1, x3, y3, steps);
    }
    // Classic C (LR): horizontal, vertical rail, horizontal
    if (nearlyEqual(y0, y1) && nearlyEqual(x1, x2) && nearlyEqual(y2, y3)) {
      return stringCCurve(x0, y0, x1, x3, y3, steps);
    }

    // Z / S: chain two L curves
    const a = stringLCurve(x0, y0, x1, y1, x2, y2, 0.55, Math.max(12, Math.floor(steps / 2)));
    const b = stringLCurve(x1, y1, x2, y2, x3, y3, 0.55, Math.max(12, Math.floor(steps / 2)));
    // Join without duplicating the middle vertex
    return a.concat(b.slice(2));
  }

  // Longer paths: adaptive large fillets (cable around corners)
  let minSeg = Infinity;
  for (let i = 0; i < points.length - 2; i += 2) {
    minSeg = Math.min(minSeg, Math.hypot(points[i + 2] - points[i], points[i + 3] - points[i + 1]));
  }
  const radius = Math.min(36, Math.max(14, minSeg * 0.48));
  return roundOrthogonalCorners(points, radius, 14);
}

/**
 * Smooth path through free waypoints (string through beads).
 * Uses Catmull-Rom → cubic segments so bends feel continuous while dragging.
 */
export function pathThroughWaypoints(
  x1: number,
  y1: number,
  waypoints: Array<{ x: number; y: number }>,
  x2: number,
  y2: number,
  stepsPerSeg = 14
): number[] {
  const pts: number[] = [x1, y1];
  for (const w of waypoints) pts.push(w.x, w.y);
  pts.push(x2, y2);
  if (pts.length <= 4) return pts.slice();
  return catmullRomToPoints(pts, stepsPerSeg);
}

/** Uniform Catmull-Rom spline sampled as a flat polyline. */
export function catmullRomToPoints(points: number[], stepsPerSeg = 12): number[] {
  const n = points.length / 2;
  if (n < 2) return points.slice();
  if (n === 2) return points.slice();

  const out: number[] = [points[0], points[1]];
  const get = (i: number): { x: number; y: number } => {
    const j = Math.max(0, Math.min(n - 1, i));
    return { x: points[j * 2], y: points[j * 2 + 1] };
  };

  for (let i = 0; i < n - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    // Convert Catmull-Rom to cubic Bezier controls
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    const seg = cubicToPoints(p1.x, p1.y, c1x, c1y, c2x, c2y, p2.x, p2.y, stepsPerSeg);
    out.push(...seg.slice(2));
  }
  return out;
}

/**
 * Nearest point on a polyline to (x,y), plus insertion index for a new vertex
 * after the segment that contains the projection (1-based vertex index).
 */
export function nearestPointOnPolyline(
  points: number[],
  x: number,
  y: number
): { x: number; y: number; segIndex: number; dist: number; t: number } {
  let best = { x: points[0], y: points[1], segIndex: 0, dist: Infinity, t: 0 };
  for (let i = 0; i < points.length - 2; i += 2) {
    const x0 = points[i];
    const y0 = points[i + 1];
    const x1 = points[i + 2];
    const y1 = points[i + 3];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq < 1e-8 ? 0 : Math.max(0, Math.min(1, ((x - x0) * dx + (y - y0) * dy) / lenSq));
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    const dist = Math.hypot(x - px, y - py);
    if (dist < best.dist) {
      best = { x: px, y: py, segIndex: i / 2, dist, t };
    }
  }
  return best;
}

/**
 * Mermaid flowchart TB bus geometry for parent → children.
 * Multi-child: shared stem + rail + drops; each drop path is also available
 * as a rounded elbow for professional T-junctions.
 */
export function mermaidOrgBusPaths(
  parentX: number,
  parentBottomY: number,
  children: Array<{ x: number; topY: number }>,
  _cornerRadius = 10
): { stem: number[]; bus: number[]; drops: number[][]; elbows: number[][] } {
  if (children.length === 0) {
    return { stem: [], bus: [], drops: [], elbows: [] };
  }

  if (children.length === 1) {
    const c = children[0];
    const midY = (parentBottomY + c.topY) / 2;
    // Single child: soft U / L string curve
    const path = stringCurveFromOrthogonal(
      [parentX, parentBottomY, parentX, midY, c.x, midY, c.x, c.topY],
      28
    );
    return { stem: path, bus: [], drops: [], elbows: [path] };
  }

  const tops = children.map((c) => c.topY);
  const minTop = Math.min(...tops);
  // Bus sits ~42% down the gap so stem and drops have room for fillets.
  const gap = Math.max(28, minTop - parentBottomY);
  const busY = parentBottomY + Math.max(24, gap * 0.42);
  const xs = children.map((c) => c.x);
  const minX = Math.min(...xs, parentX);
  const maxX = Math.max(...xs, parentX);

  const elbows = children.map((c) =>
    stringCurveFromOrthogonal(
      [parentX, parentBottomY, parentX, busY, c.x, busY, c.x, c.topY],
      26
    )
  );

  return {
    stem: [parentX, parentBottomY, parentX, busY],
    bus: [minX, busY, maxX, busY],
    drops: children.map((c) => [c.x, busY, c.x, c.topY]),
    elbows,
  };
}
