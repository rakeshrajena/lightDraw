import { Group, Layer } from './shapes/Group';
import './registry/initCore';
import { EventEmitter } from './core/EventEmitter';
import { Camera } from './camera/Camera';
import { EventManager } from './events/EventManager';
import { CanvasRenderer } from './renderers/CanvasRenderer';
import { createRenderer, hasRenderer } from './registry/renderers';
import type { Renderer } from './renderers/Renderer';
import { Timeline } from './animation/Timeline';
import type { AppOptions, HitTestResult, RendererType, SceneJSON, Plugin, AnimationOptions } from './types';
import type { Node } from './Node';
import {
  Rect,
  Circle,
  Ellipse,
  Line,
  Arc,
  Polygon,
  Polyline,
  Path,
  Star,
  RoundedRect,
  TextNode,
  ImageNode,
  Sprite,
} from './shapes/index';
import { detectBestRenderer, getPixelRatio, resolveContainer, requestFrame, cancelFrame } from './utils';
import { fromJSON, toJSON } from './io/json';
import { exportScene, exportApp } from './io/export';
import { formatJsonParseError } from './io/schema';
import type { ExportFormat, ExportOptions, ExportResult } from './io/exportTypes';
import { installPlugin } from './plugins/index';
import type { LightDrawStatic } from './types';
import { SpatialIndex } from './performance/SpatialIndex';
import { getWorldBounds, countNodes } from './performance/bounds';
import { AnimationEngine } from './animation/Animation';
import { collectFocusable } from './utils/focusOrder';
import { resolveUiTheme, resolveThemeBackground, type UiThemeInput, type UiThemeTokens } from './components/uiTheme';
import { syntheticEvent } from './components/helpers';
import { syncActiveCanvasUiTheme, refreshCanvasUi } from './components/resolveCanvasTheme';
import { syncActiveDashboardTheme, refreshDashboard, type DashboardTheme } from './dashboard/theme';
import { syncActiveDiagramTheme } from './diagram/theme';
import { refreshDiagram } from './diagram/refresh';
import { syncAutomotiveFontScale, getAutomotiveFontScale, syncAutomotiveDefaultPreset } from './automotive/themes';
import { refreshAutomotive } from './automotive/refresh';
import {
  type ThemePack,
  type DiagramThemePack,
  splitThemePack,
  mergeThemePacks,
  normalizeThemePack,
  extractSceneTheme,
  composeThemePack,
} from './theme/themePack';
import { hitTestNode, hitTestSpatial } from './app/hitTest';

export class App extends EventEmitter {
  readonly camera: Camera;
  readonly stage: Group;
  private container: HTMLElement;
  private renderer: Renderer;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private background: string;
  /** Background from createApp options — restored when theme has no stage BG. */
  private defaultBackground: string;
  private eventManager: EventManager | null = null;
  private renderScheduled = false;
  private renderFrameId = 0;
  private autoResize: boolean;
  private resizeHandler: (() => void) | null = null;
  private readonly perf: Required<import('./types').PerformanceOptions>;
  private spatialIndex = new SpatialIndex();
  private nodeCount = 0;
  private highContrast: boolean;
  /** Merged theme pack (preset + brand tokens + optional module packs). */
  private uiTheme: ThemePack;
  /** Flat resolved brand tokens — source of truth for UI remap (Phase 1+). */
  private resolvedUiTheme: UiThemeTokens;
  /** Module packs stored alongside brand tokens. */
  private themeModules: {
    series?: string[];
    dashboard?: Partial<DashboardTheme>;
    diagram?: DiagramThemePack;
    automotive?: 'classic' | 'sport' | 'digital';
    background?: string;
  } = {};
  /** True when app `fontSize` changed automotive typography scale (rebuild HMI). */
  private automotiveFontScaleDirty = false;

