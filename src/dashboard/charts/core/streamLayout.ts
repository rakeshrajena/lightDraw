export interface StreamLayer {
  path: string;
  index: number;
}

/** Centered streamgraph stack — layers sum to a smooth filled band per series. */
export function layoutStreamgraph(
  series: number[][],
  width: number,
  height: number,
  pad = { left: 24, right: 24, top: 12, bottom: 12 }
): StreamLayer[] {
  const n = series.length;
  if (!n) return [];
  const len = Math.max(...series.map((s) => s.length), 1);
  const plotW = Math.max(width - pad.left - pad.right, 8);
  const plotH = Math.max(height - pad.top - pad.bottom, 8);
  const midY = pad.top + plotH / 2;

  const totals = Array.from({ length: len }, (_, i) =>
    series.reduce((a, s) => a + (s[i] ?? 0), 0)
  );
  const maxTotal = Math.max(...totals, 1);
  const yScale = plotH / maxTotal;

  const tops: number[][] = series.map(() => Array(len).fill(0));
  const bots: number[][] = series.map(() => Array(len).fill(0));

  for (let i = 0; i < len; i++) {
    const totalH = totals[i] * yScale;
    let y = midY - totalH / 2;
    for (let s = 0; s < n; s++) {
      const h = (series[s][i] ?? 0) * yScale;
      bots[s][i] = y;
      tops[s][i] = y + h;
      y += h;
    }
  }

  const xAt = (i: number) => pad.left + (plotW * i) / Math.max(len - 1, 1);

  return series.map((_, si) => {
    const topPts: string[] = [];
    const botPts: string[] = [];
    for (let i = 0; i < len; i++) {
      const x = xAt(i);
      topPts.push(`${x},${tops[si][i]}`);
      botPts.unshift(`${x},${bots[si][i]}`);
    }
    const d = `M ${topPts.join(' L ')} L ${botPts.join(' L ')} Z`;
    return { path: d, index: si };
  });
}

/** Multi-line tooltip label for streamgraph at index i. */
export function streamTooltipLabel(series: number[][], index: number, names?: string[]): string {
  return series
    .map((s, si) => `${names?.[si] ?? `S${si + 1}`}: ${s[index] ?? 0}`)
    .join('\n');
}
