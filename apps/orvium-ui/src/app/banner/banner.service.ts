import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { BannerData } from './interfaces/banner-data';
import { take } from 'rxjs/operators';

/**
 * Service to manage display and interactions of banners within the application.
 * Provides methods to show and dismiss banners, and to handle user actions on these banners.
 */
@Injectable({ providedIn: 'root' })
export class BannerService {
  /** BehaviorSubject to store and emit the current banner data. Undefined when no banner is displayed. */
  bannerInfo$ = new BehaviorSubject<BannerData | undefined>(undefined);

  /** Subject to emit banner action results. Emits a boolean indicating the user's interaction. */
  actionSubject$ = new Subject<boolean>();

  /**
   * Displays a banner with specified text and button text, and returns an Observable that emits the result of the user action.
   *
   * @param {string} text - The text to be displayed on the banner.
   * @param {string} buttonText - The text to be displayed on the button in the banner.
   * @returns {Observable<boolean>} An Observable that emits true if the user clicks the button, otherwise false.
   */
  showBanner(text: string, buttonText: string): Observable<boolean> {
    this.bannerInfo$.next({ text, buttonText });
    return this.actionSubject$.pipe(take(1));
  }

  /**
   * Dismisses the currently displayed banner.
   */
  dismissBanner(): void {
    this.actionSubject$.next(false);
    this.bannerInfo$.next(undefined);
  }

  /** Handles user interaction with the banner's button. */
  onAction(): void {
    this.actionSubject$.next(true);
    this.bannerInfo$.next(undefined);
  }
}
