import { EventEmitter } from './core/EventEmitter';
import type {
  FillStyle,
  NodeOptions,
  Shadow,
  StrokeStyle,
  TransformState,
  AnimationOptions,
  SceneJSON,
} from './types';
import { Matrix2D, degToRad, uid, merge } from './utils';
import { AnimationEngine } from './animation/Animation';
import type { App } from './App';

export abstract class Node extends EventEmitter {
  readonly id: string;
  name = '';
  type: string;

  x = 0;
  y = 0;
  rotation = 0;
  scaleX = 1;
  scaleY = 1;
  skewX = 0;
  skewY = 0;
  opacity = 1;
  visible = true;
  zIndex = 0;
  listening = true;
  draggable = false;
  dropTarget = false;
  dragPayload: unknown = undefined;
  focusable = false;
  tabIndex = 0;
  role?: string;
  ariaChecked?: boolean;
  ariaValueNow?: number;
  ariaValueMin?: number;
  ariaValueMax?: number;
  ariaLive?: 'off' | 'polite' | 'assertive';

  fill: FillStyle = '#000000';
  stroke: StrokeStyle = null;
  strokeWidth = 1;
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  dash: number[] = [];
  dashOffset = 0;
  shadow: Shadow | null = null;
  clip = false;
  mask: Node | null = null;
  metadata: Record<string, unknown> = {};

  parent: Node | null = null;
  protected _dirty = true;
  protected _worldMatrix = new Matrix2D();
  protected _localMatrix = new Matrix2D();

  constructor(type: string, options: NodeOptions = {}) {
    super();
    this.type = type;
    this.id = (options.id as string) ?? uid(type);
    this.applyOptions(options);
    AnimationEngine.onFrame = () => this.getApp()?.requestRender();
  }

  protected applyOptions(options: NodeOptions): void {
    if (options.name) this.name = options.name;
    if (options.x !== undefined) this.x = options.x;
    if (options.y !== undefined) this.y = options.y;
    if (options.rotation !== undefined) this.rotation = options.rotation;
    if (options.scaleX !== undefined) this.scaleX = options.scaleX;
    if (options.scaleY !== undefined) this.scaleY = options.scaleY;
    if (options.skewX !== undefined) this.skewX = options.skewX;
    if (options.skewY !== undefined) this.skewY = options.skewY;
    if (options.opacity !== undefined) this.opacity = options.opacity;
    if (options.visible !== undefined) this.visible = options.visible;
    if (options.zIndex !== undefined) this.zIndex = options.zIndex;
    if (options.fill !== undefined) this.fill = options.fill;
    if (options.stroke !== undefined) this.stroke = options.stroke;
    if (options.strokeWidth !== undefined) this.strokeWidth = options.strokeWidth;
    if (options.lineCap) this.lineCap = options.lineCap;
    if (options.lineJoin) this.lineJoin = options.lineJoin;
    if (options.dash) this.dash = options.dash;
    if (options.dashOffset !== undefined) this.dashOffset = options.dashOffset as number;
    if (options.shadow !== undefined) this.shadow = options.shadow;
    if (options.clip !== undefined) this.clip = options.clip;
    if (options.mask !== undefined) this.mask = options.mask as Node | null;
    if (options.listening !== undefined) this.listening = options.listening;
    if (options.draggable !== undefined) this.draggable = options.draggable;
    if (options.dropTarget !== undefined) this.dropTarget = options.dropTarget as boolean;
    if (options.dragPayload !== undefined) this.dragPayload = options.dragPayload;
    if (options.focusable !== undefined) this.focusable = options.focusable as boolean;
    if (options.tabIndex !== undefined) this.tabIndex = options.tabIndex as number;
    if (options.role !== undefined) this.role = options.role as string;
    if (options.ariaChecked !== undefined) this.ariaChecked = options.ariaChecked as boolean;
    if (options.ariaValueNow !== undefined) this.ariaValueNow = options.ariaValueNow as number;
    if (options.ariaValueMin !== undefined) this.ariaValueMin = options.ariaValueMin as number;
    if (options.ariaValueMax !== undefined) this.ariaValueMax = options.ariaValueMax as number;
    if (options.ariaLive !== undefined) this.ariaLive = options.ariaLive as 'off' | 'polite' | 'assertive';
    if (options.metadata) this.metadata = { ...options.metadata };
    merge(this as unknown as Record<string, unknown>, options);
    this.markDirty();
  }

