import { Directive } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

@Directive({
  selector: '[appTrim]',
  standalone: true,
})
export class TrimDirective {
  constructor(private ngControl: NgControl) {
    if (this.ngControl.valueAccessor) {
      this.trimValueAccessor(this.ngControl.valueAccessor);
    }
  }

  trimValueAccessor(valueAccessor: ControlValueAccessor): void {
    const original = valueAccessor.registerOnChange;

    valueAccessor.registerOnChange = (fn: (_: unknown) => void): unknown =>
      original.call(valueAccessor, (value: unknown) =>
        fn(typeof value === 'string' ? value.trim() : value)
      );
  }
}
