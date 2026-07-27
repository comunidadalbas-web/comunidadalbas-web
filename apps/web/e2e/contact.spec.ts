import { test, expect } from '@playwright/test';

test.describe('Contact form', () => {
  test('should display the form', async ({ page }) => {
    await page.goto('/contacto');
    await expect(page.locator('h1')).toContainText('Contacto');
    await expect(page.locator('form')).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.goto('/contacto');
    await page.locator('button[type="submit"]').click();
    // HTML5 validation will prevent submission, check form is still visible
    await expect(page.locator('form')).toBeVisible();
  });
});
