import { AbstractControl, FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

/**
 * Checks if the provided filename ends with '.tex' indicating it is a TeX document suitable for opening in Overleaf.
 *
 * @param {string} filename - The name of the file to check.
 * @returns {RegExpMatchArray | null} A match array if the filename matches the TeX document pattern, otherwise null.
 */
export function canOpenOverleaf(filename: string): RegExpMatchArray | null {
  const regex = /\w+\.tex/g;
  return filename.match(regex);
}

/**
 * Asserts that the given value is not null or undefined, throws an error if the assertion fails.
 *
 * @param {Type} val - The value to be checked.
 * @param {string} [message] - Optional message to include in the error if the assertion fails.
 */
export function assertIsDefined<Type>(
  val: Type,
  message?: string
): asserts val is NonNullable<Type> {
  if (!val) {
    throw new Error(message ?? 'Variable not defined');
  }
}

/**
 * Computes the differences between two objects and returns a partial object representing the changed values.
 *
 * @param {Type} newValue - The new state of the object.
 * @param {Type2} oldValue - The old state of the object.
 * @returns {Partial<Type>} An object representing the changed values between the old and new state.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDelta<Type extends Record<string, any>, Type2 extends Type>(
  newValue: Type,
  oldValue: Type2
): Partial<Type> {
  const result: Partial<Type> = {};

  for (const key in newValue) {
    // type of field
    switch (Object.prototype.toString.call(newValue[key])) {
      case '[object Object]':
        // if field === object
        if (JSON.stringify(newValue[key]) !== JSON.stringify(oldValue[key])) {
          result[key] = newValue[key];
        }

        break;

      case '[object Array]':
        // if 2 arrays have different length -> add whole array to result
        if (newValue[key].length != oldValue[key].length) {
          result[key] = newValue[key];
        }

        // if array of primitives
        if (Object.prototype.toString.call(newValue[key][0]) !== '[object Object]') {
          // if new array has at least one new entry -> add whole array to result
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          newValue[key].forEach((el: keyof Type) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            if (!oldValue[key].includes(el)) {
              result[key] = newValue[key];
            }
          });

          // if array has at least one changed entry -> add whole array to result
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          newValue[key].forEach((el: keyof Type) => {
            if (newValue[key][el] !== oldValue[key][el]) {
              result[key] = newValue[key];
            }
          });
        }

        // if array of object
        if (Object.prototype.toString.call(newValue[key][0]) === '[object Object]') {
          // check if any differences between 2 arrays
          const isObjEqual = Object.keys(newValue[key]).every(
            el => JSON.stringify(newValue[key][el]) === JSON.stringify(oldValue[key][el])
          );
          // if any differences -> add whole array to result
          if (!isObjEqual) {
            result[key] = newValue[key];
          }
        }

        break;

      // if field type is primitive
      default:
        if (newValue[key] != oldValue[key]) {
          result[key] = newValue[key];
        }
    }
  }

  return result;
}

/**
 * Validates if a string is in a valid JSON format.
 *
 * @param {string} str - The string to test.
 * @returns {boolean} True if the string is a valid JSON, false otherwise.
 */
export function hasJsonStructure(str: string): boolean {
  try {
    const result = JSON.parse(str);
    const type = Object.prototype.toString.call(result);
    return type === '[object Object]' || type === '[object Array]';
  } catch (err) {
    return false;
  }
}

/**
 * Extracts a DOI (Digital Object Identifier) from a URL and sets it as the value of a form control.
 *
 * @param {AbstractControl<string>} control - The form control that receives the value change updates.
 * @returns {Subscription} A subscription to the value changes of the control.
 */
export function extractDOIFromURL(control: AbstractControl<string>): Subscription {
  return control.valueChanges.subscribe(selectedValue => {
    const DOI_REGEXP = /[\d.]{4,11}\/[-._;()\/:a-zA-Z0-9]+$/;
    const doi = DOI_REGEXP.exec(selectedValue);

    if (doi?.length === 1) {
      control.setValue(doi[0], { emitEvent: false });
    }
  });
}

/**
 * Type guard to check if the input is neither null nor undefined.
 *
 * @param {null | undefined | T} input - The input to check.
 * @returns {boolean} True if the input is neither null nor undefined, false otherwise.
 */
export function inputIsNotNullOrUndefined<T>(input: null | undefined | T): input is T {
  return input !== null && input !== undefined;
}

/**
 * Operator to filter out null or undefined values from an observable.
 *
 * @returns {(source$: Observable<null | undefined | T>) => Observable<T>} An RxJS operator function.
 */
export function isNotNullOrUndefined<T>(): (
  source$: Observable<null | undefined | T>
) => Observable<T> {
  return (source$: Observable<null | undefined | T>): Observable<T> =>
    source$.pipe(filter(inputIsNotNullOrUndefined));
}

/**
 * Triggers a form group to update its value and validity, logging any errors or invalid controls.
 *
 * @param {FormGroup} form - The form group to validate and log.
 */
export function showFormValidationErrors(form: FormGroup): void {
  form.updateValueAndValidity();
  console.log(
    `Current form validity is ${String(form.valid)}. Form disabled: ${String(form.disabled)}`
  );
  console.log(form.getRawValue());
  if (form.errors) {
    for (const error in form.errors) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`ValidationError  ${error}, ${form.errors[error]}`);
    }
  }
  for (const name in form.controls) {
    const control = form.controls[name];
    if (control.invalid) {
      console.log(`Invalid control ${name}`);

      if (control.errors) {
        for (const error in control.errors) {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          console.log(`ValidationError  ${error}, ${control.errors[error]}`);
        }
      }
    }
  }
}

/**
 * Asserts that the provided value is an Observable. Throws an error if it is not.
 *
 * @param {unknown} value - The value to check.
 */
export function assertIsObservable(value: unknown): asserts value is Observable<unknown> {
  if (!(value instanceof Observable)) {
    throw new Error('Value is not Observable');
  }
}
