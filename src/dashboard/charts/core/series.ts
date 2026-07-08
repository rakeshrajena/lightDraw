import type { ChartSeries } from '../types';
import { DASHBOARD } from '../../theme';

export function parseSeries(
  props: Record<string, unknown>,
  fallback: number[] = [10, 30, 20, 50, 40, 60]
): ChartSeries[] {
  const raw = props.series as ChartSeries[] | undefined;
  if (raw?.length) {
    return raw.map((s, i) => ({
      name: s.name ?? s.label ?? `Series ${i + 1}`,
      data: s.data ?? [],
      type: s.type,
      color: s.color ?? DASHBOARD.series[i % DASHBOARD.series.length],
      yAxis: s.yAxis,
      errorY: s.errorY,
      rangeMin: s.rangeMin,
      rangeMax: s.rangeMax,
    }));
  }
  const data = (props.data as number[]) ?? fallback;
  return [
    {
      name: typeof props.seriesLabel === 'string' ? props.seriesLabel : 'Series',
      data,
      color: DASHBOARD.chartLine,
    },
  ];
}

export function seriesPointCount(series: ChartSeries[]): number {
  return Math.max(...series.map((s) => s.data.length), 0);
}

export function flattenSeriesData(series: ChartSeries[]): number[] {
  return series.flatMap((s) => s.data);
}

export function stackSeries(series: ChartSeries[]): ChartSeries[] {
  const len = seriesPointCount(series);
  const stacked: number[][] = series.map(() => Array(len).fill(0));
  for (let i = 0; i < len; i++) {
    let acc = 0;
    for (let s = 0; s < series.length; s++) {
      const v = series[s].data[i] ?? 0;
      acc += v;
      stacked[s][i] = acc;
    }
  }
  return series.map((s, si) => ({
    ...s,
    data: stacked[si],
    _base: si === 0 ? Array(len).fill(0) : stacked[si - 1],
  })) as (ChartSeries & { _base?: number[] })[];
}

export function normalizeBumpRanks(series: ChartSeries[]): ChartSeries[] {
  const len = seriesPointCount(series);
  const result: ChartSeries[] = [];
  for (let i = 0; i < len; i++) {
    const vals = series.map((s, si) => ({ si, v: s.data[i] ?? 0 }));
    vals.sort((a, b) => b.v - a.v);
    vals.forEach((entry, rank) => {
      if (!result[entry.si]) {
        result[entry.si] = { ...series[entry.si], data: [] };
      }
      result[entry.si].data[i] = rank + 1;
    });
  }
  return result;
}
