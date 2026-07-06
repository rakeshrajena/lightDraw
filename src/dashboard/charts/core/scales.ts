export function linearScale(
  domain: [number, number],
  range: [number, number]
): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

export function bandScale(count: number, range: number, gap = 0.2): (i: number) => number {
  const step = range / Math.max(count, 1);
  const bandwidth = step * (1 - gap);
  return (i: number) => i * step + (step - bandwidth) / 2;
}

export function bandWidth(count: number, range: number, gap = 0.2): number {
  const step = range / Math.max(count, 1);
  return step * (1 - gap);
}

export function logScale(domain: [number, number], range: [number, number]): (v: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const log0 = Math.log(Math.max(d0, 1e-6));
  const log1 = Math.log(Math.max(d1, 1e-6));
  const span = log1 - log0 || 1;
  return (v: number) => r0 + ((Math.log(Math.max(v, 1e-6)) - log0) / span) * (r1 - r0);
}

export function polarToXY(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}
