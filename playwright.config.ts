import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export default defineConfig({
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 2, // Retry flaky Clerk auth up to 2 times in CI
  workers: 1,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // ── Desktop browsers ─────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      // All specs run on Desktop Chrome
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      // Skip PDF export (requires Chromium) and auth fixture is Chromium-tested
      testIgnore: ['**/pdf-export.spec.ts'],
    },

    // ── Mobile browsers ───────────────────────────────────────────
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      // PDF export only works in headless Chromium, not on mobile emulation
      testIgnore: ['**/pdf-export.spec.ts'],
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
      testIgnore: ['**/pdf-export.spec.ts'],
    },

    // ── Scoped: PDF Export ─────────────────────────────────────────
    // Run pdf-export.spec.ts only on Desktop Chrome (headless Chromium required for page.pdf())
    {
      name: 'pdf-chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ['**/pdf-export.spec.ts'],
    },

    // ── Scoped: Responsive ─────────────────────────────────────────
    // responsive.spec.ts runs exclusively on mobile to test mobile-specific layouts
    // (It is also included in Mobile Chrome/Safari above via the default testIgnore approach)
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
