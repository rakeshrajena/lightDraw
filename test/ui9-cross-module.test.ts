import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '..');

const PLAYGROUND_DEMOS = [
  'demo.html',
  'demo-animation.html',
  'demo-ui.html',
  'demo-dashboard.html',
  'demo-automotive.html',
  'demo-diagram.html',
  'demo-export.html',
  'demo-a11y.html',
] as const;

const ASIDE_DEMOS = ['demo-animation.html', 'demo-export.html', 'demo-a11y.html', 'demo.html'] as const;

describe('Phase UI-9 — Cross-module demo polish', () => {
  it('demo-common.css exists with reduced-motion and embed rules', () => {
    const css = readFileSync(resolve(ROOT, 'examples/demo-common.css'), 'utf8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('html.demo-embed');
    expect(css).toContain('.demo-layout-aside');
    expect(css).toContain('--demo-canvas-bg');
    expect(css).toContain('prefers-color-scheme: dark');
  });

  it('playground styles use responsive iframe heights', () => {
    const css = readFileSync(resolve(ROOT, 'website/public/styles.css'), 'utf8');
    expect(css).toContain('.demo-frame--medium');
    expect(css).toContain('clamp(');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });

  for (const file of PLAYGROUND_DEMOS) {
    it(`${file} uses shared demo shell`, () => {
      const path = resolve(ROOT, 'examples', file);
      expect(existsSync(path)).toBe(true);
      const html = readFileSync(path, 'utf8');
      expect(html).toContain('demo-common.css');
      expect(html).toContain('demo-embed.js');
      expect(html).toContain('demo-shell');
    });
  }

  for (const file of ASIDE_DEMOS) {
    it(`${file} uses aside layout panel`, () => {
      const html = readFileSync(resolve(ROOT, 'examples', file), 'utf8');
      expect(html).toContain('demo-layout-aside');
      expect(html).toContain('demo-aside-panel');
    });
  }

  it('website playground embeds all demo iframes', () => {
    const html = readFileSync(resolve(ROOT, 'website/index.html'), 'utf8');
    for (const file of PLAYGROUND_DEMOS.filter((f) => f !== 'demo.html')) {
      expect(html).toContain(`/examples/${file}?embed=1`);
    }
  });

  it('lightdraw.min.css disables motion when prefers-reduced-motion', () => {
    const css = readFileSync(resolve(ROOT, 'dist/lightdraw.min.css'), 'utf8');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
