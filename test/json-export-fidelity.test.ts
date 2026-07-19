import { describe, it, expect, afterEach } from 'vitest';
import { createTestApp, createTestContainer } from './helpers';
import { toJSON, fromJSON, compactSceneJSON } from '../src/io/json';
import { createComponentFromJSON } from '../src/components/registry';
import { createDashboardFromJSON } from '../src/dashboard/registry';
import { scenesEqual } from '../src/io/export';
describe('scene JSON export fidelity', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('exportJSON keeps UI and chart types as opaque leaves', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'html' });
    const btn = createComponentFromJSON('button', { label: 'Save', x: 8, y: 8 }, app)!;
    const chart = createDashboardFromJSON(
      'lineChart',
      { data: [1, 2, 3], width: 200, height: 100, x: 8, y: 60 },
      app
    )!;
    app.add(btn, chart);

    const exported = app.exportJSON({ compact: true });
    expect(exported.type).toBe('group');
    const types = (exported.children ?? []).map((c) => c.type);
    expect(types).toContain('button');
    expect(types).toContain('lineChart');
    const buttonNode = (exported.children ?? []).find((c) => c.type === 'button');
    expect(buttonNode?.props?.label).toBe('Save');
    expect(buttonNode?.children ?? []).toHaveLength(0);

    app.clear();
    app.loadJSON(exported);
    const again = app.exportJSON({ compact: true });
    expect((again.children ?? []).map((c) => c.type).sort()).toEqual(types.sort());
    expect(again.children?.find((c) => c.type === 'button')?.props?.label).toBe('Save');
    expect(again.children?.find((c) => c.type === 'lineChart')?.props?.data).toEqual([1, 2, 3]);
    // Full deep equality can still differ on factory-injected defaults; type + key props must hold.
    app.destroy();
  });

  it('toJSON(node, { compact }) omits identity transforms', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'html' });
    const btn = createComponentFromJSON('button', { label: 'Go', x: 0, y: 0 }, app)!;
    const full = toJSON(btn);
    const compact = toJSON(btn, { compact: true });
    expect(full.props?.rotation).toBe(0);
    expect(compact.props?.rotation).toBeUndefined();
    expect(compact.props?.label).toBe('Go');
    expect(compactSceneJSON(full).props?.scaleX).toBeUndefined();
    app.destroy();
  });

  it('shape group round-trip still works via module-aware toJSON', () => {
    const el = createTestContainer();
    const app = createTestApp(el, { renderer: 'html' });
    app.add(
      app.rect({ x: 5, y: 5, width: 40, height: 30, fill: '#2563eb' }),
      app.circle({ x: 80, y: 30, radius: 20, fill: '#dc2626' })
    );
    const exported = toJSON(app.stage);
    expect(exported.children?.[0]?.type).toBe('rect');
    expect(exported.children?.[1]?.type).toBe('circle');
    const node = fromJSON(exported, app);
    expect(scenesEqual(exported, toJSON(node))).toBe(true);
    app.destroy();
  });
});
