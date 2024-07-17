import { Component, OnInit, ViewChild } from '@angular/core';

import { CdkFixedSizeVirtualScroll, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ChatCardComponent } from '../../chat/chat-card/chat-card.component';
import { ConversationPopulatedDTO, UserSummaryDTO } from '@orvium/api';
import { factoryConversationDTO, factoryUserSummaryDTO } from '../../shared/test-data';

@Component({
  selector: 'app-chat-list-demo',
  standalone: true,
  imports: [CdkFixedSizeVirtualScroll, CdkVirtualScrollViewport, ChatCardComponent],
  templateUrl: './chat-list-demo.component.html',
  styleUrls: ['./chat-list-demo.component.scss'],
})
export class ChatListDemoComponent implements OnInit {
  @ViewChild('virtualScroll', { static: true })
  public virtualScrollViewport!: CdkVirtualScrollViewport;

  chatsWithScroll: { conversation: ConversationPopulatedDTO; header: UserSummaryDTO }[] = [];
  chatsWithoutScroll: { conversation: ConversationPopulatedDTO; header: UserSummaryDTO }[] = [];

  ngOnInit(): void {
    // Chat list without scroll
    this.chatsWithScroll.push({
      conversation: factoryConversationDTO.build(),
      header: factoryUserSummaryDTO.build(),
    });
    this.chatsWithScroll.push({
      conversation: factoryConversationDTO.build(),
      header: factoryUserSummaryDTO.build(),
    });

    // Chat list with scroll
    this.chatsWithoutScroll.push({
      conversation: factoryConversationDTO.build(),
      header: factoryUserSummaryDTO.build(),
    });
    this.chatsWithoutScroll.push({
      conversation: factoryConversationDTO.build(),
      header: factoryUserSummaryDTO.build(),
    });
    this.chatsWithoutScroll.push({
      conversation: factoryConversationDTO.build(),
      header: factoryUserSummaryDTO.build(),
    });
    this.chatsWithoutScroll.push({
      conversation: factoryConversationDTO.build(),
      header: factoryUserSummaryDTO.build(),
    });
  }
}
