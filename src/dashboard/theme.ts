import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import type { UiThemeTokens } from '../components/uiTheme';
import { createThemeScope } from '../theme/themeScope';
import { colorWithAlpha } from '../utils/color';
import {
  contrastingInk,
  parseCssPx,
  pickChrome,
  relativeLuminance,
} from '../theme/themeUtils';

/** Dashboard widget palette — mirrors UI semantic token names for dark analytics panels. */
export const DASHBOARD = {
  panel: '#151d2e',
  panelStroke: '#2a3654',
  face: '#0f172a',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  /** Axis / legend label size (px). */
  fontSize: 12,
  fontSizeSm: 10,
  fontSizeTitle: 13,
  primary: '#3b82f6',
  secondary: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  dangerDark: '#dc2626',
  inactive: '#374151',
  inactiveBar: '#475569',
  gaugeTrack: '#374151',
  gaugeNeedle: '#3b82f6',
  speedoNeedle: '#ef4444',
  chartBg: '#111827',
  chartGrid: '#334155',
  chartAxis: '#64748b',
  chartLine: '#3b82f6',
  chartArea: 'rgba(59, 130, 246, 0.35)',
  chartPlot: '#0f172a',
  chartTooltipBg: '#1e293b',
  chartTooltipBorder: '#475569',
  chartCrosshair: 'rgba(148, 163, 184, 0.6)',
  chartDot: '#60a5fa',
  barFill: '#3b82f6',
  compassFace: '#1c2740',
  compassRing: '#475569',
  compassHub: '#334155',
  thermometerTube: '#334155',
  thermometerBorder: '#475569',
  meterTrack: '#374151',
  meterFill: '#3b82f6',
  clockFace: '#1f2937',
  clockRing: '#374151',
  clockHand: '#e2e8f0',
  clockSecond: '#ef4444',
  batteryOutline: '#475569',
  batteryTip: '#475569',
  knobTrack: '#374151',
  knobRing: '#1f2937',
  knobIndicator: '#f59e0b',
  knobArc: 'rgba(245, 158, 11, 0.25)',
  clockTick: '#64748b',
  clockTickMajor: '#94a3b8',
  clockHub: '#374151',
  signalActive: '#22c55e',
  signalInactive: '#475569',
  pieStroke: '#1f2937',
  timelineLine: '#475569',
  timelineDot: '#3b82f6',
  highlight: '#3b82f6',
  series: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#f97316', '#ec4899'] as const,
  financialUp: '#22c55e',
  financialDown: '#ef4444',
  flowLink: 'rgba(59, 130, 246, 0.45)',
  heatmapLow: '#1e3a5f',
  heatmapHigh: '#60a5fa',
} as const;

export type DashboardTheme = {
  [K in keyof typeof DASHBOARD]: (typeof DASHBOARD)[K] extends readonly string[]
    ? string[]
    : (typeof DASHBOARD)[K] extends number
      ? number
      : string;
};

function ensureReadableChartText(theme: DashboardTheme): DashboardTheme {
  const bg = theme.chartPlot || theme.chartBg || theme.panel;
  const bgLum = relativeLuminance(bg);
  const textLum = relativeLuminance(theme.text);
  if (bgLum == null || textLum == null) return theme;
  // Same-side contrast (both dark or both light) → fix text
  if ((bgLum < 0.45 && textLum < 0.45) || (bgLum > 0.6 && textLum > 0.6)) {
    const ink = contrastingInk(bg);
    return {
      ...theme,
      text: ink,
      textMuted: colorWithAlpha(ink, 0.7) ?? theme.textMuted,
      chartAxis: colorWithAlpha(ink, 0.55) ?? theme.chartAxis,
      clockHand: ink,
    };
  }
  return theme;
}

function cloneDefaults(): DashboardTheme {
  return {
    ...DASHBOARD,
    series: [...DASHBOARD.series],
  };
}

