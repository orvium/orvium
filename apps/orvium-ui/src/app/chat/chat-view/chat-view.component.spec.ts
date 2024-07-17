import { MockComponent, MockProvider, MockRender } from 'ng-mocks';
import { ProfileService } from '../../profile/profile.service';
import { ConversationPopulatedDTO, DefaultService } from '@orvium/api';
import { BehaviorSubject, of } from 'rxjs';
import ChatViewComponent from './chat-view.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import {
  factoryConversationDTO,
  factoryMessageDTO,
  factoryUserPrivateDTO,
} from '../../shared/test-data';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChatMessagesComponent } from '../chat-messages/chat-messages.component';

describe('ChatViewComponent', () => {
  const conversation = factoryConversationDTO.build();
  const user = factoryUserPrivateDTO.build();

  let routeSnapshot: { queryParamMap: unknown };

  beforeEach(async () => {
    routeSnapshot = {
      queryParamMap: of(
        convertToParamMap({
          conversationId: conversation._id,
          recipientId: user._id,
        })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ChatViewComponent, NoopAnimationsModule, MockComponent(ChatMessagesComponent)],
      providers: [
        MockProvider(ProfileService, {
          conversations: new BehaviorSubject<ConversationPopulatedDTO[]>([
            factoryConversationDTO.build(),
          ]),
          getProfile: jest.fn().mockReturnValue(of(factoryUserPrivateDTO.build())),
        }),
        MockProvider(DefaultService, {
          createConversation: jest.fn().mockReturnValue(of(factoryConversationDTO.build())),
          getConversation: jest.fn().mockReturnValue(of(factoryConversationDTO.build())),
          getConversationMessages: jest.fn().mockReturnValue(of()),
          addMessage: jest.fn().mockReturnValue(of(factoryMessageDTO.build())),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = MockRender(ChatViewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });

  it('should create without recipientId query param', () => {
    routeSnapshot.queryParamMap = of(
      convertToParamMap({
        conversationId: conversation._id,
        recipientId: '',
      })
    );

    const fixture = MockRender(ChatViewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });
  it('should create without query params', () => {
    routeSnapshot.queryParamMap = of(
      convertToParamMap({
        conversationId: undefined,
        recipientId: '',
      })
    );

    const fixture = MockRender(ChatViewComponent);
    expect(fixture.point.componentInstance).toBeDefined();
  });

  it('should show chat', () => {
    const fixture = MockRender(ChatViewComponent);
    fixture.point.componentInstance.showChat(factoryConversationDTO.build());
  });

  it('should handleMessageToSent', async () => {
    const fixture = MockRender(ChatViewComponent);
    fixture.point.componentInstance.openedConversation = factoryConversationDTO.build();
    const fixtureMessages = MockRender(ChatMessagesComponent);
    fixtureMessages.point.componentInstance.messages = [factoryMessageDTO.build()];
    const apiService = fixture.point.injector.get(DefaultService);
    await fixture.point.componentInstance.handleMessageToSent(
      'My test message',
      fixtureMessages.point.componentInstance
    );
    expect(apiService.addMessage).toHaveBeenCalled();
    expect(fixtureMessages.point.componentInstance.messages.length).toBe(2);
  });
});
