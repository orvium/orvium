import { TestBed } from '@angular/core/testing';

import { CommunitiesListComponent } from './communities-list.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { DefaultService } from '@orvium/api';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DialogService } from '../../dialogs/dialog.service';
import { factoryCommunityPopulatedDTO } from '../../shared/test-data';
import { MatDialogRef } from '@angular/material/dialog';
import {
  InputDialogComponent,
  InputDialogResponse,
} from '../../dialogs/input-dialog/input-dialog.component';
import AdminPanelComponent from '../../admin/admin-panel/admin-panel.component';

describe('CommunitiesListComponent', () => {
  const community = factoryCommunityPopulatedDTO.build();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CommunitiesListComponent,
        AdminPanelComponent,
        HttpClientTestingModule,
        MatSnackBarModule,
        RouterTestingModule,
      ],
      providers: [
        MockProvider(DefaultService, {
          uploadLogoImageConfirmation: jest.fn().mockReturnValue(of({})),
          uploadLogoImage: jest.fn().mockReturnValue(of({})),
          getCommunitiesPendingApproval: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(AppSnackBarService),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CommunitiesListComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should open accept modal', () => {
    const fixture = MockRender(CommunitiesListComponent);
    fixture.detectChanges();
    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openInputDialog').mockReturnValue({
      afterClosed: () => of({ action: true, inputValue: 'test' }),
    } as MatDialogRef<InputDialogComponent, InputDialogResponse>);
    const apiService = fixture.point.injector.get(DefaultService);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    const spy = jest.spyOn(apiService, 'acceptCommunity').mockReturnValue(of(community as any));
    fixture.point.componentInstance.openAcceptModal(community);
    expect(spy).toHaveBeenCalled();
  });
});
