import { registerAutomotive } from '../registryCore';
import { ALL_CATALOG_WIDGETS } from '../catalog';
import {
  buildBadgeWidget,
  buildBarWidget,
  buildDialWidget,
  buildInfoPanel,
  buildLampWidget,
  buildNumericWidget,
} from '../primitives/builders';
import { num, str } from '../helpers';

const registered = new Set<string>();

function registerCatalogWidget(def: (typeof ALL_CATALOG_WIDGETS)[number]): void {
  if (registered.has(def.type)) return;
  registered.add(def.type);

  switch (def.kind) {
    case 'dial':
      registerAutomotive(def.type, (props, app) =>
        buildDialWidget(app, def.type, def.type, props, {
          max: num(props, 'max', def.max ?? 100),
          format: def.format ?? 'int',
          unit: def.unit,
          tickCount: def.tickCount,
          redlineFrom: def.redlineFrom,
        })
      );
      break;
    case 'bar':
      registerAutomotive(def.type, (props, app) =>
        buildBarWidget(app, def.type, def.type, props, {
          label: def.label,
          unit: def.unit,
          warnBelow: def.warnBelow,
        })
      );
      break;
    case 'numeric':
      registerAutomotive(def.type, (props, app) =>
        buildNumericWidget(app, def.type, def.type, props, {
          title: def.title,
          unit: def.unit,
          decimals: def.decimals,
        })
      );
      break;
    case 'lamp':
      registerAutomotive(def.type, (props, app) =>
        buildLampWidget(app, def.type, def.type, props, def.symbol)
      );
      break;
    case 'badge':
      registerAutomotive(def.type, (props, app) => {
        const title = str(props, 'title', def.title);
        if (def.type === 'cruiseControl' || def.type === 'cruiseControlStatus') {
          return buildCruiseBadge(app, def.type, props);
        }
        return buildBadgeWidget(app, def.type, def.type, props, title);
      });
      break;
    case 'panel':
      registerAutomotive(def.type, (props, app) =>
        buildInfoPanel(app, def.type, def.type, props, def.title, def.rows)
      );
      break;
  }
}

function buildCruiseBadge(
  app: import('../../App').App,
  type: string,
  props: Record<string, unknown>
) {
  const speed = num(props, 'speed', num(props, 'value', 0));
  return buildBadgeWidget(app, type, type, { ...props, status: speed > 0 ? `SET ${Math.round(speed)}` : 'OFF' }, 'Cruise');
}

export function registerCatalogWidgets(): void {
  for (const def of ALL_CATALOG_WIDGETS) {
    registerCatalogWidget(def);
  }
}

registerCatalogWidgets();
