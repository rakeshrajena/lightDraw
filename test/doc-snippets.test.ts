import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { createTestApp, createTestContainer } from './helpers';
import { getEasing } from '../src/animation/Easing';
import { validateSceneJSON } from '../src/io/schema';
import { Timeline } from '../src/animation/Timeline';

const root = resolve(__dirname, '..');

/** Runnable snippets mirrored from documentation guides */
describe('Doc snippets — animation guide', () => {
  it('property animation and easing', () => {
    const container = createTestContainer(600, 400);
    const app = createTestApp(container, { renderer: 'html' });
    const box = app.rect({ x: 50, y: 100, width: 60, height: 40, fill: '#2563eb' });
    app.add(box);
    box.animate({ x: 200, rotation: 90, duration: 100, easing: 'easeOutCubic' });
    expect(getEasing('easeOutBounce')(0.5)).toBeDefined();
    app.destroy();
  });

  it('timeline sequence', () => {
    const container = createTestContainer();
    const app = createTestApp(container);
    const car = app.rect({ width: 20, height: 10, fill: '#00f' });
    app.add(car);
    const tl = new Timeline();
    tl.move(car, { x: 100, duration: 50 }).rotate(car, 45, 50).fade(car, 0.5, 50).wait(10).play();
    app.destroy();
  });
});

describe('Doc snippets — AI integration', () => {
  it('validates and loads scene JSON', () => {
    const container = createTestContainer();
    const app = createTestApp(container, { renderer: 'html' });
    const scene = {
      type: 'group',
      children: [
        { type: 'rect', props: { x: 10, y: 10, width: 40, height: 30, fill: '#2563eb' } },
      ],
    };
    const { valid } = validateSceneJSON(scene);
    expect(valid).toBe(true);
    app.loadJSON(scene);
    expect(app.stage.children.length).toBeGreaterThan(0);
    app.destroy();
  });
});

describe('Doc snippets — plugin guide', () => {
  it('registerComponent pattern', async () => {
    const { registerComponent } = await import('../src/components/registryCore');
    const container = createTestContainer();
    const app = createTestApp(container);
    registerComponent('docBadge', (props, a) => {
      const g = a.group(props);
      g.add(a.text({ text: String(props.label ?? ''), x: 4, y: 4, fontSize: 10, fill: '#fff' }));
      return g;
    });
    const { createComponentFromJSON } = await import('../src/components/registryCore');
    const node = createComponentFromJSON('docBadge', { label: 'OK', x: 0, y: 0 }, app);
    expect(node).toBeTruthy();
    app.destroy();
  });
});

describe('Doc markdown files exist', () => {
  const guides = [
    'docs/README.md',
    'docs/getting-started.md',
    'docs/animation-guide.md',
    'docs/plugin-guide.md',
    'docs/performance-guide.md',
    'docs/legacy-browser-guide.md',
    'docs/ui-theme-guide.md',
    'docs/responsive-guide.md',
    'docs/legacy-ui-guide.md',
    'docs/automotive-examples.md',
    'docs/ai-integration-guide.md',
    'docs/export-pipeline.md',
  ];

  for (const file of guides) {
    it(`${file} is present and non-empty`, () => {
      const path = resolve(root, file);
      expect(existsSync(path)).toBe(true);
      expect(readFileSync(path, 'utf8').length).toBeGreaterThan(100);
    });
  }
});
