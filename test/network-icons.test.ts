import { describe, it, expect, afterEach } from 'vitest';
import {
  resolveNetworkIconKind,
  listNetworkIconKinds,
  listNetworkTypeAliases,
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

  it('creates nodes for security, cloud, and iot types', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    for (const type of ['firewall', 'load_balancer', 'plc', 'lidar', 'dmz']) {
      const node = createNetworkNode(app, type, type);
      expect(node.metadata.networkIconKind).toBeTruthy();
      expect(node.metadata.diagramCardWidth).toBeGreaterThan(40);
    }
    app.destroy();
  });

  it('builds a catalog diagram with many icons', () => {
    const container = createTestContainer(900, 700);
    const app = createTestApp(container, { renderer: 'canvas', width: 900, height: 700 });
    const catalog = createNetworkIconCatalog(app, { width: 900, height: 700, columns: 6 });
    app.add(catalog);
    expect(catalog.children.length).toBeGreaterThan(50);
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
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    expect(diagram.children.length).toBeGreaterThan(1);
    app.destroy();
  });
});
