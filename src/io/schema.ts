import type { SceneJSON } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

const SHAPE_TYPES = new Set([
  'rect',
  'circle',
  'ellipse',
  'line',
  'arc',
  'polygon',
  'polyline',
  'path',
  'star',
  'roundedRect',
  'text',
  'image',
  'sprite',
  'group',
  'layer',
]);

/** Lightweight JSON scene schema validation (no external deps). */
export function validateSceneJSON(json: unknown): ValidationResult {
  const errors: string[] = [];

  function visit(node: unknown, path: string): void {
    if (!node || typeof node !== 'object') {
      errors.push(`${path}: expected object`);
      return;
    }
    const scene = node as SceneJSON;
    if (typeof scene.type !== 'string' || scene.type.length === 0) {
      errors.push(`${path}.type: required string`);
    }
    if (scene.props !== undefined && (typeof scene.props !== 'object' || scene.props === null)) {
      errors.push(`${path}.props: must be object when present`);
    }
    if (scene.children !== undefined) {
      if (!Array.isArray(scene.children)) {
        errors.push(`${path}.children: must be array when present`);
      } else {
        scene.children.forEach((child, i) => visit(child, `${path}.children[${i}]`));
      }
    }
  }

  visit(json, 'root');

  if (errors.length === 0 && json && typeof json === 'object') {
    const root = json as SceneJSON;
    if (!SHAPE_TYPES.has(root.type) && !root.type.match(/^[a-zA-Z][a-zA-Z0-9]*$/)) {
      errors.push('root.type: invalid identifier');
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Parse and validate JSON string. */
export function parseAndValidateSceneJSON(raw: string): {
  json: SceneJSON;
  validation: ValidationResult;
} {
  let json: SceneJSON;
  try {
    json = JSON.parse(raw) as SceneJSON;
  } catch (e) {
    return {
      json: { type: 'group' },
      validation: { valid: false, errors: [`parse: ${(e as Error).message}`] },
    };
  }
  return { json, validation: validateSceneJSON(json) };
}
