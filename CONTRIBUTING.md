# Contributing to LightDraw.js

Thank you for your interest in contributing!

## Development setup

1. Fork and clone the repository
2. Run `npm install`
3. Run `npm run build` to compile
4. Run `npm test` to verify changes
5. Run `npm run dev` for watch mode during development

### Website / playground

```bash
npm run build
npm run prepare:website   # fills website/public with bundles + examples (gitignored)
npm run dev:website       # Vite playground at http://localhost:5173
```

Do **not** commit generated `website/public/examples/`, `website/public/docs/`, or `website/public/lightdraw*` — they are produced by `prepare:website`. Source of truth:

- Library: `src/`
- Demos: `examples/`
- Guides: `docs/*.md`
- Hub chrome: `website/index.html`, `website/help.html`, `website/public/{main.js,site-theme.js,styles.css}`

## Code standards

- TypeScript with strict mode
- Follow existing patterns and naming conventions
- Keep the core bundle lightweight
- Add tests for new features
- Update documentation and CHANGELOG under `[Unreleased]`

## JSON / theme validation

When changing scene types or prop enums, update:

- `src/io/sceneCatalog.ts` — known types + enum catalogs (drives “expected one of / did you mean”)
- Module schema docs under `docs/*-schema.md`
- `test/io/json-validation.test.ts` where relevant

## Pull request process

1. Create a feature branch from `main`
2. Ensure all tests pass
3. Update CHANGELOG.md under `[Unreleased]`
4. Submit PR with clear description and test plan

## Plugin development

```javascript
const myPlugin = {
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

## Reporting issues

Include browser version, reproduction steps, and expected vs actual behavior.
