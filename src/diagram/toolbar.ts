/**
 * Built-in HTML overlay toolbar for diagrams: flow play/pause/replay + zoom/fit.
 * Mounts on the App host container (sibling to canvas / HTML / SVG surface).
 */
import type { App } from '../App';
import type { Group } from '../shapes/Group';
import { fitDiagramToBounds, getDiagramState } from './helpers';
import type { DiagramFlowChrome, DiagramFlowOptions } from './flow';
import {
  isDiagramFlowPlaying,
  replayDiagramFlow,
  toggleDiagramFlowPause,
} from './flow';

const TOOLBAR_KEY = 'diagramToolbar';
const STYLE_ID = 'lightdraw-diagram-toolbar-style';

const ZOOM_MIN = 0.35;
const ZOOM_MAX = 2.75;
const ZOOM_STEP = 1.18;

export interface DiagramToolbarOptions {
  /** Show play / pause / replay. Default: true when flow is enabled. */
  flow?: boolean;
  /** Show zoom − / % / + / Fit. Default true. */
  zoom?: boolean;
  /** Override mount host (defaults to App container). */
  mount?: HTMLElement;
}

export interface DiagramToolbarHandle {
  root: Group;
  el: HTMLElement;
  opts: { flow: boolean; zoom: boolean };
  sync: () => void;
  destroy: () => void;
}

function ensureToolbarStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.ld-diagram-toolbar{
  position:absolute;
  top:10px;
  right:10px;
  z-index:20;
  display:flex;
  align-items:center;
  gap:4px;
  padding:4px;
  border-radius:10px;
  background:rgba(15,23,42,.82);
  border:1px solid rgba(148,163,184,.35);
  box-shadow:0 8px 24px rgba(0,0,0,.28);
  backdrop-filter:blur(8px);
  pointer-events:auto;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
  user-select:none;
}
.ld-diagram-toolbar button{
  appearance:none;
  border:0;
  margin:0;
  min-width:32px;
  height:30px;
  padding:0 8px;
  border-radius:7px;
  background:transparent;
  color:#e2e8f0;
  font-size:14px;
  font-weight:600;
  line-height:1;
  cursor:pointer;
}
.ld-diagram-toolbar button:hover{
  background:rgba(148,163,184,.22);
}
.ld-diagram-toolbar button:focus-visible{
  outline:2px solid #38bdf8;
  outline-offset:1px;
}
.ld-diagram-toolbar button.ld-fit{
  font-size:12px;
  letter-spacing:.02em;
}
.ld-diagram-toolbar .ld-zoom-label{
  min-width:40px;
  text-align:center;
  color:#94a3b8;
  font-size:12px;
  font-variant-numeric:tabular-nums;
  pointer-events:none;
}
.ld-diagram-toolbar[hidden]{display:none!important}
`;
  document.head.appendChild(style);
}

function resolveHost(app: App, mount?: HTMLElement): HTMLElement | null {
  if (mount) return mount;
  if (typeof app.getContainer === 'function') {
    return app.getContainer();
  }
  const surface = app.getRenderer()?.getElement?.();
  return (surface?.parentElement as HTMLElement | null) ?? null;
}

function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
}

function isHtmlSurface(app: App): boolean {
  const el = app.getRenderer()?.getElement?.();
  return !!(el && (el as HTMLElement).classList?.contains('lightdraw-html-root'));
}

function applyViewZoom(app: App, zoom: number): void {
  const z = clampZoom(zoom);
  app.camera.setZoom(z);
  if (isHtmlSurface(app)) {
    const el = app.getRenderer().getElement() as HTMLElement;
    el.style.transformOrigin = '0 0';
    el.style.transform = z === 1 ? '' : `scale(${z})`;
  }
  app.requestRender?.();
  app.render?.();
}

function readZoom(app: App): number {
  return clampZoom(app.camera.zoom || 1);
}

/** Normalize `flow.chrome` into concrete flags. */
export function resolveDiagramChrome(
  chrome: DiagramFlowChrome | undefined,
  flowEnabled: boolean
): { enabled: boolean; flow: boolean; zoom: boolean } {
  if (chrome === false) return { enabled: false, flow: false, zoom: false };
  if (chrome === true || chrome === undefined) {
    // Default: show toolbar when flow is applied/enabled
    return { enabled: flowEnabled, flow: flowEnabled, zoom: flowEnabled };
  }
  const flow = chrome.flow !== false && flowEnabled;
  const zoom = chrome.zoom !== false;
  const enabled = flow || zoom;
  return { enabled, flow, zoom };
}

function btn(label: string, title: string, className = ''): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.title = title;
  b.setAttribute('aria-label', title);
  if (className) b.className = className;
  return b;
}

/**
 * Install (or replace) the built-in diagram toolbar on the App host.
 */
export function installDiagramToolbar(
  app: App,
  root: Group,
  options: DiagramToolbarOptions = {}
): DiagramToolbarHandle {
  uninstallDiagramToolbar(root);
  ensureToolbarStyles();

  const showFlow = options.flow === true;
  const showZoom = options.zoom !== false;
  const host = resolveHost(app, options.mount);
  if (!host) {
    return {
      root,
      el: document.createElement('div'),
      opts: { flow: showFlow, zoom: showZoom },
      sync: () => undefined,
      destroy: () => undefined,
    };
  }

  const cs = typeof getComputedStyle === 'function' ? getComputedStyle(host) : null;
  if (cs && cs.position === 'static') {
    host.style.position = 'relative';
  }

  const el = document.createElement('div');
  el.className = 'ld-diagram-toolbar';
  el.setAttribute('role', 'toolbar');
  el.setAttribute('aria-label', 'Diagram controls');

  let playBtn: HTMLButtonElement | null = null;
  let replayBtn: HTMLButtonElement | null = null;
  let zoomLabel: HTMLSpanElement | null = null;

  if (showFlow) {
    playBtn = btn('⏸', 'Pause flow');
    replayBtn = btn('↻', 'Replay flow');
    el.appendChild(playBtn);
    el.appendChild(replayBtn);
  }

  if (showZoom) {
    const zoomOut = btn('−', 'Zoom out');
    zoomLabel = document.createElement('span');
    zoomLabel.className = 'ld-zoom-label';
    zoomLabel.textContent = '100%';
    const zoomIn = btn('+', 'Zoom in');
    const fit = btn('Fit', 'Fit to view', 'ld-fit');
    el.appendChild(zoomOut);
    el.appendChild(zoomLabel);
    el.appendChild(zoomIn);
    el.appendChild(fit);

    zoomOut.addEventListener('click', (e) => {
      e.stopPropagation();
      applyViewZoom(app, readZoom(app) / ZOOM_STEP);
      sync();
    });
    zoomIn.addEventListener('click', (e) => {
      e.stopPropagation();
      applyViewZoom(app, readZoom(app) * ZOOM_STEP);
      sync();
    });
    fit.addEventListener('click', (e) => {
      e.stopPropagation();
      applyViewZoom(app, 1);
      app.camera.setPosition(0, 0);
      const { width, height } = app.getSize();
      fitDiagramToBounds(root, width, height, 24);
      app.requestRender?.();
      app.render?.();
      sync();
    });
  }

  const sync = (): void => {
    const flow = getDiagramState(root).flow as DiagramFlowOptions | undefined;
    const flowOn = !!flow && flow.enabled !== false;
    if (playBtn) {
      playBtn.hidden = !flowOn;
      const playing = isDiagramFlowPlaying(root);
      playBtn.textContent = playing ? '⏸' : '▶';
      playBtn.title = playing ? 'Pause flow' : 'Play flow';
      playBtn.setAttribute('aria-label', playBtn.title);
    }
    if (replayBtn) {
      replayBtn.hidden = !flowOn;
    }
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(readZoom(app) * 100)}%`;
    }
    const anyVisible =
      showZoom ||
      Array.from(el.querySelectorAll('button')).some((b) => !(b as HTMLButtonElement).hidden);
    el.hidden = !anyVisible;
  };

  if (playBtn) {
    playBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDiagramFlowPause(app, root);
      sync();
    });
  }
  if (replayBtn) {
    replayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      replayDiagramFlow(app, root);
      sync();
    });
  }

  host.appendChild(el);

  const poll = window.setInterval(() => {
    if (!el.isConnected) {
      window.clearInterval(poll);
      return;
    }
    sync();
  }, 400);

  const handle: DiagramToolbarHandle = {
    root,
    el,
    opts: { flow: showFlow, zoom: showZoom },
    sync,
    destroy: () => {
      window.clearInterval(poll);
      el.remove();
      if (root.metadata?.[TOOLBAR_KEY] === handle) {
        delete root.metadata[TOOLBAR_KEY];
      }
    },
  };

  root.metadata[TOOLBAR_KEY] = handle;
  sync();
  return handle;
}

/** Remove toolbar DOM + metadata for a diagram root. */
export function uninstallDiagramToolbar(root: Group): void {
  const handle = root.metadata?.[TOOLBAR_KEY] as DiagramToolbarHandle | undefined;
  if (handle) {
    handle.destroy();
  }
}

/**
 * Keep toolbar in sync with `diagramState.flow.chrome`.
 * Called from apply / pause / resume / stop.
 */
export function syncDiagramToolbar(app: App, root: Group): void {
  const flow = getDiagramState(root).flow as DiagramFlowOptions | undefined;
  const flowEnabled = !!flow && flow.enabled !== false;
  const flags = resolveDiagramChrome(flow?.chrome, flowEnabled);

  if (!flags.enabled) {
    uninstallDiagramToolbar(root);
    return;
  }

  const existing = root.metadata?.[TOOLBAR_KEY] as DiagramToolbarHandle | undefined;
  if (
    existing?.el.isConnected &&
    existing.opts.flow === flags.flow &&
    existing.opts.zoom === flags.zoom
  ) {
    existing.sync();
    return;
  }

  installDiagramToolbar(app, root, { flow: flags.flow, zoom: flags.zoom });
}
