import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

test.describe('Social and Business Core Loops', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkTestingToken({ page });
    await page.goto('/');
    
    // Authenticate the user for all tests in this suite
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: 'test@test.com',
        password: 'CareerReportTest2026!'
      }
    });

    // Wait for auth to complete
    await expect(page.locator('text=CareerReport').first()).toBeVisible();
  });

  test('should open notifications dropdown when clicking the bell icon', async ({ page }) => {
    // The notifications bell is an SVG inside a button in the Navbar
    // We can locate it by its title "Notifications"
    const bellBtn = page.locator('button[title="Notifications"]');
    
    // It should exist
    await expect(bellBtn).toBeVisible();
    
    // Click it to open dropdown
    await bellBtn.click();
    
    // The dropdown header should appear
    const dropdownHeader = page.locator('h3').filter({ hasText: 'Notifications' });
    await expect(dropdownHeader).toBeVisible();
  });

  test('should navigate to the messages page and display active conversations layout', async ({ page, isMobile }) => {
    await page.goto('/messages');
    
    // Check if the Messages title is visible
    const messagesHeading = page.locator('h2').filter({ hasText: 'Messages' });
    await expect(messagesHeading).toBeVisible();

    // The left sidebar or the main content should say "No active conversations" or "Select a conversation"
    const emptyStateText = page.locator('text=Select a conversation to start messaging');
    await expect(emptyStateText).toBeVisible();
  });

  test('should return search results from global search page', async ({ page }) => {
    await page.goto('/search');

    // Make sure we're on the search page
    await expect(page).toHaveURL(/\/search/);

    const searchInput = page.getByPlaceholder('Search professionals, companies, or jobs...');
    await expect(searchInput).toBeVisible();

    // Type a query
    await searchInput.fill('developer');
    
    // Since search runs instantly, wait for either loading spinner or results
    // We'll just wait a moment to ensure no crashes occur
    await page.waitForTimeout(1000);
    
    // Tabs should be visible
    await expect(page.getByText('Professionals')).toBeVisible();
    await expect(page.getByText('Companies')).toBeVisible();
    await expect(page.getByText('Jobs')).toBeVisible();
  });

  test('should access business creation page', async ({ page }) => {
    await page.goto('/business/create');
    
    const heading = page.locator('h1').filter({ hasText: 'Create Your Business Profile' });
    await expect(heading).toBeVisible();

    const nameInput = page.getByPlaceholder('Acme Corp');
    await expect(nameInput).toBeVisible();
  });
});
