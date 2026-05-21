import { auth } from '@clerk/nextjs/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Max PDF upload size (8 MB). */
export const PDF_IMPORT_MAX_BYTES = 8 * 1024 * 1024;

/** Reject extremely long resumes before AI / vision processing. */
export const PDF_IMPORT_MAX_PAGES = 25;

/** Limit user-injected career context appended to prompts. */
export const CAREER_CONTEXT_MAX_CHARS = 800;

export function sanitizeCareerContext(raw: string | null | undefined): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, CAREER_CONTEXT_MAX_CHARS);
}

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const { getToken } = await auth();
  const token = await getToken();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    },
  );
}

function createServiceSupabaseClient(): SupabaseClient | null {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
}

/** Fail-closed Pro lookup for server API routes. */
export async function isUserPro(userId: string): Promise<boolean> {
  const serviceClient = createServiceSupabaseClient();
  const client = serviceClient ?? (await createServerSupabaseClient());

  const { data, error } = await client
    .from('profiles')
    .select('is_pro')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Pro status lookup failed:', error.message);
    return false;
  }

  return !!data?.is_pro;
}

export function validatePdfUpload(file: File, buffer: Buffer): string | null {
  if (file.type && file.type !== 'application/pdf') {
    return 'Please upload a PDF file.';
  }

  if (buffer.length > PDF_IMPORT_MAX_BYTES) {
    const maxMb = PDF_IMPORT_MAX_BYTES / (1024 * 1024);
    return `PDF is too large. Maximum size is ${maxMb} MB.`;
  }

  if (buffer.length < 100) {
    return 'PDF file appears empty or corrupted.';
  }

  return null;
}
