import { config } from 'dotenv';
import { TransportOptions } from 'nodemailer';

config();

export const environment = {
  name: process.env.ENVIRONMENT || 'development',
  port: process.env.PORT || 3000,
  auth: {
    CLIENT_DOMAIN: process.env.AUTH0_CLIENT_DOMAIN || 'orvium-io.eu.auth0.com',
    ISSUER: process.env.AUTH0_ISSUER || 'https://orvium-io.eu.auth0.com/',
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  },
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost/orvium',
  smtp: JSON.parse(process.env.SMTP || '{}') as TransportOptions,
  senderEmail: process.env.SENDER_EMAIL || 'noreply@example.com',
  adminEmail: process.env.ADMIN_EMAIL || 'support@example.com',
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:4200',
  sentryDSN: process.env.SENTRY_DSN,
  onlyAdminsCreateCommunities: process.env.ONLY_ADMINS_CREATE_COMMUNITIES === 'true',
  convertAPIKey: process.env.CONVERTAPI_KEY ?? 'fake',
  crossref: {
    testLogUrl: 'https://test.crossref.org/servlet/submissionDownload',
    prodLogUrl: 'https://doi.crossref.org/servlet/submissionDownload',
  },
  test: {
    mongoUri: process.env.TEST_MONGO_URI || 'mongodb://localhost/testdb',
    crossref: {
      uri: process.env.TEST_CROSSREF_URI,
      user: process.env.TEST_CROSSREF_USER,
      pass: process.env.TEST_CROSSREF_PASS,
    },
  },
  aws: {
    endpoint: process.env.AWS_ENDPOINT_URL ?? 'http://localhost:4566',
    region: process.env.AWS_REGION_APP ?? 'eu-central-1',
    s3: {
      privateBucket: process.env.S3_FILES_BUCKET,
      publicBucket: `public-${process.env.S3_FILES_BUCKET ?? ''}`,
    },
  },
  stripe: JSON.parse(process.env.STRIPE || '{}') as {
    key: string;
    webhookSecretConnect: string;
    webhookSecretDirect: string;
  },
  crypto: {
    key: process.env.SECRET_KEY,
  },
  push_notifications_private_key: process.env.PUSH_NOTIFICATIONS_PRIVATE_KEY,
  push_notifications_public_key: process.env.PUSH_NOTIFICATIONS_PUBLIC_KEY,
  publicUrlWithPrefix: (process.env.PUBLIC_URL || 'http://localhost:4200') + '/api/v1',
  googleAnalytics: {
    credentials: process.env.GOOGLE_ANALYTICS_CREDENTIALS ?? '',
    property: process.env.GOOGLE_ANALYTICS_PROPERTY ?? '',
  },
  ithenticate: {
    signing_secret: process.env.ITHENTICATE_SIGNING_SECRET,
    endpoint: process.env.ITHENTICATE_ENDPOINT,
    service_name: process.env.ITHENTICATE_SERVICE_NAME,
    service_version: process.env.ITHENTICATE_SERVICE_VERSION,
  },
  datacite: {
    publisher: process.env.DATACITE_PUBLISHER,
  }
};
