/**
 * Phase 1 — App theme snapshot, getters, and themechange on config update.
 */
import { describe, it, expect, vi } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { resolveUiTheme } from '../../src/components/uiTheme';

describe('Phase 1 — App theme source of truth', () => {
  it('getUiTheme / getResolvedTheme reflect createApp uiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'darkViolet' },
    });

    expect(app.getUiTheme()).toEqual({ preset: 'darkViolet' });
    expect(app.getResolvedTheme()).toEqual(resolveUiTheme({ preset: 'darkViolet' }));
    expect(app.getResolvedTheme().primary).toBe('#8b5cf6');
    expect(app.getResolvedTheme().surface).toBe('#1e293b');

    app.destroy();
    el.remove();
  });

  it('empty theme stays empty resolved (defaults unchanged)', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    expect(app.getUiTheme()).toEqual({});
    expect(app.getResolvedTheme()).toEqual({});

    app.destroy();
    el.remove();
  });

  it('setUiTheme merges config, updates resolved snapshot, and emits themechange', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'html',
      uiTheme: { preset: 'slate' },
    });

    const handler = vi.fn();
    app.on('themechange', handler);

    app.setUiTheme({ primary: '#ff00aa' });

    expect(app.getUiTheme()).toEqual({ preset: 'slate', primary: '#ff00aa' });
    expect(app.getResolvedTheme().primary).toBe('#ff00aa');
    expect(app.getResolvedTheme().surface).toBe('#ffffff');
    // Hover/active follow the new primary when not set explicitly
    expect(app.getResolvedTheme().primaryHover).toBe('rgb(219,0,146)');
    expect(app.getResolvedTheme().primaryActive).toMatch(/^rgb\(/);

    expect(handler).toHaveBeenCalledTimes(1);
    const evt = handler.mock.calls[0][0];
    expect(evt.type).toBe('themechange');
    expect(evt.payload.config.preset).toBe('slate');
    expect(evt.payload.resolved.primary).toBe('#ff00aa');

    app.destroy();
    el.remove();
  });

  it('setUiTheme switching preset replaces resolved primary dynamically', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    app.setUiTheme({ preset: 'emerald' });
    expect(app.getResolvedTheme().primary).toBe('#059669');

    app.setUiTheme({ preset: 'ocean' });
    expect(app.getUiTheme().preset).toBe('ocean');
    expect(app.getResolvedTheme().primary).toBe('#0284c7');

    app.destroy();
    el.remove();
  });

  it('getters return copies (mutating return value does not corrupt app)', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'rose' },
    });

    const cfg = app.getUiTheme();
    const resolved = app.getResolvedTheme();
    cfg.preset = 'hacked';
    resolved.primary = '#000000';

    expect(app.getUiTheme().preset).toBe('rose');
    expect(app.getResolvedTheme().primary).toBe('#e11d48');

    app.destroy();
    el.remove();
  });
});
