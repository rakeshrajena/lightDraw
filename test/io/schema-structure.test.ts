/**
 * IO schema + App hit-test integrity.
 */
import { describe, it, expect } from 'vitest';
import {
  validateSceneJSON,
  validateThemePack,
  parseAndValidateSceneJSON,
  formatValidationErrors,
  locateJsonError,
  formatJsonParseError,
} from '../../src/io/schema';
import { hitTestNode } from '../../src/app/hitTest';
import { createTestApp, createTestContainer } from '../helpers';

describe('IO schema structure', () => {
  it('validates a minimal scene and theme pack', () => {
    const ok = validateSceneJSON({ type: 'group', children: [] });
    expect(ok.valid).toBe(true);
    const theme = validateThemePack({ preset: 'dark' });
    expect(theme.valid).toBe(true);
  });

  it('formats parse errors with line/column', () => {
    const raw = '{\n  "type":\n}';
    const result = parseAndValidateSceneJSON(raw);
    expect(result.json).toBeNull();
    expect(result.validation.valid).toBe(false);
    expect(result.validation.errors[0]).toMatch(/line/i);
    const loc = locateJsonError(raw, new SyntaxError('Unexpected token'));
    expect(loc.line).toBeGreaterThanOrEqual(1);
    expect(formatJsonParseError(raw, new SyntaxError('bad')).length).toBeGreaterThan(0);
    expect(formatValidationErrors(result.validation).length).toBeGreaterThan(0);
  });
});

describe('App hitTest helpers', () => {
  it('hits a listening rect via tree walk', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas', width: 200, height: 200 });
    const rect = app.rect({ x: 10, y: 10, width: 40, height: 40, listening: true });
    app.add(rect);
    const hit = hitTestNode(app.stage, 30, 30);
    expect(hit).toBe(rect);
    expect(hitTestNode(app.stage, 190, 190)).toBeNull();
    app.destroy();
  });
});
