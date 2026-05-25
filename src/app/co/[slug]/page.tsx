import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { CompanyProfileClient } from './CompanyProfileClient';

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  try {
    const { data: company, error } = await supabase
      .from('business_profiles')
      .select('name, bio, logo_url')
      .eq('slug', slug)
      .single();

    if (error || !company) {
      return {
        title: 'Company Not Found | CareerReport',
      };
    }

    const title = `${company.name} | Careers & Opportunities`;
    const description = company.bio || `Explore jobs and team updates at ${company.name} on CareerReport.`;
    const images = company.logo_url
      ? [{ url: company.logo_url }]
      : [{ url: '/homepage.jpg', type: 'image/jpeg', width: 1200, height: 630 }];

    return {
      title: `${title} | CareerReport`,
      description,
      openGraph: {
        title,
        description,
        images,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images,
      }
    };
  } catch (e) {
    console.error("Error generating company metadata:", e);
    return {
      title: 'Company Profile | CareerReport',
    };
  }
}

export default async function CompanyProfilePage({ params }: Props) {
  const resolvedParams = await params;
  return <CompanyProfileClient slug={resolvedParams.slug} />;
}
