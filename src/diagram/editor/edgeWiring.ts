import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { getConnectorAnchors } from '../coords';

/** Add a wide invisible stroke so connectors receive pointer events. */
export function attachEdgeHitTarget(app: App, edge: Group): void {
  if (edge.metadata?.edgeHitAttached) return;
  const poly = edge.children.find(
    (c) => c.type === 'polyline' && c.metadata?.edgeHitPolyline !== true
  );
  const fromPoly =
    poly && 'points' in poly ? ((poly as { points: number[] }).points ?? []) : [];
  const fromMeta = (edge.metadata?.edgePoints as number[] | undefined) ?? [];
  const points = fromPoly.length >= 4 ? fromPoly : fromMeta;
  if (points.length < 4) return;

  const hit = app.polyline({
    points: points.slice(),
    fill: null,
    stroke: 'rgba(0,0,0,0.001)',
    strokeWidth: 18,
    lineJoin: 'round',
    lineCap: 'round',
    listening: true,
  });
  hit.metadata.edgeHitPolyline = true;
  edge.add(hit);
  edge.listening = true;
  // Parent edge layer is created with listening:false so wires don't steal node
  // hits by default — enable it once edges need pointer events.
  const layer = edge.parent as Group | null;
  if (layer?.metadata?.diagramEdgeLayer) layer.listening = true;
  edge.metadata.edgeHitAttached = true;
}

export function edgeAnchorPoint(
  root: Group,
  from: Group,
  to: Group,
  end: 'from' | 'to'
): { x: number; y: number } {
  const anchors = getConnectorAnchors(from, to, root);
  if (end === 'from') return { x: root.x + anchors.x1, y: root.y + anchors.y1 };
  return { x: root.x + anchors.x2, y: root.y + anchors.y2 };
}
