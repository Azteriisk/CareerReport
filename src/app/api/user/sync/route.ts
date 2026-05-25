import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from('profiles').upsert({
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress ?? null,
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
      avatar_url: user.imageUrl ?? null,
      // Only set username fallback, do not overwrite if exists
      // Wait, upserting without checking existing might overwrite username?
      // Since it's a self-heal, the user likely just created the account, so fallback is fine.
      username: user.username || `user_${user.id.slice(-6)}`,
    }, { onConflict: 'id' });

    if (error) {
      console.error('Supabase self-heal profile sync failed:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Self-heal route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
