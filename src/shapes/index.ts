import { Node } from '../Node';
import { AnimationEngine } from '../animation/Animation';
import { pathContainsPoint, pathBounds } from '../utils/pathHitTest';
import type { NodeOptions } from '../types';

export class Rect extends Node {
  width: number;
  height: number;
  cornerRadius = 0;

  constructor(options: NodeOptions & { width?: number; height?: number; cornerRadius?: number } = {}) {
    super('rect', options);
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    this.cornerRadius = options.cornerRadius ?? 0;
  }

  containsPoint(localX: number, localY: number): boolean {
    return localX >= 0 && localY >= 0 && localX <= this.width && localY <= this.height;
  }

  getBounds() {
    return { x: 0, y: 0, width: this.width, height: this.height };
  }

  draw(ctx: unknown): void {
    (ctx as { drawRect: (n: Rect) => void }).drawRect(this);
  }

  protected getShapeProps() {
    return { width: this.width, height: this.height, cornerRadius: this.cornerRadius };
  }
}

export class Circle extends Node {
  radius: number;

  constructor(options: NodeOptions & { radius?: number } = {}) {
    super('circle', options);
    this.radius = options.radius ?? 50;
  }

  containsPoint(localX: number, localY: number): boolean {
    const dx = localX - this.radius;
    const dy = localY - this.radius;
    return dx * dx + dy * dy <= this.radius * this.radius;
  }

  getBounds() {
    return { x: 0, y: 0, width: this.radius * 2, height: this.radius * 2 };
  }

  draw(ctx: unknown): void {
    (ctx as { drawCircle: (n: Circle) => void }).drawCircle(this);
  }

  protected getShapeProps() {
    return { radius: this.radius };
  }
}

export class Ellipse extends Node {
  radiusX: number;
  radiusY: number;

  constructor(options: NodeOptions & { radiusX?: number; radiusY?: number } = {}) {
    super('ellipse', options);
    this.radiusX = options.radiusX ?? 50;
    this.radiusY = options.radiusY ?? 30;
  }

  containsPoint(localX: number, localY: number): boolean {
    const dx = (localX - this.radiusX) / this.radiusX;
    const dy = (localY - this.radiusY) / this.radiusY;
    return dx * dx + dy * dy <= 1;
  }

  getBounds() {
    return { x: 0, y: 0, width: this.radiusX * 2, height: this.radiusY * 2 };
  }

  draw(ctx: unknown): void {
    (ctx as { drawEllipse: (n: Ellipse) => void }).drawEllipse(this);
  }

  protected getShapeProps() {
    return { radiusX: this.radiusX, radiusY: this.radiusY };
  }
}

export class Line extends Node {
  x2: number;
  y2: number;

  constructor(options: NodeOptions & { x2?: number; y2?: number } = {}) {
    super('line', options);
    this.x2 = options.x2 ?? 100;
    this.y2 = options.y2 ?? 0;
  }

  containsPoint(localX: number, localY: number): boolean {
    const tolerance = Math.max(this.strokeWidth, 5);
    const dx = this.x2;
    const dy = this.y2;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(localX, localY) <= tolerance;
    const t = clamp((localX * dx + localY * dy) / lenSq, 0, 1);
    const px = t * dx;
    const py = t * dy;
    return Math.hypot(localX - px, localY - py) <= tolerance;
  }

  getBounds() {
    return {
      x: Math.min(0, this.x2),
      y: Math.min(0, this.y2),
      width: Math.abs(this.x2),
      height: Math.abs(this.y2),
    };
  }

  draw(ctx: unknown): void {
    (ctx as { drawLine: (n: Line) => void }).drawLine(this);
  }

  protected getShapeProps() {
    return { x2: this.x2, y2: this.y2 };
  }
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export class Arc extends Node {
  radius: number;
  startAngle: number;
  endAngle: number;
  counterClockwise = false;

  constructor(
    options: NodeOptions & {
      radius?: number;
      startAngle?: number;
      endAngle?: number;
      counterClockwise?: boolean;
    } = {}
  ) {
    super('arc', options);
    this.radius = options.radius ?? 50;
    this.startAngle = options.startAngle ?? 0;
    this.endAngle = options.endAngle ?? Math.PI * 1.5;
    this.counterClockwise = options.counterClockwise ?? false;
  }

  containsPoint(localX: number, localY: number): boolean {
    const cx = this.radius;
    const cy = this.radius;
    const dx = localX - cx;
    const dy = localY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > this.radius) return false;
    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += Math.PI * 2;
    return angle >= this.startAngle && angle <= this.endAngle;
  }

