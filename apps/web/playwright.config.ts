import { defineConfig } from '@playwright/test';
import { E2E_CSRF_SECRET, E2E_SESSION_SECRET } from './e2e/helpers/session';

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ||
  'postgresql://albas:albas_dev@localhost:55432/comunidadalbas_e2e';

// Network guardrail: reject Neon / remote hosts during E2E
const forbidden = ['neon.tech', 'aws.neon.tech', 'pooler'];
const lowerUrl = E2E_DATABASE_URL.toLowerCase();
for (const pattern of forbidden) {
  if (lowerUrl.includes(pattern)) {
    throw new Error(
      `E2E_DATABASE_URL must be local. Rejected pattern "${pattern}" in: ${E2E_DATABASE_URL}`
    );
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 90_000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    navigationTimeout: 60_000,
    actionTimeout: 30_000,
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: '../..',
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      PRISMA_ADAPTER: 'pg',
      SESSION_SECRET: E2E_SESSION_SECRET,
      CSRF_SECRET: E2E_CSRF_SECRET,
      AUDIT_DISABLED: 'true',
    },
  },
});
