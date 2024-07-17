import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { ReviewPopulatedDTO, ReviewStatus, UserPrivateDTO } from '@orvium/api';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { DialogService } from '../../dialogs/dialog.service';
import { AuthorAvatarListComponent } from '../../shared/author-avatar-list/author-avatar-list.component';
import { isNotNullOrUndefined } from '../../shared/shared-functions';
import { ReviewVisibilityComponent } from '../review-visibility/review-visibility.component';
import { MatIconModule } from '@angular/material/icon';
import { CopyToClipboardDirective } from '../../shared/directives/copy-to-clipboard.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';
import { ProfileService } from '../../profile/profile.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DoiStatusComponent } from '../../shared/doi-status/doi-status.component';

/**
 * Component for managing and displaying a list of reviews with functionalities such as accepting, drafting, and requesting changes through modal dialogs.
 */
@Component({
  selector: 'app-review-list2',
  standalone: true,
  templateUrl: './review-list2.component.html',
  styleUrls: ['./review-list2.component.scss'],
  imports: [
    RouterLink,
    DatePipe,
    MatChipsModule,
    TitleCasePipe,
    MatDividerModule,
    MatButtonModule,
    AuthorAvatarListComponent,
    ReviewVisibilityComponent,
    MatIconModule,
    CopyToClipboardDirective,
    MatTooltipModule,
    ListWrapperComponent,
    MatCheckboxModule,
    NgClass,
    DoiStatusComponent,
  ],
})
export class ReviewList2Component implements OnChanges, OnInit {
  /** Internal storage for the reviews passed via input. */
  _reviews: ReviewPopulatedDTO[] = [];

  /**
   * Receives an array of reviews and refreshes the internal state.
   *
   * @param {ReviewPopulatedDTO[]} reviews - Array of reviews to be displayed.
   */
  @Input({ required: true }) set reviews(reviews: ReviewPopulatedDTO[]) {
    this._reviews = reviews;
    this.selector.clear();
  }

  /**
   * Emits an event when a review is accepted, potentially with a reason.
   */
  @Output() accept: EventEmitter<{ review: ReviewPopulatedDTO; reason?: string }> =
    new EventEmitter<{
      review: ReviewPopulatedDTO;
      reason?: string;
    }>();

  /**
   * Emits an event when a review is sent back to draft status, potentially with a reason.
   */
  @Output() draft: EventEmitter<{ review: ReviewPopulatedDTO; reason?: string }> =
    new EventEmitter<{
      review: ReviewPopulatedDTO;
      reason?: string;
    }>();

  /** Access to the enumeration of ReviewStatus for use within the template. */
  ReviewStatus = ReviewStatus;

  /** User profile information, possibly undefined if not logged in. */
  profile?: UserPrivateDTO;

  /** Selection model to keep track of selected reviews for potential bulk actions. */
  selector = new SelectionModel<ReviewPopulatedDTO>(true, []);

  /**
   * Constructs the ReviewList2Component and injects necessary services and dependencies.
   * Initializes services used for managing dialog interactions, detecting changes, managing profiles, and routing.
   *
   * @param {DialogService} dialogService - Service used for opening dialog windows for various interactions.
   * @param {ChangeDetectorRef} cdr - Service used for detecting changes in the component.
   * @param {ProfileService} profileService - Service used to fetch and update the user's profile.
   * @param {Router} router - Service used for navigating between routes.
   */
  constructor(
    public dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private profileService: ProfileService,
    public router: Router
  ) {}

  /**
   * Initializes the component by subscribing to the profile data from the `ProfileService`.
   * Upon successful fetching, the profile data is stored in the component for use.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
  }

  /**
   * Detects changes to input properties and updates the component's view accordingly.
   * This method ensures the component stays updated with external changes.
   */
  ngOnChanges(): void {
    this.cdr.detectChanges();
  }

  /**
   * Accepts a review and emits the accept event with optional reasoning.
   *
   * @param {ReviewPopulatedDTO} review - The review to be accepted.
   * @param {string} [reason] - Optional reason for accepting the review.
   */
  acceptReview(review: ReviewPopulatedDTO, reason?: string): void {
    this.accept.emit({ review, reason });
  }

  /**
   * Accepts a review and emits the accept event with optional reasoning.
   *
   * @param {ReviewPopulatedDTO} review - The review to be accepted.
   * @param {string} [reason] - Optional reason for accepting the review.
   */
  draftReview(review: ReviewPopulatedDTO, reason?: string): void {
    this.draft.emit({ review, reason });
  }

  /**
   * Opens a modal dialog to request changes to a review, changing its status to draft.
   *
   * @param {ReviewPopulatedDTO} review - The review for which changes are being requested.
   */
  openRejectModal(review: ReviewPopulatedDTO): void {
    this.dialogService
      .openInputDialog({
        title: 'Request changes to this review',
        content:
          'You are requesting the reviewer to make some changes to the review submitted to fix certain issues. ' +
          'The review will change to DRAFT status, and the reviewer should submit the review again once the changes are done. ' +
          'Please use the box below give the reviewer some instructions about why you are requesting changes. ',
        cancelMessage: 'Cancel',
        acceptMessage: 'Request Changes',
        inputLabel: 'Instructions',
        useTextarea: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(response => {
        if (response.action) {
          this.draftReview(review, response.inputValue);
        }
      });
  }

  /**
   * Opens a modal dialog to accept a review.
   *
   * @param {ReviewPopulatedDTO} review - The review to be accepted.
   */
  openAcceptModal(review: ReviewPopulatedDTO): void {
    this.dialogService
      .openInputDialog({
        title: 'Accept review',
        content: 'Are you sure you want to accept this review?',
        acceptMessage: 'Confirm',
        inputLabel: 'Feedback',
        useTextarea: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(response => {
        if (response.action) {
          this.acceptReview(review, response.inputValue);
        }
      });
  }

  /**
   * Navigates to the conversation page related to the review's creator.
   *
   * @param {ReviewPopulatedDTO} review - The review whose related conversation is to be opened.
   */
  openConversation(review: ReviewPopulatedDTO): void {
    const conversationLink = this.profileService.getConversationLink(review.creator);
    void this.router.navigate([conversationLink.routerLink], {
      queryParams: conversationLink.queryParam,
    });
  }
}
