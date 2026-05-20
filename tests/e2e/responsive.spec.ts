import { test, expect } from '@playwright/test';

/**
 * Responsive Layout Tests — Mobile Chrome and Mobile Safari only.
 * Verifies that key UI patterns switch correctly between desktop and mobile viewports.
 * These run WITHOUT auth to keep them fast; the layout is visible to guests.
 */
test.describe('Responsive Layout', () => {
  test('builder shows tab switcher on mobile (not side-by-side layout)', async ({ page }) => {
    await page.goto('/builder');
    // On mobile, the builder should show Edit/Preview tabs, not a side-by-side split
    // The tab switcher has "Edit" and "Preview" as tab buttons
    await expect(page.locator('button').filter({ hasText: /^Edit$/ })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button').filter({ hasText: /^Preview$/ })).toBeVisible({ timeout: 5000 });
  });

  test('builder Preview tab shows template when tapped on mobile', async ({ page }) => {
    await page.goto('/builder');
    const previewTab = page.locator('button').filter({ hasText: /^Preview$/ });
    await expect(previewTab).toBeVisible({ timeout: 15000 });
    await previewTab.click();
    // After switching to preview, the template should be visible (not the editor)
    await expect(page.locator('.template-modern, .template-classic, .template-minimal, .template-modern-split').first()).toBeVisible({ timeout: 10000 });
  });

  test('messages page shows only conversation list by default on mobile', async ({ page }) => {
    // Even without auth, the page should show a loading or sign-in state — not crash
    await page.goto('/messages');
    await expect(page.locator('body')).not.toContainText('Application error');
    // On mobile, when there's no active conversation selected, the chat pane should be hidden
    // The "Select a conversation" placeholder pane should not be visible (mobile hides it)
    const splitPane = page.locator('text=Select a conversation to start messaging');
    // This element is hidden on mobile (conditional render)
    await expect(splitPane).not.toBeVisible();
  });

  test('navbar is compact on mobile (no desktop nav links visible)', async ({ page }) => {
    await page.goto('/');
    // Desktop nav links like "Jobs", "How It Works" etc. should not be visible on mobile
    // because the mobile nav collapses them
    const desktopNavLink = page.locator('nav a').filter({ hasText: /^Jobs$/ });
    // On mobile viewports, these links are typically hidden or inside a collapsed menu
    await expect(desktopNavLink).not.toBeVisible();
  });

  test('homepage hero content is readable on mobile', async ({ page }) => {
    await page.goto('/');
    // The page body should be visible and not overflow horizontally
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 375;
    // No horizontal overflow — body should not be wider than viewport
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // +10px tolerance
  });

  test('jobs page renders correctly on mobile', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('main, [role="main"]').first()).toBeVisible({ timeout: 10000 });
    // No horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width ?? 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
  });
});
