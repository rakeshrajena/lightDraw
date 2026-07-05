# Export Pipeline (Phase 10)

Unified export via `app.export({ format, options })`.

## Formats

| Format | MIME | Notes |
|--------|------|-------|
| `png` | image/png | Hi-DPI via `pixelRatio` |
| `jpeg` | image/jpeg | `quality` 0–1 (default 0.92) |
| `svg` | image/svg+xml | Standalone XML document |
| `pdf` | application/pdf | JPEG-embedded pages, zero deps |
| `json` | application/json | Scene tree + optional `validate` |
| `html` | text/html | Self-contained page with embedded scene |

## API

```javascript
const result = app.export({
  format: 'png',
  pixelRatio: 2,
  quality: 0.92,
  region: someNode,       // or { x, y, width, height }
  background: '#ffffff',
  validate: true,         // json/html only
  pages: 10,              // pdf multi-page
});

// result: { format, data, mimeType, width?, height? }
```

### Legacy

```javascript
app.export('png');           // data URL string
exportScene(app, 'jpeg', { quality: 0.8 });
```

### Download helper

```javascript
import { downloadExport } from 'lightdraw/core';
downloadExport(result, 'scene.png');
```

## JSON validation

```javascript
import { validateSceneJSON } from 'lightdraw/core';

const { valid, errors } = validateSceneJSON(sceneJson);
```

## Performance targets

| Scenario | Target |
|----------|--------|
| 1920×1080 PNG | ≤ 200 ms |
| PDF 10 pages | ≤ 2 s |

## Round-trip

```javascript
const json = app.export({ format: 'json' }).data;
app.clear();
app.loadJSON(json);
```
