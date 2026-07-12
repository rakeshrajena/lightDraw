import type { ChartSeries } from '../types';
import { getActiveDashboard } from '../../theme';

/**
 * Parse series for drawing.
 * Does **not** inject theme colors by default. Draw sites must use
 * `series.color ?? getActiveDashboard()…`.
 * Pass `keepColors: true` only when the user originally supplied series colors.
 */
export function parseSeries(
  props: Record<string, unknown>,
  fallback: number[] = [10, 30, 20, 50, 40, 60],
  options: { applyThemeColors?: boolean; keepColors?: boolean } = {}
): ChartSeries[] {
  const applyTheme = options.applyThemeColors === true;
  const keepColors = options.keepColors === true;
  const raw = props.series as ChartSeries[] | undefined;
  const chartStops = Array.isArray(props.colorStops)
    ? (props.colorStops as ChartSeries['colorStops'])
    : Array.isArray(props.thresholds)
      ? (props.thresholds as ChartSeries['colorStops'])
      : undefined;

  if (raw?.length) {
    return raw.map((s, i) => ({
      name: s.name ?? s.label ?? `Series ${i + 1}`,
      data: s.data ?? [],
      type: s.type,
      color:
        (keepColors && s.color) ||
        (applyTheme ? getActiveDashboard().series[i % getActiveDashboard().series.length] : undefined) ||
        undefined,
      colorStops: s.colorStops ?? chartStops,
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
      color: applyTheme ? getActiveDashboard().chartLine : undefined,
      colorStops: chartStops,
    },
  ];
}

/** True when the original props (not a theme-baked rebuild) supplied series colors. */
export function detectUserSeriesColors(props: Record<string, unknown>): boolean {
  if (props.seriesHasUserColors === true) return true;
  if (props.seriesHasUserColors === false) return false;
  // Rebuild without a persisted flag → treat colors as theme-baked (strip them)
  if (props._chartRebuild) return false;
  const raw = props.series as ChartSeries[] | undefined;
  return Boolean(raw?.some((s) => typeof s.color === 'string' && s.color.length > 0));
}

/** Persist series for rebuild without baking live theme colors. */
export function seriesForWidgetState(
  props: Record<string, unknown>,
  seriesHasUserColors: boolean
): ChartSeries[] | undefined {
  const raw = props.series as ChartSeries[] | undefined;
  if (!raw?.length) return undefined;
  return raw.map((s) => {
    const next: ChartSeries = {
      name: s.name,
      label: s.label,
      data: s.data,
      type: s.type,
      yAxis: s.yAxis,
      errorY: s.errorY,
      rangeMin: s.rangeMin,
      rangeMax: s.rangeMax,
    };
    if (seriesHasUserColors && s.color) next.color = s.color;
    if (s.colorStops?.length) next.colorStops = s.colorStops;
    return next;
  });
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
