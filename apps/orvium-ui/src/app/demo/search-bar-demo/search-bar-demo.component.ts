import { Component } from '@angular/core';
import { SearchBarComponent } from '../../shared/search-bar/search-bar.component';

@Component({
  selector: 'app-search-bar-demo',
  standalone: true,
  templateUrl: './search-bar-demo.component.html',
  styleUrls: ['./search-bar-demo.component.scss'],
  imports: [SearchBarComponent],
})
export class SearchBarDemoComponent {}
