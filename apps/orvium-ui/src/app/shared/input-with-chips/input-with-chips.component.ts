import { FocusMonitor } from '@angular/cdk/a11y';
import { COMMA, ENTER, SEMICOLON } from '@angular/cdk/keycodes';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  Self,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { NgStyle } from '@angular/common';

/**
 * Component for input with chips, allowing users to enter multiple values separated by specified keys.
 */
@Component({
  selector: 'app-input-with-chips',
  standalone: true,
  templateUrl: './input-with-chips.component.html',
  styleUrls: ['./input-with-chips.component.scss'],
  providers: [{ provide: MatFormFieldControl, useExisting: InputWithChipsComponent }],
  imports: [MatChipsModule, MatIconModule, MatInputModule, NgStyle, MatAutocompleteModule],
})
export class InputWithChipsComponent
  implements OnInit, OnDestroy, ControlValueAccessor, MatFormFieldControl<string[]>
{
  /** Unique id for each instance of the component. */
  static nextId = 0;

  /** Observable to notify about the state changes. */
  public stateChanges = new Subject<void>();

  /** Indicates whether the input field is focused. */
  public focused = false;

  /** Control type for the form field. */
  public controlType = 'custom-form-field';

  /** Keys that can be used to separate values. */
  @Input() separatorKeysCodes = [ENTER, COMMA, SEMICOLON];

  /** Indicates if the input is required. */
  @Input() required = false;

  /** Indicates if the input is disabled. */
  @Input() disabled = false;

  /** Autocomplete component for suggestions. */
  @Input() matAutocomplete?: MatAutocomplete;

  /** Disables manual value change. */
  @Input() disableManualValueChange = false;

  /** Event emitted when input value changes. */
  @Output() inputValueChange: EventEmitter<string> = new EventEmitter<string>();

  /** Unique id for the component instance. */
  @HostBinding() id = `input-with-chips-id-${InputWithChipsComponent.nextId++}`;

  /** Aria-describedby attribute value. */
  @HostBinding('attr.aria-describedby') describedBy = '';

  /** Reference to the input element. */
  @ViewChild(MatInput, { read: ElementRef }) input!: ElementRef<HTMLInputElement>;

  /**
   * Constructor for InputWithChipsComponent.
   *
   * @param {ChangeDetectorRef} _cdr - Change detector ref for triggering change detection.
   * @param {FocusMonitor} _focusMonitor - Service to monitor focus state.
   * @param {ErrorStateMatcher} _defaultErrorStateMatcher - Default error state matcher.
   * @param {NgControl | null} ngControl - NgControl to bind the value accessor.
   */
  constructor(
    private _cdr: ChangeDetectorRef,
    private _focusMonitor: FocusMonitor,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() @Self() public ngControl: NgControl | null
  ) {
    if (this.ngControl !== null) this.ngControl.valueAccessor = this;
  }

  /** Placeholder text for the input. */
  private _placeholder = '';

  /**
   * Gets the placeholder text for the input.
   *
   * @returns {string} The placeholder text.
   */
  get placeholder(): string {
    return this._placeholder;
  }

  /**
   * Sets the placeholder text for the input and triggers state change.
   *
   * @param {string} value The placeholder text.
   */
  @Input()
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  /**
   * Value of the input with chips.
   */
  private _value: string[] = [];

  /**
   * Gets the value of the input with chips.
   *
   * @returns {string[]} The value of the input with chips.
   */
  get value(): string[] {
    return this._value;
  }

  /**
   * Sets the value of the input with chips and triggers state change.
   *
   * @param {string[]} value The value of the input with chips.
   */
  @Input()
  set value(value: string[]) {
    this._value = value;
    this.onChange(value);
    this.stateChanges.next();
  }

  /**
   * Indicates whether the label should float.
   *
   * @returns {boolean} True if the label should float, otherwise false.
   */
  @HostBinding('class.floated')
  get shouldLabelFloat(): boolean {
    return this.focused || !this.empty;
  }

  /**
   * Indicates whether the component is in an error state.
   *
   * @returns {boolean} True if the component is in an error state, otherwise false.
   */
  get errorState(): boolean {
    // @ts-expect-error
    return this._defaultErrorStateMatcher.isErrorState(this.ngControl.control as FormControl, null);
  }

  /**
   * Indicates whether the input is empty.
   *
   * @returns {boolean} True if the input is empty, otherwise false.
   */
  get empty(): boolean {
    return this.value.length === 0;
  }

  /**
   * Lifecycle hook that is called after data-bound properties of a directive are initialized.
   */
  ngOnInit(): void {
    this._cdr.detectChanges();
    this._focusMonitor.monitor(this.input).subscribe(focused => {
      this.focused = !!focused;
      this.stateChanges.next();
    });

    this._focusMonitor
      .monitor(this.input)
      .pipe(take(1))
      .subscribe(() => {
        this.onTouch();
      });

    this.matAutocomplete?.optionSelected.subscribe(($event: MatAutocompleteSelectedEvent) => {
      const newValue = [...this.value, $event.option.viewValue];
      this.writeValue(newValue);
      this.input.nativeElement.value = '';
    });
  }

  /**
   * Lifecycle hook that is called when a directive, pipe, or service is destroyed.
   */
  ngOnDestroy(): void {
    this._focusMonitor.stopMonitoring(this.input);
    this.stateChanges.complete();
  }

  onChange: (value: string[]) => void = () => {
    // do nothing
  };
  onTouch: () => void = () => {
    // do nothing
  };

  /**
   * Writes the new value to the input element.
   *
   * @param {string[]} value - New value.
   */
  writeValue(value: string[]): void {
    this.value = value;
  }

  /**
   * Registers a callback function that should be called when the control's value changes in the UI.
   *
   * @param {() => unknown} fn - Callback function.
   */
  registerOnChange(fn: () => unknown): void {
    this.onChange = fn;
  }

  /**
   * Registers a callback function that should be called when the control receives a touch event.
   *
   * @param {() => unknown} fn - Callback function.
   */
  registerOnTouched(fn: () => unknown): void {
    this.onTouch = fn;
  }

  /**
   * Sets the ids of the elements that describe the input.
   *
   * @param {string[]} ids - Array of element ids.
   */
  setDescribedByIds(ids: string[]): void {
    this.describedBy = ids.join(' ');
  }

  /**
   * Handles the container click event and focuses the input.
   */
  onContainerClick(): void {
    this._focusMonitor.focusVia(this.input, 'program');
  }

  /**
   * Sets the disabled state of the input.
   *
   * @param {boolean} isDisabled - Indicates whether the input should be disabled.
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.stateChanges.next();
  }

  /**
   * Handles input value change event.
   *
   * @param {Event} event - The input event.
   */
  onInputValueChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;

    // workaround for firefox: cut semicolon and trigger chip add
    if (inputEl.value.includes(';')) {
      const strWithoutSemicolon = inputEl.value.split(';')[0];

      this.addChip({
        input: inputEl,
        value: strWithoutSemicolon,
      } as MatChipInputEvent);
    }

    this.inputValueChange.emit(inputEl.value);
  }

  /**
   * Adds a chip to the input.
   *
   * @param {MatChipInputEvent} event - The chip input event.
   */
  addChip(event: MatChipInputEvent): void {
    // remove chip if it set not by reactive form
    if (this.disableManualValueChange) {
      event.input.value = '';
      return;
    }

    const input = event.input;
    const value = event.value;

    this.pushValue(value);

    // Reset the input value
    input.value = '';
  }

  /**
   * Removes a chip from the input.
   *
   * @param {string} chip - The chip to be removed.
   */
  removeChip(chip: string): void {
    const index = this.value.indexOf(chip);

    if (index >= 0) {
      this.value.splice(index, 1);
      this.onChange(this.value);
      this._cdr.detectChanges();
    }
  }

  /**
   * Handles paste event to add multiple chips.
   *
   * @param {ClipboardEvent} event - The clipboard event.
   */
  public onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    event.clipboardData
      ?.getData('Text')
      .split(/;|,|\n/)
      .forEach((value: string) => {
        this.pushValue(value);
      });
  }

  /**
   * Pushes a new value to the list of chips.
   *
   * @param {string} value - The value to be added.
   */
  private pushValue(value: string): void {
    if ((value || '').trim()) {
      this.value.push(value.trim());
      this.onChange(this.value);
    }
  }
}
