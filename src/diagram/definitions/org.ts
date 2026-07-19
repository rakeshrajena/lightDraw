/**
 * Diagram builder — org.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import type { Node } from '../../Node';
import type { NodeOptions } from '../../types';
import {
  createDiagramGroup,
  fitDiagramToBounds,
  readCanvasSize,
  setDiagramState,
} from '../helpers';
import {
  createOrgNode,
  countOrgDescendants,
  resolveOrgBranchStyle,
  buildDistinctOrgBranchPalette,
  hashOrgBranchSeed,
  updateOrgCollapseButton,
} from '../primitives';
import { layoutDiagram } from '../layouts';
import { wireOrgChartConnectors } from '../connectors';
import type { OrgChartNode } from '../types';

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
  branchIndex: number | null = null,
  branchPalette: ReturnType<typeof buildDistinctOrgBranchPalette> | null = null
): Group {
  const childCount = data.children?.length ?? 0;
  const descendantCount = countOrgDataDescendants(data);
  const collapsed = data.collapsed ?? false;
  const style = resolveOrgBranchStyle(depth, branchIndex, branchPalette);
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
    // Root: allocate unique colors for every top-level branch (N, no repeats)
    const palette =
      depth === 0
        ? buildDistinctOrgBranchPalette(
            data.children.length,
            hashOrgBranchSeed(data.children.map((c) => c.name))
          )
        : branchPalette;
    data.children.forEach((child, i) => {
      const childBranch = depth === 0 ? i : branchIndex;
      const childNode = buildOrgNode(app, node, child, 0, 0, depth + 1, childBranch, palette);
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
