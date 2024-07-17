import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { CustomDialogComponent } from '../../dialogs/custom-dialog/custom-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogService } from '../../dialogs/dialog.service';

/**
 * Represents the visibility settings for a review, detailing what is visible and to whom.
 *
 * @property {boolean} showIdentityToAuthor - Indicates if the reviewer's identity is shown to the author of the paper.
 * @property {boolean} showIdentityToEveryone - Indicates if the reviewer's identity is visible to everyone.
 * @property {boolean} showReviewToAuthor - Indicates if the review content is visible to the author of the paper.
 * @property {boolean} showReviewToEveryone - Indicates if the review content is visible to everyone.
 */
export interface ReviewVisibility {
  showIdentityToAuthor: boolean;
  showIdentityToEveryone: boolean;
  showReviewToAuthor: boolean;
  showReviewToEveryone: boolean;
}
/**
 * Component responsible for displaying and managing the visibility settings of a review.
 */
@Component({
  selector: 'app-review-visibility',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CustomDialogComponent,
    MatChipsModule,
    MatDialogModule,
  ],
  templateUrl: './review-visibility.component.html',
  styleUrls: ['./review-visibility.component.scss'],
})
export class ReviewVisibilityComponent implements OnInit {
  /** The visibility settings input from the parent component, required for the component to function properly. */
  @Input({ required: true }) visibilities!: ReviewVisibility;

  /** The icon to represent identity visibility based on the current settings. */
  identityIcon!: 'lock_open_right' | 'lock_person' | 'lock';

  /** The icon to represent review content visibility based on the current settings. */
  reviewIcon!: 'visibility' | 'visibility_lock' | 'visibility_off';

  /**
   * Construct an instace of ReviewVisibilityComponent
   *
   * @param {DialogService} dialogService - Service used to open custom dialog components.
   */
  constructor(public dialogService: DialogService) {}

  /**
   * Initializes the component by setting the appropriate icons based on the current visibility settings.
   */
  ngOnInit(): void {
    this.setIcons(this.visibilities);
  }

  /**
   * Opens a dialog to modify visibility settings using a custom dialog template.
   *
   * @param {TemplateRef<unknown>} visibilityOptions - The template reference for the visibility settings dialog.
   */
  openVisibilityDialog(visibilityOptions: TemplateRef<unknown>): void {
    this.dialogService.openCustom({
      template: visibilityOptions,
      width: '100%',
      showActionButtons: false,
      maxWidth: 500,
    });
  }

  /**
   * Sets the icons for identity and review visibility based on the provided settings.
   *
   * @param {ReviewVisibility} visibility - The current visibility settings.
   */
  setIcons(visibility: ReviewVisibility): void {
    if (!visibility.showIdentityToAuthor && !visibility.showIdentityToEveryone) {
      this.identityIcon = 'lock';
    } else if (visibility.showIdentityToAuthor && !visibility.showIdentityToEveryone) {
      this.identityIcon = 'lock_person';
    } else {
      this.identityIcon = 'lock_open_right';
    }

    if (!visibility.showReviewToAuthor && !visibility.showReviewToEveryone) {
      this.reviewIcon = 'visibility_off';
    } else if (visibility.showReviewToAuthor && !visibility.showReviewToEveryone) {
      this.reviewIcon = 'visibility_lock';
    } else {
      this.reviewIcon = 'visibility';
    }
  }
}
