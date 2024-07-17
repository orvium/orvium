import { Component, Input } from '@angular/core';
import { CommunityDTO, CommunityPopulatedDTO, CommunityPrivateDTO } from '@orvium/api';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TitleCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { ThousandConversorPipe } from '../../shared/custom-pipes/thousand-conversor.pipe';
import { MatIconModule } from '@angular/material/icon';

/**
 * Component for displaying a single community as a card. This component is used within listings
 * where each community needs to be shown with summarized information, possibly including actions like navigation
 * to the community's detailed view.
 */
@Component({
  selector: 'app-community-card',
  templateUrl: './community-card.component.html',
  styleUrls: ['./community-card.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    TitleCasePipe,
    RouterLink,
    AvatarDirective,
    ThousandConversorPipe,
    MatIconModule,
  ],
})
export class CommunityCardComponent {
  /**
   * Community data to be displayed within the card. This input must be provided for the component to function properly.
   */
  @Input({ required: true }) community!: CommunityDTO | CommunityPopulatedDTO | CommunityPrivateDTO;
}
