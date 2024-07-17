import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { BlockchainService } from './blockchain/blockchain.service';
import { StructuredDataService } from './services/structured-data.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import {
  faFile,
  faFileCode,
  faFileCsv,
  faFileImage,
  faFilePdf,
  faFileWord,
  faLeaf,
} from '@fortawesome/free-solid-svg-icons';
import {
  faCreativeCommons,
  faCreativeCommonsBy,
  faCreativeCommonsNd,
  faCreativeCommonsZero,
  faEthereum,
  faFacebook,
  faGithub,
  faLinkedin,
  faOrcid,
  faXTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { SwPush, SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ProfileService } from './profile/profile.service';
import { DefaultService, PushSubscriptionCreateDTO, UserPrivateDTO } from '@orvium/api';
import { NotificationService } from './notification/notification.service';
import { BannerService } from './banner/banner.service';
import { Router } from '@angular/router';
import { BannerData } from './banner/interfaces/banner-data';
import { ProgressBarService } from './services/progress-bar.service';
import { filter, map, takeWhile } from 'rxjs/operators';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DialogService } from './dialogs/dialog.service';
import { isNotNullOrUndefined } from './shared/shared-functions';
import { FooterComponent } from './layout/footer/footer.component';
import { SideNavComponent } from './layout/side-nav/side-nav.component';
import { BannerPanelComponent } from './banner/banner-panel/banner-panel.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ToolbarComponent } from './layout/toolbar/toolbar.component';
import { MatIconRegistry } from '@angular/material/icon';

