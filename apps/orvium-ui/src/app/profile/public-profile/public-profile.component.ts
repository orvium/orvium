import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { ShareService } from 'ngx-sharebuttons';
import { REVIEWDECISION_LOV } from '../../model/orvium';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { ProfileService } from '../profile.service';
import {
  DefaultService,
  DepositPopulatedDTO,
  FeedbackDTO,
  ReviewPopulatedDTO,
  UserPrivateDTO,
  UserPublicDTO,
} from '@orvium/api';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { SeoTagsService } from '../../services/seo-tags.service';
import { environment } from '../../../environments/environment';
import { concatMap, finalize, map } from 'rxjs/operators';
import { MatExpansionModule } from '@angular/material/expansion';
import { Benefit, BenefitComponent } from '../../shared/benefit/benefit.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ShareMediaComponent } from '../../shared/share-media/share-media.component';
import { HeaderComponent } from '../../shared/header/header.component';
import { FeedbackDirective } from '../../shared/feedback/feedback.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SeparatorPipe } from '../../shared/custom-pipes/separator.pipe';
import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { ReviewCardComponent } from '../../review/review-card/review-card.component';
import { DialogService } from '../../dialogs/dialog.service';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { isNotNullOrUndefined } from '../../shared/shared-functions';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';

/**
 * Component responsible for displaying a user's public profile, which includes their benefits, deposits, and reviews.
 * This component also allows for sharing and managing public profile visibility.
 */
@Component({
  selector: 'app-public-profile',
  standalone: true,
  templateUrl: './public-profile.component.html',
  styleUrls: ['./public-profile.component.scss'],
  imports: [
    MatExpansionModule,
    BenefitComponent,
    MatTabsModule,
    MatListModule,
    MatMenuModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    NgTemplateOutlet,
    ShareMediaComponent,
    HeaderComponent,
    FeedbackDirective,
    MatTooltipModule,
    SeparatorPipe,
    DepositsListComponent,
    OverlayLoadingDirective,
    ReviewCardComponent,
    AvatarDirective,
    ButtonsMenuComponent,
  ],
})
export class PublicProfileComponent implements OnInit, OnDestroy {
  /**
   * List of benefits to display, each with a title, icon, and description.
   */
  benefits: Benefit[] = [
    {
      title: 'Transparent',
      icon: 'workspaces',
      description:
        'In <b>contrast to</b> traditional peer review process characterized by being anonymous, selective, and opaque.',
    },
    {
      title: 'Interactive',
      icon: 'animation',
      description:
        'Open peer review makes the identities of the authors and reviewers public, thus, they can <b>interact and talk</b> to each other.',
    },
    {
      title: 'Available',
      icon: 'all_inclusive',
      description:
        'Peer Reviews are available for everyone <b>without barriers</b> making science free and accessible for the sake of science and society.',
    },
  ];

  /** Array of class names to apply to benefit components for styling purposes. */
  highlightClass: ('pink' | 'green' | 'purple')[] = ['pink', 'green', 'purple'];

  /** The name of the user, displayed as part of the profile header. */
  name = 'User';

  /** Template reference to a share dialog component, used for sharing the profile. */
  @ViewChild('shareDialogTemplate') shareDialogTemplate!: TemplateRef<unknown>;

  /** The public profile details of the user. */
  publicProfile?: UserPublicDTO;

  /** The public profile details of the user. */
  deposits: DepositPopulatedDTO[] = [];

  /** List of reviews written by the user. */
  reviews: ReviewPopulatedDTO[] = [];

  /** The current user's private profile details, if available. */
  profile?: UserPrivateDTO;

  /** The text used for sharing the profile. */
  shareText = 'Share this!';

  /** Indicator for mobile device display. */
  isMobile = false;

  /** Determines if the current user can update the public user's profile. */
  canUpdateUser = false;

  /** Indicates whether the profile data is currently being loaded. */
  loadingProfile = true;

  /** Optional routing link for starting a conversation, based on user permissions and roles. */
  conversationLink?: { routerLink: string; queryParam: Params };

