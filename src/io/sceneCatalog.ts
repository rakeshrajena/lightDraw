/**
 * Built-in scene / theme catalogs for validation hints (“expected one of …”).
 * Keep in sync with registerComponent / registerDashboard / registerAutomotive / diagram types.
 */

export const SHAPE_TYPES = [
  'rect',
  'circle',
  'ellipse',
  'line',
  'arc',
  'polygon',
  'polyline',
  'path',
  'star',
  'roundedRect',
  'text',
  'image',
  'sprite',
  'group',
  'layer',
] as const;

export const UI_COMPONENT_TYPES = [
  'accordion',
  'button',
  'card',
  'checkbox',
  'dialog',
  'input',
  'label',
  'menu',
  'progressBar',
  'radio',
  'slider',
  'statusBar',
  'table',
  'tabs',
  'textarea',
  'toast',
  'toggle',
  'toolbar',
  'tooltip',
  'tree',
] as const;

export const DASHBOARD_TYPES = [
  'alluvialChart',
  'areaChart',
  'bandChart',
  'barChart',
  'battery',
  'beeswarmChart',
  'boxAndWhiskerChart',
  'boxPlot',
  'bubbleChart',
  'bulletChart',
  'bumpChart',
  'calendar',
  'calendarHeatmap',
  'candlestickVolumeChart',
  'chartPanel',
  'chordChart',
  'clock',
  'columnChart',
  'combinationChart',
  'compass',
  'coneChart',
  'contourChart',
  'controlChart',
  'dendrogramChart',
  'densityPlot',
  'dotPlot',
  'doughnutChart',
  'errorBarChart',
  'funnelChart',
  'ganttChart',
  'gauge',
  'heatmap',
  'hexbinChart',
  'histogram',
  'horizonChart',
  'horizontalBarChart',
  'kagiChart',
  'knob',
  'legend',
  'lineChart',
  'lollipopChart',
  'marimekkoChart',
  'mekkoChart',
  'meshChart3d',
  'meter',
  'mixedChart',
  'mosaicChart',
  'networkChart',
  'parallelCoordinatesPlot',
  'paretoChart',
  'pictogramChart',
  'pieChart',
  'polarAreaChart',
  'populationPyramidChart',
  'pyramidChart',
  'qqPlot',
  'radarChart',
  'rangeAreaChart',
  'rangeChart',
  'ribbonChart',
  'ridgelinePlot',
  'runChart',
  'sankeyChart',
  'scatterChart',
  'signalStrength',
  'sparklineChart',
  'speedometer',
  'spiderChart',
  'splineChart',
  'stackedAreaChart',
  'stackedBarChart',
  'stackedColumnChart',
  'stemLeafPlot',
  'stepChart',
  'streamgraph',
  'stripPlot',
  'sunburstChart',
  'surfaceChart3d',
  'thermometer',
  'timeline',
  'treeChart',
  'treemap',
  'vectorFieldChart',
  'violinPlot',
  'volumeChart',
  'volumeProfileChart',
  'waffleChart',
  'waterfallChart',
  'wireframeChart3d',
  'wordCloudChart',
] as const;

export const AUTOMOTIVE_TYPES = [
  'adasStatus',
  'albumArt',
  'batteryVoltage',
  'calendar',
  'callScreen',
  'canViewer',
  'climateControl',
  'compass',
  'cruiseControl',
  'digitalInstrumentCluster',
  'engineTemp',
  'fmRadio',
  'fuelGauge',
  'gearIndicator',
  'gpsNavigationMap',
  'headlights',
  'instrumentCluster',
  'mediaPlayer',
  'musicControls',
  'navigationSearch',
  'notificationCenter',
  'nowPlaying',
  'parkingBrake',
  'podcastPlayer',
  'quickSettingsPanel',
  'rearViewCamera',
  'routeGuidance',
  'speedometer',
  'sunriseSunset',
  'tachometer',
  'tpms',
  'turnIndicators',
  'warningAlertPanel',
  'warningLamp',
] as const;

export const DIAGRAM_TYPES = [
  'flowchart',
  'stateMachine',
  'classDiagram',
  'mindMap',
  'networkTopology',
  'orgChart',
  'electricalSchematic',
  'canNetwork',
  'processPipeline',
] as const;

export const UI_THEME_PRESETS = [
  'default',
  'dark',
  'violet',
  'emerald',
  'slate',
  'ocean',
  'rose',
  'darkViolet',
] as const;

export const AUTOMOTIVE_THEME_PRESETS = ['classic', 'sport', 'digital'] as const;

