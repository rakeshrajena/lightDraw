import type { App } from '../App';
import type { Node } from '../Node';
import { Group } from '../shapes/Group';
import type { NodeOptions } from '../types';
import { DIAGRAM } from './theme';
import {
  applyPositions,
  autoLayoutNodes,
  createDiagramGroup,
  createNodeBox,
  measureTextWidth,
  normalizeDiagramData,
  setDiagramState,
} from './helpers';
import {
  createClassNode,
  createFlowchartNode,
  createNetworkNode,
  createOrgNode,
  createPipelineStage,
  createStateNode,
} from './primitives';
import {
  forceDirectedLayout,
  layoutDiagram,
  pipelineLayout,
  radialLayout,
} from './layouts';
import { collectObstacles } from './router';
import { connectNodes, wireMindMapConnectors, wireOrgChartConnectors } from './connectors';
import { buildSchematic } from './symbols';
import type {
  CanNetworkData,
  ClassDiagramData,
  DiagramData,
  OrgChartNode,
  PipelineStage,
  SchematicComponent,
  StateMachineData,
} from './types';

/** Create a flowchart from node/edge data */
export function createFlowchart(app: App, data: DiagramData, options: NodeOptions = {}): Group {
  const group = createDiagramGroup(app, 'flowchart', { ...options, data }, { name: 'flowchart' });
  const { nodes, edges } = normalizeDiagramData(data);
  autoLayoutNodes(nodes, 3, 160, 88, 32, 28);
  const nodeMap = new Map<string, Node>();

  for (const n of nodes) {
    const nodeGroup = createFlowchartNode(app, n.label, n.type ?? 'process');
    nodeGroup.x = n.x ?? 0;
    nodeGroup.y = n.y ?? 0;
    nodeGroup.metadata = { diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
  }

  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;
    edgeLayer.add(
      connectNodes(app, fromNode, toNode, obstacles, {
        parent: group,
        stroke: DIAGRAM.edge,
        strokeWidth: 2,
        label: edge.label,
      })
    );
  }
  group.add(edgeLayer);

  for (const nodeGroup of nodeMap.values()) {
    group.add(nodeGroup);
  }

  return group;
}

/** Create state machine diagram */
export function createStateMachine(
  app: App,
  data: StateMachineData,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'stateMachine', { ...options, data }, { name: 'stateMachine' });
  const nodeMap = new Map<string, Node>();
  const states = data.states.map((s, i) => ({
    ...s,
    x: s.x ?? 48 + (i % 4) * 110,
    y: s.y ?? 48 + Math.floor(i / 4) * 100,
  }));

  for (const s of states) {
    const nodeGroup = createStateNode(app, s.label, s.type ?? 'normal');
    nodeGroup.x = s.x ?? 0;
    nodeGroup.y = s.y ?? 0;
    nodeGroup.metadata = { diagramId: s.id };
    nodeMap.set(s.id, nodeGroup);
  }

  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const t of data.transitions) {
    const from = nodeMap.get(t.from);
    const to = nodeMap.get(t.to);
    if (!from || !to) continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: group,
        stroke: DIAGRAM.edge,
        label: t.label,
      })
    );
  }
  group.add(edgeLayer);

  for (const node of nodeMap.values()) {
    group.add(node);
  }

  return group;
}

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
    nodeGroup.metadata = { diagramId: cls.id };
    nodeMap.set(cls.id, nodeGroup);
    group.add(nodeGroup);
  }

  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  for (const rel of data.relations) {
    const from = nodeMap.get(rel.from);
    const to = nodeMap.get(rel.to);
    if (!from || !to) continue;
    if (rel.type === 'inheritance') {
      edgeLayer.add(
        connectNodes(app, from, to, [], {
          parent: group,
          style: 'orthogonal',
          stroke: DIAGRAM.classStroke,
          arrowEnd: 'hollow',
        })
      );
    } else if (rel.type === 'association') {
      edgeLayer.add(
        connectNodes(app, from, to, [], {
          parent: group,
          style: 'orthogonal',
          stroke: DIAGRAM.edge,
          arrowEnd: 'open',
        })
      );
    } else {
      edgeLayer.add(
        connectNodes(app, from, to, [], {
          parent: group,
          style: 'orthogonal',
          stroke: DIAGRAM.edge,
          dash: rel.type === 'implements' ? [6, 4] : undefined,
        })
      );
    }
  }
  group.add(edgeLayer);

  return group;
}

