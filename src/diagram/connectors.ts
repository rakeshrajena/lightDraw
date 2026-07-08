import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { DIAGRAM } from './theme';
import type { Obstacle } from './types';
import { collectObstacles, computeRoutePoints, getAnchor, type RouteStyle } from './router';
import { getConnectorAnchors, obstacleToParentLocal, worldToParentLocal } from './coords';
import { createEdgeLabel } from './primitives';

export type ArrowStyle = 'filled' | 'open' | 'hollow' | 'none';

export interface ConnectorOptions {
  style?: RouteStyle;
  obstacles?: Obstacle[];
  parent?: Group;
  stroke?: string;
  strokeWidth?: number;
  glowColor?: string;
  arrowEnd?: ArrowStyle;
  arrowStart?: ArrowStyle;
  label?: string;
  labelColor?: string;
  dash?: number[];
  edgeId?: string;
  fromId?: string;
  toId?: string;
}

/** Angle of segment from (x1,y1) to (x2,y2) in radians */
export function segmentAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Filled arrowhead triangle points at tip */
export function arrowHeadPoints(tipX: number, tipY: number, angle: number, size = 10): number[] {
  const half = size * 0.42;
  const back = size * 0.95;
  const bx = tipX - back * Math.cos(angle);
  const by = tipY - back * Math.sin(angle);
  const lx = bx + half * Math.sin(angle);
  const ly = by - half * Math.cos(angle);
  const rx = bx - half * Math.sin(angle);
  const ry = by + half * Math.cos(angle);
  return [tipX, tipY, lx, ly, rx, ry];
}

/** Open (V-shaped) arrow for associations */
export function openArrowPoints(tipX: number, tipY: number, angle: number, size = 10): number[] {
  const half = size * 0.4;
  const back = size * 0.85;
  const bx = tipX - back * Math.cos(angle);
  const by = tipY - back * Math.sin(angle);
  return [
    bx + half * Math.sin(angle),
    by - half * Math.cos(angle),
    tipX,
    tipY,
    bx - half * Math.sin(angle),
    by + half * Math.cos(angle),
  ];
}

/** Shorten terminal segment so arrowhead does not overlap stroke */
export function shortenPathEnd(points: number[], trim: number): number[] {
  if (points.length < 4 || trim <= 0) return points.slice();
  const copy = points.slice();
  const n = copy.length;
  const x2 = copy[n - 2];
  const y2 = copy[n - 1];
  const x1 = copy[n - 4];
  const y1 = copy[n - 3];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const t = Math.min(trim / Math.max(len, 1), 0.45);
  copy[n - 2] = x2 - (x2 - x1) * t;
  copy[n - 1] = y2 - (y2 - y1) * t;
  return copy;
}

/** Midpoint along polyline by arc length */
export function pathMidpoint(points: number[]): { x: number; y: number } {
  if (points.length < 4) return { x: points[0] ?? 0, y: points[1] ?? 0 };
  let total = 0;
  const segs: { len: number; x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[i + 2];
    const y2 = points[i + 3];
    const len = Math.hypot(x2 - x1, y2 - y1);
    segs.push({ len, x1, y1, x2, y2 });
    total += len;
  }
  let half = total / 2;
  for (const s of segs) {
    if (half <= s.len) {
      const t = s.len > 0 ? half / s.len : 0;
      return { x: s.x1 + (s.x2 - s.x1) * t, y: s.y1 + (s.y2 - s.y1) * t };
    }
    half -= s.len;
  }
  const last = segs[segs.length - 1];
  return { x: last.x2, y: last.y2 };
}

