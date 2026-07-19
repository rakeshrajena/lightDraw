import type { ArrowStyle } from '../connectors';
import type { RouteStyle } from '../router';
import type { Node } from '../../Node';
import type { Group } from '../../shapes/Group';
import type { EditorEdgeRecord, EditorNodeRecord } from './types';

export function nodeDiagramId(node: Node): string | undefined {
  const id = node.metadata?.diagramId as string | undefined;
  if (id) return id;
  if (node.metadata?.orgNode) {
    const name = node.metadata?.orgName as string | undefined;
    return name ? `org:${name}` : undefined;
  }
  if (node.metadata?.pipelineStatus !== undefined) {
    return (node.metadata.diagramId as string) ?? undefined;
  }
  return undefined;
}

export function isEditableDiagramNode(node: Node): boolean {
  return !!(
    node.metadata?.diagramId ||
    node.metadata?.orgNode ||
    node.metadata?.pipelineStatus !== undefined ||
    node.metadata?.symbolType
  );
}

/** Walk diagram tree and collect editable node groups. */
export function collectEditableNodes(root: Group): Group[] {
  const out: Group[] = [];
  const walk = (parent: Group): void => {
    for (const child of parent.children) {
      if (child.metadata?.isDiagramHitTarget) continue;
      if (child.metadata?.diagramEditorOverlay) continue;
      if (isEditableDiagramNode(child)) {
        out.push(child as Group);
      }
      if ('children' in child && (child as Group).children?.length) {
        walk(child as Group);
      }
    }
  };
  walk(root);
  return out;
}

export function findEdgeLayer(root: Group): Group | undefined {
  for (const child of root.children) {
    if (child.metadata?.diagramEdgeLayer) return child as Group;
    if (child.zIndex === -10 && child.type === 'group' && !child.metadata?.diagramId) {
      return child as Group;
    }
  }
  return undefined;
}

export function collectEdgesFromLayer(edgeLayer: Group): EditorEdgeRecord[] {
  const edges: EditorEdgeRecord[] = [];
  for (const child of edgeLayer.children) {
    const from = child.metadata?.edgeFrom as string | undefined;
    const to = child.metadata?.edgeTo as string | undefined;
    if (!from || !to) continue;
    const rawWp = child.metadata?.edgeWaypoints as Array<{ x: number; y: number }> | undefined;
    edges.push({
      id: (child.metadata?.edgeId as string) ?? `${from}-${to}`,
      from,
      to,
      label: child.metadata?.edgeLabel as string | undefined,
      waypoints: Array.isArray(rawWp) ? rawWp.map((w) => ({ x: w.x, y: w.y })) : undefined,
      options: {
        style: child.metadata?.edgeStyle as RouteStyle | undefined,
        stroke: child.metadata?.edgeStroke as string | undefined,
        strokeWidth: child.metadata?.edgeStrokeWidth as number | undefined,
        glowColor: child.metadata?.edgeGlow as string | undefined,
        arrowEnd: child.metadata?.edgeArrowEnd as ArrowStyle | undefined,
        arrowStart: child.metadata?.edgeArrowStart as ArrowStyle | undefined,
        dash: child.metadata?.edgeDash as number[] | undefined,
        waypoints: Array.isArray(rawWp) ? rawWp.map((w) => ({ x: w.x, y: w.y })) : undefined,
      },
    });
  }
  return edges;
}

export function extractNodeLabel(node: Group): string {
  for (const child of node.children) {
    if (child.type === 'text' && 'text' in child) {
      const t = (child as { text: string }).text;
      if (t && t.trim()) return t;
    }
  }
  return (node.metadata?.diagramId as string) ?? 'Node';
}

export function buildNodeRecords(nodes: Group[]): EditorNodeRecord[] {
  return nodes.map((n) => ({
    id: nodeDiagramId(n) ?? n.id,
    label: extractNodeLabel(n),
  }));
}

export function findNodeByDiagramId(root: Group, id: string): Group | undefined {
  return collectEditableNodes(root).find((n) => nodeDiagramId(n) === id);
}

export function resolveEditableGroup(hit: Node | null | undefined): Group | undefined {
  let cur: Node | null | undefined = hit;
  while (cur) {
    if (isEditableDiagramNode(cur)) {
      return cur as Group;
    }
    cur = cur.parent;
  }
  return undefined;
}
