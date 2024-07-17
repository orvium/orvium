import { Component, Input } from '@angular/core';
import { UserSummaryDTO } from '@orvium/api';
import { AvatarDirective } from '../directives/avatar.directive';
import { RouterLink } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { SeparatorPipe } from '../custom-pipes/separator.pipe';

/**
 * Component to display a user's information in a line.
 */
@Component({
  selector: 'app-user-line',
  standalone: true,
  templateUrl: './user-line.component.html',
  styleUrls: ['./user-line.component.scss'],
  imports: [AvatarDirective, RouterLink, TitleCasePipe, SeparatorPipe],
})
export class UserLineComponent {
  /** The user data to be displayed. */
  @Input({ required: true }) user!: Pick<
    UserSummaryDTO,
    'avatar' | 'gravatar' | 'firstName' | 'lastName' | 'institutions'
  >;

  /** The size of the user's avatar. */
  @Input() avatarSize = 42;

  /** The router link for the user line. */
  @Input() userLineRouterLink?: unknown[] | string | null | undefined;
}
