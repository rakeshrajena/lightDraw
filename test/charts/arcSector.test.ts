import { describe, it, expect } from 'vitest';
import { arcSectorPath } from '../../src/renderers/arcSector';
import { Arc } from '../../src/shapes/index';
import { createTestApp, createTestContainer } from '../helpers';
import { createDashboardFromJSON } from '../../src/dashboard/registryCore';

describe('arc sector rendering', () => {
  it('builds closed pie wedge path', () => {
    const d = arcSectorPath(50, 50, 40, 0, Math.PI / 2, 0);
    expect(d.startsWith('M 50 50')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  it('builds closed donut sector path', () => {
    const d = arcSectorPath(50, 50, 40, 0, Math.PI / 2, 20);
    expect(d.startsWith('M ')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d).toContain('A 20 20');
  });

  it('Arc stores innerRadius', () => {
    const arc = new Arc({ radius: 60, innerRadius: 25, startAngle: 0, endAngle: 1 });
    expect(arc.innerRadius).toBe(25);
  });

  it('pieChart renders wedge arcs', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const pie = createDashboardFromJSON('pieChart', { data: [30, 20, 50], size: 120, x: 0, y: 0 }, app)!;
    app.add(pie);
    app.render();
    const arcs = pie.children.filter((c) => c.type === 'arc') as Arc[];
    expect(arcs.length).toBe(3);
    expect(arcs[0].innerRadius).toBe(0);
    app.destroy();
  });

  it('doughnutChart uses inner radius', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const donut = createDashboardFromJSON('doughnutChart', { data: [30, 20, 50], size: 120, x: 0, y: 0 }, app)!;
    app.add(donut);
    app.render();
    const arcs = donut.children.filter((c) => c.type === 'arc') as Arc[];
    expect(arcs.length).toBe(3);
    expect(arcs[0].innerRadius).toBeGreaterThan(0);
    app.destroy();
  });
});
