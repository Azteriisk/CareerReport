/**
 * Utility helpers to manage recruiter subscription plans and listing limits.
 * Implements a zero-migration design by embedding tier tags inside the 
 * business_profiles.bio string field (e.g. '[Tier: pro]').
 */

export interface BusinessTier {
  id: 'starter' | 'pro' | 'enterprise' | 'unlimited';
  name: string;
  price: number;
  maxJobs: number;
  hasAI: boolean;
}

export const BUSINESS_TIERS: Record<string, BusinessTier> = {
  starter: {
    id: 'starter',
    name: 'Free Starter',
    price: 0,
    maxJobs: 1,
    hasAI: false
  },
  pro: {
    id: 'pro',
    name: 'Recruiter Pro',
    price: 49,
    maxJobs: 5,
    hasAI: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Recruiter Enterprise',
    price: 149,
    maxJobs: 20,
    hasAI: true
  },
  unlimited: {
    id: 'unlimited',
    name: 'Custom Unlimited',
    price: 299,
    maxJobs: 9999,
    hasAI: true
  }
};

/**
 * Extracts the subscription tier from a business profile bio string.
 * Defaults to Free Starter.
 */
export function getBusinessTier(bio: string | null | undefined): BusinessTier {
  if (!bio) return BUSINESS_TIERS.starter;

  const match = bio.match(/\[Tier:\s*(\w+)\]/i);
  if (match) {
    const tierId = match[1].toLowerCase();
    if (BUSINESS_TIERS[tierId]) {
      return BUSINESS_TIERS[tierId];
    }
  }

  return BUSINESS_TIERS.starter;
}

/**
 * Strips ALL hidden metadata tags from the business bio so they
 * are completely invisible to standard public users in the UI.
 * Strips: [Tier: ...] and [StripeCustomer: ...]
 */
export function cleanBusinessBio(bio: string | null | undefined): string {
  if (!bio) return '';
  return bio
    .replace(/\s*\[Tier:\s*\w+\]/gi, '')
    .replace(/\s*\[StripeCustomer:\s*[^\]]+\]/gi, '')
    .replace(/\s*\[SponsorCredits:\s*\d+\]/gi, '')
    .trim();
}

/**
 * Injects or updates a subscription tier tag inside the bio string.
 */
export function injectBusinessTier(bio: string | null | undefined, tierId: string): string {
  // Strip only the tier tag, preserve StripeCustomer tag
  const withoutTier = (bio ?? '').replace(/\s*\[Tier:\s*\w+\]/gi, '').trim();
  return `${withoutTier}\n[Tier: ${tierId}]`.trim();
}

// ── Stripe Customer ID helpers (zero-migration, stored in bio) ────────────────

/**
 * Extracts the Stripe customer ID from the business bio string.
 * Returns null if not found.
 */
export function getStripeCustomerId(bio: string | null | undefined): string | null {
  if (!bio) return null;
  const match = bio.match(/\[StripeCustomer:\s*(cus_[^\]]+)\]/i);
  return match ? match[1].trim() : null;
}

/**
 * Injects or updates the Stripe customer ID tag in the bio string.
 * Preserves all other existing tags.
 */
export function injectStripeCustomerId(bio: string | null | undefined, customerId: string): string {
  const withoutCustomer = (bio ?? '').replace(/\s*\[StripeCustomer:\s*[^\]]+\]/gi, '').trim();
  return `${withoutCustomer}\n[StripeCustomer: ${customerId}]`.trim();
}

// ── Sponsor Credits helpers (zero-migration, stored in bio) ────────────────

/**
 * Extracts the remaining sponsor credits from the business bio string.
 * Returns 0 if not found.
 */
export function getSponsorCredits(bio: string | null | undefined): number {
  if (!bio) return 0;
  const match = bio.match(/\[SponsorCredits:\s*(\d+)\]/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Injects or updates the Sponsor Credits tag in the bio string.
 */
export function injectSponsorCredits(bio: string | null | undefined, credits: number): string {
  const withoutCredits = (bio ?? '').replace(/\s*\[SponsorCredits:\s*\d+\]/gi, '').trim();
  return credits > 0 ? `${withoutCredits}\n[SponsorCredits: ${credits}]`.trim() : withoutCredits;
}
