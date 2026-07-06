import type { ChartLayout, ChartBounds } from '../../chartPrimitives';
import { computeTicks, dataBounds, defaultLayout } from '../../chartPrimitives';
import { flattenSeriesData } from './series';
import type { ChartSeries } from '../types';
import { num } from '../../helpers';

export interface ChartContext {
  width: number;
  height: number;
  layout: ChartLayout;
  bounds: ChartBounds;
  yTicks: number[];
  categories: string[];
  series: ChartSeries[];
}

export function buildChartContext(props: Record<string, unknown>, series: ChartSeries[]): ChartContext {
  const width = num(props, 'width', 300);
  const height = num(props, 'height', 150);
  const minimal = props.minimalAxes === true;
  const showLegend = props.showLegend !== false && !minimal;
  const padding = minimal ? 4 : 30;
  const legendRows = showLegend ? series.length : 0;
  const legendH = legendRows > 0 ? legendRows * 18 + 8 : 0;
  const layout = defaultLayout(width, height, padding, legendH);
  const minY = typeof props.minY === 'number' ? props.minY : undefined;
  const maxY = typeof props.maxY === 'number' ? props.maxY : undefined;
  const bounds = dataBounds(flattenSeriesData(series), minY, maxY);
  const yTicks = computeTicks(bounds.min, bounds.max, num(props, 'tickCount', 5));
  const categories =
    (props.categories as string[]) ??
    Array.from({ length: Math.max(...series.map((s) => s.data.length), 1) }, (_, i) => String(i + 1));
  return { width, height, layout, bounds, yTicks, categories, series };
}
