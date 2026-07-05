import type { App } from '../App';
import type { Node } from '../Node';

export type JSONResolver = (
  type: string,
  props: Record<string, unknown>,
  app: App
) => Node | null;

const resolvers: JSONResolver[] = [];

export function registerJSONResolver(resolver: JSONResolver): void {
  resolvers.push(resolver);
}

export function resolveJSONType(
  type: string,
  props: Record<string, unknown>,
  app: App
): Node | null {
  for (const resolver of resolvers) {
    const node = resolver(type, props, app);
    if (node) return node;
  }
  return null;
}

/** Test hook — clear resolver chain. */
export function clearJSONResolvers(): void {
  resolvers.length = 0;
}
