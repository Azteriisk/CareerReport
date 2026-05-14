import { test, expect } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

test.describe('Resume Builder Core Loop', () => {
  test('should allow a guest user to add experience and see it in the preview', async ({ page }) => {
    // Inject Clerk testing token to bypass bot detection/Clerk interstitials
    await setupClerkTestingToken({ page });
    
    // 1. Navigate to the builder (which redirects to sign-in)
    await page.goto('/builder');

    // Authenticate the user
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: 'test@test.com',
        password: 'CareerReportTest2026!'
      }
    });

    // Wait for the builder to load (Next.js dev server can take a bit)
    await expect(page.locator('h2').filter({ hasText: 'Work Experience' })).toBeVisible({ timeout: 20000 });

    // 2. Fill in the job title
    // There is an input next to label "Position/Title" or similar. We'll grab the first input in the Work Experience section.
    // Instead of exact labels, let's just grab the inputs based on their default empty values or surrounding text.
    const companyInput = page.locator('label').filter({ hasText: 'Company' }).locator('..').locator('input').first();
    await companyInput.fill('Vercel');

    const positionInput = page.locator('label').filter({ hasText: 'Position/Title' }).locator('..').locator('input').first();
    // Fallback if 'Position/Title' doesn't exist, it might just be 'Position'
    if (await positionInput.count() > 0) {
      await positionInput.fill('Senior Frontend Developer');
    }

    // 3. Assert that the preview instantly updates
    const previewPane = page.locator('.resume-preview');
    await expect(previewPane).toContainText('Vercel', { timeout: 10000 });
  });

  test('should trigger the upgrade modal for premium features if user is not premium', async ({ page }) => {
    await setupClerkTestingToken({ page });
    
    await page.goto('/builder');

    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: 'test@test.com',
        password: 'CareerReportTest2026!'
      }
    });

    // Wait for the builder to load
    await expect(page.locator('h2').filter({ hasText: 'Work Experience' })).toBeVisible({ timeout: 20000 });

    // Click on the direct Upgrade button
    const upgradeBtn = page.locator('button').filter({ hasText: 'Upgrade to Premium ($9)' });
    
    // We expect the UpgradeModal to become visible, which has a specific heading
    await upgradeBtn.click();
    
    const modalHeading = page.locator('h2').filter({ hasText: 'Unlock' });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });
  });
});
