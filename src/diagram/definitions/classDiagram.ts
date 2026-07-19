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
} from '../helpers';
import {
  createClassNode,
} from '../primitives';
import { collectObstacles } from '../router';
import { connectNodes } from '../connectors';
import type { ClassDiagramData } from '../types';

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

  const allNodes = [...nodeMap.values()];
  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  edgeLayer.metadata.diagramEdgeLayer = true;
  for (const rel of data.relations) {
    const from = nodeMap.get(rel.from);
    const to = nodeMap.get(rel.to);
    if (!from || !to) continue;
    const pairObstacles = collectObstacles(allNodes, [from, to]);
    const common = {
      parent: group,
      obstacleNodes: allNodes,
      glow: false,
      cornerRadius: 12,
    } as const;
    if (rel.type === 'inheritance') {
      edgeLayer.add(
        connectNodes(app, from, to, pairObstacles, {
          ...common,
          style: 'orthogonal',
          stroke: getActiveDiagram().umlInheritance,
          arrowEnd: 'hollow',
        })
      );
    } else if (rel.type === 'association') {
      edgeLayer.add(
        connectNodes(app, from, to, pairObstacles, {
          ...common,
          style: 'orthogonal',
          stroke: getActiveDiagram().umlAssociation,
          arrowEnd: 'open',
        })
      );
    } else if (rel.type === 'composition') {
      edgeLayer.add(
        connectNodes(app, from, to, pairObstacles, {
          ...common,
          style: 'orthogonal',
          stroke: getActiveDiagram().umlComposition,
          arrowStart: 'diamond',
          arrowEnd: 'none',
        })
      );
    } else {
      edgeLayer.add(
        connectNodes(app, from, to, pairObstacles, {
          ...common,
          style: 'orthogonal',
          stroke: getActiveDiagram().umlImplements,
          dash: rel.type === 'implements' ? [6, 4] : undefined,
          arrowEnd: 'hollow',
        })
      );
    }
  }
  group.add(edgeLayer);

  return group;
}
