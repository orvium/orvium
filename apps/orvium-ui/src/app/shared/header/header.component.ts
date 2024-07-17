import { Component, Input } from '@angular/core';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

/**
 * The HeaderComponent is a standalone component responsible for displaying the header section,
 * including social media links and a banner image.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [FontAwesomeModule],
})
export class HeaderComponent {
  /** The URL of the banner image to display. */
  @Input() bannerURL: string | undefined;

  /** The URL for the Twitter profile. */
  @Input() twitterURL?: string;

  /** The URL for the Facebook profile. */
  @Input() facebookURL?: string;

  /** The URL for the linkedin profile. */
  @Input() linkedinURl?: string;

  /** The URL for the ORCID profile. */
  @Input() orcidURL?: string;

  /** The default URL for the banner image if none is provided. */
  public defaultBannerURL = 'https://assets.orvium.io/default-banner.jpeg';
}
