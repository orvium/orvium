import {
  AfterContentChecked,
  ApplicationRef,
  Component,
  DestroyRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DatePipe, NgClass, TitleCasePipe } from '@angular/common';
import {
  ConversationPopulatedDTO,
  DefaultService,
  MessageDTO,
  UserPrivateDTO,
  UserSummaryDTO,
} from '@orvium/api';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { concat, timer } from 'rxjs';
import { MatRippleModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { finalize, first, tap } from 'rxjs/operators';
import { RouterLink } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatDividerModule } from '@angular/material/divider';
import { UserLineComponent } from '../../shared/user-line/user-line.component';
import { BREAKPOINTS } from '../../layout/breakpoints';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component responsible for displaying chat messages between users. It handles the rendering of messages,
 * the dynamic loading of new and old messages, and adjusts its behavior based on the device's viewport size.
 */
@Component({
  selector: 'app-chat-messages',
  standalone: true,
  templateUrl: './chat-messages.component.html',
  styleUrls: ['./chat-messages.component.scss'],
  imports: [
    DatePipe,
    TitleCasePipe,
    AvatarDirective,
    ScrollingModule,
    MatChipsModule,
    MatIconModule,
    MatRippleModule,
    MatButtonModule,
    OverlayLoadingDirective,
    MatTooltipModule,
    NgClass,
    MatDividerModule,
    UserLineComponent,
    RouterLink,
  ],
})
export class ChatMessagesComponent implements OnInit, AfterContentChecked {
  /**
   * Reference for managing clean-up of subscriptions to prevent memory leaks.
   */
  private destroyRef = inject(DestroyRef);

  /**
   * Array of message objects representing the chat history.
   */
  messages: MessageDTO[] = [];

  /**
   * Flag indicating if the user interface should be adapted for mobile devices.
   */
  isMobile = false;

  /**
   * Indicator of whether messages are currently being loaded, e.g., during initial fetch or when scrolling for more messages.
   */
  loadingMessages = false;

  /**
   * Flag to detect when new messages arrive in real-time or are added by the user.
   */
  newMessages = false;

  /**
   * Optional input of the recipient's summary details, used for display or message context.
   *
   * @input recipient The summary information of the chat recipient.
   */
  @Input() recipient?: UserSummaryDTO;

  /**
   * Optional input of the profile details of the current user.
   *
   * @input profile The private user data of the currently logged-in user.
   */
  @Input() profile?: UserPrivateDTO;

  /**
   * Populated conversion
   */
  private _conversation!: ConversationPopulatedDTO;

  /**
   * Required setter for the conversation object which initializes message fetching
   * and sets up the conversation context.
   * @input conversation The conversation data object including its unique ID and other relevant metadata.
   */
  @Input({ required: true }) set conversation(conversation: ConversationPopulatedDTO) {
    // Used to clear the chat between conversations
    this._conversation = conversation;
    this.loadingMessages = true;
    this.apiService
      .getConversationMessages({ conversationId: conversation._id })
      .pipe(finalize(() => (this.loadingMessages = false)))
      .subscribe(mes => {
        this.messages = [];
        this.messages = mes.reverse();
        this._scrollToBottom();
        this.moreMessages = true;
      });
  }

  /**
   * Provides access to the virtual scroll viewport which is used for rendering the list of chat messages.
   */
  @ViewChild('virtualScroll', { static: true })
  public virtualScrollViewport!: CdkVirtualScrollViewport;

  /**
   * Controls whether more messages can be fetched when the user scrolls to the top of the chat history.
   */
  moreMessages = true;

  constructor(
    private apiService: DefaultService,
    private appRef: ApplicationRef,
    public breakpointObserver: BreakpointObserver
  ) {}

  ngAfterContentChecked(): void {
    if (this.newMessages) {
      this._scrollToBottom();
      this.newMessages = false;
    }
  }

  /**
   * Lifecycle method that runs after component initialization. Used to set up observers and subscriptions,
   * particularly for handling responsive design changes and fetching initial messages.
   */
  ngOnInit(): void {
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.isMobile = result.matches;
    });

    const appIsStable = this.appRef.isStable.pipe(first(isStable => isStable));
    const chatPolling = timer(10, 1500).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => {
        this.messages = this.messages.filter(mes => mes._id !== '');
        const lastMessage = this.messages.at(-1);
        this.apiService
          .getConversationMessages({
            conversationId: this._conversation._id,
            fromDate: lastMessage ? lastMessage.createdAt.toISOString() : undefined,
          })
          .subscribe(mes => {
            this.messages.push(...mes.reverse());

            if (mes.length > 0) {
              this.newMessages = true;
            }
          });
      })
    );

    // We have to wait until the app is stable, otherwise the timer will not work properly
    concat(appIsStable, chatPolling).subscribe();
  }

  /**
   * Scrolls the view to display the messages.
   */
  public _scrollToBottom(): void {
    setTimeout(() => {
      this.virtualScrollViewport.scrollTo({ bottom: 0, behavior: 'smooth' });
    });
  }

  /**
   * Initiates fetching of older messages when the user scrolls to the top of the chat history.
   */
  getMoreMessages(): void {
    const firstMessage = this.messages[0];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (firstMessage && this._conversation) {
      this.apiService
        .getConversationMessages({
          conversationId: this._conversation._id,
          beforeDate: firstMessage.createdAt.toISOString(),
        })
        .subscribe(messages => {
          if (messages.length > 0) {
            this.messages = [...messages.reverse(), ...this.messages];
            if (messages.length < 10) this.moreMessages = false;
          } else {
            this.moreMessages = false;
          }
        });
    }
  }
}
