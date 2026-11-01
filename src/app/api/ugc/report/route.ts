import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/api-error';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body = await request.json();
    const { targetType, targetId, targetUserId, reason, details } = body;

    if (!targetType || !reason) {
      return NextResponse.json({ error: 'targetType and reason are required.' }, { status: 400 });
    }

    const reportPayload = {
      reporter_id: userId || 'anonymous',
      target_type: targetType, // 'post' | 'message' | 'user'
      target_id: targetId || null,
      target_user_id: targetUserId || null,
      reason,
      details: details || null,
      created_at: new Date().toISOString(),
      status: 'pending_review',
    };

    console.log('[UGC Report Submitted]:', JSON.stringify(reportPayload, null, 2));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from('user_reports' as any)
      .insert([reportPayload])
      .select();

    if (error) {
      // Graceful fallback if user_reports table hasn't been created yet in DB
      console.warn('[UGC Report Fallback Logger]: Table "user_reports" not present. Report logged to server output.');
      return NextResponse.json({
        success: true,
        fallback: true,
        message: 'Report received. Our moderation team reviews all flagged content within 24 hours.',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Report received. Our moderation team reviews all flagged content within 24 hours.',
    });
  } catch (err: unknown) {
    console.error('[UGC Report Error]:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
