import { describe, it, expect, afterEach } from 'vitest';
import { readFileSync, existsSync } from 'fs';

const LEGACY_BUNDLES = [
  'lightdraw.legacy.js',
  'lightdraw.core.legacy.js',
  'lightdraw.html.legacy.js',
];

const UI_COMPONENT_TYPES = [
  'button',
  'slider',
  'checkbox',
  'toggle',
  'input',
  'textarea',
  'radio',
  'tooltip',
  'menu',
  'dialog',
  'tabs',
  'accordion',
  'table',
  'tree',
  'toolbar',
  'toast',
  'statusBar',
] as const;

type LegacyLightDraw = {
  createApp: (
    selector: string | HTMLElement,
    options?: { width?: number; height?: number; renderer?: string }
  ) => {
    add: (node: unknown) => void;
    render: () => void;
    destroy: () => void;
  };
  createComponentFromJSON?: (
    type: string,
    props: Record<string, unknown>,
    app: unknown
  ) => unknown;
};

function loadLegacyBundle(file = 'lightdraw.legacy.js'): LegacyLightDraw {
  const code = readFileSync(`dist/${file}`, 'utf8');
  const win = globalThis as Window & typeof globalThis;
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
    win,
    document,
    console,
    performance,
    (fn: FrameRequestCallback) => {
      fn(0);
      return 0;
    },
    () => undefined
  ) as LegacyLightDraw;
  return LightDraw;
}

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

  afterEach(() => {
    document.body.innerHTML = '';
  });

  for (const type of UI_COMPONENT_TYPES) {
    it(`legacy bundle renders ${type} via HTML renderer`, () => {
      const LightDraw = loadLegacyBundle();
      expect(typeof LightDraw.createComponentFromJSON).toBe('function');

      const container = document.createElement('div');
      container.id = `legacy-${type}`;
      document.body.appendChild(container);

      const app = LightDraw.createApp(container, {
        width: 400,
        height: 300,
        renderer: 'html',
      });
      const node = LightDraw.createComponentFromJSON!(type, { x: 8, y: 8 }, app);
      expect(node).toBeTruthy();
      app.add(node);
      expect(() => app.render()).not.toThrow();
      app.destroy();
    });
  }

  it('demo-common.css respects prefers-reduced-motion for demo buttons', () => {
    const css = readFileSync('examples/demo-common.css', 'utf8');
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.demo-btn[\s\S]*transition:\s*none/
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.cluster-status-dot\.is-active[\s\S]*animation:\s*none/
    );
  });
});
