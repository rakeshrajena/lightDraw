import { Renderer, type RenderContext } from './Renderer';
import type { Group } from '../shapes/Group';
import type { Node } from '../Node';
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
  TextNode,
  ImageNode,
  Sprite,
} from '../shapes/index';
import type { FillStyle, StrokeStyle } from '../types';
import { Matrix2D, degToRad } from '../utils';
import { setCanvasFill, setCanvasStroke } from './styles';
import { beginShapeClip } from './clipUtils';
import { LayerCache } from '../performance/LayerCache';
import { isBatchableRect, paintStyleKey } from '../performance/styleKey';
import { traceArcSector } from './arcSector';
import { isSubtreeDirty } from '../performance/bounds';
import { toHighContrastColor } from '../utils/a11y';

export class CanvasRenderer extends Renderer {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private patternCache = new Map<string, CanvasPattern>();
  readonly layerCache = new LayerCache();
  batchRendering = true;
  dirtyRegionsEnabled = true;
  layerCacheEnabled = true;
  /** Exposed for tests — number of clearRect calls in last render. */
  lastClearRectCount = 0;
  /** Exposed for tests — fill calls in last render. */
  lastFillCallCount = 0;
  private drawCallCount = 0;

  init(container: HTMLElement, options: RenderContext): void {
    this.width = options.width;
    this.height = options.height;
    this.pixelRatio = options.pixelRatio;
    this.background = options.background;
    this.highContrast = options.highContrast ?? false;

    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('LightDraw: Canvas 2D not supported');
    this.ctx = ctx;
    this.resize(this.width, this.height, this.pixelRatio);
  }

  resize(width: number, height: number, pixelRatio: number): void {
    this.width = width;
    this.height = height;
    this.pixelRatio = pixelRatio;
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.layerCache.clear();
    this.forceFullRedraw();
  }

  getElement(): HTMLCanvasElement {
    return this.canvas;
  }

