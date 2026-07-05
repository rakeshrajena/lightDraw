import type { App } from '../App';
import type { Node } from '../Node';

type AutomotiveFactory = (props: Record<string, unknown>, app: App) => Node;

const registry: Record<string, AutomotiveFactory> = {};

export function registerAutomotive(type: string, factory: AutomotiveFactory): void {
  registry[type] = factory;
}

export function createAutomotiveFromJSON(
  type: string,
  props: Record<string, unknown>,
  app: App
): Node | null {
  const factory = registry[type];
  return factory ? factory(props, app) : null;
}

export { registry };
