/**
 * Phase 2 — canvas UI builds from resolved theme and refreshes on setUiTheme.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createComponentFromJSON } from '../../src/components/registry';
import { getParts, getState } from '../../src/components/helpers';
import {
  resolveUiCanvasTheme,
  getActiveUi,
  syncActiveCanvasUiTheme,
} from '../../src/components/resolveCanvasTheme';
import { UI } from '../../src/components/theme';

describe('Phase 2 — canvas UI theme', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
  });

  it('resolveUiCanvasTheme() with empty tokens matches UI defaults', () => {
    const theme = resolveUiCanvasTheme({});
    expect(theme.primary).toBe(UI.primary);
    expect(theme.surface).toBe(UI.surface);
    expect(theme.danger).toBe(UI.danger);
    expect(theme.radius).toBe(UI.radius);
  });

  it('resolveUiCanvasTheme merges primary and surface from app tokens', () => {
    const theme = resolveUiCanvasTheme({ primary: '#7c3aed', surface: '#0f172a' });
    expect(theme.primary).toBe('#7c3aed');
    expect(theme.surface).toBe('#0f172a');
    expect(theme.primaryHover).toBe(UI.primaryHover); // unchanged unless provided
  });

  it('button created after uiTheme uses themed primary fill', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'violet' },
    });
    const btn = createComponentFromJSON('button', { label: 'Go', x: 10, y: 10 }, app)!;
    app.add(btn);
    const parts = getParts(btn);
    expect((parts.bg as { fill: string }).fill).toBe('#7c3aed');
    expect(getState(btn).fill).toBe('#7c3aed');
    app.destroy();
    el.remove();
  });

  it('button label is centered on the button mid-x (not the left edge)', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const width = 120;
    const btn = createComponentFromJSON('button', { label: 'Primary', width, x: 0, y: 0 }, app)!;
    app.add(btn);
    const parts = getParts(btn);
    const text = parts.text as { x: number; textAlign: string };
    expect(text.textAlign).toBe('center');
    expect(text.x).toBe(width / 2);
    app.destroy();
    el.remove();
  });

  it('setUiTheme dynamically updates existing canvas button fill', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const btn = createComponentFromJSON('button', { label: 'Save', x: 0, y: 0 }, app)!;
    app.add(btn);
    expect((getParts(btn).bg as { fill: string }).fill).toBe(UI.primary);

    app.setUiTheme({ preset: 'emerald' });
    expect(getActiveUi().primary).toBe('#059669');
    expect((getParts(btn).bg as { fill: string }).fill).toBe('#059669');
    expect(getState(btn).fill).toBe('#059669');

    app.setUiTheme({ preset: 'rose' });
    expect((getParts(btn).bg as { fill: string }).fill).toBe('#e11d48');

    app.destroy();
    el.remove();
  });

  it('custom fill override is preserved across theme changes', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const btn = createComponentFromJSON(
      'button',
      { label: 'Custom', fill: '#111111', x: 0, y: 0 },
      app
    )!;
    app.add(btn);
    expect((getParts(btn).bg as { fill: string }).fill).toBe('#111111');

    app.setUiTheme({ preset: 'violet' });
    expect((getParts(btn).bg as { fill: string }).fill).toBe('#111111');

    app.destroy();
    el.remove();
  });

  it('slider and toggle pick up primary on theme change', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const slider = createComponentFromJSON('slider', { value: 40, width: 160, x: 0, y: 0 }, app)!;
    const toggle = createComponentFromJSON('toggle', { value: true, x: 0, y: 40 }, app)!;
    app.add(slider, toggle);

    app.setUiTheme({ primary: '#0284c7' });
    expect((getParts(slider).fill as { fill: string }).fill).toBe('#0284c7');
    expect((getParts(slider).thumb as { stroke: string }).stroke).toBe('#0284c7');
    expect((getParts(toggle).track as { fill: string }).fill).toBe('#0284c7');

    app.destroy();
    el.remove();
  });
});
