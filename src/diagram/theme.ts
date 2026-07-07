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
  edgeGlow: 'rgba(96,165,250,0.18)',
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
  orgToggle: '#cbd5e1',
  orgToggleBg: '#243044',
  orgRole: '#94a3b8',

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
    arrow: 1.25,
  },
} as const;

export type DiagramTheme = typeof DIAGRAM;
export type DiagramStrokeContext = 'screen' | 'print' | 'compact';

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
