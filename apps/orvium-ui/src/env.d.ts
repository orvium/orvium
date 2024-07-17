interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  /**
   * Built-in environment variable.
   * @see Docs https://github.com/chihab/ngx-env#ng_app_env.
   */
  readonly NG_APP_ENV: string;

  readonly NG_APP_NAME: string;
  readonly NG_APP_PRODUCTION: string;
  readonly NG_APP_EXPERIMENTAL_FEATURES: string;
  readonly NG_APP_PUBLIC_URL?: string;
  readonly NG_APP_API_ENDPOINT?: string;
  readonly NG_APP_VAPID_KEY?: string;
  readonly NG_APP_SERVICE_WORKERS: string;

  readonly NG_APP_AUTH_CLIENT_ID?: string;
  readonly NG_APP_AUTH_AUDIENCE?: string;
  readonly NG_APP_AUTH_REDIRECT?: string;
  readonly NG_APP_AUTH_LOGOUT_URL?: string;
  readonly NG_APP_AUTH_CLIENT_DOMAIN?: string;
  readonly NG_APP_AUTH_ISSUER?: string;

  readonly NG_APP_SENTRY_DSN: string;
  readonly NG_APP_SENTRY_SAMPLE: string;

  readonly NG_APP_LOG_LEVEL: string;
  readonly NG_APP_TINYMCE_KEY: string;
  readonly NG_APP_S3_BUCKET?: string;
  readonly NG_APP_SHOW_FEATURED_COMMUNITIES: string;

  [key: string]: string | undefined;
}

/*
 * Remove all the deprecated code below if you're using import.meta.env (recommended)
 */

// If your project references @types/node directly (in you) or indirectly (as in RxJS < 7.6.0),
// you might need to use the following declaration merging.
declare namespace NodeJS {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface ProcessEnv extends ImportMetaEnv {
    // do nothing
  }
}

// If you're using Angular Universal and process.env notation, you'll need to add the following to your tsconfig.server.json:
/* In your tsconfig.server.json */
// {
//   "extends": "./tsconfig.app.json",
//   ...
//   "exclude": [
//     "src/env.d.ts"
//   ]
// }

/*********************************************************************/
