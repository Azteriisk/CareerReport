import { describe, it, expect } from 'vitest';
import {
  extractEmbeddedResumeJson,
  normalizeParsedResume,
  buildResumeParserPrompt,
} from '../../src/lib/pdf-resume-import';
import { defaultResume } from '../../src/lib/default-resume';

describe('extractEmbeddedResumeJson', () => {
  it('parses CareerReport embedded JSON block', () => {
    const payload = { ...defaultResume, basics: { ...defaultResume.basics, name: 'Embedded User' } };
    const text = `noise before
=== RAW JSON PAYLOAD FOR AI EXTRACTORS ===
${JSON.stringify(payload)}
=== END JSON PAYLOAD ===`;

    const result = extractEmbeddedResumeJson(text);
    expect(result?.basics.name).toBe('Embedded User');
  });

  it('returns null when block is missing', () => {
    expect(extractEmbeddedResumeJson('plain resume text only')).toBeNull();
  });
});

describe('normalizeParsedResume', () => {
  it('assigns ids to array items missing them', () => {
    const normalized = normalizeParsedResume({
      ...defaultResume,
      work: [{ ...defaultResume.work[0], id: '' }],
    });
    expect(normalized.work[0].id).toBeTruthy();
  });
});

describe('buildResumeParserPrompt', () => {
  it('includes career context when provided', () => {
    const prompt = buildResumeParserPrompt('Target fintech startups');
    expect(prompt).toContain('Target fintech startups');
  });
});
