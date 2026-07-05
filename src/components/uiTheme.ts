/** Programmatic UI theme — customize without writing CSS. Applied as CSS variables on the HTML root. */
export interface UiThemeTokens {
  primary?: string;
  primaryHover?: string;
  primaryActive?: string;
  primarySubtle?: string;
  secondary?: string;
  secondaryHover?: string;
  danger?: string;
  dangerSubtle?: string;
  success?: string;
  successSubtle?: string;
  warning?: string;
  warningSubtle?: string;
  surface?: string;
  surfaceMuted?: string;
  surfaceInset?: string;
  overlay?: string;
  border?: string;
  borderStrong?: string;
  text?: string;
  textSecondary?: string;
  textMuted?: string;
  textInverse?: string;
  placeholder?: string;
  radius?: string;
  radiusSm?: string;
  radiusLg?: string;
  fontFamily?: string;
  controlHeight?: string;
  shadowMd?: string;
  statusBarBg?: string;
  statusBarText?: string;
  statusBarBorder?: string;
  tooltipBg?: string;
  /** Sets `data-ld-theme` on the HTML root (`light` | `dark`) */
  mode?: 'light' | 'dark';
}

const VAR_MAP: Record<Exclude<keyof UiThemeTokens, 'mode'>, string> = {
  primary: '--ld-primary',
  primaryHover: '--ld-primary-hover',
  primaryActive: '--ld-primary-active',
  primarySubtle: '--ld-primary-subtle',
  secondary: '--ld-secondary',
  secondaryHover: '--ld-secondary-hover',
  danger: '--ld-danger',
  dangerSubtle: '--ld-danger-subtle',
  success: '--ld-success',
  successSubtle: '--ld-success-subtle',
  warning: '--ld-warning',
  warningSubtle: '--ld-warning-subtle',
  surface: '--ld-surface',
  surfaceMuted: '--ld-surface-muted',
  surfaceInset: '--ld-surface-inset',
  overlay: '--ld-overlay',
  border: '--ld-border',
  borderStrong: '--ld-border-strong',
  text: '--ld-text',
  textSecondary: '--ld-text-secondary',
  textMuted: '--ld-text-muted',
  textInverse: '--ld-text-inverse',
  placeholder: '--ld-placeholder',
  radius: '--ld-radius',
  radiusSm: '--ld-radius-sm',
  radiusLg: '--ld-radius-lg',
  fontFamily: '--ld-font-family',
  controlHeight: '--ld-control-h',
  shadowMd: '--ld-shadow-md',
  statusBarBg: '--ld-statusbar-bg',
  statusBarText: '--ld-statusbar-text',
  statusBarBorder: '--ld-statusbar-border',
  tooltipBg: '--ld-tooltip-bg',
};

/** Apply theme tokens to a LightDraw HTML root (or any container). */
export function applyUiTheme(el: HTMLElement, tokens: UiThemeTokens): void {
  if (tokens.mode) {
    el.setAttribute('data-ld-theme', tokens.mode);
  }
  for (const [key, value] of Object.entries(tokens) as [keyof UiThemeTokens, string][]) {
    if (key === 'mode') continue;
    const cssVar = VAR_MAP[key as Exclude<keyof UiThemeTokens, 'mode'>];
    if (cssVar && value !== undefined && value !== '') {
      el.style.setProperty(cssVar, value);
    }
  }
}

const DARK_BASE: UiThemeTokens = {
  mode: 'dark',
  surface: '#1e293b',
  surfaceMuted: '#0f172a',
  surfaceInset: '#334155',
  border: '#334155',
  borderStrong: '#475569',
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textInverse: '#0f172a',
  placeholder: '#64748b',
  primarySubtle: '#1e3a5f',
  successSubtle: '#14532d',
  warningSubtle: '#422006',
  dangerSubtle: '#450a0a',
  overlay: 'rgba(0, 0, 0, 0.65)',
  statusBarBg: '#0f172a',
  statusBarText: '#94a3b8',
  statusBarBorder: '#334155',
  tooltipBg: '#0f172a',
};

/** Preset themes — use via `createApp('#el', { uiTheme: UI_PRESETS.violet })` */
export const UI_PRESETS: Record<string, UiThemeTokens> = {
  default: { mode: 'light' },
  dark: {
    ...DARK_BASE,
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryActive: '#1d4ed8',
  },
  violet: {
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryActive: '#5b21b6',
    primarySubtle: '#ede9fe',
  },
  emerald: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryActive: '#065f46',
    primarySubtle: '#d1fae5',
  },
  slate: {
    primary: '#334155',
    primaryHover: '#1e293b',
    primaryActive: '#0f172a',
    primarySubtle: '#f1f5f9',
  },
  ocean: {
    primary: '#0284c7',
    primaryHover: '#0369a1',
    primaryActive: '#075985',
    primarySubtle: '#e0f2fe',
  },
  rose: {
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryActive: '#9f1239',
    primarySubtle: '#ffe4e6',
  },
  darkViolet: {
    ...DARK_BASE,
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryActive: '#6d28d9',
    primarySubtle: '#2e1065',
  },
};
