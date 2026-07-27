import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Comunidad Albas');
  });

  test('should display the construction notice', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Portal en construcción')).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav a')).toHaveCount(4);
  });

  test('should have contact link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/contacto"]')).toBeVisible();
  });
});
