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

  canvasBg: '#0d1322',
  surface: '#151d2e',
  surfaceElevated: '#1c2740',

  nodeFill: '#1c2740',
  nodeStroke: '#3b82f6',
  nodeText: '#f1f5f9',
  nodeTextMuted: '#94a3b8',
  edge: '#5b8fd9',
  edgeMuted: '#475569',
  edgeLabel: '#cbd5e1',
  labelPillFill: '#1e293b',
  labelPillStroke: '#334155',

  decisionFill: '#1e3a5f',
  decisionStroke: '#60a5fa',
  terminalFill: '#172554',
  terminalStroke: '#3b82f6',

  stateFill: '#1c2740',
  stateStroke: '#6366f1',
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

  networkRouter: { fill: '#1e3a5f', stroke: '#3b82f6', glyph: '#60a5fa' },
  networkServer: { fill: '#14532d', stroke: '#22c55e', glyph: '#4ade80' },
  networkSwitch: { fill: '#422006', stroke: '#f59e0b', glyph: '#fbbf24' },
  networkClient: { fill: '#3b0764', stroke: '#a855f7', glyph: '#c084fc' },
  networkDefault: { fill: '#1c2740', stroke: '#64748b', glyph: '#94a3b8' },

  pipelineDone: '#22c55e',
  pipelineActive: '#3b82f6',
  pipelinePending: '#475569',
  pipelinePendingFill: '#1c2740',
  pipelineActiveFill: '#1e3a5f',
  pipelineDoneFill: '#14532d',
  pipelineErrorFill: '#450a0a',
  pipelineErrorStroke: '#ef4444',

  mindCenter: { fill: '#422006', stroke: '#f59e0b' },
  mindBranch: { fill: '#1e3a5f', stroke: '#0ea5e9' },
  mindLeaf: { fill: '#1c2740', stroke: '#64748b' },

  orgToggle: '#94a3b8',
  orgToggleBg: '#243044',
  orgRole: '#64748b',

  canBus: '#3b82f6',
  canTermination: '#22c55e',

  schematicStroke: '#94a3b8',
  schematicFill: '#1e293b',
  schematicLedFill: '#fde047',
  schematicLedStroke: '#eab308',
  schematicLabel: '#94a3b8',
} as const;

export type DiagramTheme = typeof DIAGRAM;
