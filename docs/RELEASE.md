# Release Workflow

Step-by-step process for shipping LightDraw.js to GitHub and npm.

## Prerequisites

- CI green on `main`
- Manual verification complete (playground, examples, export)
- `NPM_TOKEN` stored in GitHub repository **Secrets** (never in git)

## Order of operations

### 1. Prepare version

```bash
# Update version in package.json and src/core/index.ts (VERSION constant)
npm run build
npm test
```

Update `CHANGELOG.md` — move `[Unreleased]` entries under `[X.Y.Z] - YYYY-MM-DD`.
Write / refresh `docs/vX.Y-release-notes.md` and point `.github/workflows/release.yml` `body_path` at it.

### 2. GitHub Release

```bash
git tag v1.2.1
git push origin v1.2.0
```

The `.github/workflows/release.yml` workflow will:

- Run full test suite
- Build all bundles
- Create a GitHub Release with `dist/` artifacts attached
- Publish to npm **only if** `NPM_TOKEN` secret is configured

### 3. npm publish (manual alternative)

If not using automated publish:

```bash
npm login   # or export NPM_TOKEN=...
npm publish --access public
```

### 4. CDN

After npm publish, CDNs update automatically:

| CDN | URL |
|-----|-----|
| jsDelivr | `https://cdn.jsdelivr.net/npm/lightdraw@VERSION/dist/lightdraw.min.js` |
| unpkg | `https://unpkg.com/lightdraw@VERSION/dist/lightdraw.min.js` |

Use `@latest` only after verifying the release.

### 5. Post-release

- Update README CDN examples if needed
- Announce on blog / LinkedIn
- Close milestone in GitHub

## Rollback

- **npm:** `npm unpublish lightdraw@VERSION` (within 72 h) or publish a PATCH fix
- **GitHub:** Mark release as pre-release; do not delete tags that others may have pinned

## Owner

**Rakesh Ranjan Jena** — [rakeshranjanjena.com](https://rakeshranjanjena.com)
