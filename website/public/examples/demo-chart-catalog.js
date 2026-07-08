/** Shared chart catalog for dashboard demos — 82+ registered chart types. */
window.LD_CHART_CATALOG = [
  'lineChart', 'areaChart', 'barChart', 'columnChart', 'horizontalBarChart', 'stackedColumnChart', 'stackedBarChart', 'stackedAreaChart',
  'stepChart', 'splineChart', 'errorBarChart', 'lollipopChart', 'dotPlot', 'stripPlot', 'sparklineChart', 'rangeChart', 'rangeAreaChart',
  'bandChart', 'ribbonChart', 'combinationChart', 'mixedChart', 'waterfallChart', 'paretoChart', 'runChart', 'controlChart',
  'populationPyramidChart', 'bumpChart', 'horizonChart', 'pieChart', 'doughnutChart', 'radarChart', 'polarAreaChart', 'bulletChart',
  'funnelChart', 'pyramidChart', 'coneChart', 'histogram', 'boxPlot', 'violinPlot', 'densityPlot', 'heatmap', 'hexbinChart',
  'contourChart', 'qqPlot', 'beeswarmChart', 'ridgelinePlot', 'parallelCoordinatesPlot', 'mosaicChart', 'marimekkoChart', 'waffleChart',
  'calendarHeatmap', 'stemLeafPlot', 'scatterChart', 'bubbleChart', 'candlestickChart', 'ohlcChart', 'heikinAshiChart', 'renkoChart',
  'kagiChart', 'pointAndFigureChart', 'volumeChart', 'candlestickVolumeChart', 'highLowChart', 'volumeProfileChart', 'treemap',
  'sunburstChart', 'treeChart', 'dendrogramChart', 'sankeyChart', 'chordChart', 'alluvialChart', 'streamgraph', 'networkChart',
  'timeline', 'ganttChart', 'surfaceChart3d', 'wireframeChart3d', 'meshChart3d', 'vectorFieldChart', 'pictogramChart', 'wordCloudChart',
];

const SAMPLE_OHLC = [
  { time: '1', open: 100, high: 105, low: 98, close: 103, volume: 1200 },
  { time: '2', open: 103, high: 108, low: 101, close: 106, volume: 1500 },
  { time: '3', open: 106, high: 107, low: 99, close: 100, volume: 1800 },
  { time: '4', open: 100, high: 104, low: 97, close: 102, volume: 1100 },
  { time: '5', open: 102, high: 110, low: 101, close: 109, volume: 2000 },
  { time: '6', open: 109, high: 112, low: 105, close: 107, volume: 1600 },
];

const SAMPLE_SERIES = [
  { name: 'A', data: [12, 28, 18, 42, 36, 24] },
  { name: 'B', data: [8, 22, 30, 26, 40, 32] },
];

const FINANCIAL_TYPES = new Set([
  'candlestickChart', 'ohlcChart', 'heikinAshiChart', 'renkoChart', 'kagiChart',
  'pointAndFigureChart', 'volumeChart', 'candlestickVolumeChart', 'highLowChart', 'volumeProfileChart', 'kLineChart',
]);

