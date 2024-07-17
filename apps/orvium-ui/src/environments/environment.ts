function convertBoolean(value: string | undefined | null): boolean | undefined {
  if (!value) {
    return undefined;
  }

  return value.toLowerCase() === 'true';
}

export const environment = {
  name: process.env.NG_APP_NAME || 'development',
  production: convertBoolean(process.env.NG_APP_PRODUCTION) ?? false,
  experimentalFeatures: convertBoolean(process.env.NG_APP_EXPERIMENTAL_FEATURES) ?? true,
  serviceWorker: convertBoolean(process.env.NG_APP_SERVICE_WORKERS) ?? false,
  publicUrl: process.env.NG_APP_PUBLIC_URL || 'http://localhost:4200',
  apiEndpoint: process.env.NG_APP_API_ENDPOINT || 'http://localhost:4200/api/v1',
  version: 'VERSION',
  vapidPublicKey: process.env.NG_APP_VAPID_KEY || 'dummy',
  auth: {
    CLIENT_ID: process.env.NG_APP_AUTH_CLIENT_ID || 'dummy',
    CLIENT_DOMAIN: process.env.NG_APP_AUTH_CLIENT_DOMAIN || 'dummy.eu.auth0.com',
    ISSUER: process.env.NG_APP_AUTH_ISSUER || 'https://dummy.eu.auth0.com',
    AUTH0_AUDIENCE: process.env.NG_APP_AUTH_AUDIENCE || 'dummy',
    REDIRECT_URL: process.env.NG_APP_AUTH_REDIRECT || 'http://localhost:4200',
    LOGOUT_URL: process.env.NG_APP_AUTH_LOGOUT_URL || 'https://dummy.eu.auth0.com/v2/logout',
  },
  sentry: {
    dsn: process.env.NG_APP_SENTRY_DSN || 'dummy',
    tracesSampleRate: Number(process.env.NG_APP_SENTRY_SAMPLE) || 0.2,
  },
  logLevel: Number(process.env.NG_APP_LOG_LEVEL) || 1,
  tinymceKey: process.env.NG_APP_TINYMCE_KEY || 'dummy',
  publicS3:
    process.env.NG_APP_S3_BUCKET ||
    'https://s3.eu-central-1.amazonaws.com/dummy.example.com/',
  showFeaturedCommunities: convertBoolean(process.env.NG_APP_SHOW_FEATURED_COMMUNITIES) ?? true,
};
