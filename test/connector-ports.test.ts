import { describe, it, expect, afterEach } from 'vitest';
import { createFlowchart } from '../src/diagram/definitions';
import { getConnectorAnchors, getNodeBoxInParent, pickConnectionSides } from '../src/diagram/coords';
import { collectEditableNodes } from '../src/diagram/editor/collect';
import { rerouteDiagramEdges } from '../src/diagram/editor/reroute';
import { findEdgeLayer } from '../src/diagram/editor/collect';
import { createTestApp, createTestContainer } from './helpers';

describe('Connector ports follow drag', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('anchors sit on node edges and move with node.x/y', () => {
    const container = createTestContainer(800, 500);
    const app = createTestApp(container, { renderer: 'canvas', width: 800, height: 500 });
    const diagram = createFlowchart(
      app,
      {
        nodes: [
          { id: 'a', label: 'A', x: 100, y: 40 },
          { id: 'b', label: 'B', x: 100, y: 200 },
        ],
        edges: [{ from: 'a', to: 'b' }],
      },
      { width: 800, height: 500 }
    );
    app.add(diagram);
    app.render();

    const [a, b] = collectEditableNodes(diagram);
    expect(a.metadata.diagramCardWidth).toBeGreaterThan(0);

    const before = getConnectorAnchors(a, b, diagram);
    // Vertical stack → bottom of A to top of B
    const boxA = getNodeBoxInParent(a, diagram);
    expect(before.y1).toBeCloseTo(boxA.y + boxA.height, 1);
    expect(before.y2).toBeCloseTo(getNodeBoxInParent(b, diagram).y, 1);

    a.x = 260;
    a.y = 80;
    a.markDirty();
    const after = getConnectorAnchors(a, b, diagram);
    expect(after.x1).not.toBeCloseTo(before.x1, 0);

    const boxAfter = getNodeBoxInParent(a, diagram);
    const onEdge =
      Math.abs(after.y1 - boxAfter.y) < 1 ||
      Math.abs(after.y1 - (boxAfter.y + boxAfter.height)) < 1 ||
      Math.abs(after.x1 - boxAfter.x) < 1 ||
      Math.abs(after.x1 - (boxAfter.x + boxAfter.width)) < 1;
    expect(onEdge).toBe(true);

    const sides = pickConnectionSides(
      getNodeBoxInParent(a, diagram),
      getNodeBoxInParent(b, diagram)
    );
    expect(['left', 'right', 'top', 'bottom']).toContain(sides.fromSide);
    expect(['left', 'right', 'top', 'bottom']).toContain(sides.toSide);

    rerouteDiagramEdges(app, diagram);
    const layer = findEdgeLayer(diagram);
    expect(layer?.children.length).toBeGreaterThan(0);
    app.destroy();
  });
});
