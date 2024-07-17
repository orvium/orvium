import { of } from 'rxjs';
import { MockProvider, MockRender } from 'ng-mocks';
import { VideoDialogComponent } from './video-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';

describe('CustomDialogComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VideoDialogComponent],
      providers: [
        MockProvider(MatDialogRef, {
          close: jest.fn().mockReturnValue(of({})),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(VideoDialogComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should close the dialog', () => {
    const fixture = MockRender(VideoDialogComponent);
    const service = fixture.point.injector.get(MatDialogRef);
    fixture.componentInstance.confirm();
    expect(service.close).toHaveBeenCalledWith(true);
    fixture.componentInstance.cancel();
    expect(service.close).toHaveBeenCalledWith(false);
  });
});
