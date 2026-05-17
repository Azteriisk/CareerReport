import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_for_build', {
  apiVersion: '2025-01-27.acacia' as any,
});

export async function POST(request: Request) {
  try {
    // Fail-fast if the real secret key is missing when the API is triggered
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured on this environment.');
    }

    const { userId, email } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careerreport.azterisk.net';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CareerReport Pro',
              description: 'Unlimited access to ATS-optimized AI writer, PDF parsing, and advanced templates.',
            },
            unit_amount: 900, // $9.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${appUrl}/builder?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/builder?canceled=true`,
      metadata: {
        userId: userId,
      },
      customer_email: email || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
