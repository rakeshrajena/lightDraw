/**
 * Diagram builder — classDiagram.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { Node } from '../../Node';
import type { NodeOptions } from '../../types';
import { getActiveDiagram } from '../theme';
import {
  createDiagramGroup,
  separateOverlappingNodes,
  readCanvasSize,
} from '../helpers';
import {
  createClassNode,
} from '../primitives';
import { collectObstacles } from '../router';
import { connectNodePairs } from '../connectors';
import type { ClassDiagramData } from '../types';
import { maybeApplyDiagramFlow } from '../flow';

/** Create UML class diagram */
export function createClassDiagram(
  app: App,
  data: ClassDiagramData,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'classDiagram', { ...options, data }, { name: 'classDiagram' });
  const nodeMap = new Map<string, Node>();

  for (const cls of data.classes) {
    const nodeGroup = createClassNode(app, cls.name, cls.attributes ?? [], cls.methods ?? []);
    nodeGroup.x = cls.x ?? 0;
    nodeGroup.y = cls.y ?? 0;
    if (typeof cls.rotation === 'number') nodeGroup.rotation = cls.rotation;
    nodeGroup.metadata = { ...nodeGroup.metadata, diagramId: cls.id };
    nodeMap.set(cls.id, nodeGroup);
    group.add(nodeGroup);
  }

  const canvas = readCanvasSize(options as Record<string, unknown>);
  separateOverlappingNodes([...nodeMap.values()], {
    gap: 24,
    canvasW: canvas.width,
    canvasH: canvas.height,
  });

  const allNodes = [...nodeMap.values()];
  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  edgeLayer.metadata.diagramEdgeLayer = true;
  const pairs = [];
  for (const rel of data.relations) {
    const from = nodeMap.get(rel.from);
    const to = nodeMap.get(rel.to);
    if (!from || !to) continue;
    const common = {
      glow: false,
      cornerRadius: 10,
      style: 'smart' as const,
      edgeId: `${rel.from}->${rel.to}:${rel.type ?? 'rel'}`,
      fromId: rel.from,
      toId: rel.to,
    };
    if (rel.type === 'inheritance') {
      pairs.push({
        from,
        to,
        options: {
          ...common,
          stroke: getActiveDiagram().umlInheritance,
          arrowEnd: 'hollow' as const,
        },
      });
    } else if (rel.type === 'association') {
      pairs.push({
        from,
        to,
        options: {
          ...common,
          stroke: getActiveDiagram().umlAssociation,
          arrowEnd: 'open' as const,
        },
      });
    } else if (rel.type === 'composition') {
      pairs.push({
        from,
        to,
        options: {
          ...common,
          stroke: getActiveDiagram().umlComposition,
          arrowStart: 'diamond' as const,
          arrowEnd: 'none' as const,
        },
      });
    } else {
      pairs.push({
        from,
        to,
        options: {
          ...common,
          stroke: getActiveDiagram().umlImplements,
          dash: rel.type === 'implements' ? [6, 4] : undefined,
          arrowEnd: 'hollow' as const,
        },
      });
    }
  }
  for (const g of connectNodePairs(app, pairs, {
    parent: group,
    obstacleNodes: allNodes,
    obstacles: collectObstacles(allNodes),
    style: 'smart',
    glow: false,
  })) {
    edgeLayer.add(g);
  }
  group.add(edgeLayer);

  maybeApplyDiagramFlow(app, group, options as Record<string, unknown>);
  return group;
}
