import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { Benefit, BenefitComponent } from '../benefit/benefit.component';

/**
 * A component that displays an empty state message for publications,
 * highlighting the benefits of publishing on the platform.
 */
@Component({
  selector: 'app-empty-state-publications',
  standalone: true,
  templateUrl: './empty-state-publications.component.html',
  styleUrls: ['./empty-state-publications.component.scss'],
  imports: [MatButtonModule, RouterLink, MatIconModule, BenefitComponent],
})
export class EmptyStatePublicationsComponent {
  /**
   * A list of benefits for publishing on the platform.
   * Each benefit includes a title, icon, and description.
   */
  publishingBenefits: Benefit[] = [
    {
      title: 'Community',
      icon: 'people_alt',
      description:
        'We a <strong>global community of researchers like you</strong>, waiting to meet you. From PhD students to professional ' +
        'researchers. From medical to legal research. Join the conversation now.',
    },
    {
      title: 'Open Access',
      icon: 'lock_open',
      description:
        'Open Access refers to free, unrestricted online access to research outputs such as journal articles and books. ' +
        'All our content is <strong>open to everyone</strong>, with no access fees.',
    },
    {
      title: 'Publish and review',
      icon: 'article',
      description:
        'Get your paper ready for publication. Improve your manuscript and <strong>increase your publishing ' +
        'opportunities</strong> with ' +
        'constructive peer reviews made by experts in your field.',
    },
  ];
}
