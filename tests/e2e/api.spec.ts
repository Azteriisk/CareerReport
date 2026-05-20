import { test, expect } from '@playwright/test';

/**
 * API Auth Guard Tests
 * Uses page.request to hit API routes directly — no browser UI involved.
 * Tests that unauthenticated calls to protected routes return 401.
 * The Stripe webhook route is excluded — it's intentionally public and self-verifies via signature.
 */
test.describe('API Auth Guards', () => {
  test('POST /api/ai/generate returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/ai/generate', {
      data: { context: {}, type: 'summary' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/ai/parse-pdf returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/ai/parse-pdf', {
      multipart: {
        file: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 fake'),
        },
      },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/support returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/support', {
      data: {
        name: 'Test',
        email: 'test@test.com',
        issueType: 'bug',
        description: 'test',
      },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/checkout returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/checkout', {
      data: { email: 'test@test.com' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/tools/parse-pdf returns 401 without auth', async ({ request }) => {
    const res = await request.post('/api/tools/parse-pdf', {
      multipart: {
        pdf: {
          name: 'test.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.from('%PDF-1.4 fake'),
        },
      },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/webhooks/stripe is accessible without auth (self-verifies)', async ({ request }) => {
    // Stripe webhook must remain public — it handles its own verification via signature
    // We expect 400 (bad signature) not 401 (unauthorized)
    const res = await request.post('/api/webhooks/stripe', {
      data: '{}',
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status()).not.toBe(401);
    // 400 from bad signature is the expected unauthenticated response
    expect([400, 500]).toContain(res.status());
  });
});
