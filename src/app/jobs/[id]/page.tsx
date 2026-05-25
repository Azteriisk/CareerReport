import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { JobViewClient } from './JobViewClient';
import { parseJobStatus, formatSalary } from '@/lib/job-tier';

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  try {
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !job) {
      return {
        title: 'Job Not Found | CareerReport',
      };
    }

    let companyName = '';
    let logoUrl = '';
    if (job.business_id) {
      const { data: comp } = await supabase
        .from('business_profiles')
        .select('name, logo_url')
        .eq('id', job.business_id)
        .single();
      if (comp) {
        companyName = comp.name;
        logoUrl = comp.logo_url;
      }
    }

    const title = `${job.title} at ${companyName || 'CareerReport'}`;
    
    const locParts = (job.location || '').split(' • ');
    let displayLocation = locParts[0] || (job.is_remote ? 'Remote' : 'On-site');
    if (locParts.length >= 2 && locParts[1] !== 'On-site') {
      displayLocation += ` (${locParts[1]})`;
    }
    
    let jobType = 'Full-time';
    if (locParts.length >= 3) {
      jobType = locParts[2];
    } else if (job.is_remote) {
      jobType = 'Remote';
    }

    let salaryStr = '';
    if (job.salary_min || job.salary_max) {
      salaryStr = ` • ${formatSalary(job.salary_min, job.salary_max, parseJobStatus(job.status).payType)}`;
    }

    const description = `${jobType} • ${displayLocation}${salaryStr}. ${job.description ? job.description.substring(0, 150) + '...' : ''}`;
    const images = logoUrl
      ? [{ url: logoUrl }]
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
    console.error("Error generating job metadata:", e);
    return {
      title: 'Job Listing | CareerReport',
    };
  }
}

export default async function JobViewPage({ params }: Props) {
  const resolvedParams = await params;
  return <JobViewClient id={resolvedParams.id} />;
}
