# Plugin Guide

Extend LightDraw with custom components, renderers, and JSON types.

The plugin host is **required** for modular loading (`lightdraw/core` + selective modules). Built-in UI / dashboard / automotive / diagram packages are plugins installed via `LightDraw.use(...)`.

## Plugin shape

```javascript
import { createPluginContext } from 'lightdraw/core';

export const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(_LightDraw) {
    const ctx = createPluginContext();
    ctx.registerJSONType('myScene', (props, app) => {
      const g = app.group(props);
      g.add(app.text({ text: String(props.label ?? 'Hi'), x: 8, y: 8, fill: '#fff' }));
      return g;
    });
  },
};

LightDraw.use(myPlugin);
```

`LightDraw.use` installs each `plugin.name` **once** (safe to call again).

## Register a UI component

After the UI module is loaded (full bundle, or `LightDraw.use(uiPlugin)`):

```javascript
import { registerComponent } from 'lightdraw/ui';

registerComponent('badge', (props, app) => {
  const g = app.group(props);
  g.add(app.roundedRect({ width: 60, height: 24, cornerRadius: 12, fill: '#2563eb' }));
  g.add(app.text({ text: String(props.label ?? ''), x: 8, y: 5, fontSize: 12, fill: '#fff' }));
  return g;
});

app.loadJSON({ type: 'badge', props: { label: 'New', x: 10, y: 10 } });
```

The UI plugin also attaches `LightDraw.registerComponent` on the static object for script-tag users.

## Register a renderer

```javascript
import { registerRenderer } from 'lightdraw/core';
import { MyRenderer } from './MyRenderer';

registerRenderer('myrenderer', () => new MyRenderer());

const app = LightDraw.createApp('#app', { renderer: 'myrenderer' });
```

## JSON resolver chain

Plugins can resolve custom `type` values in `loadJSON`:

```javascript
import { registerJSONResolver } from 'lightdraw/core';

registerJSONResolver((type, props, app) => {
  if (type === 'myScene') return buildMyScene(props, app);
  return null;
});
```

## Dashboard / automotive / diagram

Same registry pattern after the matching plugin is installed:

```javascript
import { registerDashboard } from 'lightdraw/dashboard';
import { registerAutomotive } from 'lightdraw/automotive';
import { registerDiagram } from 'lightdraw/diagram';
```

## Plugin context

```javascript
import { createPluginContext } from 'lightdraw/core';

const ctx = createPluginContext();
ctx.registerJSONType('custom', factory);
ctx.registerJSONResolver((type, props, app) => null);
ctx.registerEasing('customEase', (t) => t);
```

## Modular bundles

```javascript
import { LightDraw } from 'lightdraw/core';
import { uiPlugin } from 'lightdraw/ui';
import { dashboardPlugin } from 'lightdraw/dashboard';

LightDraw.use(uiPlugin);
LightDraw.use(dashboardPlugin);
```

Full `import 'lightdraw'` (or CDN `lightdraw.min.js`) installs all built-in plugins automatically.

See [architecture.md](./architecture.md) for entry points and [README](../README.md) for the exports map.
