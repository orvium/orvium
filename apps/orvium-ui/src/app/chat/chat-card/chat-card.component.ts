import { Component, Input, OnInit } from '@angular/core';
import { ConversationPopulatedDTO, UserSummaryDTO } from '@orvium/api';
import { MatCardModule } from '@angular/material/card';
import { NgClass } from '@angular/common';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Component for displaying a single chat card within a larger messaging interface.
 * It presents a summary of the conversation, including the most recent messages and the recipient's information.
 */
@Component({
  selector: 'app-chat-card',
  standalone: true,
  templateUrl: './chat-card.component.html',
  styleUrls: ['./chat-card.component.scss'],
  imports: [MatCardModule, NgClass, AvatarDirective, MatIconModule, MatTooltipModule],
})
export class ChatCardComponent implements OnInit {
  /**
   * Required input that defines the conversation details and the header information of the chat,
   * typically containing user details and summary data.
   *
   * @input chat An object containing the conversation and user summary data.
   */
  @Input({ required: true }) chat!: {
    conversation: ConversationPopulatedDTO;
    header: UserSummaryDTO;
  };

  /**
   * Indicates if the chat card is currently selected in the user interface.
   *
   * @input selected A boolean indicating whether this chat card is selected. Defaults to false.
   */
  @Input({ required: true }) selected = false;

  /** Determines if all messages in the conversation are marked as read. */
  isAllRead = false;

  /** The name of the recipient in the chat, derived from the header information. */
  chatRecipient?: string;

  /**
   * OnInit lifecycle hook to initialize component state based on the provided inputs.
   * It sets up the read status of the conversation and concatenates the recipient's name.
   */
  ngOnInit(): void {
    this.isAllRead = !this.chat.conversation.messagesPending;
    this.chatRecipient = this.chat.header.firstName + ' ' + this.chat.header.lastName;
  }
}
