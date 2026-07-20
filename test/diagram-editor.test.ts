import { describe, it, expect, afterEach } from 'vitest';
import { createFlowchart, createOrgChart } from '../src/diagram/definitions';
import {
  collectEditableNodes,
  collectEdgesFromLayer,
  findEdgeLayer,
  findNodeByDiagramId,
} from '../src/diagram/editor/collect';
import { installDiagramEditor, uninstallDiagramEditor } from '../src/diagram/editor';
import { rerouteDiagramEdges, syncPositionsToState } from '../src/diagram/editor/reroute';
import { attachNodeHitTarget } from '../src/diagram/editor/hitTargets';
import { fitDiagramToBounds } from '../src/diagram/helpers';
import { createTestApp, createTestContainer } from './helpers';

function dispatchPointer(
  el: HTMLElement,
  type: string,
  clientX: number,
  clientY: number
): void {
  el.dispatchEvent(
    new MouseEvent(type, { bubbles: true, clientX, clientY, button: 0 })
  );
}

describe('Diagram editor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('attaches hit targets and collects editable nodes', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 40, y: 40 },
          { id: 'b', label: 'B', x: 200, y: 40 },
        ],
        edges: [{ from: 'a', to: 'b', label: 'link' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();

    const nodes = collectEditableNodes(diagram);
    expect(nodes.length).toBe(2);
    attachNodeHitTarget(app, nodes[0]);
    expect(nodes[0].draggable).toBe(true);
    expect(nodes[0].children.some((c) => c.metadata?.isDiagramHitTarget)).toBe(true);
    app.destroy();
  });

  it('tags edges and reroutes after node move', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 40, y: 40 },
          { id: 'b', label: 'B', x: 200, y: 40 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();

    const edgeLayer = findEdgeLayer(diagram);
    expect(edgeLayer).toBeDefined();
    const edgesBefore = collectEdgesFromLayer(edgeLayer!);
    expect(edgesBefore.length).toBe(1);
    expect(edgesBefore[0].from).toBe('a');

    const nodes = collectEditableNodes(diagram);
    nodes[0].x += 50;
    rerouteDiagramEdges(app, diagram);
    app.render();

    const edgesAfter = collectEdgesFromLayer(edgeLayer!);
    expect(edgesAfter.length).toBe(1);
    app.destroy();
  });

  it('drag-style reroute clears bends and picks free ports by new position', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'hub', label: 'Hub', x: 300, y: 40 },
          { id: 'left', label: 'Left', x: 80, y: 200 },
          { id: 'right', label: 'Right', x: 520, y: 200 },
        ],
        edges: [
          { from: 'hub', to: 'left', label: 'L' },
          { from: 'hub', to: 'right', label: 'R' },
        ],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();

    const edgeLayer = findEdgeLayer(diagram)!;
    // Simulate a manual bend stuck on one edge
    const first = edgeLayer.children.find((c) => c.metadata?.edgeLabel === 'L');
    expect(first).toBeTruthy();
    first!.metadata.edgeWaypoints = [{ x: 200, y: 120 }];

    // Move hub far right so both peers should use left-ish / distinct ports
    const hub = findNodeByDiagramId(diagram, 'hub')!;
    hub.x = 600;
    hub.y = 40;

    rerouteDiagramEdges(app, diagram, undefined, {
      clearWaypointsForNodes: ['hub'],
    });
    app.render();

    const edges = edgeLayer.children.filter((c) => c.metadata?.edgePoints);
    expect(edges.length).toBe(2);
    for (const e of edges) {
      expect(e.metadata?.edgeWaypoints).toBeUndefined();
    }
    const a = edges[0].metadata.edgePoints as number[];
    const b = edges[1].metadata.edgePoints as number[];
    // Starts should differ (free ports / fan), not stacked on one point
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(4);
    app.destroy();
  });

  it('installDiagramEditor wires without error', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'Start', type: 'start', x: 100, y: 40 },
          { id: 'b', label: 'End', type: 'end', x: 100, y: 160 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();
    const editor = installDiagramEditor(app, diagram, { tool: 'select' });
    expect(editor.getTool()).toBe('select');
    editor.selectNode('a');
    expect(editor.getSelectedNodeId()).toBe('a');
    uninstallDiagramEditor(diagram);
    app.destroy();
  });

  it('arrange mode enables drag without connect tool', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 40, y: 40 },
          { id: 'b', label: 'B', x: 200, y: 40 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();
    const editor = installDiagramEditor(app, diagram, { mode: 'arrange' });
    expect(editor.getTool()).toBe('select');
    editor.setTool('connect');
    expect(editor.getTool()).toBe('select');
    const nodes = collectEditableNodes(diagram);
    expect(nodes.every((n) => n.draggable)).toBe(true);
    editor.selectNode('a');
    app.render();
    const overlay = app.stage.children.find((c) => c.metadata?.diagramEditorOverlay) as
      | { children: Array<{ metadata?: Record<string, unknown> }> }
      | undefined;
    const resizeHandles =
      overlay?.children.filter((c) => typeof c.metadata?.resizeHandle === 'string') ?? [];
    expect(resizeHandles.length).toBe(8);
    const rotateHandles =
      overlay?.children.filter((c) => c.metadata?.rotateHandle === true) ?? [];
    expect(rotateHandles.length).toBe(1);
    uninstallDiagramEditor(diagram);
    app.destroy();
  });

  it('applies JSON rotation on flowchart symbols and persists via sync', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 40, y: 40, rotation: 45 },
          { id: 'b', label: 'B', x: 200, y: 40 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    const a = findNodeByDiagramId(diagram, 'a')!;
    expect(a.rotation).toBe(45);
    a.rotation = 90;
    syncPositionsToState(diagram);
    const state = diagram.metadata.diagramState as {
      data: { nodes: Array<{ id: string; rotation?: number }> };
    };
    expect(state.data.nodes.find((n) => n.id === 'a')?.rotation).toBe(90);
    app.destroy();
  });

  it('arrange mode hit-tests wires so bend points can be added', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 40, y: 40 },
          { id: 'b', label: 'B', x: 280, y: 40 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();
    installDiagramEditor(app, diagram, { mode: 'arrange', allowBendPoints: true });
    app.render();

    const edgeLayer = findEdgeLayer(diagram)!;
    expect(edgeLayer.listening).toBe(true);

    const edge = edgeLayer.children.find((c) => c.metadata?.edgeFrom && c.metadata?.edgeTo)!;
    expect(edge.listening).toBe(true);
    expect(edge.children.some((c) => c.metadata?.edgeHitPolyline)).toBe(true);

    const pts = (edge.metadata?.edgePoints as number[]) ?? [];
    expect(pts.length).toBeGreaterThanOrEqual(4);
    const midX = (pts[0] + pts[pts.length - 2]) / 2;
    const midY = (pts[1] + pts[pts.length - 1]) / 2;
    const worldX = diagram.x + midX;
    const worldY = diagram.y + midY;

    const hit = app.hitTest(worldX, worldY);
    expect(hit).not.toBeNull();
    let n = hit!.node as { parent?: typeof hit.node; metadata?: Record<string, unknown> };
    let foundEdge = false;
    while (n) {
      if (n.metadata?.edgeFrom || n.metadata?.edgeHitPolyline) {
        foundEdge = true;
        break;
      }
      n = n.parent as typeof n;
    }
    expect(foundEdge).toBe(true);

    const el = app['renderer'].getElement() as HTMLElement;
    const screen = app.camera.worldToScreen(worldX, worldY);
    dispatchPointer(el, 'dblclick', screen.x, screen.y);
    app.render();

    const rebuilt = findEdgeLayer(diagram)!.children.find(
      (c) => c.metadata?.edgeFrom === 'a' && c.metadata?.edgeTo === 'b'
    );
    const waypoints = (rebuilt?.metadata?.edgeWaypoints as Array<{ x: number; y: number }>) ?? [];
    expect(waypoints.length).toBeGreaterThanOrEqual(1);

    uninstallDiagramEditor(diagram);
    app.destroy();
  });

  it('deletes a selected edge', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 40, y: 40 },
          { id: 'b', label: 'B', x: 200, y: 40 },
          { id: 'c', label: 'C', x: 360, y: 40 },
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
    const editor = installDiagramEditor(app, diagram);
    const edgeLayer = findEdgeLayer(diagram)!;
    const firstEdge = collectEdgesFromLayer(edgeLayer)[0];
    editor.selectEdge(firstEdge.id);
    editor.deleteSelectedEdge();
    expect(collectEdgesFromLayer(edgeLayer).length).toBe(1);
    uninstallDiagramEditor(diagram);
    app.destroy();
  });

  it('tags org chart edges for rerouting', () => {
    const container = createTestContainer(900, 520);
    const app = createTestApp(container, { renderer: 'canvas', width: 900, height: 520 });
    const diagram = createOrgChart(
      app,
      {
        name: 'CEO',
        children: [{ name: 'CTO', children: [{ name: 'Engineer' }] }],
      },
      { width: 900, height: 520 }
    );
    app.add(diagram);
    app.render();
    const edgeLayer = findEdgeLayer(diagram);
    expect(edgeLayer).toBeDefined();
    const edges = collectEdgesFromLayer(edgeLayer!);
    expect(edges.length).toBeGreaterThan(0);
    expect(edges[0].from).toBe('CEO');
    app.destroy();
  });

  it('hit-tests editable nodes after editor install', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 80, y: 80 },
          { id: 'b', label: 'B', x: 280, y: 80 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();
    installDiagramEditor(app, diagram);
    app.render();

    const nodeA = findNodeByDiagramId(diagram, 'a')!;
    expect(nodeA.draggable).toBe(true);
    expect(nodeA.children.some((c) => c.metadata?.isDiagramHitTarget)).toBe(true);

    let found = false;
    for (let wx = 0; wx < 800; wx += 8) {
      for (let wy = 0; wy < 500; wy += 8) {
        const h = app.hitTest(wx, wy);
        if (h?.node?.metadata?.isDiagramHitTarget || h?.node?.metadata?.hitTargetFor) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    expect(found).toBe(true);
    uninstallDiagramEditor(diagram);
    app.destroy();
  });

  it('drags nodes via pointer events', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 80, y: 80 },
          { id: 'b', label: 'B', x: 280, y: 80 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();
    fitDiagramToBounds(diagram, 800, 500, 24);
    installDiagramEditor(app, diagram);
    app.render();

    const nodeA = findNodeByDiagramId(diagram, 'a')!;
    const startX = nodeA.x;
    const startY = nodeA.y;
    const el = app['renderer'].getElement() as HTMLElement;

    let worldX = 0;
    let worldY = 0;
    let found = false;
    for (let wx = 0; wx < 800; wx += 4) {
      for (let wy = 0; wy < 500; wy += 4) {
        const h = app.hitTest(wx, wy);
        if (h?.node?.metadata?.hitTargetFor === 'a') {
          worldX = wx;
          worldY = wy;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    expect(found).toBe(true);

    const screen = app.camera.worldToScreen(worldX, worldY);
    dispatchPointer(el, 'mousedown', screen.x, screen.y);
    dispatchPointer(el, 'mousemove', screen.x + 40, screen.y + 20);
    dispatchPointer(el, 'mouseup', screen.x + 40, screen.y + 20);
    app.render();

    expect(nodeA.x).not.toBe(startX);
    expect(nodeA.y).not.toBe(startY);
    uninstallDiagramEditor(diagram);
    app.destroy();
  });
});
