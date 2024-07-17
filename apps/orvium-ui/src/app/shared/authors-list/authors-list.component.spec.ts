import { AuthorsListComponent } from './authors-list.component';
import { MockProvider, MockRender } from 'ng-mocks';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { InviteService } from '../../services/invite.service';
import { ProfileService } from '../../profile/profile.service';
import { of } from 'rxjs';
import { factoryUserPrivateDTO, factoryUserPublicDTO, generateObjectId } from '../test-data';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DefaultService } from '@orvium/api';
import { Router } from '@angular/router';

describe('AuthorsListComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AuthorsListComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        MockProvider(InviteService, {
          openInviteDialog: jest.fn().mockImplementation(),
        }),
        MockProvider(ProfileService, {
          getConversationLink: jest.fn().mockReturnValue(of({})),
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(DefaultService, {
          getPublicProfile: jest.fn().mockReturnValue(of(factoryUserPublicDTO.build())),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(AuthorsListComponent);
    expect(fixture).toBeTruthy();
  });

  it('should emit invite clicked', () => {
    const fixture = MockRender(AuthorsListComponent);
    const inviteService = fixture.point.injector.get(InviteService);
    fixture.point.componentInstance.inviteAuthor();
    expect(inviteService.openInviteDialog).toHaveBeenCalled();
  });

  it('should open a Conversation', () => {
    const fixture = MockRender(AuthorsListComponent);
    const profileService = TestBed.inject(ProfileService);
    const router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
    const params = { routerLink: '/chat', queryParam: { conversationId: generateObjectId() } };
    // @ts-expect-error
    const spy = jest.spyOn(profileService, 'getConversationLink').mockReturnValue(of(params));
    fixture.point.componentInstance.openConversation(factoryUserPublicDTO.build());
    expect(spy).toHaveBeenCalled();
  });
});
