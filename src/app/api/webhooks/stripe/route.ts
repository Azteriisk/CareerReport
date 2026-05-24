import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from '@/lib/api-error';
import { injectBusinessTier, getSponsorCredits, injectSponsorCredits } from '@/lib/business-tier';
import { encodeJobStatus, parseJobStatus } from '@/lib/job-tier';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/**
 * Service-role Supabase client — bypasses RLS for reliable server-side writes.
 * NEVER expose this client to the browser.
 */
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
    } catch (err: unknown) {
      console.error('Webhook signature verification failed:', err);
      return new Response(`Webhook Error: ${getErrorMessage(err)}`, { status: 400 });
    }

    // ── checkout.session.completed ────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, businessId, tierId, jobId, type } = session.metadata ?? {};

      // ── Consumer Pro subscription (legacy flow) ──
      if (type === 'consumer-pro' || (!type && userId && !businessId)) {
        if (userId) {
          console.log(`[Webhook] Upgrading consumer user ${userId} to Pro`);
          const { error } = await supabaseAdmin
            .from('profiles')
            .update({ is_pro: true })
            .eq('id', userId);
          if (error) {
            console.error('[Webhook] Failed to set is_pro:', error);
            return new Response('Database Error', { status: 500 });
          }
        }
      }

      // ── Recruiter subscription plan upgrade ──
      if (type === 'recruiter-plan' && businessId && tierId) {
        console.log(`[Webhook] Upgrading business ${businessId} to tier: ${tierId}`);

        // Fetch current bio to preserve existing tags
        const { data: biz, error: fetchErr } = await supabaseAdmin
          .from('business_profiles')
          .select('bio')
          .eq('id', businessId)
          .single();

        if (fetchErr || !biz) {
          console.error('[Webhook] Business not found:', fetchErr);
          return new Response('Business not found', { status: 500 });
        }

        const newBio = injectBusinessTier(biz.bio, tierId);
        const { error } = await supabaseAdmin
          .from('business_profiles')
          .update({ bio: newBio })
          .eq('id', businessId);

        if (error) {
          console.error('[Webhook] Failed to inject tier:', error);
          return new Response('Database Error', { status: 500 });
        }
        console.log(`[Webhook] Business ${businessId} upgraded to ${tierId}`);
      }

      // ── Sponsored post one-time payment ──
      if (type === 'sponsored-post' && jobId) {
        console.log(`[Webhook] Activating sponsored post for job ${jobId}`);

        // Fetch current job status
        const { data: job, error: jobFetchErr } = await supabaseAdmin
          .from('jobs')
          .select('status')
          .eq('id', jobId)
          .single();

        if (jobFetchErr || !job) {
          console.error('[Webhook] Job not found:', jobFetchErr);
          return new Response('Job not found', { status: 500 });
        }

        const parsed = parseJobStatus(job.status);
        // Force the job to be OPEN and FEATURED, regardless of its previous hidden state
        const newStatus = encodeJobStatus(true, true, false, parsed.payType); 

        // sponsored_until = now + 30 days
        const sponsoredUntil = new Date();
        sponsoredUntil.setDate(sponsoredUntil.getDate() + 30);

        const { error } = await supabaseAdmin
          .from('jobs')
          .update({
            status: newStatus,
            sponsored_until: sponsoredUntil.toISOString(),
          })
          .eq('id', jobId);

        if (error) {
          console.error('[Webhook] Failed to activate sponsored post:', error);
          return new Response('Database Error', { status: 500 });
        }
        console.log(`[Webhook] Job ${jobId} is now featured until ${sponsoredUntil.toISOString()}`);
      }

      // ── Bundle Sponsor Checkout (One-Time) ──────────────────────────────────
      else if (type === 'sponsor-bundle') {
        const { businessId, credits: purchasedCreditsStr } = session.metadata ?? {};
        const purchasedCredits = parseInt(purchasedCreditsStr || '0', 10);

        if (!businessId || purchasedCredits <= 0) {
          console.error('[Webhook] Invalid metadata for sponsor-bundle');
          return new Response('Invalid metadata', { status: 400 });
        }

        // Fetch current bio
        const { data: profile, error: profileErr } = await supabaseAdmin
          .from('business_profiles')
          .select('bio')
          .eq('id', businessId)
          .single();

        if (profileErr || !profile) {
          console.error('[Webhook] Business not found:', profileErr);
          return new Response('Business not found', { status: 500 });
        }

        const currentCredits = getSponsorCredits(profile.bio);
        const newCredits = currentCredits + purchasedCredits;
        const newBio = injectSponsorCredits(profile.bio, newCredits);

        const { error } = await supabaseAdmin
          .from('business_profiles')
          .update({ bio: newBio })
          .eq('id', businessId);

        if (error) {
          console.error('[Webhook] Failed to add sponsor credits:', error);
          return new Response('Database Error', { status: 500 });
        }
        console.log(`[Webhook] Added ${purchasedCredits} sponsor credits to business ${businessId}. New total: ${newCredits}`);
      }
    }

    // ── customer.subscription.deleted ─────────────────────────────────────────
    else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const { userId, businessId, type } = subscription.metadata ?? {};

      // Consumer Pro downgrade (legacy)
      if (!businessId && userId) {
        console.log(`[Webhook] Revoking Pro status for user ${userId}`);
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ is_pro: false })
          .eq('id', userId);
        if (error) {
          console.error('[Webhook] Failed to revoke is_pro:', error);
          return new Response('Database Error', { status: 500 });
        }
      }

      // Recruiter plan downgrade
      if (businessId) {
        console.log(`[Webhook] Downgrading business ${businessId} to starter (subscription deleted)`);
        const { data: biz } = await supabaseAdmin
          .from('business_profiles')
          .select('bio')
          .eq('id', businessId)
          .single();

        if (biz) {
          const newBio = injectBusinessTier(biz.bio, 'starter');
          await supabaseAdmin
            .from('business_profiles')
            .update({ bio: newBio })
            .eq('id', businessId);
        }
      }

      void type; // suppress unused warning — kept in metadata for future use
    }

    // ── invoice.payment_failed ────────────────────────────────────────────────
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`[Webhook] Payment failed for customer ${invoice.customer}. Stripe will retry automatically.`);
      // No immediate action — Stripe retries. Add email alerting here if desired.
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('Stripe Webhook Handler Error:', err);
    return new Response(`Webhook Handler Error: ${getErrorMessage(err)}`, { status: 500 });
  }
}