  constructor(container: string | HTMLElement, options: AppOptions = {}) {
    super();
    this.highContrast = options.highContrast ?? false;
    this.uiTheme = {};
    this.resolvedUiTheme = {};
    this.ingestThemePack(normalizeThemePack(options.uiTheme ?? {}), true);
    this.perf = {
      spatialIndex: options.performance?.spatialIndex ?? true,
      spatialIndexThreshold: options.performance?.spatialIndexThreshold ?? 100,
      dirtyRegions: options.performance?.dirtyRegions ?? true,
      batchRendering: options.performance?.batchRendering ?? true,
      layerCache: options.performance?.layerCache ?? true,
    };
    this.container = resolveContainer(container);
    this.width = options.width ?? (this.container.clientWidth || 800);
    this.height = options.height ?? (this.container.clientHeight || 600);
    this.pixelRatio = options.pixelRatio ?? getPixelRatio();
    this.defaultBackground = options.background ?? 'transparent';
    this.background = this.defaultBackground;
    this.autoResize = options.autoResize ?? true;

    this.stage = new Group({ name: 'stage' });
    (this.stage as Node & { _app?: App })._app = this;
    this.camera = new Camera(this);
    this.camera.setViewport(this.width, this.height);

    this.renderer = this.createRenderer(options.renderer ?? 'auto');
    this.applyPerformanceOptions();
    this.renderer.init(this.container, {
      width: this.width,
      height: this.height,
      pixelRatio: this.pixelRatio,
      background: this.background,
      highContrast: this.highContrast,
      uiTheme: this.resolvedUiTheme,
    });

    // Re-apply theme-driven stage background after renderer exists.
    this.syncThemeBackground();
    this.eventManager = new EventManager(this, this.renderer.getElement() as HTMLElement);

    if (this.autoResize && typeof window !== 'undefined') {
      this.resizeHandler = () => this.handleResize();
      window.addEventListener('resize', this.resizeHandler);
    }

    this.render();
  }

  private applyPerformanceOptions(): void {
    if (this.renderer instanceof CanvasRenderer) {
      this.renderer.dirtyRegionsEnabled = this.perf.dirtyRegions;
      this.renderer.batchRendering = this.perf.batchRendering;
      this.renderer.layerCacheEnabled = this.perf.layerCache;
    }
  }

  private createRenderer(type: RendererType): Renderer {
    let resolved: RendererType = type === 'auto' ? detectBestRenderer() : type;
    if (resolved !== 'canvas' && !hasRenderer(resolved)) {
      resolved = 'canvas';
    }
    const renderer = createRenderer(resolved);
    if (renderer) return renderer;
    const fallback = createRenderer('canvas');
    if (fallback) return fallback;
    throw new Error('LightDraw: no renderer registered (load lightdraw.core first)');
  }

  rect(options?: ConstructorParameters<typeof Rect>[0]): Rect {
    return this.createNode(() => new Rect(options));
  }

  circle(options?: ConstructorParameters<typeof Circle>[0]): Circle {
    return this.createNode(() => new Circle(options));
  }

  ellipse(options?: ConstructorParameters<typeof Ellipse>[0]): Ellipse {
    return this.createNode(() => new Ellipse(options));
  }

  line(options?: ConstructorParameters<typeof Line>[0]): Line {
    return this.createNode(() => new Line(options));
  }

  arc(options?: ConstructorParameters<typeof Arc>[0]): Arc {
    return this.createNode(() => new Arc(options));
  }

  polygon(options?: ConstructorParameters<typeof Polygon>[0]): Polygon {
    return this.createNode(() => new Polygon(options));
  }

  polyline(options?: ConstructorParameters<typeof Polyline>[0]): Polyline {
    return this.createNode(() => new Polyline(options));
  }

  path(options?: ConstructorParameters<typeof Path>[0]): Path {
    return this.createNode(() => new Path(options));
  }

  star(options?: ConstructorParameters<typeof Star>[0]): Star {
    return this.createNode(() => new Star(options));
  }

  roundedRect(options?: ConstructorParameters<typeof RoundedRect>[0]): RoundedRect {
    return this.createNode(() => new RoundedRect(options));
  }

  text(options?: ConstructorParameters<typeof TextNode>[0]): TextNode {
    return this.createNode(() => new TextNode(options));
  }

  image(options?: ConstructorParameters<typeof ImageNode>[0]): ImageNode {
    return this.createNode(() => new ImageNode(options));
  }

  sprite(options?: ConstructorParameters<typeof Sprite>[0]): Sprite {
    return this.createNode(() => new Sprite(options));
  }

  group(options?: ConstructorParameters<typeof Group>[0]): Group {
    return this.createNode(() => new Group(options));
  }

  layer(options?: ConstructorParameters<typeof Layer>[0]): Layer {
    return this.createNode(() => new Layer(options));
  }

