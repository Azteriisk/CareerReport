import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';

const ADMIN_USER_ID = process.env.ADMIN_CLERK_USER_ID;

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { userId } = await auth();
    if (!userId || userId !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { targetUserId, isPro } = await request.json();

    if (!targetUserId || typeof isPro !== 'boolean') {
      return NextResponse.json({ error: 'targetUserId and isPro (boolean) are required.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_pro: isPro })
      .eq('id', targetUserId);

    if (error) throw error;

    return NextResponse.json({ success: true, targetUserId, isPro });
  } catch (err: unknown) {
    console.error('Admin Set Pro Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
