import { FeedbackDialogComponent } from './feedback-dialog.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { FeedbackService } from '../feedback.service';
import { factoryUserPrivateDTO } from '../../test-data';
import { of } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('FeedbackDialogComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [FeedbackDialogComponent, NoopAnimationsModule],
      providers: [
        MockProvider(MatDialogRef, {
          afterClosed: () => of(true),
        }),
        MockProvider(FeedbackService, {
          initialVariables: { user: factoryUserPrivateDTO.build() },
        }),
      ],
    })
  );

  it('should create', () => {
    const fixture = MockRender(FeedbackDialogComponent);
    const component = fixture.point.componentInstance;
    expect(component).toBeTruthy();
  });
});
