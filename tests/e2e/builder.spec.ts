import { test, expect } from './fixtures/auth';

test.describe('Resume Builder — Core Loop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder');
    await expect(page.locator('h2').filter({ hasText: 'Work Experience' })).toBeVisible({ timeout: 20000 });
  });

  test('fills company name and sees it instantly reflected in the preview', async ({ page }) => {
    const companyInput = page.locator('label').filter({ hasText: 'Company' }).locator('..').locator('input').first();
    await companyInput.fill('Vercel');
    const previewPane = page.locator('.resume-preview, [class*="template"]').first();
    await expect(previewPane).toContainText('Vercel', { timeout: 10000 });
  });

  test('fills position/title and sees it in the preview', async ({ page }) => {
    const positionInput = page.locator('label').filter({ hasText: 'Position' }).locator('..').locator('input').first();
    await positionInput.fill('Principal Engineer');
    const previewPane = page.locator('.resume-preview, [class*="template"]').first();
    await expect(previewPane).toContainText('Principal Engineer', { timeout: 10000 });
  });

  test('adds a new work experience entry', async ({ page }) => {
    const addBtn = page.locator('button').filter({ hasText: /Add (Work|Experience|Job)/i }).first();
    const initialCount = await page.locator('[data-testid="work-entry"], .work-entry').count();
    await addBtn.click();
    // After adding, count should increase by 1
    await expect(page.locator('[data-testid="work-entry"], .work-entry')).toHaveCount(initialCount + 1, { timeout: 5000 });
  });

  test('upgrade modal appears when clicking premium feature', async ({ page }) => {
    const upgradeBtn = page.locator('button').filter({ hasText: 'Upgrade to Premium ($9)' });
    await upgradeBtn.click();
    const modalHeading = page.locator('h2').filter({ hasText: 'Unlock' });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });
  });

  test('upgrade modal can be dismissed', async ({ page }) => {
    const upgradeBtn = page.locator('button').filter({ hasText: 'Upgrade to Premium ($9)' });
    await upgradeBtn.click();
    const modalHeading = page.locator('h2').filter({ hasText: 'Unlock' });
    await expect(modalHeading).toBeVisible({ timeout: 10000 });
    // Close via X button or Escape
    await page.keyboard.press('Escape');
    await expect(modalHeading).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe('Resume Builder — Template Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder');
    await expect(page.locator('h2').filter({ hasText: 'Work Experience' })).toBeVisible({ timeout: 20000 });
  });

  test('can switch to Classic template and preview updates', async ({ page }) => {
    await page.locator('button, [role="tab"]').filter({ hasText: /Classic/i }).first().click();
    await expect(page.locator('.template-classic')).toBeVisible({ timeout: 10000 });
  });

  test('can switch to Minimal template and preview updates', async ({ page }) => {
    await page.locator('button, [role="tab"]').filter({ hasText: /Minimal/i }).first().click();
    await expect(page.locator('.template-minimal')).toBeVisible({ timeout: 10000 });
  });

  test('can switch to Modern Split template and preview updates', async ({ page }) => {
    await page.locator('button, [role="tab"]').filter({ hasText: /Split/i }).first().click();
    await expect(page.locator('.template-modern-split')).toBeVisible({ timeout: 10000 });
  });

  test('switching templates preserves the name field content', async ({ page }) => {
    // Set a known name
    const nameSection = page.locator('input[placeholder*="name"], input[placeholder*="Name"]').first();
    await nameSection.fill('Template Switch Test');

    // Switch to Classic
    await page.locator('button, [role="tab"]').filter({ hasText: /Classic/i }).first().click();
    await expect(page.locator('.template-classic')).toBeVisible({ timeout: 10000 });

    // Name should persist across template switch
    await expect(page.locator('.template-classic')).toContainText('Template Switch Test', { timeout: 5000 });
  });
});

test.describe('Resume Builder — Data Persistence', () => {
  test('resume data persists after page reload for signed-in user', async ({ page }) => {
    await page.goto('/builder');
    await expect(page.locator('h2').filter({ hasText: 'Work Experience' })).toBeVisible({ timeout: 20000 });

    // Fill the summary field with a unique value
    const summaryInput = page.locator('textarea').first();
    const testValue = `Persistence test ${Date.now()}`;
    await summaryInput.fill(testValue);

    // Save (the builder auto-saves or has a Save button)
    const saveBtn = page.locator('button').filter({ hasText: /Save/i }).first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await page.waitForTimeout(1000); // Allow save to complete
    }

    // Reload
    await page.reload();
    await expect(page.locator('h2').filter({ hasText: 'Work Experience' })).toBeVisible({ timeout: 20000 });

    // The summary textarea should still contain the value
    await expect(page.locator('textarea').first()).toHaveValue(testValue, { timeout: 5000 });
  });
});
