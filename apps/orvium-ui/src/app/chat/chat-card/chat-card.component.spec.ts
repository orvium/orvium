import { MockProvider, MockRender } from 'ng-mocks';
import { ChatCardComponent } from './chat-card.component';
import { TestBed } from '@angular/core/testing';
import {
  factoryConversationDTO,
  factoryMessageDTO,
  factoryUserSummaryDTO,
} from '../../shared/test-data';
import { DefaultService } from '@orvium/api';
import { of } from 'rxjs';

describe('ChatCardComponent', () => {
  const conversation = factoryConversationDTO.build();

  const messages = [1, 2, 3].map(n =>
    factoryMessageDTO.build({ _id: conversation._id, content: `Example ${n}` })
  );
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChatCardComponent],
      providers: [
        MockProvider(DefaultService, {
          getConversationMessages: jest.fn().mockReturnValue(of(messages)),
        }),
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(ChatCardComponent, {
      chat: { conversation: factoryConversationDTO.build(), header: factoryUserSummaryDTO.build() },
    });
    expect(fixture.point.componentInstance).toBeDefined();
  });
});
