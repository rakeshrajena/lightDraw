/**
 * Validation issue helpers and known prop enum checks.
 */
import type { ValidationIssue } from './types';
import {
  UI_THEME_PRESETS,
  formatInvalidValue,
  formatExpectedValues,
  propEnumsForType,
} from '../sceneCatalog';
import { looksLikeColorOrImage, valueKind } from './colorHelpers';

export function issue(
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

export function toErrorLines(issues: ValidationIssue[]): string[] {
  return issues.map((i) => `${i.path}: ${i.message}`);
}

export function validatePropEnums(
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
