/**
 * Scene / theme validation shared types.
 */
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