/** Build a connector group: routed path + arrowheads + optional label */
export function createConnector(
  app: App,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: ConnectorOptions = {}
): Group {
  const stroke = options.stroke ?? DIAGRAM.edge;
  const strokeWidth = options.strokeWidth ?? DIAGRAM.stroke.edge;
  const glowColor = options.glowColor ?? DIAGRAM.edgeGlow;
  const arrowEnd = options.arrowEnd ?? 'filled';
  const arrowStart = options.arrowStart ?? 'none';
  const arrowSize = 11;
  const style = options.style ?? 'smart';
  const obstacles = options.obstacles ?? [];

  const points = computeRoutePoints(x1, y1, x2, y2, style, obstacles);
  const group = app.group({ listening: false }) as Group;

  const trimEnd = arrowEnd !== 'none' ? arrowSize * 0.7 : 0;
  const trimStart = arrowStart !== 'none' ? arrowSize * 0.7 : 0;
  let display = points;
  if (trimEnd > 0) display = shortenPathEnd(display, trimEnd);
  if (trimStart > 0 && display.length >= 4) {
    const x0 = display[0];
    const y0 = display[1];
    const x1s = display[2];
    const y1s = display[3];
    const len = Math.hypot(x1s - x0, y1s - y0);
    const t = Math.min(trimStart / Math.max(len, 1), 0.45);
    display[0] = x0 + (x1s - x0) * t;
    display[1] = y0 + (y1s - y0) * t;
  }

  group.add(
    app.polyline({
      points: display,
      fill: null,
      stroke: glowColor,
      strokeWidth: strokeWidth + DIAGRAM.stroke.edgeGlow,
      lineJoin: 'round',
      lineCap: 'round',
      opacity: 0.85,
      listening: false,
    })
  );

  group.add(
    app.polyline({
      points: display,
      fill: null,
      stroke,
      strokeWidth,
      lineJoin: 'round',
      lineCap: 'round',
      ...(options.dash ? { dash: options.dash } : {}),
      listening: false,
    })
  );

  const endAngle = segmentAngle(
    points[points.length - 4],
    points[points.length - 3],
    points[points.length - 2],
    points[points.length - 1]
  );
  const startAngle = segmentAngle(points[0], points[1], points[2], points[3]);

  if (arrowEnd === 'filled') {
    group.add(
      app.polygon({
        points: arrowHeadPoints(x2, y2, endAngle, arrowSize),
        fill: stroke,
        stroke,
        strokeWidth: DIAGRAM.stroke.arrow,
        listening: false,
      })
    );
  } else if (arrowEnd === 'open') {
    group.add(
      app.polyline({
        points: openArrowPoints(x2, y2, endAngle, arrowSize),
        fill: null,
        stroke,
        strokeWidth,
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      })
    );
  } else if (arrowEnd === 'hollow') {
    group.add(
      app.polygon({
        points: arrowHeadPoints(x2, y2, endAngle, arrowSize + 2),
        fill: DIAGRAM.classFill,
        stroke,
        strokeWidth: DIAGRAM.stroke.node,
        listening: false,
      })
    );
  }

  if (arrowStart === 'filled') {
    group.add(
      app.polygon({
        points: arrowHeadPoints(x1, y1, startAngle + Math.PI, arrowSize),
        fill: stroke,
        stroke,
        strokeWidth: DIAGRAM.stroke.arrow,
        listening: false,
      })
    );
  }

  if (options.label) {
    const mid = pathMidpoint(points);
    group.add(createEdgeLabel(app, options.label, mid.x, mid.y - 6, stroke));
  }

  if (options.edgeId) group.metadata.edgeId = options.edgeId;
  if (options.fromId) group.metadata.edgeFrom = options.fromId;
  if (options.toId) group.metadata.edgeTo = options.toId;
  if (options.label) group.metadata.edgeLabel = options.label;
  group.metadata.edgeStroke = stroke;
  group.metadata.edgeStrokeWidth = strokeWidth;
  group.metadata.edgeGlow = glowColor;
  group.metadata.edgeStyle = style;
  group.metadata.edgeArrowEnd = arrowEnd;
  group.metadata.edgeArrowStart = arrowStart;
  if (options.dash) group.metadata.edgeDash = options.dash;

  return group;
}

/** Connect two diagram nodes with smart routing */
export function connectNodes(
  app: App,
  from: Node,
  to: Node,
  obstacles: Obstacle[],
  options: ConnectorOptions = {}
): Group {
  const parent = options.parent;
  let x1: number;
  let y1: number;
  let x2: number;
  let y2: number;
  let routeObstacles = obstacles;

  if (parent) {
    const anchors = getConnectorAnchors(from, to, parent);
    x1 = anchors.x1;
    y1 = anchors.y1;
    x2 = anchors.x2;
    y2 = anchors.y2;
    routeObstacles = obstacles.map((o) => obstacleToParentLocal(parent, o));
  } else {
    const toB = to.getBounds();
    const anchor = getAnchor(from, toB.x + toB.width / 2, toB.y + toB.height / 2);
    const toAnchor = getAnchor(to, anchor.x, anchor.y);
    x1 = anchor.x;
    y1 = anchor.y;
    x2 = toAnchor.x;
    y2 = toAnchor.y;
  }

  return createConnector(app, x1, y1, x2, y2, {
    style: 'smart',
    fromId: options.fromId ?? (from.metadata?.diagramId as string | undefined),
    toId: options.toId ?? (to.metadata?.diagramId as string | undefined),
    edgeId:
      options.edgeId ??
      `${options.fromId ?? from.metadata?.diagramId ?? 'a'}-${options.toId ?? to.metadata?.diagramId ?? 'b'}`,
    ...options,
    obstacles: routeObstacles,
  });
}

