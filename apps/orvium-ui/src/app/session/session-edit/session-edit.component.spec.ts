import { SessionEditComponent } from './session-edit.component';
import {
  factoryCommunityDTO,
  factoryDepositPopulatedDTO,
  factorySessionDTO,
} from '../../shared/test-data';
import { MockedComponentFixture, MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { CommunityService } from '../../communities/community.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { firstValueFrom, Observable, of } from 'rxjs';
import { AuthorDTO, DefaultService } from '@orvium/api';
import { discardPeriodicTasks, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SpinnerService } from '../../spinner/spinner.service';
import { assertIsDefined, assertIsObservable } from '../../shared/shared-functions';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import { MatChipOption } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

describe('SessionEditComponent', () => {
  const community = factoryCommunityDTO.build({
    newTracks: [
      { title: 'Metropolization', timestamp: 15 },
      {
        title: 'Agriculture',
        timestamp: 14,
      },
    ],
  });

  const deposit1 = factoryDepositPopulatedDTO.build({
    communityPopulated: community,
    newTrackTimestamp: 15,
  });

  const deposit2 = factoryDepositPopulatedDTO.build({
    communityPopulated: community,
    newTrackTimestamp: 15,
  });

  const depositsQuery = { deposits: [deposit1, deposit2], count: 1 };

  beforeEach(() => {
    const session = factorySessionDTO.build({
      community: community._id,
      speakers: [
        {
          firstName: 'John',
          lastName: 'Doe',
          tags: [],
          institutions: [],
        },
        {
          firstName: 'William',
          lastName: 'Wallace',
          tags: [],
          institutions: [],
        },
      ],
      newTrackTimestamp: 15,
      deposits: [deposit1._id],
    });

    const routeSnapshot = {
      paramMap: of(
        convertToParamMap({
          sessionId: session._id,
        })
      ),
    };
    TestBed.configureTestingModule({
      imports: [SessionEditComponent, NoopAnimationsModule, MatNativeDateModule],
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
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(of({})),
          hide: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DefaultService, {
          getCommunity: jest.fn().mockReturnValue(of(community)),
          getDeposit: jest.fn().mockReturnValue(of(deposit1)),
          getSession: jest.fn().mockReturnValue(of(session)),
          updateSession: jest.fn().mockReturnValue(of(session)),
          getDeposits: jest.fn().mockReturnValue(of(depositsQuery)),
        }),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(of()),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(SessionEditComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should remove a speaker', () => {
    const fixture = MockRender(SessionEditComponent);
    const selectSpeaker = ngMocks.find<MatChipOption>(fixture, ['data-test=speaker-chip']);
    selectSpeaker.componentInstance.select();
    assertIsDefined(fixture.point.componentInstance.session, 'session is not defined');
    expect(fixture.point.componentInstance.session.speakers.length).toBe(2);
    fixture.detectChanges();
    const deleteSpeaker = ngMocks.find(fixture, ['data-test=delete-speaker-button']);
    ngMocks.click(deleteSpeaker);
    expect(fixture.point.componentInstance.session.speakers.length).toBe(1);
  });

  it('should do on exit', () => {
    const fixture = MockRender(SessionEditComponent);
    const dialogService = TestBed.inject(DialogService);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent>);
    fixture.point.componentInstance.onExit();
  });

  it('should do on exit with form dirty', async () => {
    const fixture = MockRender(SessionEditComponent);
    fixture.point.componentInstance.sessionForm.markAsDirty();
    await testOnExit(fixture);
  });

  it('should add speaker', () => {
    const fixture = MockRender(SessionEditComponent);
    assertIsDefined(fixture.point.componentInstance.session, 'session is not defined');

    const addSpeakerButton = ngMocks.find(fixture, '[data-test=add-speaker-button]');
    ngMocks.click(addSpeakerButton);
    fixture.detectChanges();
    const nameInput = ngMocks.find(fixture, '[data-test=firstname-speaker-input]');
    ngMocks.change(nameInput, 'Name');
    const surnameInput = ngMocks.find(fixture, '[data-test=lastname-speaker-input]');
    ngMocks.change(surnameInput, 'Surname');
    fixture.detectChanges();
    const button = ngMocks.find(fixture, '[data-test=save-speaker-button]');
    ngMocks.click(button);

    expect(fixture.point.componentInstance.session.speakers.length).toBe(3);
    expect(fixture.point.componentInstance.session.speakers[2].firstName).toBe('Name');
  });

  it('should update the speaker', () => {
    const fixture = MockRender(SessionEditComponent);
    let speakerChips = ngMocks.findAll<MatChipOption>(fixture, '[data-test=speaker-chip]');
    speakerChips[1].componentInstance.select();
    fixture.detectChanges();
    const nameInput = ngMocks.find(fixture, '[data-test=firstname-speaker-input]');
    ngMocks.change(nameInput, 'Joe');
    const surnameInput = ngMocks.find(fixture, '[data-test=lastname-speaker-input]');
    ngMocks.change(surnameInput, 'Stevenson');
    fixture.detectChanges();
    const updateSpeakerButton = ngMocks.find(fixture, '[data-test=save-speaker-button]');
    ngMocks.click(updateSpeakerButton);
    fixture.detectChanges();
    speakerChips = ngMocks.findAll<MatChipOption>(fixture, '[data-test=speaker-chip]');
    speakerChips[1].componentInstance.select();
    expect(fixture.point.componentInstance.speakersForm.value).toEqual(
      expect.objectContaining({ firstName: 'Joe', lastName: 'Stevenson', index: 1 })
    );
  });

  it('should cancel the speaker selection', () => {
    const fixture = MockRender(SessionEditComponent);
    const speakerChips = ngMocks.findAll<MatChipOption>(fixture, '[data-test=speaker-chip]');
    expect(speakerChips.length).toBe(2);
    speakerChips[0].componentInstance.select();
    fixture.detectChanges();
    const cancelButton = ngMocks.find(fixture, '[data-test=cancel-speaker-button]');
    ngMocks.click(cancelButton);
    expect(fixture.point.componentInstance.speakersForm.value).toEqual(
      expect.objectContaining({ firstName: '', lastName: '', index: -1 })
    );
  });

  it('should save', () => {
    const fixture = MockRender(SessionEditComponent);
    const orvService = fixture.point.injector.get(DefaultService);
    fixture.point.componentInstance.sessionForm.markAsDirty();
    const spy = jest
      .spyOn(orvService, 'updateSession')
      // @ts-expect-error
      .mockReturnValue(of(fixture.point.componentInstance.session));
    fixture.point.componentInstance.save();
    expect(spy).toHaveBeenCalled();
    expect(fixture.point.componentInstance.sessionForm.pristine).toBe(true);
  });

  it('should not allow save session when invalid data', () => {
    const fixture = MockRender(SessionEditComponent);
    fixture.point.componentInstance.sessionForm.controls.title.setValue('');
    const saveSessionButton = ngMocks.find<MatButton>(fixture, '[data-test=save-session-button]');
    expect(saveSessionButton.componentInstance.disabled).toBe(true);
  });

  it('should delete session', fakeAsync(() => {
    const fixture = MockRender(SessionEditComponent);
    const dialogService = fixture.point.injector.get(DialogService);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent>);
    const orvService = fixture.point.injector.get(DefaultService);
    // @ts-expect-error
    const spyOrvService = jest.spyOn(orvService, 'deleteSession').mockReturnValue(of({}));
    const router = fixture.point.injector.get(Router);
    const spyRouter = jest.spyOn(router, 'navigate').mockImplementation();

    if (fixture.ngZone) {
      fixture.ngZone.run(() => fixture.point.componentInstance.deleteSession());
      tick(4);
    }
    expect(spyRouter).toHaveBeenCalledWith(['communities', community._id, 'program']);
    expect(spyOrvService).toHaveBeenCalled();
    discardPeriodicTasks();
    flush();
  }));

  it('should add and edit author as speaker', () => {
    const authorSpeaker: AuthorDTO = {
      firstName: 'John',
      lastName: 'Doe',
      credit: [],
      institutions: [],
    };
    const fixture = MockRender(SessionEditComponent);
    assertIsDefined(fixture.point.componentInstance.session, 'session is not defined');

    expect(fixture.point.componentInstance.session.speakers.length).toBe(2);
    const addSpeakerButton = ngMocks.find(fixture, '[data-test=add-speaker-button]');
    ngMocks.click(addSpeakerButton);
    fixture.detectChanges();
    fixture.point.componentInstance.selectAuthorAutocomplete(authorSpeaker);
    fixture.detectChanges();
    const saveSpeakerButton = ngMocks.find(fixture, '[data-test=save-speaker-button]');
    ngMocks.click(saveSpeakerButton);
    expect(fixture.point.componentInstance.session.speakers.length).toBe(3);
  });

  it('should remove publications when selecting a new track', () => {
    const fixture = MockRender(SessionEditComponent);
    fixture.point.componentInstance.sessionForm.controls.newTrackTimestamp.setValue(15);
    fixture.point.componentInstance.onInputValueChange('');

    const dialogService = fixture.point.injector.get(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.changeTrack();
    expect(fixture.point.componentInstance.sessionForm.controls.deposits.value).toEqual([]);
  });

  it('should save session', () => {
    const fixture = MockRender(SessionEditComponent);

    assertIsDefined(fixture.point.componentInstance.session, 'session is not defined');
    fixture.point.componentInstance.session.newTrackTimestamp = 16;
    fixture.point.componentInstance.save();
    expect(fixture.point.componentInstance.session.newTrackTimestamp).toBe(16);
  });

  it('should set date+time', () => {
    const fixture = MockRender(SessionEditComponent);
    fixture.detectChanges();
    const component = fixture.point.componentInstance;
    const timeInputStart = ngMocks.find<HTMLInputElement>('[data-test=input-dateStartPicker]');
    const timePickerStart = ngMocks.find<HTMLButtonElement>('[data-test=button-dateStartPicker]');
    const timeInputEnd = ngMocks.find<HTMLInputElement>('[data-test=input-dateEndPicker]');
    const timePickerEnd = ngMocks.find<HTMLButtonElement>('[data-test=button-dateEndPicker]');

    timeInputStart.componentInstance.showPicker = jest.fn();
    timeInputEnd.componentInstance.showPicker = jest.fn();

    ngMocks.click(timePickerStart);
    ngMocks.click(timePickerEnd);

    const currentDate = new Date();
    component.sessionForm.controls.dateStart.setValue(new Date(currentDate.valueOf()));
    component.sessionForm.controls.dateEnd.setValue(new Date(currentDate.valueOf()));

    const dateStart = new Date(component.sessionForm.controls.dateStart.value.valueOf());
    dateStart.setHours(22, 1);
    timeInputStart.componentInstance.value = '22:01';
    component.setTime(timeInputStart.componentInstance, component.sessionForm.controls.dateStart);
    expect(component.sessionForm.controls.dateStart.value).toStrictEqual(dateStart);

    const dateEnd = new Date(component.sessionForm.controls.dateEnd.value.valueOf());
    dateEnd.setHours(22, 10);
    timeInputStart.componentInstance.value = '22:10';
    component.setTime(timeInputStart.componentInstance, component.sessionForm.controls.dateEnd);
    expect(component.sessionForm.controls.dateEnd.value).toStrictEqual(dateEnd);

    expect(component.sessionDuration).toStrictEqual({ hours: 0, minutes: 9 });
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
