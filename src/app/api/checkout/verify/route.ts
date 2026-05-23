import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/api-error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    });
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured on this environment.');
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid' || session.status === 'complete') {
      const userId = session.metadata?.userId;

      if (!userId) {
        return NextResponse.json({ error: 'User ID not found in session metadata' }, { status: 400 });
      }

      // Update the user's Pro status in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', userId);

      if (error) {
        console.error('Supabase update error on verify:', error);
        return NextResponse.json({ error: 'Failed to update database profile' }, { status: 500 });
      }

      return NextResponse.json({ success: true, isPro: true });
    }

    return NextResponse.json({ success: false, error: 'Session is not paid' }, { status: 400 });
  } catch (err: unknown) {
    console.error('Stripe Verify Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
