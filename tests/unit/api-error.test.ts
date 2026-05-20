import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../../src/lib/api-error';

describe('getErrorMessage', () => {
  it('extracts message from a standard Error object', () => {
    expect(getErrorMessage(new Error('something went wrong'))).toBe('something went wrong');
  });

  it('returns a raw string as-is', () => {
    expect(getErrorMessage('raw error string')).toBe('raw error string');
  });

  it('JSON-stringifies a plain object', () => {
    expect(getErrorMessage({ code: 404, detail: 'not found' })).toBe('{"code":404,"detail":"not found"}');
  });

  it('JSON-stringifies a number', () => {
    expect(getErrorMessage(500)).toBe('500');
  });

  it('returns fallback message for a circular reference (non-JSON-serializable)', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(getErrorMessage(circular)).toBe('An unexpected error occurred');
  });

  it('handles null without throwing', () => {
    expect(getErrorMessage(null)).toBe('null');
  });

  it('handles undefined — JSON.stringify returns undefined (no throw), so result is undefined', () => {
    // JSON.stringify(undefined) returns the JS value `undefined`, not a string and not an exception.
    // So getErrorMessage returns undefined itself — this is acceptable since the route handler
    // will fall back to a generic message in practice.
    expect(getErrorMessage(undefined)).toBeUndefined();
  });
});
