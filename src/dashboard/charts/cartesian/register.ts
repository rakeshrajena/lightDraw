import { registerDashboard } from '../../registryCore';
import { createCartesianWidget } from '../cartesian/cartesianChart';
import type { CartesianVariant } from '../types';

const CARTESIAN_TYPES: { type: string; variant: CartesianVariant }[] = [
  { type: 'lineChart', variant: 'line' },
  { type: 'areaChart', variant: 'area' },
  { type: 'barChart', variant: 'bar' },
  { type: 'columnChart', variant: 'bar' },
  { type: 'horizontalBarChart', variant: 'horizontalBar' },
  { type: 'stackedColumnChart', variant: 'stackedColumn' },
  { type: 'stackedBarChart', variant: 'stackedBar' },
  { type: 'stackedAreaChart', variant: 'stackedArea' },
  { type: 'stepChart', variant: 'step' },
  { type: 'splineChart', variant: 'spline' },
  { type: 'errorBarChart', variant: 'errorBar' },
  { type: 'lollipopChart', variant: 'lollipop' },
  { type: 'dotPlot', variant: 'dotPlot' },
  { type: 'stripPlot', variant: 'stripPlot' },
  { type: 'sparklineChart', variant: 'sparkline' },
  { type: 'rangeChart', variant: 'range' },
  { type: 'rangeAreaChart', variant: 'rangeArea' },
  { type: 'bandChart', variant: 'band' },
  { type: 'ribbonChart', variant: 'ribbon' },
  { type: 'combinationChart', variant: 'combination' },
  { type: 'mixedChart', variant: 'mixed' },
  { type: 'waterfallChart', variant: 'waterfall' },
  { type: 'paretoChart', variant: 'pareto' },
  { type: 'runChart', variant: 'run' },
  { type: 'controlChart', variant: 'control' },
  { type: 'populationPyramidChart', variant: 'populationPyramid' },
  { type: 'bumpChart', variant: 'bump' },
  { type: 'horizonChart', variant: 'horizon' },
];

for (const { type, variant } of CARTESIAN_TYPES) {
  registerDashboard(type, (props, app) => createCartesianWidget(app, type, props, variant));
}
