import type { App } from '../../App';
import type { Node } from '../../Node';
import type { Group } from '../../shapes/Group';
import { wirePointerDrag } from '../../components/interaction';
import { connectNodes } from '../connectors';
import { collectObstacles } from '../router';
import { getActiveDiagram } from '../theme';
import { nearestPointOnPolyline } from '../pathUtils';
import { collectEditableNodes, collectEdgesFromLayer, findEdgeLayer, findNodeByDiagramId, nodeDiagramId, resolveEditableGroup } from './collect';
import { attachEdgeHitTarget, edgeAnchorPoint } from './edgeWiring';
import { showLabelEditor } from './labelEdit';
import { rerouteDiagramEdges, syncEdgesToState, syncPositionsToState } from './reroute';
import { applyAnchoredResize, RESIZE_HANDLES, type ResizeHandleId } from './resize';
import type { DiagramEditorHandle, DiagramEditorOptions, DiagramEditorTool } from './types';

const HANDLE = 9;
const BEND_R = 6;

function resolveEditorFlags(options: DiagramEditorOptions): {
  allowLabelEdit: boolean;
  allowResize: boolean;
  allowConnect: boolean;
  allowBendPoints: boolean;
} {
  const arrange = options.mode === 'arrange';
  return {
    allowLabelEdit: options.allowLabelEdit ?? !arrange,
    // Resize from edges/corners is available in arrange mode too
    allowResize: options.allowResize ?? true,
    allowConnect: options.allowConnect ?? !arrange,
    allowBendPoints: options.allowBendPoints ?? true,
  };
}

export class DiagramEditor implements DiagramEditorHandle {
  readonly root: Group;
  private app: App;
  private options: DiagramEditorOptions;
  private flags: ReturnType<typeof resolveEditorFlags>;
  private overlay: Group;
  private tool: DiagramEditorTool = 'select';
  private selectedId: string | null = null;
  private selectedEdgeId: string | null = null;
  private connectFromId: string | null = null;
  private previewLine: Node | null = null;
  private handlers: Array<{ node: Node; type: string; fn: (...args: unknown[]) => void }> = [];
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private destroyed = false;
  private dragRaf = 0;

