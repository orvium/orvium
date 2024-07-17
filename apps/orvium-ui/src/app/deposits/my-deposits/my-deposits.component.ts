import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { DefaultService, DepositPopulatedDTO } from '@orvium/api';
import { finalize } from 'rxjs/operators';
import { EmptyStatePublicationsComponent } from '../../shared/empty-state-publications/empty-state-publications.component';

import { MatButtonModule } from '@angular/material/button';
import { DepositsListComponent } from '../deposits-list/deposits-list.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { DialogService } from '../../dialogs/dialog.service';
import { MatIconModule } from '@angular/material/icon';

/**
 * Component for manage the deposit of the current log-in user
 */
@Component({
  selector: 'app-my-deposits',
  standalone: true,
  templateUrl: './my-deposits.component.html',
  styleUrls: ['./my-deposits.component.scss'],
  imports: [
    EmptyStatePublicationsComponent,
    MatButtonModule,
    DepositsListComponent,
    OverlayLoadingDirective,
    MatIconModule,
  ],
})
export default class MyDepositsComponent implements OnInit {
  /** List of current log-in user's deposits. */
  deposits: DepositPopulatedDTO[] = [];

  /** Flag indicating if the component has been initialized. */
  initialized = false;

  /** Flag indicating if deposits are currently being loaded. */
  depositsLoading = false;

  /**
   * Constructs an instance of MyDepositsComponent.
   *
   * @param {Title} titleService - Service for setting the document title.
   * @param {DefaultService} apiService - Service for making API calls.
   * @param {DialogService} dialogService - Service for managing dialogs.
   */
  constructor(
    private titleService: Title,
    private apiService: DefaultService,
    public dialogService: DialogService
  ) {}
  /**
   * Initializes the component by setting the document title and loading user's deposits.
   */
  ngOnInit(): void {
    this.titleService.setTitle('My publications');
    this.depositsLoading = true;
    this.apiService
      .getMyDeposits()
      .pipe(
        finalize(() => {
          this.depositsLoading = false;
        })
      )
      .subscribe(deposits => {
        this.deposits = deposits;
        this.initialized = true;
      });
  }

  /**
   * Opens a dialog to play a video.
   */
  openVideo(): void {
    this.dialogService.openVideo({
      videoUrl:
        'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/4966ed53-53e9-43c9-92e1-57f8e6feb74b/transfers/target_transfer.mp4',
      videoType: 'video/mp4',
    });
  }
}
