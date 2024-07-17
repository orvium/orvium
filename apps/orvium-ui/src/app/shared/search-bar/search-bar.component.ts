import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

/**
 * Component for a search bar that allows users to search for papers, people, etc.
 */
@Component({
  selector: 'app-search-bar',
  standalone: true,
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  imports: [MatIconModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, NgClass],
})
export class SearchBarComponent {
  /** Placeholder text for the search input. */
  @Input() placeholder = 'Search for papers, people…';

  /** Determines if the search bar should be full width. */
  @Input() fullwidth = false;

  /** Event emitter for the search input. */
  @Output() search = new EventEmitter<string>();

  /** Form control for the search input. */
  control = new FormControl('', { nonNullable: true });

  /** Emits the search event with the current value of the search input. */
  input(): void {
    this.search.emit(this.control.value);
  }
}
