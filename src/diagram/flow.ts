/**
 * Diagram wire-flow animation: marching dashes, traveling packets, node highlight.
 * Supports loop/once playback, pause, and explicit node-to-node paths.
 */
import type { App } from '../App';
import { AnimationEngine } from '../animation/Animation';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { getNodeBoxInParent } from './coords';
import { findEdgeLayer, findNodeByDiagramId, nodeDiagramId } from './editor/collect';
import { getDiagramState, setDiagramState } from './helpers';
import { getActiveDiagram } from './theme';

export type DiagramFlowMode = 'dash' | 'packet' | 'both';
export type DiagramFlowHighlight = 'pulse' | 'breathe' | 'flash' | 'none';
export type DiagramFlowPlayback = 'loop' | 'once';

export interface DiagramFlowHop {
  from: string;
  to: string;
}

export interface DiagramFlowOptions {
  /** When false, clears animation and keeps options in state. Default true when apply is called. */
  enabled?: boolean;
  /** Playback rate: 0 = paused (same as paused:true), 1 = default, 2 = 2×. */
  speed?: number;
  /** Soft pause without clearing chrome / options. */
  paused?: boolean;
  /** `loop` (default) or `once` then stop. */
  playback?: DiagramFlowPlayback;
  /** Wire motion style. Default `both`. */
  mode?: DiagramFlowMode;
  /** Node chrome while a step is active / on packet arrival. Default `pulse`. */
  highlight?: DiagramFlowHighlight;
  /** diagramIds that show continuous pulse/breathe (when no path is driving highlight). */
  activeNodes?: string[];
  /**
   * Edge ids (`edgeId` or `from->to`) that get ambient packets when no path runs.
   * When omitted, all edges animate.
   */
  activeEdges?: string[];
  /**
   * Single run: ordered node ids (consecutive pairs become hops).
   * Example: `['start','check','process','end']`
   * Also accepts `string[][]` as a shorthand for `paths`.
   */
  path?: string[] | string[][];
  /**
   * Multiple runs in index order. Each entry is a node-id path.
   * After run `i` finishes, run `i+1` starts (after `pathGapMs`).
   * Takes precedence over `path` when both are set.
   */
  paths?: string[][];
  /**
   * Explicit hops for a single run. Used when no `paths` / `path` node lists.
   * Alias: `edges`.
   */
  pathEdges?: DiagramFlowHop[];
  /** Alias for `pathEdges` (builder-friendly). */
  edges?: DiagramFlowHop[];
  /**
   * Multiple hop-lists in index order (like `paths`, but as `{from,to}` hops).
   * Takes precedence over single `pathEdges` when set.
   */
  pathsEdges?: DiagramFlowHop[][];
  /** Pause between consecutive path runs (ms). Default 450. */
  pathGapMs?: number;
  /** Dash pattern applied when an edge has no existing dash. */
  dashPattern?: number[];
}

type StopHandle = { stop: () => void; pause?: () => void; resume?: () => void };

interface FlowRuntime {
  handles: StopHandle[];
  options: NormalizedFlow;
  playing: boolean;
}

interface NormalizedFlow extends DiagramFlowOptions {
  enabled: boolean;
  speed: number;
  paused: boolean;
  playback: DiagramFlowPlayback;
  mode: DiagramFlowMode;
  highlight: DiagramFlowHighlight;
  dashPattern: number[];
  /** Flattened hops (all runs) — used for dash filtering. */
  pathEdges?: DiagramFlowHop[];
  /** Ordered runs of hops (index = play order). */
  pathRuns: DiagramFlowHop[][];
  pathGapMs: number;
  paths?: string[][];
}

const FLOW_OVERLAY_KEY = 'diagramFlowOverlay';
const FLOW_PACKET_KEY = 'diagramFlowPacket';
const FLOW_RUNTIME_KEY = 'diagramFlowRuntime';
const DEFAULT_DASH = [10, 8];
const BASE_DASH_MS = 1600;
const BASE_PACKET_MS = 2400;
const BASE_PULSE_MS = 1100;
const FLASH_MS = 420;
const DEFAULT_PATH_GAP_MS = 450;

