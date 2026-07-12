/** CSS color parsing — hex, rgb(a), hsl(a), transparent, and common named colors. */

export type RgbaColor = { r: number; g: number; b: number; a: number };

const NAMED: Record<string, string> = {
  transparent: 'rgba(0,0,0,0)',
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  aqua: '#00ffff',
  magenta: '#ff00ff',
  fuchsia: '#ff00ff',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  gray: '#808080',
  grey: '#808080',
  silver: '#c0c0c0',
  maroon: '#800000',
  navy: '#000080',
  olive: '#808000',
  teal: '#008080',
  lime: '#00ff00',
  indigo: '#4b0082',
  violet: '#ee82ee',
  coral: '#ff7f50',
  gold: '#ffd700',
  tomato: '#ff6347',
  crimson: '#dc143c',
  slategray: '#708090',
  slategrey: '#708090',
  darkslategray: '#2f4f4f',
  darkslategrey: '#2f4f4f',
  steelblue: '#4682b4',
  royalblue: '#4169e1',
  dodgerblue: '#1e90ff',
  deepskyblue: '#00bfff',
  skyblue: '#87ceeb',
  lightblue: '#add8e6',
  lightskyblue: '#87cefa',
  mediumblue: '#0000cd',
  darkblue: '#00008b',
  midnightblue: '#191970',
  forestgreen: '#228b22',
  seagreen: '#2e8b57',
  mediumseagreen: '#3cb371',
  lightgreen: '#90ee90',
  darkgreen: '#006400',
  springgreen: '#00ff7f',
  chartreuse: '#7fff00',
  darkorange: '#ff8c00',
  orangered: '#ff4500',
  hotpink: '#ff69b4',
  deeppink: '#ff1493',
  lightpink: '#ffb6c1',
  brown: '#a52a2a',
  chocolate: '#d2691e',
  sienna: '#a0522d',
  peru: '#cd853f',
  wheat: '#f5deb3',
  tan: '#d2b48c',
  beige: '#f5f5dc',
  ivory: '#fffff0',
  snow: '#fffafa',
  ghostwhite: '#f8f8ff',
  whitesmoke: '#f5f5f5',
  gainsboro: '#dcdcdc',
  lightgray: '#d3d3d3',
  lightgrey: '#d3d3d3',
  darkgray: '#a9a9a9',
  darkgrey: '#a9a9a9',
  dimgray: '#696969',
  dimgrey: '#696969',
};

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function clamp255(n: number): number {
  return n < 0 ? 0 : n > 255 ? 255 : n;
}

function parseHexByte(pair: string): number {
  return parseInt(pair, 16);
}

function parseHexColor(hex: string): RgbaColor | null {
  const raw = hex.slice(1);
  if (![3, 4, 6, 8].includes(raw.length)) return null;
  if (![...raw].every((c) => /[0-9a-f]/i.test(c))) return null;

  const expand = (s: string) => s.split('').map((c) => c + c).join('');
  const full = raw.length <= 4 ? expand(raw) : raw;
  const r = parseHexByte(full.slice(0, 2));
  const g = parseHexByte(full.slice(2, 4));
  const b = parseHexByte(full.slice(4, 6));
  const a = full.length === 8 ? parseHexByte(full.slice(6, 8)) / 255 : 1;
  if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
  return { r, g, b, a };
}

