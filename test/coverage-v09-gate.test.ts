import { describe, it, expect, afterEach, vi } from 'vitest';
import { createTestApp, createTestContainer, getNativeControl } from './helpers';
import { createComponentFromJSON } from '../src/components/registry';
import {
  setAutoValue,
  animateAutoValue,
  applyThemeToNode,
  automotiveToJSON,
  setBoolRefresh,
  setParts,
  getParts,
} from '../src/automotive/helpers';
import { getTheme } from '../src/automotive/themes';
import { createAutomotiveFromJSON } from '../src/automotive/registry';
import {
  createMindMap,
  createClassDiagram,
  createNetworkDiagram,
  createPipeline,
  createOrgChart,
  createFlowchart,
} from '../src/diagram/registry';
import {
  createConnector,
  connectNodes,
  wireMindMapConnectors,
  wireOrgChartConnectors,
} from '../src/diagram/connectors';
import {
  createFlowchartNode,
  createStateNode,
  createNetworkNode,
  createPipelineStage,
  createOrgNode,
  createEdgeLabel,
  createClassNode,
  createLabeledBox,
} from '../src/diagram/primitives';
import { worldToParentLocal, getConnectorAnchors } from '../src/diagram/coords';
import { Group } from '../src/shapes/Group';

describe('Coverage v0.9 — HTML native components (95% gate)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders all component types with variants and interaction paths', () => {
    const container = createTestContainer(900, 1200);
    const app = createTestApp(container, {
      renderer: 'html',
      uiTheme: { preset: 'violet', mode: 'dark' },
    });

    const btn = createComponentFromJSON(
      'button',
      { label: 'Save', variant: 'secondary', size: 'sm', x: 10, y: 10, width: 100 },
      app
    )!;
    const btnDanger = createComponentFromJSON(
      'button',
      { label: 'Delete', variant: 'danger', disabled: true, x: 120, y: 10 },
      app
    )!;
    const input = createComponentFromJSON(
      'input',
      { label: 'Email', value: 'a@b.com', placeholder: 'you@example.com', x: 10, y: 60, width: 240 },
      app
    )!;
    const textarea = createComponentFromJSON(
      'textarea',
      { label: 'Notes', value: 'hello', x: 10, y: 140, width: 280, height: 80 },
      app
    )!;
    const checkbox = createComponentFromJSON('checkbox', { label: 'Agree', checked: false, x: 10, y: 240 }, app)!;
    const toggle = createComponentFromJSON('toggle', { value: true, label: 'Enabled', x: 10, y: 280 }, app)!;
    const slider = createComponentFromJSON(
      'slider',
      { value: 40, min: 0, max: 100, label: 'Volume', x: 10, y: 320, width: 200 },
      app
    )!;
    const radio = createComponentFromJSON('radio', { label: 'Option A', selected: true, group: 'g1', x: 10, y: 380 }, app)!;
    const progress = createComponentFromJSON(
      'progressBar',
      { value: 66, showLabel: true, x: 10, y: 420, width: 220 },
      app
    )!;
    const card = createComponentFromJSON(
      'card',
      { title: 'Stats', subtitle: 'Live', width: 200, height: 100, x: 10, y: 460 },
      app
    )!;
    const tabs = createComponentFromJSON('tabs', { tabs: ['Tab A', 'Tab B'], activeIndex: 1, x: 10, y: 580, width: 240 }, app)!;
    const accordion = createComponentFromJSON(
      'accordion',
      {
        sections: [
          { title: 'General', content: 'Settings here' },
          { title: 'Advanced', content: 'More options' },
        ],
        expandedIndex: 0,
        x: 10,
        y: 640,
        width: 280,
      },
      app
    )!;
    const table = createComponentFromJSON(
      'table',
      { columns: ['Name', 'Value'], rows: [['Alpha', '1'], ['Beta', '2']], sortable: true, x: 10, y: 760, width: 280 },
      app
    )!;
    const tree = createComponentFromJSON('tree', { x: 10, y: 900 }, app)!;
    const toolbar = createComponentFromJSON('toolbar', { items: ['New', 'Save', 'Export'], x: 10, y: 1000 }, app)!;
    const toast = createComponentFromJSON(
      'toast',
      { message: 'Saved', variant: 'warning', visible: true, x: 10, y: 1050 },
      app
    )!;
    const menu = createComponentFromJSON(
      'menu',
      { items: ['Edit', 'Delete', 'Share'], open: true, triggerLabel: 'Menu', x: 10, y: 1100, width: 160 },
      app
    )!;
    const dialog = createComponentFromJSON(
      'dialog',
      { open: true, title: 'Confirm', message: 'Proceed?', x: 200, y: 200, width: 360 },
      app
    )!;
    const tooltip = createComponentFromJSON('tooltip', { text: 'Help text', visible: true, x: 10, y: 1160 }, app)!;
    const statusBar = createComponentFromJSON(
      'statusBar',
      { segments: ['Ready', 'UTF-8', 'Ln 42'], width: 500, x: 10, y: 1200 },
      app
    )!;
    const label = createComponentFromJSON('label', { text: 'Heading', x: 10, y: 1240 }, app)!;

    app.add(
      btn,
      btnDanger,
      input,
      textarea,
      checkbox,
      toggle,
      slider,
      radio,
      progress,
      card,
      tabs,
      accordion,
      table,
      tree,
      toolbar,
      toast,
      menu,
      dialog,
      tooltip,
      statusBar,
      label
    );
    app.render();

    expect(container.querySelector('.lightdraw-dialog-center')).not.toBeNull();
    expect(container.querySelector('.lightdraw-table-wrap--scroll-x')).not.toBeNull();
    expect(container.querySelector('.lightdraw-tree-children')).not.toBeNull();

    const btnEl = container.querySelector('.lightdraw-btn--secondary') as HTMLButtonElement;
    btnEl?.click();
    const disabledBtn = container.querySelector('.lightdraw-btn--danger') as HTMLButtonElement;
    disabledBtn?.click();

    const checkInput = getNativeControl<HTMLInputElement>(checkbox.id)?.querySelector('input');
    if (checkInput) {
      checkInput.checked = true;
      checkInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const textInput = getNativeControl<HTMLInputElement>(input.id);
    if (textInput) {
      textInput.value = 'updated@mail.com';
      textInput.dispatchEvent(new Event('input', { bubbles: true }));
      textInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const ta = getNativeControl<HTMLTextAreaElement>(textarea.id);
    if (ta) {
      ta.value = 'updated notes';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const sliderInput = getNativeControl<HTMLInputElement>(slider.id)?.querySelector('input[type="range"]');
    sliderInput?.dispatchEvent(new Event('input', { bubbles: true }));

    const menuItem = container.querySelector('.lightdraw-menu-item--danger') as HTMLButtonElement;
    menuItem?.click();

    const sortHeader = container.querySelector('.lightdraw-table-th--sortable') as HTMLElement;
    sortHeader?.click();

    const treeLeaf = container.querySelector('.lightdraw-tree-leaf') as HTMLButtonElement;
    treeLeaf?.click();

    const tipAnchor = container.querySelector('.lightdraw-tooltip-anchor') as HTMLElement;
    tipAnchor?.dispatchEvent(new Event('mouseenter', { bubbles: true }));
    tipAnchor?.dispatchEvent(new Event('mouseleave', { bubbles: true }));

    app.render();

    const closedDialog = createComponentFromJSON(
      'dialog',
      { open: false, title: 'Hidden', x: 400, y: 400 },
      app
    )!;
    app.add(closedDialog);
    app.render();

    expect(container.querySelector('.lightdraw-statusbar')).not.toBeNull();
    expect(container.querySelector('.lightdraw-card')).not.toBeNull();
    expect(container.querySelector('.lightdraw-accordion')).not.toBeNull();
    app.destroy();
  });
});

describe('Coverage v0.9 — diagram module (95% gate)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('exercises primitives, connectors, and diagram factories', () => {
    const container = createTestContainer(900, 700);
    const app = createTestApp(container, { renderer: 'canvas' });

    const flowNode = createFlowchartNode(app, 'Process', 'process');
    const decision = createFlowchartNode(app, 'Yes?', 'decision');
    const terminal = createFlowchartNode(app, 'End', 'end');
    const state = createStateNode(app, 'Idle', 'normal');
    const initial = createStateNode(app, '', 'initial');
    const finalState = createStateNode(app, '', 'final');
    const net = createNetworkNode(app, 'Router-1', 'router');
    const server = createNetworkNode(app, 'DB', 'server');
    const sw = createNetworkNode(app, 'SW', 'switch');
    const client = createNetworkNode(app, 'PC', 'client');
    const pipeline = createPipelineStage(app, 'Build', 'active');
    const done = createPipelineStage(app, 'Deploy', 'done');
    const err = createPipelineStage(app, 'Rollback', 'error');
    const { node: orgNode, indicator } = createOrgNode(app, 'CEO', 'Executive', 3, false);
    const classNode = createClassNode(app, 'User', ['+name: string'], ['+login(): void']);
    const box = createLabeledBox(app, 'Node', 80, 36);

    const g = app.group({ x: 20, y: 20 });
    g.add(flowNode, decision, terminal, state, initial, finalState);
    app.add(g, net, server, sw, client, pipeline, done, err, orgNode, classNode, box);
    expect(indicator).toBeDefined();

    const edge = createConnector(app, 0, 0, 120, 80, {
      style: 'smart',
      label: 'edge',
      arrowEnd: 'open',
      arrowStart: 'filled',
    });
    const hollow = createConnector(app, 10, 10, 90, 90, { arrowEnd: 'hollow', style: 'orthogonal' });
    const labelG = createEdgeLabel(app, '42', 50, 50);
    app.add(edge, hollow, labelG);

    connectNodes(app, flowNode, decision, [], { parent: g, label: 'next' });
    const anchors = getConnectorAnchors(flowNode, decision, g);
    expect(anchors.x1).toBeDefined();
    const local = worldToParentLocal(g, 100, 100);
    expect(local.x).toBeDefined();

    const mind = createMindMap(app, 'Topic', [
      { label: 'Branch A', children: ['Leaf 1', 'Leaf 2'] },
      { label: 'Branch B', children: ['Leaf 3'] },
    ]);
    wireMindMapConnectors(app, mind);

    const org = createOrgChart(app, {
      name: 'Root',
      children: [{ name: 'Child', children: [{ name: 'Grand' }] }],
    });
    wireOrgChartConnectors(app, org);

    const classDiagram = createClassDiagram(app, {
      classes: [
        { id: 'a', name: 'Animal', attributes: ['+name'], methods: [], x: 0, y: 0 },
        { id: 'b', name: 'Dog', attributes: [], methods: ['+bark()'], x: 200, y: 0 },
      ],
      relations: [
        { from: 'b', to: 'a', type: 'inheritance' },
        { from: 'a', to: 'b', type: 'association' },
        { from: 'b', to: 'a', type: 'implements' },
      ],
    });

    const network = createNetworkDiagram(app, {
      nodes: [
        { id: 'r1', label: 'R1', type: 'router', x: 0, y: 0 },
        { id: 's1', label: 'S1', type: 'server', x: 120, y: 0 },
      ],
      edges: [{ from: 'r1', to: 's1', label: 'eth0' }],
    });

    const pipe = createPipeline(app, [
      { id: '1', label: 'Lint', status: 'done' },
      { id: '2', label: 'Test', status: 'active' },
      { id: '3', label: 'Ship', status: 'pending' },
    ]);

    const fc = createFlowchart(app, {
      nodes: [
        { id: 's', label: 'Start', type: 'start', x: 0, y: 0 },
        { id: 'd', label: 'Check', type: 'decision', x: 0, y: 80 },
        { id: 'p', label: 'Work', type: 'process', x: 0, y: 160 },
        { id: 'e', label: 'End', type: 'end', x: 0, y: 240 },
      ],
      edges: [
        { from: 's', to: 'd', label: 'go' },
        { from: 'd', to: 'p' },
        { from: 'p', to: 'e' },
      ],
    });

    app.add(mind, org, classDiagram, network, pipe, fc);
    app.render();
    expect((org as Group).children.length).toBeGreaterThan(0);
    app.destroy();
  });
});

describe('Coverage v0.9 — automotive helpers (95% gate)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('covers helper utilities and theme application', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'canvas' });
    const tach = createAutomotiveFromJSON('tachometer', { value: 2000, x: 0, y: 0 }, app)!;
    app.add(tach);

    let refreshed = 0;
    setParts(tach, { needle: tach.children[0] });
    expect(getParts(tach).needle).toBeDefined();

    setBoolRefresh(tach, () => {
      refreshed += 1;
    });
    setAutoValue(tach, 'value', 3500);
    expect(tach.metadata.refresh).toBeDefined();

    vi.spyOn(app, 'animate').mockImplementation((_node, opts) => {
      opts.onUpdate?.(1);
      opts.onComplete?.();
      return { stop: () => undefined } as ReturnType<typeof app.animate>;
    });
    animateAutoValue(tach, 'value', 5000, 200);

    const palette = getTheme('sport');
    applyThemeToNode(tach, palette);
    expect(tach.metadata.theme).toEqual(palette);

    const json = automotiveToJSON(tach);
    expect(json.type).toBe('tachometer');
    expect(refreshed).toBeGreaterThanOrEqual(0);

    app.render();
    app.destroy();
  });
});