function nodeListToHops(nodes: string[]): DiagramFlowHop[] {
  const hops: DiagramFlowHop[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    hops.push({ from: String(nodes[i]), to: String(nodes[i + 1]) });
  }
  return hops;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.length > 0 && typeof v[0] === 'string';
}

function isPathsMatrix(v: unknown): v is string[][] {
  return Array.isArray(v) && v.length > 0 && Array.isArray(v[0]);
}

function sanitizeHopList(list: unknown): DiagramFlowHop[] {
  if (!Array.isArray(list)) return [];
  return list
    .filter(
      (h): h is DiagramFlowHop =>
        !!h && typeof (h as DiagramFlowHop).from === 'string' && typeof (h as DiagramFlowHop).to === 'string'
    )
    .map((h) => ({ from: h.from, to: h.to }));
}

function normalizeFlow(raw: DiagramFlowOptions | undefined): NormalizedFlow {
  const mode = raw?.mode ?? 'both';
  const highlight = raw?.highlight ?? 'pulse';
  const playback = raw?.playback === 'once' ? 'once' : 'loop';
  const speed =
    typeof raw?.speed === 'number' && Number.isFinite(raw.speed) ? Math.max(0, raw.speed) : 1;
  const paused = raw?.paused === true || speed <= 0;
  const pathGapMs =
    typeof raw?.pathGapMs === 'number' && Number.isFinite(raw.pathGapMs)
      ? Math.max(0, raw.pathGapMs)
      : DEFAULT_PATH_GAP_MS;

  let pathRuns: DiagramFlowHop[][] = [];
  let paths: string[][] | undefined;
  let path: string[] | undefined;

  if (Array.isArray(raw?.pathsEdges) && raw!.pathsEdges!.length > 0) {
    pathRuns = raw!.pathsEdges!.map(sanitizeHopList).filter((r) => r.length > 0);
  } else if (isPathsMatrix(raw?.paths)) {
    paths = raw!.paths!.map((p) => p.map(String)).filter((p) => p.length >= 2);
    pathRuns = paths.map(nodeListToHops).filter((r) => r.length > 0);
  } else if (isPathsMatrix(raw?.path)) {
    // Allow path: string[][] as shorthand for paths
    paths = (raw!.path as string[][]).map((p) => p.map(String)).filter((p) => p.length >= 2);
    pathRuns = paths.map(nodeListToHops).filter((r) => r.length > 0);
  } else {
    const explicit = sanitizeHopList(raw?.pathEdges ?? raw?.edges);
    if (explicit.length > 0) {
      pathRuns = [explicit];
    } else if (isStringArray(raw?.path) && raw!.path!.length >= 2) {
      path = (raw!.path as string[]).map(String);
      pathRuns = [nodeListToHops(path)];
      paths = [path];
    }
  }

  const pathEdges = pathRuns.length > 0 ? pathRuns.flat() : undefined;

  return {
    enabled: raw?.enabled !== false,
    speed: paused && speed <= 0 ? 0 : speed,
    paused,
    playback,
    mode: mode === 'dash' || mode === 'packet' || mode === 'both' ? mode : 'both',
    highlight:
      highlight === 'pulse' || highlight === 'breathe' || highlight === 'flash' || highlight === 'none'
        ? highlight
        : 'pulse',
    activeNodes: Array.isArray(raw?.activeNodes) ? raw!.activeNodes!.slice() : undefined,
    activeEdges: Array.isArray(raw?.activeEdges) ? raw!.activeEdges!.slice() : undefined,
    path,
    paths,
    pathEdges,
    pathRuns,
    pathGapMs,
    pathsEdges: Array.isArray(raw?.pathsEdges) ? pathRuns : undefined,
    dashPattern:
      Array.isArray(raw?.dashPattern) && raw!.dashPattern!.length >= 2
        ? raw!.dashPattern!.map(Number)
        : DEFAULT_DASH.slice(),
  };
}

