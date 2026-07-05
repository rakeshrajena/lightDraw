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

test.describe('Visual regression — golden scenes', () => {
  test('playground core section', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#demo-core canvas, #demo-core .lightdraw-html-root', {
      timeout: 10000,
    });
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
    await page.goto('/examples/demo-dashboard.html');
    await page.waitForSelector('#app .lightdraw-html-root', { timeout: 10000 });
    await page.waitForTimeout(300);
    await expect(page.locator('#app')).toHaveScreenshot('demo-dashboard.png', {
      animations: 'disabled',
    });
  });
});
