import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommunityPopulatedDTO, DefaultService, SessionDTO } from '@orvium/api';
import { Title } from '@angular/platform-browser';
import { concatMap, finalize, map } from 'rxjs/operators';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommunityService, ICommunityActions } from '../community.service';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { SearchBoxComponent } from '../../shared/search-box/search-box.component';
import { MatIconModule } from '@angular/material/icon';
import { SessionCardComponent } from '../../session/session-card/session-card.component';
import { MatButtonModule } from '@angular/material/button';
import { SpinnerService } from '../../spinner/spinner.service';
import { MatChipListbox, MatChipOption, MatChipsModule } from '@angular/material/chips';
import { isNotNullOrUndefined } from '../../shared/shared-functions';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component responsible for displaying and managing the conference program, including sessions and their respective filtering by date.
 * Supports creating new sessions and toggling session selection based on date filters.
 */
@Component({
  selector: 'app-conference-program',
  standalone: true,
  templateUrl: './conference-program.component.html',
  styleUrls: ['./conference-program.component.scss'],
  imports: [
    InfoToolbarComponent,
    DescriptionLineComponent,
    SearchBoxComponent,
    MatIconModule,
    DatePipe,
    SessionCardComponent,
    MatButtonModule,
    RouterLink,
    NgTemplateOutlet,
    MatChipsModule,
  ],
})
export class ConferenceProgramComponent implements OnInit {
  /** Reference to destroy service for subscription management */
  private destroyRef = inject(DestroyRef);

  /** Array of sessions associated with the community */
  sessions: SessionDTO[] = [];

  /** Details of the community */
  community!: CommunityPopulatedDTO;

  /** Dates that sessions occur on */
  days: Date[] = [];

  /** Selected dates for filtering sessions */
  selectedDays: Date[] = [];

  /** Query parameters for session filtering */
  sessionQuery!: Record<string, unknown>;

  /** Reference to the date chips component */
  @ViewChild('dateChips') dateChips!: MatChipListbox;

  /** Actions available for the community based on user permissions, defaults to false */
  communityActions: ICommunityActions = {
    update: false,
    moderate: false,
    submit: false,
  };

  /**
   * Constructs the ConferenceProgramComponent with necessary dependency injections.
   * This constructor sets up services required for fetching and displaying community-related data, handling navigation, and managing UI states.
   *
   * @param {Title} titleService - Service used to set the title of the document.
   * @param {SpinnerService} spinnerService - Service to show or hide a loading spinner, indicating processing or waiting times.
   * @param {DefaultService} apiService - Service to make API calls to the server, used to fetch community details and sessions.
   * @param {ActivatedRoute} route - Active route that allows access to route parameters, used to fetch the current community ID from the URL.
   * @param {CommunityService} communityService - Service that handles business logic associated with community data.
   * @param {Router} router - Angular Router service to navigate among views or manipulate navigation history.
   */
  constructor(
    private titleService: Title,
    private spinnerService: SpinnerService,
    private apiService: DefaultService,
    private route: ActivatedRoute,
    private communityService: CommunityService,
    public router: Router
  ) {}

  /**
   * Initializes the component by fetching community details and sessions.
   */
  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map(params => params.get('communityId')),
        isNotNullOrUndefined(),
        concatMap(communityId => this.apiService.getCommunity({ id: communityId })),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(community => {
        this.community = community;
        this.spinnerService.show();
        this.titleService.setTitle('Program sessions');
        this.refreshActions();
        this.apiService
          .getSessions({ communityId: this.community._id })
          .pipe(
            finalize(() => {
              this.spinnerService.hide();
            })
          )
          .subscribe(sessions => {
            this.sessions = sessions;
            this.orderSessions();
            this.setFilterDates();
          });
      });
  }

  /**
   * Sets dates for session filters based on the start dates of available sessions.
   */
  setFilterDates(): void {
    this.days = [];
    let dates: { year: number; month: number; day: number }[] = [];
    for (const session of this.sessions) {
      if (session.dateStart) {
        const date = {
          year: session.dateStart.getFullYear(),
          month: session.dateStart.getMonth(),
          day: session.dateStart.getDate(),
        };
        dates.push(date);

        dates = dates.filter(
          (v, i, a) => a.findIndex(v2 => JSON.stringify(v2) === JSON.stringify(v)) === i
        );
      }
    }
    for (const date of dates) {
      this.days.push(new Date(date.year, date.month, date.day, 0, 0, 0, 0));
    }
  }

  /**
   * Filters sessions based on selected dates and other query parameters.
   *
   * @param {$event: Record<string, unknown>} $event - The event object containing filter parameters.
   */
  filterSessions($event: Record<string, unknown>): void {
    this.sessionQuery = $event;
    const filterDays: string[] = [];
    if (this.selectedDays.length > 0) {
      for (const day of this.selectedDays) {
        filterDays.push(day.toString());
      }
      this.apiService
        .getSessions({
          communityId: this.community._id,
          dates: filterDays,
          ...this.sessionQuery,
        })
        .subscribe(sessions => {
          this.sessions = sessions;
          this.orderSessions();
        });
    } else {
      this.apiService
        .getSessions({ communityId: this.community._id, ...this.sessionQuery })
        .subscribe(sessions => {
          this.sessions = sessions;
          this.orderSessions();
          this.setFilterDates();
        });
    }
  }

  /**
   * Orders sessions chronologically.
   */
  orderSessions(): void {
    this.sessions = this.sessions.sort((n1, n2) => {
      if (n1.dateStart && n2.dateStart) {
        if (n1.dateStart > n2.dateStart) {
          return 1;
        }

        if (n1.dateStart < n2.dateStart) {
          return -1;
        }

        return 0;
      } else {
        return 0;
      }
    });
  }

  /**
   * Toggles the selection state of session date filters.
   *
   * @param {MatChipOption} chip - The chip component representing a date filter.
   */
  toggleSelection(chip: MatChipOption): void {
    if (chip.selected) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.selectedDays.push(chip.value);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const index = this.selectedDays.indexOf(chip.value);
      this.selectedDays.splice(index, 1);
    }

    if (this.selectedDays.length > 0) {
      const filterDays: string[] = [];
      for (const day of this.selectedDays) {
        filterDays.push(day.toString());
      }
      this.apiService
        .getSessions({
          communityId: this.community._id,
          dates: filterDays,
          ...this.sessionQuery,
        })
        .subscribe(sessions => {
          this.sessions = sessions;
          this.orderSessions();
        });
    } else {
      this.apiService
        .getSessions({ communityId: this.community._id, ...this.sessionQuery })
        .subscribe(sessions => {
          this.sessions = sessions;
          this.orderSessions();
          this.setFilterDates();
        });
    }
  }

  /**
   * Creates a new session for the community.
   */
  createSession(): void {
    const newDate = new Date();
    const year = newDate.getFullYear();
    const month = newDate.getMonth();
    const day = newDate.getDate();

    this.apiService
      .createSession({
        sessionCreateDTO: {
          title: 'New session',
          community: this.community._id,
          dateStart: new Date(year, month, day, 13, 0, 0),
          dateEnd: new Date(year, month, day, 14, 0, 0),
        },
      })
      .pipe(
        finalize(() => {
          this.spinnerService.hide();
        })
      )
      .subscribe(session => {
        void this.router.navigate(['session', session._id, 'edit']);
      });
  }

  /**
   * Refreshes available actions based on community details.
   */
  refreshActions(): void {
    this.communityActions = this.communityService.getCommunityActions(this.community);
  }
}
