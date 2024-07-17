import { Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../environments/environment';
import { TopDisciplinesQuery } from '../model/orvium';
import { ProfileService } from '../profile/profile.service';
import {
  CommunityPopulatedDTO,
  DefaultService,
  DepositPopulatedDTO,
  SubscriptionType,
  UserPrivateDTO,
} from '@orvium/api';
import { SeoTagsService } from '../services/seo-tags.service';
import { AuthenticationService } from '../auth/authentication.service';
import { InviteService } from '../services/invite.service';
import { tap } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { CommunityService } from '../communities/community.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ShareMediaComponent } from '../shared/share-media/share-media.component';
import { DepositsListComponent } from '../deposits/deposits-list/deposits-list.component';
import { OverlayLoadingDirective } from '../spinner/overlay-loading.directive';
import { CommunityCardComponent } from '../communities/community-card/community-card.component';
import { DialogService } from '../dialogs/dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * A component for displaying the home page of the platform, featuring deposits, top disciplines,
 * and premium communities. Provides search capabilities and access to detailed pages for individual disciplines
 * and communities. Also handles SEO tags for better search engine visibility.
 */
@Component({
  selector: 'app-papers-search',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TitleCasePipe,
    RouterLink,
    MatCardModule,
    ShareMediaComponent,
    DepositsListComponent,
    OverlayLoadingDirective,
    CommunityCardComponent,
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  /** router Angular Router for navigation */
  private router = inject(Router);
  /** seoTagsService Service for setting SEO tags */
  private seoTagsService = inject(SeoTagsService);
  /** apiService Service for API calls */

  public apiService = inject(DefaultService);
  /** profileService Service for retrieving user profiles */

  private profileService = inject(ProfileService);
  /** route Activated route to access route parameters */

  private route = inject(ActivatedRoute);
  /** authenticationService Service for handling user authentication */

  public authenticationService = inject(AuthenticationService);
  /** inviteService Service for managing invitations */

  private inviteService = inject(InviteService);
  /** dialogService Service for opening dialog windows */

  public dialogService = inject(DialogService);
  /** rcommunityService Service for community-related operations */

  public communityService = inject(CommunityService);

  /** Array of deposits displayed on the home page */
  deposits: DepositPopulatedDTO[] = [];

  /** User profile data, if the user is logged in */
  profile?: UserPrivateDTO;

  /** Contains environment variables for the application */
  environment = environment;
  showFeaturedCommunities = environment.showFeaturedCommunities;

  /** Array of featured communities displayed on the home page */
  featuredCommunities: CommunityPopulatedDTO[] = [];

  /** Array of top disciplines based on some criteria such as popularity */
  topDisciplines: TopDisciplinesQuery[] = [];

  /** Array of class names for styling chips */
  chipClass: string[] = ['orv-chip-secondary', 'orv-chip-yellow', 'orv-chip-pink', 'orv-chip-blue'];

  /** Boolean flag to show if the deposits are currently being loaded */
  depositsLoading = false;

  /** Reference to the destroy service to clean up subscriptions */
  private destroyRef = inject(DestroyRef);

  /**
   * Initializes the component by setting up SEO tags and loading deposits, communities, and top disciplines.
   */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => (this.depositsLoading = true)),
        concatMap(depositsQuery => this.apiService.getDeposits({ hasReviews: true })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(depositsQuery => {
        this.deposits = depositsQuery.deposits;
        this.depositsLoading = false;
      });

    this.seoTagsService.setGeneralSeo(
      'Home',
      'A web platform that accelerates science by improving the scientific validation process and reducing publication time.'
    );
    this.seoTagsService.setOpengraphTags(
      'Home',
      'A web platform that accelerates science by improving the scientific validation process and reducing publication time.',
      environment.publicUrl
    );

    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });

    this.apiService.getCommunities().subscribe(communities => {
      this.featuredCommunities = communities
        .filter(community => community.subscription === SubscriptionType.Premium)
        .reverse();
    });

    this.apiService.getTopDisciplines().subscribe(topDisciplines => {
      this.topDisciplines = topDisciplines;
    });
  }

  /**
   * Cleans up subscriptions when the component is destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.seoTagsService.removeTagsAndCanonical();
  }

  /**
   * Opens an invite dialog.
   */
  openInviteDialog(): void {
    this.inviteService.openInviteDialog();
  }

  /**
   * Handles navigation to the search page based on a discipline.
   * @param discipline The discipline to search for
   */
  searchByDiscipline(discipline: string): void {
    void this.router.navigate(['/search'], {
      queryParams: { discipline: discipline, size: 10 },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Handles the creation of a community or prompts the user to log in.
   */
  createCommunityOrLogin(): void {
    if (!this.profile) {
      this.authenticationService.login();
    } else {
      this.communityService.createCommunityDialog();
    }
  }

  /**
   * Opens a video modal for displaying a promotional or informational video.
   */
  openVideo(): void {
    this.dialogService.openVideo({
      videoUrl:
        'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/781ba680-a6d3-43f9-b0b2-4e5c62d93d2f/versions/12/transfers/target_transfer.mp4',
      videoType: 'video/mp4',
    });
  }
}