/** Flat polyline points → SVG path `d` for motionPath. */
export function edgePointsToPathD(points: number[]): string {
  if (!Array.isArray(points) || points.length < 4) return '';
  let d = `M ${points[0]} ${points[1]}`;
  for (let i = 2; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    d += ` L ${x} ${y}`;
  }
  return d;
}

/** Visible stroke polyline inside an edge group (not hit-target / packet). */
export function getEdgeStrokePolyline(edge: Group): Node | undefined {
  const tagged = edge.children.find(
    (c) => c.type === 'polyline' && c.metadata?.edgeStrokePoly === true
  );
  if (tagged) return tagged;
  const polylines = edge.children.filter(
    (c) =>
      c.type === 'polyline' &&
      !c.metadata?.edgeHitPolyline &&
      !c.metadata?.[FLOW_PACKET_KEY]
  );
  if (polylines.length === 0) return undefined;
  return polylines.length >= 2 ? polylines[1] : polylines[0];
}

function dashPeriod(pattern: number[]): number {
  return pattern.reduce((sum, n) => sum + (Number.isFinite(n) ? Math.abs(n) : 0), 0) || 18;
}

function durationMs(base: number, speed: number): number {
  if (speed <= 0) return 0;
  return Math.max(120, Math.round(base / speed));
}

function removeFlowChrome(root: Group): void {
  for (const child of [...root.children]) {
    if (child.metadata?.[FLOW_OVERLAY_KEY]) {
      root.remove(child);
      child.destroy();
    }
  }
  const edgeLayer = findEdgeLayer(root);
  if (!edgeLayer) return;
  for (const edge of edgeLayer.children) {
    for (const child of [...(edge as Group).children]) {
      if (child.metadata?.[FLOW_PACKET_KEY]) {
        (edge as Group).remove(child);
        child.destroy();
      }
    }
  }
}

function clearPulseOnly(overlay: Group): void {
  for (const child of [...overlay.children]) {
    if (child.metadata?.flowPulseRing) {
      overlay.remove(child);
      child.destroy();
    }
  }
}

/** Stop running flow animations; keep `diagramState.flow` unless `clearState`. */
export function stopDiagramFlow(root: Group, opts: { clearState?: boolean } = {}): void {
  const rt = root.metadata?.[FLOW_RUNTIME_KEY] as FlowRuntime | undefined;
  if (rt?.handles?.length) {
    for (const h of rt.handles) {
      try {
        h.stop();
      } catch {
        /* ignore */
      }
    }
  }
  delete root.metadata[FLOW_RUNTIME_KEY];
  removeFlowChrome(root);

  const edgeLayer = findEdgeLayer(root);
  if (edgeLayer) {
    for (const edge of edgeLayer.children) {
      const stroke = getEdgeStrokePolyline(edge as Group);
      if (stroke && typeof stroke.dashOffset === 'number') {
        stroke.dashOffset = 0;
        stroke.markDirty?.();
      }
      if (edge.metadata?.flowDashApplied && stroke) {
        const prior = edge.metadata.edgeDash as number[] | undefined;
        if (!prior) {
          (stroke as { dash: number[] }).dash = [];
        }
        delete edge.metadata.flowDashApplied;
        stroke.markDirty?.();
      }
    }
  }

  if (opts.clearState) {
    const state = getDiagramState(root);
    if (state.flow) {
      const next = { ...state };
      delete next.flow;
      root.metadata.diagramState = next;
    }
  }
  root.markDirty();
}

function ensureOverlay(app: App, root: Group): Group {
  let overlay = root.children.find((c) => c.metadata?.[FLOW_OVERLAY_KEY]) as Group | undefined;
  if (overlay) {
    overlay.clear();
    return overlay;
  }
  overlay = app.group({
    listening: false,
    zIndex: 50,
    metadata: { [FLOW_OVERLAY_KEY]: true },
  }) as Group;
  root.add(overlay);
  return overlay;
}

