export function histogramBins(data: number[], binCount = 10): { x0: number; x1: number; count: number }[] {
  if (!data.length) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = span / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * step,
    x1: min + (i + 1) * step,
    count: 0,
  }));
  for (const v of data) {
    const idx = Math.min(binCount - 1, Math.floor((v - min) / step));
    bins[idx].count++;
  }
  return bins;
}

export function quantile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
}

export function boxStats(values: number[]): {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
} {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? 0,
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1] ?? 0,
  };
}

/** Simple Gaussian KDE samples */
export function kdeSamples(data: number[], points: number[], bandwidth?: number): number[] {
  if (!data.length) return points.map(() => 0);
  const n = data.length;
  const h = bandwidth ?? (1.06 * stddev(data) * Math.pow(n, -0.2) || 1);
  return points.map((x) => {
    let sum = 0;
    for (const d of data) {
      const z = (x - d) / h;
      sum += Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
    }
    return sum / (n * h);
  });
}

function stddev(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const v = data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
  return Math.sqrt(v);
}

export function normalQuantiles(n: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const p = (i + 0.5) / n;
    return Math.sqrt(2) * inverseErf(2 * p - 1);
  });
}

function inverseErf(x: number): number {
  const a = 0.147;
  const ln = Math.log(1 - x * x);
  const s = Math.sign(x);
  const t = 2 / (Math.PI * a) + ln / 2;
  return s * Math.sqrt(Math.sqrt(t * t - ln / a) - t);
}

export function hexbinCenters(
  points: [number, number][],
  width: number,
  height: number,
  radius: number
): Map<string, { x: number; y: number; count: number }> {
  const bins = new Map<string, { x: number; y: number; count: number }>();
  const dx = radius * 1.5;
  const dy = radius * Math.sqrt(3);
  for (const [px, py] of points) {
    const col = Math.round(px / dx);
    const row = Math.round(py / dy);
    const cx = col * dx;
    const cy = row * dy + (col % 2 ? dy / 2 : 0);
    const key = `${col},${row}`;
    const existing = bins.get(key);
    if (existing) existing.count++;
    else bins.set(key, { x: cx, y: cy, count: 1 });
  }
  return bins;
}
