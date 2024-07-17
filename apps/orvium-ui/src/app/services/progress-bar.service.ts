import { DestroyRef, inject, Injectable } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Service to manage the display of a progress bar during navigation events in an Angular application.
 */
@Injectable({
  providedIn: 'root',
})
export class ProgressBarService {
  /** Publicly accessible property indicating whether the progress bar should be shown. */
  public isShown = false;

  /** A reference to the destroy service to manage subscription clean-up. */
  private destroyRef = inject(DestroyRef);

  /**
   * Constructs the ProgressBarService and subscribes to the router events to manage the progress bar visibility.
   *
   * @param {Router} router - The Angular Router service used to subscribe to navigation events.
   */
  constructor(private router: Router) {
    this.router.events
      .pipe(
        tap((event): void => {
          if (event instanceof NavigationStart) {
            this.isShown = true;
          }
          if (event instanceof NavigationEnd) {
            this.isShown = false;
          }
          if (event instanceof NavigationCancel) {
            this.isShown = false;
          }
          if (event instanceof NavigationError) {
            this.isShown = false;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
