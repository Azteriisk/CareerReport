/**
 * Helpers to parse and encode job listing status and tier.
 * Implements a zero-migration database design by utilizing the existing
 * `jobs.status` string field.
 *
 * Encoding format:  `{base}:{tier}[:{modifier}]`
 *
 * Examples:
 *   'open:standard'          - active, standard listing
 *   'open:featured'          - active, sponsored (clock running)
 *   'open:featured:paused'   - active, sponsored but clock PAUSED (shows as standard to candidates)
 *   'closed:standard'        - closed standard
 *   'closed:featured'        - closed but retains featured tier for when re-opened
 *   'closed:featured:paused' - closed and sponsorship clock paused
 *
 * Backwards compatible: legacy 'open' or 'closed' strings default to open:standard.
 *
 * RULES:
 *   - Sponsorship is NON-TRANSFERABLE: a featured credit is bound to the specific job listing.
 *   - Pausing freezes the sponsorship clock. Candidates see a standard listing while paused.
 *   - Resuming re-activates the clock and restores featured placement immediately.
 */

export interface ParsedJobStatus {
  isOpen: boolean;
  isFeatured: boolean;
  isPaused: boolean;
  /** True only when featured AND not paused — i.e. actively sponsored in the candidate feed */
  isActivelyFeatured: boolean;
  baseStatus: 'open' | 'closed';
  tier: 'standard' | 'featured';
  payType: 'salary' | 'hourly' | 'contract';
}

/**
 * Safely parses the status column to extract listing state, tier, and pause flag.
 * Backwards compatible with legacy 'open' and 'closed' values.
 */
export function parseJobStatus(status: string | null | undefined): ParsedJobStatus {
  if (!status) {
    return {
      isOpen: true,
      isFeatured: false,
      isPaused: false,
      isActivelyFeatured: false,
      baseStatus: 'open',
      tier: 'standard',
      payType: 'salary',
    };
  }

  const parts = status.split(':');
  const base = parts[0] === 'closed' ? 'closed' : 'open';
  const tier = parts[1] === 'featured' ? 'featured' : 'standard';
  const isPaused = parts.includes('paused');
  const isFeatured = tier === 'featured';

  let payType: 'salary' | 'hourly' | 'contract' = 'salary';
  if (parts.includes('hourly')) payType = 'hourly';
  else if (parts.includes('contract')) payType = 'contract';

  return {
    isOpen: base === 'open',
    isFeatured,
    isPaused,
    // Only actively visible as featured to candidates when featured AND not paused
    isActivelyFeatured: isFeatured && !isPaused,
    baseStatus: base,
    tier,
    payType,
  };
}

/**
 * Encodes the job listing parameters into a single database-friendly status string.
 *
 * @param isOpen     - Whether the listing is accepting applications.
 * @param isFeatured - Whether the listing has a paid sponsorship credit attached.
 * @param isPaused   - Whether the sponsorship clock is currently paused.
 *                     Ignored when isFeatured is false.
 */
export function encodeJobStatus(
  isOpen: boolean,
  isFeatured: boolean,
  isPaused: boolean = false,
  payType: 'salary' | 'hourly' | 'contract' = 'salary'
): string {
  const base = isOpen ? 'open' : 'closed';
  const tier = isFeatured ? 'featured' : 'standard';
  const parts = [base, tier];
  if (isFeatured && isPaused) parts.push('paused');
  if (payType !== 'salary') parts.push(payType);
  
  return parts.join(':');
}

/**
 * Quick helper to check if a job is actively featured (sponsored and clock running).
 */
export function isJobFeatured(status: string | null | undefined): boolean {
  return parseJobStatus(status).isActivelyFeatured;
}

/**
 * Toggle the sponsorship pause state for a featured listing.
 * Returns the encoded status with the pause flag flipped.
 * Throws if the listing is not featured.
 */
export function toggleSponsorPause(currentStatus: string | null | undefined): string {
  const parsed = parseJobStatus(currentStatus);
  if (!parsed.isFeatured) {
    throw new Error('Cannot pause/resume sponsorship on a non-featured listing.');
  }
  return encodeJobStatus(parsed.isOpen, true, !parsed.isPaused, parsed.payType);
}

/**
 * Format salary string appropriately based on pay type.
 */
export function formatSalary(min: number | null | undefined, max: number | null | undefined, payType: 'salary' | 'hourly' | 'contract' = 'salary'): string {
  if (!min && !max) return '';
  
  if (payType === 'hourly') {
    const minStr = min ? `$${min}/hr` : '';
    const maxStr = max ? `$${max}/hr` : '';
    if (min && max) return `${minStr} - ${maxStr}`;
    return minStr || maxStr;
  }
  
  if (payType === 'contract') {
    const minStr = min ? `$${min.toLocaleString()}` : '';
    const maxStr = max ? `$${max.toLocaleString()}` : '';
    if (min && max) return `${minStr} - ${maxStr} (Contract)`;
    return (minStr || maxStr) + ' (Contract)';
  }
  
  // default: salary
  const minStr = min ? `$${(min / 1000).toFixed(0)}k` : '';
  const maxStr = max ? `$${(max / 1000).toFixed(0)}k` : '';
  if (min && max) return `${minStr} - ${maxStr}`;
  return minStr || maxStr;
}
