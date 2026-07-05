import { Node } from '../Node';
import type { NodeOptions } from '../types';

export class Group extends Node {
  children: Node[] = [];
  /** When true, subtree is cached to offscreen bitmap when static. */
  cacheAsBitmap = false;

  constructor(options: NodeOptions = {}) {
    super('group', options);
    if (options.cacheAsBitmap) this.cacheAsBitmap = true;
  }

  add(...nodes: Node[]): this {
    for (const node of nodes) {
      if (node.parent && 'remove' in node.parent) {
        (node.parent as Group).remove(node);
      }
      node.parent = this;
      this.children.push(node);
      this.sortChildren();
      node.markDirty();
    }
    this.markDirty();
    return this;
  }

  remove(node: Node): this {
    const idx = this.children.indexOf(node);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      node.parent = null;
      this.markDirty();
    }
    return this;
  }

  clear(): this {
    for (const child of this.children) {
      child.parent = null;
      child.destroy();
    }
    this.children = [];
    this.markDirty();
    return this;
  }

  getChildById(id: string): Node | undefined {
    for (const child of this.children) {
      if (child.id === id) return child;
      if (child instanceof Group) {
        const found = child.getChildById(id);
        if (found) return found;
      }
    }
    return undefined;
  }

  sortChildren(): void {
    this.children.sort((a, b) => a.zIndex - b.zIndex);
  }

  containsPoint(_localX: number, _localY: number): boolean {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i];
      if (!child.visible || !child.listening) continue;
      const wm = child.getWorldMatrix();
      const inv = wm.invert();
      if (!inv) continue;
      const local = inv.transformPoint(_localX + this.x, _localY + this.y);
      if (child.containsPoint(local.x - child.x, local.y - child.y)) return true;
    }
    return false;
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    if (this.children.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const child of this.children) {
      const b = child.getBounds();
      const wm = child.getWorldMatrix();
      const corners = [
        wm.transformPoint(b.x, b.y),
        wm.transformPoint(b.x + b.width, b.y),
        wm.transformPoint(b.x, b.y + b.height),
        wm.transformPoint(b.x + b.width, b.y + b.height),
      ];
      for (const c of corners) {
        minX = Math.min(minX, c.x);
        minY = Math.min(minY, c.y);
        maxX = Math.max(maxX, c.x);
        maxY = Math.max(maxY, c.y);
      }
    }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  draw(ctx: unknown): void {
    const renderer = ctx as { drawGroup: (g: Group) => void };
    renderer.drawGroup?.(this);
  }

  toJSON() {
    return {
      ...super.toJSON(),
      children: this.children.map((c) => c.toJSON()),
    };
  }
}

export class Layer extends Group {
  constructor(options: NodeOptions = {}) {
    super(options);
    this.type = 'layer';
  }
}
