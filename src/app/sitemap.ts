import { MetadataRoute } from 'next';

import { env } from '@/env.mjs';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.APP_URL;
  return [
    {
      url: baseUrl || '/',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/showcase`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/upload-replay`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
