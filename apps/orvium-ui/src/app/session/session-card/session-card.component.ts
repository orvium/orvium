import { Component, Input, OnInit } from '@angular/core';
import { CommunityDTO, SessionDTO } from '@orvium/api';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ShowMoreComponent } from '../../shared/show-more/show-more.component';

/**
 * Component responsible for displaying details of a specific session within a community.
 * It shows session information such as timing and track details.
 */
@Component({
  selector: 'app-session-card',
  standalone: true,
  templateUrl: './session-card.component.html',
  styleUrls: ['./session-card.component.scss'],
  imports: [DatePipe, MatCardModule, MatIconModule, RouterLink, MatButtonModule, ShowMoreComponent],
})
export class SessionCardComponent implements OnInit {
  /** The session data passed to the component, containing all details like date, title, and track information. */
  @Input({ required: true }) session!: SessionDTO;

  /** Community details that the session is part of. This includes track information and other community-specific data. */
  @Input({ required: true }) community!: CommunityDTO;

  /** The title of the track that the session belongs to, derived from the community's track list. */
  track?: string;

  /**
   * Initializes the component by setting the track information if it exists within the session data.
   */
  ngOnInit(): void {
    if (this.session.newTrackTimestamp) {
      const communityTrack = this.community.newTracks.find(
        track => track.timestamp === this.session.newTrackTimestamp
      );
      this.track = communityTrack?.title ?? '';
    }
  }
}
