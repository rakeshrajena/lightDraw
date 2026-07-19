/**
 * Diagram builder — stateMachine.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { Node } from '../../Node';
import type { NodeOptions } from '../../types';
import { resolveStrokeWidth, strokeContextForCanvas, getActiveDiagram } from '../theme';
import {
  autoLayoutNodesResponsive,
  createDiagramGroup,
  readCanvasSize,
} from '../helpers';
import {
  createStateNode,
} from '../primitives';
import { collectObstacles } from '../router';
import { connectNodes } from '../connectors';
import type { StateMachineData } from '../types';

/** Create state machine diagram */
export function createStateMachine(
  app: App,
  data: StateMachineData,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'stateMachine', { ...options, data }, { name: 'stateMachine' });
  const nodeMap = new Map<string, Node>();
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(getActiveDiagram().stroke.edge, strokeCtx);
  const layoutNodes = data.states.map((s) => ({ id: s.id, x: s.x, y: s.y }));
  autoLayoutNodesResponsive(layoutNodes, canvas.width, canvas.height, 64, 64);
  const states = data.states.map((s, i) => ({
    ...s,
    x: s.x ?? layoutNodes[i]?.x ?? 48 + (i % 4) * 110,
    y: s.y ?? layoutNodes[i]?.y ?? 48 + Math.floor(i / 4) * 100,
  }));

  for (const s of states) {
    const nodeGroup = createStateNode(app, s.label, s.type ?? 'normal');
    nodeGroup.x = s.x ?? 0;
    nodeGroup.y = s.y ?? 0;
    nodeGroup.metadata = { ...nodeGroup.metadata, diagramId: s.id };
    nodeMap.set(s.id, nodeGroup);
  }

  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  edgeLayer.metadata.diagramEdgeLayer = true;
  const allNodes = [...nodeMap.values()];
  const obstacles = collectObstacles(allNodes);
  for (const t of data.transitions) {
    const from = nodeMap.get(t.from);
    const to = nodeMap.get(t.to);
    if (!from || !to) continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: group,
        obstacleNodes: allNodes,
        stroke: getActiveDiagram().edge,
        glowColor: getActiveDiagram().edgeGlow,
        glow: false,
        strokeWidth: edgeWidth,
        label: t.label,
        cornerRadius: 14,
      })
    );
  }
  group.add(edgeLayer);

  for (const node of nodeMap.values()) {
    group.add(node);
  }

  return group;
}
