import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { purchaseToken, sku } = await request.json();
    if (!purchaseToken || !sku) {
      return NextResponse.json({ error: 'Missing purchaseToken or sku' }, { status: 400 });
    }

    const serviceAccountJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;

    // Fail-fast / mock flow for builds or initial setups without credentials
    if (!serviceAccountJson) {
      console.warn('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured. Running in Mock/Dry-run mode.');
      
      // Update local profile immediately for development/dry-run testing
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('career_context')
        .eq('id', userId)
        .single();

      const currentContext = currentProfile?.career_context || '';
      let newContext = currentContext;
      if (!currentContext.includes(`[GooglePlayToken: ${purchaseToken}]`)) {
        newContext = `${currentContext}\n[GooglePlayToken: ${purchaseToken}]`.trim();
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_pro: true,
          career_context: newContext
        })
        .eq('id', userId);

      if (error) {
        console.error('Supabase upgrade error in dry-run mode:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Mock verification completed successfully.' 
      });
    }

    // Parse the Google Service Account credentials
    let credentials;
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (e) {
      throw new Error('Invalid JSON format in GOOGLE_PLAY_SERVICE_ACCOUNT_JSON environment variable.');
    }

    const packageName = credentials.package_name || process.env.NEXT_PUBLIC_ANDROID_PACKAGE_NAME || 'com.careerreport.app';

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

    // Query subscription order status from Google Play
    const playResponse = await androidpublisher.purchases.subscriptions.get({
      packageName: packageName,
      subscriptionId: sku,
      token: purchaseToken,
    });

    const expiryTimeMillis = parseInt(playResponse.data.expiryTimeMillis || '0', 10);
    const now = Date.now();

    // Verify subscription validity (check if expiry timestamp is in the future)
    const isSubscriptionActive = expiryTimeMillis > now;

    if (!isSubscriptionActive) {
      return NextResponse.json({ 
        error: 'Subscription has expired or is invalid.', 
        expiryTime: playResponse.data.expiryTimeMillis 
      }, { status: 400 });
    }

    // Retrieve current profile to preserve user context
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('career_context')
      .eq('id', userId)
      .single();

    const currentContext = currentProfile?.career_context || '';
    let newContext = currentContext;
    if (!currentContext.includes(`[GooglePlayToken: ${purchaseToken}]`)) {
      newContext = `${currentContext}\n[GooglePlayToken: ${purchaseToken}]`.trim();
    }

    // Persist Pro status and token mapping to database
    const { error: dbError } = await supabase
      .from('profiles')
      .update({ 
        is_pro: true,
        career_context: newContext
      })
      .eq('id', userId);

    if (dbError) {
      console.error('Supabase upgrade error:', dbError);
      return NextResponse.json({ error: 'Failed to update database profile status' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      expiryTime: playResponse.data.expiryTimeMillis 
    });

  } catch (err: any) {
    console.error('Google Play receipt verification failed:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
