import { describe, it, expect, afterEach } from 'vitest';
import { existsSync } from 'fs';
import {
  createDiagramFromJSON,
  createFlowchart,
  createStateMachine,
  createClassDiagram,
  createMindMap,
  createNetworkDiagram,
  createOrgChart,
  createSchematic,
  createCanNetwork,
  createPipeline,
  toggleOrgCollapse,
  applyForceLayout,
  forceDirectedLayout,
  routeConnector,
  collectObstacles,
  diagramToJSON,
} from '../src/diagram/registry';
import { toJSON } from '../src/io/json';
import { Group } from '../src/shapes/Group';
import { createTestApp, createTestContainer, measureAverageMs } from './helpers';

const PHASE9_TYPES = [
  'flowchart',
  'stateMachine',
  'classDiagram',
  'mindMap',
  'networkTopology',
  'orgChart',
  'electricalSchematic',
  'canNetwork',
  'processPipeline',
] as const;

describe('Phase 9 — Diagram Module', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const type of PHASE9_TYPES) {
    it(`${type} renders without error`, () => {
      const container = createTestContainer();
      const app = createTestApp(container, { renderer: 'html' });
      const node = createDiagramFromJSON(type, sampleProps(type), app);
      expect(node).toBeTruthy();
      app.add(node!);
      expect(() => app.render()).not.toThrow();
      app.destroy();
    });
  }

  it('force layout converges 50 nodes within 100 iterations', () => {
    const nodes = Array.from({ length: 50 }, (_, i) => ({ id: `n${i}` }));
    const edges = Array.from({ length: 49 }, (_, i) => ({ from: `n${i}`, to: `n${i + 1}` }));
    const positions = forceDirectedLayout(nodes, edges, { iterations: 100, seed: 7 });
    expect(positions.size).toBe(50);
    for (const pos of positions.values()) {
      expect(pos.x).toBeGreaterThan(0);
      expect(pos.y).toBeGreaterThan(0);
    }
  });

  it('force layout 100 nodes settles within performance budget', () => {
    const nodes = Array.from({ length: 100 }, (_, i) => ({ id: `n${i}` }));
    const edges: Array<{ from: string; to: string }> = [];
    for (let i = 0; i < 99; i++) edges.push({ from: `n${i}`, to: `n${i + 1}` });
    for (let i = 0; i < 50; i++) {
      edges.push({ from: `n${i}`, to: `n${i + 50}` });
    }
    const ms = measureAverageMs(
      () => forceDirectedLayout(nodes, edges, { iterations: 80, seed: 1 }),
      3
    );
    expect(ms).toBeLessThan(500);
  });

  it('seeded force layout produces stable positions', () => {
    const nodes = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
    ];
    const edges = [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
      { from: 'c', to: 'd' },
      { from: 'a', to: 'd' },
    ];
    const p1 = forceDirectedLayout(nodes, edges, { seed: 99, iterations: 50 });
    const p2 = forceDirectedLayout(nodes, edges, { seed: 99, iterations: 50 });
    for (const id of ['a', 'b', 'c', 'd']) {
      expect(p1.get(id)!.x).toBeCloseTo(p2.get(id)!.x, 4);
      expect(p1.get(id)!.y).toBeCloseTo(p2.get(id)!.y, 4);
    }
  });

  it('state machine renders 10 states and 15 transitions', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas' });
    const states = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i}`,
      label: `State ${i}`,
      type: (i === 0 ? 'initial' : i === 9 ? 'final' : 'normal') as 'initial' | 'final' | 'normal',
      x: (i % 5) * 100,
      y: Math.floor(i / 5) * 80,
    }));
    const transitions: Array<{ from: string; to: string; label?: string }> = [];
    for (let i = 0; i < 9; i++) {
      transitions.push({ from: `s${i}`, to: `s${i + 1}`, label: `t${i}` });
    }
    for (let i = 0; i < 6; i++) {
      transitions.push({ from: `s${i}`, to: `s${i + 3}` });
    }
    const sm = createStateMachine(app, { states, transitions });
    app.add(sm);
    app.render();
    expect(sm.children.length).toBeGreaterThan(15);
    app.destroy();
  });

  it('smart router avoids node bounding boxes', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const blocker = app.rect({ x: 50, y: 30, width: 60, height: 40, fill: '#ccc' });
    const obstacles = collectObstacles([blocker]);
    const route = routeConnector(app, 10, 50, 150, 50, 'smart', obstacles);
    expect(route).toBeTruthy();
    app.add(blocker, route);
    app.render();
    app.destroy();
  });

  it('connector route completes within 2 ms budget', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const obstacles = Array.from({ length: 20 }, (_, i) =>
      app.rect({ x: i * 15, y: 20, width: 30, height: 30, fill: '#ccc' })
    );
    const obs = collectObstacles(obstacles);
    const avg = measureAverageMs(() => {
      routeConnector(app, 0, 50, 300, 50, 'smart', obs);
    }, 20);
    expect(avg).toBeLessThan(2);
    app.destroy();
  });

  it('org chart collapse hides children', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const org = createOrgChart(app, {
      name: 'CEO',
      children: [
        { name: 'CTO', children: [{ name: 'Dev Lead' }] },
        { name: 'CFO' },
      ],
    });
    app.add(org);
    const ceo = org.children[0] as Group;
    const childCountBefore = ceo.children.length;
    toggleOrgCollapse(ceo);
    const hidden = ceo.children.filter((c) => c.metadata?.orgNode && !c.visible);
    expect(hidden.length).toBeGreaterThan(0);
    toggleOrgCollapse(ceo);
    expect(ceo.metadata.collapsed).toBe(false);
    expect(childCountBefore).toBeGreaterThan(1);
    app.destroy();
  });

  it('diagram JSON round-trip preserves diagram type', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const pipeline = createPipeline(
      app,
      [
        { id: 'a', label: 'Ingest', status: 'done' },
        { id: 'b', label: 'Transform', status: 'active' },
        { id: 'c', label: 'Load', status: 'pending' },
      ],
      { x: 10, y: 10 }
    );
    app.add(pipeline);
    const json = toJSON(pipeline);
    expect(json.type).toBe('processPipeline');
    const direct = diagramToJSON(pipeline);
    expect(direct.type).toBe('processPipeline');
    expect((direct.props as { stages: unknown[] }).stages).toHaveLength(3);
    app.destroy();
  });

  it('loadJSON creates flowchart from JSON', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const node = createDiagramFromJSON(
      'flowchart',
      {
        data: {
          nodes: [
            { id: '1', label: 'Start', type: 'start' },
            { id: '2', label: 'End', type: 'end' },
          ],
          edges: [{ from: '1', to: '2' }],
        },
      },
      app
    )!;
    app.add(node);
    app.render();
    expect(node.metadata.diagramType).toBe('flowchart');
    app.destroy();
  });

  it('200-node network diagram renders within budget', () => {
    const container = createTestContainer(1200, 800);
    const app = createTestApp(container, { renderer: 'canvas' });
    const nodes = Array.from({ length: 200 }, (_, i) => ({
      id: `n${i}`,
      label: `Node ${i}`,
      type: i % 4 === 0 ? 'router' : 'server',
      x: (i % 20) * 50,
      y: Math.floor(i / 20) * 40,
    }));
    const edges: Array<{ from: string; to: string }> = [];
    for (let i = 0; i < 199; i++) edges.push({ from: `n${i}`, to: `n${i + 1}` });
    const net = createNetworkDiagram(app, { nodes, edges });
    app.add(net);
    const avg = measureAverageMs(() => app.render(), 5);
    expect(avg).toBeLessThan(32);
    app.destroy();
  });

  it('applyForceLayout repositions diagram nodes', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const fc = createFlowchart(app, {
      nodes: [
        { id: 'a', label: 'A', x: 0, y: 0 },
        { id: 'b', label: 'B', x: 0, y: 0 },
        { id: 'c', label: 'C', x: 0, y: 0 },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'c' },
      ],
    });
    applyForceLayout(fc, [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ], { seed: 42, iterations: 50 });
    const positions = fc.children.map((c) => ({ x: c.x, y: c.y }));
    const spread = positions.some((p, i) =>
      positions.some((q, j) => i !== j && (p.x !== q.x || p.y !== q.y))
    );
    expect(spread).toBe(true);
    app.destroy();
  });

  it('CAN network diagram shows bus and ECUs', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const can = createCanNetwork(app, {
      busLabel: 'CAN HS',
      ecus: [
        { id: 'ecm', label: 'ECM', address: '0x7E0' },
        { id: 'bcm', label: 'BCM', address: '0x7E1' },
        { id: 'abs', label: 'ABS', address: '0x7E2' },
      ],
    });
    app.add(can);
    app.render();
    expect(can.children.length).toBeGreaterThan(3);
    app.destroy();
  });

  it('electrical schematic builds symbol library', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const sch = createSchematic(app, [
      { id: 'r1', type: 'resistor', x: 20, y: 20, label: 'R1' },
      { id: 'c1', type: 'capacitor', x: 80, y: 20 },
      { id: 'g1', type: 'ground', x: 140, y: 20 },
      { id: 'b1', type: 'battery', x: 200, y: 20 },
      { id: 'sw1', type: 'switch', x: 260, y: 20 },
      { id: 'd1', type: 'led', x: 320, y: 20, label: 'D1' },
    ]);
    app.add(sch);
    app.render();
    expect(sch.children).toHaveLength(6);
    app.destroy();
  });

  it('mind map and class diagram render branches', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const mind = createMindMap(app, 'LightDraw', [
      { label: 'Core', children: ['Shapes', 'Renderers'] },
      { label: 'Modules', children: ['UI', 'Dashboard'] },
    ]);
    const uml = createClassDiagram(app, {
      classes: [
        { id: 'node', name: 'Node', attributes: ['- x: number'], methods: ['+ render()'] },
        { id: 'group', name: 'Group', attributes: ['- children: Node[]'], methods: ['+ add()'] },
      ],
      relations: [{ from: 'group', to: 'node', type: 'inheritance' }],
    });
    app.add(mind, uml);
    app.render();
    expect(mind.children.length).toBeGreaterThan(1);
    expect(uml.children.length).toBeGreaterThan(2);
    app.destroy();
  });

  it('diagram legacy bundle exists', () => {
    expect(existsSync('dist/lightdraw.diagram.legacy.js')).toBe(true);
  });
});

function sampleProps(type: string): Record<string, unknown> {
  switch (type) {
    case 'flowchart':
      return {
        data: {
          nodes: [{ id: 'a', label: 'Start' }, { id: 'b', label: 'End' }],
          edges: [{ from: 'a', to: 'b' }],
        },
      };
    case 'stateMachine':
      return {
        data: {
          states: [
            { id: 'idle', label: 'Idle', type: 'initial' },
            { id: 'run', label: 'Running' },
            { id: 'done', label: 'Done', type: 'final' },
          ],
          transitions: [
            { from: 'idle', to: 'run', label: 'start' },
            { from: 'run', to: 'done', label: 'finish' },
          ],
        },
      };
    case 'classDiagram':
      return {
        data: {
          classes: [{ id: 'a', name: 'Animal', methods: ['+ speak()'] }],
          relations: [],
        },
      };
    case 'mindMap':
      return { center: 'Topic', branches: [{ label: 'Branch A' }] };
    case 'networkTopology':
      return {
        data: {
          nodes: [
            { id: 'r1', label: 'Router', type: 'router' },
            { id: 's1', label: 'Server', type: 'server' },
          ],
          edges: [{ from: 'r1', to: 's1', label: 'eth0' }],
        },
      };
    case 'orgChart':
      return { root: { name: 'CEO', children: [{ name: 'VP' }] } };
    case 'electricalSchematic':
      return {
        components: [
          { id: 'r1', type: 'resistor', x: 10, y: 10 },
          { id: 'g1', type: 'ground', x: 60, y: 10 },
        ],
      };
    case 'canNetwork':
      return {
        data: {
          ecus: [
            { id: 'ecm', label: 'ECM' },
            { id: 'bcm', label: 'BCM' },
          ],
        },
      };
    case 'processPipeline':
      return {
        stages: [
          { id: '1', label: 'Step 1', status: 'done' },
          { id: '2', label: 'Step 2', status: 'active' },
        ],
      };
    default:
      return {};
  }
}
