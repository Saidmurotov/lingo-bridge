import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:5173');
  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Lingo Bridge/);
});

test('can navigate to login', async ({ page }) => {
  await page.goto('http://localhost:5173');
  // Click the Log In link.
  await page.getByRole('link', { name: 'Log In' }).click();
  // Expects page to have a heading with the name of Welcome Back.
  await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
});