function addNodePulse(
  app: App,
  root: Group,
  overlay: Group,
  nodeId: string,
  highlight: DiagramFlowHighlight,
  speed: number,
  handles: StopHandle[],
  opts: { loop: boolean } = { loop: true }
): void {
  if (highlight === 'none' || highlight === 'flash') return;
  const node = findNodeByDiagramId(root, nodeId);
  if (!node) return;
  const box = getNodeBoxInParent(node, root);
  const pad = 5;
  const theme = getActiveDiagram();
  const stroke = theme.mindBranch?.stroke ?? theme.edge ?? '#38bdf8';
  const ring = app.rect({
    x: box.x - pad,
    y: box.y - pad,
    width: box.width + pad * 2,
    height: box.height + pad * 2,
    fill: null,
    stroke,
    strokeWidth: 2,
    cornerRadius: 10,
    opacity: highlight === 'breathe' ? 0.35 : 0.85,
    listening: false,
    metadata: { flowPulseRing: true },
  });
  overlay.add(ring);

  const dur = durationMs(BASE_PULSE_MS, speed);
  if (dur <= 0) return;

  if (highlight === 'breathe') {
    handles.push(
      AnimationEngine.animate(ring as unknown as Record<string, unknown>, {
        opacity: 0.9,
        duration: dur,
        loop: opts.loop,
        reverse: opts.loop,
        easing: 'easeInOut',
      })
    );
  } else {
    ring.dash = [6, 5];
    ring.dashOffset = 0;
    handles.push(
      AnimationEngine.animate(ring as unknown as Record<string, unknown>, {
        strokeWidth: 3.25,
        opacity: 0.35,
        duration: dur,
        loop: opts.loop,
        reverse: opts.loop,
        easing: 'easeInOut',
      })
    );
    handles.push(
      AnimationEngine.animate(ring as unknown as Record<string, unknown>, {
        dashOffset: 22,
        duration: Math.round(dur * 1.4),
        loop: opts.loop,
        easing: 'linear',
      })
    );
  }
}

function flashNode(
  app: App,
  root: Group,
  overlay: Group,
  nodeId: string,
  handles: StopHandle[]
): void {
  const node = findNodeByDiagramId(root, nodeId);
  if (!node) return;
  const box = getNodeBoxInParent(node, root);
  const theme = getActiveDiagram();
  const stroke = theme.flowchartStart?.accent ?? theme.edge ?? '#4ade80';
  const flash = app.rect({
    x: box.x - 7,
    y: box.y - 7,
    width: box.width + 14,
    height: box.height + 14,
    fill: null,
    stroke,
    strokeWidth: 2.5,
    cornerRadius: 12,
    opacity: 1,
    listening: false,
  });
  overlay.add(flash);
  const control = AnimationEngine.animate(flash as unknown as Record<string, unknown>, {
    opacity: 0,
    strokeWidth: 1,
    duration: FLASH_MS,
    easing: 'easeOut',
    onComplete: () => {
      if (flash.parent) {
        (flash.parent as Group).remove(flash);
        flash.destroy();
      }
    },
  });
  handles.push(control);
}

function findEdgeByHop(edgeLayer: Group, from: string, to: string): Group | undefined {
  return edgeLayer.children.find((c) => {
    const f = c.metadata?.edgeFrom as string | undefined;
    const t = c.metadata?.edgeTo as string | undefined;
    return f === from && t === to;
  }) as Group | undefined;
}

function edgeMatchesActive(edge: Group, activeEdges: string[] | undefined): boolean {
  if (!activeEdges || activeEdges.length === 0) return true;
  const id = edge.metadata?.edgeId as string | undefined;
  const from = edge.metadata?.edgeFrom as string | undefined;
  const to = edge.metadata?.edgeTo as string | undefined;
  const key = from && to ? `${from}->${to}` : undefined;
  return (
    (id != null && activeEdges.includes(id)) ||
    (key != null && activeEdges.includes(key)) ||
    (from != null && activeEdges.includes(from)) ||
    (to != null && activeEdges.includes(to))
  );
}

