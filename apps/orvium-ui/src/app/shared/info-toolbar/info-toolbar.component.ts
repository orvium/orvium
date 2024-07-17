import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';

/**
 * The InfoToolbarComponent to display information in the toolbar.
 */
@Component({
  selector: 'app-info-toolbar',
  standalone: true,
  templateUrl: './info-toolbar.component.html',
  styleUrls: ['./info-toolbar.component.scss'],
  imports: [MatToolbarModule],
})
export class InfoToolbarComponent {}
