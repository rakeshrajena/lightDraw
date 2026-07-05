import { App } from '../src/App';
import type { AppOptions } from '../src/types';
import { forceGc, heapUsed } from './setup';

export type RendererName = 'canvas' | 'svg' | 'html';

export interface TestAppOptions extends AppOptions {
  renderer?: RendererName;
}

/** Create a detached container sized for tests. */
export function createTestContainer(width = 800, height = 600): HTMLDivElement {
  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  document.body.appendChild(container);
  return container;
}

/** Create an App wired for tests (html by default in jsdom). */
export function createTestApp(
  container: HTMLElement,
  options: TestAppOptions = {}
): App {
  return new App(container, {
    width: 800,
    height: 600,
    autoResize: false,
    renderer: options.renderer ?? 'html',
    ...options,
  });
}

/** Populate stage with grid of rects for perf/memory scenarios. */
export function populateRects(app: App, count: number): void {
  const cols = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    app.add(
      app.rect({
        x: col * 12,
        y: row * 12,
        width: 10,
        height: 10,
        fill: '#2563eb',
      })
    );
  }
}

/** Standard smoke scene: rect, circle, text. */
export function addSmokeScene(app: App): void {
  app.add(
    app.rect({ x: 10, y: 10, width: 80, height: 40, fill: '#3b82f6' }),
    app.circle({ x: 120, y: 30, radius: 25, fill: '#ef4444' }),
    app.text({ x: 10, y: 70, text: 'LightDraw', fontSize: 16, fill: '#111' })
  );
}

/** Measure async fn duration in ms. */
export async function measureMs(fn: () => void | Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

/** Average duration over N iterations. */
export function measureAverageMs(fn: () => void, iterations: number): number {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  return (performance.now() - start) / iterations;
}

/** Assert heap growth stayed within tolerance (optional helper). */
export function expectHeapGrowth(growth: number, maxBytes: number): void {
  if (growth > maxBytes) {
    throw new Error(
      `Heap growth ${(growth / 1024 / 1024).toFixed(2)} MB exceeds max ${(maxBytes / 1024 / 1024).toFixed(2)} MB`
    );
  }
}

export { forceGc, heapUsed };

/** Interactive native control for a component node (unwraps field wrappers). */
export function getNativeControl<T extends HTMLElement = HTMLElement>(nodeId: string): T | null {
  const root = document.getElementById(nodeId);
  if (!root) return null;
  if (root.matches('input, textarea, button, select')) return root as T;
  return root.querySelector('input, textarea, button') as T | null;
}
