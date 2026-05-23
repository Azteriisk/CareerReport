import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';
import { checkRateLimit } from '@/lib/rate-limit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 5 bundle checkouts per user per hour
    if (!checkRateLimit(`${userId}:sponsor-bundle`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { businessId, bundleType } = await request.json();

    if (!businessId || !bundleType) {
      return NextResponse.json({ error: 'businessId and bundleType are required.' }, { status: 400 });
    }

    // Verify caller owns business profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('business_profiles')
      .select('id, name')
      .eq('id', businessId)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Business profile not found.' }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careerreport.azterisk.net';
    
    let priceAmount = 0;
    let credits = 0;
    let name = '';
    let description = '';

    if (bundleType === 'triple') {
      priceAmount = 4900; // $49
      credits = 3;
      name = 'Triple Pack Sponsorship Bundle';
      description = '3 Sponsorship Credits. Use to upgrade any 3 job listings to featured for 30 days each. Does not expire.';
    } else if (bundleType === 'campaign') {
      priceAmount = 14900; // $149
      credits = 10;
      name = 'Campaign Pack Sponsorship Bundle';
      description = '10 Sponsorship Credits. Best value for active recruiters. Does not expire.';
    } else {
      return NextResponse.json({ error: 'Invalid bundle type.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name,
              description,
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/jobs/dashboard?tab=billing&bundleSuccess=${credits}`,
      cancel_url: `${appUrl}/jobs/dashboard?tab=billing&canceled=true`,
      metadata: {
        userId,
        businessId,
        type: 'sponsor-bundle',
        credits: credits.toString()
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Sponsor Bundle Checkout Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
