import { MetadataRoute } from 'next';

import { env } from '@/env.mjs';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // A shared match lives under /replays/, and the crawlers that build
        // link previews honour this file, so blocking the whole prefix meant a
        // shared link unfurled as nothing. Each match page still decides for
        // itself whether it may be indexed: only a public one says yes.
        allow: ['/', '/showcase', '/upload-replay', '/replays/'],
        disallow: [
          '/api/',
          '/payment/',
          '/replays',
          '/auth/',
          '/error',
          '/login',
        ],
      },
    ],
    sitemap: `${env.APP_URL?.replace(/\/$/, '')}/sitemap.xml`,
  };
}
