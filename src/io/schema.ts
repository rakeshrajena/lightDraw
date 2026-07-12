import type { SceneJSON } from '../types';
import {
  AUTOMOTIVE_THEME_PRESETS,
  UI_THEME_PRESETS,
  formatInvalidValue,
  formatExpectedValues,
  isKnownSceneType,
  listKnownSceneTypes,
  propEnumsForType,
  suggestClosest,
  editDistance,
} from './sceneCatalog';

export interface ValidationIssue {
  /** JSON path, e.g. `root.children[2].props` */
  path: string;
  /** What went wrong */
  message: string;
  /** Optional machine-readable code */
  code?: string;
  /** Allowed values when the error is an enum / catalog mismatch */
  expected?: string[];
}

export interface ValidationResult {
  valid: boolean;
  /** Human-readable lines: `path: message` (and parse errors with line/col) */
  errors: string[];
  /** Structured issues (same content as `errors`, easier for UIs) */
  issues: ValidationIssue[];
}

export interface JsonErrorLocation {
  /** 0-based offset into the source string (best-effort) */
  offset: number;
  /** 1-based line */
  line: number;
  /** 1-based column */
  column: number;
  /** Source line text */
  lineText: string;
  /** Multi-line snippet with a caret under the error column */
  snippet: string;
}

export interface ValidateSceneOptions {
  /**
   * Reject types not in the built-in catalog.
   * Default `false` — unknown identifiers are allowed (custom widgets),
   * but near-miss typos still error with suggestions.
   */
  strictTypes?: boolean;
  /** Extra allowed type names (custom / plugin widgets). */
  extraTypes?: string[];
  /** Validate known prop enums (variant, size, theme, …). Default `true`. */
  strictProps?: boolean;
  /** Validate `theme` pack on the scene root when present. Default `true`. */
  validateTheme?: boolean;
}

export interface ValidateThemeOptions {
  /** Reject unknown preset names that aren't CSS colors / image paths. Default `true`. */
  strictPreset?: boolean;
}

const TYPE_ID_RE = /^[a-zA-Z][a-zA-Z0-9]*$/;
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

function valueKind(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function looksLikeColorOrImage(value: string): boolean {
  const s = value.trim();
  if (!s) return false;
  if (IMAGE_PRESET_RE.test(s) || s.startsWith('data:image') || s.startsWith('./') || s.startsWith('/')) {
    return true;
  }
  if (CSS_COLOR_RE.test(s)) return true;
  return CSS_NAMED_COLORS.has(s.toLowerCase());
}

/** Extract a character offset from a JSON.parse SyntaxError message. */
export function extractJsonErrorOffset(message: string, sourceLength: number): number | null {
  const patterns = [/at position\s+(\d+)/i, /at offset\s+(\d+)/i, /column\s+(\d+)/i];
  for (const re of patterns) {
    const m = message.match(re);
    if (!m) continue;
    if (re.source.includes('column') && !/position|offset/i.test(message)) continue;
    const n = Number(m[1]);
    if (Number.isFinite(n) && n >= 0) return Math.min(n, Math.max(0, sourceLength));
  }
  return null;
}

function offsetFromLineColumn(source: string, line: number, column: number): number {
  const lines = source.split(/\r?\n/);
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    if (i + 1 === line) {
      return offset + Math.max(0, Math.min(column - 1, lines[i].length));
    }
    offset += lines[i].length + 1;
  }
  return Math.max(0, source.length - 1);
}

