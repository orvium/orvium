import { Component, Input, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Component for dynamically rendering buttons either directly in a toolbar or within a dropdown menu.
 * This component adjusts its display based on the context, particularly useful for responsive designs
 * where screen size determines the layout of UI elements.
 */
@Component({
  selector: 'app-buttons-menu',
  standalone: true,
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './buttons-menu.component.html',
  styleUrls: ['./buttons-menu.component.scss'],
})
export class ButtonsMenuComponent {
  /**
   * Required input that defines the template for buttons to be displayed directly in the toolbar.
   */
  @Input({ required: true }) buttonsInToolbar!: TemplateRef<unknown>;

  /**
   * Optional input that defines the template for additional buttons that are always displayed within the menu.
   */
  @Input() buttonsAlwaysInMenu?: TemplateRef<unknown>;

  /**
   * Required input indicating whether the component is being used on a mobile device.
   * This can influence how buttons are rendered (directly in the toolbar or in a dropdown menu).
   */
  @Input({ required: true }) isMobile!: boolean;
}
