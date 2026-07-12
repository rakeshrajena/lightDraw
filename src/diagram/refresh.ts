import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { getDiagramState } from './helpers';
import { syncActiveDiagramTheme, runWithDiagramTheme } from './theme';
import { resolveEffectiveUiTokens } from '../components/nodeTheme';

type DiagramFactory = (props: Record<string, unknown>, app: App) => Node;

/** Attach rebuild so theme changes can recreate diagram chrome without losing JSON state. */
export function installDiagramRebuild(group: Group, app: App, factory: DiagramFactory): void {
  const rebuild = () => {
    const props = { ...getDiagramState(group), x: group.x, y: group.y };
    const theme = syncActiveDiagramTheme(resolveEffectiveUiTokens(app, props), app);
    runWithDiagramTheme(theme, () => {
      for (const child of [...group.children]) {
        group.remove(child);
      }
      const fresh = factory(props, app) as Group;
      for (const child of [...fresh.children]) {
        fresh.remove(child);
        group.add(child);
      }
      group.metadata.diagramState = fresh.metadata.diagramState;
    });
    app.requestRender();
  };
  group.metadata.diagramRebuild = rebuild;
}

/** Rebuild every diagram root that exposes `diagramRebuild` (per-node uiTheme applied inside). */
export function refreshDiagram(root: Node, _app?: App | null): void {
  const walk = (n: Node) => {
    const rebuild = n.metadata?.diagramRebuild as (() => void) | undefined;
    if (typeof rebuild === 'function' && n.metadata?.diagramType) {
      rebuild();
    }
    if ('children' in n) {
      for (const child of (n as Group).children) walk(child);
    }
  };
  walk(root);
}
