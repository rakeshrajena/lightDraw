/** Accessibility helpers — contrast, high-contrast palette. */

import { parseColor } from './index';

/** Relative luminance (WCAG 2.1). */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Contrast ratio between two CSS colors (1–21). */
export function contrastRatio(fg: string, bg: string): number {
  const a = parseColor(fg);
  const b = parseColor(bg);
  const l1 = luminance(a.r, a.g, a.b);
  const l2 = luminance(b.r, b.g, b.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA normal text: ratio ≥ 4.5. */
export function meetsWcagAA(fg: string, bg: string): boolean {
  return contrastRatio(fg, bg) >= 4.5;
}

const HC_PALETTE = {
  bg: '#000000',
  fg: '#ffffff',
  accent: '#ffff00',
  border: '#ffffff',
  muted: '#cccccc',
};

/** Map a color to high-contrast palette when enabled. */
export function toHighContrastColor(color: string | null | undefined, kind: 'fill' | 'stroke' | 'text' = 'fill'): string {
  if (!color || color === 'transparent') return kind === 'fill' ? HC_PALETTE.bg : HC_PALETTE.border;
  if (kind === 'stroke') return HC_PALETTE.border;
  if (kind === 'text') return HC_PALETTE.fg;
  return HC_PALETTE.accent;
}

export { HC_PALETTE };
