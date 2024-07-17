import { ProfileService } from './profile.service';
import { of } from 'rxjs';
import { MockProvider, MockRender, ngMocks } from 'ng-mocks';
import { factoryConversationDTO, factoryUserPrivateDTO } from '../shared/test-data';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { DefaultService } from '@orvium/api';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

describe('ProfileService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
  });

  it('should be created', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    expect(service).toBeTruthy();
  });

  it('user should be able to update profile', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    expect(service.canUpdateUser(factoryUserPrivateDTO.build({ actions: ['update'] }))).toBe(true);
  });

  it('user should not be able to update profile', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    expect(service.canUpdateUser(factoryUserPrivateDTO.build({ actions: ['invalid'] }))).toBe(
      false
    );
  });

  it('should  confirma email', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    const http = ngMocks.get(HttpClient);
    const httpClientSpy = jest.spyOn(http, 'patch').mockReturnValue(of({}));

    service.confirmEmail('123456');
    expect(httpClientSpy).toHaveBeenCalled();
  });

  it('should get profile correctly', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    const http = ngMocks.get(HttpClient);
    const httpClientSpy = jest
      .spyOn(http, 'get')
      .mockReturnValue(of({ ...factoryUserPrivateDTO.build(), firstName: 'Mario' }));

    service.getProfileFromApi().subscribe(profile => {
      expect(httpClientSpy).toHaveBeenCalled();
    });
    service.getProfile().subscribe(profile => {
      expect(profile?.firstName).toEqual('Mario');
    });
    service.getProfiles({});
  });

  it('should get conversations correctly and initConversationPolling', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    const apiService = ngMocks.get(DefaultService);
    const spy = jest.spyOn(apiService, 'getConversations').mockReturnValue(
      // @ts-expect-error
      of([
        factoryConversationDTO.build(),
        factoryConversationDTO.build({ lastMessageDate: new Date() }),
      ])
    );
    service.initAppConversationsPolling();
    expect(spy).toHaveBeenCalled();
    service.getConversationsFromApi().subscribe();
    expect(spy).toHaveBeenCalled();
  });

  it('should get conversations correctly and initConversationPolling without message dates', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    const apiService = ngMocks.get(DefaultService);
    const spy = jest.spyOn(apiService, 'getConversations').mockReturnValue(
      // @ts-expect-error
      of([factoryConversationDTO.build(), factoryConversationDTO.build()])
    );
    service.initAppConversationsPolling();
    expect(spy).toHaveBeenCalled();
    service.getConversationsFromApi().subscribe();
    expect(spy).toHaveBeenCalled();
  });

  it('should get conversations', fakeAsync(() => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    const apiService = ngMocks.get(DefaultService);
    service.conversations.next([factoryConversationDTO.build()]);
    const startingConversations = service.conversations.value;
    expect(startingConversations.length).toEqual(1);
    const spy = jest.spyOn(apiService, 'getConversations').mockReturnValue(
      // @ts-expect-error
      of([
        factoryConversationDTO.build({ lastMessageDate: new Date() }),
        factoryConversationDTO.build({ lastMessageDate: new Date() }),
      ])
    );
    service.initAppConversationsPolling();
    tick(2000);

    const myConversations = service.conversations.value;
    expect(myConversations.length).toEqual(2);
    expect(spy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should get conversations link', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    //Not existing conversation
    service.getConversationLink('example');
    //Existing conversation
    const conversation = factoryConversationDTO.build();
    service.conversations.next([conversation]);
    service.getConversationLink(conversation.participants[0]);
  });

  it('should update profile', () => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    const apiService = ngMocks.get(DefaultService);
    const spy = jest.spyOn(apiService, 'updateProfile').mockReturnValue(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-argument
      of({ ...factoryUserPrivateDTO.build(), firstName: 'Mario' }) as any
    );
    service.updateProfile({ firstName: 'Mario' }).subscribe(updatedProfile => {
      expect(spy).toHaveBeenCalled();
    });
    service.getProfile().subscribe(profile => {
      expect(profile?.firstName).toEqual('Mario');
    });
  });
});

describe('profileService on SSR', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MockProvider(PLATFORM_ID, 'server')],
    });
  });

  it('should be created', () => {
    const fixture = MockRender(ProfileService);
    expect(fixture).toBeDefined();
  });

  it('should activate polling only in the browser', fakeAsync(() => {
    const fixture = MockRender(ProfileService);
    const service = fixture.point.componentInstance;
    const apiService = ngMocks.get(DefaultService);
    const spy = jest.spyOn(apiService, 'getConversations').mockReturnValue(
      // @ts-expect-error
      of([
        factoryConversationDTO.build({ lastMessageDate: new Date() }),
        factoryConversationDTO.build(),
      ])
    );
    service.initAppConversationsPolling();
    tick(2000);

    const myConversations = service.conversations.value;
    expect(myConversations.length).toEqual(2);
    expect(spy).toHaveBeenCalled();
    discardPeriodicTasks();
  }));
});