/** Map a parse error + source string to line/column and a caret snippet. */
export function locateJsonError(source: string, err: unknown): JsonErrorLocation {
  const message = err instanceof Error ? err.message : String(err);
  const lines = source.split(/\r?\n/);

  let offset = extractJsonErrorOffset(message, source.length);
  const lc = message.match(/\(line\s+(\d+)\s+column\s+(\d+)\)/i);
  if (offset == null && lc) {
    offset = offsetFromLineColumn(source, Number(lc[1]), Number(lc[2]));
  }
  if (offset == null) {
    offset = Math.max(0, source.length - 1);
  }

  let line = 1;
  let column = 1;
  let acc = 0;
  for (let i = 0; i < lines.length; i++) {
    const len = lines[i].length;
    const lineEnd = acc + len;
    if (offset <= lineEnd || i === lines.length - 1) {
      line = i + 1;
      column = Math.max(1, offset - acc + 1);
      break;
    }
    acc = lineEnd + 1;
  }

  const lineText = lines[line - 1] ?? '';
  const caretPad = Math.max(0, column - 1);
  const marker = `${' '.repeat(caretPad)}^`;
  const snippet = [`  ${line} | ${lineText}`, `  ${' '.repeat(String(line).length)} | ${marker}`].join('\n');

  return { offset, line, column, lineText, snippet };
}

/** Format a JSON.parse failure with line, column, reason, and a caret snippet. */
export function formatJsonParseError(source: string, err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const loc = locateJsonError(source, err);
  const reason = message
    .replace(/\s*in JSON at position \d+/i, '')
    .replace(/\s*\(line \d+ column \d+\)/i, '')
    .trim();
  return `JSON parse error at line ${loc.line}, column ${loc.column}: ${reason}\n` + loc.snippet;
}

function issue(
  path: string,
  message: string,
  code?: string,
  expected?: string[]
): ValidationIssue {
  const out: ValidationIssue = { path, message };
  if (code) out.code = code;
  if (expected && expected.length) out.expected = expected;
  return out;
}

function toErrorLines(issues: ValidationIssue[]): string[] {
  return issues.map((i) => `${i.path}: ${i.message}`);
}

function validatePropEnums(
  type: string,
  props: Record<string, unknown>,
  path: string,
  issues: ValidationIssue[]
): void {
  const enums = propEnumsForType(type);
  for (const [key, allowed] of Object.entries(enums)) {
    if (!(key in props)) continue;
    const got = props[key];
    if (got === undefined || got === null) continue;
    if (typeof got !== 'string') {
      issues.push(
        issue(
          `${path}.props.${key}`,
          `must be a string (${formatExpectedValues(allowed)}), got ${valueKind(got)}`,
          'prop_type',
          [...allowed]
        )
      );
      continue;
    }
    if (!allowed.includes(got)) {
      issues.push(
        issue(
          `${path}.props.${key}`,
          formatInvalidValue(got, allowed),
          'prop_enum',
          [...allowed]
        )
      );
    }
  }

  if (typeof props.uiTheme === 'string' && props.uiTheme && !looksLikeColorOrImage(props.uiTheme)) {
    if (!(UI_THEME_PRESETS as readonly string[]).includes(props.uiTheme)) {
      issues.push(
        issue(
          `${path}.props.uiTheme`,
          formatInvalidValue(props.uiTheme, UI_THEME_PRESETS) +
            ' — or a CSS color / image path / token object',
          'uiTheme_preset',
          [...UI_THEME_PRESETS]
        )
      );
    }
  }
}

/**
 * Validate a theme pack object (`preset`, brand tokens, series, …).
 * Suggests known UI presets and automotive themes when values are wrong.
 */
