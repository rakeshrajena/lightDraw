import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { createTestApp, createTestContainer } from './helpers';

const ROOT = resolve(__dirname, '..');

const UI10_GUIDES = [
  'docs/ui-theme-guide.md',
  'docs/responsive-guide.md',
  'docs/legacy-browser-guide.md',
] as const;

describe('Phase UI-10 — Documentation & release', () => {
  for (const file of UI10_GUIDES) {
    it(`${file} exists with key sections`, () => {
      const path = resolve(ROOT, file);
      expect(existsSync(path)).toBe(true);
      const md = readFileSync(path, 'utf8');
      expect(md.length).toBeGreaterThan(500);
      expect(md).toMatch(/^# /m);
    });
  }

  it('responsive guide documents breakpoints and autoResize', () => {
    const md = readFileSync(resolve(ROOT, 'docs/responsive-guide.md'), 'utf8');
    expect(md).toContain('--ld-bp-sm');
    expect(md).toContain('autoResize');
    expect(md).toContain('fullWidth');
  });

  it('legacy browser guide documents CSS compatibility table', () => {
    const md = readFileSync(resolve(ROOT, 'docs/legacy-browser-guide.md'), 'utf8');
    expect(md).toContain('lightdraw.legacy.js');
    expect(md).toContain('prefers-reduced-motion');
    expect(md).toMatch(/\|.*Chromium/s);
  });

  it('docs index links UI-10 guides', () => {
    const index = readFileSync(resolve(ROOT, 'docs/README.md'), 'utf8');
    expect(index).toContain('ui-theme-guide.md');
    expect(index).toContain('responsive-guide.md');
    expect(index).toContain('legacy-browser-guide.md');
    expect(index).toContain('demo-ui-catalog.html');
  });

  it('CHANGELOG has v1.0.0 UI polish section', () => {
    const changelog = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf8');
    expect(changelog).toContain('## [1.0.0]');
    expect(changelog).toContain('UI polish program');
    expect(changelog).toContain('Phase UI-10');
  });

  it('CHANGELOG and release notes cover v1.1.0', () => {
    const changelog = readFileSync(resolve(ROOT, 'CHANGELOG.md'), 'utf8');
    expect(changelog).toContain('## [1.1.0]');
    expect(existsSync(resolve(ROOT, 'docs/v1.1-release-notes.md'))).toBe(true);
  });

  it('demo-ui-catalog.html uses shared shell and catalog grid', () => {
    const html = readFileSync(resolve(ROOT, 'examples/demo-ui-catalog.html'), 'utf8');
    expect(html).toContain('demo-common.css');
    expect(html).toContain('catalog-grid');
    expect(html).toContain('createComponentFromJSON');
  });

  it('doc snippet — setUiTheme preset', () => {
    const container = createTestContainer(400, 300);
    const app = createTestApp(container, { renderer: 'html' });
    app.setUiTheme({ preset: 'darkViolet' });
    expect(() => app.render()).not.toThrow();
    app.destroy();
  });

  it('doc snippet — autoResize false for fixed HMI', () => {
    const container = createTestContainer(800, 480);
    const app = createTestApp(container, {
      renderer: 'html',
      width: 800,
      height: 480,
      autoResize: false,
    });
    app.add(app.rect({ width: 40, height: 40, fill: '#2563eb' }));
    expect(() => app.render()).not.toThrow();
    app.destroy();
  });
});