function edgeInPath(edge: Group, hops: DiagramFlowHop[] | undefined): boolean {
  if (!hops || hops.length === 0) return true;
  const from = edge.metadata?.edgeFrom as string | undefined;
  const to = edge.metadata?.edgeTo as string | undefined;
  if (!from || !to) return false;
  return hops.some((h) => h.from === from && h.to === to);
}

function startAmbientPacket(
  app: App,
  root: Group,
  edge: Group,
  pathD: string,
  speed: number,
  highlight: DiagramFlowHighlight,
  playback: DiagramFlowPlayback,
  handles: StopHandle[],
  getOverlay: () => Group,
  onFinished?: () => void
): void {
  const theme = getActiveDiagram();
  const fill = theme.flowchartProcess?.accent ?? theme.edge ?? '#60a5fa';
  const packet = app.circle({
    x: 0,
    y: 0,
    radius: 4.5,
    fill,
    stroke: '#0f172a',
    strokeWidth: 1,
    listening: false,
    metadata: { [FLOW_PACKET_KEY]: true },
  });
  edge.add(packet);

  const toId = edge.metadata?.edgeTo as string | undefined;
  const dur = durationMs(BASE_PACKET_MS, speed);
  if (dur <= 0) return;

  let stopped = false;
  let control: StopHandle | null = null;

  const run = (): void => {
    if (stopped) return;
    control = AnimationEngine.animate(packet as unknown as Record<string, unknown>, {
      motionPath: pathD,
      rotation: 0,
      duration: dur,
      easing: 'linear',
      onComplete: () => {
        if (stopped) return;
        if (toId && highlight !== 'none') {
          flashNode(app, root, getOverlay(), toId, handles);
        }
        if (playback === 'loop') {
          run();
        } else {
          onFinished?.();
        }
      },
    });
  };

  handles.push({
    stop: () => {
      stopped = true;
      control?.stop();
    },
  });
  run();
}

/**
 * Sequential packet along one or more path runs (index order).
 * After each run completes, waits `pathGapMs` before the next.
 */
function startPathSequence(
  app: App,
  root: Group,
  runs: Array<Array<{ edge: Group; from: string; to: string; pathD: string }>>,
  speed: number,
  highlight: DiagramFlowHighlight,
  playback: DiagramFlowPlayback,
  pathGapMs: number,
  handles: StopHandle[],
  getOverlay: () => Group,
  onFinished?: () => void
): void {
  const validRuns = runs.filter((r) => r.length > 0);
  if (validRuns.length === 0) return;
  const theme = getActiveDiagram();
  const fill = theme.flowchartProcess?.accent ?? theme.edge ?? '#60a5fa';
  const dur = durationMs(BASE_PACKET_MS, speed);
  if (dur <= 0) return;

  let stopped = false;
  let runIndex = 0;
  let hopIndex = 0;
  let packet: Node | null = null;
  let control: StopHandle | null = null;
  let gapTimer: ReturnType<typeof setTimeout> | null = null;
  const pulseHandles: StopHandle[] = [];

  const stopPulseHandles = (): void => {
    for (const h of pulseHandles) {
      try {
        h.stop();
      } catch {
        /* ignore */
      }
    }
    pulseHandles.length = 0;
  };

  const placePacket = (edge: Group): Node => {
    if (packet?.parent) {
      (packet.parent as Group).remove(packet);
      packet.destroy();
    }
    packet = app.circle({
      x: 0,
      y: 0,
      radius: 4.5,
      fill,
      stroke: '#0f172a',
      strokeWidth: 1,
      listening: false,
      metadata: { [FLOW_PACKET_KEY]: true },
    });
    edge.add(packet);
    return packet;
  };

  const showHopHighlight = (fromId: string, toId: string): void => {
    if (highlight === 'none' || highlight === 'flash') return;
    const overlay = getOverlay();
    stopPulseHandles();
    clearPulseOnly(overlay);
    addNodePulse(app, root, overlay, fromId, highlight, speed, pulseHandles, { loop: true });
    addNodePulse(app, root, overlay, toId, highlight, speed, pulseHandles, { loop: true });
  };

  const advanceAfterRun = (): void => {
    if (stopped) return;
    runIndex += 1;
    hopIndex = 0;
    if (runIndex >= validRuns.length) {
      if (playback === 'loop') {
        runIndex = 0;
      } else {
        onFinished?.();
        return;
      }
    }
    const go = (): void => {
      gapTimer = null;
      if (!stopped) runHop();
    };
    if (pathGapMs > 0) {
      gapTimer = setTimeout(go, pathGapMs);
    } else {
      go();
    }
  };

  const runHop = (): void => {
    if (stopped) return;
    const hops = validRuns[runIndex];
    if (!hops || hopIndex >= hops.length) {
      advanceAfterRun();
      return;
    }
    const hop = hops[hopIndex];
    showHopHighlight(hop.from, hop.to);
    const node = placePacket(hop.edge);
    control = AnimationEngine.animate(node as unknown as Record<string, unknown>, {
      motionPath: hop.pathD,
      rotation: 0,
      duration: dur,
      easing: 'linear',
      onComplete: () => {
        if (stopped) return;
        if (highlight !== 'none') {
          flashNode(app, root, getOverlay(), hop.to, handles);
        }
        hopIndex += 1;
        runHop();
      },
    });
  };

  handles.push({
    stop: () => {
      stopped = true;
      control?.stop();
      stopPulseHandles();
      if (gapTimer != null) {
        clearTimeout(gapTimer);
        gapTimer = null;
      }
      if (packet?.parent) {
        (packet.parent as Group).remove(packet);
        packet.destroy();
        packet = null;
      }
    },
  });

  const first = validRuns[0]?.[0];
  if (highlight !== 'none' && highlight !== 'flash' && first) {
    showHopHighlight(first.from, first.to);
  }
  runHop();
}

