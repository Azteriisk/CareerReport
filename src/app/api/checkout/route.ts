import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getErrorMessage } from '@/lib/api-error';
import { auth } from '@clerk/nextjs/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(request: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    });
    // Fail-fast if the real secret key is missing when the API is triggered
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured on this environment.');
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use Clerk's verified userId — don't trust the client-provided one
    const { email } = await request.json();

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
            unit_amount: 400, // $4.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${appUrl}/builder?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/builder?canceled=true`,
      metadata: {
        userId: userId,
      },
      customer_email: email || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
