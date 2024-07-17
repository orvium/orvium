import { Component } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

/**
 * Component responsible for deleting a user's  profile
 */
@Component({
  selector: 'app-user-deleted',
  standalone: true,
  imports: [MatIconModule, RouterLink, MatButtonModule],
  templateUrl: './user-deleted.component.html',
  styleUrls: ['./user-deleted.component.scss'],
})
export class UserDeletedComponent {}
