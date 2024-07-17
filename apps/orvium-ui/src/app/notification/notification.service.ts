import { ApplicationRef, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, concat, Observable, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { first, retry, switchMap, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { ProfileService } from '../profile/profile.service';
import { AppNotificationDTO } from '@orvium/api';

/**
 * Service to manage and handle notifications within the application. It provides functionality to fetch notifications,
 * start polling for new notifications upon certain conditions, and mark notifications as read.
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  /** A BehaviorSubject to store and emit the current list of notifications. */
  private notifications = new BehaviorSubject<AppNotificationDTO[]>([]);

  /**
   * Constructs the NotificationService with necessary dependencies.
   *
   * @param {HttpClient} http - The Angular HTTP client service used for making API calls.
   * @param {ApplicationRef} appRef - The Angular application reference to check if the application is stable.
   * @param {ProfileService} profileService - Service to manage user profile data.
   * @param {string} platformId - A token that indicates the platform ID, used to check if running in a browser.
   */
  constructor(
    private http: HttpClient,
    private appRef: ApplicationRef,
    private profileService: ProfileService,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /**
   * Initializes the polling for notifications when the application is stable and the user profile is loaded.
   * Polling occurs at specific intervals defined within the method.
   */
  initAppNotificationsPolling(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const appIsStable = this.appRef.isStable.pipe(first(isStable => isStable));
    const profileLogged = this.profileService
      .getProfile()
      .pipe(first(profile => profile !== undefined));
    const notificationsPolling = timer(1000, 200000).pipe(
      switchMap(tick => this.getNotificationsFromApi()),
      retry(2),
      tap(notifications => {
        // Update notifications observable
        if (
          notifications.length > 0 &&
          JSON.stringify(notifications) !== JSON.stringify(this.notifications.getValue())
        ) {
          this.notifications.next(notifications);
        }
      })
    );

    // We subscribe to these observable in order, and they are resolved sequentially
    // First wait for the app is stable, then get profile, last get notifications
    concat(appIsStable, profileLogged, notificationsPolling).subscribe();
  }

  /**
   * Marks a specific notification as read by sending a PATCH request to the server.
   *
   * @param {string} notificationId - The unique identifier of the notification to be marked as read.
   * @returns {Observable<AppNotificationDTO>} An observable containing the updated notification data.
   */
  readNotification(notificationId: string): Observable<AppNotificationDTO> {
    return this.http.patch<AppNotificationDTO>(
      `${environment.apiEndpoint}/notifications/${notificationId}/read`,
      null
    );
  }

  /**
   * Retrieves the BehaviorSubject that emits the list of notifications.
   *
   * @returns {BehaviorSubject<AppNotificationDTO[]>} The BehaviorSubject that emits current notifications.
   */
  getNotifications(): BehaviorSubject<AppNotificationDTO[]> {
    return this.notifications;
  }

  /**
   * Fetches notifications from the API.
   *
   * @returns {Observable<AppNotificationDTO[]>} An observable containing the list of notifications.
   */
  private getNotificationsFromApi(): Observable<AppNotificationDTO[]> {
    return this.http.get<AppNotificationDTO[]>(
      `${environment.apiEndpoint}/notifications/myNotifications`
    );
  }
}
