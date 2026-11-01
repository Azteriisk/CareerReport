/**
 * User-Generated Content (UGC) safety, blocking, and moderation utilities
 * Compliant with Google Play Store & Apple App Store UGC policies.
 */

const BLOCKED_USERS_KEY = 'careerreport_blocked_users';

export interface BlockedUser {
  id: string;
  username?: string;
  blockedAt: string;
}

/**
 * Gets all blocked user IDs from local persistent storage.
 */
export function getBlockedUserIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BLOCKED_USERS_KEY);
    if (!raw) return [];
    const list: (BlockedUser | string)[] = JSON.parse(raw);
    return list.map(item => (typeof item === 'string' ? item : item.id));
  } catch {
    return [];
  }
}

/**
 * Checks whether a specific user is blocked.
 */
export function isUserBlocked(userId: string | null | undefined): boolean {
  if (!userId || typeof window === 'undefined') return false;
  const blockedIds = getBlockedUserIds();
  return blockedIds.includes(userId);
}

/**
 * Blocks a user by their user ID.
 */
export function blockUser(userId: string, username?: string): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(BLOCKED_USERS_KEY);
    const list: BlockedUser[] = raw ? JSON.parse(raw) : [];
    if (!list.some(item => (typeof item === 'string' ? item === userId : item.id === userId))) {
      list.push({
        id: userId,
        username,
        blockedAt: new Date().toISOString(),
      });
      localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('careerreport:block-changed', { detail: { userId, blocked: true } }));
    }
  } catch (err) {
    console.error('[UGC] Failed to block user:', err);
  }
}

/**
 * Unblocks a user.
 */
export function unblockUser(userId: string): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(BLOCKED_USERS_KEY);
    if (!raw) return;
    const list: (BlockedUser | string)[] = JSON.parse(raw);
    const updated = list.filter(item => (typeof item === 'string' ? item !== userId : item.id !== userId));
    localStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('careerreport:block-changed', { detail: { userId, blocked: false } }));
  } catch (err) {
    console.error('[UGC] Failed to unblock user:', err);
  }
}

/**
 * Automated text & chat moderation filter.
 * Checks for severe profanity, slurs, harassment, and scam triggers.
 */
const INAPPROPRIATE_PATTERNS = [
  /\b(n+[i1]+g+[e3a4]+r+|f+[a4]+g+[o0]+t+|k+[i1]+k+[e3]+|c+[u0]+n+t+)\b/i,
  /\b(kill\s+your\s*self|go\s+die|kys)\b/i,
  /\b(child\s+porn|cp\s+links|terrorist\s+attack)\b/i,
  /\b(whatsapp\s+me\s+at\s+\+\d+|send\s+crypto\s+to\s+0x[a-f0-9]{10,})\b/i,
];

export function checkContentModeration(text: string): { ok: boolean; reason?: string } {
  if (!text) return { ok: true };

  const normalized = text.toLowerCase();
  for (const pattern of INAPPROPRIATE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        ok: false,
        reason: 'This message violates CareerReport professional community guidelines (harassment, offensive content, or scam pattern detected).',
      };
    }
  }

  return { ok: true };
}
