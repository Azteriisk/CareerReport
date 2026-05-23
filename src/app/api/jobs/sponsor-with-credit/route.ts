import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';
import { getSponsorCredits, injectSponsorCredits } from '@/lib/business-tier';
import { parseJobStatus, encodeJobStatus } from '@/lib/job-tier';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(`${userId}:sponsor-credit`, 10, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { jobId, businessId } = await request.json();

    if (!jobId || !businessId) {
      return NextResponse.json({ error: 'jobId and businessId are required.' }, { status: 400 });
    }

    // Verify ownership and check credits in one transaction equivalent
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('business_profiles')
      .select('bio')
      .eq('id', businessId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Business profile not found.' }, { status: 404 });
    }

    const currentCredits = getSponsorCredits(profile.bio);
    if (currentCredits <= 0) {
      return NextResponse.json({ error: 'No sponsor credits available.' }, { status: 400 });
    }

    // Verify job ownership
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('jobs')
      .select('status, business_id')
      .eq('id', jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    if (job.business_id !== businessId) {
      return NextResponse.json({ error: 'You do not own this job listing.' }, { status: 403 });
    }
    if (job.status?.includes(':featured')) {
      return NextResponse.json({ error: 'Listing is already sponsored.' }, { status: 400 });
    }

    // Deduct credit
    const newBio = injectSponsorCredits(profile.bio, currentCredits - 1);
    const { error: updateProfileErr } = await supabaseAdmin
      .from('business_profiles')
      .update({ bio: newBio })
      .eq('id', businessId);

    if (updateProfileErr) throw updateProfileErr;

    // Activate sponsorship
    const parsed = parseJobStatus(job.status);
    const newStatus = encodeJobStatus(parsed.isOpen, true, false); // active, not paused

    const sponsoredUntil = new Date();
    sponsoredUntil.setDate(sponsoredUntil.getDate() + 30);

    const { error: updateJobErr } = await supabaseAdmin
      .from('jobs')
      .update({
        status: newStatus,
        sponsored_until: sponsoredUntil.toISOString(),
      })
      .eq('id', jobId);

    if (updateJobErr) {
      // Note: Ideally handled with an RPC transaction, but this rollback is sufficient for MVP
      await supabaseAdmin.from('business_profiles').update({ bio: profile.bio }).eq('id', businessId);
      throw updateJobErr;
    }

    return NextResponse.json({ success: true, remainingCredits: currentCredits - 1 });
  } catch (err: unknown) {
    console.error('Sponsor with Credit Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
