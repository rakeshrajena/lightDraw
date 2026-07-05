# Benchmark Baselines

Performance baselines for LightDraw.js regression detection.

## Files

| File | Purpose |
|------|---------|
| `baseline.json` | Committed reference metrics (Phase 0+) |

## Metrics per scenario

- **createMs** — Create app + add nodes + initial render
- **renderMs** — Average render time (10 iterations)
- **hitTestMs** — Average hit test time (50 iterations)
- **animateMs** — Single property animation scheduling time

## Scenarios

| Key | Node count |
|-----|------------|
| `nodes-500` | 500 |
| `nodes-1000` | 1000 |
| `nodes-5000` | 5000 |

## Commands

```bash
npm run benchmark          # Print current metrics
npm run benchmark:save     # Update baseline.json (after intentional improvement)
npm run benchmark:compare  # Fail if regression > 35% (or +0.5ms for sub-ms metrics)
npm run test:perf          # Vitest perf regression suite
```

## Updating baselines

Only run `benchmark:save` when:

1. Completing a performance optimization phase
2. Intentionally changing renderer behavior
3. CI baseline drift on new runner (document in CHANGELOG)

Never save baselines that reflect a regression.
