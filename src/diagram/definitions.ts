import type { App } from '../App';
import type { Node } from '../Node';
import { Group } from '../shapes/Group';
import type { NodeOptions } from '../types';
import { resolveStrokeWidth, strokeContextForCanvas, getActiveDiagram } from './theme';
import {
  applyPositions,
  autoLayoutNodesResponsive,
  createDiagramGroup,
  fitDiagramToBounds,
  measureTextWidth,
  normalizeDiagramData,
  readCanvasSize,
  setDiagramState,
} from './helpers';
import {
  createClassNode,
  createFlowchartNode,
  createLabeledBox,
  createNetworkNode,
  createOrgNode,
  createPipelineStage,
  createStateNode,
  createCanEcuNode,
  countOrgDescendants,
  resolveOrgBranchStyle,
  updateOrgCollapseButton,
} from './primitives';
import {
  forceDirectedLayout,
  layoutDiagram,
  mindMapLayout,
  pipelineLayout,
} from './layouts';
import { collectObstacles } from './router';
import { connectNodes, wireMindMapConnectors, wireOrgChartConnectors } from './connectors';
import { buildSchematic } from './symbols';
import { listNetworkIconKinds } from './networkIcons';
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

/** Create mind map — Mermaid-style left/right tree with smooth horizontal links */
export function createMindMap(
  app: App,
  center: string,
  branches: Array<{ label: string; children?: string[] }>,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'mindMap', { ...options, center, branches }, { name: 'mindMap' });
  const canvas = readCanvasSize(options as Record<string, unknown>);

  const centerNode = createLabeledBox(
    app,
    center,
    140,
    52,
    {
      fill: getActiveDiagram().mindCenter.fill,
      stroke: getActiveDiagram().mindCenter.stroke,
      cornerRadius: 26,
      strokeWidth: 2,
      shadow: null,
      sheen: false,
    },
    { fontSize: getActiveDiagram().fontSize.lg, fontWeight: '700' }
  );
  centerNode.metadata.diagramId = 'center';
  centerNode.metadata.diagramCardWidth = 140;
  centerNode.metadata.diagramCardHeight = 52;
  group.add(centerNode);

  branches.forEach((branch, bi) => {
    const palette = getActiveDiagram().mindBranchPalette[bi % getActiveDiagram().mindBranchPalette.length];
    const branchNode = createLabeledBox(
      app,
      branch.label,
      112,
      40,
      {
        fill: palette.fill,
        stroke: palette.stroke,
        cornerRadius: 20,
        strokeWidth: 1.75,
        shadow: null,
        sheen: false,
      },
      { fontSize: getActiveDiagram().fontSize.base, fontWeight: '600' }
    );
    branchNode.metadata = {
      diagramId: `branch_${bi}`,
      mindBranchColor: palette.stroke,
      mindBranchGlow: palette.glow,
      diagramCardWidth: 112,
      diagramCardHeight: 40,
    };
    group.add(branchNode);

    if (branch.children) {
      branch.children.forEach((child, ci) => {
        const childNode = createLabeledBox(
          app,
          child,
          96,
          30,
          {
            fill: getActiveDiagram().mindLeaf.fill,
            stroke: palette.stroke,
            cornerRadius: 15,
            strokeWidth: 1.5,
            shadow: null,
            sheen: false,
          },
          { fontSize: getActiveDiagram().fontSize.sm, fontWeight: '500' }
        );
        childNode.metadata.diagramId = `branch_${bi}_leaf_${ci}`;
        childNode.metadata.diagramCardWidth = 96;
        childNode.metadata.diagramCardHeight = 30;
        branchNode.add(childNode);
      });
    }
  });

  mindMapLayout(group, canvas.width, canvas.height);
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

/** Create org chart with optional collapse */
export function createOrgChart(
  app: App,
  root: OrgChartNode,
  options: NodeOptions = {}
): Group {
  const group = createDiagramGroup(app, 'orgChart', { ...options, root }, { name: 'orgChart' });
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const levelGap = Math.max(120, Math.round(canvas.height * 0.22));
  const siblingGap = Math.max(28, Math.round(canvas.width * 0.04));
  group.metadata.orgLayout = { levelGap, siblingGap };
  const rootNode = buildOrgNode(app, group, root, 0, 0, 0);
  layoutDiagram(rootNode, levelGap, siblingGap);
  wireOrgChartConnectors(app, group);
  wireOrgCollapseControls(app, group);
  return group;
}

/** Total nodes under this org data node (all descendants). */
function countOrgDataDescendants(data: OrgChartNode): number {
  if (!data.children?.length) return 0;
  let total = 0;
  for (const child of data.children) {
    total += 1 + countOrgDataDescendants(child);
  }
  return total;
}

