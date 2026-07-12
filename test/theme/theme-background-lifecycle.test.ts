/**
 * Theme stage background lifecycle — image presets, clear, pack switch.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { syncActiveCanvasUiTheme } from '../../src/components/resolveCanvasTheme';
import { syncActiveDashboardTheme } from '../../src/dashboard/theme';

const SAMPLE_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#0ea5e9"/></svg>'
  );

describe('theme stage background lifecycle', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
    syncActiveDashboardTheme({});
  });

  it('image preset sets stage background and pack switch clears it', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      background: '#111111',
    });

    app.applyTheme({ preset: SAMPLE_SVG });
    expect(app.getBackground()).toContain('url(');
    expect(app.getTheme().background || app.getTheme().preset).toBeTruthy();

    app.applyTheme({ preset: 'dark' });
    // Pack surface takes over — no sticky image
    expect(app.getBackground()).toBe('#0f172a'); // dark surfaceMuted
    expect(app.getBackground()).not.toContain('url(');

    app.destroy();
    el.remove();
  });

  it('clearUiTheme restores createApp background', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      background: '#abcdef',
    });

    app.applyTheme({ preset: SAMPLE_SVG });
    expect(app.getBackground()).toContain('url(');

    app.clearUiTheme();
    expect(app.getBackground()).toBe('#abcdef');

    app.destroy();
    el.remove();
  });

  it('HTML renderer keeps image background after render()', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'html',
      background: '#111111',
    });

    app.applyTheme({ preset: SAMPLE_SVG });
    expect(app.getBackground()).toContain('url(');

    const root = el.querySelector('.lightdraw-html-root') as HTMLElement;
    expect(root).toBeTruthy();
    // jsdom may expose backgroundImage separately from shorthand
    const bg = `${root.style.background} ${root.style.backgroundImage}`;
    expect(bg).toMatch(/url\(/);

    app.render();
    const bg2 = `${root.style.background} ${root.style.backgroundImage}`;
    expect(bg2).toMatch(/url\(/);

    app.applyTheme({ preset: 'violet' });
    app.render();
    const bg3 = `${root.style.background} ${root.style.backgroundImage}`;
    expect(bg3).not.toMatch(/url\(/);

    app.destroy();
    el.remove();
  });
});
