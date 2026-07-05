import type { App } from '../App';
import type { Node } from '../Node';
import { Group } from '../shapes/Group';
import type { NodeOptions } from '../types';
import {
  applyPositions,
  createDiagramGroup,
  createNodeBox,
  normalizeDiagramData,
  setDiagramState,
} from './helpers';
import {
  forceDirectedLayout,
  layoutDiagram,
  pipelineLayout,
  radialLayout,
} from './layouts';
import { collectObstacles, getAnchor, routeConnector } from './router';
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
  const nodeMap = new Map<string, Node>();

  for (const n of nodes) {
    const width = 120;
    const height = 40;
    const nodeGroup = app.group({ x: n.x ?? 0, y: n.y ?? 0 });

    const shape =
      n.type === 'decision'
        ? app.polygon({
            points: [60, 0, 120, 20, 60, 40, 0, 20],
            fill: '#dbeafe',
            stroke: '#2563eb',
            strokeWidth: 1,
          })
        : app.roundedRect({
            width,
            height,
            cornerRadius: n.type === 'start' || n.type === 'end' ? 20 : 4,
            fill: '#dbeafe',
            stroke: '#2563eb',
            strokeWidth: 1,
          });

    nodeGroup.add(shape);
    nodeGroup.add(
      app.text({
        text: n.label,
        x: width / 2 - n.label.length * 3,
        y: height / 2 - 7,
        fontSize: 12,
        fill: '#1e40af',
      })
    );
    nodeGroup.metadata = { diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
    group.add(nodeGroup);
  }

  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;

    const toB = toNode.getBounds();
    const anchor = getAnchor(fromNode, toB.x + toB.width / 2, toB.y + toB.height / 2);
    const toAnchor = getAnchor(toNode, anchor.x, anchor.y);

    group.add(
      routeConnector(app, anchor.x, anchor.y, toAnchor.x, toAnchor.y, 'smart', obstacles)
    );

    if (edge.label) {
      group.add(
        app.text({
          text: edge.label,
          x: (anchor.x + toAnchor.x) / 2,
          y: (anchor.y + toAnchor.y) / 2 - 10,
          fontSize: 10,
          fill: '#64748b',
        })
      );
    }
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
  const radius = 30;

  for (const s of data.states) {
    const isFinal = s.type === 'final';
    const isInitial = s.type === 'initial';
    const nodeGroup = app.group({ x: s.x ?? 0, y: s.y ?? 0 });

    if (isFinal) {
      nodeGroup.add(
        app.circle({
          x: radius - 6,
          y: radius - 6,
          radius: radius - 4,
          fill: '#dcfce7',
          stroke: '#16a34a',
          strokeWidth: 2,
        })
      );
      nodeGroup.add(
        app.circle({
          x: radius - 6,
          y: radius - 6,
          radius: radius - 10,
          fill: null,
          stroke: '#16a34a',
          strokeWidth: 2,
        })
      );
    } else {
      nodeGroup.add(
        app.roundedRect({
          width: radius * 2,
          height: radius * 2,
          cornerRadius: isInitial ? radius : 8,
          fill: isInitial ? '#fef9c3' : '#e0e7ff',
          stroke: isInitial ? '#ca8a04' : '#4f46e5',
          strokeWidth: 2,
        })
      );
    }

    nodeGroup.add(
      app.text({
        text: s.label,
        x: radius - s.label.length * 3,
        y: radius - 6,
        fontSize: 11,
        fill: '#1e293b',
      })
    );
    nodeGroup.metadata = { diagramId: s.id };
    nodeMap.set(s.id, nodeGroup);
    group.add(nodeGroup);
  }

  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const t of data.transitions) {
    const from = nodeMap.get(t.from);
    const to = nodeMap.get(t.to);
    if (!from || !to) continue;
    const toB = to.getBounds();
    const anchor = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
    const toAnchor = getAnchor(to, anchor.x, anchor.y);
    group.add(routeConnector(app, anchor.x, anchor.y, toAnchor.x, toAnchor.y, 'smart', obstacles));
    if (t.label) {
      group.add(
        app.text({
          text: t.label,
          x: (anchor.x + toAnchor.x) / 2,
          y: (anchor.y + toAnchor.y) / 2 - 8,
          fontSize: 10,
          fill: '#64748b',
        })
      );
    }
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
  const width = 160;

  for (const cls of data.classes) {
    const attrs = cls.attributes ?? [];
    const methods = cls.methods ?? [];
    const bodyLines = attrs.length + methods.length;
    const height = 40 + bodyLines * 16;
    const nodeGroup = app.group({ x: cls.x ?? 0, y: cls.y ?? 0 });

    nodeGroup.add(
      app.roundedRect({
        width,
        height,
        cornerRadius: 2,
        fill: '#f8fafc',
        stroke: '#334155',
        strokeWidth: 1,
      })
    );
    nodeGroup.add(
      app.text({
        text: cls.name,
        x: 8,
        y: 8,
        fontSize: 13,
        fontWeight: 'bold',
        fill: '#0f172a',
      })
    );
    nodeGroup.add(
      app.line({ x: 0, y: 28, x2: width, y2: 0, stroke: '#cbd5e1', strokeWidth: 1 })
    );

    let y = 34;
    for (const attr of attrs) {
      nodeGroup.add(app.text({ text: attr, x: 8, y, fontSize: 11, fill: '#475569' }));
      y += 16;
    }
    if (methods.length > 0 && attrs.length > 0) {
      nodeGroup.add(
        app.line({ x: 0, y: y - 4, x2: width, y2: 0, stroke: '#cbd5e1', strokeWidth: 1 })
      );
    }
    for (const method of methods) {
      nodeGroup.add(app.text({ text: method, x: 8, y, fontSize: 11, fill: '#475569' }));
      y += 16;
    }

    nodeGroup.metadata = { diagramId: cls.id };
    nodeMap.set(cls.id, nodeGroup);
    group.add(nodeGroup);
  }

  for (const rel of data.relations) {
    const from = nodeMap.get(rel.from);
    const to = nodeMap.get(rel.to);
    if (!from || !to) continue;
    const toB = to.getBounds();
    const anchor = getAnchor(from, toB.x + toB.width / 2, toB.y);
    const toAnchor = getAnchor(to, anchor.x, anchor.y);

    if (rel.type === 'inheritance') {
      const midX = (anchor.x + toAnchor.x) / 2;
      group.add(
        app.polyline({
          points: [anchor.x, anchor.y, midX, anchor.y, midX, toAnchor.y, toAnchor.x, toAnchor.y],
          fill: null,
          stroke: '#334155',
          strokeWidth: 1.5,
        })
      );
      group.add(
        app.polygon({
          points: [toAnchor.x, toAnchor.y, toAnchor.x - 8, toAnchor.y + 12, toAnchor.x + 8, toAnchor.y + 12],
          fill: '#f8fafc',
          stroke: '#334155',
          strokeWidth: 1.5,
        })
      );
    } else {
      group.add(routeConnector(app, anchor.x, anchor.y, toAnchor.x, toAnchor.y, 'orthogonal'));
    }
  }

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

  const centerNode = createNodeBox(app, center, 100, 50, {
    fill: '#fef08a',
    stroke: '#ca8a04',
    cornerRadius: 25,
  });
  group.add(centerNode);

  for (const branch of branches) {
    const branchNode = createNodeBox(app, branch.label, 90, 36, {
      fill: '#e0f2fe',
      stroke: '#0284c7',
    });
    group.add(branchNode);

    if (branch.children) {
      for (const child of branch.children) {
        const childNode = createNodeBox(app, child, 80, 30, {
          fill: '#f1f5f9',
          stroke: '#94a3b8',
        });
        branchNode.add(childNode);
      }
    }
  }

  radialLayout(group, 200, 150, 120, 180);
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
  const nodeMap = new Map<string, Node>();

  const colors: Record<string, { fill: string; stroke: string }> = {
    router: { fill: '#dbeafe', stroke: '#2563eb' },
    server: { fill: '#dcfce7', stroke: '#16a34a' },
    switch: { fill: '#fef9c3', stroke: '#ca8a04' },
    client: { fill: '#f3e8ff', stroke: '#9333ea' },
    default: { fill: '#f1f5f9', stroke: '#64748b' },
  };

  for (const n of nodes) {
    const style = colors[n.type ?? 'default'] ?? colors.default;
    const size = n.type === 'router' ? 50 : 40;
    const nodeGroup = app.group({ x: n.x ?? 0, y: n.y ?? 0 });
    nodeGroup.add(
      app.roundedRect({
        width: size,
        height: size,
        cornerRadius: n.type === 'server' ? 4 : size / 2,
        fill: style.fill,
        stroke: style.stroke,
        strokeWidth: 2,
      })
    );
    nodeGroup.add(
      app.text({
        text: n.label,
        x: -10,
        y: size + 4,
        fontSize: 10,
        fill: '#334155',
      })
    );
    nodeGroup.metadata = { diagramId: n.id };
    nodeMap.set(n.id, nodeGroup);
    group.add(nodeGroup);
  }

  const obstacles = collectObstacles([...nodeMap.values()]);
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (!from || !to) continue;
    const toB = to.getBounds();
    const anchor = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
    const toAnchor = getAnchor(to, anchor.x, anchor.y);
    group.add(routeConnector(app, anchor.x, anchor.y, toAnchor.x, toAnchor.y, 'smart', obstacles));
    if (edge.label) {
      group.add(
        app.text({
          text: edge.label,
          x: (anchor.x + toAnchor.x) / 2 - 10,
          y: (anchor.y + toAnchor.y) / 2,
          fontSize: 9,
          fill: '#64748b',
        })
      );
    }
  }

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
  layoutDiagram(group, 100, 80);
  return group;
}