  constructor(app: App, root: Group, options: DiagramEditorOptions = {}) {
    this.app = app;
    this.root = root;
    this.options = { gridSize: 8, showPorts: true, ...options };
    this.flags = resolveEditorFlags(this.options);
    this.tool = this.flags.allowConnect ? (options.tool ?? 'select') : 'select';
    this.overlay = app.group({ zIndex: 1000, listening: true }) as Group;
    this.overlay.metadata.diagramEditorOverlay = true;
    app.stage.add(this.overlay);
    if (this.flags.allowConnect) {
      this.keyHandler = (e: KeyboardEvent) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        if (!this.selectedEdgeId) return;
        e.preventDefault();
        this.deleteSelectedEdge();
      };
      window.addEventListener('keydown', this.keyHandler);
    } else if (this.flags.allowBendPoints) {
      // Arrange mode: Delete removes the last bend point on the selected wire
      this.keyHandler = (e: KeyboardEvent) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        if (!this.selectedEdgeId) return;
        e.preventDefault();
        this.removeLastBendPoint(this.selectedEdgeId);
      };
      window.addEventListener('keydown', this.keyHandler);
    }
  }

  setTool(tool: DiagramEditorTool): void {
    if (!this.flags.allowConnect && tool === 'connect') return;
    this.tool = tool;
    this.connectFromId = null;
    this.clearPreview();
    this.refreshOverlay();
  }

  getTool(): DiagramEditorTool {
    return this.tool;
  }

  selectNode(id: string | null): void {
    this.selectedId = id;
    this.selectedEdgeId = null;
    this.refreshOverlay();
    this.app.requestRender();
  }

  selectEdge(id: string | null): void {
    this.selectedEdgeId = id;
    this.selectedId = null;
    this.connectFromId = null;
    this.refreshOverlay();
    this.app.requestRender();
  }

  getSelectedEdgeId(): string | null {
    return this.selectedEdgeId;
  }

  getSelectedNodeId(): string | null {
    return this.selectedId;
  }

  reroute(): void {
    rerouteDiagramEdges(this.app, this.root);
  }

  wireNode(node: Group): void {
    const id = nodeDiagramId(node);
    if (!id) return;

    const onClick = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (this.flags.allowConnect && this.tool === 'connect') {
        if (!this.connectFromId) {
          this.connectFromId = id;
          this.selectNode(id);
        } else if (this.connectFromId !== id) {
          this.addEdge(this.connectFromId, id);
          this.connectFromId = null;
          this.selectNode(id);
        }
        return;
      }
      this.selectNode(id);
    };

    const onDblClick = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      if (!this.flags.allowLabelEdit) return;
      showLabelEditor(this.app, node, (text) => {
        this.updateNodeLabel(node, text);
        this.emitChange();
        this.app.requestRender();
      });
    };

    const onDragMove = () => {
      const grid = this.options.gridSize ?? 0;
      if (grid > 0) {
        node.x = Math.round(node.x / grid) * grid;
        node.y = Math.round(node.y / grid) * grid;
      }
      // Live wire follow — coalesce to one reroute per frame
      if (this.dragRaf) cancelAnimationFrame(this.dragRaf);
      this.dragRaf = requestAnimationFrame(() => {
        this.dragRaf = 0;
        if (this.destroyed) return;
        rerouteDiagramEdges(this.app, this.root);
        this.refreshOverlay();
        this.app.requestRender();
      });
    };

    const onDragEnd = () => {
      if (this.dragRaf) {
        cancelAnimationFrame(this.dragRaf);
        this.dragRaf = 0;
      }
      rerouteDiagramEdges(this.app, this.root);
      syncPositionsToState(this.root);
      this.wireEdges();
      this.refreshOverlay();
      this.emitChange();
      this.app.requestRender();
    };

    node.on('click', onClick as never);
    if (this.flags.allowLabelEdit) {
      node.on('dblclick', onDblClick as never);
    }
    node.on('dragmove', onDragMove as never);
    node.on('dragend', onDragEnd as never);

    this.handlers.push(
      { node, type: 'click', fn: onClick as never },
      { node, type: 'dragmove', fn: onDragMove as never },
      { node, type: 'dragend', fn: onDragEnd as never }
    );
    if (this.flags.allowLabelEdit) {
      this.handlers.push({ node, type: 'dblclick', fn: onDblClick as never });
    }
  }

  wireEdges(): void {
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer) return;
    if (!this.flags.allowConnect && !this.flags.allowBendPoints) return;

    // Edge layers are created listening:false; without this, hitTest skips all wires.
    edgeLayer.listening = true;

    for (const child of edgeLayer.children) {
      const from = child.metadata?.edgeFrom as string | undefined;
      const to = child.metadata?.edgeTo as string | undefined;
      if (!from || !to) continue;
      if (child.metadata?.edgeEditorWired) continue;

      attachEdgeHitTarget(this.app, child as Group);
      const edgeId = (child.metadata?.edgeId as string) ?? `${from}-${to}`;

      const onClick = (e: { stopPropagation: () => void }) => {
        e.stopPropagation();
        this.selectEdge(edgeId);
      };

      const onDblClick = (e: {
        stopPropagation: () => void;
        worldX?: number;
        worldY?: number;
      }) => {
        e.stopPropagation();
        if (!this.flags.allowBendPoints) return;
        const wx = e.worldX ?? 0;
        const wy = e.worldY ?? 0;
        this.addBendPointAt(edgeId, wx, wy);
      };

      child.on('click', onClick as never);
      if (this.flags.allowBendPoints) {
        child.on('dblclick', onDblClick as never);
      }
      child.metadata.edgeEditorWired = true;
      this.handlers.push({ node: child, type: 'click', fn: onClick as never });
      if (this.flags.allowBendPoints) {
        this.handlers.push({ node: child, type: 'dblclick', fn: onDblClick as never });
      }
    }
  }

  deleteSelectedEdge(): void {
    if (!this.selectedEdgeId) return;
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer) return;

    const remaining = collectEdgesFromLayer(edgeLayer).filter((e) => e.id !== this.selectedEdgeId);
    rerouteDiagramEdges(this.app, this.root, remaining);
    syncEdgesToState(this.root);
    this.selectedEdgeId = null;
    this.wireEdges();
    this.refreshOverlay();
    this.emitChange();
    this.app.requestRender();
  }

  private rewireEdgeEndpoint(edgeId: string, end: 'from' | 'to', newNodeId: string): void {
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer) return;
    const edges = collectEdgesFromLayer(edgeLayer);
    const edge = edges.find((e) => e.id === edgeId);
    if (!edge) return;

    const nextFrom = end === 'from' ? newNodeId : edge.from;
    const nextTo = end === 'to' ? newNodeId : edge.to;
    if (nextFrom === nextTo) return;

    const updated = edges.map((e) =>
      e.id === edgeId ? { ...e, from: nextFrom, to: nextTo, id: `e_${nextFrom}_${nextTo}_${Date.now()}` } : e
    );
    rerouteDiagramEdges(this.app, this.root, updated);
    syncEdgesToState(this.root);
    this.selectedEdgeId = updated.find((e) => e.from === nextFrom && e.to === nextTo)?.id ?? null;
    this.wireEdges();
    this.refreshOverlay();
    this.emitChange();
    this.app.requestRender();
  }

  private addEdge(from: string, to: string): void {
    const edgeLayer = this.root.children.find((c) => c.metadata?.diagramEdgeLayer) as
      | Group
      | undefined;
    if (!edgeLayer) return;
    const id = `e_${from}_${to}_${Date.now()}`;
    const fromNode = findNodeByDiagramId(this.root, from);
    const toNode = findNodeByDiagramId(this.root, to);
    if (!fromNode || !toNode) return;

    const obstacles = collectObstacles(collectEditableNodes(this.root));
    edgeLayer.add(
      connectNodes(this.app, fromNode, toNode, obstacles, {
        parent: this.root,
        stroke: getActiveDiagram().edge,
        glowColor: getActiveDiagram().edgeGlow,
        strokeWidth: getActiveDiagram().stroke.edge,
        edgeId: id,
        fromId: from,
        toId: to,
      })
    );
    syncEdgesToState(this.root);
    this.wireEdges();
    this.selectEdge(id);
    this.emitChange();
    this.app.requestRender();
  }

  private updateNodeLabel(node: Group, text: string): void {
    for (const child of node.children) {
      if (child.type === 'text' && 'text' in child) {
        (child as { text: string }).text = text;
        child.markDirty?.();
      }
    }
    const state = { ...(this.root.metadata?.diagramState as Record<string, unknown>) };
    const type = this.root.metadata?.diagramType as string;
    const id = node.metadata?.diagramId as string;
    if ((type === 'flowchart' || type === 'networkTopology') && state.data) {
      const data = state.data as { nodes: Array<{ id: string; label: string }> };
      const n = data.nodes.find((x) => x.id === id);
      if (n) n.label = text;
      state.data = data;
    }
    this.root.metadata.diagramState = state;
  }

  private refreshOverlay(): void {
    this.overlay.clear();
    if (this.selectedEdgeId && (this.flags.allowConnect || this.flags.allowBendPoints)) {
      this.drawEdgeSelection(this.selectedEdgeId);
      return;
    }
    if (!this.selectedId) return;
    const node = findNodeByDiagramId(this.root, this.selectedId);
    if (!node) return;

    const pos = (() => {
      let x = 0;
      let y = 0;
      let cur: Node | null = node;
      while (cur && cur !== this.root) {
        x += cur.x;
        y += cur.y;
        cur = cur.parent;
      }
      return { x, y };
    })();
    const cardW = (node.metadata?.orgCardWidth ?? node.metadata?.diagramCardWidth) as
      | number
      | undefined;
    const cardH = (node.metadata?.orgCardHeight ?? node.metadata?.diagramCardHeight) as
      | number
      | undefined;
    const bw = cardW ?? 40;
    const bh = cardH ?? 32;
    const sx = this.root.scaleX || 1;
    const sy = this.root.scaleY || 1;
    const wx = this.root.x + pos.x * sx;
    const wy = this.root.y + pos.y * sy;
    const w = bw * node.scaleX * sx;
    const h = bh * node.scaleY * sy;

    this.overlay.add(
      this.app.rect({
        x: wx - 3,
        y: wy - 3,
        width: w + 6,
        height: h + 6,
        fill: null,
        stroke: getActiveDiagram().mindBranch.stroke,
        strokeWidth: 1.5,
        dash: [5, 4],
        listening: false,
      })
    );

    // Connection ports (mid-side) — wires attach here and stretch when dragging
    const ports = [
      { px: wx + w / 2, py: wy },
      { px: wx + w, py: wy + h / 2 },
      { px: wx + w / 2, py: wy + h },
      { px: wx, py: wy + h / 2 },
    ];
    for (const p of ports) {
      this.overlay.add(
        this.app.circle({
          x: p.px - 3.5,
          y: p.py - 3.5,
          radius: 3.5,
          fill: getActiveDiagram().edge,
          stroke: '#fff',
          strokeWidth: 1.25,
          listening: false,
        })
      );
    }

    if (this.flags.allowResize && this.tool === 'select') {
      this.addResizeHandles(node, wx, wy, w, h);
    }
    if (this.flags.allowConnect && this.tool === 'connect' && this.options.showPorts) {
      this.addPorts(node, wx, wy, w, h);
    }
  }

  private drawEdgeSelection(edgeId: string): void {
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer) return;
    const edgeGroup = edgeLayer.children.find(
      (c) => ((c.metadata?.edgeId as string) ?? `${c.metadata?.edgeFrom}-${c.metadata?.edgeTo}`) === edgeId
    ) as Group | undefined;
    const record = collectEdgesFromLayer(edgeLayer).find((e) => e.id === edgeId);
    if (!record) return;

    // Highlight the actual wire path when available
    const pathPts = (edgeGroup?.metadata?.edgePoints as number[] | undefined) ?? [];
    if (pathPts.length >= 4) {
      const stagePts: number[] = [];
      for (let i = 0; i < pathPts.length; i += 2) {
        const s = this.rootLocalToStage(pathPts[i], pathPts[i + 1]);
        stagePts.push(s.x, s.y);
      }
      this.overlay.add(
        this.app.polyline({
          points: stagePts,
          fill: null,
          stroke: getActiveDiagram().mindBranch.stroke,
          strokeWidth: 3,
          opacity: 0.55,
          lineJoin: 'round',
          lineCap: 'round',
          listening: false,
        })
      );
    }

    if (this.flags.allowBendPoints) {
      const wps = record.waypoints ?? [];
      wps.forEach((wp, index) => {
        const stage = this.rootLocalToStage(wp.x, wp.y);
        this.addBendHandle(stage.x, stage.y, edgeId, index);
      });
    }

    if (this.flags.allowConnect) {
      const fromNode = findNodeByDiagramId(this.root, record.from);
      const toNode = findNodeByDiagramId(this.root, record.to);
      if (fromNode && toNode) {
        const fromPt = edgeAnchorPoint(this.root, fromNode, toNode, 'from');
        const toPt = edgeAnchorPoint(this.root, fromNode, toNode, 'to');
        this.addEndpointHandle(fromPt.x, fromPt.y, 'from', edgeId);
        this.addEndpointHandle(toPt.x, toPt.y, 'to', edgeId);
      }
    }
  }

  /** Diagram-local → stage/world (accounts for fitToBounds scale/offset). */
  private rootLocalToStage(lx: number, ly: number): { x: number; y: number } {
    const sx = this.root.scaleX || 1;
    const sy = this.root.scaleY || 1;
    return { x: this.root.x + lx * sx, y: this.root.y + ly * sy };
  }

  /** Stage/world → diagram-local. */
  private stageToRootLocal(wx: number, wy: number): { x: number; y: number } {
    const sx = this.root.scaleX || 1;
    const sy = this.root.scaleY || 1;
    return { x: (wx - this.root.x) / sx, y: (wy - this.root.y) / sy };
  }

  private findEdgeGroup(edgeId: string): Group | undefined {
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer) return undefined;
    return edgeLayer.children.find((c) => {
      const id = (c.metadata?.edgeId as string) ?? `${c.metadata?.edgeFrom}-${c.metadata?.edgeTo}`;
      return id === edgeId;
    }) as Group | undefined;
  }

  private updateEdgeWaypoints(edgeId: string, waypoints: Array<{ x: number; y: number }>, opts?: { live?: boolean }): void {
    const edgeLayer = findEdgeLayer(this.root);
    if (!edgeLayer) return;
    const edges = collectEdgesFromLayer(edgeLayer).map((e) =>
      e.id === edgeId
        ? {
            ...e,
            waypoints: waypoints.map((w) => ({ x: w.x, y: w.y })),
            options: { ...e.options, waypoints: waypoints.map((w) => ({ x: w.x, y: w.y })) },
          }
        : e
    );
    rerouteDiagramEdges(this.app, this.root, edges);
    if (!opts?.live) {
      syncEdgesToState(this.root);
      this.wireEdges();
      this.refreshOverlay();
    } else {
      // Rebuild wires under the handles; keep overlay so the active bend drag isn't destroyed
      this.wireEdges();
    }
    this.app.requestRender();
  }

  private addBendPointAt(edgeId: string, stageX: number, stageY: number): void {
    const edge = this.findEdgeGroup(edgeId);
    if (!edge) return;
    const local = this.stageToRootLocal(stageX, stageY);
    const path = (edge.metadata?.edgePoints as number[] | undefined) ?? [];
    const current = ((edge.metadata?.edgeWaypoints as Array<{ x: number; y: number }>) ?? []).slice();

    let point = { x: local.x, y: local.y };
    if (path.length >= 4) {
      const near = nearestPointOnPolyline(path, local.x, local.y);
      point = { x: near.x, y: near.y };
    }

    current.push(point);
    const ordered = this.orderWaypointsAlongEdge(edgeId, current);
    this.selectEdge(edgeId);
    this.updateEdgeWaypoints(edgeId, ordered);
    this.emitChange();
  }

  private orderWaypointsAlongEdge(
    edgeId: string,
    waypoints: Array<{ x: number; y: number }>
  ): Array<{ x: number; y: number }> {
    const edge = this.findEdgeGroup(edgeId);
    const path = (edge?.metadata?.edgePoints as number[] | undefined) ?? [];
    if (path.length < 4 || waypoints.length <= 1) return waypoints.slice();

    const score = (wx: number, wy: number): number => {
      let bestT = 0;
      let bestD = Infinity;
      let acc = 0;
      for (let i = 0; i < path.length - 2; i += 2) {
        const x0 = path[i];
        const y0 = path[i + 1];
        const x1 = path[i + 2];
        const y1 = path[i + 3];
        const segLen = Math.hypot(x1 - x0, y1 - y0);
        const dx = x1 - x0;
        const dy = y1 - y0;
        const lenSq = dx * dx + dy * dy;
        const t = lenSq < 1e-8 ? 0 : Math.max(0, Math.min(1, ((wx - x0) * dx + (wy - y0) * dy) / lenSq));
        const px = x0 + dx * t;
        const py = y0 + dy * t;
        const d = Math.hypot(wx - px, wy - py);
        if (d < bestD) {
          bestD = d;
          bestT = acc + segLen * t;
        }
        acc += segLen;
      }
      return bestT;
    };

    return waypoints.slice().sort((a, b) => score(a.x, a.y) - score(b.x, b.y));
  }

  private removeLastBendPoint(edgeId: string): void {
    const edge = this.findEdgeGroup(edgeId);
    if (!edge) return;
    const current = ((edge.metadata?.edgeWaypoints as Array<{ x: number; y: number }>) ?? []).slice();
    if (current.length === 0) return;
    current.pop();
    this.updateEdgeWaypoints(edgeId, current);
    this.emitChange();
  }

  private addBendHandle(stageX: number, stageY: number, edgeId: string, index: number): void {
    const handle = this.app.circle({
      x: stageX - BEND_R,
      y: stageY - BEND_R,
      radius: BEND_R,
      fill: '#fff',
      stroke: getActiveDiagram().mindBranch.stroke,
      strokeWidth: 2,
      listening: true,
    });
    handle.metadata.diagramEditorOverlay = true;
    handle.metadata.edgeBendIndex = index;
    this.overlay.add(handle);

    let liveWps: Array<{ x: number; y: number }> | null = null;

    wirePointerDrag(
      handle,
      (wx, wy) => {
        const local = this.stageToRootLocal(wx, wy);
        const grid = this.options.gridSize ?? 0;
        if (grid > 0) {
          local.x = Math.round(local.x / grid) * grid;
          local.y = Math.round(local.y / grid) * grid;
        }
        if (!liveWps) {
          const edge = this.findEdgeGroup(edgeId);
          liveWps = ((edge?.metadata?.edgeWaypoints as Array<{ x: number; y: number }>) ?? []).map(
            (w) => ({ x: w.x, y: w.y })
          );
        }
        if (!liveWps[index]) return;
        liveWps[index] = { x: local.x, y: local.y };
        // Move handle immediately for snappy UX
        handle.x = this.rootLocalToStage(local.x, local.y).x - BEND_R;
        handle.y = this.rootLocalToStage(local.x, local.y).y - BEND_R;
        if (this.dragRaf) cancelAnimationFrame(this.dragRaf);
        const snapshot = liveWps.map((w) => ({ x: w.x, y: w.y }));
        this.dragRaf = requestAnimationFrame(() => {
          this.dragRaf = 0;
          if (this.destroyed) return;
          this.updateEdgeWaypoints(edgeId, snapshot, { live: true });
        });
      },
      () => {
        if (this.dragRaf) {
          cancelAnimationFrame(this.dragRaf);
          this.dragRaf = 0;
        }
        if (liveWps) {
          this.updateEdgeWaypoints(edgeId, liveWps);
          this.emitChange();
        }
        liveWps = null;
      }
    );

    // Double-click bend handle to remove that point
    const onDbl = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      const edge = this.findEdgeGroup(edgeId);
      const wps = ((edge?.metadata?.edgeWaypoints as Array<{ x: number; y: number }>) ?? []).slice();
      wps.splice(index, 1);
      this.updateEdgeWaypoints(edgeId, wps);
      this.emitChange();
    };
    handle.on('dblclick', onDbl as never);
    this.handlers.push({ node: handle, type: 'dblclick', fn: onDbl as never });
  }

  private addEndpointHandle(x: number, y: number, end: 'from' | 'to', edgeId: string): void {
    const handle = this.app.circle({
      x,
      y,
      radius: 6,
      fill: end === 'to' ? getActiveDiagram().edge : '#fff',
      stroke: getActiveDiagram().mindBranch.stroke,
      strokeWidth: 2,
      listening: true,
    });
    handle.metadata.diagramEditorOverlay = true;
    this.overlay.add(handle);

    let lastX = x;
    let lastY = y;
    wirePointerDrag(
      handle,
      (wx, wy) => {
        lastX = wx;
        lastY = wy;
        this.drawPreviewLine(x, y, wx, wy);
      },
      () => {
        this.clearPreview();
        const hit = this.app.hitTest(lastX, lastY)?.node;
        const target = resolveEditableGroup(hit);
        if (target) {
          const nodeId = nodeDiagramId(target);
          if (nodeId) this.rewireEdgeEndpoint(edgeId, end, nodeId);
        }
        this.app.requestRender();
      }
    );
  }

  private addResizeHandles(node: Group, x: number, y: number, w: number, h: number): void {
    const cardW = ((node.metadata?.orgCardWidth ?? node.metadata?.diagramCardWidth) as
      | number
      | undefined) ?? (node.metadata.editorBaseW as number) ?? w;
    const cardH = ((node.metadata?.orgCardHeight ?? node.metadata?.diagramCardHeight) as
      | number
      | undefined) ?? (node.metadata.editorBaseH as number) ?? h;
    const safeCardW = Math.max(cardW, 1);
    const safeCardH = Math.max(cardH, 1);

    // Visual box in diagram-local space (accounts for fitToBounds via stage↔local)
    const startLocal = this.stageToRootLocal(x, y);
    const startBR = this.stageToRootLocal(x + w, y + h);
    const startBox = {
      x: startLocal.x,
      y: startLocal.y,
      width: Math.max(startBR.x - startLocal.x, 1),
      height: Math.max(startBR.y - startLocal.y, 1),
    };
    const startNodeX = node.x;
    const startNodeY = node.y;

    for (const spec of RESIZE_HANDLES) {
      const hx = x + w * spec.u;
      const hy = y + h * spec.v;
      const handle = this.app.rect({
        x: hx - HANDLE / 2,
        y: hy - HANDLE / 2,
        width: HANDLE,
        height: HANDLE,
        fill: '#fff',
        stroke: getActiveDiagram().mindBranch.stroke,
        strokeWidth: 1.5,
        listening: true,
        cornerRadius: 2,
      });
      handle.metadata.diagramEditorOverlay = true;
      handle.metadata.resizeHandle = spec.id;
      this.overlay.add(handle);

      const handleId = spec.id as ResizeHandleId;
      wirePointerDrag(
        handle,
        (worldX, worldY) => {
          const local = this.stageToRootLocal(worldX, worldY);
          const next = applyAnchoredResize(startBox, handleId, local.x, local.y);
          const scaleX = Math.max(0.35, Math.min(4, next.width / safeCardW));
          const scaleY = Math.max(0.35, Math.min(4, next.height / safeCardH));
          node.scaleX = scaleX;
          node.scaleY = scaleY;
          // Keep the anchored edge/corner fixed by shifting the node
          node.x = startNodeX + (next.x - startBox.x);
          node.y = startNodeY + (next.y - startBox.y);
          node.markDirty();
          rerouteDiagramEdges(this.app, this.root);
          this.refreshOverlay();
          this.app.requestRender();
        },
        () => {
          syncPositionsToState(this.root);
          this.wireEdges();
          this.refreshOverlay();
          this.emitChange();
          this.app.requestRender();
        }
      );
    }
  }

  private addPorts(node: Group, x: number, y: number, w: number, h: number): void {
    const ports = [
      { px: x + w / 2, py: y },
      { px: x + w, py: y + h / 2 },
      { px: x + w / 2, py: y + h },
      { px: x, py: y + h / 2 },
    ];
      const fromId = nodeDiagramId(node);
    for (const p of ports) {
      const port = this.app.circle({
        x: p.px,
        y: p.py,
        radius: 5,
        fill: getActiveDiagram().edge,
        stroke: '#fff',
        strokeWidth: 1.5,
        listening: true,
      });
      port.metadata.diagramEditorOverlay = true;
      this.overlay.add(port);

      let lastX = p.px;
      let lastY = p.py;
      wirePointerDrag(
        port,
        (wx, wy) => {
          lastX = wx;
          lastY = wy;
          this.drawPreviewLine(p.px, p.py, wx, wy);
        },
        () => {
          this.clearPreview();
          const hit = this.app.hitTest(lastX, lastY)?.node;
          const target = resolveEditableGroup(hit);
          if (target && fromId) {
            const toId = nodeDiagramId(target);
            if (toId && toId !== fromId) {
              this.addEdge(fromId, toId);
              this.selectNode(toId);
            }
          }
          this.app.requestRender();
        }
      );
    }
  }

  private drawPreviewLine(x1: number, y1: number, x2: number, y2: number): void {
    this.clearPreview();
    this.previewLine = this.app.line({
      x: x1,
      y: y1,
      x2: x2,
      y2: y2,
      stroke: getActiveDiagram().edge,
      strokeWidth: 2,
      dash: [6, 4],
      listening: false,
    });
    this.previewLine.metadata.diagramEditorOverlay = true;
    this.overlay.add(this.previewLine);
    this.app.requestRender();
  }

  private clearPreview(): void {
    if (this.previewLine) {
      this.overlay.remove(this.previewLine);
      this.previewLine.destroy();
      this.previewLine = null;
    }
  }

  private emitChange(): void {
    this.options.onChange?.(this.root.metadata?.diagramState as Record<string, unknown>);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.dragRaf) {
      cancelAnimationFrame(this.dragRaf);
      this.dragRaf = 0;
    }
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
    for (const h of this.handlers) {
      h.node.off(h.type as never, h.fn as never);
    }
    this.handlers = [];
    this.overlay.destroy();
    this.app.requestRender();
  }
}
