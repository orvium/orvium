import { InputWithChipsComponent } from './input-with-chips.component';
import { MockRender, ngMocks } from 'ng-mocks';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { Component, EventEmitter } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatFormFieldModule } from '@angular/material/form-field';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-example',
  standalone: true,
  template: ` <div [formGroup]="formTest">
    <mat-form-field appearance="outline">
      <mat-label>Publication keywords</mat-label>
      <app-input-with-chips
        ngDefaultControl
        placeholder="my keywords"
        [formControl]="formTest.controls.keywords"
      />
      <mat-hint class="accent"
        >Separate your keywords using "enter", "comma", and "semicolon"
      </mat-hint>
    </mat-form-field>
  </div>`,
  imports: [MatFormFieldModule, InputWithChipsComponent, ReactiveFormsModule],
})
class ExampleComponent {
  formTest = this.formBuilder.group({
    keywords: new FormControl<string[]>([], { nonNullable: true }),
  });

  constructor(private formBuilder: FormBuilder) {}
}

describe('InputWithChipsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExampleComponent, NoopAnimationsModule, InputWithChipsComponent],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ExampleComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should add keyword', () => {
    const fixture = MockRender(ExampleComponent);
    const keyWordInput = ngMocks.find(fixture, 'input');
    ngMocks.trigger(keyWordInput, 'matChipInputTokenEnd', {
      value: 'newKeyword',
    } as unknown as UIEvent);
    expect(fixture.point.componentInstance.formTest.controls.keywords.value.length).toBe(1);
    expect(fixture.point.componentInstance.formTest.controls.keywords.value[0]).toBe('newKeyword');
  });

  it('should emit value on onInputValueChange', () => {
    const fixture = MockRender(InputWithChipsComponent, {
      inputValueChange: new EventEmitter<void>(),
    });
    const component = fixture.point.componentInstance;
    const spy = jest.spyOn(component.inputValueChange, 'emit');
    const eventMock = { target: { value: '' } } as unknown as Event;
    component.onInputValueChange(eventMock);
    expect(spy).toHaveBeenCalled();
  });

  it('should set disabled state', () => {
    const fixture = MockRender(InputWithChipsComponent, { value: [] });
    const component = fixture.point.componentInstance;
    component.disabled = false;
    component.setDisabledState(true);
    expect(component.disabled).toEqual(true);
  });

  it('should call focusVia', () => {
    const fixture = MockRender(InputWithChipsComponent, { value: [] });
    const component = fixture.point.componentInstance;
    const monitor = TestBed.inject(FocusMonitor);
    const spy = jest.spyOn(monitor, 'focusVia');
    component.onContainerClick();
    expect(spy).toHaveBeenCalledWith(component.input, 'program');
  });

  it('should cut semicolon or coma', () => {
    const fixture = MockRender(InputWithChipsComponent, { value: [] });
    const clipEvent = {
      clipboardData: {
        getData: jest.fn().mockReturnValue('one, two; three'),
      },
      preventDefault: jest.fn(),
    } as unknown as ClipboardEvent;
    fixture.point.componentInstance.onPaste(clipEvent);
    expect(fixture.point.componentInstance.value.length).toBe(3);
    expect(fixture.point.componentInstance.value[0]).toBe('one');
    expect(fixture.point.componentInstance.value[1]).toBe('two');
    expect(fixture.point.componentInstance.value[2]).toBe('three');
  });
});
