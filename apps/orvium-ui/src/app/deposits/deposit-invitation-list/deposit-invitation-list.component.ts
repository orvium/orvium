import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { MatChipsModule } from '@angular/material/chips';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';
import { RouterLink } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { InvitePopulatedDTO } from '@orvium/api';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Component for displaying a list of invitations related to a deposit.
 */
@Component({
  selector: 'app-deposit-invitation-list',
  standalone: true,
  imports: [
    CommonModule,
    ContributorLineComponent,
    MatChipsModule,
    ListWrapperComponent,
    RouterLink,
    MatListModule,
    MatTooltipModule,
  ],
  templateUrl: './deposit-invitation-list.component.html',
  styleUrls: ['./deposit-invitation-list.component.scss'],
})
export class DepositInvitationListComponent {
  /** List of invites with the related information as a DTOs */
  @Input({ required: true }) invites: InvitePopulatedDTO[] = [];

  /** Flag set to true by default to detemine if the requestor will be displayed */
  @Input() requestedBy = true;
}
