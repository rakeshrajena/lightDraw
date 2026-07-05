/**
 * Register renderers and JSON resolvers for the full test suite.
 * Core-only tests should import `src/core/index` directly and skip this file.
 */
import { registerRenderer } from '../src/registry/renderers';
import { registerJSONResolver } from '../src/registry/jsonResolvers';
import { SVGRenderer } from '../src/renderers/SVGRenderer';
import { HTMLRenderer } from '../src/renderers/HTMLRenderer';
import { createComponentFromJSON } from '../src/components/registry';
import { createDashboardFromJSON } from '../src/dashboard/registry';
import { createAutomotiveFromJSON } from '../src/automotive/registry';
import { createDiagramFromJSON } from '../src/diagram/registry';

import '../src/components/registry';
import '../src/dashboard/registry';
import '../src/automotive/registry';
import '../src/diagram/registry';

registerRenderer('svg', () => new SVGRenderer());
registerRenderer('html', () => new HTMLRenderer());

registerJSONResolver((type, props, app) => createComponentFromJSON(type, props, app));
registerJSONResolver((type, props, app) => createDashboardFromJSON(type, props, app));
registerJSONResolver((type, props, app) => createAutomotiveFromJSON(type, props, app));
registerJSONResolver((type, props, app) => createDiagramFromJSON(type, props, app));
