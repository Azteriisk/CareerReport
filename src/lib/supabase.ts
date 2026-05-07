import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let globalToken: string | null = null;

export const setSupabaseToken = (token: string | null) => {
  globalToken = token;
};

/**
 * Helper to check if a JWT is expired without a library
 */
const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // SSR safe decoding: use atob in browser, Buffer in Node.js
    const decoded = typeof window !== 'undefined' 
      ? atob(base64) 
      : Buffer.from(base64, 'base64').toString();
      
    const jsonPayload = JSON.parse(decoded);
    const now = Math.floor(Date.now() / 1000);
    // Add 5-minute buffer for clock skew
    return jsonPayload.exp < (now - 300);
  } catch (e) {
    return true;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options = {}) => {
      const headers = new Headers(options.headers);
      // Only attach the token if it exists and is NOT expired
      if (globalToken && !isTokenExpired(globalToken)) {
        headers.set('Authorization', `Bearer ${globalToken}`);
      }
      return fetch(url, { ...options, headers });
    },
  },
});
