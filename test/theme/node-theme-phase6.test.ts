/**
 * Phase 6 — per-node uiTheme overrides (component → app → defaults).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, createTestContainer } from '../helpers';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { createDiagramFromJSON } from '../../src/diagram/registry';
import { createComponentFromJSON } from '../../src/components/registry';
import { createAutomotiveFromJSON } from '../../src/automotive/registry';
import { getParts, getState as getUiState } from '../../src/components/helpers';
import { getParts as getDashParts } from '../../src/dashboard/helpers';
import { getState as getAutoState } from '../../src/automotive/helpers';
import { getActiveDiagram, syncActiveDiagramTheme, DIAGRAM } from '../../src/diagram/theme';
import { syncActiveDashboardTheme, DASHBOARD } from '../../src/dashboard/theme';
import { syncActiveCanvasUiTheme } from '../../src/components/resolveCanvasTheme';
import { UI } from '../../src/components/theme';
import {
  resolveEffectiveUiTokens,
  readNodeUiThemeProp,
  hasNodeUiThemeOverride,
} from '../../src/components/nodeTheme';

describe('Phase 6 — per-node uiTheme overrides', () => {
  beforeEach(() => {
    syncActiveCanvasUiTheme({});
    syncActiveDashboardTheme({});
    syncActiveDiagramTheme({});
  });

  it('resolveEffectiveUiTokens merges node preset over app theme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'slate' },
    });
    const tokens = resolveEffectiveUiTokens(app, { uiTheme: 'violet' });
    expect(tokens.primary).toBe('#7c3aed');
    expect(app.getResolvedTheme().primary).toBe('#334155');
    app.destroy();
    el.remove();
  });

  it('ignores automotive theme strings on readNodeUiThemeProp', () => {
    expect(readNodeUiThemeProp({ theme: 'sport' })).toBeUndefined();
    expect(hasNodeUiThemeOverride({ theme: 'classic' })).toBe(false);
    expect(readNodeUiThemeProp({ theme: 'violet' })).toBe('violet');
    expect(readNodeUiThemeProp({ uiTheme: { primary: '#abc' } })).toEqual({ primary: '#abc' });
  });

  it('dashboard gauge can use violet while app theme is emerald', () => {
    const el = createTestContainer();
    const app = createTestApp(el, {
      renderer: 'canvas',
      uiTheme: { preset: 'emerald' },
    });
    const themed = createDashboardFromJSON(
      'gauge',
      { value: 40, size: 100, uiTheme: 'violet', x: 0, y: 0 },
      app
    )!;
    const plain = createDashboardFromJSON('gauge', { value: 40, size: 100, x: 120, y: 0 }, app)!;
    app.add(themed, plain);

    const themedNeedle = getDashParts(themed).needle as { stroke?: string };
    expect(themedNeedle.stroke).toBe('#7c3aed');

    // Re-create plain under app theme to assert emerald (active theme may be last build)
    syncActiveDashboardTheme(app.getResolvedTheme());
    const plain2 = createDashboardFromJSON('gauge', { value: 40, size: 100, x: 240, y: 0 }, app)!;
    app.add(plain2);
    expect((getDashParts(plain2).needle as { stroke?: string }).stroke).toBe('#059669');

    app.destroy();
    el.remove();
  });

  it('diagram node uiTheme override survives app setUiTheme for override keys', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas', uiTheme: { preset: 'slate' } });
    const diagram = createDiagramFromJSON(
      'flowchart',
      {
        uiTheme: { primary: '#e11d48' },
        data: {
          nodes: [
            { id: 'a', label: 'A', type: 'process', x: 20, y: 20 },
            { id: 'b', label: 'B', type: 'process', x: 20, y: 100 },
          ],
          edges: [{ from: 'a', to: 'b' }],
        },
      },
      app
    )!;
    app.add(diagram);
    expect(getActiveDiagram().edge).toBe('#e11d48');

    app.setUiTheme({ preset: 'ocean' });
    // rebuild applies node override on top of ocean → primary stays #e11d48 from node
    expect(getActiveDiagram().edge).toBe('#e11d48');

    app.destroy();
    el.remove();
  });

  it('UI button uiTheme override colors primary at create time', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas' });
    const btn = createComponentFromJSON(
      'button',
      { label: 'Go', uiTheme: 'rose', x: 0, y: 0 },
      app
    )!;
    app.add(btn);
    expect((getParts(btn).bg as { fill: string }).fill).toBe('#e11d48');
    expect(getUiState(btn).uiTheme).toBe('rose');
    app.destroy();
    el.remove();
  });

  it('automotive theme prop is unchanged and not treated as uiTheme', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'canvas', uiTheme: { preset: 'violet' } });
    const cluster = createAutomotiveFromJSON(
      'instrumentCluster',
      { theme: 'sport', speed: 50, width: 400, height: 240, x: 0, y: 0 },
      app
    )!;
    app.add(cluster);
    expect(getAutoState(cluster).theme).toBe('sport');
    expect(hasNodeUiThemeOverride({ theme: 'sport' })).toBe(false);
    expect(UI.primary).toBe('#2563eb');
    expect(DASHBOARD.primary).toBe('#3b82f6');
    expect(DIAGRAM.nodeStroke).toBe('#3b82f6');
    app.destroy();
    el.remove();
  });
});
