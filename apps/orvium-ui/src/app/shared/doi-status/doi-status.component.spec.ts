import { TestBed } from '@angular/core/testing';

import { DoiStatusComponent } from './doi-status.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DialogService } from '../../dialogs/dialog.service';
import { of } from 'rxjs';
import { generateObjectId } from '../test-data';
import { DefaultService, DoiStatus } from '@orvium/api';
import { MatSnackBarModule } from '@angular/material/snack-bar';

describe('DoiStatusComponent', () => {
  const defaultParams = {
    doi: '10.55835/5fa1908fd29a17dc961cc435',
    resourceId: generateObjectId(),
    doiStatus: DoiStatus.Processing,
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DoiStatusComponent, HttpClientTestingModule, MatSnackBarModule],
      providers: [
        MockProvider(DefaultService, {
          getDoiLog: jest.fn().mockReturnValue(of('<xml></xml>')),
        }),
        MockProvider(DialogService, {
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(DoiStatusComponent, { ...defaultParams });
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should open doi status dialog', () => {
    const fixture = MockRender(DoiStatusComponent, { ...defaultParams });
    fixture.point.componentInstance.openErrorInfo();
  });
});
