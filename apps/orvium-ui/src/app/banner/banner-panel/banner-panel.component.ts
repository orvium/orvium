import { Component, Input } from '@angular/core';
import { BannerService } from '../banner.service';
import { BannerData } from '../interfaces/banner-data';
import { MatToolbarModule } from '@angular/material/toolbar';

import { MatButtonModule } from '@angular/material/button';

/**
 * Component responsible for displaying a banner within the application.
 * It utilizes material design components for UI consistency.
 */
@Component({
  selector: 'app-banner-panel',
  standalone: true,
  templateUrl: './banner-panel.component.html',
  styleUrls: ['./banner-panel.component.scss'],
  imports: [MatToolbarModule, MatButtonModule],
})
export class BannerPanelComponent {
  /**
   * Optional input for banner data. When provided, it will be used to display specific
   * content on the banner such as title, message, and action buttons.
   *
   * @input bannerInfo Data needed to display the banner. Includes details like the title,
   *        description, and any actionable buttons.
   */
  @Input() bannerInfo?: BannerData;

  /**
   * Constructor for the BannerPanelComponent.
   *
   * @param bannerService Service used to manage banner operations like display and hide.
   */
  constructor(public bannerService: BannerService) {}
}
