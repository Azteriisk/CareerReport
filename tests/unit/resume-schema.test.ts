import { describe, it, expect } from 'vitest';
import { defaultResume } from '../../src/lib/default-resume';
import type { ResumeData } from '../../src/lib/resume-schema';

describe('defaultResume shape', () => {
  it('satisfies the ResumeData type at runtime (is an object)', () => {
    const r = defaultResume as ResumeData;
    expect(r).toBeDefined();
    expect(typeof r).toBe('object');
  });

  it('has a non-empty basics.name', () => {
    expect(defaultResume.basics.name).toBeTruthy();
    expect(typeof defaultResume.basics.name).toBe('string');
  });

  it('has a valid basics.email format', () => {
    expect(defaultResume.basics.email).toMatch(/@/);
  });

  it('has at least one work entry', () => {
    expect(Array.isArray(defaultResume.work)).toBe(true);
    expect(defaultResume.work.length).toBeGreaterThan(0);
  });

  it('every work entry has required fields', () => {
    for (const job of defaultResume.work) {
      expect(typeof job.id).toBe('string');
      expect(typeof job.name).toBe('string');
      expect(typeof job.position).toBe('string');
      expect(Array.isArray(job.highlights)).toBe(true);
    }
  });

  it('has at least one education entry', () => {
    expect(Array.isArray(defaultResume.education)).toBe(true);
    expect(defaultResume.education.length).toBeGreaterThan(0);
  });

  it('has at least one skills entry', () => {
    expect(Array.isArray(defaultResume.skills)).toBe(true);
    expect(defaultResume.skills.length).toBeGreaterThan(0);
  });

  it('every skill has a name and keywords array', () => {
    for (const skill of defaultResume.skills) {
      expect(typeof skill.name).toBe('string');
      expect(Array.isArray(skill.keywords)).toBe(true);
    }
  });

  it('metadata layout values are positive numbers when present', () => {
    const layout = defaultResume.metadata?.layout;
    if (layout) {
      for (const [, val] of Object.entries(layout)) {
        if (val !== undefined) {
          expect(val).toBeGreaterThan(0);
        }
      }
    }
  });
});
