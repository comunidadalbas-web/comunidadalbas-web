import { test, expect } from '@playwright/test';
import path from 'node:path';

const evidenceDir = path.resolve(__dirname, '../../../docs/progress/codex/screenshots');

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('desktop visual evidence', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Comunidad Albas');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(evidenceDir, 'local-home-1440x900.png'), fullPage: true });

  await page.goto('/pagos');
  await expect(page.locator('h1')).toContainText('Pagos en línea');
  await expect(page.getByText('Cargando opciones de pago...', { exact: true })).toBeHidden({ timeout: 20_000 });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(evidenceDir, 'local-pagos-1440x900.png'), fullPage: true });
});

test('mobile visual evidence', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Comunidad Albas');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(evidenceDir, 'local-home-390x844.png'), fullPage: true });

  await page.goto('/pagos');
  await expect(page.locator('h1')).toContainText('Pagos en línea');
  await expect(page.getByText('Cargando opciones de pago...', { exact: true })).toBeHidden({ timeout: 20_000 });
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(evidenceDir, 'local-pagos-390x844.png'), fullPage: true });
});