/** Merge optional UI theme tokens into the dashboard palette (for app-level theming). */
export function resolveDashboardTheme(
  ui?: Partial<UiThemeTokens>,
  pack?: Partial<DashboardTheme>
): DashboardTheme {
  if ((!ui || Object.keys(ui).length === 0) && (!pack || Object.keys(pack).length === 0)) {
    return cloneDefaults();
  }

  const primary = ui?.primary ?? DASHBOARD.primary;
  const warning = ui?.warning ?? DASHBOARD.warning;
  const success = ui?.success ?? DASHBOARD.success;
  const danger = ui?.danger ?? DASHBOARD.danger;
  const chartArea = colorWithAlpha(primary, 0.35) ?? DASHBOARD.chartArea;
  const flowLink = colorWithAlpha(primary, 0.45) ?? DASHBOARD.flowLink;
  const knobArc = colorWithAlpha(warning, 0.25) ?? DASHBOARD.knobArc;

  const base: DashboardTheme = !ui || Object.keys(ui).length === 0
    ? cloneDefaults()
    : {
        ...cloneDefaults(),
        primary,
        secondary: ui.secondary ?? DASHBOARD.secondary,
        success,
        warning,
        danger,
        text: ui.text ?? DASHBOARD.text,
        textMuted: ui.textMuted ?? DASHBOARD.textMuted,
        textDim: ui.textMuted ?? DASHBOARD.textDim,
        fontSize: parseCssPx(ui.fontSize, DASHBOARD.fontSize),
        fontSizeSm: parseCssPx(ui.fontSizeSm, DASHBOARD.fontSizeSm),
        fontSizeTitle: parseCssPx(ui.fontSizeLg, DASHBOARD.fontSizeTitle),
        panel: pickChrome(ui.surface, DASHBOARD.panel),
        panelStroke: pickChrome(ui.border, DASHBOARD.panelStroke),
        face: pickChrome(ui.surfaceMuted, DASHBOARD.face),
        // Chart chrome follows dark surfaces; light UI packs keep analytics defaults
        chartBg: pickChrome(ui.surfaceMuted, DASHBOARD.chartBg),
        chartPlot: pickChrome(ui.surfaceMuted, DASHBOARD.chartPlot),
        chartGrid: pickChrome(ui.border, DASHBOARD.chartGrid),
        chartAxis: ui.textMuted ?? DASHBOARD.chartAxis,
        chartTooltipBg: pickChrome(ui.surface, DASHBOARD.chartTooltipBg),
        chartTooltipBorder: pickChrome(ui.borderStrong, DASHBOARD.chartTooltipBorder),
        gaugeTrack: pickChrome(ui.surfaceInset, DASHBOARD.gaugeTrack),
        meterTrack: pickChrome(ui.surfaceInset, DASHBOARD.meterTrack),
        inactive: pickChrome(ui.borderStrong, DASHBOARD.inactive),
        inactiveBar: pickChrome(ui.border, DASHBOARD.inactiveBar),
        thermometerTube: pickChrome(ui.surfaceInset, DASHBOARD.thermometerTube),
        thermometerBorder: pickChrome(ui.border, DASHBOARD.thermometerBorder),
        compassFace: pickChrome(ui.surface, DASHBOARD.compassFace),
        compassRing: pickChrome(ui.border, DASHBOARD.compassRing),
        compassHub: pickChrome(ui.surfaceInset, DASHBOARD.compassHub),
        clockFace: pickChrome(ui.surface, DASHBOARD.clockFace),
        clockRing: pickChrome(ui.border, DASHBOARD.clockRing),
        clockHand: ui.text ?? DASHBOARD.clockHand,
        clockTick: ui.textMuted ?? DASHBOARD.clockTick,
        clockTickMajor: ui.textSecondary ?? DASHBOARD.clockTickMajor,
        clockHub: pickChrome(ui.surfaceInset, DASHBOARD.clockHub),
        batteryOutline: pickChrome(ui.borderStrong, DASHBOARD.batteryOutline),
        batteryTip: pickChrome(ui.borderStrong, DASHBOARD.batteryTip),
        knobTrack: pickChrome(ui.surfaceInset, DASHBOARD.knobTrack),
        knobRing: pickChrome(ui.surfaceMuted, DASHBOARD.knobRing),
        signalInactive: pickChrome(ui.borderStrong, DASHBOARD.signalInactive),
        pieStroke: pickChrome(ui.surface, DASHBOARD.pieStroke),
        timelineLine: pickChrome(ui.border, DASHBOARD.timelineLine),
        heatmapLow: pickChrome(ui.primarySubtle ?? ui.surfaceInset, DASHBOARD.heatmapLow),
        gaugeNeedle: primary,
        chartLine: primary,
        barFill: primary,
        meterFill: primary,
        highlight: primary,
        timelineDot: primary,
        chartArea,
        chartDot: primary,
        flowLink,
        heatmapHigh: primary,
        signalActive: success,
        financialUp: success,
        financialDown: danger,
        speedoNeedle: danger,
        clockSecond: danger,
        knobIndicator: warning,
        knobArc,
        series: [primary, DASHBOARD.series[1], DASHBOARD.series[2], DASHBOARD.series[3]],
      };

  if (!pack || Object.keys(pack).length === 0) {
    return ensureReadableChartText(base);
  }

  const next: DashboardTheme = {
    ...base,
    ...pack,
    series: pack.series?.length ? [...pack.series] : [...base.series],
    fontSize: parseCssPx(
      (pack as { fontSize?: string | number }).fontSize ?? base.fontSize,
      base.fontSize
    ),
    fontSizeSm: parseCssPx(
      (pack as { fontSizeSm?: string | number }).fontSizeSm ?? base.fontSizeSm,
      base.fontSizeSm
    ),
    fontSizeTitle: parseCssPx(
      (pack as { fontSizeTitle?: string | number }).fontSizeTitle ?? base.fontSizeTitle,
      base.fontSizeTitle
    ),
  };
  return ensureReadableChartText(next);
}

