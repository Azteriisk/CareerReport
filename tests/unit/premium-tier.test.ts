import { describe, it, expect } from 'vitest';
import { hasPremiumGlow, cleanProfileBio, togglePremiumGlowPreference } from '../../src/lib/premium-tier';

describe('Premium Tier Helpers', () => {
  describe('hasPremiumGlow', () => {
    it('returns false if user is not pro', () => {
      expect(hasPremiumGlow(false, null)).toBe(false);
      expect(hasPremiumGlow(undefined, null)).toBe(false);
      expect(hasPremiumGlow(null, null)).toBe(false);
    });

    it('returns true if user is pro and has no bio', () => {
      expect(hasPremiumGlow(true, null)).toBe(true);
      expect(hasPremiumGlow(true, undefined)).toBe(true);
      expect(hasPremiumGlow(true, '')).toBe(true);
    });

    it('returns true if user is pro and bio does not contain [NoGlow]', () => {
      expect(hasPremiumGlow(true, 'I am a pro user')).toBe(true);
    });

    it('returns false if user is pro but bio contains [NoGlow]', () => {
      expect(hasPremiumGlow(true, 'I am a pro user [NoGlow]')).toBe(false);
      expect(hasPremiumGlow(true, '[NoGlow] I am a pro user')).toBe(false);
      expect(hasPremiumGlow(true, 'I am a pro user [noglow]')).toBe(false); // Case insensitive
    });
  });

  describe('cleanProfileBio', () => {
    it('removes [NoGlow] tag from bio', () => {
      expect(cleanProfileBio('Hello World [NoGlow]')).toBe('Hello World');
      expect(cleanProfileBio('[noglow]Hello World')).toBe('Hello World');
      expect(cleanProfileBio('Hello [NoGlow] World')).toBe('Hello World');
    });

    it('returns empty string if bio is empty or just the tag', () => {
      expect(cleanProfileBio('[NoGlow]')).toBe('');
      expect(cleanProfileBio(null)).toBe('');
      expect(cleanProfileBio(undefined)).toBe('');
    });
  });

  describe('togglePremiumGlowPreference', () => {
    it('adds [NoGlow] when enableGlow is false', () => {
      expect(togglePremiumGlowPreference('My bio', false)).toBe('My bio [NoGlow]');
      expect(togglePremiumGlowPreference('', false)).toBe('[NoGlow]');
      expect(togglePremiumGlowPreference(null, false)).toBe('[NoGlow]');
    });

    it('removes [NoGlow] when enableGlow is true', () => {
      expect(togglePremiumGlowPreference('My bio [NoGlow]', true)).toBe('My bio');
      expect(togglePremiumGlowPreference('[NoGlow]', true)).toBe('');
    });

    it('does not duplicate [NoGlow] tags', () => {
      expect(togglePremiumGlowPreference('My bio [NoGlow]', false)).toBe('My bio [NoGlow]');
    });
  });
});
