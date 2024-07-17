import {
  assertIsDefined,
  assertIsObservable,
  canOpenOverleaf,
  getDelta,
  hasJsonStructure,
  showFormValidationErrors,
} from './shared-functions';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { factoryUserPublicDTO } from './test-data';
import { of } from 'rxjs';

describe('Shared Functions', () => {
  it('should return RegExpMatchArray if match', () => {
    expect(canOpenOverleaf('justTestName.tex.txt')).toEqual(['justTestName.tex']);
  });

  it('should test assertIsDefined', () => {
    expect(function () {
      assertIsDefined(null, 'msg');
    }).toThrow(new Error('msg'));

    expect(function () {
      assertIsDefined(null);
    }).toThrow(new Error('Variable not defined'));
  });

  it('should assertIsObservable', () => {
    expect(() => assertIsObservable('some text')).toThrow('Value is not Observable');
    expect(() => assertIsObservable(of(true))).not.toThrow();
  });

  it('should showFormValidationErrors', () => {
    const dummyValidator = (control: AbstractControl): ValidationErrors | null => {
      const age = control.get('age');
      return age?.value < 0 ? { invalidAge: true } : null;
    };

    const form = new FormGroup(
      {
        name: new FormControl(''),
        age: new FormControl(50, { validators: [Validators.min(0)] }),
      },
      { validators: dummyValidator }
    );
    const spy = jest.spyOn(console, 'log').mockImplementation();
    showFormValidationErrors(form);
    expect(spy).toHaveBeenNthCalledWith(1, 'Current form validity is true. Form disabled: false');
    expect(spy).toHaveBeenNthCalledWith(2, { age: 50, name: '' });

    form.controls.age.setValue(-1);
    showFormValidationErrors(form);
    expect(spy).toHaveBeenNthCalledWith(3, 'Current form validity is false. Form disabled: false');
    expect(spy).toHaveBeenNthCalledWith(4, { age: -1, name: '' });
  });

  it('should create DTO factoryUserPublicDTO', () => {
    const user = factoryUserPublicDTO.build();
    expect(user).toBeDefined();
  });

  it('should validate hasJsonStructure', () => {
    expect(hasJsonStructure('1234')).toBe(false);
    expect(hasJsonStructure('(){}dcasdf')).toBe(false);
    expect(hasJsonStructure(JSON.stringify({}))).toBe(true);
    expect(hasJsonStructure(JSON.stringify([]))).toBe(true);
  });
});

describe('getDelta', () => {
  describe('field type === primitive', () => {
    it('should find differense with primitive fields', () => {
      const oldValue = { name: 'bob', age: 2 };
      const newValue = { name: 'sam', age: 2 };
      const result = getDelta(newValue, oldValue);
      expect(result).toEqual({ name: 'sam' });
    });
  });

  describe('field type === object', () => {
    it('should find differense with nested objects', () => {
      const oldValue = { user: { name: 'bob', age: 2 } };
      const newValue = { user: { name: 'sam', age: 2 } };
      const result = getDelta(newValue, oldValue);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(result).toEqual({ user: { name: 'sam', age: 2 } as any });
    });
  });

  describe('field type === array', () => {
    describe('array of primitives', () => {
      it('should find differense when added new value', () => {
        const oldValue = { ids: ['1', '2'] };
        const newValue = { ids: ['1', '2', '3'] };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({ ids: ['1', '2', '3'] });
      });

      it('should find differense when removed value', () => {
        const oldValue = { ids: ['1', '2'] };
        const newValue = { ids: ['1'] };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({ ids: ['1'] });
      });

      it('should find differense when one of values changed', () => {
        const oldValue = { ids: ['1', '1'] };
        const newValue = { ids: ['1', '2'] };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({ ids: ['1', '2'] });
      });

      it('should find differense when values equal but in defferent order', () => {
        const oldValue = { ids: ['1', '2'] };
        const newValue = { ids: ['2', '1'] };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({ ids: ['2', '1'] });
      });
    });

    describe('array of objects', () => {
      it('should not find differense when objects equal', () => {
        const oldValue = {
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2 },
          ],
        };
        const newValue = {
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2 },
          ],
        };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({});
      });

      it('should find differense if order changed + avoid title', () => {
        const oldValue = {
          users: [
            { name: 'bob', age: 2 },
            { name: 'sam', age: 2 },
          ],
          title: 'title',
        };
        const newValue = {
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2 },
          ],
          title: 'title',
        };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2 },
          ],
        });
      });

      it('should find differense when object changed + avoid title', () => {
        const oldValue = {
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2 },
          ],
          title: 'title',
        };
        const newValue = {
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 22222 },
          ],
          title: 'title',
        };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 22222 },
          ],
        });
      });

      it('should find differense when object field removed + avoid title', () => {
        const oldValue = {
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2 },
          ],
          title: 'title',
        };
        const newValue = {
          users: [{ name: 'sam', age: 2 }, { name: 'bob' }],
          title: 'title',
        };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({
          users: [{ name: 'sam', age: 2 }, { name: 'bob' }],
        });
      });

      it('should find differense when object field added + avoid title', () => {
        const oldValue = {
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2 },
          ],
          title: 'title',
        };
        const newValue = {
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2, surname: 'doe' },
          ],
          title: 'title',
        };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({
          users: [
            { name: 'sam', age: 2 },
            { name: 'bob', age: 2, surname: 'doe' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any[],
        });
      });

      it('should find differense when nested object changed + avoid title', () => {
        const oldValue = {
          users: [{ name: { first: 'jon', last: 'doe' }, age: 2 }],
          title: 'title',
        };
        const newValue = {
          users: [{ name: { first: 'ben', last: 'doe' }, age: 2 }],
          title: 'title',
        };
        const result = getDelta(newValue, oldValue);
        expect(result).toEqual({
          users: [
            { name: { first: 'ben', last: 'doe' }, age: 2 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ] as any[],
        });
      });
    });
  });
});
