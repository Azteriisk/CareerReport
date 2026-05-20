import { test, expect } from './fixtures/auth';

test.describe('Social Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).not.toContainText('Application error');
  });

  test('notifications bell opens dropdown', async ({ page }) => {
    const bellBtn = page.locator('button[title="Notifications"]');
    await expect(bellBtn).toBeVisible({ timeout: 10000 });
    await bellBtn.click();
    const dropdownHeader = page.locator('h3').filter({ hasText: 'Notifications' });
    await expect(dropdownHeader).toBeVisible({ timeout: 5000 });
  });

  test('clicking outside notifications dropdown closes it', async ({ page }) => {
    const bellBtn = page.locator('button[title="Notifications"]');
    await expect(bellBtn).toBeVisible({ timeout: 10000 });
    await bellBtn.click();
    await expect(page.locator('h3').filter({ hasText: 'Notifications' })).toBeVisible();
    // Click away
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('h3').filter({ hasText: 'Notifications' })).not.toBeVisible({ timeout: 3000 });
  });

  test('messages page loads conversation layout', async ({ page }) => {
    await page.goto('/messages');
    const messagesHeading = page.locator('h2').filter({ hasText: 'Messages' });
    await expect(messagesHeading).toBeVisible({ timeout: 10000 });
  });

  test('messages page shows empty state when no conversation selected', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForTimeout(2000); // Allow conversations to load
    const emptyState = page.locator('text=Select a conversation to start messaging');
    // Only visible on desktop (mobile hides this pane by default)
    const viewport = page.viewportSize();
    if (viewport && viewport.width > 768) {
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    }
  });

  test('search page returns tabbed results', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.getByPlaceholder('Search professionals, companies, or jobs...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('developer');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Professionals')).toBeVisible();
    await expect(page.getByText('Companies')).toBeVisible();
    await expect(page.getByText('Jobs')).toBeVisible();
  });

  test('search with no results shows empty state (not a crash)', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.getByPlaceholder('Search professionals, companies, or jobs...');
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    await searchInput.fill('xyzzy_no_results_expected_12345');
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).not.toContainText('Application error');
  });
});

test.describe('Business Features', () => {
  test('business creation page renders form', async ({ page }) => {
    await page.goto('/business/create');
    const heading = page.locator('h1').filter({ hasText: 'Create Your Business Profile' });
    await expect(heading).toBeVisible({ timeout: 10000 });
    const nameInput = page.getByPlaceholder('Acme Corp');
    await expect(nameInput).toBeVisible();
  });

  test('business creation requires company name (validation)', async ({ page }) => {
    await page.goto('/business/create');
    await expect(page.locator('h1').filter({ hasText: 'Create Your Business Profile' })).toBeVisible({ timeout: 10000 });
    // Try to submit without filling in the name
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /Create|Submit/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Should show a validation error or stay on the page — not crash or navigate away
      await expect(page).toHaveURL(/\/business\/create/);
    }
  });
});
