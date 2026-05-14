import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { ProfileClient } from './ProfileClient';

// Enable Incremental Static Regeneration (ISR)
export const revalidate = 60; // Revalidate every 60 seconds

type Props = {
  params: Promise<{ username: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const resolvedParams = await params;
  const username = resolvedParams.username;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, username')
    .eq('username', username)
    .single();

  if (!profile) {
    return {
      title: 'Profile Not Found | CareerReport',
    };
  }

  // Fetch resume data to get label/summary
  const { data: resume } = await supabase
    .from('resumes')
    .select('data')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  const displayName = profile.full_name || `@${profile.username}`;
  const title = `${displayName}'s Resume & Profile`;
  let description = `Check out ${displayName}'s professional profile on CareerReport.`;
  
  if (resume?.data?.basics?.label) {
    description = `${resume.data.basics.label}. ${description}`;
  }

  const images = profile.avatar_url ? [profile.avatar_url] : [];

  return {
    title: `${title} | CareerReport`,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    }
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const resolvedParams = await params;
  return <ProfileClient username={resolvedParams.username} />;
}
