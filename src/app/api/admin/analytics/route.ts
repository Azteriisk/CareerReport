import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';

const ADMIN_USER_ID = process.env.ADMIN_CLERK_USER_ID;

export async function GET() {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { userId } = await auth();
    if (!userId || userId !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch total direct messages sent
    const { count: dmCount, error: dmErr } = await supabaseAdmin
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'direct_message_sent');

    if (dmErr) throw dmErr;

    // 2. Fetch unique non-account resume exports (guests)
    // Supabase JS client doesn't support COUNT(DISTINCT) natively without a raw query or stored procedure.
    // Instead of creating a custom function, we can query distinct session_ids for guests
    const { data: guestSessions, error: guestErr } = await supabaseAdmin
      .from('analytics_events')
      .select('session_id')
      .eq('event_type', 'resume_export_guest');

    if (guestErr) throw guestErr;
    const uniqueGuestExports = new Set((guestSessions || []).map(row => row.session_id)).size;

    // 3. Fetch resumes exported while signed in
    const { count: signedInExportCount, error: exportErr } = await supabaseAdmin
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'resume_export_signed_in');

    if (exportErr) throw exportErr;

    // 4. Fetch the 5 most recent events to populate an live activity log
    const { data: recentEvents, error: recentErr } = await supabaseAdmin
      .from('analytics_events')
      .select('id, event_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentErr) throw recentErr;

    return NextResponse.json({
      success: true,
      metrics: {
        directMessagesSent: dmCount || 0,
        uniqueGuestExports,
        signedInExports: signedInExportCount || 0,
        totalExports: (guestSessions?.length || 0) + (signedInExportCount || 0)
      },
      recentEvents: recentEvents || []
    });
  } catch (err: unknown) {
    console.error('Admin Analytics Fetch Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
