import { test, expect } from './fixtures/auth';

/**
 * PDF Export Tests — Desktop Chrome only.
 * Uses Playwright's page.pdf() to capture the Chromium print output,
 * which is the same engine that react-to-print uses when the user clicks Download.
 *
 * Note: page.pdf() only works in headless Chromium.
 * This spec is scoped to the 'chromium' project via playwright.config.ts.
 */
test.describe('PDF Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder');
    // Wait for the builder editor to be fully loaded
    await expect(page.locator('h2').filter({ hasText: 'Work Experience' })).toBeVisible({ timeout: 20000 });
  });

  test('generates a non-empty PDF with the default resume template', async ({ page }) => {
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });
    // Must be a real PDF (starts with %PDF header)
    const header = pdfBuffer.slice(0, 5).toString();
    expect(header).toBe('%PDF-');
    // Must have substantial content — an empty page is ~3KB, a full resume is >30KB
    expect(pdfBuffer.length).toBeGreaterThan(10_000);
  });

  test('PDF contains the user name from the resume', async ({ page }) => {
    // Clear name and type a known value so we can assert it appears in the PDF text stream
    const nameInput = page.locator('input').first();
    await nameInput.fill('');
    await nameInput.fill('TestName PDFCheck');

    // Wait for the preview to update
    await expect(page.locator('.resume-preview, [class*="template"]').first()).toContainText('TestName PDFCheck', { timeout: 5000 });

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    // PDF text streams are embedded as readable strings in the binary
    const pdfText = pdfBuffer.toString('latin1');
    // The name should appear somewhere in the PDF content stream
    expect(pdfText).toContain('TestName');
  });

  test('switching to Classic template still produces a valid PDF', async ({ page }) => {
    // Click the Classic template option
    const classicBtn = page.getByText('Classic', { exact: false }).first();
    await classicBtn.click();
    await page.waitForTimeout(500); // Allow re-render

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdfBuffer.slice(0, 5).toString()).toBe('%PDF-');
    expect(pdfBuffer.length).toBeGreaterThan(10_000);
  });

  test('switching to Minimal template still produces a valid PDF', async ({ page }) => {
    const minimalBtn = page.getByText('Minimal', { exact: false }).first();
    await minimalBtn.click();
    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdfBuffer.slice(0, 5).toString()).toBe('%PDF-');
    expect(pdfBuffer.length).toBeGreaterThan(10_000);
  });

  test('switching to Modern Split template still produces a valid PDF', async ({ page }) => {
    const splitBtn = page.getByText('Split', { exact: false }).first();
    await splitBtn.click();
    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    expect(pdfBuffer.slice(0, 5).toString()).toBe('%PDF-');
    expect(pdfBuffer.length).toBeGreaterThan(10_000);
  });
});
