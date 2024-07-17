import { ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import { AuthConfigModule } from './auth/auth-config.module';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  PreloadAllModules,
  provideRouter,
  withInMemoryScrolling,
  withPreloading,
  withRouterConfig,
} from '@angular/router';
import { routes } from './routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS, MatSnackBarModule } from '@angular/material/snack-bar';
import { SentryErrorHandler } from './services/error-handler.service';
import { MAT_TOOLTIP_DEFAULT_OPTIONS } from '@angular/material/tooltip';
import { MAT_CHIPS_DEFAULT_OPTIONS } from '@angular/material/chips';
import { ENTER } from '@angular/cdk/keycodes';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { DateHttpInterceptor } from './date-http.interceptor';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { MatDialogModule } from '@angular/material/dialog';
import { LoggerModule } from 'ngx-logger';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApiModule, Configuration, ConfigurationParameters } from '@orvium/api';
import { provideClientHydration, withI18nSupport } from '@angular/platform-browser';

/**
 * Factory function to create a new configuration object for the API module. This configuration is used to
 * initialize the API endpoint settings based on the current environment settings.
 */
export function apiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: environment.apiEndpoint.replace('/api/v1', ''),
  };
  return new Configuration(params);
}

/**
 * The main configuration object for the application, configuring providers and modules required globally.
 * This setup includes authentication, material components, logging, API integration, and more, ensuring
 * that all essential services are properly configured and available throughout the app.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      AuthConfigModule,
      MatSnackBarModule,
      MatDialogModule,
      MatNativeDateModule,
      LoggerModule.forRoot({
        level: environment.logLevel,
        disableConsoleLogging: false,
        enableSourceMaps: true,
      }),
      ClipboardModule,
      FontAwesomeModule,
      ApiModule.forRoot(apiConfigFactory)
    ),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
      }),
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    provideClientHydration(withI18nSupport()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.serviceWorker,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000',
    }),
    {
      provide: ErrorHandler,
      useClass: SentryErrorHandler,
    },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000 } },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: { showDelay: 100 } },
    {
      provide: MAT_CHIPS_DEFAULT_OPTIONS,
      useValue: {
        separatorKeyCodes: [ENTER],
      },
    },
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false, showError: true },
    },
    { provide: HTTP_INTERCEPTORS, useClass: DateHttpInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
  ],
};
