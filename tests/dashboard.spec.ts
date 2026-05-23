import { test, expect } from '@playwright/test';

test.describe('Recruiter Dashboard - Billing & Sponsorships', () => {
  // Use a global setup or clerk testing token for full auth, 
  // but for now, we verify the dashboard redirects unauthenticated users
  test('Unauthenticated user is prompted to sign in', async ({ page }) => {
    await page.goto('/jobs/dashboard');
    
    // Should see the sign in prompt since we aren't logged in
    await expect(page.locator('text=Recruiter Sign In Required')).toBeVisible();
    await expect(page.locator('a:has-text("Sign In")')).toBeVisible();
  });

  // Since we can't easily bypass Clerk in a pure smoke test without a test key,
  // we will add a mock route test for our API endpoints to ensure they return 401
  test('Sponsor bundle checkout API requires auth', async ({ request }) => {
    const response = await request.post('/api/checkout/sponsor-bundle', {
      data: { businessId: 'fake', bundleType: 'triple' }
    });
    
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  test('Sponsor with credit API requires auth', async ({ request }) => {
    const response = await request.post('/api/jobs/sponsor-with-credit', {
      data: { businessId: 'fake', jobId: 'fake' }
    });
    
    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });
});
