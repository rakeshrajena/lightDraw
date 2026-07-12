/**
 * P1 — canvas UI live refresh covers all component types.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createComponentFromJSON } from '../../src/components/registry';
import { getParts, getState } from '../../src/components/helpers';
import { syncActiveCanvasUiTheme } from '../../src/components/resolveCanvasTheme';
import { UI } from '../../src/components/theme';
import type { Group } from '../../src/shapes/Group';

describe('Canvas UI full refresh coverage', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
  });

  it('tabs indicator picks up primary after setUiTheme (rebuild path)', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const tabs = createComponentFromJSON(
      'tabs',
      { tabs: ['A', 'B'], activeTab: 0, width: 200, x: 0, y: 0 },
      app
    )! as Group;
    app.add(tabs);
    expect(typeof tabs.metadata.uiRebuild).toBe('function');

    app.setUiTheme({ primary: '#7c3aed' }, { replace: true });

    // Indicator is the second child (roundedRect under the surface)
    const indicator = tabs.children[1] as { fill?: string };
    expect(indicator.fill).toBe('#7c3aed');

    app.destroy();
    el.remove();
  });

  it('table header / selection chrome follow theme after setUiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const table = createComponentFromJSON(
      'table',
      {
        columns: ['Name', 'Val'],
        rows: [
          ['A', '1'],
          ['B', '2'],
        ],
        selectedRow: 0,
        width: 200,
        x: 0,
        y: 0,
      },
      app
    )! as Group;
    app.add(table);

    app.setUiTheme({ primary: '#059669' }, { replace: true });

    // After rebuild, a selected-row accent bar uses primary
    const fills = table.children
      .map((c) => (c as { fill?: string }).fill)
      .filter((f): f is string => typeof f === 'string');
    expect(fills).toContain('#059669');

    app.destroy();
    el.remove();
  });

  it('card, tooltip, statusBar, and label paint-refresh on setUiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });

    const card = createComponentFromJSON(
      'card',
      { title: 'Panel', subtitle: 'Sub', width: 200, height: 120, x: 0, y: 0 },
      app
    )!;
    const tip = createComponentFromJSON(
      'tooltip',
      { text: 'Tip', anchor: 'Hover', x: 0, y: 140 },
      app
    )!;
    const bar = createComponentFromJSON(
      'statusBar',
      { segments: ['Ready', 'UTF-8'], width: 240, primaryIndex: 0, x: 0, y: 200 },
      app
    )!;
    const label = createComponentFromJSON('label', { text: 'Meta', x: 0, y: 240 }, app)!;
    app.add(card, tip, bar, label);

    expect((getParts(card).bg as { fill: string }).fill).toBe(UI.surface);
    expect((label as { fill: string }).fill).toBe(UI.textMuted);

    app.setUiTheme(
      {
        primary: '#0284c7',
        surface: '#0f172a',
        surfaceMuted: '#1e293b',
        surfaceInset: '#334155',
        textMuted: '#94a3b8',
        text: '#f8fafc',
        border: '#475569',
        primarySubtle: '#1e3a5f',
        textSecondary: '#cbd5e1',
      },
      { replace: true }
    );

    expect((getParts(card).bg as { fill: string }).fill).toBe('#0f172a');
    expect((getParts(card).header as { fill: string }).fill).toBe('#1e293b');
    expect((getParts(tip).anchor as { fill: string }).fill).toBe('#0284c7');
    expect((getParts(bar).bg as { fill: string }).fill).toBe('#334155');
    expect((getParts(bar).primarySeg as { fill: string }).fill).toBe('#1e3a5f');
    expect((label as { fill: string }).fill).toBe('#94a3b8');

    app.destroy();
    el.remove();
  });

  it('label with custom color is preserved across theme changes', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const label = createComponentFromJSON(
      'label',
      { text: 'Fixed', color: '#111111', x: 0, y: 0 },
      app
    )!;
    app.add(label);
    expect(getState(label).hasCustomColor).toBe(true);

    app.setUiTheme({ textMuted: '#94a3b8' }, { replace: true });
    expect((label as { fill: string }).fill).toBe('#111111');

    app.destroy();
    el.remove();
  });

  it('toolbar rebuilds ghost buttons with themed border/surface', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const toolbar = createComponentFromJSON(
      'toolbar',
      { items: ['New', 'Save'], x: 0, y: 0 },
      app
    )! as Group;
    app.add(toolbar);
    expect(typeof toolbar.metadata.uiRebuild).toBe('function');

    app.setUiTheme({ surface: '#0f172a', border: '#334155', textSecondary: '#cbd5e1' }, { replace: true });

    const firstBtn = toolbar.children.find((c) => c.metadata?.componentType === 'button') as Group;
    expect(firstBtn).toBeTruthy();
    const bg = firstBtn.children[0] as { fill?: string; stroke?: string };
    expect(bg.fill).toBe('#0f172a');
    expect(bg.stroke).toBe('#334155');

    app.destroy();
    el.remove();
  });
});
