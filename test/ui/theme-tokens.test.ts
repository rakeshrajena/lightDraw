import { describe, it, expect } from 'vitest';
import {
  UI_PRESETS,
  UI_THEME_TOKEN_KEYS,
  UI_THEME_VAR_MAP,
  resolveUiTheme,
  applyUiTheme,
  expandPreset,
  isThemeImageValue,
  toThemeBackgroundCss,
  resolveThemeBackground,
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
    const resolved = resolveUiTheme({ preset: 'violet', primary: '#custom' });
    expect(resolved.primary).toBe('#custom');
    // Invalid color codes are kept as-is; hover stays from preset
    expect(resolved.primaryHover).toBe(UI_PRESETS.violet.primaryHover);
    expect(resolved.surface).toBe('#ffffff');
  });

  it('derives hover/active when primary is a valid CSS color', () => {
    const resolved = resolveUiTheme({ preset: 'violet', primary: 'pink' });
    expect(resolved.primary).toBe('pink');
    expect(resolved.primaryHover).toMatch(/^rgb\(/);
    expect(resolved.primaryActive).toMatch(/^rgb\(/);
    expect(resolved.primaryHover).not.toBe(UI_PRESETS.violet.primaryHover);
  });

  it('accepts CSS color names and hex as preset shortcuts', () => {
    expect(resolveUiTheme({ preset: 'pink' }).primary).toBe('pink');
    expect(resolveUiTheme({ preset: '#f472b6' }).primary).toBe('#f472b6');
    expect(resolveUiTheme({ preset: 'rgba(244, 114, 182, 1)' }).primary).toBe(
      'rgba(244, 114, 182, 1)'
    );
    expect(resolveUiTheme({ preset: 'pink' }).primaryHover).toMatch(/^rgb\(/);
    // Named packs still win
    expect(resolveUiTheme({ preset: 'rose' }).primary).toBe('#e11d48');
  });

  it('treats image paths with extensions as background presets', () => {
    expect(isThemeImageValue('./assets/bg.png')).toBe(true);
    expect(isThemeImageValue('../img/hero.jpg')).toBe(true);
    expect(isThemeImageValue('/var/www/bg.webp')).toBe(true);
    expect(isThemeImageValue('assets/wall.png')).toBe(true);
    expect(isThemeImageValue('photo.png')).toBe(true);
    expect(isThemeImageValue('C:\\images\\a.png')).toBe(true);
    expect(isThemeImageValue('https://cdn.example/a.jpg')).toBe(true);
    expect(isThemeImageValue('pink')).toBe(false);
    expect(isThemeImageValue('#f472b6')).toBe(false);
    // Paths without an image extension are not images
    expect(isThemeImageValue('/images/hero')).toBe(false);
    expect(isThemeImageValue('assets/wallpapers/night')).toBe(false);

    expect(expandPreset('./bg.png').kind).toBe('image');
    expect(expandPreset('/images/hero.jpg').background).toBe(
      toThemeBackgroundCss('/images/hero.jpg')
    );
    expect(resolveThemeBackground({ preset: './assets/bg.png' })).toBe(
      'url("./assets/bg.png")'
    );
    // Colors are not backgrounds
    expect(resolveUiTheme({ preset: './bg.png' }).primary).toBeUndefined();
    expect(resolveUiTheme({ preset: './bg.png' }).text).toBeTruthy();
    expect(resolveUiTheme({ preset: './bg.png' }).surface).toBeTruthy();
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
    expect(UI_PRESETS.dark.primary).toBe('#3b82f6');
    expect(UI_PRESETS.dark.surface).toBe('#1e293b');
  });
});
