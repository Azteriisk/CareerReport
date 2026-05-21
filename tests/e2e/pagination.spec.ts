import { test, expect, type Page } from '@playwright/test';
import { pageCountFromScrollWidth } from '../../src/lib/resume-pagination';
import { overflowResumeDraftPayload } from './helpers/overflow-resume';

const DRAFT_KEY = 'career-report-resume-draft';

async function measuredPageCount(page: Page): Promise<number> {
  const scrollWidth = await page.evaluate(() => {
    const measure = document.querySelector('div.no-print > .resume-ui-layout');
    return measure?.scrollWidth ?? 0;
  });
  return pageCountFromScrollWidth(scrollWidth);
}

async function openBuilderWithOverflowResume(page: Page) {
  await page.addInitScript(
    ({ key, payload }) => {
      localStorage.setItem(key, payload);
    },
    { key: DRAFT_KEY, payload: overflowResumeDraftPayload() },
  );
  await page.goto('/builder');
  await expect(page.locator('h2').filter({ hasText: 'Work Experience' })).toBeVisible({
    timeout: 20000,
  });
}

async function showResumePreviewOnMobile(page: Page) {
  const previewTab = page.locator('button').filter({ hasText: /^Preview$/ });
  if (await previewTab.isVisible()) {
    await previewTab.click();
  }
}

test.describe('Resume pagination', () => {
  test.beforeEach(async ({ page }) => {
    await openBuilderWithOverflowResume(page);
  });

  test('builder shows multiple preview pages when content overflows', async ({ page }) => {
    await showResumePreviewOnMobile(page);

    await expect
      .poll(async () => measuredPageCount(page), { timeout: 15000 })
      .toBeGreaterThanOrEqual(2);

    const expectedPages = await measuredPageCount(page);
    await expect(page.locator('.resume-ui-page')).toHaveCount(expectedPages, { timeout: 15000 });
  });

  test('hidden measure element scrollWidth drives page count (not bounding box width)', async ({
    page,
  }) => {
    await showResumePreviewOnMobile(page);

    await page.waitForFunction(
      ({ stride, gap }) => {
        const measure = document.querySelector('div.no-print > .resume-ui-layout');
        if (!measure) return false;

        const scrollWidth = measure.scrollWidth;
        const visibleWidth = Math.round(measure.getBoundingClientRect().width);
        const pages = document.querySelectorAll('.resume-ui-page').length;
        const expected = Math.max(1, Math.round((scrollWidth + gap) / stride));

        // Regression: getBoundingClientRect().width ≈ one column; scrollWidth spans all columns.
        return (
          scrollWidth > stride &&
          visibleWidth < scrollWidth - 100 &&
          pages >= 2 &&
          pages === expected
        );
      },
      { stride: 890, gap: 40 },
      { timeout: 15000 },
    );

    const metrics = await page.evaluate(() => {
      const measure = document.querySelector('div.no-print > .resume-ui-layout')!;
      return {
        scrollWidth: measure.scrollWidth,
        visibleWidth: Math.round(measure.getBoundingClientRect().width),
        pages: document.querySelectorAll('.resume-ui-page').length,
      };
    });

    expect(metrics.scrollWidth).toBeGreaterThan(890);
    expect(metrics.visibleWidth).toBeLessThan(metrics.scrollWidth);
    expect(metrics.pages).toBe(pageCountFromScrollWidth(metrics.scrollWidth));
    expect(metrics.pages).toBeGreaterThanOrEqual(2);
  });

  test('print container renders the same number of pages as the preview', async ({ page }) => {
    await showResumePreviewOnMobile(page);

    const expectedPages = await measuredPageCount(page);
    expect(expectedPages).toBeGreaterThanOrEqual(2);

    await expect(page.locator('.resume-ui-page')).toHaveCount(expectedPages, { timeout: 15000 });

    const counts = await page.evaluate(() => ({
      preview: document.querySelectorAll('.resume-ui-page').length,
      print: document.querySelectorAll('.resume-print-page').length,
    }));

    expect(counts.print).toBe(counts.preview);
    expect(counts.print).toBeGreaterThanOrEqual(2);
  });
});
