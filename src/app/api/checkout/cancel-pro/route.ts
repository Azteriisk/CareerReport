import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';

export async function POST(request: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    });
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured on this environment.');
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user has a Google Play token in their context
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('career_context')
      .eq('id', userId)
      .single();

    if (profile?.career_context && profile.career_context.includes('[GooglePlayToken:')) {
      return NextResponse.json({
        isGooglePlay: true,
        message: 'Your subscription is managed by Google Play. Please cancel it from the Play Store Subscriptions menu.',
        redirectUrl: 'https://play.google.com/store/account/subscriptions'
      });
    }

    // Search for active Stripe subscriptions for this user
    // We embedded `userId` in the subscription metadata during checkout
    const subscriptions = await stripe.subscriptions.search({
      query: `status:'active' AND metadata['userId']:'${userId}'`,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No active Stripe subscription found for this user.' },
        { status: 404 }
      );
    }

    const subscriptionId = subscriptions.data[0].id;

    // Cancel at period end
    const updatedSub = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ 
      success: true, 
      cancelAt: updatedSub.cancel_at,
      message: 'Subscription successfully scheduled for cancellation at the end of the billing period.'
    });
  } catch (err: unknown) {
    console.error('Cancel Pro Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