  /** Reference to global environment variables. */
  environment = environment;

  /** Utility reference for managing component lifecycle events and subscriptions. */
  private destroyRef = inject(DestroyRef);

  /**
   * Constructs the PublicProfileComponent instance, initializing dependencies.
   *
   * @param {ShareService} share - Service for handling share functionality.
   * @param {ActivatedRoute} route - The active route that provides access to route-specific data.
   * @param {Router} router - The service for navigating among views and URLs.
   * @param {DefaultService} apiService - Service for API calls to the backend.
   * @param {SeoTagsService} seoTagsService - Service for managing SEO tags.
   * @param {ProfileService} profileService - Service for handling user profile operations.
   * @param {AppSnackBarService} snackBar - Service for displaying snack bar notifications.
   * @param {BreakpointObserver} breakpointObserver - Service for responding to media query changes.
   * @param {DialogService} dialogService - Service for opening modal dialogs.
   */
  constructor(
    public share: ShareService,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: DefaultService,
    private seoTagsService: SeoTagsService,
    private profileService: ProfileService,
    private snackBar: AppSnackBarService,
    public breakpointObserver: BreakpointObserver,
    public dialogService: DialogService
  ) {}

  /**
   * Initializes the component by setting up profile retrieval and handling route parameters for loading public profiles.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
    this.route.paramMap
      .pipe(
        map(params => params.get('nickname')),
        isNotNullOrUndefined(),
        concatMap(nickname =>
          this.apiService.getPublicProfile({ nickname: nickname }).pipe(
            finalize(() => {
              this.loadingProfile = false;
            })
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(publicProfile => {
        this.publicProfile = publicProfile;
        this.shareText = `Share <b>${this.publicProfile.firstName}'s profile</b> in your social media`;
        this.refreshActions(this.publicProfile);
        this.apiService.getDeposits({ creator: this.publicProfile._id }).subscribe(query => {
          this.deposits = query.deposits;
        });
        this.apiService
          .getReviews({ depositId: '', creator: this.publicProfile._id })
          .subscribe(response => {
            this.reviews = response;
            for (const review of this.reviews) {
              const decision = REVIEWDECISION_LOV.find(x => x.value === review.decision);
              if (decision) {
                // TODO check why was decision.viewValue??
                review.decision = decision.value;
              }
            }
          });
        this.setSEOTags(this.publicProfile);
        this.conversationLink = this.profileService.getConversationLink(this.publicProfile._id);
      });

    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });
  }

  ngOnDestroy(): void {
    this.seoTagsService.removeTagsAndCanonical();
  }

  /**
   * Sets SEO tags based on the user's public profile information.
   *
   * @param profile - The user's public profile data.
   */
  public setSEOTags(profile: UserPublicDTO): void {
    const title = `${profile.firstName} ${profile.lastName} | Orvium profile`;
    this.seoTagsService.setGeneralSeo(
      title,
      profile.aboutMe ?? `${profile.nickname} Orvium user public profile.`
    );
    this.seoTagsService.setOpengraphTags(
      `Browse ${profile.firstName} ${profile.lastName} Orvium profile`,
      `Discover ${profile.firstName} ${profile.lastName} in Orvium`,
      environment.publicUrl + this.router.url
    );
  }

  /**
   * Refreshes UI components based on user's permissions and roles.
   *
   * @param user - User's public profile data.
   */
  refreshActions(user: UserPublicDTO): void {
    this.canUpdateUser = this.profileService.canUpdateUser(user);
  }

  /**
   * Opens the share dialog.
   */
  openShare(): void {
    this.dialogService.openCustom({
      template: this.shareDialogTemplate,
      showActionButtons: false,
    });
  }

  /**
   * Sends feedback based on user interactions.
   *
   * @param event - Event containing feedback data.
   */
  report(event: object): void {
    const feedback = event as FeedbackDTO;
    this.apiService.createFeedback({ feedbackDTO: feedback }).subscribe(() => {
      this.snackBar.info('Thank you for your feedback!');
    });
  }
}
