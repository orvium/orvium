import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ChatMessagesComponent } from './chat-messages.component';
import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { DefaultService, MessageDTO } from '@orvium/api';
import { factoryConversationDTO, factoryMessageDTO } from '../../shared/test-data';
import { of } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { HttpResponse } from '@angular/common/http';

describe('ChatMessagesComponent', () => {
  const conversation = factoryConversationDTO.build();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatMessagesComponent, MockComponent(CdkVirtualScrollViewport)],
      providers: [
        MockProvider(DefaultService, {
          getConversationMessages: jest.fn().mockReturnValue(of([factoryMessageDTO.build()])),
        }),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = MockRender(ChatMessagesComponent, { conversation: conversation });
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should get conversation messages', fakeAsync(() => {
    const fixture = MockRender(ChatMessagesComponent, {
      conversation: conversation,
      messages: [],
    });
    tick(1500);
    expect(fixture.point.componentInstance.messages).toBeTruthy();
    discardPeriodicTasks();
  }));

  it('should scroll with new messages', fakeAsync(() => {
    const fixture = MockRender(ChatMessagesComponent, {
      conversation: conversation,
      messages: [],
    });
    fixture.point.componentInstance.newMessages = true;
    fixture.detectChanges();
    tick(1500);
    expect(fixture.point.componentInstance.virtualScrollViewport.scrollTo).toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should clear messages, on conversation change', () => {
    const fixture = MockRender(
      ChatMessagesComponent,
      {
        conversation: factoryConversationDTO.build(),
        messages: [factoryMessageDTO.build(), factoryMessageDTO.build()],
      },
      {
        providers: [
          MockProvider(DefaultService, {
            getConversationMessages: jest.fn().mockReturnValue(of([factoryMessageDTO.build()])),
          }),
        ],
      }
    );

    expect(fixture.point.componentInstance.messages.length).toBe(1);
  });

  it('should get conversation messages if no other message are present', fakeAsync(() => {
    const fixture = MockRender(
      ChatMessagesComponent,
      {
        conversation: conversation,
        messages: [],
      },
      {
        providers: [
          MockProvider(DefaultService, {
            getConversationMessages: jest.fn().mockReturnValue(of([])),
          }),
        ],
      }
    );
    const apiService = fixture.point.injector.get(DefaultService);

    const spyApi = jest
      .spyOn(apiService, 'getConversationMessages')
      .mockReturnValueOnce(of([] as unknown as HttpResponse<MessageDTO[]>));

    tick(1500);
    expect(spyApi).toHaveBeenCalledWith({
      conversationId: conversation._id,
      fromDate: undefined,
    });
    discardPeriodicTasks();
  }));

  it('should get more conversation messages', () => {
    const conversation = factoryConversationDTO.build();
    const params = {
      conversation: conversation,
    };
    const messages = [1, 2, 3].map(n =>
      factoryMessageDTO.build({ _id: conversation._id, content: `Example ${n}` })
    );

    const fixture = MockRender(ChatMessagesComponent, params, {
      providers: [
        MockProvider(DefaultService, {
          getConversationMessages: jest.fn().mockReturnValue(of(messages)),
        }),
      ],
    });
    const apiService = fixture.point.injector.get(DefaultService);

    const spyApi = jest
      .spyOn(apiService, 'getConversationMessages')
      .mockReturnValueOnce(of([] as unknown as HttpResponse<MessageDTO[]>));

    fixture.point.componentInstance.getMoreMessages();
    expect(spyApi).toHaveBeenCalled();
    fixture.point.componentInstance.getMoreMessages();
    expect(spyApi).toHaveBeenCalled();
  });
});