export function validateThemePack(
  pack: unknown,
  options: ValidateThemeOptions = {}
): ValidationResult {
  const strictPreset = options.strictPreset !== false;
  const issues: ValidationIssue[] = [];

  if (pack === null || typeof pack !== 'object' || Array.isArray(pack)) {
    issues.push(
      issue('theme', `expected a theme pack object, got ${valueKind(pack)}`, 'theme_type')
    );
    return { valid: false, errors: toErrorLines(issues), issues };
  }

  const obj = pack as Record<string, unknown>;

  if (obj.preset !== undefined && obj.preset !== null) {
    if (typeof obj.preset !== 'string') {
      issues.push(
        issue(
          'theme.preset',
          `must be a string (${formatExpectedValues(UI_THEME_PRESETS)}), got ${valueKind(obj.preset)}`,
          'preset_type',
          [...UI_THEME_PRESETS]
        )
      );
    } else if (
      strictPreset &&
      !(UI_THEME_PRESETS as readonly string[]).includes(obj.preset) &&
      !looksLikeColorOrImage(obj.preset)
    ) {
      issues.push(
        issue(
          'theme.preset',
          formatInvalidValue(obj.preset, UI_THEME_PRESETS) + ' — or a CSS color / image path',
          'preset_enum',
          [...UI_THEME_PRESETS]
        )
      );
    }
  }

  if (obj.automotive !== undefined && obj.automotive !== null) {
    if (typeof obj.automotive !== 'string') {
      issues.push(
        issue(
          'theme.automotive',
          `must be a string (${formatExpectedValues(AUTOMOTIVE_THEME_PRESETS)}), got ${valueKind(obj.automotive)}`,
          'automotive_type',
          [...AUTOMOTIVE_THEME_PRESETS]
        )
      );
    } else if (!(AUTOMOTIVE_THEME_PRESETS as readonly string[]).includes(obj.automotive)) {
      issues.push(
        issue(
          'theme.automotive',
          formatInvalidValue(obj.automotive, AUTOMOTIVE_THEME_PRESETS),
          'automotive_enum',
          [...AUTOMOTIVE_THEME_PRESETS]
        )
      );
    }
  }

  if (obj.series !== undefined && obj.series !== null && !Array.isArray(obj.series)) {
    issues.push(
      issue(
        'theme.series',
        `must be an array of color strings when present, got ${valueKind(obj.series)}`,
        'series_type'
      )
    );
  }

  for (const key of ['dashboard', 'diagram'] as const) {
    if (obj[key] !== undefined && obj[key] !== null) {
      if (typeof obj[key] !== 'object' || Array.isArray(obj[key])) {
        issues.push(
          issue(
            `theme.${key}`,
            `must be an object when present, got ${valueKind(obj[key])}`,
            `${key}_type`
          )
        );
      }
    }
  }

  return { valid: issues.length === 0, errors: toErrorLines(issues), issues };
}

