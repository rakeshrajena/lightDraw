import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const root = resolve(__dirname, '..');

describe('Phase 11 — Documentation & Playground', () => {
  it('all guide documents exist', () => {
    const guides = [
      'docs/README.md',
      'docs/animation-guide.md',
      'docs/plugin-guide.md',
      'docs/performance-guide.md',
      'docs/legacy-browser-guide.md',
      'docs/ui-theme-guide.md',
      'docs/responsive-guide.md',
      'docs/automotive-examples.md',
      'docs/ai-integration-guide.md',
    ];
    for (const g of guides) {
      expect(existsSync(resolve(root, g))).toBe(true);
    }
  });

  it('typedoc config present', () => {
    expect(existsSync(resolve(root, 'typedoc.json'))).toBe(true);
  });

  it('website entry and vite config exist', () => {
    expect(existsSync(resolve(root, 'website/index.html'))).toBe(true);
    expect(existsSync(resolve(root, 'website/vite.config.ts'))).toBe(true);
  });

  it('playwright visual test spec exists', () => {
    expect(existsSync(resolve(root, 'test/visual/smoke.spec.ts'))).toBe(true);
    expect(existsSync(resolve(root, 'playwright.config.ts'))).toBe(true);
  });

  it('examples cover all modules', () => {
    const examples = [
      'demo.html',
      'demo-animation.html',
      'demo-ui.html',
      'demo-ui-catalog.html',
      'demo-dashboard.html',
      'demo-automotive.html',
      'demo-diagram.html',
      'demo-export.html',
      'demo-a11y.html',
    ];
    for (const ex of examples) {
      expect(existsSync(resolve(root, 'examples', ex))).toBe(true);
    }
  });

  it('build:website succeeds', () => {
    execSync('npm run build:website', { cwd: root, stdio: 'pipe', timeout: 120000 });
    expect(existsSync(resolve(root, 'website/dist/index.html'))).toBe(true);
  });

  it('docs:api generates HTML reference', () => {
    execSync('npm run docs:api', { cwd: root, stdio: 'pipe', timeout: 120000 });
    const indexHtml = resolve(root, 'docs/api/index.html');
    expect(existsSync(indexHtml)).toBe(true);
    expect(readFileSync(indexHtml, 'utf8')).toContain('LightDraw');
  });

  it('README links to documentation index', () => {
    const readme = readFileSync(resolve(root, 'README.md'), 'utf8');
    expect(readme).toContain('docs/');
  });
});
