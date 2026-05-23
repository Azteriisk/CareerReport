/**
 * Helpers to parse and encode job listing status and tier.
 * Implements a zero-migration database design by utilizing the existing
 * `jobs.status` string field (e.g. 'open:standard', 'open:featured').
 */

export interface ParsedJobStatus {
  isOpen: boolean;
  isFeatured: boolean;
  baseStatus: 'open' | 'closed';
  tier: 'standard' | 'featured';
}

/**
 * Safely parses the status column to extract listing status and pay tier.
 * Backwards compatible with legacy 'open' and 'closed' values.
 */
export function parseJobStatus(status: string | null | undefined): ParsedJobStatus {
  if (!status) {
    return { isOpen: true, isFeatured: false, baseStatus: 'open', tier: 'standard' };
  }

  const parts = status.split(':');
  const base = parts[0] === 'closed' ? 'closed' : 'open';
  const tier = parts[1] === 'featured' ? 'featured' : 'standard';

  return {
    isOpen: base === 'open',
    isFeatured: tier === 'featured',
    baseStatus: base,
    tier
  };
}

/**
 * Encodes the job listing parameters into a single database-friendly status string.
 */
export function encodeJobStatus(isOpen: boolean, isFeatured: boolean): string {
  const base = isOpen ? 'open' : 'closed';
  const tier = isFeatured ? 'featured' : 'standard';
  return `${base}:${tier}`;
}

/**
 * Quick helper to check if a job is featured.
 */
export function isJobFeatured(status: string | null | undefined): boolean {
  return parseJobStatus(status).isFeatured;
}
