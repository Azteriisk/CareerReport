/**
 * Simple sliding-window rate limiter.
 *
 * Works on Node.js runtimes (including Vercel serverless functions).
 * For Edge runtimes, this still limits within a warm instance —
 * for cross-instance limiting you'd need Upstash Redis / Vercel KV.
 */

interface RateLimiterOptions {
  /** Time window in milliseconds. Default: 60 000 (1 minute) */
  windowMs: number;
  /** Maximum requests per window per key. Default: 10 */
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Milliseconds until the window resets */
  resetInMs: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests } = options;
  // key → array of request timestamps within the current window
  const store = new Map<string, number[]>();

  // Periodically sweep expired entries to avoid unbounded memory growth
  const sweep = () => {
    const now = Date.now();
    for (const [key, timestamps] of store.entries()) {
      const valid = timestamps.filter(t => now - t < windowMs);
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  };

  const isEdge = typeof (globalThis as { EdgeRuntime?: string }).EdgeRuntime === 'string';
  if (typeof setInterval !== 'undefined' && !isEdge) {
    try { setInterval(sweep, 5 * 60 * 1000).unref?.(); } catch { /* not available */ }
  }

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const windowStart = now - windowMs;

      // Get existing timestamps and filter to current window
      const timestamps = (store.get(key) ?? []).filter(t => t > windowStart);

      if (timestamps.length >= maxRequests) {
        const oldest = timestamps[0];
        return {
          allowed: false,
          remaining: 0,
          resetInMs: windowMs - (now - oldest),
        };
      }

      timestamps.push(now);
      store.set(key, timestamps);

      return {
        allowed: true,
        remaining: maxRequests - timestamps.length,
        resetInMs: windowMs,
      };
    },
  };
}

/** Shared limiter: 10 AI requests per user per 60 seconds */
export const aiRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 10 });

/** Stricter limiter for PDF import (vision calls are expensive) */
export const pdfImportRateLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 3 });

// ── New simpler checkout limiter added for shipability Phase 1 ──

const checkoutRateLimitStore = new Map<string, number[]>();

/**
 * Check whether a key is within its rate limit window.
 * Returns a simple boolean for quick checkout flow gating.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;

  let timestamps = checkoutRateLimitStore.get(key) ?? [];
  timestamps = timestamps.filter(t => t > windowStart);

  if (timestamps.length >= maxRequests) {
    return false; // Rate limited
  }

  timestamps.push(now);
  checkoutRateLimitStore.set(key, timestamps);
  return true;
}

export function resetRateLimit(key: string): void {
  checkoutRateLimitStore.delete(key);
}

