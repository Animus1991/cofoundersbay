import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_APP_VERSION,

    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    beforeSend(event) {
      // Never expose stack traces or internal details in production
      if (process.env.NODE_ENV === 'production' && event.exception) {
        event.exception.values?.forEach((e) => {
          if (e.stacktrace) delete e.stacktrace;
        });
      }
      return event;
    },
  });
}
