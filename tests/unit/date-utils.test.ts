import { describe, it, expect } from 'vitest';
import { formatResumeDate } from '../../src/lib/date-utils';

describe('formatResumeDate', () => {
  it('formats "YYYY-MM" to "MM/YYYY"', () => {
    expect(formatResumeDate('2024-03')).toBe('03/2024');
  });

  it('formats a January date correctly', () => {
    expect(formatResumeDate('2020-01')).toBe('01/2020');
  });

  it('passes through "Present" unchanged', () => {
    expect(formatResumeDate('Present')).toBe('Present');
  });

  it('passes through empty string unchanged', () => {
    expect(formatResumeDate('')).toBe('');
  });

  it('passes through a year-only string with no hyphen unchanged', () => {
    // "2024" has no hyphen so split gives 1 part — falls through to return as-is
    expect(formatResumeDate('2024')).toBe('2024');
  });

  it('handles undefined gracefully (returns undefined)', () => {
    // In practice the data model always sends a string, but guard against it
    expect(formatResumeDate(undefined as unknown as string)).toBeUndefined();
  });
});
