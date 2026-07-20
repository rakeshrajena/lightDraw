import type { App } from '../App';
import type { UiThemeTokens } from '../components/uiTheme';
import { createThemeScope } from '../theme/themeScope';
import { parseCssPx, pickChrome } from '../theme/themeUtils';
import { colorWithAlpha } from '../utils/color';

/** Diagram design tokens — tuned for dark canvas backgrounds */
export const DIAGRAM = {
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",

  fontSize: {
    xs: 9,
    sm: 10,
    md: 11,
    base: 12,
    lg: 13,
    xl: 14,
  },

  radii: {
    sm: 4,
    md: 6,
    lg: 8,
    pill: 20,
    round: 999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },

  shadow: {
    color: 'rgba(0,0,0,0.35)',
    blur: 10,
    offsetX: 0,
    offsetY: 3,
  },
  shadowSoft: {
    color: 'rgba(0,0,0,0.22)',
    blur: 6,
    offsetX: 0,
    offsetY: 2,
  },
  shadowElevated: {
    color: 'rgba(0,0,0,0.42)',
    blur: 14,
    offsetX: 0,
    offsetY: 4,
  },

  sheen: 'rgba(255,255,255,0.08)',
  sheenStrong: 'rgba(255,255,255,0.12)',
  cardInnerBorder: 'rgba(255,255,255,0.05)',

  canvasBg: '#0d1322',
  surface: '#151d2e',
  surfaceElevated: '#1c2740',

  nodeFill: '#1c2740',
  nodeStroke: '#3b82f6',
  nodeText: '#f1f5f9',
  nodeTextMuted: '#94a3b8',

  /** Connector palette */
  edge: '#60a5fa',
  edgeGlow: 'rgba(96,165,250,0.12)',
  edgeMuted: '#64748b',
  edgeMutedGlow: 'rgba(100,116,139,0.14)',
  edgeLabel: '#e2e8f0',
  labelPillFill: '#1a2336',
  labelPillStroke: '#3b4f6b',

  /** Flowchart semantic colors */
  flowchartStart: { fill: '#14532d', stroke: '#22c55e', accent: '#4ade80' },
  flowchartEnd: { fill: '#1e1b4b', stroke: '#818cf8', accent: '#a5b4fc' },
  flowchartProcess: { fill: '#1c2740', stroke: '#3b82f6', accent: '#60a5fa' },
  flowchartDecision: { fill: '#422006', stroke: '#f59e0b', accent: '#fbbf24' },

  decisionFill: '#422006',
  decisionStroke: '#f59e0b',
  terminalFill: '#14532d',
  terminalStroke: '#22c55e',

  stateFill: '#1c2740',
  stateStroke: '#818cf8',
  stateInitialFill: '#422006',
  stateInitialStroke: '#f59e0b',
  stateFinalFill: '#14532d',
  stateFinalStroke: '#22c55e',

  classFill: '#1c2740',
  classStroke: '#475569',
  classHeaderBg: '#243044',
  classHeader: '#f1f5f9',
  classBody: '#94a3b8',
  classDivider: '#334155',

  /** UML relation edge colors */
  umlInheritance: '#f59e0b',
  umlAssociation: '#60a5fa',
  umlImplements: '#a78bfa',
  umlComposition: '#f472b6',

  networkRouter: { fill: '#1e3a5f', stroke: '#3b82f6', glyph: '#60a5fa', edge: '#60a5fa' },
  networkServer: { fill: '#14532d', stroke: '#22c55e', glyph: '#4ade80', edge: '#4ade80' },
  networkSwitch: { fill: '#422006', stroke: '#f59e0b', glyph: '#fbbf24', edge: '#fbbf24' },
  networkClient: { fill: '#3b0764', stroke: '#a855f7', glyph: '#c084fc', edge: '#c084fc' },
  networkDefault: { fill: '#1c2740', stroke: '#64748b', glyph: '#94a3b8', edge: '#94a3b8' },

  /** Category colors for the expanded network icon catalog */
  networkCategories: {
    infra: { fill: '#1e3a5f', stroke: '#3b82f6', glyph: '#60a5fa', edge: '#60a5fa' },
    security: { fill: '#450a0a', stroke: '#ef4444', glyph: '#f87171', edge: '#f87171' },
    server: { fill: '#14532d', stroke: '#22c55e', glyph: '#4ade80', edge: '#4ade80' },
    storage: { fill: '#164e63', stroke: '#06b6d4', glyph: '#22d3ee', edge: '#22d3ee' },
    endpoint: { fill: '#3b0764', stroke: '#a855f7', glyph: '#c084fc', edge: '#c084fc' },
    cloud: { fill: '#1e1b4b', stroke: '#818cf8', glyph: '#a5b4fc', edge: '#a5b4fc' },
    data: { fill: '#1c1917', stroke: '#f59e0b', glyph: '#fbbf24', edge: '#fbbf24' },
    messaging: { fill: '#312e81', stroke: '#6366f1', glyph: '#818cf8', edge: '#818cf8' },
    monitor: { fill: '#0f172a', stroke: '#38bdf8', glyph: '#7dd3fc', edge: '#7dd3fc' },
    iot: { fill: '#14532d', stroke: '#84cc16', glyph: '#a3e635', edge: '#a3e635' },
    auto: { fill: '#422006', stroke: '#f97316', glyph: '#fb923c', edge: '#fb923c' },
    external: { fill: '#1e293b', stroke: '#94a3b8', glyph: '#cbd5e1', edge: '#cbd5e1' },
    link: { fill: '#0f172a', stroke: '#64748b', glyph: '#94a3b8', edge: '#94a3b8' },
    zone: { fill: '#111827', stroke: '#475569', glyph: '#64748b', edge: '#64748b' },
  },

  pipelineDone: '#22c55e',
  pipelineActive: '#3b82f6',
  pipelinePending: '#64748b',
  pipelinePendingFill: '#1c2740',
  pipelineActiveFill: '#1e3a5f',
  pipelineDoneFill: '#14532d',
  pipelineErrorFill: '#450a0a',
  pipelineErrorStroke: '#ef4444',

  mindCenter: { fill: '#422006', stroke: '#f59e0b', accent: '#fbbf24' },
  mindBranch: { fill: '#1e3a5f', stroke: '#0ea5e9', accent: '#38bdf8' },
  mindLeaf: { fill: '#1c2740', stroke: '#64748b', accent: '#94a3b8' },
  mindBranchPalette: [
    { fill: '#1e3a5f', stroke: '#0ea5e9', accent: '#38bdf8', glow: 'rgba(14,165,233,0.22)' },
    { fill: '#1e1b4b', stroke: '#818cf8', accent: '#a5b4fc', glow: 'rgba(129,140,248,0.2)' },
    { fill: '#14532d', stroke: '#22c55e', accent: '#4ade80', glow: 'rgba(34,197,94,0.2)' },
    { fill: '#3b0764', stroke: '#a855f7', accent: '#c084fc', glow: 'rgba(168,85,247,0.2)' },
  ] as const,

  orgTier: [
    { fill: '#1c2740', stroke: '#3b82f6', accent: '#60a5fa' },
    { fill: '#1e293b', stroke: '#6366f1', accent: '#818cf8' },
    { fill: '#1a2332', stroke: '#64748b', accent: '#94a3b8' },
  ] as const,
  /** Branch / sub-branch grouping colors (top-level teams inherit to descendants) */
  orgBranchPalette: [
    { fill: '#1e3a5f', stroke: '#3b82f6', accent: '#60a5fa' },
    { fill: '#1e1b4b', stroke: '#818cf8', accent: '#a5b4fc' },
    { fill: '#14532d', stroke: '#22c55e', accent: '#4ade80' },
    { fill: '#3b0764', stroke: '#a855f7', accent: '#c084fc' },
    { fill: '#422006', stroke: '#f59e0b', accent: '#fbbf24' },
    { fill: '#164e63', stroke: '#06b6d4', accent: '#22d3ee' },
  ] as const,
  /** Minimize control (branch expanded — click to collapse) */
  orgToggleExpanded: { fill: '#1e293b', stroke: '#64748b', glyph: '#e2e8f0' },
  /** Maximize control (branch collapsed — click to expand) */
  orgToggleCollapsed: { fill: '#1e3a5f', stroke: '#3b82f6', glyph: '#93c5fd' },
  orgToggle: '#cbd5e1',
  orgToggleBg: '#243044',
  orgRole: '#94a3b8',
  /** Connector color for org charts (neutral professional) */
  orgEdge: '#64748b',
  orgEdgeWidth: 1.75,
  orgCardShadow: {
    color: 'rgba(0,0,0,0.38)',
    blur: 12,
    offsetX: 0,
    offsetY: 4,
  },

  canBus: '#3b82f6',
  canBusGlow: 'rgba(59,130,246,0.25)',
  canTermination: '#22c55e',
  canEcuPalette: ['#3b82f6', '#6366f1', '#0ea5e9', '#22c55e', '#a855f7'] as const,

  schematicStroke: '#cbd5e1',
  schematicWire: '#60a5fa',
  schematicWireGlow: 'rgba(96,165,250,0.2)',
  schematicFill: '#1a2336',
  schematicLedFill: '#fde047',
  schematicLedStroke: '#eab308',
  schematicLabel: '#94a3b8',
  schematicBattery: '#22c55e',
  schematicResistor: '#f59e0b',
  schematicSwitch: '#60a5fa',

  /** Stroke widths — screen defaults; use resolveStrokeWidth for print/compact */
  stroke: {
    node: 1.5,
    nodeEmphasis: 2,
    edge: 2,
    edgeThin: 1.5,
    edgeGlow: 5,
    label: 1,
    arrow: 1.75,
  },
} as const;

