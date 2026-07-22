# Semantic Versioning Policy

LightDraw.js follows [Semantic Versioning 2.0.0](https://semver.org/).

## Version format

`MAJOR.MINOR.PATCH` (e.g. `1.0.0`)

| Bump | When |
|------|------|
| **MAJOR** | Breaking API changes (App, Node, JSON schema, plugin registration) |
| **MINOR** | New features, new widgets/diagram types, backward-compatible JSON types |
| **PATCH** | Bug fixes, performance improvements, documentation-only releases |

## Pre-1.0 history

Versions `0.1.0` through `0.9.0` were development releases. **v1.0.0** marks the first production-ready public API.

## Branching

| Branch | Purpose |
|--------|---------|
| `main` | Stable; tagged releases only after CI + manual verification |
| `develop` | Integration branch (optional) |
| `feature/*` | Feature work → PR into `main` |

## Tags

Release tags use the `v` prefix: `v1.0.0`, `v1.1.0`, `v1.2.0`.

GitHub Releases and npm publish **must use the same version string** (without `v` on npm).

## Deprecation

1. Mark API `@deprecated` in TypeScript + CHANGELOG under `[Unreleased]`.
2. Keep behavior for at least one **MINOR** release.
3. Remove in the next **MAJOR** with migration notes in `docs/v1-release-notes.md` (or successor).

## JSON schema compatibility

- Adding optional `props` fields → **MINOR**
- Renaming or removing `type` values → **MAJOR** (provide JSON migration guide)
- New diagram/dashboard/automotive widget types → **MINOR**
