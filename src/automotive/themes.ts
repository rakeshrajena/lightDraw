export type ClusterTheme = 'classic' | 'sport' | 'digital';

export interface ThemePalette {
  background: string;
  dialStroke: string;
  needleSpeed: string;
  needleTach: string;
  text: string;
  textMuted: string;
  accent: string;
  warning: string;
  ok: string;
  lampOn: string;
  lampOff: string;
}

export const THEMES: Record<ClusterTheme, ThemePalette> = {
  classic: {
    background: '#0a0a0a',
    dialStroke: '#444444',
    needleSpeed: '#ef4444',
    needleTach: '#22c55e',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#2563eb',
    warning: '#ef4444',
    ok: '#22c55e',
    lampOn: '#fbbf24',
    lampOff: '#333333',
  },
  sport: {
    background: '#111827',
    dialStroke: '#1f2937',
    needleSpeed: '#f97316',
    needleTach: '#eab308',
    text: '#f9fafb',
    textMuted: '#6b7280',
    accent: '#dc2626',
    warning: '#dc2626',
    ok: '#84cc16',
    lampOn: '#fde047',
    lampOff: '#374151',
  },
  digital: {
    background: '#020617',
    dialStroke: '#0ea5e9',
    needleSpeed: '#38bdf8',
    needleTach: '#22d3ee',
    text: '#e0f2fe',
    textMuted: '#64748b',
    accent: '#0ea5e9',
    warning: '#f43f5e',
    ok: '#10b981',
    lampOn: '#22d3ee',
    lampOff: '#1e293b',
  },
};

export function getTheme(name: string): ThemePalette {
  return THEMES[name as ClusterTheme] ?? THEMES.classic;
}
