/**
 * Diagram builder — flowchart.
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
  createFlowchartNode,
} from '../primitives';
import { collectObstacles } from '../router';
import { connectNodes } from '../connectors';
import type { DiagramData } from '../types';

/** Create a flowchart from node/edge data */
export function createFlowchart(app: App, data: DiagramData, options: NodeOptions = {}): Group {
  const group = createDiagramGroup(app, 'flowchart', { ...options, data }, { name: 'flowchart' });
  const { nodes, edges } = normalizeDiagramData(data);
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(getActiveDiagram().stroke.edge, strokeCtx);
  autoLayoutNodesResponsive(nodes, canvas.width, canvas.height, 128, 52);
  const nodeMap = new Map<string, Node>();

  for (const n of nodes) {
    const nodeGroup = createFlowchartNode(app, n.label, n.type ?? 'process');
    nodeGroup.x = n.x ?? 0;
    nodeGroup.y = n.y ?? 0;
    nodeGroup.metadata = { ...nodeGroup.metadata, diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
  }

  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  edgeLayer.metadata.diagramEdgeLayer = true;
  const allNodes = [...nodeMap.values()];
  const obstacles = collectObstacles(allNodes);
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;
    edgeLayer.add(
      connectNodes(app, fromNode, toNode, obstacles, {
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

  for (const nodeGroup of nodeMap.values()) {
    group.add(nodeGroup);
  }

  return group;
}
