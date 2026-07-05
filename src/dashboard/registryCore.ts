import type { App } from '../App';
import type { Node } from '../Node';

type DashboardFactory = (props: Record<string, unknown>, app: App) => Node;

const registry: Record<string, DashboardFactory> = {};

export function registerDashboard(type: string, factory: DashboardFactory): void {
  registry[type] = factory;
}

export function createDashboardFromJSON(
  type: string,
  props: Record<string, unknown>,
  app: App
): Node | null {
  const factory = registry[type];
  return factory ? factory(props, app) : null;
}

export { registry };
