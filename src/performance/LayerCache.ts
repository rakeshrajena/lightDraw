import type { Group } from '../shapes/Group';
import { isSubtreeDirty } from './bounds';

export interface CacheEntry {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/** Offscreen bitmap cache for static subtrees. */
export class LayerCache {
  private entries = new Map<string, CacheEntry>();

  get(group: Group): CacheEntry | undefined {
    return this.entries.get(group.id);
  }

  set(group: Group, entry: CacheEntry): void {
    this.entries.set(group.id, entry);
  }

  invalidate(nodeId: string): void {
    this.entries.delete(nodeId);
  }

  invalidateSubtree(group: Group): void {
    this.entries.delete(group.id);
    for (const child of group.children) {
      if ('children' in child) this.invalidateSubtree(child as Group);
    }
  }

  isValid(group: Group): boolean {
    const entry = this.entries.get(group.id);
    if (!entry) return false;
    if (isSubtreeDirty(group)) return false;
    const b = group.getBounds();
    return entry.width >= b.width && entry.height >= b.height;
  }

  clear(): void {
    this.entries.clear();
  }

  destroy(): void {
    this.clear();
  }
}
