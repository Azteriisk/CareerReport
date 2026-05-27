import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from '@/lib/api-error';

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { eventType, sessionId } = await request.json();

    if (!eventType || !sessionId) {
      return NextResponse.json({ error: 'eventType and sessionId are required.' }, { status: 400 });
    }

    // Restrict to known secure event types to prevent pollution
    const allowedEvents = ['resume_export_guest', 'resume_export_signed_in'];
    if (!allowedEvents.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType.' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('analytics_events')
      .insert([{ event_type: eventType, session_id: sessionId }]);

    if (error) throw error;

    return NextResponse.json({ success: true, eventType });
  } catch (err: unknown) {
    console.error('Analytics event log error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
