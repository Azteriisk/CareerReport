import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';
import { checkRateLimit } from '@/lib/rate-limit';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_for_build', {
  apiVersion: '2025-01-27.acacia' as any,
});

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

    // Rate limit: 10 sponsored post checkouts per user per hour
    if (!checkRateLimit(`${userId}:sponsored-post`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { jobId, businessId, jobTitle } = await request.json();

    if (!jobId || !businessId) {
      return NextResponse.json({ error: 'jobId and businessId are required.' }, { status: 400 });
    }

    // Verify the caller owns the job listing
    const { data: job, error: jobErr } = await supabaseAdmin
      .from('jobs')
      .select('id, title, status, business_id')
      .eq('id', jobId)
      .single();

    if (jobErr || !job) {
      return NextResponse.json({ error: 'Job listing not found.' }, { status: 404 });
    }
    if (job.business_id !== businessId) {
      return NextResponse.json({ error: 'You do not own this listing.' }, { status: 403 });
    }
    if (job.status?.includes(':featured')) {
      return NextResponse.json({ error: 'This listing is already sponsored.' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careerreport.azterisk.net';
    const displayTitle = jobTitle || job.title || 'Job Listing';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Sponsored Post — ${displayTitle}`,
              description: '30-day featured placement with gold highlight, +25pt relevance boost, and candidate matching badge. Pauseable clock. Non-transferable.',
            },
            unit_amount: 1900, // $19.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/jobs/dashboard?tab=jobs&sponsored=${jobId}`,
      cancel_url: `${appUrl}/jobs/dashboard?tab=jobs&canceled=true`,
      metadata: {
        userId,
        businessId,
        jobId,
        type: 'sponsored-post',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Sponsored Post Checkout Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
