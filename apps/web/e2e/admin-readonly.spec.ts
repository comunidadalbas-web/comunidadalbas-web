import { test, expect } from '@playwright/test';
import path from 'node:path';
import { buildAdminCookies } from './helpers/session';

const evidenceDir = path.resolve(__dirname, '../../../docs/progress/codex/screenshots');
const routes = [
  '/admin',
  '/admin/solicitudes',
  '/admin/comunicados',
  '/admin/blog',
  '/admin/campanas',
  '/admin/calendario',
  '/admin/edificios',
  '/admin/unidades',
  '/admin/conceptos',
  '/admin/documentos',
  '/admin/pagos',
  '/admin/egresos',
  '/admin/informes',
  '/admin/usuarios',
  '/admin/auditoria',
];

test.beforeEach(async ({ context }) => {
  const cookies = buildAdminCookies();
  await context.addCookies([
    { name: 'albas_session', value: cookies.session, url: 'http://localhost:3000', httpOnly: true, sameSite: 'Lax' },
    { name: 'albas_csrf', value: cookies.csrf, url: 'http://localhost:3000', sameSite: 'Lax' },
  ]);
});

test('all administrative pages render read-only', async ({ page }) => {
  test.setTimeout(240_000);
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page).toHaveURL(`http://localhost:3000${route}`);
  }
});

test('admin dashboard visual evidence desktop and mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/admin');
  await expect(page.locator('h1')).toContainText('Panel de administración');
  await page.screenshot({ path: path.join(evidenceDir, 'local-admin-1440x900.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator('h1')).toContainText('Panel de administración');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.screenshot({ path: path.join(evidenceDir, 'local-admin-390x844.png'), fullPage: true });
});
