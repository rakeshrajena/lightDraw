/**
 * Theme pack validation.
 */
import type { ValidationIssue, ValidationResult, ValidateThemeOptions } from './types';
import {
  AUTOMOTIVE_THEME_PRESETS,
  UI_THEME_PRESETS,
  formatInvalidValue,
  formatExpectedValues,
} from '../sceneCatalog';
import { valueKind, looksLikeColorOrImage } from './colorHelpers';
import { issue, toErrorLines } from './issues';

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
