import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';
import { LightDraw, VERSION, App } from '../src/core/index';
import { uiPlugin } from '../src/modules/ui';
import { svgPlugin } from '../src/modules/svg';
import { htmlPlugin } from '../src/modules/html';
import { dashboardPlugin } from '../src/modules/dashboard';
import { clearRenderers, registerRenderer, createRenderer } from '../src/registry/renderers';
import { clearJSONResolvers } from '../src/registry/jsonResolvers';
import { clearInstalledPlugins } from '../src/plugins/index';
import { CanvasRenderer } from '../src/renderers/CanvasRenderer';
import { createTestContainer } from './helpers';

const CORE_MAX_GZIP = 43 * 1024; // aligned with scripts/size-gate.mjs (theme + schema baseline)

function registerCanvasRenderer(): void {
  registerRenderer('canvas', () => new CanvasRenderer());
}

describe('Phase 5 — Modular Bundle Architecture', () => {
  beforeEach(() => {
    clearRenderers();
    clearJSONResolvers();
    clearInstalledPlugins();
    registerCanvasRenderer();
  });

  it('core entry exposes App without plugin APIs', () => {
    expect(VERSION).toBe('1.1.0');
    expect(typeof LightDraw.createApp).toBe('function');
    expect(typeof LightDraw.App).toBe('function');
    expect((LightDraw as { registerComponent?: unknown }).registerComponent).toBeUndefined();
    expect((LightDraw as { registerDashboard?: unknown }).registerDashboard).toBeUndefined();
    expect((LightDraw as { Diagram?: unknown }).Diagram).toBeUndefined();
  });

  it('LightDraw.use(uiPlugin) registers components on the static API', () => {
    LightDraw.use(uiPlugin);
    expect(typeof (LightDraw as { registerComponent?: unknown }).registerComponent).toBe('function');
    expect(LightDraw.getInstalledPlugins()).toContain('lightdraw-ui');
  });

  it('LightDraw.use(svgPlugin) enables svg renderer', () => {
    LightDraw.use(svgPlugin);
    const container = createTestContainer();
    const app = LightDraw.createApp(container, { renderer: 'svg' });
    app.add(app.rect({ width: 10, height: 10 }));
    expect(() => app.render()).not.toThrow();
    app.destroy();
  });

  it('LightDraw.use(htmlPlugin) enables html renderer', () => {
    LightDraw.use(htmlPlugin);
    const container = createTestContainer();
    const app = LightDraw.createApp(container, { renderer: 'html' });
    app.add(app.rect({ width: 10, height: 10 }));
    expect(() => app.render()).not.toThrow();
    app.destroy();
  });

  it('LightDraw.use(dashboardPlugin) registers dashboard JSON resolver', () => {
    LightDraw.use(dashboardPlugin);
    const container = createTestContainer();
    const app = LightDraw.createApp(container, { renderer: 'canvas' });
    expect(() =>
      app.loadJSON({
        type: 'group',
        children: [{ type: 'gauge', props: { value: 50, x: 10, y: 10 } }],
      })
    ).not.toThrow();
    app.destroy();
  });

  it('core-only bundle excludes UI/dashboard registry strings', () => {
    const path = 'dist/lightdraw.core.min.js';
    expect(existsSync(path)).toBe(true);
    const content = readFileSync(path, 'utf8');
    expect(content).not.toContain('createDashboardFromJSON');
    expect(content).not.toContain('createAutomotiveFromJSON');
    expect(content).not.toMatch(/registerComponent\(['"]button/);
  });

  it('core bundle gzip size is within documented baseline (≤ 43 KB)', () => {
    const path = 'dist/lightdraw.core.min.js';
    expect(existsSync(path)).toBe(true);
    const gzip = gzipSync(readFileSync(path));
    expect(gzip.length).toBeLessThanOrEqual(CORE_MAX_GZIP);
  });

  it('full bundle includes all plugins when imported from src/index', async () => {
    const full = await import('../src/index');
    expect(full.LightDraw).toBeDefined();
    expect(typeof full.registerComponent).toBe('function');
    expect(typeof full.registerDashboard).toBe('function');
    expect(typeof full.Diagram).toBe('object');
  });

  it('each bundle has a legacy ES5 variant', () => {
    const legacyFiles = [
      'lightdraw.core.legacy.js',
      'lightdraw.svg.legacy.js',
      'lightdraw.html.legacy.js',
      'lightdraw.ui.legacy.js',
      'lightdraw.dashboard.legacy.js',
      'lightdraw.automotive.legacy.js',
      'lightdraw.diagram.legacy.js',
      'lightdraw.legacy.js',
    ];
    for (const file of legacyFiles) {
      expect(existsSync(`dist/${file}`)).toBe(true);
    }
  });

  it('renderer registry createRenderer returns null without plugin', () => {
    expect(createRenderer('svg')).toBeNull();
    expect(createRenderer('html')).toBeNull();
  });

  it('App works from core with canvas renderer only', () => {
    const container = createTestContainer();
    const app = new App(container, { renderer: 'canvas' });
    app.add(app.circle({ x: 50, y: 50, radius: 20, fill: '#00f' }));
    expect(() => app.render()).not.toThrow();
    app.destroy();
  });
});
