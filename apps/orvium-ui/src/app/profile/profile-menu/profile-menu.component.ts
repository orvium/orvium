import { Component, Input } from '@angular/core';
import { UserPrivateDTO } from '@orvium/api';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { SeparatorPipe } from '../../shared/custom-pipes/separator.pipe';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { MatMenuModule } from '@angular/material/menu';

/**
 * Component representing a user's profile menu.
 */
@Component({
  selector: 'app-profile-menu',
  standalone: true,
  templateUrl: './profile-menu.component.html',
  styleUrls: ['./profile-menu.component.scss'],
  imports: [
    RouterLink,
    TitleCasePipe,
    SeparatorPipe,
    MatListModule,
    MatTooltipModule,
    AvatarDirective,
    MatMenuModule,
  ],
})
export class ProfileMenuComponent {
  /** The user object representing the current user's profile data */
  @Input({ required: true }) user!: UserPrivateDTO;

  /**
   * The navigation link(s) for the profile menu, which can be an array of route segments,
   * a simple string path, or null/undefined for no navigation action.
   */
  @Input() profileMenuRouterLink: unknown[] | string | null | undefined = [];
}
