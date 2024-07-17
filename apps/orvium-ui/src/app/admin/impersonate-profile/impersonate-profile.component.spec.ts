import { ImpersonateProfileComponent } from './impersonate-profile.component';
import { factoryUserPrivateDTO } from '../../shared/test-data';
import { of } from 'rxjs';
import { MockProvider, MockRender } from 'ng-mocks';
import { ProfileService } from '../../profile/profile.service';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

describe('ImpersonateProfileComponent', () => {
  const profile = factoryUserPrivateDTO.build();
  const profiles = [factoryUserPrivateDTO.build(), factoryUserPrivateDTO.build()];
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ImpersonateProfileComponent, RouterTestingModule],
      providers: [
        MockProvider(ProfileService, {
          getProfile: jest.fn().mockReturnValue(of(profile)),
          getProfiles: jest.fn().mockReturnValue(of(profiles)),
          updateProfile: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DialogService),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ImpersonateProfileComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should get profiles', fakeAsync(() => {
    const fixture = MockRender(ImpersonateProfileComponent);
    fixture.detectChanges();
    fixture.point.componentInstance.searchFormGroup.controls.search.setValue('test');
    tick(600);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.profiles).toBe(profiles);

    fixture.point.componentInstance.searchFormGroup.controls.search.setValue('');
    tick(600);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.profiles.length).toBe(0);
  }));

  it('should impersonate user', () => {
    const fixture = MockRender(ImpersonateProfileComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.impersonate('userId');
  });
});
