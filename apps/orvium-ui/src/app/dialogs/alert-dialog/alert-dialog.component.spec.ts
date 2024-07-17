import { AlertDialogComponent } from './alert-dialog.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { of } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';

describe('AlertDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AlertDialogComponent],
      providers: [
        MockProvider(MatDialogRef, {
          close: jest.fn().mockReturnValue(of({})),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(AlertDialogComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should close the dialog', () => {
    const fixture = MockRender(AlertDialogComponent);
    const service = fixture.point.injector.get(MatDialogRef);
    fixture.componentInstance.confirm();
    expect(service.close).toHaveBeenCalledWith(true);
  });
});
