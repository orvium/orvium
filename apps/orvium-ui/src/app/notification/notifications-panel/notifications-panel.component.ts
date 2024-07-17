import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { SidenavService } from '../../services/sidenav.service';
import { NotificationService } from '../notification.service';
import { NavigationStart, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { AppNotificationDTO } from '@orvium/api';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatToolbarModule } from '@angular/material/toolbar';
import { DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DateAgoPipe } from '../../shared/custom-pipes/date-ago.pipe';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component responsible for displaying and managing user notifications.
 * Utilizes a range of Material Design components to render a list of notifications,
 * supporting interactions like deletion and navigation based on the notification action.
 */
@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss'],
  imports: [
    MatToolbarModule,
    MatIconModule,
    RouterLink,
    NgClass,
    MatBadgeModule,
    MatTooltipModule,
    DatePipe,
    DateAgoPipe,
    MatDividerModule,
    MatButtonModule,
  ],
})
export class NotificationsPanelComponent implements OnInit {
  /** Stores an array of notification data objects. */
  notifications: AppNotificationDTO[] = [];

  /** Manages the lifecycle of subscriptions to avoid memory leaks. */
  private destroyRef = inject(DestroyRef);

  /**
   * Constructs the NotificationsPanelComponent.
   *
   * @param {SidenavService} sidenavService - Service to control side navigation panels.
   * @param {NotificationService} notificationService - Service to fetch and manage user notifications.
   * @param {Router} router - Angular Router service to manage navigation actions triggered from notifications.
   */
  constructor(
    private sidenavService: SidenavService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  /**
   * Initializes the component by subscribing to notification updates and router events.
   * Automatically closes the right-hand side navigation when a navigation start event occurs.
   */
  ngOnInit(): void {
    this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        map(() => this.sidenavService.closeRight()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Handles the deletion of a notification from the list. It first marks the notification as read
   * and then optionally navigates based on the notification's action URL, if provided.
   *
   * @param {number} index The index of the notification in the list to be deleted.
   * @param {MouseEvent | KeyboardEvent} $event The event object to prevent propagation.
   */
  deleteNotification(index: number, $event: MouseEvent | KeyboardEvent): void {
    this.notificationService.readNotification(this.notifications[index]._id).subscribe(() => {
      const notification = this.notifications[index];
      if (notification.action) {
        void this.router.navigateByUrl(notification.action);
      }
      this.notifications.splice(index, 1);
    });
    $event.stopPropagation();
  }
}