  private attachApp(node: Node): void {
    (node as Node & { _app?: App })._app = this;
    if ('children' in node) {
      for (const child of (node as Group).children) {
        this.attachApp(child);
      }
    }
  }

  private createNode<T extends Node>(factory: () => T): T {
    const node = factory();
    this.attachApp(node);
    return node;
  }

  add(...nodes: Node[]): this {
    for (const node of nodes) {
      this.attachApp(node);
    }
    this.stage.add(...nodes);
    this.nodeCount = countNodes(this.stage);
    this.spatialIndex.markStale();
    this.renderer.forceFullRedraw();
    this.requestRender();
    return this;
  }

  /** Called from Node.markDirty — tracks dirty regions for partial canvas clears. */
  markNodeDirty(node: Node): void {
    const b = getWorldBounds(node);
    this.renderer.markDirty(b.x, b.y, b.width, b.height);
    if (node instanceof Group && node.cacheAsBitmap && this.renderer instanceof CanvasRenderer) {
      this.renderer.layerCache.invalidate(node.id);
    }
    this.spatialIndex.markStale();
  }

  /** Called from Node.destroy — purge caches and spatial index entries. */
  onNodeDestroyed(node: Node): void {
    if (this.renderer instanceof CanvasRenderer) {
      this.renderer.layerCache.invalidate(node.id);
      if ('children' in node) {
        this.renderer.layerCache.invalidateSubtree(node as Group);
      }
    }
    this.spatialIndex.markStale();
    this.nodeCount = Math.max(0, this.nodeCount - 1);
  }

  timeline(): Timeline {
    return new Timeline();
  }

  animate(node: Node, options: AnimationOptions): ReturnType<typeof AnimationEngine.animate> {
    return AnimationEngine.animate(node as unknown as Record<string, unknown>, options);
  }

  getFocusedNode(): Node | null {
    return this.eventManager?.getFocusedNode() ?? null;
  }

  isHighContrast(): boolean {
    return this.highContrast;
  }

  setHighContrast(enabled: boolean): this {
    this.highContrast = enabled;
    this.renderer.forceFullRedraw();
    this.requestRender();
    return this;
  }

  focusNode(node: Node | null): this {
    this.eventManager?.setFocus(node);
    return this;
  }

  getFocusableNodes(): Node[] {
    return collectFocusable(this.stage);
  }

  requestRender(): void {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    this.renderFrameId = requestFrame(() => {
      this.renderScheduled = false;
      this.render();
    });
  }

  render(): void {
    this.updateSprites(this.stage);
    this.camera.update();
    const focusedNodeId = this.eventManager?.getFocusedNode()?.id ?? null;
    this.renderer.setRenderState({ focusedNodeId, highContrast: this.highContrast });
    this.renderer.render(this.stage, this.camera.getMatrix());
    this.nodeCount = countNodes(this.stage);
    if (this.perf.spatialIndex && this.nodeCount >= this.perf.spatialIndexThreshold) {
      this.spatialIndex.ensureFresh(this.stage);
    }
  }

  private updateSprites(group: Group): void {
    const time = typeof performance !== 'undefined' ? performance.now() : Date.now();
    for (const child of group.children) {
      if (child instanceof Sprite && child.playing) {
        child.updateFrame(time);
      }
      if ('children' in child) {
        this.updateSprites(child as Group);
      }
    }
  }

  hitTest(worldX: number, worldY: number): HitTestResult | null {
    if (this.perf.spatialIndex && this.nodeCount >= this.perf.spatialIndexThreshold) {
      this.spatialIndex.ensureFresh(this.stage);
      const hit = hitTestSpatial(this.spatialIndex, worldX, worldY);
      return hit ? { node: hit, x: worldX, y: worldY } : null;
    }
    const hit = hitTestNode(this.stage, worldX, worldY);
    return hit ? { node: hit, x: worldX, y: worldY } : null;
  }

  resize(width?: number, height?: number): void {
    this.width = width ?? (this.container.clientWidth || this.width);
    this.height = height ?? (this.container.clientHeight || this.height);
    this.camera.setViewport(this.width, this.height);
    this.renderer.resize(this.width, this.height, this.pixelRatio);
    this.renderer.forceFullRedraw();
    this.spatialIndex.markStale();
    this.requestRender();
  }

  private handleResize(): void {
    this.resize();
  }

  getSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  getPixelRatio(): number {
    return this.pixelRatio;
  }

  getBackground(): string {
    return this.background;
  }

  /** Active renderer instance (used by export pipeline). */
  getRenderer(): Renderer {
    return this.renderer;
  }

  setBackground(color: string): this {
    this.background = color;
    const renderer = this.renderer as Renderer & {
      background?: string;
      setStageBackground?: (value: string) => void;
    };

    if (typeof renderer.setStageBackground === 'function') {
      renderer.setStageBackground(color);
    } else if (renderer && 'background' in renderer) {
      renderer.background = color;
    }

    this.renderer.forceFullRedraw();
    this.requestRender();
    return this;
  }

  /**
   * Apply theme pack stage background, or restore pack surface / createApp default
   * when the theme no longer provides one (clears sticky image presets).
   */
  private syncThemeBackground(): void {
    if (this.themeModules.background) {
      this.setBackground(this.themeModules.background);
      return;
    }
    const fromTokens =
      this.resolvedUiTheme.surfaceMuted || this.resolvedUiTheme.surface;
    if (fromTokens) {
      this.setBackground(fromTokens);
      return;
    }
    this.setBackground(this.defaultBackground);
  }

  /** Merged theme config as last set (includes optional `preset` + module packs). Additive Phase 1 API. */
  getUiTheme(): ThemePack {
    return this.getTheme();
  }

  /** Full theme pack (brand + series / dashboard / diagram / automotive). */
  getTheme(): ThemePack {
    return composeThemePack(this.uiTheme, this.themeModules);
  }

  /** Flat resolved brand tokens after presets/overrides. Additive Phase 1 API. */
  getResolvedTheme(): UiThemeTokens {
    return { ...this.resolvedUiTheme };
  }

  /**
   * Apply a full theme pack from JSON or JS.
   * Default **replaces** the stored pack (clean preset switches).
   * Pass `{ merge: true }` to shallow-merge into the existing pack.
   */
  applyTheme(pack: ThemePack | Record<string, unknown>, options?: { merge?: boolean }): this {
    const normalized = normalizeThemePack(pack);
    this.ingestThemePack(normalized, !options?.merge);
    this.publishTheme();
    return this;
  }

  /**
   * Update built-in UI theme tokens without custom stylesheets.
   * By default **merges** into existing config (omitted keys stick).
   * Pass `{ replace: true }` to replace the stored config entirely.
   * Accepts a full `ThemePack` (`series`, `dashboard`, `diagram`, `automotive`).
   *
   * Automotive widgets are intentionally **not** retinted here — they keep
   * `props.theme` presets (`classic` | `sport` | `digital`). See theme-architecture.md.
   */
  setUiTheme(tokens: ThemePack | UiThemeInput, options?: { replace?: boolean }): this {
    const pack = normalizeThemePack(tokens);
    this.ingestThemePack(pack, Boolean(options?.replace));
    this.publishTheme();
    return this;
  }

  /** Reset theme config to `{}` (CSS / module defaults). Equivalent to `setUiTheme({}, { replace: true })`. */
  clearUiTheme(): this {
    return this.setUiTheme({}, { replace: true });
  }

  /**
   * Load a scene. If the JSON root includes `theme`, it is applied first
   * (replace) so widgets build under that palette.
   * Optional second arg: `{ theme }` when the scene file has no root theme.
   */
  loadJSON(
    json: SceneJSON | string,
    options?: { theme?: ThemePack | Record<string, unknown> }
  ): Node | Group {
    let data: Record<string, unknown>;
    if (typeof json === 'string') {
      try {
        data = JSON.parse(json) as Record<string, unknown>;
      } catch (err) {
        throw new SyntaxError(formatJsonParseError(json, err));
      }
    } else {
      data = { ...json };
    }
    const { theme: sceneTheme, scene } = extractSceneTheme(data as Record<string, unknown>);
    const external = options?.theme ? normalizeThemePack(options.theme) : null;
    const theme = external ?? sceneTheme;
    if (theme && Object.keys(theme).length > 0) {
      this.applyTheme(theme);
    }
    const node = fromJSON(scene as unknown as SceneJSON, this);
    this.stage.clear();
    this.stage.add(node);
    this.nodeCount = countNodes(this.stage);
    this.spatialIndex.clear();
    this.renderer.forceFullRedraw();
    this.requestRender();
    return node;
  }

