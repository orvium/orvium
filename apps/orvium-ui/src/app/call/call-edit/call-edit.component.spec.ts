import { factoryCallDTO, factoryCommunityPopulatedDTO } from '../../shared/test-data';
import { MockedComponentFixture, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { CallEditComponent } from './call-edit.component';
import { CommunityService } from '../../communities/community.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { DisciplinesService } from '../../services/disciplines.service';
import { firstValueFrom, Observable, of } from 'rxjs';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { DefaultService } from '@orvium/api';
import { assertIsDefined, assertIsObservable } from '../../shared/shared-functions';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { MatNativeDateModule } from '@angular/material/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

describe('CallEditComponent', () => {
  const call = factoryCallDTO.build({ disciplines: ['Acoustics', 'Computing'] });
  beforeEach(() => {
    const routeSnapshot = {
      paramMap: of(
        convertToParamMap({
          callId: call._id,
        })
      ),
    };

    TestBed.configureTestingModule({
      imports: [CallEditComponent, MatNativeDateModule, NoopAnimationsModule],
      providers: [
        MockProvider(CommunityService, {
          getCommunityActions: jest.fn().mockReturnValue({
            moderate: true,
            update: true,
            submit: true,
          }),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue('Info message'),
          error: jest.fn().mockReturnValue('Error message'),
        }),
        MockProvider(DisciplinesService, {
          getDisciplines: jest
            .fn()
            .mockReturnValue(
              of([{ name: 'Acoustics' }, { name: 'Computing' }, { name: 'Research' }])
            ),
        }),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(of({})),
          openCustom: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DefaultService, {
          getCommunity: jest.fn().mockReturnValue(of(factoryCommunityPopulatedDTO.build())),
          updateCall: jest.fn(),
          deleteCall: jest.fn(),
          getCall: jest.fn().mockReturnValue(of(structuredClone(call))),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(CallEditComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });

  it('should save', () => {
    const fixture = MockRender(CallEditComponent);
    fixture.detectChanges();
    const apiService = fixture.point.injector.get(DefaultService);
    // eslint-disable-next-line
    const spy = jest.spyOn(apiService, 'updateCall').mockReturnValue(of(call as any));

    // TODO not sure why but deadline is not correctly parsed in the test. Working fine in the app
    fixture.point.componentInstance.callForm.controls.deadline.setValue(new Date());

    fixture.point.componentInstance.save();
    expect(spy).toHaveBeenCalled();
    expect(fixture.point.componentInstance.callForm.pristine).toBe(true);
  });

  it('should not save', () => {
    const fixture = MockRender(CallEditComponent);
    const snackBarService = fixture.point.injector.get(AppSnackBarService);
    const spySnackBar = jest.spyOn(snackBarService, 'error');
    const apiService = fixture.point.injector.get(DefaultService);
    const titleInput = ngMocks.find(fixture, '[data-test=title-input]');
    ngMocks.change(titleInput, '');
    // eslint-disable-next-line
    const spy = jest.spyOn(apiService, 'updateCall').mockReturnValue(of(call) as any);
    fixture.point.componentInstance.save();
    expect(spy).not.toHaveBeenCalled();
    expect(spySnackBar).toHaveBeenCalledWith('Please, write down all the needed info correctly.');
  });

  it('should add a discipline', () => {
    const fixture = MockRender(CallEditComponent);
    assertIsDefined(fixture.point.componentInstance.call);
    expect(fixture.point.componentInstance.call.disciplines.length).toBe(2);
    fixture.point.componentInstance.callForm.controls.disciplines.setValue(['Abnormal psychology']);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.callForm.controls.disciplines.value).toContain(
      'Abnormal psychology'
    );
  });

  it('should filter disciplines', async () => {
    const fixture = MockRender(CallEditComponent);
    fixture.point.componentInstance.onInputValueChange('rese');
    fixture.detectChanges();
    await expect(
      // @ts-expect-error
      firstValueFrom(fixture.point.componentInstance.filteredDisciplines)
    ).resolves.toContainEqual({ name: 'Research' });
  });

  it('should delete call', fakeAsync(() => {
    const fixture = MockRender(CallEditComponent);

    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    const apiService = fixture.point.injector.get(DefaultService);
    // eslint-disable-next-line
    const spyApiService = jest.spyOn(apiService, 'deleteCall').mockReturnValue(of({} as any));
    const router = fixture.point.injector.get(Router);
    const spyRouter = jest.spyOn(router, 'navigate').mockImplementation();

    if (fixture.ngZone) {
      fixture.ngZone.run(() => fixture.point.componentInstance.deleteCall());
      tick(100);
    }
    expect(spyRouter).toHaveBeenCalledWith(['/communities', call.community, 'view']);
    expect(spyApiService).toHaveBeenCalled();
  }));

  it('should do on exit pristine', () => {
    const fixture = MockRender(CallEditComponent);
    const dialogService = fixture.point.injector.get(DialogService);

    const spy = jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);

    fixture.point.componentInstance.onExit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should do on exit not pristine', async () => {
    const fixture = MockRender(CallEditComponent);
    fixture.point.componentInstance.callForm.markAsDirty();
    await testOnExit(fixture);
  });
});

async function testOnExit<
  T extends {
    onExit: () => Observable<boolean> | boolean;
  },
>(fixture: MockedComponentFixture<T>): Promise<void> {
  const dialogService = fixture.point.injector.get(DialogService);

  jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
    afterClosed: () => of(true),
  } as MatDialogRef<ConfirmDialogComponent, boolean>);
  const onExitTrue = fixture.point.componentInstance.onExit();
  assertIsObservable(onExitTrue);
  expect(await firstValueFrom(onExitTrue)).toBe(true);

  jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
    afterClosed: () => of(false),
  } as MatDialogRef<ConfirmDialogComponent, boolean>);
  const onExitFalse = fixture.point.componentInstance.onExit();
  assertIsObservable(onExitFalse);
  expect(await firstValueFrom(onExitFalse)).toBe(false);
}
