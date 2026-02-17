import { MetadataRoute } from 'next';

import { env } from '@/env.mjs';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/showcase', '/upload-replay'],
        disallow: ['/api/', '/payment/', '/replays', '/auth/', '/error', '/login'],
      },
    ],
    sitemap: `${env.APP_URL?.replace(/\/$/, '')}/sitemap.xml`,
  };
}