export type DiagramTheme = {
  -readonly [K in keyof typeof DIAGRAM]: (typeof DIAGRAM)[K] extends readonly (infer U)[]
    ? U[]
    : (typeof DIAGRAM)[K] extends object
      ? { -readonly [P in keyof (typeof DIAGRAM)[K]]: (typeof DIAGRAM)[K][P] }
      : (typeof DIAGRAM)[K];
};

export type DiagramStrokeContext = 'screen' | 'print' | 'compact';

function cloneDefaults(): DiagramTheme {
  return JSON.parse(JSON.stringify(DIAGRAM)) as DiagramTheme;
}

function scaleDiagramFonts(
  theme: DiagramTheme,
  basePx: number
): void {
  const scale = basePx / DIAGRAM.fontSize.base;
  if (!Number.isFinite(scale) || scale <= 0) return;
  theme.fontSize = {
    xs: Math.max(6, Math.round(DIAGRAM.fontSize.xs * scale)),
    sm: Math.max(7, Math.round(DIAGRAM.fontSize.sm * scale)),
    md: Math.max(8, Math.round(DIAGRAM.fontSize.md * scale)),
    base: Math.max(8, Math.round(DIAGRAM.fontSize.base * scale)),
    lg: Math.max(9, Math.round(DIAGRAM.fontSize.lg * scale)),
    xl: Math.max(10, Math.round(DIAGRAM.fontSize.xl * scale)),
  } as DiagramTheme['fontSize'];
}

