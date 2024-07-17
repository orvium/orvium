import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { AuthenticationService } from './auth/authentication.service';
import { OidcSecurityService } from 'angular-auth-oidc-client';
import { provideHttpClient, withFetch, withInterceptorsFromDi } from '@angular/common/http';

/**
 * Configuration object for the server-side rendering setup of the application. This configuration specifies
 * various services and their implementations that the server-side rendering environment will utilize.
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideHttpClient(withInterceptorsFromDi(), withFetch()),
    { provide: AuthenticationService, useValue: {} },
    { provide: OidcSecurityService, useValue: {} },
  ],
};

/**
 * Merges the server-specific configuration with the main application configuration to create a combined
 * runtime configuration for the application. This is essential for environments where server-side rendering
 * is enabled, ensuring all services are configured properly.
 */
export const config = mergeApplicationConfig(appConfig, serverConfig);
