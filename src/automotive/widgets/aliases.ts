import { registerAutomotive, registry } from '../registryCore';
import { WIDGET_ALIASES } from '../catalog';

for (const [alias, canonical] of Object.entries(WIDGET_ALIASES)) {
  if (registry[alias]) continue;
  const factory = registry[canonical];
  if (!factory) continue;
  registerAutomotive(alias, (props, app) => factory(props, app));
}
