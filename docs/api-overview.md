# API overview

Consumer-facing surface of LightDraw. For generated class/method pages run `npm run docs:api` (TypeDoc → `docs/api/`). Prop lists live in the [module schemas](./README.md#module-schemas-props--json-types).

## Create & render

| Function / member | Purpose |
|-------------------|---------|
| `LightDraw.createApp(el, options?)` | Create app bound to a DOM container |
| `new App(el, options?)` | Same as above (core export) |
| `app.render()` / `app.requestRender()` | Draw now / schedule draw |
| `app.resize(w?, h?)` | Resize viewport + renderer |
| `app.destroy()` | Tear down listeners and DOM |
| `app.getSize()` | Current width / height |
| `app.clear()` | Remove stage children |

**Common `AppOptions`:** `width`, `height`, `renderer` (`'canvas' \| 'html' \| 'svg' \| 'auto'`), `background`, `autoResize`, `pixelRatio`, `uiTheme`, `highContrast`, `performance`.

## Scene graph

| API | Purpose |
|-----|---------|
| `app.add(node)` / `app.stage` | Root group |
| `app.rect` / `circle` / `ellipse` / `line` / `arc` / `polygon` / `polyline` / `path` / `star` / `roundedRect` / `text` / `image` / `sprite` / `group` | Shape factories |
| `node.x`, `y`, `rotation`, `scaleX/Y`, `opacity`, `visible` | Transforms |
| `group.add` / `remove` / `children` | Hierarchy |

## JSON

| API | Purpose |
|-----|---------|
| `app.loadJSON(scene, options?)` | Build scene from JSON (applies `theme` if present) |
| `app.exportJSON()` | Serialize current scene |
| `fromJSON` / `toJSON` | Core helpers |
| `validateSceneJSON(scene)` | Schema check → `{ valid, errors }` |
| `parseAndValidateSceneJSON(text)` | Parse + validate with caret errors |
| `validateThemePack(pack)` | Theme JSON check |
| `listKnownSceneTypes()` | Registered type names |
| `formatValidationErrors` / `formatJsonParseError` | Human-readable errors |

## Animation

| API | Purpose |
|-----|---------|
| `node.animate(props)` | Tween node properties |
| `app.timeline()` / `Timeline` | Sequenced moves / fades / waits |
| `parallel(...)` | Run timelines together |
| `easings` / `getEasing` / `registerEasing` | Easing registry |

## Themes & a11y

| API | Purpose |
|-----|---------|
| `app.applyTheme(pack, opts?)` | Apply theme pack (UI + charts + diagram) |
| `app.setUiTheme(input, opts?)` | UI token / preset update |
| `app.setHighContrast(bool)` | High-contrast mode |
| `UI_PRESETS` / `resolveUiTheme` | Preset helpers |

## Export

| API | Purpose |
|-----|---------|
| `app.export(format, opts?)` | PNG, JPEG, SVG, PDF, HTML, JSON |
| `exportApp` / `exportScene` / `downloadExport` | Standalone helpers |

## Domain modules (full bundle or after `use`)

| Module | Highlights |
|--------|------------|
| **UI** | `registerComponent`, `createComponentFromJSON` — button, slider, dialog, tabs, … |
| **Dashboard** | `registerDashboard`, `updateChartProps`, `pushChartValue`, `setLiveValue`, chart resize observers |
| **Automotive** | `createAutomotiveFromJSON`, `applyDriveState`, `sampleDriveFrames`, `updateAutoWidgetProps`, `listAutomotiveWidgets` |
| **Diagram** | Builders, editor (drag / resize / rotate / bends), **wire flow** (`applyFlow` / `pauseFlow` / `paths`) |

### Diagram flow (short)

| API | Purpose |
|-----|---------|
| `Diagram.applyFlow(app, root, opts)` | Dashes / packets / highlight; `paths`, `playback`, `speed` |
| `Diagram.pauseFlow` / `resumeFlow` / `toggleFlowPause` / `replayFlow` | Playback control |
| `Diagram.stopFlow` / `isFlowPlaying` | Stop / query |

See [diagram-flow.md](./diagram-flow.md).

## Plugins

| API | Purpose |
|-----|---------|
| `LightDraw.use(plugin)` | Install plugin once |
| `createPluginContext()` | Register JSON types / resolvers / easings |
| `getInstalledPlugins()` | Names of installed plugins |

See [plugin-guide.md](./plugin-guide.md) and [architecture.md](./architecture.md).

## Camera & events

| API | Purpose |
|-----|---------|
| `app.camera` | Pan / zoom / `screenToWorld` |
| Pointer events on nodes | `listening`, hit-testing via scene graph |

## Version

`LightDraw.VERSION` / core `VERSION` — current package version string.