function buildOrgNode(
  app: App,
  parent: Group,
  data: OrgChartNode,
  x: number,
  y: number,
  depth: number,
  branchIndex: number | null = null
): Group {
  const childCount = data.children?.length ?? 0;
  const descendantCount = countOrgDataDescendants(data);
  const collapsed = data.collapsed ?? false;
  const style = resolveOrgBranchStyle(depth, branchIndex);
  const { node, indicator } = createOrgNode(app, {
    name: data.name,
    role: data.role,
    image: data.image,
    department: data.department,
    // Button uses total subtree size, not just direct children
    childCount: descendantCount,
    collapsed,
    depth,
    branchStyle: style,
  });
  node.metadata.diagramId = data.name;
  node.metadata.orgName = data.name;
  node.x = x;
  node.y = y;
  node.metadata = {
    ...node.metadata,
    orgNode: true,
    collapsed,
    childCount,
    descendantCount,
    orgBranchIndex: branchIndex,
    orgChildrenData: data.children ?? [],
  };

  if (indicator) {
    node.metadata.collapseIndicator = indicator;
  }

  if (data.children && data.children.length > 0) {
    data.children.forEach((child, i) => {
      // Top-level teams get distinct branch colors; deeper nodes inherit
      const childBranch = depth === 0 ? i : branchIndex;
      const childNode = buildOrgNode(app, node, child, 0, 0, depth + 1, childBranch);
      if (collapsed) childNode.visible = false;
    });
  }

  // Prefer live tree count after children are attached (stays accurate if tree mutates)
  if (descendantCount > 0) {
    const live = countOrgDescendants(node);
    node.metadata.descendantCount = live;
    if (node.metadata.collapseButton) {
      updateOrgCollapseButton(node, collapsed);
    }
  }

  parent.add(node);
  return node;
}

function findOrgChartRoot(node: Node): Group | null {
  let cur: Node | null = node;
  while (cur) {
    if (cur.metadata?.diagramType === 'orgChart') return cur as Group;
    cur = cur.parent;
  }
  return null;
}

/** Wire click handlers on minimize/expand buttons. */
export function wireOrgCollapseControls(app: App, root: Group): void {
  const walk = (parent: Group): void => {
    for (const child of parent.children) {
      if (!('children' in child)) continue;
      const g = child as Group;
      if (g.metadata?.orgNode) {
        const btn = (g.metadata.collapseButton as Group | undefined)
          ?? g.children.find((c) => c.metadata?.orgCollapseBtn);
        if (btn && !btn.metadata?.orgCollapseWired) {
          const onDown = (e: { stopPropagation: () => void }) => {
            e.stopPropagation();
          };
          const onClick = (e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            toggleOrgCollapse(g);
            app.requestRender();
          };
          btn.on('mousedown', onDown as never);
          btn.on('click', onClick as never);
          btn.metadata.orgCollapseWired = true;
          btn.listening = true;
        }
        // Keep collapse control above the editor hit target
        if (btn && btn.parent === g) {
          g.remove(btn);
          g.add(btn);
        }
      }
      if (g.children?.length) walk(g);
    }
  };
  walk(root);
}

