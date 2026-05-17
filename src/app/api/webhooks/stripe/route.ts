import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_for_build', {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(request: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured on this environment.');
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';

    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // Fallback for initial setups before webhook secret is configured
        event = JSON.parse(body);
      }
    } catch (err: any) {
      console.error(`Webhook Signature verification failed:`, err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle successful checkout session completions
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (userId) {
        console.log(`Stripe Webhook: Upgrading user ${userId} to Pro`);
        const { error } = await supabase
          .from('profiles')
          .update({ is_pro: true })
          .eq('id', userId);

        if (error) {
          console.error(`Supabase update error in webhook:`, error);
          return new Response(`Database Error`, { status: 500 });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Stripe Webhook Handler Error:', error);
    return new Response(`Webhook Handler Error: ${error.message}`, { status: 500 });
  }
}
