import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NgClass } from '@angular/common';

export class Benefit {
  title!: string;
  icon!: string;
  description!: string;
}

/**
 * A component that displays a benefit item with an icon and text. The component can be styled with specific color themes.
 */
@Component({
  selector: 'app-benefit',
  standalone: true,
  templateUrl: './benefit.component.html',
  styleUrls: ['./benefit.component.scss'],
  imports: [MatIconModule, NgClass],
})
export class BenefitComponent {
  /** The benefit data containing details like title, description, and icon to be displayed. */
  @Input({ required: true }) benefit: Benefit = new Benefit();

  /** An optional input to specify the color theme for the benefit display. */
  @Input() colorClass: 'pink' | 'green' | 'purple' = 'green';
}