function mergeDiagramFontSize(
  theme: DiagramTheme,
  packFont: unknown
): void {
  if (!packFont || typeof packFont !== 'object') return;
  const next: Record<string, number> = { ...theme.fontSize };
  for (const [key, value] of Object.entries(packFont as Record<string, unknown>)) {
    if (!(key in next)) continue;
    next[key] = parseCssPx(value, next[key]);
  }
  theme.fontSize = next as DiagramTheme['fontSize'];
}

/** Merge UI theme tokens into diagram palette. Empty input → default DIAGRAM look. */
export function resolveDiagramTheme(
  ui?: Partial<UiThemeTokens>,
  pack?: Record<string, unknown>
): DiagramTheme {
  // Loose working copy: UI token strings replace const palette literals, then cast back.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const theme: any = cloneDefaults();
  const hasUi = Boolean(ui && Object.keys(ui).length > 0);
  const hasPack = Boolean(pack && Object.keys(pack).length > 0);
  if (!hasUi && !hasPack) return theme as DiagramTheme;

  if (hasUi && ui) {
    const primary = ui.primary ?? theme.nodeStroke;
    const success = ui.success ?? theme.terminalStroke;
    const warning = ui.warning ?? theme.decisionStroke;
    const danger = ui.danger ?? theme.pipelineErrorStroke;
    const surface = pickChrome(ui.surface, theme.surface);
    const text = ui.text ?? theme.nodeText;
    const textMuted = ui.textMuted ?? theme.nodeTextMuted;
    const accent = colorWithAlpha(primary, 0.18) ?? theme.edgeGlow;

    theme.surface = surface;
    theme.canvasBg = pickChrome(ui.surfaceMuted, theme.canvasBg);
    theme.surfaceElevated = pickChrome(ui.surfaceInset, theme.surfaceElevated);
    theme.nodeFill = pickChrome(ui.surfaceInset, theme.nodeFill);
    theme.nodeStroke = primary;
    theme.nodeText = text;
    theme.nodeTextMuted = textMuted;
    theme.edge = primary;
    theme.edgeGlow = accent;
    theme.umlAssociation = primary;
    theme.umlInheritance = warning;
    theme.flowchartProcess = { fill: theme.nodeFill, stroke: primary, accent: primary };
    theme.flowchartStart = { ...theme.flowchartStart, stroke: success, accent: success };
    theme.flowchartDecision = { ...theme.flowchartDecision, stroke: warning, accent: warning };
    theme.decisionStroke = warning;
    theme.terminalStroke = success;
    theme.networkRouter = { fill: theme.networkRouter.fill, stroke: primary, glyph: primary, edge: primary };
    theme.networkServer = { ...theme.networkServer, stroke: success, glyph: success, edge: success };
    theme.pipelineActive = primary;
    theme.pipelineDone = success;
    theme.pipelineErrorStroke = danger;
    theme.canBus = primary;
    theme.canBusGlow = colorWithAlpha(primary, 0.25) ?? theme.canBusGlow;
    theme.canTermination = success;
    theme.canEcuPalette = [primary, ...theme.canEcuPalette.slice(1)];
    theme.schematicWire = primary;
    theme.schematicWireGlow = colorWithAlpha(primary, 0.2) ?? theme.schematicWireGlow;
    theme.schematicBattery = success;
    theme.schematicResistor = warning;
    theme.schematicSwitch = primary;
    theme.orgTier = [
      { fill: theme.orgTier[0].fill, stroke: primary, accent: primary },
      theme.orgTier[1],
      theme.orgTier[2],
    ];
    theme.mindBranch = { ...theme.mindBranch, stroke: primary, accent: primary };
    theme.mindCenter = { ...theme.mindCenter, stroke: warning, accent: warning };

    if (ui.fontSize != null && String(ui.fontSize).trim() !== '') {
      scaleDiagramFonts(theme as DiagramTheme, parseCssPx(ui.fontSize, DIAGRAM.fontSize.base));
    }
    if (ui.fontFamily) {
      theme.fontFamily = ui.fontFamily;
    }
  }

  if (hasPack && pack) {
    for (const [key, value] of Object.entries(pack)) {
      if (value === undefined) continue;
      if (key === 'fontSize') {
        mergeDiagramFontSize(theme as DiagramTheme, value);
        continue;
      }
      theme[key] = value;
    }
  }

  return theme as DiagramTheme;
}

