import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { browserTracingIntegration, createErrorHandler, init } from '@sentry/angular';
import { environment } from '../../environments/environment';
import { AppSnackBarService } from './app-snack-bar.service';
import { isPlatformBrowser } from '@angular/common';

init({
  dsn: environment.sentry.dsn,
  environment: environment.name,
  release: environment.version,
  integrations: [
    // Registers and configures the Tracing integration,
    // which automatically instruments your application to monitor its
    // performance, including custom Angular routing instrumentation
    browserTracingIntegration(),
  ],
  tracesSampleRate: environment.sentry.tracesSampleRate,
});

/**
 * Implement a Angular's ErrorHandler provider that can be used as a drop-in replacement for the stock one.
 */
@Injectable()
export class SentryErrorHandler implements ErrorHandler {
  private sentryLogger = createErrorHandler({ showDialog: false, logErrors: true });

  public constructor(
    private snackBar: AppSnackBarService,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /**
   * Method called for every value captured through the ErrorHandler
   */
  public handleError(error: unknown): void {
    if (isPlatformBrowser(this.platformId)) {
      // Custom code for Orvium
      if (error instanceof HttpErrorResponse) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.error.message) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
          this.snackBar.error(error.error.message);
        }
      }

      this.sentryLogger.handleError(error);
    }
  }
}
