import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Diagram } from '../../src/diagram';
import { installDiagramEditor } from '../../src/diagram/editor';
import { findEdgeLayer, findNodeByDiagramId } from '../../src/diagram/editor/collect';
import { rerouteDiagramEdges } from '../../src/diagram/editor/reroute';
import { arrowHeadPoints } from '../../src/diagram/connectors';
import { createTestApp, createTestContainer } from '../helpers';
import type { App } from '../../src/App';
import type { Group } from '../../src/shapes/Group';

/** Demo flowchart matching examples/demo-diagram.html */
function demoFlow(app: App) {
  return Diagram.flowchart(
    app,
    {
      nodes: [
        { id: 'start', label: 'Start', type: 'start', x: 384, y: 24 },
        { id: 'check', label: 'Valid input?', type: 'decision', x: 384, y: 110 },
        { id: 'process', label: 'Process data', x: 384, y: 210 },
        { id: 'end', label: 'Complete', type: 'end', x: 384, y: 300 },
      ],
      edges: [
        { from: 'start', to: 'check' },
        { from: 'check', to: 'process', label: 'yes' },
        { from: 'check', to: 'end', label: 'no' },
        { from: 'process', to: 'end' },
      ],
    },
    { width: 800, height: 500 }
  );
}

describe('diagram connector review (demo flowchart)', () => {
  let app: App;

  beforeEach(() => {
    const container = createTestContainer(800, 500);
    app = createTestApp(container, { renderer: 'html', width: 800, height: 500 });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders yes and no labels on decision branches', () => {
    const root = demoFlow(app);
    app.add(root);
    const layer = findEdgeLayer(root as Group)!;
    const labels = layer.children
      .map((c) => c.metadata?.edgeLabel as string | undefined)
      .filter(Boolean);
    expect(labels).toContain('yes');
    expect(labels).toContain('no');
  });

  it('arrowheads are large enough to see', () => {
    const pts = arrowHeadPoints(100, 50, 0, 14);
    // Tip + two base corners; base width should be meaningful
    const tipX = pts[0];
    const ly = pts[3];
    const ry = pts[5];
    expect(Math.abs(ly - ry)).toBeGreaterThan(10);
    expect(tipX).toBe(100);
  });

  it('label anchor sits near source (not buried under target)', () => {
    const root = demoFlow(app);
    app.add(root);
    const layer = findEdgeLayer(root as Group)!;
    const noEdge = layer.children.find((c) => c.metadata?.edgeLabel === 'no');
    expect(noEdge).toBeTruthy();
    const process = findNodeByDiagramId(root as Group, 'process')!;
    const pw = (process.metadata?.diagramCardWidth as number) ?? 120;
    const ph = (process.metadata?.diagramCardHeight as number) ?? 48;

    // Find the label pill position (roundedRect child of nested group)
    let labelX = NaN;
    let labelY = NaN;
    const walk = (n: Group): void => {
      for (const c of n.children) {
        if (c.type === 'text' && 'text' in c && (c as { text: string }).text === 'no') {
          labelX = c.x;
          labelY = c.y;
        }
        if (c.type === 'group') walk(c as Group);
      }
    };
    walk(noEdge as Group);
    expect(Number.isFinite(labelX)).toBe(true);

    const insideProcess =
      labelX > process.x + 4 &&
      labelX < process.x + pw - 4 &&
      labelY > process.y + 4 &&
      labelY < process.y + ph - 4;
    expect(insideProcess).toBe(false);
  });

  it('moving the decision reassigns ports without stacking', () => {
    const root = demoFlow(app);
    app.add(root);
    const check = findNodeByDiagramId(root as Group, 'check')!;
    check.x = 120;
    check.y = 160;
    rerouteDiagramEdges(app, root as Group, undefined, {
      clearWaypointsForNodes: ['check'],
    });

    const layer = findEdgeLayer(root as Group)!;
    const fromCheck = layer.children.filter((c) => c.metadata?.edgeFrom === 'check');
    expect(fromCheck.length).toBe(2);
    const a = fromCheck[0].metadata.edgePoints as number[];
    const b = fromCheck[1].metadata.edgePoints as number[];
    expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThan(4);

    // Labels survive reroute
    const labels = fromCheck.map((c) => c.metadata?.edgeLabel).filter(Boolean);
    expect(labels).toContain('yes');
    expect(labels).toContain('no');
  });

  it('editor drag-end style reroute keeps edges selectable', () => {
    const root = demoFlow(app);
    app.add(root);
    app.render();
    const editor = installDiagramEditor(app, root as Group, { tool: 'select' });
    const check = findNodeByDiagramId(root as Group, 'check')!;
    check.x += 80;
    rerouteDiagramEdges(app, root as Group, undefined, {
      clearWaypointsForNodes: ['check'],
    });
    editor.reroute();
    const layer = findEdgeLayer(root as Group)!;
    expect(layer.children.length).toBeGreaterThanOrEqual(4);
    editor.destroy();
    app.destroy();
  });
});
