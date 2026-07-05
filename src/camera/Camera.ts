import type { App } from '../App';
import { Matrix2D, degToRad } from '../utils';

export class Camera {
  x = 0;
  y = 0;
  zoom = 1;
  rotation = 0;
  private followTarget: { x: number; y: number } | null = null;
  private viewportWidth = 0;
  private viewportHeight = 0;

  constructor(private app: App) {}

  setViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  pan(dx: number, dy: number): this {
    this.x += dx;
    this.y += dy;
    this.app.requestRender();
    return this;
  }

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    this.app.requestRender();
    return this;
  }

  setZoom(zoom: number): this {
    this.zoom = Math.max(0.01, zoom);
    this.app.requestRender();
    return this;
  }

  setRotation(degrees: number): this {
    this.rotation = degrees;
    this.app.requestRender();
    return this;
  }

  follow(target: { x: number; y: number } | null): this {
    this.followTarget = target;
    return this;
  }

  update(): void {
    if (this.followTarget) {
      this.x = this.followTarget.x - this.viewportWidth / (2 * this.zoom);
      this.y = this.followTarget.y - this.viewportHeight / (2 * this.zoom);
    }
  }

  /** Screen to world coordinates */
  screenToWorld(sx: number, sy: number): { x: number; y: number } {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    const m = new Matrix2D();
    m.translate(cx, cy);
    m.scale(this.zoom, this.zoom);
    m.rotate(degToRad(this.rotation));
    m.translate(-this.x - cx / this.zoom, -this.y - cy / this.zoom);
    const inv = m.invert();
    return inv ? inv.transformPoint(sx, sy) : { x: sx, y: sy };
  }

  /** World to screen coordinates */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    const m = new Matrix2D();
    m.translate(cx, cy);
    m.scale(this.zoom, this.zoom);
    m.rotate(degToRad(this.rotation));
    m.translate(-this.x - cx / this.zoom, -this.y - cy / this.zoom);
    return m.transformPoint(wx, wy);
  }

  getMatrix(): Matrix2D {
    const cx = this.viewportWidth / 2;
    const cy = this.viewportHeight / 2;
    const m = new Matrix2D();
    m.translate(cx, cy);
    m.scale(this.zoom, this.zoom);
    m.rotate(degToRad(this.rotation));
    m.translate(-this.x - cx / this.zoom, -this.y - cy / this.zoom);
    return m;
  }
}
