import { describe, it, expect, afterEach } from 'vitest';
import { createDashboardFromJSON } from '../../src/dashboard/registry';
import { createTestApp, createTestContainer } from '../helpers';

describe('Dashboard widget visibility', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const [type, props] of [
    ['gauge', { value: 65, size: 100, x: 10, y: 10 }],
    ['lineChart', { data: [10, 20, 30], width: 200, height: 100, x: 10, y: 10 }],
    ['pieChart', { data: [30, 20, 50], size: 120, x: 0, y: 0 }],
  ] as const) {
    it(`${type} renders children on canvas`, () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'canvas' });
      const node = createDashboardFromJSON(type, props, app)!;
      app.add(node);
      app.render();
      expect(node.children.length).toBeGreaterThan(0);
      app.destroy();
    });

    it(`${type} renders children on html`, () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const node = createDashboardFromJSON(type, props, app)!;
      app.add(node);
      app.render();
      expect(node.children.length).toBeGreaterThan(0);
      const root = app.getRenderer().getElement();
      expect(root.querySelectorAll('[id]').length).toBeGreaterThan(0);
      app.destroy();
    });
  }
});
