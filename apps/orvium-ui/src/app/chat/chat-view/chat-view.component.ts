import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConversationPopulatedDTO,
  DefaultService,
  MessageDTO,
  UserPrivateDTO,
  UserSummaryDTO,
} from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import { ChatCardComponent } from '../chat-card/chat-card.component';

import { ChatMessagesComponent } from '../chat-messages/chat-messages.component';
import { AlertComponent } from '../../shared/alert/alert.component';
import { ChatInputBoxComponent } from '../chat-input-box/chat-input-box.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { assertIsDefined } from '../../shared/shared-functions';
import { tap } from 'rxjs/operators';

/**
 * Main chat interface component that orchestrates the display and interaction of different chat-related subcomponents,
 * including the chat list, message view, and input box. It handles navigation, conversation management,
 * and responsiveness to screen size changes.
 */
@Component({
  selector: 'app-chat-view',
  standalone: true,
  templateUrl: './chat-view.component.html',
  styleUrls: ['./chat-view.component.scss'],
  imports: [
    ChatCardComponent,
    ChatMessagesComponent,
    AlertComponent,
    ChatInputBoxComponent,
    OverlayLoadingDirective,
  ],
})
export default class ChatViewComponent implements OnInit {
  /**
   * Manages cleanup of component subscriptions to prevent memory leaks.
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Currently opened conversation, if any. This dictates which conversation messages are displayed.
   */
  openedConversation?: ConversationPopulatedDTO;

  /**
   * List of chat conversations and their corresponding headers, which include user details.
   */
  chats: { conversation: ConversationPopulatedDTO; header: UserSummaryDTO }[] = [];

  /**
   * Profile of the currently logged-in user, fetched at initialization.
   */
  profile?: UserPrivateDTO;

  /**
   * Summary details of the recipient in an opened conversation, used for display.
   */
  recipient?: UserSummaryDTO;

  /**
   * Indicates whether the view is being accessed from a mobile device, affecting layout responsiveness.
   */
  isMobile = false;

  /**
   * Constructor for the ChatViewComponent. Initializes dependencies necessary for handling chat operations,
   * managing route parameters, observing breakpoint changes for responsive design, and fetching user profiles.
   *
   * @param {DefaultService} apiService - Service used to perform API requests related to chat functionalities
   * @param {Router} router - Angular's Router service used for navigating among views or routes.
   * @param {ActivatedRoute} route - Service that contains information about the associated route linked.
   * @param {ProfileService} profileService - Service used to fetch and manage user profile data.
   * @param {BreakpointObserver} breakpointObserver - Utility to react to changes in the viewport size or query results.
   */
  constructor(
    private apiService: DefaultService,
    private router: Router,
    private route: ActivatedRoute,
    private profileService: ProfileService,
    public breakpointObserver: BreakpointObserver
  ) {}

  /**
   * Initializes the component by setting up responsiveness and fetching initial chat data.
   */
  ngOnInit(): void {
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
    this.profileService.conversations
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(conversations => {
        this.chats = [];
        for (const conversation of conversations) {
          const header = conversation.participantsPopulated.find(
            user => user._id !== this.profile?._id
          );
          assertIsDefined(header, 'Header not found');
          this.chats.push({
            conversation: conversation,
            header: header,
          });
        }
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const conversationId = params.get('conversationId') ?? '';
      const recipientId = params.get('recipientId');
      if (recipientId) {
        this.apiService
          .createConversation({
            createConversationDTO: {
              recipient: recipientId,
            },
          })
          .subscribe(conversation => {
            const header = conversation.participantsPopulated.find(
              user => user._id !== this.profile?._id
            );
            assertIsDefined(header, 'Header not found');
            this.chats.push({
              conversation: conversation,
              header: header,
            });
            void this.router.navigate([], { queryParams: { conversationId: conversation._id } });
          });
      } else if (conversationId) {
        this.apiService.getConversation({ id: conversationId }).subscribe(conversation => {
          this.openedConversation = conversation;
          this.recipient = conversation.participantsPopulated.find(
            user => user._id != this.profile?._id
          );
        });
      } else {
        this.openedConversation = undefined;
      }
    });
  }

  /**
   * Triggers to show the selected conversation messages.
   *
   * @param {ConversationPopulatedDTO} openedConversation - The conversation to display.
   */
  showChat(openedConversation: ConversationPopulatedDTO): void {
    void this.router.navigate([], { queryParams: { conversationId: openedConversation._id } });
  }

  /**
   * Sends a new message in the context of the currently opened conversation.
   *
   * @param {string} message - The content of the message to send.
   * @param {ChatMessagesComponent} chatMessagesComponent - The component instance that manages the display of messages.
   */
  async handleMessageToSent(
    message: string,
    chatMessagesComponent: ChatMessagesComponent
  ): Promise<void> {
    assertIsDefined(this.openedConversation, 'Select a conversation first');
    assertIsDefined(this.profile, 'User not defined');
    const newMessage: MessageDTO = {
      _id: '',
      conversation: this.openedConversation._id,
      content: message,
      sender: this.profile._id,
      createdAt: new Date(),
    };

    await firstValueFrom(
      this.apiService
        .addMessage({
          id: this.openedConversation._id,
          addMessage: { message: message },
        })
        .pipe(
          tap(() => {
            chatMessagesComponent.messages.push(newMessage);
            chatMessagesComponent._scrollToBottom();
          })
        )
    );
  }
}