  getBounds() {
    return { x: 0, y: 0, width: this.radius * 2, height: this.radius * 2 };
  }

  draw(ctx: unknown): void {
    (ctx as { drawArc: (n: Arc) => void }).drawArc(this);
  }

  protected getShapeProps() {
    return {
      radius: this.radius,
      startAngle: this.startAngle,
      endAngle: this.endAngle,
      counterClockwise: this.counterClockwise,
    };
  }
}

export class Polygon extends Node {
  points: number[];

  constructor(options: NodeOptions & { points?: number[] } = {}) {
    super('polygon', options);
    this.points = options.points ?? [0, 0, 100, 0, 50, 80];
  }

  containsPoint(localX: number, localY: number): boolean {
    const pts = this.points;
    let inside = false;
    for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
      const xi = pts[i],
        yi = pts[i + 1];
      const xj = pts[j],
        yj = pts[j + 1];
      if (yi > localY !== yj > localY && localX < ((xj - xi) * (localY - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  getBounds() {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (let i = 0; i < this.points.length; i += 2) {
      minX = Math.min(minX, this.points[i]);
      minY = Math.min(minY, this.points[i + 1]);
      maxX = Math.max(maxX, this.points[i]);
      maxY = Math.max(maxY, this.points[i + 1]);
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  draw(ctx: unknown): void {
    (ctx as { drawPolygon: (n: Polygon) => void }).drawPolygon(this);
  }

  protected getShapeProps() {
    return { points: [...this.points] };
  }
}

export class Polyline extends Polygon {
  constructor(options: NodeOptions & { points?: number[] } = {}) {
    super(options);
    this.type = 'polyline';
  }

  containsPoint(localX: number, localY: number): boolean {
    const tolerance = Math.max(this.strokeWidth, 5);
    const pts = this.points;
    for (let i = 0; i < pts.length - 2; i += 2) {
      const x1 = pts[i],
        y1 = pts[i + 1];
      const x2 = pts[i + 2],
        y2 = pts[i + 3];
      const dx = x2 - x1,
        dy = y2 - y1;
      const lenSq = dx * dx + dy * dy;
      const t = lenSq === 0 ? 0 : clamp(((localX - x1) * dx + (localY - y1) * dy) / lenSq, 0, 1);
      const px = x1 + t * dx,
        py = y1 + t * dy;
      if (Math.hypot(localX - px, localY - py) <= tolerance) return true;
    }
    return false;
  }

  draw(ctx: unknown): void {
    (ctx as { drawPolyline: (n: Polyline) => void }).drawPolyline(this);
  }
}

export class Path extends Node {
  d: string;

  constructor(options: NodeOptions & { d?: string } = {}) {
    super('path', options);
    this.d = options.d ?? 'M0 0 L100 100';
  }

  containsPoint(localX: number, localY: number): boolean {
    return pathContainsPoint(this.d, localX, localY, this.strokeWidth);
  }

  getBounds() {
    return pathBounds(this.d);
  }

  draw(ctx: unknown): void {
    (ctx as { drawPath: (n: Path) => void }).drawPath(this);
  }

  protected getShapeProps() {
    return { d: this.d };
  }
}

export class Star extends Node {
  numPoints: number;
  innerRadius: number;
  outerRadius: number;

  constructor(
    options: NodeOptions & { numPoints?: number; innerRadius?: number; outerRadius?: number } = {}
  ) {
    super('star', options);
    this.numPoints = options.numPoints ?? 5;
    this.innerRadius = options.innerRadius ?? 25;
    this.outerRadius = options.outerRadius ?? 50;
  }

  containsPoint(localX: number, localY: number): boolean {
    const cx = this.outerRadius;
    const cy = this.outerRadius;
    return Math.hypot(localX - cx, localY - cy) <= this.outerRadius;
  }

  getBounds() {
    return { x: 0, y: 0, width: this.outerRadius * 2, height: this.outerRadius * 2 };
  }

  draw(ctx: unknown): void {
    (ctx as { drawStar: (n: Star) => void }).drawStar(this);
  }

  protected getShapeProps() {
    return {
      numPoints: this.numPoints,
      innerRadius: this.innerRadius,
      outerRadius: this.outerRadius,
    };
  }
}

export class TextNode extends Node {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: CanvasTextAlign;

  constructor(
    options: NodeOptions & {
      text?: string;
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      textAlign?: CanvasTextAlign;
    } = {}
  ) {
    super('text', options);
    this.text = options.text ?? '';
    this.fontSize = options.fontSize ?? 16;
    this.fontFamily = options.fontFamily ?? 'sans-serif';
    this.fontWeight = options.fontWeight ?? 'normal';
    this.textAlign = options.textAlign ?? 'left';
    this.fill = options.fill ?? '#000000';
  }

  containsPoint(localX: number, localY: number): boolean {
    const b = this.getBounds();
    return localX >= b.x && localY >= b.y && localX <= b.x + b.width && localY <= b.y + b.height;
  }

  getBounds() {
    const w = this.text.length * this.fontSize * 0.6;
    return { x: 0, y: -this.fontSize, width: w, height: this.fontSize * 1.2 };
  }

  draw(ctx: unknown): void {
    (ctx as { drawText: (n: TextNode) => void }).drawText(this);
  }

  protected getShapeProps() {
    return {
      text: this.text,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      textAlign: this.textAlign,
    };
  }
}

export class ImageNode extends Node {
  src: string;
  width: number;
  height: number;
  private _image: HTMLImageElement | null = null;
  loaded = false;

  constructor(options: NodeOptions & { src?: string; width?: number; height?: number } = {}) {
    super('image', options);
    this.src = options.src ?? '';
    this.width = options.width ?? 100;
    this.height = options.height ?? 100;
    if (this.src) this.load();
  }

  load(): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this._image = img;
        this.loaded = true;
        this.markDirty();
        resolve();
      };
      img.onerror = reject;
      img.src = this.src;
    });
  }

  get image(): HTMLImageElement | null {
    return this._image;
  }

  containsPoint(localX: number, localY: number): boolean {
    return localX >= 0 && localY >= 0 && localX <= this.width && localY <= this.height;
  }

  getBounds() {
    return { x: 0, y: 0, width: this.width, height: this.height };
  }

  draw(ctx: unknown): void {
    (ctx as { drawImage: (n: ImageNode) => void }).drawImage(this);
  }

  protected getShapeProps() {
    return { src: this.src, width: this.width, height: this.height };
  }
}

export class Sprite extends ImageNode {
  frameWidth: number;
  frameHeight: number;
  frames: number;
  currentFrame = 0;
  fps: number;
  playing = false;
  private _lastTime = 0;
  private _loop = true;
  private _animControl: ReturnType<typeof AnimationEngine.animate> | null = null;
  private _frameProxy = { frame: 0 };

  constructor(
    options: NodeOptions & {
      src?: string;
      frameWidth?: number;
      frameHeight?: number;
      frames?: number;
      fps?: number;
    } = {}
  ) {
    super(options);
    this.type = 'sprite';
    this.frameWidth = options.frameWidth ?? this.width;
    this.frameHeight = options.frameHeight ?? this.height;
    this.frames = options.frames ?? 1;
    this.fps = options.fps ?? 12;
    this.playing = (options.playing as boolean) ?? false;
  }

  play(options?: { fps?: number; loop?: boolean }): this {
    if (options?.fps !== undefined) this.fps = options.fps;
    if (options?.loop !== undefined) this._loop = options.loop;
    this.stop();
    if (this.frames <= 1) {
      this.playing = true;
      return this;
    }
    this.playing = true;
    this.currentFrame = 0;
    this._frameProxy.frame = 0;
    const duration = ((this.frames - 1) / this.fps) * 1000;
    this._animControl = AnimationEngine.animate(this._frameProxy, {
      frame: this.frames - 1,
      duration: Math.max(duration, 1),
      loop: this._loop,
      onUpdate: () => {
        this.currentFrame = Math.round(this._frameProxy.frame);
        this.markDirty();
      },
      onComplete: () => {
        if (!this._loop) this.playing = false;
      },
    });
    this.markDirty();
    return this;
  }

  stop(): this {
    this.playing = false;
    this._animControl?.stop();
    this._animControl = null;
    return this;
  }

  updateFrame(time: number): void {
    if (this._animControl || !this.playing || this.frames <= 1) return;
    const interval = 1000 / this.fps;
    if (time - this._lastTime >= interval) {
      this.currentFrame = (this.currentFrame + 1) % this.frames;
      this._lastTime = time;
      this.markDirty();
    }
  }

  draw(ctx: unknown): void {
    (ctx as { drawSprite: (n: Sprite) => void }).drawSprite(this);
  }

  protected getShapeProps() {
    return {
      ...super.getShapeProps(),
      frameWidth: this.frameWidth,
      frameHeight: this.frameHeight,
      frames: this.frames,
      fps: this.fps,
    };
  }
}

/** Alias for rounded rectangle */
export class RoundedRect extends Rect {
  constructor(options: NodeOptions & { width?: number; height?: number; cornerRadius?: number } = {}) {
    super({ cornerRadius: 8, ...options });
    this.type = 'roundedRect';
  }
}
