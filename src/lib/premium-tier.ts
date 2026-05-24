/**
 * Helpers for managing Premium User (Pro) specific tags and features
 * using the profiles.bio field (zero database migration required).
 */

/**
 * Returns true if the user is a Premium (Pro) subscriber and has NOT 
 * explicitly opted out of the premium glow via their settings.
 */
export function hasPremiumGlow(isPro: boolean | null | undefined, bio: string | null | undefined): boolean {
  if (!isPro) return false;
  
  // If bio contains the hidden [NoGlow] tag, they opted out
  if (bio && bio.match(/\[NoGlow\]/i)) {
    return false;
  }
  
  return true;
}

/**
 * Strips the hidden [NoGlow] tag from the bio so it can be displayed cleanly
 * to other users if we ever render the bio directly.
 */
export function cleanProfileBio(bio: string | null | undefined): string {
  if (!bio) return '';
  return bio.replace(/\s*\[NoGlow\]/gi, '').trim();
}

/**
 * Toggles the premium glow preference by injecting or removing the [NoGlow] tag.
 * Returns the new updated bio string.
 */
export function togglePremiumGlowPreference(bio: string | null | undefined, enableGlow: boolean): string {
  let currentBio = bio || '';
  
  // Remove existing tag to start fresh
  currentBio = currentBio.replace(/\s*\[NoGlow\]/gi, '').trim();
  
  // If they want to disable the glow, append the tag
  if (!enableGlow) {
    currentBio = currentBio ? `${currentBio} [NoGlow]` : '[NoGlow]';
  }
  
  return currentBio;
}