  render(root: Group, cameraMatrix?: Matrix2D): void {
    const ctx = this.ctx;
    this.lastClearRectCount = 0;
    this.lastFillCallCount = 0;
    this.drawCallCount = 0;

    ctx.save();

    if (this.needsFullRedraw || !this.dirtyRegionsEnabled) {
      ctx.clearRect(0, 0, this.width, this.height);
      this.lastClearRectCount = 1;
    } else {
      for (const r of this.dirtyRegions) {
        ctx.clearRect(r.x, r.y, r.width, r.height);
        this.lastClearRectCount++;
      }
    }

    if (this.background && this.background !== 'transparent') {
      ctx.fillStyle = this.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    if (cameraMatrix) {
      ctx.transform(
        cameraMatrix.a,
        cameraMatrix.b,
        cameraMatrix.c,
        cameraMatrix.d,
        cameraMatrix.e,
        cameraMatrix.f
      );
    }

    this.drawGroup(root);
    ctx.restore();
    this.clearSceneDirty(root);
    this.clearDirty();
  }

  private clearSceneDirty(node: Node): void {
    node.clearDirty();
    if ('children' in node) {
      for (const child of (node as Group).children) {
        this.clearSceneDirty(child);
      }
    }
  }

  toDataURL(type = 'image/png', quality?: number): string {
    return this.canvas.toDataURL(type, quality);
  }

  destroy(): void {
    this.layerCache.destroy();
    this.canvas.remove();
  }

  drawGroup(group: Group): void {
    group.sortChildren();
    if (
      this.layerCacheEnabled &&
      group.cacheAsBitmap &&
      !isSubtreeDirty(group) &&
      this.layerCache.isValid(group)
    ) {
      const entry = this.layerCache.get(group)!;
      this.ctx.drawImage(entry.canvas, 0, 0);
      return;
    }

    if (this.layerCacheEnabled && group.cacheAsBitmap && !isSubtreeDirty(group)) {
      this.renderGroupToCache(group);
      const entry = this.layerCache.get(group);
      if (entry) {
        this.ctx.drawImage(entry.canvas, 0, 0);
        return;
      }
    }

    if (this.batchRendering) {
      this.drawGroupBatched(group);
      return;
    }

    for (const child of group.children) {
      if (!child.visible) continue;
      this.drawNode(child);
    }
  }

  private drawGroupBatched(group: Group): void {
    group.sortChildren();
    let batch: Rect[] = [];
    let batchKey = '';

    const flush = (): void => {
      if (batch.length === 0) return;
      if (batch.length > 1) this.drawRectBatch(batch);
      else this.drawNode(batch[0]);
      batch = [];
      batchKey = '';
    };

    for (const child of group.children) {
      if (!child.visible) continue;
      if (isBatchableRect(child)) {
        const key = paintStyleKey(child);
        if (batch.length > 0 && key !== batchKey) flush();
        batchKey = key;
        batch.push(child);
      } else {
        flush();
        this.drawNode(child);
      }
    }
    flush();
  }

  private drawRectBatch(rects: Rect[]): void {
    const ctx = this.ctx;
    const sample = rects[0];
    ctx.save();
    ctx.beginPath();
    for (const node of rects) {
      ctx.rect(node.x, node.y, node.width, node.height);
    }
    if (sample.fill) {
      this.setFill(ctx, sample.fill);
      ctx.fill();
      this.lastFillCallCount++;
    }
    ctx.restore();
    this.drawCallCount++;
  }

  private renderGroupToCache(group: Group): void {
    const b = group.getBounds();
    const w = Math.max(Math.ceil(b.width), 1);
    const h = Math.max(Math.ceil(b.height), 1);
    let entry = this.layerCache.get(group);
    if (!entry || entry.width < w || entry.height < h) {
      const canvas = document.createElement('canvas');
      canvas.width = w * this.pixelRatio;
      canvas.height = h * this.pixelRatio;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      entry = { canvas, ctx, width: w, height: h };
      this.layerCache.set(group, entry);
    }
    const { ctx } = entry;
    ctx.clearRect(0, 0, entry.width, entry.height);
    const prevCtx = this.ctx;
    this.ctx = ctx;
    try {
      if (this.batchRendering) this.drawGroupBatched(group);
      else {
        for (const child of group.children) {
          if (!child.visible) continue;
          this.drawNode(child);
        }
      }
    } finally {
      this.ctx = prevCtx;
    }
  }

  private drawNode(node: Node): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = node.opacity;
    ctx.translate(node.x, node.y);
    ctx.rotate(degToRad(node.rotation));
    ctx.scale(node.scaleX, node.scaleY);
    if (node.skewX || node.skewY) {
      ctx.transform(1, Math.tan(degToRad(node.skewY)), Math.tan(degToRad(node.skewX)), 1, 0, 0);
    }

    if (node.shadow) {
      ctx.shadowColor = node.shadow.color;
      ctx.shadowBlur = node.shadow.blur;
      ctx.shadowOffsetX = node.shadow.offsetX;
      ctx.shadowOffsetY = node.shadow.offsetY;
    }

    if (node.clip) {
      beginShapeClip(ctx, node);
    }

    if (node.mask) {
      ctx.save();
      beginShapeClip(ctx, node.mask);
    }

    node.draw(this);

    if (node.mask) {
      ctx.restore();
    }

    if ('children' in node) {
      this.drawGroup(node as Group);
    }

    if (this.focusedNodeId === node.id) {
      this.drawFocusRing(node);
    }

    ctx.restore();
  }

  private drawFocusRing(node: Node): void {
    const ctx = this.ctx;
    const b = node.getBounds();
    ctx.save();
    ctx.strokeStyle = this.highContrast ? '#ffff00' : '#2563eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    if (typeof ctx.strokeRect === 'function') {
      ctx.strokeRect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
    } else {
      ctx.beginPath();
      ctx.rect(b.x - 2, b.y - 2, b.width + 4, b.height + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  private resolveFill(fill: FillStyle): FillStyle {
    if (!this.highContrast || !fill || typeof fill !== 'string') return fill;
    return toHighContrastColor(fill, 'fill');
  }

  private resolveStroke(stroke: StrokeStyle): StrokeStyle {
    if (!this.highContrast || !stroke || typeof stroke !== 'string') return stroke;
    return toHighContrastColor(stroke, 'stroke');
  }

  drawRect(node: Rect): void {
    const ctx = this.ctx;
    const { width, height, cornerRadius } = node;
    ctx.beginPath();
    if (cornerRadius > 0) {
      this.roundRect(ctx, 0, 0, width, height, cornerRadius);
    } else {
      ctx.rect(0, 0, width, height);
    }
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }

  drawCircle(node: Circle): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(node.radius, node.radius, node.radius, 0, Math.PI * 2);
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }

  drawEllipse(node: Ellipse): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(node.radiusX, node.radiusY, node.radiusX, node.radiusY, 0, 0, Math.PI * 2);
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }

