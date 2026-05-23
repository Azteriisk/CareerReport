import { test, expect } from '@playwright/test';

test.describe('Stripe Webhook Integration', () => {
  test('Webhook rejects invalid signatures', async ({ request }) => {
    const response = await request.post('/api/webhooks/stripe', {
      data: JSON.stringify({ type: 'test' }),
      headers: {
        'stripe-signature': 'invalid-signature'
      }
    });
    
    // We expect a 400 or 500 depending on how the signature check fails
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});