  /** Export scene. Pass `{ includeTheme: true }` to embed the current theme pack. */
  exportJSON(options?: { includeTheme?: boolean }): SceneJSON {
    const scene = toJSON(this.stage) as SceneJSON;
    if (options?.includeTheme) {
      const theme = this.getTheme();
      if (Object.keys(theme).length > 0) {
        return { ...scene, theme };
      }
    }
    return scene;
  }

  /** Ingest pack into uiTheme + themeModules and re-resolve (no emit). */
  private ingestThemePack(pack: ThemePack, replace: boolean): void {
    const next = replace ? pack : mergeThemePacks(this.getTheme(), pack);
    const split = splitThemePack(next);
    this.uiTheme = { ...split.ui };
    const resolvedBg = resolveThemeBackground({
      ...split.ui,
      background: split.background,
    });
    this.themeModules = {
      series: split.series,
      dashboard: split.dashboard,
      diagram: split.diagram,
      automotive: split.automotive,
      background: resolvedBg,
    };
    this.resolvedUiTheme = resolveUiTheme(this.uiTheme);
    const dashPack: Partial<DashboardTheme> = {
      ...(this.themeModules.dashboard ?? {}),
      ...(this.themeModules.series?.length
        ? { series: [...this.themeModules.series] }
        : {}),
    };
    syncActiveCanvasUiTheme(this.resolvedUiTheme, this);
    syncActiveDashboardTheme(this.resolvedUiTheme, this, dashPack);
    syncActiveDiagramTheme(this.resolvedUiTheme, this, this.themeModules.diagram);
    const prevAutoScale = getAutomotiveFontScale(this);
    const nextAutoScale = syncAutomotiveFontScale(this.resolvedUiTheme, this);
    syncAutomotiveDefaultPreset(this.themeModules.automotive, this);
    this.automotiveFontScaleDirty = prevAutoScale !== nextAutoScale;
  }

  /** Apply resolved theme to renderer + live widgets and emit themechange. */
  private publishTheme(): void {
    const renderer = this.renderer as Renderer & { setUiTheme?: (t: UiThemeTokens) => void };
    if (typeof renderer.setUiTheme === 'function') {
      renderer.setUiTheme(this.resolvedUiTheme);
    }
    this.syncThemeBackground();
    refreshCanvasUi(this.stage, this);
    refreshDashboard(this.stage, this);
    refreshDiagram(this.stage, this);
    if (this.automotiveFontScaleDirty) {
      refreshAutomotive(this.stage);
      this.automotiveFontScaleDirty = false;
    }
    this.emit(
      'themechange',
      syntheticEvent('themechange', this, {
        payload: {
          config: this.getTheme(),
          resolved: this.getResolvedTheme(),
        },
      })
    );
    this.requestRender();
  }

  /** Export scene — unified options object or legacy format string. */
  export(options: ExportOptions): ExportResult;
  export(format: ExportFormat): string | SceneJSON | Uint8Array;
  export(
    formatOrOptions: ExportFormat | ExportOptions
  ): ExportResult | string | SceneJSON | Uint8Array {
    if (typeof formatOrOptions === 'object') {
      return exportApp(this, formatOrOptions);
    }
    return exportScene(this, formatOrOptions);
  }

  toDataURL(type = 'image/png', quality?: number): string {
    return this.renderer.toDataURL(type, quality);
  }

  /** Remove all nodes from the scene (keeps the App instance). */
  clear(): this {
    this.stage.clear();
    this.nodeCount = 0;
    this.spatialIndex.clear();
    this.renderer.forceFullRedraw();
    this.requestRender();
    return this;
  }

  destroy(): void {
    if (this.renderFrameId) cancelFrame(this.renderFrameId);
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    this.eventManager?.destroy();
    if (this.renderer instanceof CanvasRenderer) {
      this.renderer.layerCache.destroy();
    }
    this.spatialIndex.clear();
    this.renderer.destroy();
    this.stage.clear();
    this.removeAllListeners();
  }

  static use(plugin: Plugin, LightDrawRef?: LightDrawStatic): void {
    const ld = LightDrawRef ?? (globalThis as unknown as { __LightDraw?: LightDrawStatic }).__LightDraw;
    if (ld) installPlugin(plugin, ld);
  }
}