function buildOrgNode(
  app: App,
  parent: Group,
  data: OrgChartNode,
  x: number,
  y: number
): Group {
  const node = app.group({ x, y });
  node.add(
    app.roundedRect({
      width: 140,
      height: 50,
      cornerRadius: 4,
      fill: '#f1f5f9',
      stroke: '#94a3b8',
      strokeWidth: 1,
    })
  );
  node.add(app.text({ text: data.name, x: 20, y: 16, fontSize: 13, fill: '#334155' }));

  const collapsed = data.collapsed ?? false;
  node.metadata = { orgNode: true, collapsed, childCount: data.children?.length ?? 0 };

  if (data.children && data.children.length > 0) {
    const indicator = app.text({
      text: collapsed ? `+${data.children.length}` : '−',
      x: 120,
      y: 16,
      fontSize: 14,
      fill: '#64748b',
    });
    node.add(indicator);
    node.metadata.collapseIndicator = indicator;

    if (!collapsed) {
      for (const child of data.children) {
        buildOrgNode(app, node, child, 0, 0);
      }
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
  const busY = 80;
  const busWidth = Math.max(400, data.ecus.length * 100);

  group.add(
    app.line({
      x: 20,
      y: busY,
      x2: busWidth,
      y2: 0,
      stroke: '#dc2626',
      strokeWidth: 4,
    })
  );
  group.add(
    app.text({
      text: data.busLabel ?? 'CAN Bus',
      x: busWidth / 2 - 30,
      y: busY - 20,
      fontSize: 12,
      fill: '#dc2626',
      fontWeight: 'bold',
    })
  );

  const spacing = busWidth / (data.ecus.length + 1);
  for (let i = 0; i < data.ecus.length; i++) {
    const ecu = data.ecus[i];
    const x = 20 + spacing * (i + 1) - 40;
    const ecuGroup = app.group({ x, y: busY + 10 });
    ecuGroup.add(
      app.roundedRect({
        width: 80,
        height: 50,
        cornerRadius: 4,
        fill: '#1e293b',
        stroke: '#475569',
        strokeWidth: 1,
      })
    );
    ecuGroup.add(
      app.text({ text: ecu.label, x: 8, y: 10, fontSize: 11, fill: '#e2e8f0', fontWeight: 'bold' })
    );
    if (ecu.address) {
      ecuGroup.add(
        app.text({ text: ecu.address, x: 8, y: 28, fontSize: 9, fill: '#94a3b8' })
      );
    }
    ecuGroup.add(
      app.line({ x: 40, y: 0, x2: 0, y2: -10, stroke: '#dc2626', strokeWidth: 2 })
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
  const statusColors: Record<string, { fill: string; stroke: string }> = {
    pending: { fill: '#f1f5f9', stroke: '#94a3b8' },
    active: { fill: '#dbeafe', stroke: '#2563eb' },
    done: { fill: '#dcfce7', stroke: '#16a34a' },
    error: { fill: '#fee2e2', stroke: '#dc2626' },
  };

  const stageNodes: Node[] = [];
  for (const stage of stages) {
    const colors = statusColors[stage.status ?? 'pending'];
    const node = createNodeBox(app, stage.label, 100, 44, colors);
    node.metadata = { diagramId: stage.id, pipelineStatus: stage.status };
    group.add(node);
    stageNodes.push(node);
  }

  pipelineLayout(group, 50, 10);

  for (let i = 0; i < stageNodes.length - 1; i++) {
    const from = stageNodes[i];
    const to = stageNodes[i + 1];
    const fb = from.getBounds();
    const tb = to.getBounds();
    group.add(
      routeConnector(
        app,
        fb.x + fb.width,
        fb.y + fb.height / 2,
        tb.x,
        tb.y + tb.height / 2,
        'straight'
      )
    );
  }

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
