import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FeedbackDialogComponent } from './feedback-dialog/feedback-dialog.component';
import { FeedbackService } from './feedback.service';
import { FeedbackDTO, UserPrivateDTO } from '@orvium/api';
import { DialogService } from '../../dialogs/dialog.service';

@Directive({ selector: '[appFeedback]', standalone: true })
export class FeedbackDirective {
  @Input() public user: UserPrivateDTO | undefined;
  @Output() public send = new EventEmitter<FeedbackDTO>();

  public constructor(
    private feedbackService: FeedbackService,
    private dialogService: DialogService
  ) {
    this.feedbackService.feedback$.subscribe(feedback => {
      this.send.emit(feedback);
    });
  }

  @HostListener('click')
  public onClick(): void {
    this.openFeedbackDialog();
  }

  public openFeedbackDialog(): void {
    this.feedbackService.initialVariables = {
      user: this.user,
    };

    this.dialogService.open(FeedbackDialogComponent).afterClosed().subscribe();
  }
}
