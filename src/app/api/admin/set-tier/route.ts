import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';
import { injectBusinessTier, BUSINESS_TIERS } from '@/lib/business-tier';

const ADMIN_USER_ID = process.env.ADMIN_CLERK_USER_ID;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId || userId !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { businessId, tierId } = await request.json();

    if (!businessId || !tierId || !BUSINESS_TIERS[tierId]) {
      return NextResponse.json({ error: 'Invalid businessId or tierId.' }, { status: 400 });
    }

    const { data: biz, error: fetchErr } = await supabaseAdmin
      .from('business_profiles')
      .select('bio')
      .eq('id', businessId)
      .single();

    if (fetchErr || !biz) {
      return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
    }

    const newBio = injectBusinessTier(biz.bio, tierId);
    const { error } = await supabaseAdmin
      .from('business_profiles')
      .update({ bio: newBio })
      .eq('id', businessId);

    if (error) throw error;

    return NextResponse.json({ success: true, tierId });
  } catch (err: unknown) {
    console.error('Admin Set Tier Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
