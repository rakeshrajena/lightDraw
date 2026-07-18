import { describe, it, expect, afterEach } from 'vitest';
import {
  resolveNetworkIconKind,
  listNetworkIconKinds,
  listNetworkTypeAliases,
  drawNetworkIcon,
  networkStyleForKind,
  __networkAliasCount,
} from '../src/diagram/networkIcons';
import { createNetworkNode } from '../src/diagram/primitives';
import { createNetworkIconCatalog, createNetworkDiagram } from '../src/diagram/definitions';
import { createTestApp, createTestContainer } from './helpers';

describe('Network icon catalog', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('resolves friendly names and aliases to canonical kinds', () => {
    expect(resolveNetworkIconKind('Next-Generation Firewall (NGFW)')).toBe('ngfw');
    expect(resolveNetworkIconKind('Wireless Access Point (AP)')).toBe('wap');
    expect(resolveNetworkIconKind('Core Switch')).toBe('switch');
    expect(resolveNetworkIconKind('Kubernetes Cluster')).toBe('k8s');
    expect(resolveNetworkIconKind('Raspberry Pi')).toBe('raspberryPi');
    expect(resolveNetworkIconKind('Data Center')).toBe('datacenter');
    expect(resolveNetworkIconKind('client')).toBe('desktop');
    expect(resolveNetworkIconKind('router')).toBe('router');
  });

  it('covers a large alias set for the requested device list', () => {
    expect(__networkAliasCount()).toBeGreaterThan(100);
    expect(listNetworkTypeAliases().length).toBeGreaterThan(100);
    expect(listNetworkIconKinds().length).toBeGreaterThan(60);
  });

  it('draws every canonical icon with visible glyph geometry', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const kinds = listNetworkIconKinds();
    expect(kinds.length).toBeGreaterThan(60);

    for (const meta of kinds) {
      const g = app.group();
      const style = networkStyleForKind(meta.kind);
      const before = g.children.length;
      drawNetworkIcon(app, g, meta.kind, 52, style.glyph);
      expect(g.children.length, meta.kind).toBeGreaterThan(before);
      const hasStroke = g.children.some(
        (c) => 'stroke' in c && (c as { stroke?: string | null }).stroke != null
      );
      const hasFill = g.children.some(
        (c) => 'fill' in c && (c as { fill?: string | null }).fill != null
      );
      expect(hasStroke || hasFill, meta.kind).toBe(true);
    }
    app.destroy();
  });

  it('creates professional tiles for all category samples', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const samples = [
      'internet',
      'firewall',
      'ngfw',
      'load_balancer',
      'sql_database',
      'kubernetes',
      'laptop',
      'plc',
      'lidar',
      'dmz',
      'wifi',
      'server',
    ];
    for (const type of samples) {
      const node = createNetworkNode(app, type, type);
      expect(node.metadata.networkIconKind).toBeTruthy();
      expect(node.metadata.diagramCardWidth).toBeGreaterThanOrEqual(52);
      expect(node.children.length).toBeGreaterThan(3);
    }
    app.destroy();
  });

  it('builds a catalog diagram with every icon', () => {
    const container = createTestContainer(900, 700);
    const app = createTestApp(container, { renderer: 'canvas', width: 900, height: 700 });
    const catalog = createNetworkIconCatalog(app, { width: 900, height: 700, columns: 6 });
    app.add(catalog);
    expect(catalog.children.length).toBe(listNetworkIconKinds().length);
    app.render();
    app.destroy();
  });

  it('builds a topology using expanded types', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createNetworkDiagram(
      app,
      {
        nodes: [
          { id: 'a', label: 'Firewall', type: 'firewall', x: 40, y: 40 },
          { id: 'b', label: 'Switch', type: 'access_switch', x: 200, y: 40 },
          { id: 'c', label: 'SQL', type: 'sql_database', x: 360, y: 40 },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
        ],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();
    expect(diagram.children.length).toBeGreaterThan(2);
    app.destroy();
  });
});
