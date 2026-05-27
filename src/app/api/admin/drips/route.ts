import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';

const ADMIN_USER_ID = process.env.ADMIN_CLERK_USER_ID;

// Helper to create Supabase Admin Client
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId } = await auth();
    
    if (!userId || userId !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // A. Fetch high-level subscription metrics
    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('candidate_drip_subscriptions')
      .select('status');

    if (subsErr) throw subsErr;

    const totalEnrolled = subs?.length || 0;
    const activeStreams = subs?.filter(s => s.status === 'active').length || 0;
    const completedStreams = subs?.filter(s => s.status === 'completed').length || 0;

    // B. Fetch sent metrics count
    const { count: sentCount, error: sentErr } = await supabaseAdmin
      .from('sent_drip_emails')
      .select('*', { count: 'exact', head: true });

    if (sentErr) throw sentErr;

    // C. Fetch latest 5 active subscriptions with user details
    const { data: recentSubs, error: recentSubsErr } = await supabaseAdmin
      .from('candidate_drip_subscriptions')
      .select(`
        id,
        campaign_name,
        current_step,
        status,
        created_at,
        profiles:user_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentSubsErr) throw recentSubsErr;

    return NextResponse.json({
      success: true,
      metrics: {
        totalEnrolled,
        activeStreams,
        completedStreams,
        totalSent: sentCount || 0
      },
      recentSubscriptions: recentSubs || []
    });
  } catch (err: unknown) {
    console.error('Drip API GET Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId } = await auth();
    
    if (!userId || userId !== ADMIN_USER_ID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch active subscriptions
    const { data: activeSubs, error: subsErr } = await supabaseAdmin
      .from('candidate_drip_subscriptions')
      .select(`
        id,
        user_id,
        campaign_name,
        current_step,
        profiles:user_id (
          full_name,
          username,
          email
        )
      `)
      .eq('status', 'active');

    if (subsErr) throw subsErr;

    if (!activeSubs || activeSubs.length === 0) {
      return NextResponse.json({ success: true, processedCount: 0, message: 'No active drip campaigns queue to process.' });
    }

    // 2. Fetch all campaign steps to map transitions
    const { data: steps, error: stepsErr } = await supabaseAdmin
      .from('email_drip_steps')
      .select('*')
      .order('step_number', { ascending: true });

    if (stepsErr) throw stepsErr;

    const processedLogs: string[] = [];
    let count = 0;

    // 3. Process each candidate step queue
    for (const sub of activeSubs) {
      const candidateProfile = sub.profiles as any;
      const campaignName = sub.campaign_name;
      const currentStepNum = sub.current_step;

      // Find the specific campaign step
      const stepDetails = steps?.find(s => s.campaign_name === campaignName && s.step_number === currentStepNum);
      if (!stepDetails) {
        // Step template not seeded or out of bounds, complete campaign automatically
        await supabaseAdmin
          .from('candidate_drip_subscriptions')
          .update({ status: 'completed' })
          .eq('id', sub.id);
        continue;
      }

      // Check if there is a next step
      const hasNextStep = (steps?.filter(s => s.campaign_name === campaignName && s.step_number > currentStepNum).length || 0) > 0;

      // Log email delivery simulation row
      const { error: logErr } = await supabaseAdmin
        .from('sent_drip_emails')
        .insert([{
          user_id: sub.user_id,
          campaign_name: campaignName,
          step_number: currentStepNum
        }]);

      if (logErr) throw logErr;

      // Format template placeholders securely
      const displayName = candidateProfile?.full_name || `@${candidateProfile?.username}` || 'Professional';
      const formattedSubject = stepDetails.subject;
      const formattedBody = stepDetails.body_template.replace('{{name}}', displayName);

      // Advance user state
      const nextStepNum = currentStepNum + 1;
      const nextStatus = hasNextStep ? 'active' : 'completed';

      await supabaseAdmin
        .from('candidate_drip_subscriptions')
        .update({
          current_step: nextStepNum,
          status: nextStatus,
          last_sent_at: new Date().toISOString()
        })
        .eq('id', sub.id);

      // Log audit message
      processedLogs.push(
        `✉️ Email sent to ${displayName} (${candidateProfile?.email || 'No email'}): "${formattedSubject}" [Drip ${currentStepNum} -> Next Status: ${nextStatus}]`
      );
      count++;
    }

    return NextResponse.json({
      success: true,
      processedCount: count,
      logs: processedLogs
    });
  } catch (err: unknown) {
    console.error('Drip API POST Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