/** Lightweight JSON scene schema validation (no external deps). */
export function validateSceneJSON(
  json: unknown,
  options: ValidateSceneOptions = {}
): ValidationResult {
  const strictTypes = Boolean(options.strictTypes);
  const strictProps = options.strictProps !== false;
  const checkTheme = options.validateTheme !== false;
  const extra = new Set(options.extraTypes ?? []);
  const issues: ValidationIssue[] = [];
  const knownList = listKnownSceneTypes();

  function typeAllowed(type: string): boolean {
    return isKnownSceneType(type) || extra.has(type);
  }

  function visit(node: unknown, path: string): void {
    if (node === null || typeof node !== 'object' || Array.isArray(node)) {
      issues.push(
        issue(path, `expected a scene node object, got ${valueKind(node)}`, 'expected_object')
      );
      return;
    }
    const scene = node as SceneJSON & { theme?: unknown };

    if (scene.type === undefined || scene.type === null) {
      issues.push(
        issue(
          `${path}.type`,
          `required — each node needs a type string (${formatExpectedValues(
            ['group', 'rect', 'button', 'lineChart', 'instrumentCluster'],
            5
          )} …)`,
          'type_required',
          ['group', 'button', 'rect', 'lineChart']
        )
      );
    } else if (typeof scene.type !== 'string') {
      issues.push(
        issue(`${path}.type`, `must be a string, got ${valueKind(scene.type)}`, 'type_type')
      );
    } else if (scene.type.length === 0) {
      issues.push(issue(`${path}.type`, 'must be a non-empty string', 'type_empty'));
    } else if (!TYPE_ID_RE.test(scene.type)) {
      issues.push(
        issue(
          `${path}.type`,
          `invalid identifier "${scene.type}" — use letters/digits (e.g. "lineChart")`,
          'type_invalid'
        )
      );
    } else if (!typeAllowed(scene.type)) {
      const suggestions = suggestClosest(scene.type, knownList, 5);
      const nearTypo =
        suggestions.length > 0 &&
        editDistance(scene.type.toLowerCase(), suggestions[0].toLowerCase()) <= 2;
      if (strictTypes || nearTypo) {
        issues.push(
          issue(
            `${path}.type`,
            formatInvalidValue(scene.type, suggestions.length ? suggestions : knownList.slice(0, 12), {
              maxShow: suggestions.length ? 5 : 8,
            }),
            'type_unknown',
            suggestions.length ? suggestions : knownList.slice(0, 20)
          )
        );
      }
    }

    if (scene.props !== undefined) {
      if (scene.props === null || typeof scene.props !== 'object' || Array.isArray(scene.props)) {
        issues.push(
          issue(
            `${path}.props`,
            `must be an object when present, got ${valueKind(scene.props)}`,
            'props_type'
          )
        );
      } else if (strictProps && typeof scene.type === 'string') {
        validatePropEnums(scene.type, scene.props as Record<string, unknown>, path, issues);
      }
    }

    if (scene.children !== undefined) {
      if (!Array.isArray(scene.children)) {
        issues.push(
          issue(
            `${path}.children`,
            `must be an array when present, got ${valueKind(scene.children)}`,
            'children_type'
          )
        );
      } else {
        scene.children.forEach((child, i) => visit(child, `${path}.children[${i}]`));
      }
    }

    if (path === 'root' && checkTheme && scene.theme !== undefined) {
      const themeResult = validateThemePack(scene.theme);
      for (const th of themeResult.issues) {
        issues.push({
          ...th,
          path: th.path.startsWith('theme') ? `root.${th.path}` : `root.theme.${th.path}`,
        });
      }
    }
  }

  if (json === undefined) {
    issues.push(issue('root', 'missing scene JSON (got undefined)', 'missing'));
  } else {
    visit(json, 'root');
  }

  return {
    valid: issues.length === 0,
    errors: toErrorLines(issues),
    issues,
  };
}

/** Join validation errors into one UI-friendly string. */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) return '';
  if (result.errors.length === 1) return result.errors[0];
  return (
    `${result.errors.length} validation errors:\n` +
    result.errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')
  );
}

/**
 * Parse a JSON string and validate it as Scene JSON.
 * Parse failures include line/column + caret; schema failures include paths + expected values.
 */
export function parseAndValidateSceneJSON(
  raw: string,
  options?: ValidateSceneOptions
): {
  json: SceneJSON | null;
  validation: ValidationResult;
} {
  const source = typeof raw === 'string' ? raw : String(raw);
  if (!source.trim()) {
    const issues = [issue('root', 'empty JSON — paste a scene object', 'empty')];
    return {
      json: null,
      validation: { valid: false, errors: toErrorLines(issues), issues },
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(source);
  } catch (e) {
    const formatted = formatJsonParseError(source, e);
    const loc = locateJsonError(source, e);
    const issues = [
      issue(
        `line ${loc.line}, column ${loc.column}`,
        formatted.replace(/^JSON parse error at line \d+, column \d+:\s*/, '').split('\n')[0],
        'parse'
      ),
    ];
    return {
      json: null,
      validation: {
        valid: false,
        errors: [formatted],
        issues,
      },
    };
  }

  const validation = validateSceneJSON(json, { strictTypes: false, ...options });
  return {
    json: json as SceneJSON,
    validation,
  };
}

export {
  listKnownSceneTypes,
  formatExpectedValues,
  formatInvalidValue,
  suggestClosest,
  UI_THEME_PRESETS,
  AUTOMOTIVE_THEME_PRESETS,
  registerKnownSceneTypes,
} from './sceneCatalog';
