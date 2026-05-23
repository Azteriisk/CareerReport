import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getErrorMessage } from '@/lib/api-error';
import { getStripeCustomerId } from '@/lib/business-tier';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_for_build', {
  apiVersion: '2025-01-27.acacia' as any,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured on this environment.');
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careerreport.azterisk.net';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/jobs/dashboard?tab=billing`,
    });

    return NextResponse.redirect(portalSession.url);
  } catch (err: unknown) {
    console.error('Billing Portal Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
