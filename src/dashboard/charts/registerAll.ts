/** Registers all dashboard chart types (82+ widgets and aliases). */
import './cartesian/register';
import './polar/register';
import './statistical/register';
import './financial/register';
import './hierarchical/register';
import './flow/register';
import './network/register';
import './specialty/register';

export const CHART_TYPES = [
  'lineChart', 'areaChart', 'barChart', 'columnChart', 'horizontalBarChart',
  'stackedColumnChart', 'stackedBarChart', 'stackedAreaChart', 'stepChart', 'splineChart',
  'errorBarChart', 'lollipopChart', 'dotPlot', 'stripPlot', 'sparklineChart',
  'rangeChart', 'rangeAreaChart', 'bandChart', 'ribbonChart', 'combinationChart',
  'mixedChart', 'waterfallChart', 'paretoChart', 'runChart', 'controlChart',
  'populationPyramidChart', 'bumpChart', 'horizonChart',
  'pieChart', 'doughnutChart', 'radarChart', 'spiderChart', 'polarAreaChart',
  'bulletChart', 'funnelChart', 'pyramidChart', 'coneChart',
  'histogram', 'boxPlot', 'boxAndWhiskerChart', 'violinPlot', 'densityPlot',
  'heatmap', 'hexbinChart', 'contourChart', 'qqPlot', 'beeswarmChart',
  'ridgelinePlot', 'parallelCoordinatesPlot', 'mosaicChart', 'marimekkoChart', 'mekkoChart',
  'waffleChart', 'calendarHeatmap', 'stemLeafPlot', 'scatterChart', 'bubbleChart',
  'candlestickChart', 'kLineChart', 'ohlcChart', 'heikinAshiChart', 'renkoChart',
  'kagiChart', 'pointAndFigureChart', 'volumeChart', 'candlestickVolumeChart',
  'highLowChart', 'volumeProfileChart',
  'treemap', 'sunburstChart', 'treeChart', 'dendrogramChart',
  'sankeyChart', 'chordChart', 'alluvialChart', 'streamgraph',
  'networkChart', 'timeline', 'ganttChart',
  'surfaceChart3d', 'wireframeChart3d', 'meshChart3d', 'vectorFieldChart',
  'pictogramChart', 'wordCloudChart',
] as const;
