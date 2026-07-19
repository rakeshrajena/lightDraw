/**
 * Shared UI factory helpers.
 */
import type { App } from '../../App';
import type { Group } from '../../shapes/Group';
import { bindApp } from '../helpers';
import { getActiveUi } from '../resolveCanvasTheme';

/** Live canvas UI palette (synced from app theme). */
export function UI() {
  return getActiveUi();
}

export function createGroup(
  app: App,
  type: string,
  props: Record<string, unknown>,
  extra: Record<string, unknown> = {}
): Group {
  const extraMeta = (extra.metadata as Record<string, unknown> | undefined) ?? {};
  const extraState =
    extraMeta.componentState && typeof extraMeta.componentState === 'object'
      ? (extraMeta.componentState as Record<string, unknown>)
      : {};
  const extraRest = { ...extra };
  delete extraRest.metadata;
  const group = app.group({
    ...(props as Record<string, unknown>),
    listening: true,
    ...extraRest,
    metadata: {
      componentType: type,
      ...extraMeta,
      // Keep props (including uiTheme) then factory-specific state
      componentState: { ...props, ...extraState },
    },
  }) as Group;
  bindApp(group, app);
  return group;
}

/** Shared canvas surface chrome — consistent radius, border, shadow across UI components */
export function canvasSurface(
  app: App,
  width: number,
  height: number,
  opts: { radius?: number; elevated?: boolean } = {}
) {
  return app.roundedRect({
    width,
    height,
    cornerRadius: opts.radius ?? UI().radius,
    fill: UI().surface,
    stroke: UI().border,
    strokeWidth: 1,
    shadow: opts.elevated ? UI().shadowLg : UI().shadowSm,
    listening: false,
  });
}
