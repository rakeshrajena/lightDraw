import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { connectNodes, wireOrgChartConnectors, wireMindMapConnectors } from '../connectors';
import { getActiveDiagram } from '../theme';
import { collectObstacles } from '../router';
import { rewireSchematic } from '../symbols';
import {
  collectEditableNodes,
  collectEdgesFromLayer,
  findEdgeLayer,
  findNodeByDiagramId,
} from './collect';
import type { DiagramEdge } from '../types';
import type { EditorEdgeRecord } from './types';
import { refreshDiagramFlow, stopDiagramFlow } from '../flow';

/** Rebuild all connectors in the diagram edge layer from stored edge metadata. */
export function rerouteDiagramEdges(app: App, root: Group, edges?: EditorEdgeRecord[]): void {
  stopDiagramFlow(root);
  const type = root.metadata?.diagramType as string | undefined;

  // Keep Mermaid-style wiring for org / mind maps
  if (type === 'orgChart') {
    wireOrgChartConnectors(app, root);
    root.markDirty();
    refreshDiagramFlow(app, root);
    return;
  }
  if (type === 'mindMap') {
    for (const child of [...root.children]) {
      if (child.metadata?.diagramEdgeLayer) {
        root.remove(child);
        child.destroy();
      }
    }
    wireMindMapConnectors(app, root);
    root.markDirty();
    refreshDiagramFlow(app, root);
    return;
  }
  if (type === 'electricalSchematic') {
    rewireSchematic(app, root);
    refreshDiagramFlow(app, root);
    return;
  }

  const edgeLayer = findEdgeLayer(root);
  if (!edgeLayer) return;

  const records = edges ?? collectEdgesFromLayer(edgeLayer);
  const nodeMap = new Map(collectEditableNodes(root).map((n) => [n.metadata.diagramId as string, n]));

  for (const child of [...edgeLayer.children]) {
    edgeLayer.remove(child);
    child.destroy();
  }

  const obstacles = collectObstacles([...nodeMap.values()]);
  const allNodes = [...nodeMap.values()];
  for (const edge of records) {
    const from = findNodeByDiagramId(root, edge.from) ?? nodeMap.get(edge.from);
    const to = findNodeByDiagramId(root, edge.to) ?? nodeMap.get(edge.to);
    if (!from || !to) continue;
    edgeLayer.add(
      connectNodes(app, from, to, obstacles, {
        parent: root,
        obstacleNodes: allNodes,
        stroke: edge.options?.stroke ?? getActiveDiagram().edge,
        glowColor: edge.options?.glowColor ?? getActiveDiagram().edgeGlow,
        strokeWidth: edge.options?.strokeWidth ?? getActiveDiagram().stroke.edge,
        label: edge.label,
        style: edge.options?.style ?? 'smart',
        arrowEnd: edge.options?.arrowEnd ?? 'filled',
        arrowStart: edge.options?.arrowStart ?? 'none',
        dash: edge.options?.dash,
        cornerRadius: edge.options?.cornerRadius ?? 16,
        waypoints: edge.waypoints ?? edge.options?.waypoints,
        edgeId: edge.id,
        fromId: edge.from,
        toId: edge.to,
      })
    );
  }
  root.markDirty();
  refreshDiagramFlow(app, root);
}

/**
 * Drop manual bend points on edges touching `nodeId` so smart routing can
 * rebuild a clean path after rotate/move. Users can add bends again afterward.
 */
export function clearEdgeWaypointsForNode(root: Group, nodeId: string): void {
  const edgeLayer = findEdgeLayer(root);
  if (!edgeLayer || !nodeId) return;
  for (const child of edgeLayer.children) {
    const from = child.metadata?.edgeFrom as string | undefined;
    const to = child.metadata?.edgeTo as string | undefined;
    if (from !== nodeId && to !== nodeId) continue;
    delete child.metadata.edgeWaypoints;
  }
}

/** Persist node positions into diagramState for JSON round-trip. */
export function syncPositionsToState(root: Group): void {
  const state = { ...(root.metadata?.diagramState as Record<string, unknown> | undefined) };
  const type = root.metadata?.diagramType as string | undefined;
  const nodes = collectEditableNodes(root);

  const positions: Record<
    string,
    { x: number; y: number; scaleX?: number; scaleY?: number; rotation?: number }
  > = {};
  for (const n of nodes) {
    const id = n.metadata?.diagramId as string;
    if (!id) continue;
    positions[id] = {
      x: n.x,
      y: n.y,
      scaleX: n.scaleX,
      scaleY: n.scaleY,
      rotation: n.rotation,
    };
  }
  state.editorPositions = positions;

  if (type === 'flowchart' || type === 'networkTopology') {
    const data = state.data as
      | { nodes: Array<{ id: string; x?: number; y?: number; rotation?: number }> }
      | undefined;
    if (data?.nodes) {
      for (const n of data.nodes) {
        const p = positions[n.id];
        if (p) {
          n.x = p.x;
          n.y = p.y;
          n.rotation = p.rotation;
        }
      }
      state.data = data;
    }
  }

  if (type === 'stateMachine') {
    const data = state.data as {
      states: Array<{ id: string; x?: number; y?: number; rotation?: number }>;
    } | undefined;
    if (data?.states) {
      for (const s of data.states) {
        const p = positions[s.id];
        if (p) {
          s.x = p.x;
          s.y = p.y;
          s.rotation = p.rotation;
        }
      }
      state.data = data;
    }
  }

  if (type === 'processPipeline') {
    const stages = state.stages as Array<{ id: string }> | undefined;
    if (stages) {
      state.stages = stages.map((s) => {
        const p = positions[s.id];
        return p ? { ...s, x: p.x, y: p.y, rotation: p.rotation } : s;
      });
    }
  }

  if (type === 'electricalSchematic') {
    const components = state.components as
      | Array<{ id: string; x?: number; y?: number; rotation?: number }>
      | undefined;
    if (components) {
      state.components = components.map((c) => {
        const p = positions[c.id];
        return p ? { ...c, x: p.x, y: p.y, rotation: p.rotation } : c;
      });
    }
  }

  if (type === 'classDiagram') {
    const data = state.data as {
      classes: Array<{ id: string; x?: number; y?: number; rotation?: number }>;
    } | undefined;
    if (data?.classes) {
      for (const c of data.classes) {
        const p = positions[c.id];
        if (p) {
          c.x = p.x;
          c.y = p.y;
          c.rotation = p.rotation;
        }
      }
      state.data = data;
    }
  }

  root.metadata.diagramState = state;
}

export function syncEdgesToState(root: Group): void {
  const edgeLayer = findEdgeLayer(root);
  if (!edgeLayer) return;
  const edges = collectEdgesFromLayer(edgeLayer);
  const state = { ...(root.metadata?.diagramState as Record<string, unknown> | undefined) };
  state.editorEdges = edges;

  const type = root.metadata?.diagramType as string | undefined;
  if (type === 'flowchart' || type === 'networkTopology') {
    const data = state.data as { edges: DiagramEdge[] } | undefined;
    if (data) {
      data.edges = edges.map((e) => ({ from: e.from, to: e.to, label: e.label }));
      state.data = data;
    }
  }
  if (type === 'stateMachine') {
    const data = state.data as { transitions: DiagramEdge[] } | undefined;
    if (data) {
      data.transitions = edges.map((e) => ({ from: e.from, to: e.to, label: e.label }));
      state.data = data;
    }
  }

  root.metadata.diagramState = state;
}