function applyStaticDashes(edgeLayer: Group, merged: NormalizedFlow, hops: DiagramFlowHop[] | undefined): void {
  const pattern = merged.dashPattern;
  for (const edgeChild of edgeLayer.children) {
    const edge = edgeChild as Group;
    if (!edgeInPath(edge, hops)) continue;
    const stroke = getEdgeStrokePolyline(edge);
    if (!stroke) continue;
    const existing =
      (edge.metadata?.edgeDash as number[] | undefined) ??
      (Array.isArray(stroke.dash) ? (stroke.dash as number[]) : undefined);
    if (!existing || existing.length < 2) {
      stroke.dash = pattern.slice();
      edge.metadata.flowDashApplied = true;
    }
  }
}

/**
 * Apply (or re-apply) flow animation on a diagram root.
 * Persists options under `diagramState.flow`.
 */
export function applyDiagramFlow(
  app: App,
  root: Group,
  options: DiagramFlowOptions = {}
): void {
  const prev = (getDiagramState(root).flow as DiagramFlowOptions | undefined) ?? {};
  const merged = normalizeFlow({ ...prev, ...options });
  // Persist without ephemeral runtime flags duplication
  setDiagramState(root, {
    flow: {
      enabled: merged.enabled,
      speed: merged.speed,
      paused: merged.paused,
      playback: merged.playback,
      mode: merged.mode,
      highlight: merged.highlight,
      activeNodes: merged.activeNodes,
      activeEdges: merged.activeEdges,
      path: merged.path,
      paths: merged.paths,
      pathEdges: merged.pathEdges,
      pathsEdges: merged.pathsEdges,
      pathGapMs: merged.pathGapMs,
      dashPattern: merged.dashPattern,
    },
  });

  stopDiagramFlow(root);

  const edgeLayer = findEdgeLayer(root);
  const hopsSpec = merged.pathEdges;
  const isPlaying = merged.enabled && !merged.paused && merged.speed > 0;

  if (!merged.enabled) {
    root.metadata[FLOW_RUNTIME_KEY] = { handles: [], options: merged, playing: false };
    root.markDirty();
    return;
  }

  // Paused / speed 0: keep dash preview on path edges
  if (!isPlaying) {
    if (edgeLayer && (merged.mode === 'dash' || merged.mode === 'both')) {
      applyStaticDashes(edgeLayer, merged, hopsSpec);
    }
    root.metadata[FLOW_RUNTIME_KEY] = { handles: [], options: merged, playing: false };
    root.markDirty();
    app.requestRender?.();
    return;
  }

  const handles: StopHandle[] = [];
  const useDash = merged.mode === 'dash' || merged.mode === 'both';
  const usePacket = merged.mode === 'packet' || merged.mode === 'both';
  const pattern = merged.dashPattern;
  const period = dashPeriod(pattern);
  const dashDur = durationMs(BASE_DASH_MS, merged.speed);
  const loopDash = merged.playback === 'loop';

  let overlay: Group | null = null;
  const getOverlay = (): Group => {
    if (!overlay) overlay = ensureOverlay(app, root);
    return overlay;
  };

  let pathRunsResolved: Array<Array<{ edge: Group; from: string; to: string; pathD: string }>> =
    [];
  if (edgeLayer && merged.pathRuns.length > 0) {
    for (const run of merged.pathRuns) {
      const resolved: Array<{ edge: Group; from: string; to: string; pathD: string }> = [];
      for (const hop of run) {
        const edge = findEdgeByHop(edgeLayer, hop.from, hop.to);
        if (!edge) continue;
        const points = edge.metadata?.edgePoints as number[] | undefined;
        const d = edgePointsToPathD(points ?? []);
        if (!d) continue;
        resolved.push({ edge, from: hop.from, to: hop.to, pathD: d });
      }
      if (resolved.length > 0) pathRunsResolved.push(resolved);
    }
  }

  const markFinished = (): void => {
    const rt = root.metadata[FLOW_RUNTIME_KEY] as FlowRuntime | undefined;
    if (rt) rt.playing = false;
    setDiagramState(root, {
      flow: { ...(getDiagramState(root).flow as object), paused: true },
    });
    app.requestRender?.();
  };

  if (edgeLayer) {
    for (const edgeChild of edgeLayer.children) {
      const edge = edgeChild as Group;
      const stroke = getEdgeStrokePolyline(edge);
      if (!stroke) continue;
      if (!edgeInPath(edge, hopsSpec)) continue;

      if (useDash) {
        const existing =
          (edge.metadata?.edgeDash as number[] | undefined) ??
          (Array.isArray(stroke.dash) ? (stroke.dash as number[]) : undefined);
        if (!existing || existing.length < 2) {
          stroke.dash = pattern.slice();
          edge.metadata.flowDashApplied = true;
        }
        stroke.dashOffset = 0;
        if (dashDur > 0) {
          handles.push(
            AnimationEngine.animate(stroke as unknown as Record<string, unknown>, {
              dashOffset: period,
              duration: dashDur,
              loop: loopDash,
              easing: 'linear',
            })
          );
        }
      }
    }

    if (usePacket) {
      if (pathRunsResolved.length > 0) {
        startPathSequence(
          app,
          root,
          pathRunsResolved,
          merged.speed,
          merged.highlight,
          merged.playback,
          merged.pathGapMs,
          handles,
          getOverlay,
          merged.playback === 'once' ? markFinished : undefined
        );
      } else {
        let remaining = 0;
        for (const edgeChild of edgeLayer.children) {
          const edge = edgeChild as Group;
          if (!edgeMatchesActive(edge, merged.activeEdges)) continue;
          const points = edge.metadata?.edgePoints as number[] | undefined;
          const d = edgePointsToPathD(points ?? []);
          if (!d) continue;
          remaining += 1;
          startAmbientPacket(
            app,
            root,
            edge,
            d,
            merged.speed,
            merged.highlight,
            merged.playback,
            handles,
            getOverlay,
            merged.playback === 'once'
              ? () => {
                  remaining -= 1;
                  if (remaining <= 0) markFinished();
                }
              : undefined
          );
        }
      }
    }
  }

  // Static activeNodes pulse when not driven by path sequence
  const pathDriven = pathRunsResolved.length > 0 && usePacket;
  if (!pathDriven && (merged.highlight === 'pulse' || merged.highlight === 'breathe')) {
    const active =
      merged.activeNodes && merged.activeNodes.length > 0
        ? merged.activeNodes
        : inferActiveNodes(root, merged);
    for (const id of active) {
      addNodePulse(app, root, getOverlay(), id, merged.highlight, merged.speed, handles, {
        loop: merged.playback === 'loop',
      });
    }
  }

  root.metadata[FLOW_RUNTIME_KEY] = { handles, options: merged, playing: true };
  root.markDirty();
  app.requestRender?.();
}

