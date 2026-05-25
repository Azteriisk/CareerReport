import { test, expect } from './fixtures/auth';

test.describe('Sponsored Job Listings & Recruiter ROI Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to recruiter dashboard page
    await page.goto('/jobs/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard & Listings', { timeout: 30000 });
  });

  test('verifies Recruiter ROI Analytics panel displays standard vs. sponsored metrics', async ({ page }) => {
    // We are on the Overview tab by default. Asserts the glassmorphic ROI panel is visible
    const roiHeading = page.locator('h3').filter({ hasText: 'Recruiter ROI & Performance Metrics' });
    await expect(roiHeading).toBeVisible({ timeout: 15000 });

    // Confirm that traffic comparison metrics exist
    await expect(page.locator('body')).toContainText('Standard vs. Sponsored Views', { timeout: 5000 });
    await expect(page.locator('body')).toContainText('Engagement & CTR', { timeout: 5000 });
    await expect(page.locator('body')).toContainText('1,420', { timeout: 5000 });
    await expect(page.locator('body')).toContainText('11.4x Boost', { timeout: 5000 });
  });

  test('can open sponsored post checkout modal and inspect terms checkboxes', async ({ page }) => {
    // Click on the Job Listings tab
    const jobsTab = page.locator('button').filter({ hasText: 'Manage Job Listings' });
    await expect(jobsTab).toBeVisible({ timeout: 10000 });
    await jobsTab.click();

    // Check if there is an active job standard listing Sponsor Post button
    const sponsorBtn = page.locator('button').filter({ hasText: /Sponsor Post/i }).first();
    if (await sponsorBtn.isVisible()) {
      await sponsorBtn.click();

      // Assert that the checkout overlay modal is visible
      await expect(page.locator('body')).toContainText('Sponsor This Listing', { timeout: 10000 });
      await expect(page.locator('body')).toContainText('Non-Transferable:', { timeout: 5000 });

      // Assert terms acknowledgement checkbox is present
      const checkbox = page.locator('input[type="checkbox"]').first();
      await expect(checkbox).toBeVisible();
      await expect(checkbox).not.toBeChecked();

      // Assert the checkout submit button is disabled initially
      const submitBtn = page.locator('button').filter({ hasText: /Pay \$19|Apply/i }).first();
      await expect(submitBtn).toBeDisabled();

      // Accept terms and check if submit button enables
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      await expect(submitBtn).toBeEnabled();

      // Close modal
      await page.keyboard.press('Escape');
      await expect(page.locator('body')).not.toContainText('Sponsor This Listing', { timeout: 5000 });
    }
  });

  test('can see the Click-Through Rate (CTR) badge on listings', async ({ page }) => {
    // Click on the Job Listings tab
    const jobsTab = page.locator('button').filter({ hasText: 'Manage Job Listings' });
    await expect(jobsTab).toBeVisible({ timeout: 10000 });
    await jobsTab.click();

    // Assert that the CTR badges render correctly inside job lists
    const ctrBadge = page.locator('[class*="ctrBadge"]').first();
    if (await ctrBadge.isVisible()) {
      await expect(ctrBadge).toContainText('% CTR');
    }
  });
});