/** Create mind map with radial layout */
export function createMindMap(
  app: App,
  center: string,
  branches: Array<{ label: string; children?: string[] }>,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'mindMap', { ...options, center, branches }, { name: 'mindMap' });

  const centerNode = createNodeBox(app, center, 108, 52, {
    fill: DIAGRAM.mindCenter.fill,
    stroke: DIAGRAM.mindCenter.stroke,
    cornerRadius: 26,
  });
  group.add(centerNode);

  for (const branch of branches) {
    const branchNode = createNodeBox(app, branch.label, 96, 38, {
      fill: DIAGRAM.mindBranch.fill,
      stroke: DIAGRAM.mindBranch.stroke,
    });
    group.add(branchNode);

    if (branch.children) {
      branch.children.forEach((child, ci) => {
        const childNode = createNodeBox(app, child, 84, 32, {
          fill: DIAGRAM.mindLeaf.fill,
          stroke: DIAGRAM.mindLeaf.stroke,
        });
        childNode.x = -12 + ci * 92;
        childNode.y = 50;
        branchNode.add(childNode);
      });
    }
  }

  radialLayout(group, 220, 160, 130, 190);
  wireMindMapConnectors(app, group);
  return group;
}

/** Create network topology diagram */
export function createNetworkDiagram(
  app: App,
  data: DiagramData,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'networkTopology', { ...options, data }, { name: 'network' });
  const { nodes, edges } = normalizeDiagramData(data);
  autoLayoutNodes(nodes, 4, 130, 100, 28, 24);
  const nodeMap = new Map<string, Node>();

  for (const n of nodes) {
    const nodeGroup = createNetworkNode(app, n.label, n.type ?? 'default');
    nodeGroup.x = n.x ?? 0;
    nodeGroup.y = n.y ?? 0;
    nodeGroup.metadata = { diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
    group.add(nodeGroup);
  }

  const obstacles = collectObstacles([...nodeMap.values()]);
  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: group,
        stroke: DIAGRAM.edge,
        label: edge.label,
      })
    );
  }
  group.add(edgeLayer);

  return group;
}

/** Create org chart with optional collapse */
export function createOrgChart(
  app: App,
  root: OrgChartNode,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'orgChart', { ...options, root }, { name: 'orgChart' });
  buildOrgNode(app, group, root, 0, 0);
  layoutDiagram(group, 110, 72);
  wireOrgChartConnectors(app, group);
  return group;
}

function buildOrgNode(
  app: App,
  parent: Group,
  data: OrgChartNode,
  x: number,
  y: number
): Group {
  const childCount = data.children?.length ?? 0;
  const collapsed = data.collapsed ?? false;
  const { node, indicator } = createOrgNode(app, data.name, undefined, childCount, collapsed);
  node.x = x;
  node.y = y;
  node.metadata = { orgNode: true, collapsed, childCount };

  if (indicator) {
    node.metadata.collapseIndicator = indicator;
  }

  if (data.children && data.children.length > 0 && !collapsed) {
    for (const child of data.children) {
      buildOrgNode(app, node, child, 0, 0);
    }
  }

  parent.add(node);
  return node;
}

/** Toggle org chart node collapse state */
export function toggleOrgCollapse(node: Node): void {
  if (!node.metadata?.orgNode) return;
  const collapsed = !node.metadata.collapsed;
  node.metadata.collapsed = collapsed;
  setDiagramState(node, { collapsed });

  const children = (node as Group).children.filter(
    (c) => c.metadata?.orgNode && c !== node.metadata.collapseIndicator
  );
  for (const child of children) {
    child.visible = !collapsed;
  }

  const indicator = node.metadata.collapseIndicator as Node | undefined;
  if (indicator && 'text' in indicator) {
    (indicator as { text: string }).text = collapsed
      ? `+${node.metadata.childCount}`
      : '−';
  }
  node.markDirty();
}

/** Create electrical schematic */
export function createSchematic(
  app: App,
  components: SchematicComponent[],
  options: NodeOptions = {}
): Group {
  const group = buildSchematic(app, components);
  group.metadata = {
    ...group.metadata,
    diagramType: 'electricalSchematic',
    diagramState: { ...options, components },
  };
  return group;
}

