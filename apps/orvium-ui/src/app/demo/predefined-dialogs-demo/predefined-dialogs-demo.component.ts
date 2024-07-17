import { Component, TemplateRef, ViewChild } from '@angular/core';

import { DialogService } from '../../dialogs/dialog.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { isNotNullOrUndefined } from '../../shared/shared-functions';

@Component({
  selector: 'app-demo-predefined-dialogs-demo',
  standalone: true,
  templateUrl: './predefined-dialogs-demo.component.html',
  styleUrls: ['./predefined-dialogs-demo.component.scss'],
  imports: [MatCardModule, MatButtonModule],
})
export class PredefinedDialogsDemoComponent {
  @ViewChild('authorsDialogTemplate') authorsDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('videoDialogTemplate') videoDialogTemplate!: TemplateRef<unknown>;

  constructor(private dialogService: DialogService) {}

  openConfirm(): void {
    this.dialogService
      .openConfirm({
        title: 'Confirmation dialog',
        content: 'Are you sure you want to close this dialog?',
        cancelMessage: 'Cancel',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        console.log(accept);
      });
  }

  openAlert(): void {
    this.dialogService
      .openAlert({
        title: 'New version available',
        content: 'We have an update. Refresh the page to get the latest update.',
        acceptMessage: 'Refresh',
        icon: 'bookmark',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        console.log(accept);
      });
  }

  openCustom(): void {
    this.dialogService
      .openCustom({
        title: 'Authors',
        template: this.authorsDialogTemplate,
        showActionButtons: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        console.log(accept);
      });
  }

  openInput(): void {
    this.dialogService
      .openInputDialog({
        title: 'Input dialog',
        content: 'If you want to confirm this dialog, give me a reason',
        inputLabel: 'Hola',
        useTextarea: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(response => {
        console.log(response);
      });
  }

  openVideo(): void {
    this.dialogService.openVideo({
      videoUrl:
        'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/781ba680-a6d3-43f9-b0b2-4e5c62d93d2f/versions/12/transfers/target_transfer.mp4',
      videoType: 'video/mp4',
    });
  }
}
