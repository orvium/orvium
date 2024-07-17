import { TestBed } from '@angular/core/testing';

import { MyInvitationsComponent } from './my-invitations.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockComponent, MockProvider, MockRender, MockReset, ngMocks } from 'ng-mocks';
import { InvitationsListComponent } from '../invitations-list/invitations-list.component';
import { DefaultService, PaginationLimit } from '@orvium/api';
import { of } from 'rxjs';
import { factoryInvitePopulatedDTO } from '../../shared/test-data';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTab } from '@angular/material/tabs';
import { PageEvent } from '@angular/material/paginator';

describe('MyInvitationsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MyInvitationsComponent,
        NoopAnimationsModule,
        MockComponent(InvitationsListComponent),
      ],
      providers: [
        MockProvider(DefaultService, {
          myInvites: jest.fn().mockReturnValue(of([factoryInvitePopulatedDTO.build()])),
          mySentInvites: jest.fn().mockReturnValue(of([factoryInvitePopulatedDTO.build()])),
        }),
        { provide: ActivatedRoute, useValue: { snapshot: { fragment: {} } } },
      ],
    });
  });

  afterEach(MockReset);

  it('should create', () => {
    const fixture = MockRender(MyInvitationsComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should change tab', () => {
    const fixture = MockRender(MyInvitationsComponent);
    fixture.detectChanges();
    const tabs = ngMocks.findAll('[role="tab"]');
    expect(tabs.length).toBe(2);

    const router = fixture.point.injector.get(Router);
    const spy = jest.spyOn(router, 'navigate').mockImplementation();
    fixture.point.componentInstance.onTabChanged({
      index: 1,
      tab: { textLabel: 'Sent Invitations' } as MatTab,
    });
    expect(spy).toHaveBeenCalled();
  });

  it('should paginate sent invites', () => {
    const fixture = MockRender(MyInvitationsComponent);
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(apiService, 'mySentInvites');
    let event: PageEvent = { previousPageIndex: 0, pageIndex: 1, pageSize: 10, length: 25 };
    fixture.point.componentInstance.sentInvitationsPagination(event);
    expect(apiService.mySentInvites).toHaveBeenCalledWith({ page: 1, limit: PaginationLimit._10 });
    event = { previousPageIndex: 0, pageIndex: 1, pageSize: 25, length: 25 };
    fixture.point.componentInstance.sentInvitationsPagination(event);
    expect(apiService.mySentInvites).toHaveBeenCalledWith({ page: 1, limit: PaginationLimit._10 });
  });

  it('should received invites', () => {
    const fixture = MockRender(MyInvitationsComponent);
    const apiService = TestBed.inject(DefaultService);
    jest.spyOn(apiService, 'myInvites');
    let event: PageEvent = { previousPageIndex: 0, pageIndex: 1, pageSize: 10, length: 25 };
    fixture.point.componentInstance.receivedInvitationsPagination(event);
    expect(apiService.myInvites).toHaveBeenCalledWith({ page: 1, limit: PaginationLimit._10 });
    event = { previousPageIndex: 0, pageIndex: 1, pageSize: 25, length: 25 };
    fixture.point.componentInstance.receivedInvitationsPagination(event);
    expect(apiService.myInvites).toHaveBeenCalledWith({ page: 1, limit: PaginationLimit._25 });
  });
});