function inferActiveNodes(root: Group, flow: DiagramFlowOptions): string[] {
  if (flow.activeNodes?.length) return flow.activeNodes;
  const type = root.metadata?.diagramType as string | undefined;
  if (type === 'processPipeline') {
    const ids: string[] = [];
    const walk = (n: Node) => {
      if (n.metadata?.pipelineStatus === 'active') {
        const id = nodeDiagramId(n);
        if (id) ids.push(id);
      }
      if ('children' in n) {
        for (const c of (n as Group).children) walk(c);
      }
    };
    walk(root);
    return ids;
  }
  return [];
}

/** Re-apply flow from `diagramState.flow` after reroute / rebuild. */
export function refreshDiagramFlow(app: App, root: Group): void {
  const flow = getDiagramState(root).flow as DiagramFlowOptions | undefined;
  if (!flow || flow.enabled === false) return;
  applyDiagramFlow(app, root, flow);
}

/** If builder options include `flow`, start animation and persist on the group. */
export function maybeApplyDiagramFlow(
  app: App,
  root: Group,
  options: Record<string, unknown>
): void {
  const flow = options.flow;
  if (!flow || typeof flow !== 'object') return;
  applyDiagramFlow(app, root, flow as DiagramFlowOptions);
}

/** Pause flow (keeps options; dashes stay as preview). */
export function pauseDiagramFlow(app: App, root: Group): void {
  const prev = (getDiagramState(root).flow as DiagramFlowOptions | undefined) ?? {};
  if (prev.enabled === false) return;
  applyDiagramFlow(app, root, { ...prev, paused: true });
}

