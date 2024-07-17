import { Component, computed, inject } from '@angular/core';
import { NgClass, UpperCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { ThemeService } from '../../services/theme.service';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';

export interface Typography {
  text: string;
  class: string;
  description: string;
}

const DATA: Typography[] = [
  {
    text: 'ORVIUM',
    class: 'mat-display-4',
    description: 'Unique header located at the top of the page',
  },
  {
    text: 'Orvium UX',
    class: 'mat-display-3',
    description: 'Unique header located at the top of the page',
  },
  {
    text: 'Orvium UX',
    class: 'mat-display-2',
    description: 'Unique header located at the top of the page',
  },
  {
    text: 'Orvium UX',
    class: 'mat-display-1',
    description: 'Unique header located at the top of the page',
  },
  {
    text: 'Headline',
    class: 'mat-headline',
    description: 'Section heading corresponding to tag <h1>',
  },
  {
    text: 'Headline 2',
    class: 'mat-title',
    description: 'Section heading corresponding to tag <h2>',
  },
  {
    text: 'Subheading',
    class: 'mat-subheading-2',
    description: 'Section heading corresponding to tag <h3>',
  },
  {
    text: 'Subheading 2',
    class: 'mat-subheading-1',
    description: 'Section heading corresponding to tag <h4>',
  },
  {
    text: 'Body 2',
    class: 'mat-body-2',
    description: 'Bolder body text',
  },
  {
    text: 'Body',
    class: 'mat-body-1',
    description: 'Base body text',
  },
  {
    text: 'Caption',
    class: 'mat-small .mat-caption',
    description: 'Smaller body and hint text',
  },
  {
    text: 'Button',
    class: 'mat-button',
    description: 'Smaller body and hint text',
  },
];

const COLORS = [
  {
    class: 'primary',
    HEX: ['#377DFF', '#377DFF'],
  },
  {
    class: 'warn',
    HEX: ['#FF6E40', '#FF5252'],
  },
  {
    class: 'accent',
    HEX: ['#FFC107', '#FF9800'],
  },
];

const LOGO = [
  {
    url: 'https://assets.orvium.io/logo/orvium_logo_min.png',
    extension: 'png',
  },
  {
    url: 'https://assets.orvium.io/logo/logo.svg',
    extension: 'svg',
  },
  {
    url: 'https://assets.orvium.io/logo/orviumIcon.svg',
    extension: 'svg',
  },
  {
    url: 'https://assets.orvium.io/orvium_logo.png',
    extension: 'png',
  },
];

@Component({
  selector: 'app-theme-overview-demo',
  standalone: true,
  templateUrl: './theme-overview-demo.component.html',
  styleUrls: ['./theme-overview-demo.component.scss'],
  imports: [
    UpperCasePipe,
    NgClass,
    MatCardModule,
    MatExpansionModule,
    MatChipsModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatButtonModule,
    ListWrapperComponent,
  ],
})
export class ThemeOverviewDemoComponent {
  private themeService = inject(ThemeService);

  dataSource = DATA;
  dataColors = COLORS;
  dataLogo = LOGO;
  isDark = computed(() => this.themeService.theme() === 'theme-dark');
}