/** Create CAN network diagram */
export function createCanNetwork(
  app: App,
  data: CanNetworkData,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'canNetwork', { ...options, data }, { name: 'canNetwork' });
  const busY = 72;
  const busWidth = Math.max(440, data.ecus.length * 110);
  const busLabel = data.busLabel ?? 'CAN Bus';

  group.add(
    app.roundedRect({
      x: 16,
      y: busY - 3,
      width: busWidth,
      height: 6,
      cornerRadius: 3,
      fill: DIAGRAM.canBus,
      stroke: null,
      shadow: DIAGRAM.shadowSoft,
      listening: false,
    })
  );
  group.add(
    app.circle({
      x: 16,
      y: busY,
      radius: 5,
      fill: DIAGRAM.canTermination,
      stroke: DIAGRAM.surface,
      strokeWidth: 2,
      listening: false,
    })
  );
  group.add(
    app.circle({
      x: 16 + busWidth,
      y: busY,
      radius: 5,
      fill: DIAGRAM.canTermination,
      stroke: DIAGRAM.surface,
      strokeWidth: 2,
      listening: false,
    })
  );
  const labelW = measureTextWidth(busLabel, DIAGRAM.fontSize.base, 'bold');
  group.add(
    app.text({
      text: busLabel,
      x: busWidth / 2 - labelW / 2 + 16,
      y: busY - 24,
      fontSize: DIAGRAM.fontSize.base,
      fill: DIAGRAM.edge,
      fontWeight: 'bold',
      fontFamily: DIAGRAM.fontFamily,
      listening: false,
    })
  );

  const spacing = busWidth / (data.ecus.length + 1);
  for (let i = 0; i < data.ecus.length; i++) {
    const ecu = data.ecus[i];
    const x = 16 + spacing * (i + 1) - 44;
    const ecuGroup = app.group({ x, y: busY + 14 });
    ecuGroup.add(
      app.roundedRect({
        width: 88,
        height: 54,
        cornerRadius: DIAGRAM.radii.md,
        fill: DIAGRAM.nodeFill,
        stroke: DIAGRAM.nodeStroke,
        strokeWidth: 1.5,
        shadow: DIAGRAM.shadowSoft,
        listening: false,
      })
    );
    ecuGroup.add(
      app.rect({
        x: 0,
        y: 0,
        width: 88,
        height: 4,
        fill: DIAGRAM.nodeStroke,
        listening: false,
      })
    );
    ecuGroup.add(
      app.text({
        text: ecu.label,
        x: DIAGRAM.spacing.sm,
        y: 12,
        fontSize: DIAGRAM.fontSize.md,
        fill: DIAGRAM.nodeText,
        fontWeight: 'bold',
        fontFamily: DIAGRAM.fontFamily,
        listening: false,
      })
    );
    if (ecu.address) {
      ecuGroup.add(
        app.text({
          text: ecu.address,
          x: DIAGRAM.spacing.sm,
          y: 30,
          fontSize: DIAGRAM.fontSize.xs,
          fontFamily: DIAGRAM.fontMono,
          fill: DIAGRAM.edgeLabel,
          listening: false,
        })
      );
    }
    ecuGroup.add(
      app.line({
        x: 44,
        y: 0,
        x2: 0,
        y2: -14,
        stroke: DIAGRAM.canBus,
        strokeWidth: 2.5,
        lineCap: 'round',
        listening: false,
      })
    );
    ecuGroup.metadata = { diagramId: ecu.id };
    group.add(ecuGroup);
  }

  return group;
}

/** Create horizontal process pipeline */
export function createPipeline(
  app: App,
  stages: PipelineStage[],
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'processPipeline', { ...options, stages }, { name: 'pipeline' });

  const stageNodes: Node[] = [];
  for (const stage of stages) {
    const node = createPipelineStage(app, stage.label, stage.status ?? 'pending');
    node.metadata = { diagramId: stage.id, pipelineStatus: stage.status };
    group.add(node);
    stageNodes.push(node);
  }

  pipelineLayout(group, 56, 12);

  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  for (let i = 0; i < stageNodes.length - 1; i++) {
    edgeLayer.add(
      connectNodes(app, stageNodes[i], stageNodes[i + 1], [], {
        parent: group,
        style: 'straight',
        stroke: DIAGRAM.edge,
        arrowEnd: 'filled',
      })
    );
  }
  group.add(edgeLayer);

  return group;
}

/** Apply force layout to an existing diagram group */
export function applyForceLayout(
  group: Group,
  edges: Array<{ from: string; to: string }>,
  options?: Parameters<typeof forceDirectedLayout>[2]
): void {
  const nodes: Array<{ id: string; x?: number; y?: number }> = [];
  for (const child of group.children) {
    const id = child.metadata?.diagramId as string | undefined;
    if (id) nodes.push({ id, x: child.x, y: child.y });
  }
  const positions = forceDirectedLayout(nodes, edges, options);
  applyPositions(group, positions);
}

/** JSON factory dispatcher */
export function createDiagramFromProps(
  type: string,
  props: Record<string, unknown>,
  app: App
): Group | null {
  switch (type) {
    case 'flowchart':
      return createFlowchart(app, props.data as DiagramData, props);
    case 'stateMachine':
      return createStateMachine(app, props.data as StateMachineData, props);
    case 'classDiagram':
      return createClassDiagram(app, props.data as ClassDiagramData, props);
    case 'mindMap':
      return createMindMap(
        app,
        (props.center as string) ?? 'Topic',
        (props.branches as Array<{ label: string; children?: string[] }>) ?? [],
        props
      );
    case 'networkTopology':
      return createNetworkDiagram(app, props.data as DiagramData, props);
    case 'orgChart':
      return createOrgChart(app, props.root as OrgChartNode, props);
    case 'electricalSchematic':
      return createSchematic(app, (props.components as SchematicComponent[]) ?? [], props);
    case 'canNetwork':
      return createCanNetwork(app, props.data as CanNetworkData, props);
    case 'processPipeline':
      return createPipeline(app, (props.stages as PipelineStage[]) ?? [], props);
    default:
      return null;
  }
}
