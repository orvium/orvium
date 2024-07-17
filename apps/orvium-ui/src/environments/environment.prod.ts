import { NgxLoggerLevel } from 'ngx-logger';

export const environment = {
  name: process.env.NG_APP_NAME || 'production',
  production: true,
  experimentalFeatures: false,
  serviceWorker: true,
  apiEndpoint: process.env.NG_APP_API_ENDPOINT,
  version: 'VERSION',
  vapidPublicKey:
    process.env.NG_APP_VAPID_KEY,
  auth: {
    CLIENT_ID: process.env.NG_APP_AUTH_CLIENT_ID,
    CLIENT_DOMAIN: process.env.NG_APP_AUTH_CLIENT_DOMAIN,
    ISSUER: process.env.NG_APP_AUTH_ISSUER,
    AUTH0_AUDIENCE: process.env.NG_APP_AUTH_AUDIENCE,
    REDIRECT_URL: process.env.NG_APP_AUTH_REDIRECT,
    LOGOUT_URL: process.env.NG_APP_AUTH_LOGOUT_URL,
  },
  sentry: {
    dsn:
      process.env.NG_APP_SENTRY_DSN,
    tracesSampleRate: 0.2,
  },
  logLevel: NgxLoggerLevel.WARN,
  publicUrl: process.env.NG_APP_PUBLIC_URL,
  tinymceKey: process.env.NG_APP_TINYMCE_KEY,
  publicS3:
    process.env.NG_APP_S3_BUCKET,
  showFeaturedCommunities: true,
};
