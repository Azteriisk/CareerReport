import { describe, it, expect } from 'vitest';
import {
  sanitizeCareerContext,
  validatePdfUpload,
  PDF_IMPORT_MAX_BYTES,
  CAREER_CONTEXT_MAX_CHARS,
} from '../../src/lib/ai-guard';

describe('sanitizeCareerContext', () => {
  it('truncates long input', () => {
    const long = 'a'.repeat(CAREER_CONTEXT_MAX_CHARS + 200);
    expect(sanitizeCareerContext(long).length).toBe(CAREER_CONTEXT_MAX_CHARS);
  });

  it('strips control characters', () => {
    expect(sanitizeCareerContext('hello\u0000world')).toBe('helloworld');
  });

  it('returns empty for null/undefined', () => {
    expect(sanitizeCareerContext(null)).toBe('');
    expect(sanitizeCareerContext(undefined)).toBe('');
  });
});

describe('validatePdfUpload', () => {
  it('rejects non-PDF mime type', () => {
    const file = new File([new Uint8Array(200)], 'resume.txt', { type: 'text/plain' });
    const buffer = Buffer.alloc(200);
    expect(validatePdfUpload(file, buffer)).toContain('PDF');
  });

  it('rejects oversized files', () => {
    const file = new File([new Uint8Array(10)], 'big.pdf', { type: 'application/pdf' });
    const buffer = Buffer.alloc(PDF_IMPORT_MAX_BYTES + 1);
    expect(validatePdfUpload(file, buffer)).toContain('too large');
  });

  it('accepts valid PDF', () => {
    const file = new File([new Uint8Array(200)], 'resume.pdf', { type: 'application/pdf' });
    const buffer = Buffer.alloc(200);
    expect(validatePdfUpload(file, buffer)).toBeNull();
  });
});