/**
 * Root component of the application, managing global functionality including authentication,
 * profile fetching, service worker updates, and subscription to push notifications.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    ToolbarComponent,
    MatProgressBarModule,
    BannerPanelComponent,
    SideNavComponent,
    FooterComponent,
  ],
})
export class AppComponent implements OnInit {
  /** User's profile data, fetched from the server. */
  public profile?: UserPrivateDTO;

  /** Data for displaying a dynamic informational or promotional banner at the top of the application. */
  public bannerInfo?: BannerData;

  /**
   * Constructs the AppComponent with necessary dependencies.
   *
   * @param apiService Service for API calls to the backend.
   * @param profileService Service for managing user profile data.
   * @param blockchainService Service for blockchain interactions.
   * @param structuredDataService Service for structured data for SEO.
   * @param notificationService Service for handling application notifications.
   * @param metaService Service to update HTML meta tags.
   * @param faIconLibrary Library to manage FontAwesome icons.
   * @param swPush Service to handle browser push notifications.
   * @param swUpdate Service to handle service worker updates.
   * @param dialogService Service to manage dialogs.
   * @param bannerService Service to manage application banners.
   * @param router Angular Router for navigating between routes.
   * @param oidcSecurityService Service for OpenID Connect security operations.
   * @param iconRegistry Service to manage Material icons.
   * @param progressBarService Service to display progress bars.
   * @param platformId Token indicating the platform id.
   * @param document Document in which the application is running.
   */
  constructor(
    private apiService: DefaultService,
    private profileService: ProfileService,
    private blockchainService: BlockchainService,
    private structuredDataService: StructuredDataService,
    private notificationService: NotificationService,
    private metaService: Meta,
    private faIconLibrary: FaIconLibrary,
    private swPush: SwPush,
    private swUpdate: SwUpdate,
    private dialogService: DialogService,
    private bannerService: BannerService,
    private router: Router,
    private oidcSecurityService: OidcSecurityService,
    private iconRegistry: MatIconRegistry,
    public progressBarService: ProgressBarService,
    @Inject(PLATFORM_ID) private platformId: string,
    @Inject(DOCUMENT) private document: Document
  ) {}

  /**
   * Initialize the component by setting up SEO tags, checking authentication, and managing service worker updates.
   * Also initializes global icon registry and checks for the availability of updates using service workers.
   */
  ngOnInit(): void {
    if (!environment.production) {
      this.metaService.addTag({ name: 'robots', content: 'noindex' });
    }
    this.iconRegistry.setDefaultFontSetClass('material-symbols-outlined');

    this.bannerService.bannerInfo$.subscribe(data => (this.bannerInfo = data));

    if (isPlatformBrowser(this.platformId)) {
      this.oidcSecurityService.checkAuth().subscribe((loginResponse: LoginResponse | null) => {
        // LoginResponse can be null even if checkAuth typing says otherwise
        if (loginResponse && loginResponse.isAuthenticated) {
          this.profileService.getProfileFromApi().subscribe();
          const previousRoute = sessionStorage.getItem('beforeLoginRoute');
          if (previousRoute) {
            sessionStorage.removeItem('beforeLoginRoute');
            void this.router.navigateByUrl(previousRoute);
          }
        }
      });
      const favIcon: HTMLLinkElement | null = this.document.querySelector('#favicon');
      if (favIcon) favIcon.href = `${environment.publicS3}/platform/media/favicon`;
    }

    if (this.swUpdate.isEnabled) {
      const updatesAvailable = this.swUpdate.versionUpdates.pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
        map(evt => ({
          type: 'UPDATE_AVAILABLE',
          current: evt.currentVersion,
          available: evt.latestVersion,
        }))
      );
      updatesAvailable.subscribe(evt => {
        let contentText = 'We have an update. Please refresh this page to get the latest update. ';
        if (environment.experimentalFeatures) {
          contentText = contentText.concat(
            `New version is ${evt.available.hash} (previously ${evt.current.hash})`
          );
        }
        this.dialogService
          .openAlert({
            title: 'New version available',
            content: contentText,
            acceptMessage: 'Refresh',
            disableClose: true,
          })
          .afterClosed()
          .pipe(isNotNullOrUndefined())
          .subscribe(accept => {
            if (accept && this.document.defaultView) {
              this.document.defaultView.location.reload();
            }
          });
      });
    }

    this.blockchainService.initNetworks();

    // Add an icon to the library for convenient access in other components
    this.faIconLibrary.addIcons(
      faFileWord,
      faFilePdf,
      faFileCsv,
      faFileImage,
      faFile,
      faFileCode,
      faLeaf,
      faXTwitter,
      faFacebook,
      faLinkedin,
      faOrcid,
      faEthereum,
      faCreativeCommons,
      faCreativeCommonsZero,
      faCreativeCommonsBy,
      faCreativeCommonsNd,
      faGithub
    );

    let subscribed = true;

    this.structuredDataService.insertOrganizationSchema();
    this.structuredDataService.insertWebsiteSchema();

    this.profileService
      .getProfile()
      .pipe(takeWhile(() => subscribed))
      .subscribe(profile => {
        if (profile) {
          this.profile = profile;
          subscribed = false;

          if (!profile.isOnboarded) {
            void this.router.navigate(['profile', 'onboarding']);
          }

          this.notificationService.initAppNotificationsPolling();
          this.profileService.initAppConversationsPolling();

          if (this.swPush.isEnabled) {
            this.swPush.subscription.subscribe(subscription => {
              if (subscription) {
                this.profileService.pushNotifications.next(true);
              } else {
                this.profileService.pushNotifications.next(false);
                void this.subscribeToNotifications();
              }
            });
          }
        }
      });
  }

  /**
   * Subscribe to push notifications.
   * Requests permission to send notifications to the user and subscribes to push notifications.
   */
  async subscribeToNotifications(): Promise<void> {
    const subscription = await this.swPush.requestSubscription({
      serverPublicKey: environment.vapidPublicKey,
    });
    this.apiService
      .createPushNotificationsSubscription({
        pushSubscriptionCreateDTO: subscription.toJSON() as unknown as PushSubscriptionCreateDTO,
      })
      .subscribe();
  }
}
