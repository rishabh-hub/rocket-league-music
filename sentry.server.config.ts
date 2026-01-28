// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Set environment for better filtering in Sentry dashboard
  environment: process.env.NODE_ENV || 'development',

  // Lower trace sample rate for production to reduce overhead
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false, // Set to true only when debugging Sentry issues

  // Automatically capture unhandled promise rejections (enabled by default in Node.js)

  // Better error filtering
  beforeSend(event) {
    // Filter out errors from browser extensions
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (
        error?.stacktrace?.frames?.some(
          (frame) =>
            frame.filename?.includes('extension://') ||
            frame.filename?.includes('moz-extension://')
        )
      ) {
        return null;
      }
    }
    return event;
  },
});
