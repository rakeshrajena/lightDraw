/**
 * Diagram builder — network.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { Node } from '../../Node';
import type { NodeOptions } from '../../types';
import { resolveStrokeWidth, strokeContextForCanvas, getActiveDiagram } from '../theme';
import {
  autoLayoutNodesResponsive,
  createDiagramGroup,
  normalizeDiagramData,
  readCanvasSize,
  separateOverlappingNodes,
} from '../helpers';
import {
  createNetworkNode,
} from '../primitives';
import { collectObstacles } from '../router';
import { connectNodePairs } from '../connectors';
import { listNetworkIconKinds } from '../networkIcons';
import type { DiagramData } from '../types';
import { maybeApplyDiagramFlow } from '../flow';

/** Create network topology diagram */
export function createNetworkDiagram(
  app: App,
  data: DiagramData,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'networkTopology', { ...options, data }, { name: 'network' });
  const { nodes, edges } = normalizeDiagramData(data);
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(getActiveDiagram().stroke.edge, strokeCtx);
  autoLayoutNodesResponsive(nodes, canvas.width, canvas.height, 100, 72);
  const nodeMap = new Map<string, Node>();

  for (const n of nodes) {
    const nodeGroup = createNetworkNode(app, n.label, n.type ?? 'default');
    nodeGroup.x = n.x ?? 0;
    nodeGroup.y = n.y ?? 0;
    if (typeof n.rotation === 'number') nodeGroup.rotation = n.rotation;
    nodeGroup.metadata = { ...nodeGroup.metadata, diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
    group.add(nodeGroup);
  }

  separateOverlappingNodes([...nodeMap.values()], {
    gap: 20,
    canvasW: canvas.width,
    canvasH: canvas.height,
  });

  const allNodes = [...nodeMap.values()];
  const obstacles = collectObstacles(allNodes);
  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  edgeLayer.metadata.diagramEdgeLayer = true;
  const pairs = [];
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) continue;
    pairs.push({
      from,
      to,
      options: {
        label: edge.label,
        edgeId: `${edge.from}->${edge.to}`,
        fromId: edge.from,
        toId: edge.to,
      },
    });
  }
  for (const g of connectNodePairs(app, pairs, {
    parent: group,
    obstacleNodes: allNodes,
    obstacles,
    stroke: getActiveDiagram().edge,
    glowColor: getActiveDiagram().edgeGlow,
    glow: false,
    strokeWidth: edgeWidth,
    cornerRadius: 10,
    style: 'smart',
  })) {
    edgeLayer.add(g);
  }
  group.add(edgeLayer);

  maybeApplyDiagramFlow(app, group, options as Record<string, unknown>);
  return group;
}

/**
 * Grid catalog of standard network icons (one tile per canonical kind).
 * Pass `category` to filter (e.g. 'security', 'iot').
 */
export function createNetworkIconCatalog(
  app: App,
  options: NodeOptions & { category?: string; columns?: number } = {}
): Group {
  const category = options.category;
  const kinds = listNetworkIconKinds().filter((m) => !category || m.category === category);
  const columns = Math.max(4, options.columns ?? 8);
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const group = createDiagramGroup(
    app,
    'networkIconCatalog',
    { ...options, category },
    { name: 'networkCatalog' }
  );

  const gapX = 104;
  const gapY = 100;
  const startX = 20;
  const startY = 12;
  kinds.forEach((meta, i) => {
    const col = i % columns;
    const row = Math.floor(i / columns);
    const node = createNetworkNode(app, meta.label, meta.kind);
    node.x = startX + col * gapX;
    node.y = startY + row * gapY;
    node.metadata = { ...node.metadata, diagramId: meta.kind };
    group.add(node);
  });

  // Keep canvas size metadata for fitToBounds
  void canvas;
  return group;
}