/** Prop enums keyed by node type → prop name → allowed values */
export const PROP_ENUMS: Record<string, Record<string, readonly string[]>> = {
  button: {
    variant: ['primary', 'secondary', 'ghost', 'danger'],
    size: ['sm', 'md', 'lg'],
  },
  progressBar: {
    variant: ['default', 'success', 'warning', 'danger'],
    size: ['sm', 'md', 'lg'],
  },
  checkbox: { size: ['sm', 'md', 'lg'] },
  toggle: { size: ['sm', 'md'] },
  toast: { variant: ['success', 'error', 'warning', 'info'] },
  tooltip: { placement: ['top', 'bottom', 'left', 'right'] },
  menu: {},
  // Automotive cluster theme (also accepted on other auto widgets)
  instrumentCluster: { theme: [...AUTOMOTIVE_THEME_PRESETS] },
  digitalInstrumentCluster: { theme: [...AUTOMOTIVE_THEME_PRESETS] },
  speedometer: { theme: [...AUTOMOTIVE_THEME_PRESETS] },
  tachometer: { theme: [...AUTOMOTIVE_THEME_PRESETS] },
  fuelGauge: { theme: [...AUTOMOTIVE_THEME_PRESETS] },
  engineTemp: { theme: [...AUTOMOTIVE_THEME_PRESETS] },
};

/** Shared prop enums applied to any node that declares the key */
export const SHARED_PROP_ENUMS: Record<string, readonly string[]> = {
  // string uiTheme presets (object uiTheme is also valid — skipped in enum check)
};

const KNOWN_TYPE_SET = new Set<string>([
  ...SHAPE_TYPES,
  ...UI_COMPONENT_TYPES,
  ...DASHBOARD_TYPES,
  ...AUTOMOTIVE_TYPES,
  ...DIAGRAM_TYPES,
]);

let extraTypes = new Set<string>();

/** Register custom / plugin types so strict validation accepts them. */
export function registerKnownSceneTypes(types: string[]): void {
  for (const t of types) {
    if (t) extraTypes.add(t);
  }
}

export function clearExtraSceneTypes(): void {
  extraTypes = new Set();
}

export function listKnownSceneTypes(): string[] {
  return [...KNOWN_TYPE_SET, ...extraTypes].sort();
}

export function isKnownSceneType(type: string): boolean {
  return KNOWN_TYPE_SET.has(type) || extraTypes.has(type);
}

/** Levenshtein distance (small strings). */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array(n + 1);
  const cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = cur[j];
  }
  return prev[n];
}

/**
 * Closest catalog matches for a bad value.
 * Prefers edit distance, then case-insensitive / substring hits.
 */
export function suggestClosest(
  value: string,
  allowed: readonly string[],
  limit = 5
): string[] {
  const v = String(value ?? '');
  if (!v || !allowed.length) return [];
  const lower = v.toLowerCase();
  const scored = allowed.map((cand) => {
    const c = String(cand);
    const cl = c.toLowerCase();
    let score = editDistance(lower, cl);
    if (cl.startsWith(lower) || lower.startsWith(cl)) score = Math.min(score, 1);
    if (cl.includes(lower) || lower.includes(cl)) score = Math.min(score, 2);
    return { cand: c, score };
  });
  scored.sort((a, b) => a.score - b.score || a.cand.localeCompare(b.cand));
  const maxDist = Math.max(2, Math.ceil(v.length / 3));
  return scored
    .filter((s) => s.score <= maxDist)
    .slice(0, limit)
    .map((s) => s.cand);
}

/** `expected one of: "a" | "b" | "c"` (truncates long lists). */
export function formatExpectedValues(allowed: readonly string[], maxShow = 8): string {
  const list = [...allowed];
  if (list.length === 0) return 'expected a known value';
  if (list.length <= maxShow) {
    return `expected one of: ${list.map((v) => JSON.stringify(v)).join(' | ')}`;
  }
  const head = list.slice(0, maxShow).map((v) => JSON.stringify(v)).join(' | ');
  return `expected one of: ${head} | … (+${list.length - maxShow} more)`;
}

/** Full human hint: invalid + expected + optional did-you-mean. */
export function formatInvalidValue(
  got: unknown,
  allowed: readonly string[],
  opts?: { maxShow?: number; suggest?: boolean }
): string {
  const maxShow = opts?.maxShow ?? 8;
  const suggest = opts?.suggest !== false;
  const gotStr = typeof got === 'string' ? got : String(got);
  const expected = formatExpectedValues(allowed, maxShow);
  const parts = [`invalid value ${JSON.stringify(gotStr)}; ${expected}`];
  if (suggest && typeof got === 'string') {
    const close = suggestClosest(got, allowed, 3);
    if (close.length) {
      parts.push(`did you mean ${close.map((c) => JSON.stringify(c)).join(', ')}?`);
    }
  }
  return parts.join(' ');
}

export function propEnumsForType(type: string): Record<string, readonly string[]> {
  const specific = PROP_ENUMS[type] ?? {};
  // Any auto widget may use theme: classic|sport|digital
  if ((AUTOMOTIVE_TYPES as readonly string[]).includes(type) && !specific.theme) {
    return { ...specific, theme: AUTOMOTIVE_THEME_PRESETS };
  }
  return specific;
}
