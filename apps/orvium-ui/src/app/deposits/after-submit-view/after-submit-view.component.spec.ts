import { factoryUserPrivateDTO } from '../../shared/test-data';
import { UserPrivateDTO } from '@orvium/api';
import { MockProvider, MockRender } from 'ng-mocks';
import { AfterSubmitViewComponent } from './after-submit-view.component';
import { BehaviorSubject } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ProfileService } from '../../profile/profile.service';
import { TestBed } from '@angular/core/testing';

describe('AfterSubmitViewComponent', () => {
  const profile = factoryUserPrivateDTO.build({
    isOnboarded: true,
    emailPendingConfirmation: 'pending@example.com',
  });
  const routeSnapshot = { snapshot: { data: { profile } } };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AfterSubmitViewComponent],
      providers: [
        MockProvider(ProfileService, {
          profile: new BehaviorSubject<UserPrivateDTO | undefined>(profile),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(AfterSubmitViewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });
});
