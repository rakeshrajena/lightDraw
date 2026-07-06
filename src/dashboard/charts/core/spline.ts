/** Build step-interpolated polyline points from data values. */
export function stepPoints(
  data: number[],
  toXY: (i: number, v: number) => [number, number]
): number[] {
  const pts: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const [x, y] = toXY(i, data[i]);
    if (i === 0) {
      pts.push(x, y);
    } else {
      const [px] = toXY(i - 1, data[i - 1]);
      pts.push(x, data[i - 1] !== undefined ? toXY(i - 1, data[i - 1])[1] : y);
      pts.push(x, y);
    }
  }
  return pts;
}

/** Catmull-Rom spline through points [[x,y],...] */
export function catmullRomPath(points: [number, number][], tension = 0.5): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0][0]} ${points[0][1]} L ${points[1][0]} ${points[1][1]}`;
  }
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const cp1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const cp2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const cp2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function pointsToPairs(points: number[]): [number, number][] {
  const pairs: [number, number][] = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push([points[i], points[i + 1]]);
  }
  return pairs;
}
