import { test, expect } from '@playwright/test';

/**
 * Public Pages — no auth required.
 * Runs on all configured browser profiles (Desktop Chrome, Mobile Chrome, Mobile Safari).
 */
test.describe('Public Pages', () => {
  test('homepage renders hero and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CareerReport/);
    // At least one primary CTA button visible
    const ctaBtn = page.locator('a.btn-primary, button.btn-primary').first();
    await expect(ctaBtn).toBeVisible({ timeout: 10000 });
  });

  test('jobs page loads job listings section', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page).toHaveURL(/\/jobs/);
    // Should have some kind of job content or empty state — not a crash
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('how-it-works page renders without error', async ({ page }) => {
    await page.goto('/how-it-works');
    await expect(page).toHaveURL(/\/how-it-works/);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
  });

  test('privacy policy page has correct title', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).toHaveTitle(/Privacy/i);
    await expect(page.locator('h1').filter({ hasText: /privacy/i })).toBeVisible({ timeout: 10000 });
  });

  test('terms of service page has correct title', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).toHaveTitle(/Terms/i);
    await expect(page.locator('h1').filter({ hasText: /terms/i })).toBeVisible({ timeout: 10000 });
  });

  test('sign-in page renders Clerk form', async ({ page }) => {
    await page.goto('/sign-in');
    // Clerk renders a form with an email/identifier input
    const emailInput = page.locator('input[name="identifier"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 15000 });
  });

  test('sign-up page renders Clerk form', async ({ page }) => {
    await page.goto('/sign-up');
    const emailInput = page.locator('input[name="emailAddress"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 15000 });
  });

  test('builder page loads without 500 (guest mode)', async ({ page }) => {
    await page.goto('/builder');
    // Builder is public — should get a 200 page, not an error
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('sitemap.xml returns valid XML', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<urlset');
    expect(body).toContain('careerreport');
  });

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.request.get('/robots.txt');
    expect(response.status()).toBe(200);
  });
});
