import { test, expect } from '@playwright/test';

const FIXED_TIME = new Date('2026-07-05T12:00:00Z').getTime();

async function freezeClock(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript((fixed: number) => {
    const RealDate = Date;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).Date = class extends RealDate {
      constructor(...args: [] | [string | number | Date] | [number, number, number, number, number, number, number]) {
        if (args.length === 0) super(fixed);
        else super(...(args as ConstructorParameters<typeof RealDate>));
      }
      static now() {
        return fixed;
      }
    };
  }, FIXED_TIME);
}

async function waitForStableCanvas(
  page: import('@playwright/test').Page,
  selector = '#app canvas'
): Promise<void> {
  await page.waitForSelector(selector, { timeout: 15000 });
  let lastHeight = 0;
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(150);
    const height = await page.locator('#app').evaluate((el) => el.getBoundingClientRect().height);
    if (height > 0 && Math.abs(height - lastHeight) < 1) return;
    lastHeight = height;
  }
}

test.describe('Visual regression — golden scenes', () => {
  test('playground core section', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#demo-core canvas', {
      timeout: 10000,
    });
    await page.evaluate(() => {
      window.requestAnimationFrame = () => 0;
    });
    await page.waitForTimeout(150);
    await expect(page.locator('#demo-core')).toHaveScreenshot('playground-core.png', {
      animations: 'disabled',
    });
  });

  test('core demo example', async ({ page }) => {
    await page.goto('/examples/demo.html');
    await page.waitForSelector('#app canvas, #app .lightdraw-html-root', { timeout: 10000 });
    await expect(page.locator('#app')).toHaveScreenshot('demo-core.png', {
      animations: 'disabled',
    });
  });

  test('animation demo example', async ({ page }) => {
    await page.goto('/examples/demo-animation.html');
    await page.waitForSelector('#app canvas, #app .lightdraw-html-root', { timeout: 10000 });
    await expect(page.locator('#app')).toHaveScreenshot('demo-animation.png', {
      animations: 'disabled',
    });
  });

  test('dashboard demo example', async ({ page }) => {
    await freezeClock(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/examples/demo-dashboard.html');
    await waitForStableCanvas(page);
    await page.waitForTimeout(400);
    await expect(page.locator('#app')).toHaveScreenshot('demo-dashboard.png', {
      animations: 'disabled',
    });
  });

  test('ui demo example', async ({ page }) => {
    await page.goto('/examples/demo-ui.html');
    await page.waitForSelector('#app .lightdraw-html-root', { timeout: 15000 });
    await page.waitForTimeout(400);
    await expect(page.locator('#app')).toHaveScreenshot('demo-ui.png', {
      animations: 'disabled',
    });
  });

  test('diagram demo example', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/examples/demo-diagram.html');
    await page.waitForSelector('#app canvas', { timeout: 15000 });
    await page.evaluate(() => {
      const wrap = document.querySelector('.demo-canvas-wrap');
      if (wrap instanceof HTMLElement) {
        wrap.style.flex = 'none';
        wrap.style.height = '640px';
        wrap.style.minHeight = '640px';
      }
    });
    await page.waitForTimeout(600);
    await expect(page.locator('#app canvas')).toHaveScreenshot('demo-diagram.png', {
      animations: 'disabled',
    });
  });

  test('export demo example', async ({ page }) => {
    await page.goto('/examples/demo-export.html');
    await page.waitForSelector('#app canvas', { timeout: 10000 });
    await page.waitForTimeout(200);
    await expect(page.locator('#app')).toHaveScreenshot('demo-export.png', {
      animations: 'disabled',
    });
  });

  test('a11y demo example', async ({ page }) => {
    await page.goto('/examples/demo-a11y.html');
    await page.waitForSelector('#app .lightdraw-html-root', { timeout: 10000 });
    await page.waitForTimeout(200);
    await expect(page.locator('#app')).toHaveScreenshot('demo-a11y.png', {
      animations: 'disabled',
    });
  });
});
