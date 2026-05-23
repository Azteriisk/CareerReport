import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';
import { encodeJobStatus, parseJobStatus } from '@/lib/job-tier';

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

    const { jobId, sponsored, daysFromNow = 30 } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required.' }, { status: 400 });
    }

    const { data: job, error: fetchErr } = await supabaseAdmin
      .from('jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (fetchErr || !job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const parsed = parseJobStatus(job.status);

    if (sponsored) {
      // Manually activate sponsorship
      const newStatus = encodeJobStatus(parsed.isOpen, true, false);
      const sponsoredUntil = new Date();
      sponsoredUntil.setDate(sponsoredUntil.getDate() + daysFromNow);

      const { error } = await supabaseAdmin
        .from('jobs')
        .update({ status: newStatus, sponsored_until: sponsoredUntil.toISOString() })
        .eq('id', jobId);

      if (error) throw error;
      return NextResponse.json({ success: true, status: newStatus, sponsored_until: sponsoredUntil });
    } else {
      // Manually deactivate sponsorship
      const newStatus = encodeJobStatus(parsed.isOpen, false, false);
      const { error } = await supabaseAdmin
        .from('jobs')
        .update({ status: newStatus, sponsored_until: null })
        .eq('id', jobId);

      if (error) throw error;
      return NextResponse.json({ success: true, status: newStatus });
    }
  } catch (err: unknown) {
    console.error('Admin Set Sponsored Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
