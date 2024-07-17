import { Component, OnInit } from '@angular/core';

import { CommunityCardComponent } from '../community-card/community-card.component';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { CommunityDTO, DefaultService } from '@orvium/api';
import { finalize } from 'rxjs/operators';

/**
 * Component responsible for displaying the communities associated with the current user.
 * It fetches and lists all the communities that the user is a part of, showing relevant information for each.
 */
@Component({
  selector: 'app-my-comunities',
  standalone: true,
  imports: [
    CommunityCardComponent,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    OverlayLoadingDirective,
  ],
  templateUrl: './my-comunities.component.html',
  styleUrls: ['./my-comunities.component.scss'],
})
export class MyComunitiesComponent implements OnInit {
  /** Indicates whether the community data is being loaded. This is used to show a loading spinner or similar UI element. */
  loadingCommunities = false;

  /** Stores an array of communities that the current user is part of. Each community is represented as a `CommunityDTO`. */
  myCommunities: CommunityDTO[] = [];

  /**
   * Initializes a new instance of the MyCommunitiesComponent with dependency injection.
   *
   * @param {DefaultService} apiService - The API service used to fetch community data.
   */
  constructor(private apiService: DefaultService) {}

  /**
   * Lifecycle hook that is called after Angular has initialized all data-bound properties of a directive.
   */
  ngOnInit(): void {
    this.loadingCommunities = true;
    this.apiService
      .getMyCommunities()
      .pipe(
        finalize(() => {
          this.loadingCommunities = false;
        })
      )
      .subscribe(communities => {
        this.myCommunities = communities;
      });
  }
}
