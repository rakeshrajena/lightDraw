import { describe, it, expect } from 'vitest';
import {
  UI_PRESETS,
  UI_THEME_TOKEN_KEYS,
  UI_THEME_VAR_MAP,
  resolveUiTheme,
  applyUiTheme,
} from '../../src/components/uiTheme';

describe('UI theme tokens', () => {
  it('maps every token key to a CSS variable', () => {
    for (const key of UI_THEME_TOKEN_KEYS) {
      expect(UI_THEME_VAR_MAP[key]).toMatch(/^--ld-/);
    }
    expect(UI_THEME_TOKEN_KEYS.length).toBeGreaterThanOrEqual(40);
  });

  it('resolves all built-in presets without error', () => {
    for (const name of Object.keys(UI_PRESETS)) {
      const resolved = resolveUiTheme({ preset: name });
      expect(resolved).toBeTypeOf('object');
      expect('preset' in resolved).toBe(false);
    }
  });

  it('merges preset then explicit overrides', () => {
    const resolved = resolveUiTheme({ preset: 'violet', primary: '#custom', mode: 'dark' });
    expect(resolved.primary).toBe('#custom');
    expect(resolved.mode).toBe('dark');
    expect(resolved.primaryHover).toBe(UI_PRESETS.violet.primaryHover);
  });

  it('ignores unknown preset names', () => {
    const resolved = resolveUiTheme({ preset: 'nonexistent', primary: '#111' });
    expect(resolved.primary).toBe('#111');
  });

  it('applies spacing and breakpoint tokens to DOM', () => {
    const el = document.createElement('div');
    applyUiTheme(el, {
      spaceMd: '20px',
      bpMd: '800px',
      primary: '#2563eb',
    });
    expect(el.style.getPropertyValue('--ld-space-md')).toBe('20px');
    expect(el.style.getPropertyValue('--ld-bp-md')).toBe('800px');
    expect(el.style.getPropertyValue('--ld-primary')).toBe('#2563eb');
  });

  it('documents core presets with primary colors', () => {
    expect(UI_PRESETS.violet.primary).toBe('#7c3aed');
    expect(UI_PRESETS.emerald.primary).toBe('#059669');
    expect(UI_PRESETS.slate.primary).toBe('#334155');
    expect(UI_PRESETS.ocean.primary).toBe('#0284c7');
    expect(UI_PRESETS.rose.primary).toBe('#e11d48');
    expect(UI_PRESETS.dark.mode).toBe('dark');
  });
});
