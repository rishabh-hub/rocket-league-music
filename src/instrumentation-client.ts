// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    'https://23ae53ee49708228a8821815d850dfd3@o4509433100959744.ingest.de.sentry.io/4509503680151632',

  // Set environment for better filtering in Sentry dashboard
  environment: process.env.NODE_ENV || 'development',

  // Add optional integrations for additional features
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content and inputs for privacy
      maskAllText: process.env.NODE_ENV === 'production',
      blockAllMedia: process.env.NODE_ENV === 'production',
    }),
  ],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false, // Set to true only when debugging Sentry issues

  // Better error filtering for client-side
  beforeSend(event) {
    // Filter out errors from browser extensions and irrelevant errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (
        error?.stacktrace?.frames?.some(
          (frame) =>
            frame.filename?.includes('extension://') ||
            frame.filename?.includes('moz-extension://') ||
            frame.filename?.includes('chrome-extension://') ||
            frame.filename?.includes('safari-extension://')
        )
      ) {
        return null;
      }
    }

    // Filter out network errors from ad blockers
    if (event.message?.includes('Non-Error promise rejection captured')) {
      return null;
    }

    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
