import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

// Regenerate sitemap at most once per hour; avoids a DB hit on every /sitemap.xml request
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://careerreport.azterisk.net'

  // Get a few popular public profiles for the sitemap (limit to avoid huge sitemaps initially)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('username')
    .limit(500)

  const profileUrls = (profiles || []).map((profile) => ({
    url: `${baseUrl}/u/${profile.username}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/builder`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...profileUrls,
  ]
}
