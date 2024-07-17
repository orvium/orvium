import { Component, Input } from '@angular/core';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ShowMoreComponent } from '../../shared/show-more/show-more.component';
import { CallDTO } from '@orvium/api';
import { MatIconModule } from '@angular/material/icon';

/**
 * Component responsible for displaying a single call for papers in a card format.
 * It integrates several Material modules to provide a rich user interface, capable of showing
 * details like title, deadline, and other call-specific information. Suitable for displaying
 * in a grid or list of similar items.
 */
@Component({
  selector: 'app-call-for-papers-card',
  templateUrl: './call-for-papers-card.component.html',
  styleUrls: ['./call-for-papers-card.component.scss'],
  standalone: true,
  imports: [
    MatChipsModule,
    NgClass,
    TitleCasePipe,
    MatListModule,
    DatePipe,
    MatTooltipModule,
    MatCardModule,
    MatButtonModule,
    ShowMoreComponent,
    MatIconModule,
  ],
})
export class CallForPapersCardComponent {
  /**
   * Input property to receive the specific call for papers data. The component will render
   * information based on this data, such as title, description, and important dates.
   *
   * @input callForPapers Optional data object containing details about a specific call for papers.
   */
  @Input() callForPapers?: CallDTO;
}
