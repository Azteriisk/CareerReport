import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Stores a reference to Clerk's getToken function.
// When set, every Supabase request automatically calls it to get a fresh token.
// This is the correct long-term pattern — no manual token strings to expire.
let tokenGetter: ((skipCache?: boolean) => Promise<string | null>) | null = null;

export const setTokenGetter = (getter: ((skipCache?: boolean) => Promise<string | null>) | null) => {
  tokenGetter = getter;
};

// Legacy shim: components that call setSupabaseToken(string) still work
// by wrapping the string in a getter function.
export const setSupabaseToken = (token: string | null) => {
  if (token) {
    tokenGetter = () => Promise.resolve(token);
  } else {
    tokenGetter = null;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (url, options = {}) => {
      const headers = new Headers(options.headers);
      if (tokenGetter) {
        try {
          const token = await tokenGetter(false);
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
        } catch (e) {
          // Token refresh failed — proceed without auth (public reads still work)
          console.warn('[Supabase] Token refresh failed, proceeding anonymously:', e);
        }
      }
      
      let res = await fetch(url, { ...options, headers });
      
      // If the token was rejected as expired (PGRST303), force a cache bypass and retry
      if (res.status === 401 && tokenGetter) {
        try {
          const clone = res.clone();
          const body = await clone.json();
          if (body?.code === 'PGRST303') {
            console.log('[Supabase] JWT expired detected, forcing Clerk token refresh...');
            const freshToken = await tokenGetter(true);
            if (freshToken) {
              headers.set('Authorization', `Bearer ${freshToken}`);
              res = await fetch(url, { ...options, headers });
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
      
      return res;
    },
  },
});
