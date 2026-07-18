import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { getActiveDiagram } from './theme';
import type { Obstacle } from './types';
import { computeRoutePoints, getAnchor, collectObstaclesInParent, type RouteStyle } from './router';
import { getConnectorAnchors, getCardSideAnchor } from './coords';
import { createEdgeLabel } from './primitives';
import { quadraticPathD, quadraticToPoints, mermaidHorizontalLink, mermaidOrgBusPaths } from './pathUtils';

export type ArrowStyle = 'filled' | 'open' | 'hollow' | 'diamond' | 'diamondHollow' | 'none';

export interface ConnectorOptions {
  style?: RouteStyle;
  obstacles?: Obstacle[];
  parent?: Group;
  /** When set with parent, rebuild obstacles in parent-local space (drag-safe). */
  obstacleNodes?: Node[];
  stroke?: string;
  strokeWidth?: number;
  glowColor?: string;
  /** When false, skip the soft under-glow (cleaner for dense graphs). Default true. */
  glow?: boolean;
  arrowEnd?: ArrowStyle;
  arrowStart?: ArrowStyle;
  label?: string;
  labelColor?: string;
  dash?: number[];
  edgeId?: string;
  fromId?: string;
  toId?: string;
  cornerRadius?: number;
}

/** Angle of segment from (x1,y1) to (x2,y2) in radians */
export function segmentAngle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/** Sleek filled arrowhead (slightly longer, narrower than a blunt triangle). */
export function arrowHeadPoints(tipX: number, tipY: number, angle: number, size = 10): number[] {
  const half = size * 0.38;
  const back = size * 1.05;
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
  const half = size * 0.42;
  const back = size * 0.9;
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

/** UML composition / aggregation diamond */
export function diamondPoints(tipX: number, tipY: number, angle: number, size = 12): number[] {
  const len = size;
  const half = size * 0.45;
  const backX = tipX - len * Math.cos(angle);
  const backY = tipY - len * Math.sin(angle);
  const midX = tipX - (len * 0.5) * Math.cos(angle);
  const midY = tipY - (len * 0.5) * Math.sin(angle);
  const lx = midX + half * Math.sin(angle);
  const ly = midY - half * Math.cos(angle);
  const rx = midX - half * Math.sin(angle);
  const ry = midY + half * Math.cos(angle);
  return [tipX, tipY, lx, ly, backX, backY, rx, ry];
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

function addArrowMarker(
  app: App,
  group: Group,
  style: ArrowStyle,
  tipX: number,
  tipY: number,
  angle: number,
  stroke: string,
  strokeWidth: number,
  arrowSize: number
): void {
  if (style === 'none') return;
  if (style === 'filled') {
    group.add(
      app.polygon({
        points: arrowHeadPoints(tipX, tipY, angle, arrowSize),
        fill: stroke,
        stroke: stroke,
        strokeWidth: getActiveDiagram().stroke.arrow,
        listening: false,
      })
    );
    return;
  }
  if (style === 'open') {
    group.add(
      app.polyline({
        points: openArrowPoints(tipX, tipY, angle, arrowSize),
        fill: null,
        stroke,
        strokeWidth: Math.max(strokeWidth, 1.75),
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      })
    );
    return;
  }
  if (style === 'hollow') {
    // UML generalization: hollow triangle filled with surface so it reads on any theme
    group.add(
      app.polygon({
        points: arrowHeadPoints(tipX, tipY, angle, arrowSize + 3),
        fill: getActiveDiagram().surface,
        stroke,
        strokeWidth: Math.max(getActiveDiagram().stroke.node, 1.75),
        listening: false,
      })
    );
    return;
  }
  if (style === 'diamond' || style === 'diamondHollow') {
    group.add(
      app.polygon({
        points: diamondPoints(tipX, tipY, angle, arrowSize + 2),
        fill: style === 'diamond' ? stroke : getActiveDiagram().surface,
        stroke,
        strokeWidth: getActiveDiagram().stroke.node,
        listening: false,
      })
    );
  }
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
  const stroke = options.stroke ?? getActiveDiagram().edge;
  const strokeWidth = options.strokeWidth ?? getActiveDiagram().stroke.edge;
  const glowColor = options.glowColor ?? getActiveDiagram().edgeGlow;
  const useGlow = options.glow === true;
  const arrowEnd = options.arrowEnd ?? 'filled';
  const arrowStart = options.arrowStart ?? 'none';
  const arrowSize = Math.max(9, Math.min(14, strokeWidth * 5.5));
  const style = options.style ?? 'smart';
  const obstacles = options.obstacles ?? [];

  const points = computeRoutePoints(
    x1,
    y1,
    x2,
    y2,
    style,
    obstacles,
    options.cornerRadius
  );
  const group = app.group({ listening: false }) as Group;

  const trimEnd = arrowEnd !== 'none' ? arrowSize * 0.72 : 0;
  const trimStart = arrowStart !== 'none' ? arrowSize * 0.72 : 0;
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

  if (useGlow) {
    group.add(
      app.polyline({
        points: display,
        fill: null,
        stroke: glowColor,
        strokeWidth: strokeWidth + Math.max(2, getActiveDiagram().stroke.edgeGlow * 0.65),
        lineJoin: 'round',
        lineCap: 'round',
        opacity: 0.45,
        listening: false,
      })
    );
  }

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

  addArrowMarker(app, group, arrowEnd, x2, y2, endAngle, stroke, strokeWidth, arrowSize);
  addArrowMarker(
    app,
    group,
    arrowStart,
    x1,
    y1,
    startAngle + Math.PI,
    stroke,
    strokeWidth,
    arrowSize
  );

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

/** Curved mind-map branch (quadratic sampled as polyline), no arrowheads. */
export function createCurvedConnector(
  app: App,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  options: ConnectorOptions = {}
): Group {
  const stroke = options.stroke ?? getActiveDiagram().edge;
  const strokeWidth = options.strokeWidth ?? getActiveDiagram().stroke.edge;
  const glowColor = options.glowColor ?? getActiveDiagram().edgeGlow;
  const group = app.group({ listening: false }) as Group;

  const dx = x2 - x1;
  const dy = y2 - y1;
  // Control point pulls the curve outward for an organic branch feel
  const cx = x1 + dx * 0.45 - dy * 0.18;
  const cy = y1 + dy * 0.45 + dx * 0.18;
  const points = quadraticToPoints(x1, y1, cx, cy, x2, y2, 18);

  if (options.glow !== false) {
    group.add(
      app.polyline({
        points,
        fill: null,
        stroke: glowColor,
        strokeWidth: strokeWidth + 3,
        lineCap: 'round',
        lineJoin: 'round',
        opacity: 0.4,
        listening: false,
      })
    );
  }
  group.add(
    app.polyline({
      points,
      fill: null,
      stroke,
      strokeWidth,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );

  group.metadata.edgePoints = points;
  group.metadata.edgeStroke = stroke;
  group.metadata.edgePathD = quadraticPathD(x1, y1, cx, cy, x2, y2);
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
    if (options.obstacleNodes && options.obstacleNodes.length > 0) {
      routeObstacles = collectObstaclesInParent(options.obstacleNodes, parent, [from, to]);
    }
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

/** Draw a clean stroke polyline (Mermaid-like — no glow). */
function addCleanStroke(
  app: App,
  group: Group,
  points: number[],
  stroke: string,
  strokeWidth: number
): void {
  if (points.length < 4) return;
  group.add(
    app.polyline({
      points,
      fill: null,
      stroke,
      strokeWidth,
      lineJoin: 'round',
      lineCap: 'round',
      listening: false,
    })
  );
}

/** Wire org-chart with Mermaid flowchart-TB shared bus connectors */
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

  const orgRoots = root.children.filter((c) => c.metadata?.orgNode);
  for (const orgRoot of orgRoots) {
    walkOrgBusConnect(app, root, orgRoot as Group, edgeLayer);
  }
}

function walkOrgBusConnect(app: App, root: Group, node: Group, edgeLayer: Group): void {
  const children = node.children.filter(
    (c) => c.metadata?.orgNode && c.visible && c !== node.metadata?.collapseIndicator
  ) as Group[];

  if (children.length > 0) {
    const parentPt = getCardSideAnchor(node, root, 'bottom');
    const childPts = children.map((child) => {
      const top = getCardSideAnchor(child, root, 'top');
      return { x: top.x, topY: top.y };
    });

    const stroke = getActiveDiagram().orgEdge;
    const sw = getActiveDiagram().orgEdgeWidth;
    // Always draw filleted elbows (shared stem/bus overdraw is same stroke — looks smooth).
    const { elbows } = mermaidOrgBusPaths(parentPt.x, parentPt.y, childPts, 12);
    const g = app.group({ listening: false }) as Group;
    for (const elbow of elbows) {
      addCleanStroke(app, g, elbow, stroke, sw);
    }
    g.metadata.diagramOrgBus = true;
    edgeLayer.add(g);

    // Metadata stubs so the editor can discover parent→child edges
    const fromId = (node.metadata?.diagramId ?? node.metadata?.orgName) as string;
    for (const child of children) {
      const toId = (child.metadata?.diagramId ?? child.metadata?.orgName) as string;
      const stub = app.group({ listening: false }) as Group;
      stub.metadata.edgeFrom = fromId;
      stub.metadata.edgeTo = toId;
      stub.metadata.edgeId = `org_${fromId}_${toId}`;
      stub.metadata.edgeStyle = 'orthogonal';
      stub.metadata.edgeArrowEnd = 'none';
      stub.metadata.edgeStroke = stroke;
      stub.metadata.edgeStrokeWidth = sw;
      edgeLayer.add(stub);
    }
  }

  for (const child of children) {
    walkOrgBusConnect(app, root, child, edgeLayer);
  }
}

/** Mermaid-style mind-map links (horizontal cubics on card edges — not subtree bounds). */
export function wireMindMapConnectors(app: App, group: Group): void {
  if (group.children.length < 2) return;
  const center = group.children[0];
  const edges = app.group({ listening: false, zIndex: -10 }) as Group;
  edges.metadata.diagramEdgeLayer = true;

  for (let i = 1; i < group.children.length; i++) {
    const branch = group.children[i];
    if (branch.metadata?.diagramEdgeLayer) continue;

    const branchStroke =
      (branch.metadata?.mindBranchColor as string | undefined) ?? getActiveDiagram().mindBranch.stroke;
    const side = (branch.metadata?.mindSide as 'left' | 'right') ?? 'right';

    // Face toward each other on the horizontal axis
    const centerSide = side === 'right' ? 'right' : 'left';
    const branchInner = side === 'right' ? 'left' : 'right';
    const branchOuter = side === 'right' ? 'right' : 'left';

    const from = getCardSideAnchor(center, group, centerSide);
    const to = getCardSideAnchor(branch, group, branchInner);
    const link = mermaidHorizontalLink(from.x, from.y, to.x, to.y, 24);
    edges.add(
      createPolylineLink(app, link, branchStroke, getActiveDiagram().stroke.edge + 1.25, false)
    );

    const branchGroup = branch as Group;
    for (const leaf of branchGroup.children) {
      if (!leaf.metadata?.diagramId) continue;
      const leafInner = side === 'right' ? 'left' : 'right';
      const bOut = getCardSideAnchor(branch, group, branchOuter);
      const lIn = getCardSideAnchor(leaf, group, leafInner);
      const leafLink = mermaidHorizontalLink(bOut.x, bOut.y, lIn.x, lIn.y, 18);
      edges.add(
        createPolylineLink(
          app,
          leafLink,
          branchStroke,
          getActiveDiagram().stroke.edgeThin + 0.25,
          false
        )
      );
    }
  }
  group.add(edges);
}

function createPolylineLink(
  app: App,
  points: number[],
  stroke: string,
  strokeWidth: number,
  glow: boolean
): Group {
  const g = app.group({ listening: false }) as Group;
  if (glow) {
    g.add(
      app.polyline({
        points,
        fill: null,
        stroke,
        strokeWidth: strokeWidth + 3,
        opacity: 0.2,
        lineCap: 'round',
        lineJoin: 'round',
        listening: false,
      })
    );
  }
  g.add(
    app.polyline({
      points,
      fill: null,
      stroke,
      strokeWidth,
      lineCap: 'round',
      lineJoin: 'round',
      listening: false,
    })
  );
  g.metadata.edgePoints = points;
  g.metadata.edgeStroke = stroke;
  return g;
}