function parseChannel(raw: string, kind: 'rgb' | 'hsl'): number | null {
  const s = raw.trim();
  if (!s || s === 'none') return null;
  if (s.endsWith('%')) {
    const pct = parseFloat(s.slice(0, -1));
    if (Number.isNaN(pct)) return null;
    return kind === 'rgb' ? (pct / 100) * 255 : pct / 100;
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

function parseAlpha(raw: string | undefined, fallback = 1): number {
  if (raw == null || raw === '') return fallback;
  const s = raw.trim();
  if (s.endsWith('%')) {
    const pct = parseFloat(s.slice(0, -1));
    return Number.isNaN(pct) ? fallback : clamp01(pct / 100);
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? fallback : clamp01(n);
}

/** Split `rgb(...)` / `hsl(...)` args — comma or space separated, optional `/ alpha`. */
function splitCssArgs(inner: string): string[] {
  const slash = inner.split('/');
  const main = slash[0].trim();
  const alpha = slash[1]?.trim();
  const parts = main.includes(',')
    ? main.split(',').map((p) => p.trim()).filter(Boolean)
    : main.split(/\s+/).filter(Boolean);
  if (alpha) parts.push(alpha);
  return parts;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp01(s);
  const light = clamp01(l);
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hue < 60) [rp, gp, bp] = [c, x, 0];
  else if (hue < 120) [rp, gp, bp] = [x, c, 0];
  else if (hue < 180) [rp, gp, bp] = [0, c, x];
  else if (hue < 240) [rp, gp, bp] = [0, x, c];
  else if (hue < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return [
    Math.round(clamp255((rp + m) * 255)),
    Math.round(clamp255((gp + m) * 255)),
    Math.round(clamp255((bp + m) * 255)),
  ];
}

function parseFunctional(color: string): RgbaColor | null {
  const rgbMatch = color.match(/^rgba?\(\s*([\s\S]+)\)$/i);
  if (rgbMatch) {
    const parts = splitCssArgs(rgbMatch[1]);
    if (parts.length < 3) return null;
    const r = parseChannel(parts[0], 'rgb');
    const g = parseChannel(parts[1], 'rgb');
    const b = parseChannel(parts[2], 'rgb');
    if (r == null || g == null || b == null) return null;
    return {
      r: clamp255(r),
      g: clamp255(g),
      b: clamp255(b),
      a: parseAlpha(parts[3]),
    };
  }

  const hslMatch = color.match(/^hsla?\(\s*([\s\S]+)\)$/i);
  if (hslMatch) {
    const parts = splitCssArgs(hslMatch[1]);
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]);
    const s = parseChannel(parts[1], 'hsl');
    const l = parseChannel(parts[2], 'hsl');
    if (Number.isNaN(h) || s == null || l == null) return null;
    const [r, g, b] = hslToRgb(h, s, l);
    return { r, g, b, a: parseAlpha(parts[3]) };
  }

  return null;
}

/**
 * Parse a CSS color string into RGBA components.
 * Returns `null` when the format is not recognized.
 */
export function tryParseColor(color: string): RgbaColor | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (lower === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };

  if (trimmed.startsWith('#')) return parseHexColor(trimmed);

  const functional = parseFunctional(trimmed);
  if (functional) return functional;

  const named = NAMED[lower.replace(/\s+/g, '')];
  if (named) return tryParseColor(named);

  return null;
}

/** Parse color; unknown values fall back to opaque black (legacy behavior). */
export function parseColor(color: string): RgbaColor {
  return tryParseColor(color) ?? { r: 0, g: 0, b: 0, a: 1 };
}

/** Re-encode with a new alpha. Returns `null` if `color` cannot be parsed. */
export function colorWithAlpha(color: string, alpha: number): string | null {
  const c = tryParseColor(color);
  if (!c) return null;
  const a = clamp01(alpha);
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${a})`;
}

/** Linear RGB mix; falls back to `to` if either side cannot be parsed. */
export function mixColors(from: string, to: string, t: number): string {
  const a = tryParseColor(from);
  const b = tryParseColor(to);
  if (!a || !b) return to;
  const u = clamp01(t);
  const r = Math.round(a.r + (b.r - a.r) * u);
  const g = Math.round(a.g + (b.g - a.g) * u);
  const bl = Math.round(a.b + (b.b - a.b) * u);
  const alpha = a.a + (b.a - a.a) * u;
  return alpha < 1 ? `rgba(${r},${g},${bl},${alpha})` : `rgb(${r},${g},${bl})`;
}

export function interpolateColor(from: string, to: string, t: number): string {
  return mixColors(from, to, t);
}

/** True when the string looks like a concrete CSS color (not a semantic token). */
export function isCssColorString(color: string): boolean {
  if (!color) return false;
  const t = color.trim().toLowerCase();
  if (t.startsWith('#') || t.startsWith('rgb') || t.startsWith('hsl')) return true;
  if (t === 'transparent') return true;
  return t.replace(/\s+/g, '') in NAMED;
}
