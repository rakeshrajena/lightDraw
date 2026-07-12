import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { getState } from './helpers';
import { resolveEffectiveUiTokens } from './nodeTheme';
import { runWithCanvasUiTheme, syncActiveCanvasUiTheme } from './resolveCanvasTheme';

export type UiFactory = (props: Record<string, unknown>, app: App) => Node;

/** Compound canvas widgets whose listeners live on children — safe to wipe+rebuild chrome. */
export const UI_REBUILD_TYPES = new Set([
  'tabs',
  'accordion',
  'table',
  'tree',
  'toolbar',
]);

/**
 * Attach rebuild so setUiTheme can recreate compound chrome without replacing the root node.
 * Child listeners are re-wired by the factory; root identity (and user root listeners) stay.
 */
export function installUiRebuild(group: Group, app: App, factory: UiFactory): void {
  const rebuild = () => {
    const props = { ...getState(group), x: group.x, y: group.y };
    const theme = syncActiveCanvasUiTheme(resolveEffectiveUiTokens(app, props), app);
    runWithCanvasUiTheme(theme, () => {
      for (const child of [...group.children]) {
        group.remove(child);
      }
      // Drop root listeners the factory will re-attach on a throwaway group;
      // child-level handlers move with transferred children.
      const fresh = factory(props, app) as Group;
      if (!fresh || !('children' in fresh)) return;
      for (const child of [...fresh.children]) {
        fresh.remove(child);
        group.add(child);
      }
      group.metadata._parts = fresh.metadata._parts;
      group.metadata.componentState = {
        ...getState(group),
        ...((fresh.metadata?.componentState as Record<string, unknown>) ?? {}),
      };
    });
    app.requestRender();
  };
  group.metadata.uiRebuild = rebuild;
}

export function runUiRebuild(node: Node): boolean {
  const rebuild = node.metadata?.uiRebuild as (() => void) | undefined;
  if (typeof rebuild !== 'function') return false;
  rebuild();
  return true;
}
