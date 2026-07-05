import type { Renderer } from '../renderers/Renderer';
import type { RendererType } from '../types';

type RendererFactory = () => Renderer;

const factories = new Map<string, RendererFactory>();

export function registerRenderer(type: string, factory: RendererFactory): void {
  factories.set(type, factory);
}

export function createRenderer(type: RendererType): Renderer | null {
  const factory = factories.get(type);
  return factory ? factory() : null;
}

export function hasRenderer(type: string): boolean {
  return factories.has(type);
}

/** Test hook — reset renderer registry. */
export function clearRenderers(): void {
  factories.clear();
}
