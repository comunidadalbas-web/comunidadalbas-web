import { test, expect } from '@playwright/test';
import path from 'node:path';

const evidenceDir = path.resolve(__dirname, '../../../docs/progress/codex/screenshots');

async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('desktop visual evidence', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('PATRIMONIO');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(evidenceDir, 'local-home-1440x900.png'), fullPage: true });

  await page.goto('/rentas/albas-203');
  await expect(page.locator('h1')).toContainText('Departamento equipado');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(evidenceDir, 'local-rentas-1440x900.png'), fullPage: true });
});

test('mobile visual evidence', async ({ page }) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('PATRIMONIO');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(evidenceDir, 'local-home-360x800.png'), fullPage: true });

  await page.goto('/rentas/albas-203');
  await expect(page.locator('h1')).toContainText('Departamento equipado');
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: path.join(evidenceDir, 'local-rentas-360x800.png'), fullPage: true });
});