const dashboardScope = createThemeScope<DashboardTheme>(cloneDefaults);

/** Module pack (dashboard + series) stored on the App theme. */
export function dashboardPackFromApp(app?: App | null): Partial<DashboardTheme> {
  if (!app || typeof app.getTheme !== 'function') return {};
  const t = app.getTheme();
  return {
    ...(t.dashboard ?? {}),
    ...(t.series?.length ? { series: [...t.series] } : {}),
  };
}

/** Sync App-scoped dashboard palette (App init / setUiTheme / create). */
export function syncActiveDashboardTheme(
  tokens: Partial<UiThemeTokens> = {},
  app?: App | null,
  pack?: Partial<DashboardTheme>
): DashboardTheme {
  return dashboardScope.sync(resolveDashboardTheme(tokens, pack), app ?? undefined);
}

/**
 * Current dashboard palette for builders.
 * Prefer calling inside a create/rebuild (stack); optional `app` uses WeakMap snapshot.
 */
export function getActiveDashboard(app?: App | null): DashboardTheme {
  return dashboardScope.getActive(app ?? undefined);
}

/** Run factory/rebuild with a fixed palette on the build stack. */
export function runWithDashboardTheme<R>(theme: DashboardTheme, fn: () => R): R {
  return dashboardScope.runWithResult(theme, fn);
}

/** Resolve palette for an app without mutating the active theme. */
export function getDashboardTheme(app?: App | null): DashboardTheme {
  if (app && typeof app.getResolvedTheme === 'function') {
    return resolveDashboardTheme(app.getResolvedTheme(), dashboardPackFromApp(app));
  }
  return cloneDefaults();
}

/** Rebuild every dashboard widget that exposes `chartRebuild` (gauges + charts). */
export function refreshDashboard(root: Node, _app?: App | null): void {
  const visit = (n: Node) => {
    const rebuild = n.metadata?.chartRebuild as (() => void) | undefined;
    if (typeof rebuild === 'function' && n.metadata?.widgetType) {
      // Per-node uiTheme applied inside chartRebuild via resolveEffectiveUiTokens
      rebuild();
    }
    if ('children' in n) {
      for (const child of (n as Group).children) visit(child);
    }
  };
  visit(root);
}
