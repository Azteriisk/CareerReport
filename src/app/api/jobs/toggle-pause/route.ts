import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { toggleSponsorPause, parseJobStatus } from '@/lib/job-tier';
import { auth } from '@clerk/nextjs/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, currentStatus } = await req.json();

    if (!jobId || !currentStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Toggle the status string
    const newStatus = toggleSponsorPause(currentStatus);
    const parsedCurrent = parseJobStatus(currentStatus);
    const isPausing = !parsedCurrent.isPaused; // If it was NOT paused, we are pausing it now

    // Get current job state from DB to accurately adjust dates
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('sponsored_until, paused_at')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new Error('Failed to fetch job data');
    }

    let updatePayload: any = { status: newStatus };

    if (isPausing) {
      // Set paused_at to now
      updatePayload.paused_at = new Date().toISOString();
    } else {
      // Resuming: calculate time elapsed since paused_at, and extend sponsored_until
      if (job.paused_at && job.sponsored_until) {
        const pausedAtDate = new Date(job.paused_at);
        const sponsoredUntilDate = new Date(job.sponsored_until);
        const now = new Date();

        // Ensure we don't accidentally shrink the time if paused_at is in the future somehow
        if (now > pausedAtDate) {
          const pausedDurationMs = now.getTime() - pausedAtDate.getTime();
          const newSponsoredUntil = new Date(sponsoredUntilDate.getTime() + pausedDurationMs);
          
          updatePayload.sponsored_until = newSponsoredUntil.toISOString();
        }
      }
      
      // Clear paused_at
      updatePayload.paused_at = null;
    }

    // Perform the update
    const { error: updateError } = await supabaseAdmin
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ 
      success: true, 
      status: newStatus,
      sponsored_until: updatePayload.sponsored_until || job.sponsored_until,
      paused_at: updatePayload.paused_at !== undefined ? updatePayload.paused_at : job.paused_at
    });
  } catch (error: any) {
    console.error('Toggle pause error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
