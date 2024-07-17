import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AcceptedFor, DepositPopulatedDTO, ReviewStatus, ReviewSummaryDTO } from '@orvium/api';
import { DialogService } from '../../dialogs/dialog.service';
import { DatePipe, NgClass, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver } from '@angular/cdk/layout';
import { AuthorAvatarListComponent } from '../../shared/author-avatar-list/author-avatar-list.component';
import { AuthorsListComponent } from '../../shared/authors-list/authors-list.component';
import { ShowMoreComponent } from '../../shared/show-more/show-more.component';
import { ReviewIconPipe } from '../../shared/custom-pipes/review-icon.pipe';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { DepositsService } from '../deposits.service';

/**
 * Component for displaying a single deposit's details in a card format. It allows for operations like starring and reviewing the deposit.
 * The card can be customized to show or hide certain elements based on the input properties.
 */
@Component({
  selector: 'app-deposit-card',
  standalone: true,
  templateUrl: './deposit-card.component.html',
  styleUrls: ['./deposit-card.component.scss'],
  imports: [
    MatCardModule,
    RouterLink,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    TitleCasePipe,
    UpperCasePipe,
    DatePipe,
    MatButtonModule,
    AuthorAvatarListComponent,
    AuthorsListComponent,
    ShowMoreComponent,
    ReviewIconPipe,
    NgClass,
  ],
})
export class DepositCardComponent implements OnInit {
  /** The deposit data to be displayed, passed into the component. This is a required property. */
  @Input({ required: true }) deposit!: DepositPopulatedDTO;

  /** Indicates whether the deposit is starred by the user. */
  @Input() isStarred = false;

  /** If true, displays a reduced version of the card, typically for embedding in smaller UI contexts. */
  @Input() reducedCard = false;

  /** Optional router link for navigating to the detailed page of the deposit. */
  @Input() depositRouterLink: unknown[] | string | null | undefined = [];

  /** Optional router link for navigating to the associated community's page. */
  @Input() communityRouterLink: unknown[] | string | null | undefined = [];

  /** Controls whether the bookmark (star) option should be displayed. */
  @Input() showBookmark = true;

  /** Controls whether the option to create a review should be displayed. */
  @Input() showCreateReview = true;

  /** Event emitted when the user decides to star or bookmark the deposit */
  @Output() starDeposit = new EventEmitter<DepositPopulatedDTO>();

  /** Event emitted when the user decides to create a review for the deposit. */
  @Output() createReview = new EventEmitter<DepositPopulatedDTO>();

  /** List of published reviews associated with the deposit. */
  publishedReviews: ReviewSummaryDTO[] = [];

  /** Indicates if the device screen is small, affecting layout and design. */
  smallScreen = false;

  /** Provides the context of accepted statuses for the deposit. */
  protected readonly AcceptedFor = AcceptedFor;

  /** Indicates whether the current user has the permission to edit the deposit. */
  canEditDeposit = false;

  /**
   * Constructs the DepositCardComponent with necessary dependencies for dialog interaction, responsive design handling, and deposit operations.
   *
   * @param {DialogService} dialogService - Service used for opening dialog windows.
   * @param {BreakpointObserver} breakpointObserver - Service for observing changes in media queries or breakpoints.
   * @param {DepositsService} depositService - Service for handling deposit-related operations.
   */
  constructor(
    public dialogService: DialogService,
    private breakpointObserver: BreakpointObserver,
    private depositService: DepositsService
  ) {}

  /**
   * Initializes the component by setting the edit permissions and filtering published reviews.
   */
  ngOnInit(): void {
    this.canEditDeposit = this.depositService.canEditDeposit(this.deposit);
    this.publishedReviews = this.deposit.peerReviewsPopulated.filter(
      review => review.status === ReviewStatus.Published
    );

    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.smallScreen = result.matches;
    });
  }

  /**
   * Emits an event to star the deposit.
   */
  star(): void {
    this.starDeposit.emit(this.deposit);
  }

  /**
   * Emits an event to initiate the review creation process for the deposit.
   */
  review(): void {
    this.createReview.emit(this.deposit);
  }
}
