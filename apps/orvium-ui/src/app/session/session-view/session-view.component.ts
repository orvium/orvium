import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  DefaultService,
  DepositPopulatedDTO,
  SessionDTO,
} from '@orvium/api';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommunityService, ICommunityActions } from '../../communities/community.service';
import { concatMap, map } from 'rxjs/operators';
import { combineLatest, of } from 'rxjs';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component for displaying details of a specific session within a community.
 * It retrieves and shows session information, deposits associated with the session, and related community actions.
 */
@Component({
  selector: 'app-session-view',
  standalone: true,
  templateUrl: './session-view.component.html',
  styleUrls: ['./session-view.component.scss'],
  imports: [
    InfoToolbarComponent,
    DescriptionLineComponent,
    NgTemplateOutlet,
    DatePipe,
    DepositsListComponent,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    ContributorLineComponent,
  ],
})
export class SessionViewComponent implements OnInit {
  /** The community details either as populated or private data. */
  community?: CommunityPopulatedDTO | CommunityPrivateDTO;

  /** The detailed session data for the current view. */
  session!: SessionDTO;

  /** A list of deposits linked to the session. */
  deposits: DepositPopulatedDTO[] = [];

  /** A utility reference for cleanup. */
  private destroyRef = inject(DestroyRef);

  /**  The title of the track associated with the session. */
  track?: string;

  /**
   * Community actions based on user permissions and community status.
   */
  communityActions: ICommunityActions = {
    update: false,
    submit: false,
    moderate: false,
  };

  /**
   * Constructs the session view component.
   *
   * @param {DefaultService} apiService - The service for API interactions.
   * @param {ActivatedRoute} route - The route information related to this component.
   * @param {CommunityService} communityService - The service to handle community-related actions.
   */
  constructor(
    private apiService: DefaultService,
    private route: ActivatedRoute,
    private communityService: CommunityService
  ) {}

  /**
   * Initializes the component by loading the session and community details based on the route parameters.
   */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('sessionId')),
        isNotNullOrUndefined(),
        concatMap(sessionId => this.apiService.getSession({ id: sessionId })),
        concatMap(session =>
          combineLatest(of(session), this.apiService.getCommunity({ id: session.community }))
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(([session, community]) => {
        this.session = session;
        this.community = community;
        this.refreshActions(community);

        //Session track
        if (session.newTrackTimestamp) {
          const communityTrack = community.newTracks.find(
            track => track.timestamp === session.newTrackTimestamp
          );
          assertIsDefined(communityTrack, 'track is not defined');
          this.track = communityTrack.title;
        }
        for (const deposit of this.session.deposits) {
          this.apiService.getDeposit({ id: deposit }).subscribe(deposit => {
            this.deposits.push(deposit);
          });
        }
      });
  }

  /**
   * Refreshes available actions for the community depending on the user's permissions and community settings.
   *
   * @param {CommunityPopulatedDTO | CommunityPrivateDTO} community - The community details to determine possible actions.
   */
  refreshActions(community: CommunityPopulatedDTO | CommunityPrivateDTO): void {
    this.communityActions = this.communityService.getCommunityActions(community);
  }
}
