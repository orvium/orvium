import { Component, OnDestroy, OnInit } from '@angular/core';
import { PermissionsDTO, CommunityPopulatedDTO, DefaultService, UserPrivateDTO } from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import { Router, RouterLink } from '@angular/router';
import { SeoTagsService } from '../../services/seo-tags.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs/operators';
import { CommunityService } from '../community.service';
import { AuthenticationService } from '../../auth/authentication.service';

import { MatButtonModule } from '@angular/material/button';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { CommunityCardComponent } from '../community-card/community-card.component';
import { DialogService } from '../../dialogs/dialog.service';

/**
 * Component for providing an overview of communities available on the platform. It includes functionalities
 * such as displaying a list of communities, managing SEO tags, and handling community creation based on user permissions.
 */
@Component({
  selector: 'app-communities-overview',
  standalone: true,
  templateUrl: './communities-overview.component.html',
  styleUrls: ['./communities-overview.component.scss'],
  imports: [MatButtonModule, OverlayLoadingDirective, CommunityCardComponent, RouterLink],
})
export class CommunitiesOverviewComponent implements OnInit, OnDestroy {
  /**
   * An array of community objects. These objects contain detailed information about each community.
   */
  communities: CommunityPopulatedDTO[] = [];

  /**
   * The profile information of the currently logged-in user.
   */
  profile?: UserPrivateDTO;

  /**
   * Access to environment variables, commonly used to retrieve configuration settings.
   */
  environment = environment;

  /**
   * A boolean flag indicating whether the community data is still being loaded.
   */
  loadingCommunities = true;

  /**
   * An object containing the permissions for the current user
   */
  permissions?: PermissionsDTO;

  /**
   * A boolean  determined by checking the 'create' permission in the user's permissions set specifically for community creation.
   */
  canCreateCommunity = false;

  /**
   *
   * @param {DefaultService} apiService - Service for API interactions, particularly for fetching and managing community data.
   * @param {SeoTagsService} seoTagsService - Service for setting and removing SEO tags to enhance page metadata for search engines.
   * @param {ProfileService} profileService - Service for fetching and managing the user's profile information.
   * @param {Router} router - Angular's Router service used for navigation and URL management.
   * @param {DialogService} dialogService - Service for managing dialog interactions within the component.
   * @param {CommunityService} communityService - Service dedicated to community creation and management functionalities.
   * @param {AuthenticationService} authenticationService - Service for handling user authentication processes.
   */
  constructor(
    private apiService: DefaultService,
    private seoTagsService: SeoTagsService,
    private profileService: ProfileService,
    private router: Router,
    public dialogService: DialogService,
    public communityService: CommunityService,
    public authenticationService: AuthenticationService
  ) {}

  /**
   * Initializes the component by setting SEO tags and fetching community data. It also manages user permissions for community creation.
   */
  ngOnInit(): void {
    this.seoTagsService.setGeneralSeo('Communities', 'Orvium communities');
    this.seoTagsService.setOpengraphTags(
      'Communities',
      'Discover the many communities',
      environment.publicUrl + this.router.url
    );
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });

    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });

    this.apiService
      .getCommunities()
      .pipe(
        finalize(() => {
          this.loadingCommunities = false;
        })
      )
      .subscribe(communities => {
        this.communities = communities;
        this.orderCommunities();
      });

    if (this.profile) {
      this.apiService.getPermissions().subscribe(permissions => {
        this.permissions = permissions;
        this.canCreateCommunity = this.permissions.community.includes('create');
      });
    }
  }

  /**
   * Initializes the component by setting SEO tags and fetching community data. It also manages user permissions for community creation.
   */
  ngOnDestroy(): void {
    this.seoTagsService.removeTagsAndCanonical();
  }

  /**
   * Sorts the communities array based on the number of views in descending order.
   */
  orderCommunities(): void {
    this.communities = this.communities.sort((n1, n2) => {
      return n2.views - n1.views;
    });
  }

  /**
   * Handles the logic for creating a new community or prompting the user to log in, based on their authentication status.
   */
  createCommunityOrLogin(): void {
    if (!this.profile) {
      this.authenticationService.login();
    } else {
      this.communityService.createCommunityDialog();
    }
  }
}
