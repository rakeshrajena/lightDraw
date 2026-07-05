import { Group, Layer } from './shapes/Group';
import './registry/initCore';
import { pointInMask } from './renderers/clipUtils';
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
import { detectBestRenderer, getPixelRatio, resolveContainer, requestFrame, cancelFrame, matrixPool } from './utils';
import { fromJSON, toJSON } from './io/json';
import { exportScene, exportApp } from './io/export';
import type { ExportFormat, ExportOptions, ExportResult } from './io/exportTypes';
import { installPlugin } from './plugins/index';
import type { LightDrawStatic } from './types';
import { SpatialIndex } from './performance/SpatialIndex';
import { getWorldBounds, countNodes } from './performance/bounds';
import { AnimationEngine } from './animation/Animation';
import { collectFocusable } from './utils/focusOrder';

export class App extends EventEmitter {
  readonly camera: Camera;
  readonly stage: Group;
  private container: HTMLElement;
  private renderer: Renderer;
  private width: number;
  private height: number;
  private pixelRatio: number;
  private background: string;
  private eventManager: EventManager | null = null;
  private renderScheduled = false;
  private renderFrameId = 0;
  private autoResize: boolean;
  private resizeHandler: (() => void) | null = null;
  private readonly perf: Required<import('./types').PerformanceOptions>;
  private spatialIndex = new SpatialIndex();
  private nodeCount = 0;
  private highContrast: boolean;

  constructor(container: string | HTMLElement, options: AppOptions = {}) {
    super();
    this.highContrast = options.highContrast ?? false;
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
    this.background = options.background ?? 'transparent';
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
    });

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
      const hit = this.hitTestSpatial(worldX, worldY);
      return hit ? { node: hit, x: worldX, y: worldY } : null;
    }
    const hit = this.hitTestNode(this.stage, worldX, worldY);
    return hit ? { node: hit, x: worldX, y: worldY } : null;
  }

  private hitTestSpatial(worldX: number, worldY: number): Node | null {
    const candidates = this.spatialIndex.queryPoint(worldX, worldY);
    for (const child of candidates) {
      if (!child.visible || !child.listening) continue;
      const wm = child.getWorldMatrix();
      const inv = matrixPool.acquire();
      if (!wm.invertInto(inv)) {
        matrixPool.release(inv);
        continue;
      }
      const local = inv.transformPoint(worldX, worldY);
      matrixPool.release(inv);
      if (!pointInMask(child.mask, local.x, local.y)) continue;
      if (child.containsPoint(local.x, local.y)) return child;
    }
    return null;
  }

  private hitTestNode(group: Group, worldX: number, worldY: number): Node | null {
    const children = [...group.children].reverse();
    for (const child of children) {
      if (!child.visible || !child.listening) continue;

      if ('children' in child) {
        const nested = this.hitTestNode(child as Group, worldX, worldY);
        if (nested) return nested;
      }

      const wm = child.getWorldMatrix();
      const inv = matrixPool.acquire();
      if (!wm.invertInto(inv)) {
        matrixPool.release(inv);
        continue;
      }
      const local = inv.transformPoint(worldX, worldY);
      matrixPool.release(inv);

      if (!pointInMask(child.mask, local.x, local.y)) continue;

      if (child.containsPoint(local.x, local.y)) {
        return child;
      }
    }
    return null;
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
    this.requestRender();
    return this;
  }

  loadJSON(json: SceneJSON | string): Node | Group {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    const node = fromJSON(data, this);
    this.stage.clear();
    this.stage.add(node);
    this.nodeCount = countNodes(this.stage);
    this.spatialIndex.clear();
    this.renderer.forceFullRedraw();
    this.requestRender();
    return node;
  }

  exportJSON(): SceneJSON {
    return toJSON(this.stage);
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
