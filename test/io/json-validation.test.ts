/**
 * Scene JSON validation — located parse errors + path-aware schema messages.
 */
import { describe, it, expect } from 'vitest';
import {
  validateSceneJSON,
  parseAndValidateSceneJSON,
  formatJsonParseError,
  locateJsonError,
  formatValidationErrors,
  validateThemePack,
} from '../../src/io/schema';

describe('JSON validation messages', () => {
  it('locateJsonError reports line and column from position', () => {
    const source = '{\n  "type": "group",\n  "children": [\n';
    const err = new SyntaxError('Unexpected end of JSON input');
    // Force offset near end
    const loc = locateJsonError(source, err);
    expect(loc.line).toBeGreaterThanOrEqual(1);
    expect(loc.column).toBeGreaterThanOrEqual(1);
    expect(loc.snippet).toContain('|');
    expect(loc.snippet).toContain('^');
  });

  it('formatJsonParseError includes line, column, reason, and caret', () => {
    const source = '{\n  "a": 1,\n  "b":\n}';
    let caught: unknown;
    try {
      JSON.parse(source);
    } catch (e) {
      caught = e;
    }
    const msg = formatJsonParseError(source, caught);
    expect(msg).toMatch(/JSON parse error at line \d+, column \d+/);
    expect(msg).toContain('^');
    expect(msg.split('\n').length).toBeGreaterThanOrEqual(3);
  });

  it('parseAndValidateSceneJSON surfaces parse location instead of raw engine text only', () => {
    const raw = '{\n  "type": "group",\n  oops\n}';
    const { json, validation } = parseAndValidateSceneJSON(raw);
    expect(json).toBeNull();
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toMatch(/line \d+, column \d+/);
    expect(validation.errors[0]).toContain('^');
  });

  it('validateSceneJSON reports path for nested bad props', () => {
    const result = validateSceneJSON({
      type: 'group',
      children: [
        { type: 'rect', props: { width: 10 } },
        { type: 'button', props: null },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('root.children[1].props'))).toBe(true);
    expect(result.errors.some((e) => /got null/.test(e))).toBe(true);
    expect(result.issues[0].path).toContain('children[1]');
  });

  it('validateSceneJSON reports missing type with guidance', () => {
    const result = validateSceneJSON({ props: { x: 1 } });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/root\.type/);
    expect(result.errors[0]).toMatch(/required/);
  });

  it('validateSceneJSON rejects invalid type identifiers with path', () => {
    const result = validateSceneJSON({ type: '!!!' });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/root\.type/);
    expect(result.errors[0]).toMatch(/invalid identifier/);
  });

  it('formatValidationErrors lists multiple issues', () => {
    const result = validateSceneJSON({
      type: 'group',
      props: null,
      children: 'nope',
    });
    const text = formatValidationErrors(result);
    expect(text).toMatch(/2 validation errors/);
    expect(text).toContain('root.props');
    expect(text).toContain('root.children');
  });

  it('empty string is a clear validation error', () => {
    const { validation } = parseAndValidateSceneJSON('   ');
    expect(validation.valid).toBe(false);
    expect(validation.errors[0]).toMatch(/empty JSON/i);
  });

  it('accepts valid widget scene', () => {
    const result = validateSceneJSON({
      type: 'group',
      children: [{ type: 'button', props: { label: 'Go', width: 80 } }],
    });
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('suggests possible values for invalid button variant', () => {
    const result = validateSceneJSON({
      type: 'button',
      props: { label: 'Go', variant: 'primry' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/props\.variant/);
    expect(result.errors[0]).toMatch(/expected one of/);
    expect(result.errors[0]).toMatch(/primary/);
    expect(result.issues[0].expected).toContain('primary');
  });

  it('suggests closest type for typos', () => {
    const result = validateSceneJSON({ type: 'buton', props: {} });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/did you mean/);
    expect(result.errors[0]).toMatch(/button/);
  });

  it('validateThemePack suggests presets', () => {
    const result = validateThemePack({ preset: 'drak', automotive: 'spor' });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /preset/.test(e) && /dark/.test(e))).toBe(true);
    expect(result.errors.some((e) => /automotive/.test(e) && /sport/.test(e))).toBe(true);
  });

  it('accepts CSS color as theme preset', () => {
    const result = validateThemePack({ preset: '#0ea5e9' });
    expect(result.valid).toBe(true);
  });

  it('validates automotive theme enum on instrumentCluster', () => {
    const result = validateSceneJSON({
      type: 'instrumentCluster',
      props: { theme: 'neon' },
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/classic/);
  });
});
