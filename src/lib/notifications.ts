import { supabase } from '@/lib/supabase';

/**
 * Triggers an in-app notification for a specific user.
 * @param userId The ID of the user receiving the notification
 * @param actorId The ID of the user performing the action
 * @param type The type of notification: 'follow', 'like', 'comment', 'repost'
 * @param postId Optional post ID if the notification is related to a post
 */
export async function createNotification(
  userId: string,
  actorId: string,
  type: 'follow' | 'like' | 'comment' | 'repost',
  postId?: string
) {
  // Prevent self-notifications
  if (userId === actorId) return;

  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      actor_id: actorId,
      type,
      post_id: postId || null,
      read: false
    });
  } catch (err) {
    console.error('Failed to create notification', err);
  }
}
