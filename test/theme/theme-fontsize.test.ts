/**
 * Cross-module fontSize — UI canvas, diagram scale, automotive fluidFont scale, labels.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createComponentFromJSON } from '../../src/components/registry';
import { createDiagramFromJSON } from '../../src/diagram/registry';
import { createAutomotiveFromJSON } from '../../src/automotive/registry';
import { getParts, getState } from '../../src/components/helpers';
import { getState as getAutoState } from '../../src/automotive/helpers';
import {
  resolveUiCanvasTheme,
  syncActiveCanvasUiTheme,
} from '../../src/components/resolveCanvasTheme';
import {
  DIAGRAM,
  resolveDiagramTheme,
  syncActiveDiagramTheme,
  getActiveDiagram,
} from '../../src/diagram/theme';
import {
  syncAutomotiveFontScale,
  getAutomotiveFontScale,
  getTheme,
} from '../../src/automotive/themes';
import { fluidFont, resolveBounds } from '../../src/automotive/layout';
import { UI } from '../../src/components/theme';

describe('theme fontSize across modules', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
    syncActiveDiagramTheme({});
    syncAutomotiveFontScale({});
  });

  it('resolveUiCanvasTheme parses fontSize tokens and derives sm/lg', () => {
    const theme = resolveUiCanvasTheme({ fontSize: '18px' });
    expect(theme.fontSize).toBe(18);
    expect(theme.fontSizeSm).toBe(Math.round(18 * (UI.fontSizeSm / UI.fontSize)));
    expect(theme.fontSizeLg).toBe(Math.round(18 * (UI.fontSizeLg / UI.fontSize)));
  });

  it('label and button pick up themed font sizes', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { fontSize: '16px', fontSizeSm: '13px' },
    });
    const label = createComponentFromJSON('label', { text: 'Hello' }, app)!;
    const btn = createComponentFromJSON('button', { label: 'Go' }, app)!;
    app.add(label);
    app.add(btn);

    expect((label as { fontSize: number }).fontSize).toBe(13);
    expect((getParts(btn).text as { fontSize: number }).fontSize).toBe(16);

    app.setUiTheme({ fontSize: '20px', fontSizeSm: '15px' });
    expect((label as { fontSize: number }).fontSize).toBe(15);
    expect((getParts(btn).text as { fontSize: number }).fontSize).toBe(20);

    app.destroy();
    el.remove();
  });

  it('label keeps explicit fontSize across theme changes', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const label = createComponentFromJSON(
      'label',
      { text: 'Fixed', fontSize: 22 },
      app
    )!;
    app.add(label);
    expect(getState(label).hasCustomFontSize).toBe(true);
    app.setUiTheme({ fontSizeSm: '10px' });
    expect((label as { fontSize: number }).fontSize).toBe(22);
    app.destroy();
    el.remove();
  });

  it('resolveDiagramTheme scales nested fontSize from UI base', () => {
    const theme = resolveDiagramTheme({ fontSize: '18px' });
    const scale = 18 / DIAGRAM.fontSize.base;
    expect(theme.fontSize.base).toBe(Math.round(DIAGRAM.fontSize.base * scale));
    expect(theme.fontSize.sm).toBe(Math.round(DIAGRAM.fontSize.sm * scale));
  });

  it('diagram pack fontSize overrides UI scale per key', () => {
    const theme = resolveDiagramTheme(
      { fontSize: '18px' },
      { fontSize: { sm: 9, base: 11 } }
    );
    expect(theme.fontSize.sm).toBe(9);
    expect(theme.fontSize.base).toBe(11);
  });

  it('setUiTheme updates active diagram fontSize', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    createDiagramFromJSON(
      'flowchart',
      {
        data: {
          nodes: [{ id: 'a', label: 'A', type: 'process', x: 0, y: 0 }],
          edges: [],
        },
      },
      app
    );
    expect(getActiveDiagram().fontSize.base).toBe(DIAGRAM.fontSize.base);
    app.setUiTheme({ fontSize: '24px' });
    expect(getActiveDiagram().fontSize.base).toBe(24);
    app.destroy();
    el.remove();
  });

  it('automotive fontScale follows UI fontSize; colors stay dual-system', () => {
    expect(getAutomotiveFontScale()).toBe(1);
    syncAutomotiveFontScale({ fontSize: '21px' });
    expect(getAutomotiveFontScale()).toBe(1.5);
    expect(getTheme('sport').fontScale).toBe(1.5);
    expect(getTheme('sport').accent).toBe('#dc2626');

    const bounds = resolveBounds({ width: 120, height: 120 }, 120, 120);
    const scaled = fluidFont(10, bounds, 8, 24);
    syncAutomotiveFontScale({});
    const base = fluidFont(10, bounds, 8, 24);
    expect(scaled).toBeGreaterThan(base);
  });

  it('setUiTheme with fontSize scales automotive widgets without changing preset', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const gauge = createAutomotiveFromJSON(
      'speedometer',
      { theme: 'sport', value: 40, size: 160, x: 0, y: 0 },
      app
    )!;
    app.add(gauge);
    expect(getAutoState(gauge).theme).toBe('sport');
    app.setUiTheme({ fontSize: '28px' });
    expect(getAutomotiveFontScale()).toBe(2);
    expect(getAutoState(gauge).theme).toBe('sport');
    app.destroy();
    el.remove();
  });
});
