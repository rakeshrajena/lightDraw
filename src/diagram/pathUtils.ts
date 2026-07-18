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
 * Mermaid flowchart TB bus geometry for parent → children.
 * Multi-child: shared stem + rail + drops; each drop path is also available
 * as a rounded elbow for professional T-junctions.
 */
export function mermaidOrgBusPaths(
  parentX: number,
  parentBottomY: number,
  children: Array<{ x: number; topY: number }>,
  cornerRadius = 10
): { stem: number[]; bus: number[]; drops: number[][]; elbows: number[][] } {
  if (children.length === 0) {
    return { stem: [], bus: [], drops: [], elbows: [] };
  }

  if (children.length === 1) {
    const c = children[0];
    const midY = (parentBottomY + c.topY) / 2;
    const path = roundOrthogonalCorners(
      [parentX, parentBottomY, parentX, midY, c.x, midY, c.x, c.topY],
      cornerRadius,
      8
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
    roundOrthogonalCorners(
      [parentX, parentBottomY, parentX, busY, c.x, busY, c.x, c.topY],
      cornerRadius,
      8
    )
  );

  return {
    stem: [parentX, parentBottomY, parentX, busY],
    bus: [minX, busY, maxX, busY],
    drops: children.map((c) => [c.x, busY, c.x, c.topY]),
    elbows,
  };
}
