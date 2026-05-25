import { test, expect } from './fixtures/auth';
import * as path from 'path';

test.describe('ATS Resume PDF Import & Validation Portal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ATS PDF metadata validator page
    await page.goto('/tools/parse-pdf');
    await expect(page.locator('h1')).toContainText('ATS Metadata Validator', { timeout: 30000 });
  });

  test('renders the PDF drag and drop interface correctly', async ({ page }) => {
    // Verify dropzone and helper subheadings
    await expect(page.locator('text=Upload a CareerReport PDF to verify')).toBeVisible();
    await expect(page.locator('text=Drag & drop your resume PDF here')).toBeVisible();
    await expect(page.locator('text=Back to Builder')).toBeVisible();
  });

  test('clicking Back to Builder navigates correctly', async ({ page }) => {
    await page.click('text=Back to Builder');
    await expect(page).toHaveURL(/\/builder/);
  });
});
