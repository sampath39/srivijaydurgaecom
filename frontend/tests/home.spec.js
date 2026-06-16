import { test, expect } from '@playwright/test';

test.describe('Customer Homepage Flow', () => {
  test('homepage has correct title and hero section', async ({ page }) => {
    await page.goto('/');
    
    // Expect the title to contain the store name
    await expect(page).toHaveTitle(/Durga Ecom/i);
    
    // Expect the top navbar to have the Home link
    const homeLink = page.locator('nav').locator('text=Home');
    await expect(homeLink).toBeVisible();

    // Expect the hero banner to be visible
    const ctaButton = page.locator('text=Explore Collection');
    await expect(ctaButton).toBeVisible();
  });

  test('navigation to products page works', async ({ page }) => {
    await page.goto('/');
    
    // Click on the View All Products link (either from a button or category dropdown)
    // We'll click the "Shop Sarees" CTA as an example
    const ctaButton = page.locator('text=Shop Sarees');
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();
    
    // We should be on the products page
    await expect(page).toHaveURL(/.*products/);
    
    // The products grid should be visible
    const sortDropdown = page.locator('select');
    await expect(sortDropdown).toBeVisible();
  });
});
