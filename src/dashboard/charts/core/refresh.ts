import type { App } from '../../../App';
import type { Group } from '../../../shapes/Group';
import type { Node } from '../../../Node';
import { getState, setRefresh, setState } from '../../helpers';
import { syncActiveDashboardTheme, runWithDashboardTheme, dashboardPackFromApp } from '../../theme';
import { resolveEffectiveUiTokens } from '../../../components/nodeTheme';

export type ChartBuildFn = (group: Group, app: App, props: Record<string, unknown>) => void;
export type ChartFactory = (props: Record<string, unknown>, app: App) => Group;

/** Drop hover/zoom listeners before rebuild — prevents stacked handlers on resize/zoom. */
export function clearChartWidgetListeners(group: Group): void {
  group.off('mousemove');
  group.off('mouseleave');
  group.off('click');
  group.off('wheel');
}

/** Full rebuild — clears children and runs build (used for live/streaming data). */
export function installChartRebuild(group: Group, app: App, build: ChartBuildFn): void {
  let initialized = false;
  const rebuild = () => {
    clearChartWidgetListeners(group);
    const props = {
      ...getState(group),
      ...(initialized ? { _chartRebuild: true } : {}),
    };
    const theme = syncActiveDashboardTheme(
      resolveEffectiveUiTokens(app, props),
      app,
      dashboardPackFromApp(app)
    );
    runWithDashboardTheme(theme, () => {
      for (const child of [...group.children]) {
        group.remove(child);
      }
      build(group, app, props);
    });
    initialized = true;
    app.requestRender();
  };
  group.metadata.chartRebuild = rebuild;
  setRefresh(group, () => rebuild());
  rebuild();
}

/** Rebuild by re-invoking the registered chart factory (works for all chart types). */
export function installRegistryChartRebuild(
  group: Group,
  app: App,
  factory: ChartFactory
): void {
  let initialized = false;
  const rebuild = () => {
    clearChartWidgetListeners(group);
    const props = {
      ...getState(group),
      x: group.x,
      y: group.y,
      ...(initialized ? { _chartRebuild: true } : {}),
    };
    const theme = syncActiveDashboardTheme(
      resolveEffectiveUiTokens(app, props),
      app,
      dashboardPackFromApp(app)
    );
    runWithDashboardTheme(theme, () => {
      for (const child of [...group.children]) {
        group.remove(child);
      }
      const fresh = factory(props, app) as Group;
      for (const child of [...fresh.children]) {
        fresh.remove(child);
        group.add(child);
      }
      group.metadata._parts = fresh.metadata._parts;
      group.metadata.widgetState = fresh.metadata.widgetState;
      // Prefer the factory's value refresh (gauges/meters) over a full rebuild on setLiveValue.
      if (typeof fresh.metadata.refresh === 'function') {
        group.metadata.refresh = fresh.metadata.refresh;
      }
    });
    initialized = true;
    app.requestRender();
  };
  group.metadata.chartRebuild = rebuild;
  // Keep incremental refresh when the factory already registered one (needle/fill updates).
  // Charts that need rebuild-on-refresh use installChartRebuild instead.
  if (typeof group.metadata.refresh !== 'function') {
    setRefresh(group, () => rebuild());
  }
}

/** Patch widget state and rebuild chart layers. */
export function updateChartProps(group: Node, patch: Record<string, unknown>): void {
  setState(group, patch);
  const rebuild = group.metadata?.chartRebuild as (() => void) | undefined;
  rebuild?.();
}

/** Append a point to a numeric series and rebuild (streaming line/bar charts). */
export function pushChartValue(group: Node, value: number, maxPoints = 64): void {
  const state = getState(group);
  const data = Array.isArray(state.data) ? [...(state.data as number[])] : [];
  data.push(value);
  while (data.length > maxPoints) data.shift();
  const patch: Record<string, unknown> = { data };
  if (Array.isArray(state.series) && (state.series as unknown[]).length) {
    patch.series = (state.series as { name?: string; data: number[] }[]).map((s, i) =>
      i === 0 ? { ...s, data: [...data] } : { ...s, data: [...(s.data ?? [])] }
    );
  }
  updateChartProps(group, patch);
}

/** Replace OHLC bar array tail (streaming financial charts). */
export function pushChartOhlc(
  group: Node,
  bar: Record<string, unknown>,
  maxBars = 64
): void {
  const state = getState(group);
  const data = Array.isArray(state.data) ? [...(state.data as Record<string, unknown>[])] : [];
  data.push(bar);
  while (data.length > maxBars) data.shift();
  updateChartProps(group, { data });
}
