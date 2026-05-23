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
 * Strips the hidden metadata tags from the business bio so they
 * are completely invisible to standard public users in the UI.
 */
export function cleanBusinessBio(bio: string | null | undefined): string {
  if (!bio) return '';
  return bio.replace(/\s*\[Tier:\s*\w+\]/gi, '').trim();
}

/**
 * Injects or updates a subscription tier tag inside the bio string.
 */
export function injectBusinessTier(bio: string | null | undefined, tierId: string): string {
  const cleanBio = cleanBusinessBio(bio);
  return `${cleanBio}\n[Tier: ${tierId}]`.trim();
}