/** Resume flow from paused state. */
export function resumeDiagramFlow(app: App, root: Group): void {
  const prev = (getDiagramState(root).flow as DiagramFlowOptions | undefined) ?? {};
  if (prev.enabled === false) return;
  const speed = typeof prev.speed === 'number' && prev.speed > 0 ? prev.speed : 1;
  applyDiagramFlow(app, root, { ...prev, paused: false, speed });
}

/** Toggle pause / resume. Returns whether flow is playing after the call. */
export function toggleDiagramFlowPause(app: App, root: Group): boolean {
  const prev = (getDiagramState(root).flow as DiagramFlowOptions | undefined) ?? {};
  const rt = root.metadata?.[FLOW_RUNTIME_KEY] as FlowRuntime | undefined;
  const playing = rt?.playing === true && prev.paused !== true && (prev.speed ?? 1) > 0;
  if (playing) {
    pauseDiagramFlow(app, root);
    return false;
  }
  resumeDiagramFlow(app, root);
  return true;
}

/** Replay from the start (clears pause; useful after `playback: 'once'`). */
export function replayDiagramFlow(app: App, root: Group): void {
  const prev = (getDiagramState(root).flow as DiagramFlowOptions | undefined) ?? {};
  if (prev.enabled === false) return;
  const speed = typeof prev.speed === 'number' && prev.speed > 0 ? prev.speed : 1;
  applyDiagramFlow(app, root, { ...prev, paused: false, speed, enabled: true });
}

/** Whether flow is currently animating. */
export function isDiagramFlowPlaying(root: Group): boolean {
  const flow = getDiagramState(root).flow as DiagramFlowOptions | undefined;
  if (!flow || flow.enabled === false || flow.paused || (flow.speed ?? 1) <= 0) return false;
  const rt = root.metadata?.[FLOW_RUNTIME_KEY] as FlowRuntime | undefined;
  return rt?.playing === true;
}
