import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

const LEGACY_BUNDLES = [
  'lightdraw.legacy.js',
  'lightdraw.core.legacy.js',
  'lightdraw.html.legacy.js',
];

describe('Phase 12 — Legacy ES5 bundles', () => {
  for (const file of LEGACY_BUNDLES) {
    it(`${file} exists and is valid ES5 UMD`, () => {
      const path = `dist/${file}`;
      expect(existsSync(path)).toBe(true);
      const code = readFileSync(path, 'utf8');
      expect(code.length).toBeGreaterThan(1000);
      expect(code).toMatch(/LightDraw|function/);
      expect(code).not.toMatch(/\bconst\s+\w+\s*=/);
      expect(code).not.toMatch(/\blet\s+\w+/);
    });
  }

  it('legacy full bundle exposes LightDraw global', () => {
    const code = readFileSync('dist/lightdraw.legacy.js', 'utf8');
    const sandbox: Record<string, unknown> = {
      window: {} as Record<string, unknown>,
      document: {
        createElement: () => ({
          style: {},
          getContext: () => null,
          appendChild: () => undefined,
        }),
        querySelector: () => null,
        body: { appendChild: () => undefined },
      },
      console,
      performance: { now: () => 0 },
      requestAnimationFrame: (fn: () => void) => {
        fn();
        return 0;
      },
      cancelAnimationFrame: () => undefined,
    };
    (sandbox.window as Record<string, unknown>).document = sandbox.document;

    // eslint-disable-next-line no-new-func
    const LightDraw = new Function(
      'window',
      'document',
      'console',
      'performance',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      `${code}\nreturn typeof LightDraw !== 'undefined' ? LightDraw : window.LightDraw;`
    )(
      sandbox.window,
      sandbox.document,
      sandbox.console,
      sandbox.performance,
      sandbox.requestAnimationFrame,
      sandbox.cancelAnimationFrame
    ) as { createApp?: unknown };

    expect(typeof LightDraw?.createApp).toBe('function');
  });
});
