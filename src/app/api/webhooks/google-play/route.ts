import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Google Pub/Sub sends notifications wrapped inside a message object with data in base64
    const pubSubMessage = body.message;
    if (!pubSubMessage || !pubSubMessage.data) {
      return new Response('Invalid Pub/Sub message format', { status: 400 });
    }

    // Decode base64 payload
    const decodedString = Buffer.from(pubSubMessage.data, 'base64').toString('utf-8');
    let notification;
    try {
      notification = JSON.parse(decodedString);
    } catch (e) {
      console.error('Failed to parse Pub/Sub base64 JSON string:', e);
      return new Response('Invalid JSON payload in Pub/Sub data', { status: 400 });
    }

    const { packageName, subscriptionNotification } = notification;

    // We only process subscription events
    if (!subscriptionNotification) {
      console.log('Received non-subscription Developer Notification, ignoring.');
      return NextResponse.json({ received: true });
    }

    const { purchaseToken, subscriptionId, notificationType } = subscriptionNotification;
    console.log(`Google Play RTDN Webhook: Received event type ${notificationType} for SKU ${subscriptionId}`);

    // 1. Locate the user profile containing this purchase token in their career_context
    const { data: profile, error: dbError } = await supabase
      .from('profiles')
      .select('id, career_context')
      .like('career_context', `%[GooglePlayToken: ${purchaseToken}]%`)
      .maybeSingle();

    if (dbError) {
      console.error('Database query error finding profile by purchase token:', dbError);
      return new Response('Database Error', { status: 500 });
    }

    if (!profile) {
      console.warn(`No active user found with Google Play token: ${purchaseToken}. Acknowledging event to prevent retries.`);
      return NextResponse.json({ received: true });
    }

    const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;

    // Mock/Dry-run webhook handling if credentials are not configured
    if (!serviceAccountJson) {
      console.warn('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is missing. Processing webhook in Mock/Dry-run mode.');
      
      // If notificationType is deactivation (8) or revocation (10) or on-hold (5), mock deactivation
      const isDeactivating = [5, 8, 10].includes(notificationType);
      if (isDeactivating) {
        console.log(`Mocking deactivation for user: ${profile.id}`);
        
        // Clean the token out of career_context
        const cleanedContext = (profile.career_context || '')
          .replace(`[GooglePlayToken: ${purchaseToken}]`, '')
          .trim();

        await supabase
          .from('profiles')
          .update({
            is_pro: false,
            career_context: cleanedContext || null
          })
          .eq('id', profile.id);
      }
      
      return NextResponse.json({ received: true });
    }

    // Parse service account credentials
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error('Invalid JSON format in GOOGLE_PLAY_SERVICE_ACCOUNT_JSON environment variable.');
    }

    // Authenticate JWT auth client with Google APIs
    const authClient = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });

    const androidpublisher = google.androidpublisher({
      version: 'v3',
      auth: authClient,
    });

    // Query active status directly from Google Play API to get single source of truth
    const playResponse = await androidpublisher.purchases.subscriptions.get({
      packageName: packageName || credentials.package_name || 'com.careerreport.app',
      subscriptionId: subscriptionId,
      token: purchaseToken,
    });

    const expiryTimeMillis = parseInt(playResponse.data.expiryTimeMillis || '0', 10);
    const now = Date.now();
    const isSubscriptionActive = expiryTimeMillis > now;

    if (isSubscriptionActive) {
      console.log(`Google Play Webhook: Syncing active status for user ${profile.id}`);
      await supabase
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', profile.id);
    } else {
      console.log(`Google Play Webhook: Revoking Pro status for user ${profile.id} (Subscription Expired/Deactivated)`);
      
      // Clean token out of career_context
      const cleanedContext = (profile.career_context || '')
        .replace(`[GooglePlayToken: ${purchaseToken}]`, '')
        .trim();

      await supabase
        .from('profiles')
        .update({
          is_pro: false,
          career_context: cleanedContext || null
        })
        .eq('id', profile.id);
    }

    return NextResponse.json({ received: true });

  } catch (err: any) {
    console.error('Google Play Webhook Handler Error:', err);
    return new Response(`Webhook Handler Error: ${err.message || 'Internal Server Error'}`, { status: 500 });
  }
}