window.ldChartProps = function ldChartProps(type, w, h) {
  const base = { width: w, height: h, x: 0, y: 0 };
  const series = [12, 28, 18, 42, 36, 24];

  if (FINANCIAL_TYPES.has(type)) {
    return { ...base, data: SAMPLE_OHLC };
  }
  if (type.includes('pie') || type.includes('doughnut') || type === 'waffleChart') {
    return { ...base, size: Math.min(w, h), data: series };
  }
  if (type.includes('radar') || type === 'polarAreaChart') {
    return { ...base, size: Math.min(w, h), data: [4, 6, 3, 7, 5] };
  }
  if (type === 'bulletChart') return { ...base, value: 65, target: 80 };
  if (type === 'wordCloudChart') {
    return {
      ...base,
      words: [
        { text: 'data', value: 90 },
        { text: 'chart', value: 70 },
        { text: 'visual', value: 55 },
        { text: 'lightdraw', value: 80 },
        { text: 'canvas', value: 45 },
        { text: 'dashboard', value: 60 },
      ],
    };
  }
  if (type === 'boxPlot' || type === 'boxAndWhiskerChart') {
    return { ...base, data: [[2, 3, 4, 5, 6, 7, 8], [3, 5, 7, 9, 11]] };
  }
  if (type === 'ridgelinePlot' || type === 'streamgraph') {
    return { ...base, series: [[2, 3, 4, 5], [3, 5, 7, 9], [1, 2, 3, 8]] };
  }
  if (type === 'parallelCoordinatesPlot') {
    return { ...base, dimensions: [[1, 5, 3], [2, 4, 6], [3, 2, 8]] };
  }
  if (type === 'heatmap') {
    return {
      ...base,
      matrix: [
        [1, 3, 5, 2],
        [4, 1, 6, 3],
        [2, 5, 1, 4],
      ],
    };
  }
  if (type === 'mosaicChart') {
    return {
      ...base,
      cells: [
        { w: 0.5, h: 0.5, value: 1 },
        { w: 0.5, h: 0.5, value: 2 },
        { w: 0.3, h: 0.5, value: 3 },
        { w: 0.7, h: 0.5, value: 4 },
      ],
    };
  }
  if (type === 'marimekkoChart' || type === 'mekkoChart') {
    return {
      ...base,
      segments: [
        { widthFrac: 0.4, heightFrac: 0.6 },
        { widthFrac: 0.6, heightFrac: 0.4 },
      ],
    };
  }
  if (type === 'calendarHeatmap') {
    return { ...base, values: Array.from({ length: 35 }, (_, i) => (i % 7) + 1) };
  }
  if (type === 'chordChart') {
    return {
      ...base,
      size: Math.min(w, h),
      labels: ['A', 'B', 'C'],
      matrix: [
        [0, 5, 3],
        [4, 0, 2],
        [1, 3, 0],
      ],
    };
  }
  if (type === 'treemap' || type === 'sunburstChart') {
    return {
      ...base,
      data: {
        name: 'root',
        children: [
          { name: 'A', value: 40 },
          { name: 'B', value: 30 },
          { name: 'C', value: 20 },
        ],
      },
    };
  }
  if (type === 'sankeyChart') {
    return {
      ...base,
      nodes: [
        { id: 'a', label: 'Source' },
        { id: 'b', label: 'Process' },
        { id: 'c', label: 'Sink' },
      ],
      links: [
        { source: 'a', target: 'b', value: 40 },
        { source: 'b', target: 'c', value: 35 },
      ],
    };
  }
  if (type === 'networkChart') {
    return {
      ...base,
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    };
  }
  if (type === 'alluvialChart') {
    return {
      ...base,
      stages: [
        ['A1', 'A2'],
        ['B1', 'B2'],
        ['C1', 'C2'],
      ],
    };
  }
  if (type === 'scatterChart' || type === 'bubbleChart' || type === 'hexbinChart') {
    return {
      ...base,
      points: [
        { x: 10, y: 20, size: 8 },
        { x: w * 0.4, y: h * 0.55, size: 14 },
        { x: w * 0.75, y: h * 0.35, size: 10 },
      ],
    };
  }
  if (type === 'timeline') {
    return {
      ...base,
      events: [
        { label: 'Kickoff', start: 0, end: 3 },
        { label: 'Build', start: 3, end: 8 },
        { label: 'Ship', start: 8, end: 10 },
      ],
    };
  }
  if (type === 'ganttChart') {
    return {
      ...base,
      tasks: [
        { label: 'Design', start: 0, end: 3 },
        { label: 'Develop', start: 2, end: 8 },
        { label: 'Test', start: 7, end: 10 },
      ],
    };
  }
  if (type === 'populationPyramidChart') {
    return { ...base, data: [30, 45, 55, 40, 28], mirrorData: [28, 42, 50, 38, 25] };
  }
  if (type === 'combinationChart' || type === 'mixedChart' || type === 'ribbonChart' ||
      type === 'stackedAreaChart' || type === 'stackedBarChart' || type === 'stackedColumnChart' ||
      type === 'horizonChart') {
    return { ...base, series: SAMPLE_SERIES };
  }
  if (type.includes('Chart3d') || type === 'meshChart3d') {
    return {
      ...base,
      zGrid: [
        [1, 2, 3, 2],
        [2, 3, 4, 3],
        [1, 2, 2, 1],
      ],
    };
  }
  if (type === 'pictogramChart') return { ...base, value: 12 };
  if (type === 'coneChart' || type === 'pyramidChart' || type === 'funnelChart') {
    return { ...base, data: [100, 72, 48, 28] };
  }
  return { ...base, data: series };
};
