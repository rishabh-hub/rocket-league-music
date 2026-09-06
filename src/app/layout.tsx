import '@/styles/globals.css';

import { PropsWithChildren, Suspense } from 'react';
import { LanguageProvider } from '@inlang/paraglide-next';
import { MotionConfig } from 'motion/react';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Navbar } from '@/components/navbar/navbar';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { siteConfig } from '@/lib/constant';
import { fonts } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import ResumeTracker from '@/components/ResumeTracker';
import { AuthSuccessHandler } from '@/app/login/client';
import ErrorBoundary from '@/components/error-boundary';
import { ContextualFeedbackProvider } from '@/contexts/ContextualFeedbackContext';
import { FeedbackWidgetLazy } from '@/components/feedback/FeedbackWidgetLazy';

export const generateMetadata = (): Metadata => ({
  metadataBase: new URL(
    process.env.APP_URL || 'https://rocket-league-music.vercel.app/'
  ),
  title: {
    default: 'ReplayRhythms | What your Rocket League match sounds like',
    template: `%s | ReplayRhythms`,
  },
  description:
    'Upload a Rocket League replay. ReplayRhythms reads your boost, speed, positioning and shots off ballchasing.com, then finds songs that fit how you played.',
  keywords: [
    'Rocket League',
    'replay analysis',
    'music recommendation',
    'ballchasing.com',
  ],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon-16x16.png',
    apple: '/favicon/apple-touch-icon.png',
  },
  verification: {
    google:
      process.env.GOOGLE_SITE_VERIFICATION_ID ||
      'atXGBO6IOwPwTBTE-7Ht1DBAxDxG8XmNXKcbUynK6VQ',
  },
  openGraph: {
    url: siteConfig.url(),
    title: 'ReplayRhythms | What your Rocket League match sounds like',
    description:
      'Upload a Rocket League replay. ReplayRhythms reads your boost, speed, positioning and shots off ballchasing.com, then finds songs that fit how you played.',
    siteName: 'ReplayRhythms',
    images: '/images/logo.png',
    type: 'website',
    locale: 'en', // Use default locale for metadata
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReplayRhythms | What your Rocket League match sounds like',
    description: 'Upload a replay. Get songs that fit how you played it.',
    images: {
      url: '/opengraph-image.png',
      width: 2048,
      height: 734,
    },
    creator: '@rishabh_1056',
  },
  authors: [
    {
      name: 'Rishabh Singh',
      url: 'https://www.linkedin.com/in/rishabh-singh-a1726b1a6/',
    },
  ],
  category: 'Gaming Tools',
  applicationName: 'ReplayRhythms',
  creator: 'Rishabh Singh',
  publisher: 'Rishabh Singh',
});

const RootLayout = ({ children }: PropsWithChildren) => {
  return (
    <LanguageProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link
            rel="preconnect"
            href="https://o4509433100959744.ingest.de.sentry.io"
          />
        </head>
        <body className={cn('flex min-h-screen flex-col font-sans', fonts)}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <MotionConfig reducedMotion="user">
              <ContextualFeedbackProvider>
                <ErrorBoundary>
                  <Suspense fallback={null}>
                    <AuthSuccessHandler />
                  </Suspense>
                  <Navbar />
                  <ResumeTracker />
                  <main className="flex flex-1 flex-col">{children}</main>
                  <Footer />
                  <Analytics />
                  <SpeedInsights />
                  <FeedbackWidgetLazy />
                  <Toaster />
                </ErrorBoundary>
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'WebApplication',
                      name: 'ReplayRhythms',
                      url: 'https://rocket-league-music.vercel.app',
                      description:
                        'ReplayRhythms turns a Rocket League replay into songs that match how the match was played.',
                      applicationCategory: 'GameApplication',
                      operatingSystem: 'Web',
                      offers: {
                        '@type': 'Offer',
                        price: '0',
                        priceCurrency: 'USD',
                      },
                      creator: {
                        '@type': 'Person',
                        name: 'Rishabh Singh',
                        url: 'https://www.linkedin.com/in/rishabh-singh-a1726b1a6/',
                      },
                    }),
                  }}
                />
              </ContextualFeedbackProvider>
            </MotionConfig>
          </ThemeProvider>
        </body>
      </html>
    </LanguageProvider>
  );
};

export default RootLayout;
