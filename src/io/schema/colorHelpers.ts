/**
 * Color / image preset recognition for theme validation.
 */
const CSS_COLOR_RE = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgba?|hsla?)\([^)]+\))$/i;
const IMAGE_PRESET_RE = /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i;
/** Common CSS named colors we accept as theme presets (not arbitrary words). */
const CSS_NAMED_COLORS = new Set([
  'transparent',
  'black',
  'white',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
  'gray',
  'grey',
  'cyan',
  'magenta',
  'navy',
  'teal',
  'lime',
  'olive',
  'maroon',
  'silver',
  'gold',
  'indigo',
  'violet',
  'coral',
  'salmon',
  'tomato',
  'crimson',
  'khaki',
  'ivory',
  'azure',
  'beige',
  'brown',
  'chocolate',
  'snow',
]);

export function valueKind(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function looksLikeColorOrImage(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (IMAGE_PRESET_RE.test(s) || s.startsWith('data:image') || s.startsWith('./') || s.startsWith('/')) {
    return true;
  }
  if (CSS_COLOR_RE.test(s)) return true;
  return CSS_NAMED_COLORS.has(s.toLowerCase());
}
