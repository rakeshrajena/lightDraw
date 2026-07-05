# Contributing to LightDraw.js

Thank you for your interest in contributing!

## Development Setup

1. Fork and clone the repository
2. Run `npm install`
3. Run `npm run build` to compile
4. Run `npm test` to verify changes
5. Run `npm run dev` for watch mode during development

## Code Standards

- TypeScript with strict mode
- Follow existing patterns and naming conventions
- Keep the core bundle lightweight (target: under 20 KB minified)
- Add tests for new features
- Update documentation and CHANGELOG

## Pull Request Process

1. Create a feature branch from `main`
2. Ensure all tests pass and lint is clean
3. Update CHANGELOG.md under `[Unreleased]`
4. Submit PR with clear description and test plan

## Plugin Development

```javascript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install(LightDraw) {
    LightDraw.registerComponent('myWidget', (props, app) => {
      return app.group(props);
    });
  }
};

LightDraw.use(myPlugin);
```

## Reporting Issues

Include browser version, reproduction steps, and expected vs actual behavior.
