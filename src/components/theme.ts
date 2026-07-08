/** Built-in UI design tokens — aligned 1:1 with `lightdraw.css` CSS variables. */
export const UI = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  primaryActive: '#163eb8',
  primarySubtle: '#eff6ff',
  /** @deprecated Use `primarySubtle` — kept for canvas definitions compatibility */
  primaryMuted: '#eff6ff',
  secondary: '#475569',
  secondaryHover: '#334155',
  success: '#059669',
  successBg: '#ecfdf5',
  warning: '#d97706',
  danger: '#dc2626',

  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceInset: '#f1f5f9',
  overlay: 'rgba(15, 23, 42, 0.5)',

  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  borderFocus: '#2563eb',

  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#64748b',
  textInverse: '#ffffff',
  textPlaceholder: '#94a3b8',

  radius: 8,
  radiusSm: 6,
  radiusLg: 12,
  radiusFull: 999,

  font: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontSize: 14,
  fontSizeSm: 12,
  fontSizeLg: 16,

  controlHeight: 40,
  inputHeight: 40,

  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 16,
  spaceLg: 24,
  spaceXl: 32,

  shadowSm: { color: 'rgba(15, 23, 42, 0.05)', blur: 2, offsetX: 0, offsetY: 1 },
  shadowMd: { color: 'rgba(15, 23, 42, 0.08)', blur: 8, offsetX: 0, offsetY: 2 },
  shadowLg: { color: 'rgba(15, 23, 42, 0.12)', blur: 20, offsetX: 0, offsetY: 8 },
  shadowPrimary: { color: 'rgba(37, 99, 235, 0.28)', blur: 8, offsetX: 0, offsetY: 2 },
} as const;