/** Toggle org chart branch collapse — hide/show children, relayout, rewire. */
export function toggleOrgCollapse(node: Node): void {
  if (!node.metadata?.orgNode) return;
  const group = node as Group;
  const collapsed = !node.metadata.collapsed;
  node.metadata.collapsed = collapsed;
  setDiagramState(node, { collapsed });

  const children = group.children.filter((c) => c.metadata?.orgNode);
  for (const child of children) {
    child.visible = !collapsed;
    child.markDirty();
  }

  updateOrgCollapseButton(group, collapsed);

  const root = findOrgChartRoot(node);
  const app = node.getApp();
  if (root && app) {
    const layout = (root.metadata?.orgLayout as { levelGap?: number; siblingGap?: number }) ?? {};
    const levelGap = layout.levelGap ?? 120;
    const siblingGap = layout.siblingGap ?? 28;
    for (const orgRoot of root.children.filter((c) => c.metadata?.orgNode)) {
      layoutDiagram(orgRoot as Group, levelGap, siblingGap);
    }
    wireOrgChartConnectors(app, root);
    wireOrgCollapseControls(app, root);
    const canvas = readCanvasSize((root.metadata?.diagramState as Record<string, unknown>) ?? {});
    if (canvas.width > 0 && canvas.height > 0) {
      fitDiagramToBounds(root, canvas.width, canvas.height, 24);
    }
    // Clear dotted selection chrome for nodes now hidden under a minimized branch
    const editor = root.metadata?.diagramEditor as
      | { afterStructureChange?: () => void }
      | undefined;
    editor?.afterStructureChange?.();
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
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const nodeStroke = resolveStrokeWidth(getActiveDiagram().stroke.node, strokeCtx);
  const busY = 72;
  const ecuW = 96;
  const margin = 36;
  const n = Math.max(1, data.ecus.length);
  // Stretch bus across the canvas so every ECU is fully visible with even gaps
  const busWidth = Math.max(280, canvas.width - margin * 2);
  const busLabel = data.busLabel ?? 'CAN Bus';

  const busGlow = getActiveDiagram().canBusGlow;
  const busFill = getActiveDiagram().canBus;
  group.add(
    app.roundedRect({
      x: margin - 4,
      y: busY - 11,
      width: busWidth + 8,
      height: 22,
      cornerRadius: 6,
      fill: busGlow,
      stroke: null,
      opacity: 0.35,
      listening: false,
    })
  );
  // CAN-H (upper) / CAN-L (lower) — distinct opacity for dual-line bus
  group.add(
    app.line({
      x: margin,
      y: busY - 4,
      x2: busWidth,
      y2: 0,
      stroke: busFill,
      strokeWidth: 2.5,
      lineCap: 'round',
      listening: false,
    })
  );
  group.add(
    app.line({
      x: margin,
      y: busY + 4,
      x2: busWidth,
      y2: 0,
      stroke: busFill,
      strokeWidth: 2.5,
      lineCap: 'round',
      opacity: 0.55,
      listening: false,
    })
  );
  // Termination: twin vertical bars (schematic-style resistors), not status dots
  const termColor = getActiveDiagram().canTermination;
  for (const tx of [margin, margin + busWidth]) {
    group.add(
      app.line({
        x: tx,
        y: busY - 10,
        x2: 0,
        y2: 20,
        stroke: termColor,
        strokeWidth: 2.5,
        lineCap: 'round',
        listening: false,
      })
    );
    group.add(
      app.line({
        x: tx + (tx === margin ? 5 : -5),
        y: busY - 10,
        x2: 0,
        y2: 20,
        stroke: termColor,
        strokeWidth: 2.5,
        lineCap: 'round',
        listening: false,
      })
    );
  }
  const labelW = measureTextWidth(busLabel, getActiveDiagram().fontSize.base, 'bold');
  group.add(
    app.text({
      text: busLabel,
      x: margin + busWidth / 2 - labelW / 2,
      y: busY - 30,
      fontSize: getActiveDiagram().fontSize.base,
      fill: getActiveDiagram().edge,
      fontWeight: 'bold',
      fontFamily: getActiveDiagram().fontFamily,
      listening: false,
    })
  );

  const spacing = busWidth / (n + 1);
  for (let i = 0; i < data.ecus.length; i++) {
    const ecu = data.ecus[i];
    const ecuColor = getActiveDiagram().canEcuPalette[i % getActiveDiagram().canEcuPalette.length];
    const x = margin + spacing * (i + 1) - ecuW / 2;
    const ecuGroup = createCanEcuNode(app, ecu.label, ecu.address, ecuColor, nodeStroke);
    ecuGroup.x = x;
    // Top of card sits 18px below bus midline → tap of 18 meets CAN-H/L center
    ecuGroup.y = busY + 18;
    ecuGroup.metadata = {
      ...ecuGroup.metadata,
      diagramId: ecu.id,
    };
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
  const canvas = readCanvasSize(options as Record<string, unknown>);
  const strokeCtx = strokeContextForCanvas(canvas.width, canvas.height);
  const edgeWidth = resolveStrokeWidth(getActiveDiagram().stroke.edge, strokeCtx);

  const stageNodes: Node[] = [];
  for (const stage of stages) {
    const node = createPipelineStage(app, stage.label, stage.status ?? 'pending');
    node.metadata = { ...node.metadata, diagramId: stage.id, pipelineStatus: stage.status };
    group.add(node);
    stageNodes.push(node);
  }

  pipelineLayout(group, Math.max(8, Math.floor((canvas.width - 48) / Math.max(stages.length, 1) / 3)), 12, canvas.height);

  const edgeLayer = app.group({ zIndex: -10, listening: false }) as Group;
  edgeLayer.metadata.diagramEdgeLayer = true;
  for (let i = 0; i < stageNodes.length - 1; i++) {
    edgeLayer.add(
      connectNodes(app, stageNodes[i], stageNodes[i + 1], [], {
        parent: group,
        style: 'straight',
        stroke: getActiveDiagram().edge,
        glowColor: getActiveDiagram().edgeGlow,
        strokeWidth: edgeWidth,
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
