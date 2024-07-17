import { Component } from '@angular/core';

import { CommentCardComponent } from '../../comment/comment-card/comment-card.component';
import { MatIconModule } from '@angular/material/icon';
import { factoryCommentDTO } from '../../shared/test-data';

@Component({
  selector: 'app-comment-section-demo',
  standalone: true,
  imports: [CommentCardComponent, MatIconModule],
  templateUrl: './comment-section-demo.component.html',
  styleUrls: ['./comment-section-demo.component.scss'],
})
export class CommentSectionDemoComponent {
  mainComment = factoryCommentDTO.build({ actions: ['reply'] });
  repliesComment = [
    factoryCommentDTO.build({
      hasReplies: false,
      content:
        'Nam accumsan eu nisi sit amet rhoncus. Nam tincidunt ligula at commodo ornare. Proin vulputate felis faucibus posuere pellentesque. ',
    }),
    factoryCommentDTO.build({
      hasReplies: false,
      content: 'Nam accumsan eu nisi sit amet rhoncus. Nam tincidunt ligula at commodo ornare.',
    }),
  ];
  showReplies = false;
  showReplyInput = false;

  toggleReplies(): void {
    this.showReplies = !this.showReplies;
  }

  toggleReplyInput(): void {
    this.showReplyInput = !this.showReplyInput;
  }

  send(text: string): void {
    console.log(`Creating reply: ${text}`);
    this.showReplies = true;
    this.showReplyInput = false;
  }
}
