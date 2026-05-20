import { test as base } from '@playwright/test';
import { setupClerkTestingToken, clerk } from '@clerk/testing/playwright';

// Credentials live here — change to a dedicated test account if you create one
const TEST_EMAIL = 'test@test.com';
const TEST_PASSWORD = 'CareerReportTest2026!';

/**
 * Authenticated test fixture.
 * Usage: import { test, expect } from '../fixtures/auth';
 *
 * Any test using this fixture will automatically sign in before the test body runs.
 */
export const test = base.extend<{ signedInPage: void }>({
  page: async ({ page }, use) => {
    await setupClerkTestingToken({ page });
    await page.goto('/');
    await clerk.signIn({
      page,
      signInParams: {
        strategy: 'password',
        identifier: TEST_EMAIL,
        password: TEST_PASSWORD,
      },
    });
    await use(page);
  },
});

export { expect } from '@playwright/test';
