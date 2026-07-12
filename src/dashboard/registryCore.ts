import type { App } from '../App';
import type { Node } from '../Node';
import type { Group } from '../shapes/Group';
import { installRegistryChartRebuild, type ChartFactory } from './charts/core/refresh';
import { syncActiveDashboardTheme, runWithDashboardTheme, dashboardPackFromApp } from './theme';
import { resolveEffectiveUiTokens } from '../components/nodeTheme';

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
  if (!factory) return null;
  const theme = syncActiveDashboardTheme(
    resolveEffectiveUiTokens(app, props),
    app,
    dashboardPackFromApp(app)
  );
  return runWithDashboardTheme(theme, () => {
    const node = factory(props, app);
    if (node && 'children' in node && node.metadata?.widgetType && !node.metadata.chartRebuild) {
      installRegistryChartRebuild(node as Group, app, factory as ChartFactory);
    }
    return node;
  });
}

export { registry };
