import {
  Component,
  inject,
  Inject,
  OnInit,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { EthereumService } from '../../blockchain/ethereum.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { SidenavService } from '../../services/sidenav.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { DOCUMENT, isPlatformBrowser, NgClass, SlicePipe } from '@angular/common';
import { NotificationService } from '../../notification/notification.service';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { AppNotificationDTO, DefaultService, UserPrivateDTO } from '@orvium/api';
import { AuthenticationService } from '../../auth/authentication.service';
import { lastValueFrom } from 'rxjs';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { environment } from '../../../environments/environment';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { CreatePublicationDialogComponent } from '../../dialogs/create-publication-dialog/create-publication-dialog.component';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { NotificationsPanelComponent } from '../../notification/notifications-panel/notifications-panel.component';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';
import { ProfileMenuComponent } from '../../profile/profile-menu/profile-menu.component';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogService } from '../../dialogs/dialog.service';
import { CustomDialogComponent } from '../../dialogs/custom-dialog/custom-dialog.component';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { THEMES, ThemeService } from '../../services/theme.service';
import { DialogWrapperComponent } from '../../dialogs/dialog-wrapper/dialog-wrapper.component';
import { BREAKPOINTS } from '../breakpoints';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Represents the main toolbar component in the application, which includes functionality
 * for user interactions such as searching, viewing notifications, managing blockchain connectivity,
 * and more.
 */
@Component({
  selector: 'app-toolbar',
  standalone: true,
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatChipsModule,
    MatDividerModule,
    MatMenuModule,
    CreatePublicationDialogComponent,
    MatBadgeModule,
    MatListModule,
    RouterLinkActive,
    MatSlideToggleModule,
    NotificationsPanelComponent,
    NgClass,
    SlicePipe,
    SearchBarComponent,
    ProfileMenuComponent,
    AvatarDirective,
    FontAwesomeModule,
    MatTooltipModule,
  ],
})
export class ToolbarComponent implements OnInit {
  protected themeService = inject(ThemeService);

  /** Template reference for the dialog used to install MetaMask */
  @ViewChild('installMetaMaskDialogTemplate') installMetaMaskDialogTemplate!: TemplateRef<unknown>;

  /** Template reference for displaying notifications panel */
  @ViewChild('notificationsPanel') notificationsPanel!: TemplateRef<unknown>;

  /** Search input string */
  searchInput = '';

  /** Boolean to check if Ethereum is enabled in the browser */
  ethereumIsEnabled = false;

  /** Array of notifications for the user */
  notifications: AppNotificationDTO[] = [];

  /** Profile of the currently logged-in user */
  profile?: UserPrivateDTO;

  /** Boolean to check if the device is mobile */
  isMobile = false;

  /** Boolean to check if the device is a tablet */
  isTablet = false;

  /** Boolean to check if the logged-in user is an admin */
  isAdmin = false;

  /** Boolean to check if the admin is impersonating another user */
  isImpersonating = false;

  /** Current environment name */
  environmentName: string;

  /** Environment configurations */
  environment = environment;

  /** Search dialog reference */
  private searchDialog?: MatDialogRef<CustomDialogComponent, boolean>;

  /**
   * Constructs the ToolbarComponent with necessary dependencies.
   *
   * @param ethereumService Service to manage Ethereum blockchain interactions.
   * @param router Angular Router for managing navigation.
   * @param breakpointObserver Service to subscribe to media query changes.
   * @param sidenavService Service to manage sidenav states and interactions.
   * @param apiService API service for backend interactions.
   * @param profileService Service to fetch and update user profile data.
   * @param authenticationService Service to manage user authentication.
   * @param snackBar Service to display snack bar notifications.
   * @param themeService Service to manage application themes.
   * @param notificationService Service to fetch and manage notifications.
   * @param dialogService Service to manage custom dialog interactions.
   * @param platformId Platform identifier to check if running on browser or server.
   * @param document DOM document reference.
   */
  constructor(
    public ethereumService: EthereumService,
    public router: Router,
    public breakpointObserver: BreakpointObserver,
    private sidenavService: SidenavService,
    public apiService: DefaultService,
    private profileService: ProfileService,
    public authenticationService: AuthenticationService,
    private snackBar: AppSnackBarService,
    private notificationService: NotificationService,
    public dialogService: DialogService,
    @Inject(PLATFORM_ID) private platformId: string,
    @Inject(DOCUMENT) private document: Document
  ) {
    this.environmentName = environment.name;
  }

