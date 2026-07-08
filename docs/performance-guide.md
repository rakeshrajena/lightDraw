# Performance Guide

Targets and best practices for 60 FPS dashboards, clusters, and large scenes.

## Global budgets

| Metric | Target |
|--------|--------|
| Render 1 000 nodes | ≤ 16 ms |
| Render 10 000 nodes | ≤ 100 ms |
| Hit test 1 000 nodes | ≤ 4 ms |
| Animation frame (500 tweens) | ≤ 8 ms |
| Core bundle (gzip) | ≤ 8 KB aspirational |

Run benchmarks locally:

```bash
npm run build
npm run benchmark
npm run benchmark:compare   # vs benchmarks/baseline.json
```

## Renderer choice

| Renderer | Best for |
|----------|----------|
| **Canvas** | Large scenes, games, dashboards (default) |
| **SVG** | Crisp vectors, accessibility, export |
| **HTML** | Legacy WebView, simple UI overlays |

```javascript
const app = LightDraw.createApp('#app', { renderer: 'canvas' });
```

## Scene graph tips

1. **Spatial index** — enabled automatically at ≥100 nodes (`App` options `performance.spatialIndex`).
2. **Dirty regions** — canvas partial redraw when few nodes move (`performance.dirtyRegions`).
3. **Batch rendering** — same-fill rects batched on canvas (`performance.batchRendering`).
4. **Layer cache** — set `cacheAsBitmap: true` on static `Group` subtrees.
5. **Avoid** listening on decorative nodes (`listening: false`).

```javascript
const app = LightDraw.createApp('#app', {
  performance: {
    spatialIndex: true,
    spatialIndexThreshold: 100,
    dirtyRegions: true,
    batchRendering: true,
    layerCache: true,
  },
});
```

## Memory

```bash
npm run test:memory
```

- Destroy `App` when unmounting SPAs.
- Call `animation.stop()` before removing animated nodes.
- Do not retain references to destroyed nodes.

## Profiling workflow

1. `npm run benchmark` — create, render, hitTest, animate splits.
2. `npm run test:perf` — CI regression vs baseline.
3. Reduce node count in hot paths; use groups + cache for static chrome.

## Module-specific notes

| Module | Tip |
|--------|-----|
| Dashboard | Limit chart points; use `animateLiveValue` not full rebuild |
| Automotive | One `applyDriveState` per frame on cluster root |
| Diagram | Pre-layout with seeded `forceDirectedLayout`; avoid re-layout every frame |
| Export | Raster export uses offscreen canvas — not for real-time loops |
