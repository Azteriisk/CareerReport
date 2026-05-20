import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { supabase } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/api-error';

// Must use the full body — do not parse as JSON manually
export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Svix requires the raw body string and the original headers for signature verification
  const payload = await req.text();
  const headers = {
    'svix-id': req.headers.get('svix-id') ?? '',
    'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
    'svix-signature': req.headers.get('svix-signature') ?? '',
  };

  let event: ReturnType<Webhook['verify']>;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(payload, headers) as ReturnType<Webhook['verify']>;
  } catch (err: unknown) {
    console.error('Clerk webhook signature verification failed:', getErrorMessage(err));
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { type, data } = event as any;

  try {
    if (type === 'user.created' || type === 'user.updated') {
      const profileData = {
        id: data.id,
        email: data.email_addresses?.[0]?.email_address ?? null,
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || null,
        avatar_url: data.image_url ?? null,
        // Only set username on creation — don't overwrite a user-chosen custom username
        ...(type === 'user.created' && {
          username: data.username || `user_${data.id.slice(-6)}`,
        }),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (error) {
        console.error('Supabase profile upsert error:', error);
        return NextResponse.json({ error: 'DB upsert failed' }, { status: 500 });
      }

      // Auto-follow @alec for new users
      if (type === 'user.created') {
        try {
          const { data: alecProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', 'alec')
            .single();

          if (alecProfile && alecProfile.id !== data.id) {
            await supabase
              .from('followers')
              .insert([{ follower_id: data.id, following_id: alecProfile.id }]);
          }
        } catch {
          // Non-critical: don't fail the webhook if auto-follow errors
        }
      }
    }

    if (type === 'user.deleted') {
      // Optional: clean up the profile row when a Clerk user is deleted
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', data.id);

      if (error) {
        console.error('Supabase profile delete error:', error);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error('Clerk webhook handler error:', getErrorMessage(err));
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
