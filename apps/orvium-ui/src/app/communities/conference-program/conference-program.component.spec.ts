import { ConferenceProgramComponent } from './conference-program.component';
import { MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import {
  factoryCommunityPopulatedDTO,
  factoryDepositPopulatedDTO,
  factorySessionDTO,
} from '../../shared/test-data';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { DefaultService, SessionDTO } from '@orvium/api';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { SpinnerService } from '../../spinner/spinner.service';
import { DialogService } from '../../dialogs/dialog.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChip } from '@angular/material/chips';
import { HttpEvent } from '@angular/common/http';

describe('ConferenceProgramComponent', () => {
  const community = factoryCommunityPopulatedDTO.build();

  beforeEach(() => {
    const routeSnapshot = {
      paramMap: of(
        convertToParamMap({
          communityId: community._id,
        })
      ),
    };
    const session1 = factorySessionDTO.build({
      title: 'Urbanism session',
      newTrackTimestamp: 15,
      dateStart: new Date(2022, 7, 5, 13, 0, 0),
      dateEnd: new Date(2022, 7, 5, 14, 0, 0),
    });

    const session2 = factorySessionDTO.build({
      title: 'Anthropology session 1',
      newTrackTimestamp: 15,
      dateStart: new Date(2022, 7, 5, 15, 0, 0),
      dateEnd: new Date(2022, 7, 5, 16, 0, 0),
    });

    const session3 = factorySessionDTO.build({
      title: 'Anthropology session 2',
      newTrackTimestamp: 15,
      dateStart: new Date(2022, 5, 7, 15, 0, 0),
      dateEnd: new Date(2022, 5, 7, 16, 0, 0),
    });

    const sessions = [session1, session2, session3];
    TestBed.configureTestingModule({
      imports: [
        ConferenceProgramComponent,
        MatSnackBarModule,
        NoopAnimationsModule,
        RouterTestingModule,
      ],
      providers: [
        MockProvider(DefaultService, {
          getDeposit: jest.fn().mockReturnValue(of(factoryDepositPopulatedDTO.build())),
          getCommunity: jest.fn().mockReturnValue(
            of(
              factoryCommunityPopulatedDTO.build({
                newTracks: [{ title: 'my track', timestamp: 15, description: '' }],
              })
            )
          ),
          createSession: jest.fn(),
          getSessions: jest.fn().mockReturnValue(of(sessions)),
        }),
        MockProvider(SpinnerService, {
          show: jest.fn().mockReturnValue(null),
          hide: jest.fn().mockReturnValue(null),
        }),
        MockProvider(DialogService),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ConferenceProgramComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should create a session', () => {
    const fixture = MockRender(ConferenceProgramComponent);
    const apiService = TestBed.inject(DefaultService);
    const router = fixture.point.injector.get(Router);
    const spyRouter = jest.spyOn(router, 'navigate').mockImplementation();
    jest
      .spyOn(apiService, 'createSession')
      .mockReturnValue(of(factorySessionDTO.build() as unknown as HttpEvent<SessionDTO>));
    fixture.point.componentInstance.createSession();
    expect(apiService.createSession).toHaveBeenCalled();
    expect(spyRouter).toHaveBeenCalled();
  });

  it('should filter sessions by date', () => {
    const fixture = MockRender(ConferenceProgramComponent);
    const dateChips = ngMocks.findAll<MatChip>(fixture, '[data-test=date-chip]');
    const apiService = fixture.point.injector.get(DefaultService);
    const spyapiService = jest.spyOn(apiService, 'getSessions');
    fixture.point.componentInstance.selectedDays.push(new Date(2022, 7, 5, 0, 0, 0));
    fixture.detectChanges();
    ngMocks.click(dateChips[0]);
    fixture.detectChanges();
    expect(spyapiService).toHaveBeenCalled();
  });

  it('should filter sessions', () => {
    const fixture = MockRender(ConferenceProgramComponent);
    const filterEventMock: Record<string, unknown> = {
      query: 'Urbanism',
    };
    fixture.detectChanges();
    fixture.point.componentInstance.filterSessions(filterEventMock);
    fixture.detectChanges();
    const orvService = fixture.point.injector.get(DefaultService);
    const spyOrvService = jest.spyOn(orvService, 'getSessions');
    expect(fixture.point.componentInstance.sessionQuery).toBe(filterEventMock);
    expect(spyOrvService).toHaveBeenCalled();
  });

  it('should filter sessions 2 selected days', () => {
    const fixture = MockRender(ConferenceProgramComponent);
    const filterEventMock: Record<string, unknown> = {
      query: 'Urbanism',
    };
    fixture.point.componentInstance.selectedDays.push(new Date(2022, 7, 5, 0, 0, 0));
    fixture.point.componentInstance.selectedDays.push(new Date(2022, 8, 5, 0, 0, 0));
    fixture.detectChanges();
    fixture.point.componentInstance.filterSessions(filterEventMock);
    fixture.detectChanges();
    const orvService = fixture.point.injector.get(DefaultService);
    const spyOrvService = jest.spyOn(orvService, 'getSessions');
    expect(fixture.point.componentInstance.sessionQuery).toBe(filterEventMock);
    expect(spyOrvService).toHaveBeenCalled();
  });

  it('should order sessions with same date', () => {
    const fixture = MockRender(ConferenceProgramComponent);
    fixture.detectChanges();
    //Add sessions with the same date
    fixture.point.componentInstance.sessions = [
      factorySessionDTO.build({
        dateStart: new Date(2022, 7, 5, 0, 0, 0),
        description: 'session 1',
      }),
      factorySessionDTO.build({
        dateStart: new Date(2022, 7, 5, 0, 0, 0),
        description: 'session 2',
      }),
    ];
    fixture.point.componentInstance.orderSessions();
    expect(fixture.point.componentInstance.sessions[0].description).toBe('session 1');
  });

  it('should order sessions without sessions', () => {
    const fixture = MockRender(ConferenceProgramComponent);
    fixture.detectChanges();
    //Try to order session without session with date start
    fixture.point.componentInstance.sessions = [
      factorySessionDTO.build({ dateStart: undefined, description: 'session 1' }),
      factorySessionDTO.build({
        dateStart: new Date(2022, 7, 5, 0, 0, 0),
        description: 'session 2',
      }),
    ];
    fixture.point.componentInstance.orderSessions();
    expect(fixture.point.componentInstance.sessions[0].description).toBe('session 1');
  });

  it('should refesh actions', () => {
    const fixture = MockRender(ConferenceProgramComponent);
    fixture.point.componentInstance.refreshActions();
  });
});
