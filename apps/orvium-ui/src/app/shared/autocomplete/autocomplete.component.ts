import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommunityModeratorDTO } from '@orvium/api';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatInput, MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * A component for autocomplete functionality specifically tailored to selecting moderators from a list.
 * Allows for the selection, display, and removal of moderators via an autocomplete input field.
 */
@Component({
  selector: 'app-autocomplete',
  standalone: true,
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatInputModule,
    MatTooltipModule,
  ],
})
export class AutocompleteComponent implements OnInit {
  /** Reference to the autocomplete trigger directive for manual control. */
  @ViewChild(MatAutocompleteTrigger) autoCompleteEditor!: MatAutocompleteTrigger;

  /** Reference to the input element in the component. */
  @ViewChild(MatInput) inputElement!: MatInput;

  /** Array of moderators available for autocomplete selection. */
  @Input({ required: true }) moderators: CommunityModeratorDTO[] = [];

  /** The currently selected moderator object, if any. */
  @Input() currentValue?: CommunityModeratorDTO;

  /** Boolean flag indicating if the input field is disabled. */
  @Input() disabled = false;

  /** Tooltip text to display for the autocomplete input. */
  @Input() tooltip = '';

  /** The array of moderators filtered based on the input, for display in the dropdown. */
  public filteredArray: CommunityModeratorDTO[] = [];

  /** Event emitter for when a moderator is selected from the autocomplete list. */
  @Output() selectedModerator = new EventEmitter<CommunityModeratorDTO>();

  /** Event emitter for when the selected moderator is removed. */
  @Output() removed = new EventEmitter<void>();

  /** FormControl bound to the input element for managing the current value and validation status. */
  formControl = new FormControl<CommunityModeratorDTO | undefined>(undefined);

  /**
   * Initializes the component by setting the current value on the form control and applying any initial settings.
   */
  ngOnInit(): void {
    this.formControl.setValue(this.currentValue);
    if (this.disabled) {
      this.formControl.disable();
    }
    this.filteredArray = this.moderators;
  }

  /**
   * Generates a display string for each moderator by concatenating their first and last names.
   *
   * @param {CommunityModeratorDTO} moderator - The moderator data object.
   * @return {string} The formatted string displaying the moderator's full name.
   */
  displayEditorsName(moderator?: CommunityModeratorDTO): string {
    return moderator ? `${moderator.user.firstName} ${moderator.user.lastName}` : '';
  }

  /**
   * Handles the selection of a moderator from the autocomplete dropdown.
   *
   * @param {MatAutocompleteSelectedEvent} event - The selection event object.
   */
  onEditorSelect(event: MatAutocompleteSelectedEvent): void {
    this.currentValue = event.option.value;
    this.selectedModerator.emit(this.currentValue);
  }

  /**
   * Clears the input element to show the current moderator's name or empty if no moderator is selected.
   *
   * @param {FocusEvent} $event - The focus event object.
   */
  clearInput($event: FocusEvent): void {
    this.inputElement.value = this.currentValue
      ? `${this.currentValue.user.firstName} ${this.currentValue.user.lastName}`
      : '';
  }

  /**
   * Removes the currently selected moderator and clears the input field.
   *
   * @param {MouseEvent} event - The mouse event object.
   */
  removeEditor(event: MouseEvent): void {
    event.stopPropagation();
    this.currentValue = undefined;
    this.inputElement.value = '';
    this.removed.emit();
  }

  /**
   * Filters the moderators array based on the user's input in the autocomplete field.
   *
   * @param {Event} $event - The input event object.
   */
  public editorInputChanges($event: Event): void {
    this.filteredArray = this.moderators.filter(moderator =>
      `${moderator.user.firstName} ${moderator.user.lastName}`
        .toLowerCase()
        .includes(this.inputElement.value.toLowerCase())
    );
  }
}
