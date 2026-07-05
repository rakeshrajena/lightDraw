# Plugin Guide

Extend LightDraw with custom components, renderers, and JSON types.

## Plugin shape

```javascript
import type { Plugin } from 'lightdraw';

export const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(LightDraw) {
    LightDraw.registerComponent('myWidget', (props, app) => {
      return app.group(props);
    });
  },
};

LightDraw.use(myPlugin);
```

## Register a UI component

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

Follow the same registry pattern:

```javascript
import { registerDashboard } from 'lightdraw/dashboard';
import { registerAutomotive } from 'lightdraw/automotive';
import { registerDiagram } from 'lightdraw/diagram';
```

## Plugin context (advanced)

```javascript
import { createPluginContext } from 'lightdraw/core';

const ctx = createPluginContext();
ctx.registerJSONType('custom', factory);
ctx.registerEasing('customEase', (t) => t);
```

## Modular bundles

Ship plugins as separate entry points so consumers tree-shake unused code:

```javascript
import LightDraw from 'lightdraw/core';
import uiPlugin from 'lightdraw/ui';

LightDraw.use(uiPlugin);
```

See [README](../README.md) for the full exports map.