const diagramScope = createThemeScope<DiagramTheme>(cloneDefaults);

/** Module pack stored on the App theme. */
export function diagramPackFromApp(app?: App | null): Record<string, unknown> {
  if (!app || typeof app.getTheme !== 'function') return {};
  const t = app.getTheme();
  return { ...(t.diagram ?? {}) };
}

export function syncActiveDiagramTheme(
  tokens: Partial<UiThemeTokens> = {},
  app?: App | null,
  pack?: Record<string, unknown>
): DiagramTheme {
  const resolvedPack = pack ?? diagramPackFromApp(app);
  return diagramScope.sync(resolveDiagramTheme(tokens, resolvedPack), app ?? undefined);
}

/**
 * Current diagram palette for builders.
 * Prefer calling inside a create/rebuild (stack); optional `app` uses WeakMap snapshot.
 */
export function getActiveDiagram(app?: App | null): DiagramTheme {
  return diagramScope.getActive(app ?? undefined);
}

/** Run factory/rebuild with a fixed palette on the build stack. */
export function runWithDiagramTheme<R>(theme: DiagramTheme, fn: () => R): R {
  return diagramScope.runWithResult(theme, fn);
}

export function getDiagramTheme(app?: App | null): DiagramTheme {
  if (app && typeof app.getResolvedTheme === 'function') {
    return resolveDiagramTheme(app.getResolvedTheme(), diagramPackFromApp(app));
  }
  return cloneDefaults();
}

/** Print-safe and compact-canvas stroke scaling */
export function resolveStrokeWidth(
  base: number,
  context: DiagramStrokeContext = 'screen'
): number {
  if (context === 'print') return Math.max(1.25, base * 0.92);
  if (context === 'compact') return Math.max(1.25, base * 0.88);
  return base;
}

/** Pick stroke context from canvas dimensions */
export function strokeContextForCanvas(width: number, height: number): DiagramStrokeContext {
  const minDim = Math.min(width, height);
  if (minDim < 360) return 'compact';
  return 'screen';
}
