import { Component, Input, TemplateRef, ViewChild } from '@angular/core';

import { MatTooltipModule } from '@angular/material/tooltip';
import { AvatarDirective } from '../directives/avatar.directive';
import { AuthorsListComponent } from '../authors-list/authors-list.component';
import { AuthorDTO } from '@orvium/api';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogModule } from '@angular/material/dialog';

/**
 * Component to display a list of author avatars with tooltips. Includes functionality to open
 * a detailed list of authors in a popup dialog.
 */
@Component({
  selector: 'app-author-avatar-list',
  standalone: true,
  templateUrl: './author-avatar-list.component.html',
  styleUrls: ['./author-avatar-list.component.scss'],
  imports: [MatTooltipModule, AvatarDirective, AuthorsListComponent, MatDialogModule],
})
export class AuthorAvatarListComponent {
  /** Reference to the popup template for displaying the full list of authors. */
  @ViewChild('authorsPopup') authorsPopup!: TemplateRef<unknown>;

  /**
   * List of authors to display. Authors can optionally have credits, tags, avatars, and chat links
   */
  @Input() authors: (Omit<AuthorDTO, 'credit'> & {
    credit?: string[];
    tags?: string[];
    avatar?: string;
    chatLink?: string;
  })[] = [];

  /** Limit for the number of avatars to preview before showing a popup for more details. */
  @Input() previewLimit = 2;

  /**
   * Construct an instance of AuthorAvatarListComponent
   *
   * @param {DialogService} dialogService
   */
  constructor(private dialogService: DialogService) {}

  /**
   * Opens a popup to display a more detailed view of all authors when the preview limit is exceeded.
   */
  openAuthorsPopup(): void {
    this.dialogService.open(this.authorsPopup);
  }
}
