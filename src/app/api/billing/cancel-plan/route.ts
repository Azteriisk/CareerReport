import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';
import { getStripeCustomerId } from '@/lib/business-tier';

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

    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required.' }, { status: 400 });
    }

    // Verify caller has access to this business
    const { data: membership } = await supabaseAdmin
      .from('company_employees')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // Fetch Stripe customer ID from bio
    const { data: business } = await supabaseAdmin
      .from('business_profiles')
      .select('bio')
      .eq('id', businessId)
      .single();

    const customerId = getStripeCustomerId(business?.bio);

    if (!customerId) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a plan first.' },
        { status: 404 }
      );
    }

    // List all active subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json(
        { error: 'No active Stripe subscription found for this company.' },
        { status: 404 }
      );
    }

    // Cancel all active subscriptions at period end
    for (const sub of subscriptions.data) {
      await stripe.subscriptions.update(sub.id, {
        cancel_at_period_end: true,
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription successfully scheduled for cancellation at the end of the billing period.'
    });
  } catch (err: unknown) {
    console.error('Cancel Plan Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
