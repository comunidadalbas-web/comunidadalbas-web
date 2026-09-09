import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('PATRIMONIO');
  });

  test('should display the active portal summary', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Plataforma profesional de administración patrimonial', { exact: false })).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    for (const href of ['/', '/contacto', '/login']) {
      expect(await page.locator(`nav a[href="${href}"]`).count()).toBeGreaterThan(0);
    }
  });

  test('should have contact link', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Contáctanos', exact: true })).toBeVisible();
  });
});
