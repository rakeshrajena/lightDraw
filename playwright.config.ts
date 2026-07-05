import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;
const skipWebServer = !!process.env.PW_NO_WEBSERVER;
const previewCmd =
  'npx vite preview --config website/vite.config.ts --port 4173 --strictPort --host 127.0.0.1';

export default defineConfig({
  testDir: './test/visual',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  ...(skipWebServer
    ? {}
    : {
        webServer: {
          command: isCI ? previewCmd : `npm run build:website && ${previewCmd}`,
          url: 'http://127.0.0.1:4173',
          reuseExistingServer: isCI,
          timeout: 120000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      }),
  projects: [
    {
      name: 'chromium',
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: /cross-browser\.spec\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testMatch: /cross-browser\.spec\.ts/,
      use: { ...devices['Desktop Safari'] },
    },
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
    },
  },
});
