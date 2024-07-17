import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProfileService } from '../../profile/profile.service';
import {
  CallDTO,
  CommunityDTO,
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  CommunityType,
  DefaultService,
  DepositsQueryDTO,
  SessionDTO,
  UserPrivateDTO,
  UserSummaryDTO,
} from '@orvium/api';
import { CommunityService, ICommunityActions } from '../community.service';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { concatMap, finalize, map } from 'rxjs/operators';
import { SeoTagsService } from '../../services/seo-tags.service';
import { SidenavService } from '../../services/sidenav.service';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { Benefit, BenefitComponent } from '../../shared/benefit/benefit.component';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { NgTemplateOutlet, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '../../shared/header/header.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';
import { AcknowledgementComponent } from '../../shared/acknowledgement/acknowledgement.component';
import { ShareMediaComponent } from '../../shared/share-media/share-media.component';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';
import { SpinnerService } from '../../spinner/spinner.service';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { CommunityCalendarComponent } from '../community-calendar/community-calendar.component';
import { AlertComponent } from '../../shared/alert/alert.component';
import { CommunityCardComponent } from '../community-card/community-card.component';
import { CallForPapersCardComponent } from '../../call/call-for-papers-card/call-for-papers-card.component';
import { DialogService } from '../../dialogs/dialog.service';
import { UserLineComponent } from '../../shared/user-line/user-line.component';
import { ThousandConversorPipe } from '../../shared/custom-pipes/thousand-conversor.pipe';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { ButtonsMenuComponent } from '../../buttons-menu/buttons-menu.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component responsible for displaying detailed views of a specific community.
 * This includes handling functionalities like sharing, acknowledging, managing calls, publications, and various community actions.
 */
@Component({
  selector: 'app-community-view',
  standalone: true,
  templateUrl: './community-view.component.html',
  styleUrls: ['./community-view.component.scss'],
  imports: [
    InfoToolbarComponent,
    DescriptionLineComponent,
    NgTemplateOutlet,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    HeaderComponent,
    MatChipsModule,
    TitleCasePipe,
    MatExpansionModule,
    MatDividerModule,
    MatMenuModule,
    MatTabsModule,
    DepositsListComponent,
    MatPaginatorModule,
    BenefitComponent,
    AcknowledgementComponent,
    ShareMediaComponent,
    SearchBoxComponent,
    OverlayLoadingDirective,
    CommunityCalendarComponent,
    AlertComponent,
    CommunityCardComponent,
    CallForPapersCardComponent,
    UserLineComponent,
    ThousandConversorPipe,
    ButtonsMenuComponent,
  ],
})
export class CommunityViewComponent implements OnInit, OnDestroy {
  /** Template references for various dialogs and components */
  @ViewChild('acknowledgementTemplate') acknowledgementTemplate!: TemplateRef<unknown>;
  @ViewChild('shareDialogTemplate') shareDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('calendarDialogTemplate') calendarDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('callForPapersDialogTemplate') callForPapersDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('searchBox') searchBoxTemplate!: TemplateRef<unknown>;
  @ViewChild('paginator') paginator?: MatPaginator;

  /** The community data, can be either populated or private DTO format. */
  community!: CommunityPopulatedDTO | CommunityPrivateDTO;

  /** Community filters using an array of strings */
  communitiesFilter: string[] = [];

  /** Current user profile data */
  profile?: UserPrivateDTO;

  /** Query object for community deposits */
  depositsQuery: DepositsQueryDTO = { deposits: [], count: 0 };

  /** Query object for community deposits */
  moderators: UserSummaryDTO[] = [];

  /** Calls associated with the community */
  calls: CallDTO[] = [];

  /** Sessions associated with the community */
  sessions: SessionDTO[] = [];

  /** Flag for mobile device view */
  isMobile = false;

  /** Envoronment variables for configuration */
  environment = environment;

  /** Community types enumeration for logic and display purposes */
  communityTypeLOV = CommunityType;

  /** Array of related communities as conference proceedings */
  conferenceProceedings: CommunityDTO[] = [];

  /** Benefits associated with being part of the community */
  benefits: Benefit[] = [
    {
      title: 'Impact',
      icon: 'stacked_line_chart',
      description: 'Publish <b>open acess</b> and get exposure, increase your impact!',
    },
    {
      title: 'Wide community',
      icon: 'bubble_chart ',
      description:
        'Join the community of your peers and <b>get recognized</b> as an expert and guardian of quality!',
    },
    {
      title: 'Reward and recognition',
      icon: 'auto_awesome',
      description:
        'Watch over a growing scholar community and <strong>get rewarded</strong> for building up a healthy academic ' +
        'publishing environment!',
    },
  ];

  /** Highlight class options for UI elements */
  highlightClass: ('pink' | 'green' | 'purple')[] = ['pink', 'green', 'purple'];

  /** calls for actions text*/
  shareText = 'Share this!';

  /** Flag to control loading state of community deposits */
  loadCommunityDeposits = false;

  /** Reference for managing component lifecycle and subscriptions */
  private destroyRef = inject(DestroyRef);

  /** Actions available to the user for the community */
  communityActions: ICommunityActions = {
    update: false,
    moderate: false,
    submit: false,
  };

  /** Current filter settings for fetching data */
  private currentFilter: Record<string, unknown> = {};

  /**
   * Constructs the component with essential services for SEO management,
   * API interactions, user profile management, community operations, routing, etc.
   *
   * @param {SeoTagsService} seoTagsService - Service used to manage SEO tags dynamically, enhancing the page's SEO for better search engine visibility.
   * @param {DefaultService} apiService - Central service for making API requests to the server, crucial for fetching and sending data to the backend.
   * @param {ProfileService} profileService - Service for managing and retrieving the user's profile data.
   * @param {CommunityService} communityService - Service that handles specific business logic related to communities.
   * @param {ActivatedRoute} route - Service that provides access to route parameters and the route snapshot.
   * @param {Router} router - Angular's Router service that enables navigation from one view to the next as users perform application tasks.
   * @param {SpinnerService} spinnerService - Service to manage the visibility of a global loading spinner.
   * @param {DialogService} dialogService - Service for managing dialogs, allowing for modular and reusable dialog components.
   * @param {BreakpointObserver} breakpointObserver - Service for subscribing to media query changes, enabling to adapt to changes in screen size and layout.
   * @param {SidenavService} sidenavService - Service for managing the behavior of side navigation panels.
   */
  constructor(
    private seoTagsService: SeoTagsService,
    private apiService: DefaultService,
    private profileService: ProfileService,
    private communityService: CommunityService,
    private route: ActivatedRoute,
    public router: Router,
    public spinnerService: SpinnerService,
    public dialogService: DialogService,
    private breakpointObserver: BreakpointObserver,
    private sidenavService: SidenavService
  ) {}

  /**
   * Initializes the component, sets up SEO tags, fetches community details, and monitors the viewport size for responsive behaviors.
   */
  ngOnInit(): void {
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      console.log(result);
      this.isMobile = result.matches;
    });

    this.route.paramMap
      .pipe(
        map(params => params.get('communityId')),
        isNotNullOrUndefined(),
        concatMap(communityId => this.apiService.getCommunity({ id: communityId })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(community => {
        this.community = community;
        this.currentFilter = {};
        this.apiService.getCalls({ community: this.community._id }).subscribe(calls => {
          this.calls = calls;
        });
        this.apiService.getSessions({ communityId: this.community._id }).subscribe(sessions => {
          this.sessions = sessions;
        });
        this.communitiesFilter = [];
        this.communitiesFilter.push(this.community._id);
        for (const conference of this.community.conferenceProceedingsPopulated) {
          this.conferenceProceedings.push(conference);
          this.communitiesFilter.push(conference._id);
        }
        this.apiService
          .getDeposits({
            community: this.community._id,
            communityChildren: this.communitiesFilter,
          })
          .subscribe(query => {
            this.depositsQuery = query;
          });
        this.moderators = [];
        this.community.moderatorsPopulated.forEach(moderator =>
          this.moderators.push(moderator.user)
        );
        this.benefits = this.getBenefits();
        this.refreshActions(this.community);
        this.setSEOTags();
        this.shareText = 'Share <b>' + this.community.name + '</b> community in your social media';
      });

    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
  }

  /**
   * Cleans up resources when the component is destroyed, specifically removing any set SEO tags.
   */
  ngOnDestroy(): void {
    this.seoTagsService.removeTagsAndCanonical();
  }

  public setSEOTags(): void {
    const title = this.community.name;
    this.seoTagsService.setGeneralSeo(title, this.community.description || this.community.name);
    this.seoTagsService.setOpengraphTags(
      title,
      `Discover "${this.community.name}" community`,
      environment.publicUrl + this.router.url
    );
  }

  createCall(): void {
    assertIsDefined(this.profile, 'There is no profile when trying to create a call');
    this.apiService
      .createCall({
        callCreateDTO: {
          title: 'New Call',
          community: this.community._id,
        },
      })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(call => {
        void this.router.navigate(['call', call._id, 'edit']);
      });
  }

  openAcknowledgement(): void {
    this.dialogService.openCustom({
      title: 'Acknowledgement',
      template: this.acknowledgementTemplate,
      showActionButtons: false,
    });
  }

  openShare(): void {
    this.dialogService.openCustom({
      template: this.shareDialogTemplate,
      showActionButtons: false,
    });
  }

  openCalendar(): void {
    this.dialogService.openCustom({
      title: `Calendar (${this.community.calendarDates.length})`,
      template: this.calendarDialogTemplate,
      showActionButtons: false,
    });
  }

  refreshActions(community: CommunityPopulatedDTO | CommunityPrivateDTO): void {
    this.communityActions = this.communityService.getCommunityActions(community);
  }

  getBenefits(): Benefit[] {
    switch (this.community.type) {
      case CommunityType.Conference:
        return [
          {
            title: 'Reliable Feedback',
            icon: 'question_answer',
            description: 'Get <strong>feedback</strong> on an early version of your latest work',
          },
          {
            title: 'Latest Findings',
            icon: 'search',
            description: 'Hear about the <strong>latest research</strong>',
          },
          {
            title: 'Make Connections',
            icon: 'groups',
            description: 'Get to know <strong>other people</strong> in your field',
          },
        ];

      default:
        return [
          {
            title: 'Publish Research',
            icon: 'grading',
            description:
              'Gain <strong>recognition</strong> and validate findings by publishing in our community',
          },
          {
            title: 'Find talent and partners',
            icon: 'search',
            description: 'Develop institutional agreements and <strong>talent discovery</strong>',
          },
          {
            title: 'Open Access',
            icon: 'lock_open',
            description: 'Access to the latest innovations and research',
          },
        ];
    }
  }

  paginate($event: PageEvent): void {
    const page = $event.pageIndex;
    this.apiService
      .getDeposits({
        community: this.community._id,
        communityChildren: this.communitiesFilter,
        page,
        ...this.currentFilter,
      })
      .subscribe(deposits => {
        this.depositsQuery = deposits;
      });
  }

  filterPublications($event: Record<string, unknown>): void {
    this.loadCommunityDeposits = true;
    this.currentFilter = $event;
    this.apiService
      .getDeposits({
        community: this.community._id,
        communityChildren: this.communitiesFilter,
        ...this.currentFilter,
      })
      .subscribe(deposits => {
        this.depositsQuery = deposits;
        this.loadCommunityDeposits = false;
      });
    if (this.paginator) this.paginator.pageIndex = 0;
  }

  async openFilters(): Promise<void> {
    this.sidenavService.rightSideComponent = this.searchBoxTemplate;
    await this.sidenavService.openRight();
  }
}