  /**
   * Initializes the toolbar component, sets up user profile information, and subscribes to necessary observables.
   */
  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 900px)', BREAKPOINTS.MOBILE])
      .subscribe((state: BreakpointState) => {
        this.isMobile = this.breakpointObserver.isMatched(BREAKPOINTS.MOBILE);
        this.isTablet = this.breakpointObserver.isMatched('(max-width: 900px)');
      });

    if (isPlatformBrowser(this.platformId)) {
      this.profileService.getProfile().subscribe(async profile => {
        this.profile = profile;
        if (this.profile) {
          this.isAdmin = this.profile.roles.includes('admin');
          // Keeps session user data, in case user is impersonating
          const loginResponse = await lastValueFrom(
            this.authenticationService.oidcSecurityService.checkAuth()
          );

          if (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            loginResponse.userData?.sub &&
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
            !this.profile.providerIds.includes(loginResponse.userData?.sub)
          ) {
            this.isImpersonating = true;
          }
        }
      });
    }

    this.notificationService.getNotifications().subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  /**
   * Searches papers based on the provided search value.
   *
   * @param searchValue The search term to query for.
   */
  searchPapers(searchValue: string): void {
    if (this.searchDialog) {
      this.searchDialog.close();
      this.searchDialog = undefined;
    }
    void this.router.navigate(['/search'], {
      queryParams: { query: searchValue, size: 10 },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Switches the blockchain connection status.
   *
   * @param $event Event object containing the status of the toggle.
   */
  switchBlockchain($event: MatSlideToggleChange): void {
    if (this.ethereumService.isAvailable.value) {
      if (!this.ethereumIsEnabled) {
        void this.ethereumService.init().then(value => {
          this.ethereumIsEnabled = value;
          if (value) {
            this.snackBar.info(
              `Connected to ${
                this.ethereumService.currentNetwork.value?.displayName || 'undefined'
              }`
            );
          }
        });
      } else {
        this.ethereumService.close();
        this.ethereumIsEnabled = false;
        this.snackBar.info('Disconnected');
      }
    } else {
      $event.source.checked = false;
      this.dialogService.openCustom({
        template: this.installMetaMaskDialogTemplate,
        showActionButtons: false,
      });
    }
  }

  /**
   * Deletes a notification at the given index.
   *
   * @param index The index of the notification to delete.
   * @param $event The mouse event.
   */
  deleteNotification(index: number, $event: MouseEvent): void {
    this.notificationService.readNotification(this.notifications[index]._id).subscribe(() => {
      this.notifications.splice(index, 1);
    });
    $event.stopPropagation();
  }

  /**
   * Toggles the state of the sidenav.
   */
  async toggleSidenav(): Promise<void> {
    await this.sidenavService.toggle();
  }

  /**
   * Opens the notifications panel in the right sidenav.
   */
  async openNotifications(): Promise<void> {
    this.sidenavService.rightSideComponent = this.notificationsPanel;
    await this.sidenavService.toggleRight();
  }

  /**
   * Opens the publication creation dialog if the user is onboarded and email is confirmed; otherwise, shows an info message.
   */
  create(): void {
    if (!this.profile?.isOnboarded || !!this.profile.emailPendingConfirmation) {
      this.snackBar.info('Complete your profile and confirm your email first');
    } else {
      this.dialogService.open(CreatePublicationDialogComponent);
    }
  }

  /**
   * Changes the theme of the application.
   */
  changeTheme(): void {
    if (this.themeService.theme() === THEMES.light) this.themeService.theme.set(THEMES.dark);
    else this.themeService.theme.set(THEMES.light);

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', this.themeService.theme());
    }
  }

  /**
   * Initiates the login process.
   */
  handleLogin(): void {
    this.authenticationService.login();
  }

  /**
   * Stops the impersonation of another user.
   */
  stopImpersonation(): void {
    this.apiService.stopImpersonation().subscribe(() => {
      this.document.defaultView?.location.reload();
    });
  }

  /**
   * Opens a custom search bar dialog.
   * @param searchBarMobile The template reference for the search bar to be used on mobile devices.
   */
  openSearch(searchBarMobile: TemplateRef<unknown>): void {
    this.searchDialog = this.dialogService.openCustom({
      template: searchBarMobile,
      width: '100%',
      showActionButtons: false,
    });
  }

  /**
   * Opens a dialog to initiate the impersonation process.
   */
  async openImpersonateDialog(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { ImpersonateProfileComponent } = await import(
      '../../admin/impersonate-profile/impersonate-profile.component'
    );

    this.dialogService.open(DialogWrapperComponent, {
      data: {
        title: 'Impersonate',
        component: ImpersonateProfileComponent,
      },
    });
  }

  protected readonly THEMES = THEMES;
}
