/**
 * Parse + validate scene JSON in one step.
 */
import type { SceneJSON } from '../../types';
import type { ValidationResult, ValidateSceneOptions } from './types';
import { issue, toErrorLines } from './issues';
import { formatJsonParseError, locateJsonError } from './jsonLocate';
import { validateSceneJSON } from './scene';

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
