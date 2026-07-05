import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import type { FillStyle, StrokeStyle, Gradient } from '../types';

export interface RenderContext {
  width: number;
  height: number;
  pixelRatio: number;
  background: string;
  focusedNodeId?: string | null;
  highContrast?: boolean;
}

export abstract class Renderer {
  protected width = 0;
  protected height = 0;
  protected pixelRatio = 1;
  protected background = 'transparent';
  protected focusedNodeId: string | null = null;
  protected highContrast = false;
  protected dirtyRegions: Array<{ x: number; y: number; width: number; height: number }> = [];
  protected fullRedraw = true;
  protected hasRendered = false;

  abstract init(container: HTMLElement, options: RenderContext): void;
  abstract resize(width: number, height: number, pixelRatio: number): void;
  abstract render(root: Group, cameraMatrix?: import('../utils').Matrix2D): void;
  abstract destroy(): void;
  abstract toDataURL(type?: string, quality?: number): string;
  abstract getElement(): HTMLElement | SVGSVGElement | HTMLCanvasElement;

  markDirty(x = 0, y = 0, w?: number, h?: number): void {
    this.dirtyRegions.push({
      x,
      y,
      width: w ?? this.width,
      height: h ?? this.height,
    });
    this.fullRedraw = this.dirtyRegions.length > 10;
  }

  clearDirty(): void {
    this.dirtyRegions = [];
    this.fullRedraw = false;
    this.hasRendered = true;
  }

  forceFullRedraw(): void {
    this.fullRedraw = true;
    this.dirtyRegions = [];
  }

  setRenderState(state: { focusedNodeId?: string | null; highContrast?: boolean }): void {
    if (state.focusedNodeId !== undefined) this.focusedNodeId = state.focusedNodeId;
    if (state.highContrast !== undefined) this.highContrast = state.highContrast;
  }

  get needsFullRedraw(): boolean {
    return this.fullRedraw || !this.hasRendered;
  }

  protected applyFillStyle(
    _ctx: CanvasRenderingContext2D | SVGElement,
    fill: FillStyle,
    setFill: (value: string | CanvasGradient | CanvasPattern) => void
  ): void {
    if (!fill) return;
    if (typeof fill === 'string') {
      setFill(fill);
    } else if ((fill as Gradient).type === 'linear' || (fill as Gradient).type === 'radial') {
      const g = fill as Gradient;
      /* Gradient applied by concrete renderers */
      void g;
    }
  }

  protected applyStrokeStyle(
    _ctx: CanvasRenderingContext2D,
    stroke: StrokeStyle,
    setStroke: (value: string | CanvasGradient | CanvasPattern) => void
  ): void {
    if (!stroke) return;
    if (typeof stroke === 'string') {
      setStroke(stroke);
    }
  }

  protected applyShadow(ctx: CanvasRenderingContext2D, shadow: import('../types').Shadow | null): void {
    if (shadow) {
      ctx.shadowColor = shadow.color;
      ctx.shadowBlur = shadow.blur;
      ctx.shadowOffsetX = shadow.offsetX;
      ctx.shadowOffsetY = shadow.offsetY;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
  }

  /** Traverse and draw scene graph */
  protected traverse(node: Node, drawFn: (node: Node) => void): void {
    if (!node.visible) return;
    drawFn(node);
    if ('children' in node) {
      const group = node as Group;
      group.sortChildren?.();
      for (const child of group.children) {
        this.traverse(child, drawFn);
      }
    }
  }
}
