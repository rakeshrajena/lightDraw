/**
 * CAN network flow helpers — virtual edges along the bus so packets can
 * travel ECU → bus rail → ECU (no pairwise wires in the static diagram).
 */
import type { App } from '../App';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
import { findEdgeLayer, findNodeByDiagramId, collectEditableNodes } from './editor/collect';
import { getDiagramState, setDiagramState } from './helpers';
import { getActiveDiagram } from './theme';
import type { DiagramFlowHop } from './flow';

const ECU_W = 96;
/** Distance from ECU card top to bus midline (matches createCanEcuNode tap). */
export const CAN_BUS_TAP = 18;

export function canBusHopPoints(
  from: Node,
  to: Node,
  busY: number
): number[] {
  const ax = from.x + ECU_W / 2;
  const ay = from.y;
  const bx = to.x + ECU_W / 2;
  const by = to.y;
  // Tap up to bus, ride the rail, tap down into the peer
  return [ax, ay, ax, busY, bx, busY, bx, by];
}

function listCanEcus(root: Group): Node[] {
  return collectEditableNodes(root)
    .filter((n) => n.metadata?.diagramId)
    .sort((a, b) => a.x - b.x || a.y - b.y);
}

function inferBusY(ecus: Node[], fallback = 72): number {
  if (ecus.length === 0) return fallback;
  // ECUs sit at busY + CAN_BUS_TAP
  const ys = ecus.map((e) => e.y - CAN_BUS_TAP);
  const avg = ys.reduce((s, y) => s + y, 0) / ys.length;
  return avg;
}

function adjacentHops(ecus: Node[]): DiagramFlowHop[] {
  const hops: DiagramFlowHop[] = [];
  for (let i = 0; i < ecus.length - 1; i++) {
    const a = String(ecus[i].metadata!.diagramId);
    const b = String(ecus[i + 1].metadata!.diagramId);
    hops.push({ from: a, to: b });
    hops.push({ from: b, to: a });
  }
  return hops;
}

/**
 * Ensure an edge layer exists with bus-rail hop polylines for the given hops
 * (or all adjacent ECU pairs when hops omitted — for ambient bus traffic).
 */
export function ensureCanNetworkFlowEdges(
  app: App,
  root: Group,
  hops?: DiagramFlowHop[]
): Group | undefined {
  if (root.metadata?.diagramType !== 'canNetwork') {
    return findEdgeLayer(root);
  }

  const ecus = listCanEcus(root);
  const state = getDiagramState(root);
  const busY =
    typeof state.canBusY === 'number' ? (state.canBusY as number) : inferBusY(ecus);
  setDiagramState(root, { canBusY: busY });

  let edgeLayer = findEdgeLayer(root);
  if (!edgeLayer) {
    edgeLayer = app.group({ zIndex: -5, listening: false }) as Group;
    edgeLayer.metadata.diagramEdgeLayer = true;
    edgeLayer.metadata.canFlowEdgeLayer = true;
    // Keep under ECU cards
    root.add(edgeLayer);
  }

  for (const child of [...edgeLayer.children]) {
    if (child.metadata?.canFlowEdge) {
      edgeLayer.remove(child);
      child.destroy();
    }
  }

  const needed =
    hops && hops.length > 0
      ? hops
      : adjacentHops(ecus);

  const seen = new Set<string>();
  const stroke = getActiveDiagram().canBus;
  const sw = Math.max(1.5, getActiveDiagram().stroke.edgeThin);

  for (const hop of needed) {
    const key = `${hop.from}->${hop.to}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const from = findNodeByDiagramId(root, hop.from);
    const to = findNodeByDiagramId(root, hop.to);
    if (!from || !to) continue;

    const points = canBusHopPoints(from, to, busY);
    const g = app.group({ listening: false }) as Group;
    g.add(
      app.polyline({
        points,
        fill: null,
        stroke,
        strokeWidth: sw,
        opacity: 0.35,
        lineJoin: 'round',
        lineCap: 'round',
        listening: false,
        metadata: { edgeStrokePoly: true },
      })
    );
    g.metadata.canFlowEdge = true;
    g.metadata.edgeFrom = hop.from;
    g.metadata.edgeTo = hop.to;
    g.metadata.edgeId = `can_${hop.from}_${hop.to}`;
    g.metadata.edgePoints = points.slice();
    g.metadata.edgeStroke = stroke;
    g.metadata.edgeStrokeWidth = sw;
    g.metadata.edgeArrowEnd = 'none';
    g.metadata.edgeArrowStart = 'none';
    g.metadata.edgeStyle = 'orthogonal';
    edgeLayer.add(g);
  }

  return edgeLayer;
}
