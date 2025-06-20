// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn:
    process.env.SENTRY_DSN ||
    'https://23ae53ee49708228a8821815d850dfd3@o4509433100959744.ingest.de.sentry.io/4509503680151632',

  // Set environment for better filtering in Sentry dashboard
  environment: process.env.NODE_ENV || 'development',

  // Lower trace sample rate for production to reduce overhead
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false, // Set to true only when debugging Sentry issues
});
