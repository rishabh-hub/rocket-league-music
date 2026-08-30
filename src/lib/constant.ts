import { env } from '@/env.mjs';

export const siteConfig = {
  url: () => env.APP_URL,
  googleSiteVerificationId: () => env.GOOGLE_SITE_VERIFICATION_ID || '',
};