  drawLine(node: Line): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(node.x2, node.y2);
    this.applyStroke(ctx, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    ctx.stroke();
    this.drawCallCount++;
  }

  drawArc(node: Arc): void {
    const ctx = this.ctx;
    traceArcSector(
      ctx,
      node.radius,
      node.radius,
      node.radius,
      node.startAngle,
      node.endAngle,
      node.innerRadius,
      node.counterClockwise
    );
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }

  drawPolygon(node: Polygon): void {
    const ctx = this.ctx;
    const pts = node.points;
    if (pts.length < 4) return;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(pts[i], pts[i + 1]);
    }
    ctx.closePath();
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }

  drawPolyline(node: Polyline): void {
    const ctx = this.ctx;
    const pts = node.points;
    if (pts.length < 4) return;
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(pts[i], pts[i + 1]);
    }
    this.applyStroke(ctx, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    ctx.stroke();
    this.drawCallCount++;
  }

  drawPath(node: Path): void {
    const ctx = this.ctx;
    const path = new Path2D(node.d);
    if (node.fill) {
      this.setFill(ctx, node.fill);
      ctx.fill(path);
      this.lastFillCallCount++;
    }
    if (node.stroke) {
      this.applyStroke(ctx, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
      ctx.stroke(path);
    }
    this.drawCallCount++;
  }

  drawStar(node: Star): void {
    const ctx = this.ctx;
    const { numPoints, innerRadius, outerRadius } = node;
    const cx = outerRadius;
    const cy = outerRadius;
    ctx.beginPath();
    for (let i = 0; i < numPoints * 2; i++) {
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / numPoints - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    this.fillAndStroke(ctx, node.fill, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
    this.drawCallCount++;
  }

  drawText(node: TextNode): void {
    const ctx = this.ctx;
    ctx.font = `${node.fontWeight} ${node.fontSize}px ${node.fontFamily}`;
    ctx.textAlign = node.textAlign;
    ctx.textBaseline = 'top';
    if (node.fill) {
      this.setFill(ctx, node.fill);
      ctx.fillText(node.text, 0, 0);
      this.lastFillCallCount++;
    }
    if (node.stroke) {
      this.applyStroke(ctx, node.stroke, node.strokeWidth, node.dash, node.dashOffset, node.lineCap, node.lineJoin);
      ctx.strokeText(node.text, 0, 0);
    }
    this.drawCallCount++;
  }

  drawImage(node: ImageNode): void {
    if (!node.image) return;
    const ctx = this.ctx;
    ctx.drawImage(node.image, 0, 0, node.width, node.height);
    this.drawCallCount++;
  }

  drawSprite(node: Sprite): void {
    if (!node.image) return;
    const ctx = this.ctx;
    const col = node.currentFrame;
    ctx.drawImage(
      node.image,
      col * node.frameWidth,
      0,
      node.frameWidth,
      node.frameHeight,
      0,
      0,
      node.width,
      node.height
    );
    this.drawCallCount++;
  }

  getLastDrawCallCount(): number {
    return this.drawCallCount;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private fillAndStroke(
    ctx: CanvasRenderingContext2D,
    fill: FillStyle,
    stroke: StrokeStyle,
    strokeWidth: number,
    dash: number[],
    dashOffset: number,
    lineCap: CanvasLineCap,
    lineJoin: CanvasLineJoin
  ): void {
    const resolvedFill = this.resolveFill(fill);
    const resolvedStroke = this.resolveStroke(stroke);
    if (resolvedFill) {
      this.setFill(ctx, resolvedFill);
      ctx.fill();
      this.lastFillCallCount++;
    }
    if (resolvedStroke) {
      this.applyStroke(ctx, resolvedStroke, strokeWidth, dash, dashOffset, lineCap, lineJoin);
      ctx.stroke();
    }
  }

  private setFill(ctx: CanvasRenderingContext2D, fill: FillStyle): void {
    setCanvasFill(ctx, fill, this.patternCache);
  }

  private applyStroke(
    ctx: CanvasRenderingContext2D,
    stroke: StrokeStyle,
    strokeWidth: number,
    dash: number[],
    dashOffset: number,
    lineCap: CanvasLineCap,
    lineJoin: CanvasLineJoin
  ): void {
    if (!stroke) return;
    setCanvasStroke(ctx, stroke);
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = lineCap;
    ctx.lineJoin = lineJoin;
    if (dash.length > 0) ctx.setLineDash(dash);
    ctx.lineDashOffset = dashOffset;
  }
}
