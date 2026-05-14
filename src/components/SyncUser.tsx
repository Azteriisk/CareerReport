"use client";
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';

export function SyncUser() {
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    let isSyncing = false;
    async function syncProfile() {
      if (!isLoaded || !isSignedIn || !user || isSyncing) return;
      isSyncing = true;

      try {
        // 1. Check if profile exists
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching profile:', fetchError);
          return;
        }

        const profileData = {
          id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          avatar_url: user.imageUrl,
          username: user.username || `user_${Math.random().toString(36).substring(2, 7)}`,
        };

        if (!existingProfile) {
          // 2. Create profile if it doesn't exist
          console.log('Creating new profile for:', user.id);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([profileData]);
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
          } else {
            // Auto-follow @alec for new users
            try {
              const { data: alecProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', 'alec')
                .single();
                
              if (alecProfile && alecProfile.id !== user.id) {
                await supabase
                  .from('followers')
                  .insert([{ follower_id: user.id, following_id: alecProfile.id }]);
                console.log('Auto-followed @alec');
              }
            } catch (followErr) {
              console.error('Failed to auto-follow @alec:', followErr);
            }
          }
        } else {
          // 3. Update existing profile (optional, to keep avatar/name in sync)
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: profileData.full_name,
              avatar_url: profileData.avatar_url,
              email: profileData.email
            })
            .eq('id', user.id);
          
          if (updateError) console.error('Error updating profile:', updateError);
        }
      } catch (err) {
        console.error('Unexpected error syncing profile:', err);
      }
    }

    syncProfile();
  }, [isLoaded, isSignedIn, user]);

  return null; // This component doesn't render anything
}