/** Wire org-chart parent → child connectors after tree layout */
export function wireOrgChartConnectors(app: App, root: Group): void {
  let edgeLayer = root.children.find((c) => c.metadata?.diagramEdgeLayer) as Group | undefined;
  if (edgeLayer) {
    for (const child of [...edgeLayer.children]) {
      edgeLayer.remove(child);
      child.destroy();
    }
  } else {
    edgeLayer = app.group({ listening: false, zIndex: -10 }) as Group;
    edgeLayer.metadata.diagramEdgeLayer = true;
    root.add(edgeLayer);
  }

  const obstacles = collectObstacles(collectOrgChartNodes(root));
  walkOrgEdgesConnect(app, root, root, edgeLayer, obstacles);
}

function collectOrgChartNodes(root: Group): Node[] {
  const out: Node[] = [];
  const walk = (group: Group): void => {
    for (const child of group.children) {
      if (child.metadata?.orgNode) out.push(child);
      if ('children' in child && (child as Group).children?.length) {
        walk(child as Group);
      }
    }
  };
  walk(root);
  return out;
}

function walkOrgEdgesConnect(
  app: App,
  root: Group,
  node: Group,
  edgeLayer: Group,
  obstacles: Obstacle[]
): void {
  const children = node.children.filter(
    (c) => c.metadata?.orgNode && c !== node.metadata?.collapseIndicator
  );
  for (const child of children) {
    if (!child.visible) continue;
    const fromId = (node.metadata?.diagramId ?? node.metadata?.orgName) as string;
    const toId = (child.metadata?.diagramId ?? child.metadata?.orgName) as string;
    edgeLayer.add(
      connectNodes(app, node, child, obstacles, {
        parent: root,
        style: 'orthogonal',
        stroke: DIAGRAM.edge,
        glowColor: DIAGRAM.edgeGlow,
        strokeWidth: DIAGRAM.stroke.edge,
        arrowEnd: 'filled',
        edgeId: `org_${fromId}_${toId}`,
        fromId,
        toId,
      })
    );
    walkOrgEdgesConnect(app, root, child as Group, edgeLayer, obstacles);
  }
}

/** Wire mind-map center → branches → leaves */
export function wireMindMapConnectors(app: App, group: Group): void {
  if (group.children.length < 2) return;
  const center = group.children[0];
  const edges = app.group({ listening: false, zIndex: -10 }) as Group;
  const cB = center.getBounds();
  const cx = worldToParentLocal(group, cB.x + cB.width / 2, cB.y + cB.height / 2).x;
  const cy = worldToParentLocal(group, cB.x + cB.width / 2, cB.y + cB.height / 2).y;

  for (let i = 1; i < group.children.length; i++) {
    const branch = group.children[i];
    const branchStroke =
      (branch.metadata?.mindBranchColor as string | undefined) ?? DIAGRAM.mindBranch.stroke;
    const branchGlow =
      (branch.metadata?.mindBranchGlow as string | undefined) ?? DIAGRAM.edgeGlow;
    const bB = branch.getBounds();
    const bx = worldToParentLocal(group, bB.x + bB.width / 2, bB.y + bB.height / 2).x;
    const by = worldToParentLocal(group, bB.x + bB.width / 2, bB.y + bB.height / 2).y;
    edges.add(
      createConnector(app, cx, cy, bx, by, {
        style: 'straight',
        stroke: branchStroke,
        glowColor: branchGlow,
        strokeWidth: DIAGRAM.stroke.edge,
        arrowEnd: 'none',
      })
    );

    const branchGroup = branch as Group;
    for (const leaf of branchGroup.children) {
      const lB = leaf.getBounds();
      const lx = worldToParentLocal(group, lB.x + lB.width / 2, lB.y).x;
      const ly = worldToParentLocal(group, lB.x + lB.width / 2, lB.y).y;
      const branchBottom = worldToParentLocal(group, bB.x + bB.width / 2, bB.y + bB.height).y;
      edges.add(
        createConnector(app, bx, branchBottom, lx, ly, {
          style: 'orthogonal',
          stroke: branchStroke,
          glowColor: branchGlow,
          strokeWidth: DIAGRAM.stroke.edgeThin,
          arrowEnd: 'filled',
        })
      );
    }
  }
  group.add(edges);
}