  get scale(): number {
    return this.scaleX;
  }

  set scale(value: number) {
    this.scaleX = value;
    this.scaleY = value;
    this.markDirty();
  }

  /** Position helpers */
  position(x: number, y: number): this {
    this.x = x;
    this.y = y;
    this.markDirty();
    return this;
  }

  move(x: number, y: number): this {
    return this.position(x, y);
  }

  translate(dx: number, dy: number): this {
    this.x += dx;
    this.y += dy;
    this.markDirty();
    return this;
  }

  rotate(degrees: number): this {
    this.rotation = degrees;
    this.markDirty();
    return this;
  }

  setOpacity(value: number): this {
    this.opacity = value;
    this.markDirty();
    return this;
  }

  hide(): this {
    this.visible = false;
    this.markDirty();
    return this;
  }

  show(): this {
    this.visible = true;
    this.markDirty();
    return this;
  }

  attr(key: string, value?: unknown): unknown {
    if (value === undefined) {
      return (this as Record<string, unknown>)[key];
    }
    (this as Record<string, unknown>)[key] = value;
    this.markDirty();
    return this;
  }

  animate(options: AnimationOptions): ReturnType<typeof AnimationEngine.animate> {
    return AnimationEngine.animate(this as unknown as Record<string, unknown>, options);
  }

  markDirty(): void {
    this._dirty = true;
    this.parent?.markDirty();
    this.getApp()?.markNodeDirty(this);
    this.getApp()?.requestRender();
  }

  isDirty(): boolean {
    return this._dirty;
  }

  clearDirty(): void {
    this._dirty = false;
  }

  getLocalMatrix(): Matrix2D {
    if (this._dirty) {
      this._localMatrix.identity();
      this._localMatrix.translate(this.x, this.y);
      this._localMatrix.rotate(degToRad(this.rotation));
      this._localMatrix.scale(this.scaleX, this.scaleY);
      if (this.skewX || this.skewY) {
        this._localMatrix.skew(degToRad(this.skewX), degToRad(this.skewY));
      }
    }
    return this._localMatrix;
  }

  getWorldMatrix(): Matrix2D {
    const local = this.getLocalMatrix();
    if (this.parent) {
      const parentWorld = this.parent.getWorldMatrix();
      this._worldMatrix.a = parentWorld.a;
      this._worldMatrix.b = parentWorld.b;
      this._worldMatrix.c = parentWorld.c;
      this._worldMatrix.d = parentWorld.d;
      this._worldMatrix.e = parentWorld.e;
      this._worldMatrix.f = parentWorld.f;
      this._worldMatrix.multiply(local);
    } else {
      this._worldMatrix.a = local.a;
      this._worldMatrix.b = local.b;
      this._worldMatrix.c = local.c;
      this._worldMatrix.d = local.d;
      this._worldMatrix.e = local.e;
      this._worldMatrix.f = local.f;
    }
    return this._worldMatrix;
  }

  getTransformState(): TransformState {
    return {
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      skewX: this.skewX,
      skewY: this.skewY,
      opacity: this.opacity,
    };
  }

  getApp(): App | null {
    const direct = (this as Node & { _app?: App })._app;
    if (direct) return direct;
    let node: Node | null = this.parent;
    while (node) {
      const app = (node as Node & { _app?: App })._app;
      if (app) return app;
      node = node.parent;
    }
    return null;
  }

  /** Hit test in local coordinates */
  abstract containsPoint(localX: number, localY: number): boolean;

  /** Bounding box in local coordinates */
  abstract getBounds(): { x: number; y: number; width: number; height: number };

  /** Render hook for renderers */
  abstract draw(ctx: unknown): void;

  toJSON(): SceneJSON {
    return {
      type: this.type,
      id: this.id,
      props: {
        x: this.x,
        y: this.y,
        rotation: this.rotation,
        scaleX: this.scaleX,
        scaleY: this.scaleY,
        opacity: this.opacity,
        visible: this.visible,
        fill: this.fill,
        stroke: this.stroke,
        strokeWidth: this.strokeWidth,
        metadata: this.metadata,
        ...this.getShapeProps(),
      },
    };
  }

  protected getShapeProps(): Record<string, unknown> {
    return {};
  }

  destroy(): void {
    this.getApp()?.onNodeDestroyed(this);
    this.removeAllListeners();
    this.parent = null;
  }
}
