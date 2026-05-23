import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint to anonymously track views and clicks on job listings.
 * Rate limited heavily at the Edge via Vercel config if needed, or simple custom limit here.
 */
export async function POST(request: Request) {
  try {
    const { jobId, type } = await request.json();

    if (!jobId || (type !== 'view' && type !== 'click')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Since we're just incrementing, we use an RPC call or read+write.
    // Supabase has no easy built-in decrement/increment without RPC. 
    // For MVP, we will read the current value and update it. 
    // In production, an RPC function like `increment_job_view` should be created.
    
    const { data: job, error: fetchErr } = await supabaseAdmin
      .from('jobs')
      .select('views, clicks')
      .eq('id', jobId)
      .single();

    if (fetchErr || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const updates = type === 'view' 
      ? { views: (job.views || 0) + 1 }
      : { clicks: (job.clicks || 0) + 1 };

    const { error: updateErr } = await supabaseAdmin
      .from('jobs')
      .update(updates)
      .eq('id', jobId);

    if (updateErr) {
      console.error('Failed to update tracking:', updateErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Tracking endpoint error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
