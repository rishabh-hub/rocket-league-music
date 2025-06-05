import '@/styles/globals.css';

import { PropsWithChildren, Suspense } from 'react';
import { LanguageProvider } from '@inlang/paraglide-next';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Navbar } from '@/components/navbar/navbar';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Toaster } from '@/components/ui/toaster';
import { siteConfig } from '@/lib/constant';
import { fonts } from '@/lib/fonts';
import { cn } from '@/lib/utils';
import { languageTag } from '@/paraglide/runtime.js';
import ResumeTracker from '@/components/ResumeTracker';
import { AuthSuccessHandler } from '@/app/login/client';

export const generateMetadata = (): Metadata => ({
  metadataBase: new URL('https://rocket-league-music.vercel.app/'),
  title: {
    default:
      'ReplayRhythms | Rocket League Replay Analysis with Musical Matching',
    template: `%s | ReplayRhythms`,
  },
  description:
    'ReplayRhythms analyzes your Rocket League gameplay and recommends personalized music that matches your unique playstyle. Upload your replay files to discover your gameplay soundtrack.',
  keywords: [
    'Rocket League',
    'replay analysis',
    'gameplay analysis',
    'music recommendation',
    'gaming',
    'esports',
    'player analytics',
    'gameplay metrics',
    'music matching',
    'gameplay style',
    'ReplayRhythms',
    'ballchasing.com',
    'gameplay soundtrack',
  ],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon/favicon.ico',
    shortcut: '/favicon/favicon-16x16.png',
    apple: '/favicon/apple-touch-icon.png',
  },
  verification: {
    google: '77bb0b1137e072ca.html',
  },
  openGraph: {
    url: siteConfig.url(),
    title: 'ReplayRhythms | Convert Your Rocket League Gameplay into Music',
    description:
      'Upload your Rocket League replay files and discover what your gameplay sounds like. ReplayRhythms analyzes your playstyle and matches it with the perfect soundtrack.',
    siteName: 'ReplayRhythms',
    images: `${siteConfig.url()}/images/logo.png`,
    type: 'website',
    locale: languageTag(),
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReplayRhythms | Your Rocket League Playstyle as Music',
    description:
      'What does your Rocket League gameplay sound like? Upload your replay file to find out with ReplayRhythms.',
    images: {
      url: `${siteConfig.url()}/images/logo.png`,
      width: 1024,
      height: 1024,
    },
    creator: '@rishabh_1056', // Replace with your Twitter handle if you have one
  },
  authors: [
    {
      name: 'Rishabh Singh', // Replace with your name
      url: 'https://www.linkedin.com/in/rishabh-singh-a1726b1a6/', // Replace with your URL
    },
  ],
  category: 'Gaming Tools',
  applicationName: 'ReplayRhythms',
  creator: 'Rishabh Singh', // Replace with creator name
  publisher: 'Rishabh Singh', // Replace with publisher name
});

const RootLayout = ({ children }: PropsWithChildren) => {
  return (
    <LanguageProvider>
      <html lang={languageTag()} suppressHydrationWarning>
        <body className={cn('min-h-screen font-sans', fonts)}>
          <ThemeProvider attribute="class">
            <Suspense fallback={null}>
              <AuthSuccessHandler />
            </Suspense>
            <Navbar />
            <ResumeTracker />
            {children}
            <Analytics />
            <SpeedInsights />
            <ThemeSwitcher className="fixed bottom-5 right-5 z-10" />
            {/* <Footer /> */}
            {/* //TODO: Fix or remove footer. If fix, then addsomething related to your branding(like my github,linked,email etc) */}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </LanguageProvider>
  );
};

export default RootLayout;
