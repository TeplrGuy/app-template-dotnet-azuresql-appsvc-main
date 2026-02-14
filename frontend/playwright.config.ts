import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
const shouldUseLocalWebServer =
  !process.env.PLAYWRIGHT_BASE_URL ||
  baseURL.includes('localhost') ||
  baseURL.includes('127.0.0.1');

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: shouldUseLocalWebServer
    ? {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173',
        port: 5173,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
