import { describe, it, expect, afterEach } from 'vitest';
import { createTestApp, createTestContainer } from './helpers';
import { createComponentFromJSON } from '../src/components/registry';
import { createDashboardFromJSON } from '../src/dashboard/registry';
import { createAutomotiveFromJSON } from '../src/automotive/registry';
import { createDiagramFromJSON } from '../src/diagram/registry';
import '../src/components/registry';
import '../src/dashboard/registry';
import '../src/automotive/registry';
import '../src/diagram/registry';

const UI_TYPES = [
  'button', 'label', 'card', 'slider', 'checkbox', 'toggle', 'input', 'textarea',
  'radio', 'tooltip', 'menu', 'dialog', 'tabs', 'accordion', 'table', 'tree', 'toolbar', 'toast', 'statusBar',
];

const DASH_TYPES = [
  'lineChart', 'barChart', 'pieChart', 'gauge', 'speedometer', 'clock', 'battery', 'areaChart',
  'legend', 'thermometer', 'compass', 'calendar', 'timeline', 'signalStrength', 'knob', 'meter',
  'candlestickChart', 'histogram', 'scatterChart', 'sankeyChart', 'treemap', 'radarChart', 'waterfallChart',
];

describe('Phase 11 integration coverage', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders all UI component types', () => {
    const container = createTestContainer(900, 600);
    const app = createTestApp(container, { renderer: 'html' });
    for (const type of UI_TYPES) {
      const node = createComponentFromJSON(type, { x: 10, y: 10 }, app);
      expect(node, type).toBeTruthy();
      app.add(node!);
    }
    app.render();
    app.destroy();
  });

  it('renders all dashboard widget types', () => {
    const container = createTestContainer(900, 600);
    const app = createTestApp(container, { renderer: 'html' });
    for (const type of DASH_TYPES) {
      const node = createDashboardFromJSON(type, { x: 10, y: 10, width: 120, height: 80 }, app);
      expect(node, type).toBeTruthy();
      app.add(node!);
    }
    app.render();
    app.destroy();
  });

  it('renders automotive and diagram JSON types', () => {
    const container = createTestContainer(900, 500);
    const app = createTestApp(container, { renderer: 'html' });
    const auto = createAutomotiveFromJSON('instrumentCluster', { x: 0, y: 0 }, app);
    expect(auto).toBeTruthy();
    app.add(auto!);
    const flow = createDiagramFromJSON('flowchart', {
      data: { nodes: [{ id: 'a', label: 'A' }], edges: [] },
    }, app);
    expect(flow).toBeTruthy();
    app.add(flow!);
    app.render();
    app.destroy();
  });
});
