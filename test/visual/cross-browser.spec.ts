import { test, expect } from '@playwright/test';

/** Smoke tests without screenshots — run on Chromium, Firefox, and WebKit. */
test.describe('Cross-browser smoke', () => {
  test('playground loads and renders core section', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForSelector('#demo-core canvas, #demo-core .lightdraw-html-root', {
      timeout: 15000,
    });
    const host = page.locator('#demo-core');
    await expect(host).toBeVisible();
    test.info().annotations.push({ type: 'browser', description: browserName });
  });

  test('core demo example renders', async ({ page, browserName }) => {
    await page.goto('/examples/demo.html');
    await page.waitForSelector('#app canvas, #app .lightdraw-html-root', { timeout: 15000 });
    await expect(page.locator('#app')).toBeVisible();
    test.info().annotations.push({ type: 'browser', description: browserName });
  });
});
