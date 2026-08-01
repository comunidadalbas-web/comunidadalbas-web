import { defineConfig } from '@playwright/test';
import { E2E_CSRF_SECRET, E2E_SESSION_SECRET } from './e2e/helpers/session';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: '../..',
    env: {
      SESSION_SECRET: E2E_SESSION_SECRET,
      CSRF_SECRET: E2E_CSRF_SECRET,
    },
  },
});
