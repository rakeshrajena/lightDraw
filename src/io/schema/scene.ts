/**
 * Scene JSON validation.
 */
import type { SceneJSON } from '../../types';
import type { ValidationIssue, ValidationResult, ValidateSceneOptions } from './types';
import {
  isKnownSceneType,
  listKnownSceneTypes,
  suggestClosest,
  editDistance,
  formatExpectedValues,
  formatInvalidValue,
} from '../sceneCatalog';
import { valueKind } from './colorHelpers';
import { issue, toErrorLines, validatePropEnums } from './issues';
import { validateThemePack } from './theme';

const TYPE_ID_RE = /^[a-zA-Z][a-zA-Z0-9]*$/;

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
