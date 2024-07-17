import { Component, Input } from '@angular/core';
import { ShareButtonDirective, ShareService } from 'ngx-sharebuttons';
import { MatButtonModule } from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/**
 * Component for sharing media content.
 */
@Component({
  selector: 'app-share-media',
  standalone: true,
  templateUrl: './share-media.component.html',
  styleUrls: ['./share-media.component.scss'],
  imports: [MatButtonModule, FontAwesomeModule, ShareButtonDirective],
})
export class ShareMediaComponent {
  /** The subject of the media to be shared. */
  @Input() shareSubject?: string;

  /** The text to be shared. */
  @Input({ required: true }) shareText!: string;

  /**
   * Constructor for the ShareMediaComponent.
   *
   * @param {ShareService} share - The service for sharing media.
   */
  constructor(public share: ShareService) {}
}
