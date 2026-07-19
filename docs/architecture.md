# Library architecture

How LightDraw is organized for consumers and contributors. For product overview see the [root README](../README.md); for how-to guides see [docs/README.md](./README.md).

## Package entry points

| Import | What you get |
|--------|----------------|
| `lightdraw` | Full bundle — core + SVG/HTML/UI/dashboard/automotive/diagram plugins installed |
| `lightdraw/core` | Scene graph, Canvas renderer, animation, JSON, export, **plugin host** |
| `lightdraw/ui` | UI components (`registerComponent`, …) |
| `lightdraw/dashboard` | Charts & gauges |
| `lightdraw/automotive` | Cluster & vehicle widgets |
| `lightdraw/diagram` | Flow / network / org + editor helpers |
| CDN `lightdraw.min.js` | Same as full bundle (UMD / IIFE) |
| `lightdraw.legacy.js` | ES5 full bundle — see [legacy-browser-guide.md](./legacy-browser-guide.md) |

Pay-for-what-you-load pattern:

```javascript
import { LightDraw } from 'lightdraw/core';
import { dashboardPlugin } from 'lightdraw/dashboard';
LightDraw.use(dashboardPlugin);
```

Full `import 'lightdraw'` already calls `use` for every built-in module.

## Source layout (`src/`)

```
src/
├── App.ts / Node.ts          # Runtime app + scene graph node
├── core/                     # Public core façade + EventEmitter
├── shapes/                   # Rect, Circle, Group, Text, …
├── renderers/                # Canvas (built-in); HTML/SVG via modules
├── animation/                # animate, Timeline, easing
├── camera/                   # Viewport / pan / zoom
├── events/                   # Pointer & keyboard
├── layout/                   # Layout helpers
├── io/                       # JSON load/save, schema, export
├── plugins/                  # Plugin install host (LightDraw.use)
├── registry/                 # Renderers + JSON resolvers
├── components/               # UI component definitions + theme tokens
├── dashboard/                # Chart / gauge widgets
├── automotive/               # Cluster, TPMS, drive sim
├── diagram/                  # Diagram types, catalogs, editor
├── modules/                  # Thin plugin wrappers (svg, html, ui, …)
├── theme/                    # Theme pack normalize / apply
├── primitives/               # Shared dials, bars, …
├── performance/              # Spatial index, dirty regions, layer cache
├── styles/                   # Fill/stroke helpers
└── utils/                    # Math, color, a11y, …
```

Public façades stay stable (`definitions.ts`, `*Icons.ts`, module `index.ts`). Large files are split under domain folders; see [diagram-pipeline-structure.md](./diagram-pipeline-structure.md) and the completed R1–R7 notes in [repo-modularity.md](./repo-modularity.md).

## Runtime flow

```
createApp(container, options)
  → pick renderer (canvas | html | svg | auto)
  → stage Group + Camera + EventManager
loadJSON(scene)
  → optional scene.theme → applyTheme
  → resolve type via registry (shapes | UI | dashboard | auto | diagram | plugins)
  → mount nodes under stage
requestRender() / animate / export
```

## Extension points (plugins)

The plugin system is **required** for modular builds (`lightdraw/core` + selective modules). It is not optional scaffolding.

| API | Role |
|-----|------|
| `LightDraw.use(plugin)` | Install once by `plugin.name` |
| `createPluginContext()` | Register JSON types, resolvers, custom easings |
| `registerComponent` / `registerDashboard` / `registerAutomotive` / `registerDiagram` | Domain factories |
| `registerRenderer` / `registerJSONResolver` | Custom output or scene types |

Details: [plugin-guide.md](./plugin-guide.md).

## Themes

- **How to use:** [ui-theme-guide.md](./ui-theme-guide.md)
- **Resolve order / packs:** [theme-architecture.md](./theme-architecture.md)

## Tests that guard structure

- Catalog / registration: `test/diagram/**`, `test/components/**`, `test/automotive/**`, …
- Docs presence: `test/phase11.test.ts`, `test/doc-snippets.test.ts`, `test/ui10-docs.test.ts`
- Core vs plugins: `test/phase5.test.ts`
