import { TrimDirective } from './trim.directive';
import { MockRender, ngMocks } from 'ng-mocks';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

@Component({
  selector: 'app-testing',
  standalone: true,
  template: `<input appTrim [formControl]="name" />`,
  imports: [TrimDirective, ReactiveFormsModule],
})
class TestingComponent {
  name = new FormControl('');
}

describe('TrimDirective', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [TestingComponent],
    })
  );

  it('should create an instance', () => {
    const fixture = MockRender(TestingComponent);
    const instance = fixture.point.componentInstance;
    expect(instance).toBeTruthy();
  });

  it('should trim value', async () => {
    const fixture = MockRender(TestingComponent);
    await fixture.whenStable();

    const inputElement = ngMocks.find('input');
    ngMocks.change(inputElement, '  myvalue  ');

    expect(fixture.point.componentInstance.name.value).toBe('myvalue');

    ngMocks.change(inputElement, 3);
    expect(fixture.point.componentInstance.name.value).toBe(3);
  });
});
