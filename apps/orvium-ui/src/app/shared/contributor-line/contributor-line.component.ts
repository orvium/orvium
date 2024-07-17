import { Component, Input } from '@angular/core';
import { AvatarDirective } from '../directives/avatar.directive';
import { RouterLink } from '@angular/router';
import { SlicePipe } from '@angular/common';

/**
 * Represents the data for a user, including optional and mandatory properties.
 *
 * @property {string} [avatar] - Optional URL for the user's avatar image.
 * @property {string} [gravatar] - Optional URL for the user's Gravatar image.
 * @property {string} [nickname] - Optional nickname of the user.
 * @property {string} firstName - First name of the user.
 * @property {string} lastName - Last name of the user.
 * @property {string[]} institutions - List of institutions associated with the user.
 */
export interface UserData {
  avatar?: string;
  gravatar?: string;
  nickname?: string;
  firstName: string;
  lastName: string;
  institutions: string[];
}

/**
 * Component that displays a contributor's line item with avatar and name.
 */
@Component({
  selector: 'app-contributor-line',
  standalone: true,
  templateUrl: './contributor-line.component.html',
  styleUrls: ['./contributor-line.component.scss'],
  imports: [AvatarDirective, RouterLink, SlicePipe],
})
export class ContributorLineComponent {
  /** The user data to display in this component. */
  @Input({ required: true }) user!: UserData;
}
