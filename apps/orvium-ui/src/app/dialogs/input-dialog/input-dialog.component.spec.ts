import { InputDialogComponent } from './input-dialog.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('InputDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InputDialogComponent, NoopAnimationsModule],
      providers: [
        MockProvider(MatDialogRef, {
          close: jest.fn().mockReturnValue(of({})),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(InputDialogComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should close the dialog', () => {
    const fixture = MockRender(InputDialogComponent);
    const service = fixture.point.injector.get(MatDialogRef);
    fixture.point.componentInstance.inputForm.patchValue({
      message: 'test',
    });
    fixture.componentInstance.confirm();
    expect(service.close).toHaveBeenCalledWith({ action: true, inputValue: 'test' });
    fixture.componentInstance.cancel();
    expect(service.close).toHaveBeenCalledWith({ action: false, inputValue: '' });
  });
});
