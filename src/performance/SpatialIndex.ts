import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { collectHitTargets, getWorldBounds } from './bounds';

export class SpatialIndex {
  private cellSize: number;
  private grid = new Map<string, Node[]>();
  private entries: Node[] = [];
  private stale = true;

  constructor(cellSize = 64) {
    this.cellSize = cellSize;
  }

  markStale(): void {
    this.stale = true;
  }

  rebuild(root: Group): void {
    this.grid.clear();
    this.entries = collectHitTargets(root, []);
    for (const node of this.entries) {
      this.insert(node);
    }
    this.stale = false;
  }

  ensureFresh(root: Group): void {
    if (this.stale) this.rebuild(root);
  }

  private insert(node: Node): void {
    const b = getWorldBounds(node, 0);
    for (const key of this.cellsForBounds(b)) {
      const bucket = this.grid.get(key);
      if (bucket) bucket.push(node);
      else this.grid.set(key, [node]);
    }
  }

  private cellsForBounds(b: { x: number; y: number; width: number; height: number }): string[] {
    const cs = this.cellSize;
    const x0 = Math.floor(b.x / cs);
    const y0 = Math.floor(b.y / cs);
    const x1 = Math.floor((b.x + b.width) / cs);
    const y1 = Math.floor((b.y + b.height) / cs);
    const keys: string[] = [];
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        keys.push(`${x},${y}`);
      }
    }
    return keys;
  }

  /** Candidates at a world point (deduped, high z-index first). */
  queryPoint(x: number, y: number): Node[] {
    const key = `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    const bucket = this.grid.get(key);
    if (!bucket) return [];
    const seen = new Set<string>();
    const out: Node[] = [];
    for (let i = bucket.length - 1; i >= 0; i--) {
      const node = bucket[i];
      if (seen.has(node.id)) continue;
      seen.add(node.id);
      out.push(node);
    }
    out.sort((a, b) => b.zIndex - a.zIndex);
    return out;
  }

  get size(): number {
    return this.entries.length;
  }

  clear(): void {
    this.grid.clear();
    this.entries = [];
    this.stale = true;
  }
}
