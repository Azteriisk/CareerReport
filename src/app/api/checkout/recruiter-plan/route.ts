import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';
import { checkRateLimit } from '@/lib/rate-limit';
import { BUSINESS_TIERS } from '@/lib/business-tier';
import { injectStripeCustomerId } from '@/lib/business-tier';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_for_build', {
  apiVersion: '2025-01-27.acacia' as any,
});

// Service-role client — bypasses RLS for reliable server writes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured on this environment.');
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 10 checkout initiations per user per hour
    if (!checkRateLimit(`${userId}:recruiter-plan`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { businessId, tierId, email } = await request.json();

    if (!businessId || !tierId) {
      return NextResponse.json({ error: 'businessId and tierId are required.' }, { status: 400 });
    }

    const tier = BUSINESS_TIERS[tierId];
    if (!tier || tier.price === 0) {
      return NextResponse.json({ error: 'Invalid or free tier — no payment required.' }, { status: 400 });
    }

    // Verify the caller actually owns or has admin access to this business
    const { data: membership, error: memberErr } = await supabaseAdmin
      .from('company_employees')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .maybeSingle();

    if (memberErr || !membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'You do not have permission to manage this business.' }, { status: 403 });
    }

    // Fetch current business bio to check for existing Stripe customer ID
    const { data: business, error: bizErr } = await supabaseAdmin
      .from('business_profiles')
      .select('bio')
      .eq('id', businessId)
      .single();

    if (bizErr || !business) {
      return NextResponse.json({ error: 'Business not found.' }, { status: 404 });
    }

    // Get or create a Stripe Customer
    let customerId: string;
    const { getStripeCustomerId } = await import('@/lib/business-tier');
    const existingCustomerId = getStripeCustomerId(business.bio);

    if (existingCustomerId) {
      customerId = existingCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: email || undefined,
        metadata: { userId, businessId },
      });
      customerId = customer.id;

      // Persist the customer ID in bio immediately so it's available for future calls
      const newBio = injectStripeCustomerId(business.bio, customerId);
      await supabaseAdmin
        .from('business_profiles')
        .update({ bio: newBio })
        .eq('id', businessId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careerreport.azterisk.net';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tier.name,
              description: `CareerReport ${tier.name} — ${tier.maxJobs === 9999 ? 'Unlimited' : tier.maxJobs} active job postings${tier.hasAI ? ' + Gemini AI Stack Ranking' : ''}`,
            },
            unit_amount: tier.price * 100, // convert dollars to cents
            recurring: { interval: 'month' },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${appUrl}/jobs/dashboard?tab=billing&success=plan&tier=${tierId}`,
      cancel_url: `${appUrl}/jobs/dashboard?tab=billing&canceled=true`,
      metadata: {
        userId,
        businessId,
        tierId,
        type: 'recruiter-plan',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Recruiter Plan Checkout Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
