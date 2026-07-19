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
} from '../helpers';
import {
  createNetworkNode,
} from '../primitives';
import { collectObstacles } from '../router';
import { connectNodes } from '../connectors';
import { listNetworkIconKinds } from '../networkIcons';
import type { DiagramData } from '../types';

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
    nodeGroup.metadata = { ...nodeGroup.metadata, diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
    group.add(nodeGroup);
  }

  const allNodes = [...nodeMap.values()];
  const obstacles = collectObstacles(allNodes);
  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  edgeLayer.metadata.diagramEdgeLayer = true;
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: group,
        obstacleNodes: allNodes,
        stroke: getActiveDiagram().edge,
        glowColor: getActiveDiagram().edgeGlow,
        glow: false,
        strokeWidth: edgeWidth,
        label: edge.label,
        cornerRadius: 12,
      })
    );
  }
  group.add(edgeLayer);

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
