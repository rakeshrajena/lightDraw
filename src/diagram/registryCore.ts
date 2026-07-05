import type { App } from '../App';
import type { Node } from '../Node';
import { createDiagramFromProps } from './definitions';

type DiagramFactory = (props: Record<string, unknown>, app: App) => Node;

const registry: Record<string, DiagramFactory> = {};

export function registerDiagram(type: string, factory: DiagramFactory): void {
  registry[type] = factory;
}

export function createDiagramFromJSON(
  type: string,
  props: Record<string, unknown>,
  app: App
): Node | null {
  const factory = registry[type];
  if (factory) return factory(props, app);
  return createDiagramFromProps(type, props, app);
}

export { registry };
