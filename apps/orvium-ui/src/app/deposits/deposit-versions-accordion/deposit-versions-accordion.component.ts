import { NgClass, TitleCasePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { DepositPopulatedDTO, ReviewStatus, UserPrivateDTO } from '@orvium/api';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { MatLineModule } from '@angular/material/core';
import { ReviewIconPipe } from '../../shared/custom-pipes/review-icon.pipe';

/**
 * Component that displays a list of deposit versions in an accordion format, allowing users to expand each version
 * to see more details. It is designed to handle multiple versions of a deposit, including their review statuses,
 * and can optionally display private reviews based on user permissions.
 */
@Component({
  selector: 'app-deposit-versions-accordion',
  standalone: true,
  templateUrl: './deposit-versions-accordion.component.html',
  styleUrls: ['./deposit-versions-accordion.component.scss'],
  imports: [
    MatIconModule,
    RouterLink,
    MatExpansionModule,
    TitleCasePipe,
    MatChipsModule,
    ContributorLineComponent,
    NgClass,
    MatLineModule,
    ReviewIconPipe,
  ],
})
export class DepositVersionsAccordionComponent {
  /** Enumeration for review statuses, used to display the status of each deposit version. */
  ReviewStatus = ReviewStatus;

  /** The user's profile information, which may be used to tailor the display of private or sensitive information.*/
  @Input() profile?: UserPrivateDTO;

  /** An array of deposit versions to display within the accordion. Each version is a detailed DTO. */
  @Input({ required: true }) versions: DepositPopulatedDTO[] = [];

  /** Indicates whether to show the full version of the accordion. This might include expanded details by default. */
  @Input() fullVersion?: boolean = false;

  /** Indicates whether private reviews should be displayed. This might be controlled by user permissions. */
  @Input() privateReviews?: boolean = false;

  /** The ID of a selected version. This can be used to highlight or auto-expand a specific version in the accordion. */
  @Input() selectedVersionId?: string;
}
