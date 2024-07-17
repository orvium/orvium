import { CallbackComponent } from './callback.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { MockProvider, MockRender } from 'ng-mocks';
import { ProfileService } from '../profile.service';
import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthenticationService } from '../../auth/authentication.service';
import { DialogService } from '../../dialogs/dialog.service';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { MatDialogRef } from '@angular/material/dialog';

describe('CallbackComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CallbackComponent, RouterTestingModule],
      providers: [
        MockProvider(ProfileService, {
          confirmEmail: jest.fn().mockReturnValue(of({ message: 'result message' })),
        }),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue({
            afterClosed: () => of(true),
          } as MatDialogRef<ConfirmDialogComponent>),
        }),
        MockProvider(ProfileService, {
          confirmEmail: jest.fn().mockReturnValue(of({ message: 'result message' })),
        }),
        MockProvider(AuthenticationService, {
          login: jest.fn().mockImplementation(),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(
      CallbackComponent,
      {},
      {
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { queryParamMap: convertToParamMap({ confirmToken: 'myConfirmToken' }) },
            },
          },
        ],
      }
    );
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should create with confirm token', () => {
    const fixture = MockRender(
      CallbackComponent,
      {},
      {
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { queryParamMap: convertToParamMap({ confirmToken: 'myConfirmToken' }) },
            },
          },
        ],
      }
    );
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should create with inviteToken', () => {
    const fixture = MockRender(
      CallbackComponent,
      {},
      {
        providers: [
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { queryParamMap: convertToParamMap({ inviteToken: 'myInviteToken' }) },
            },
          },
        ],
      }
    );
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
