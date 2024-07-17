import { Component, OnInit } from '@angular/core';
import { DefaultService, DepositPopulatedDTO } from '@orvium/api';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TitleCasePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';
import { MatDividerModule } from '@angular/material/divider';
import { DepositsListComponent } from '../deposits-list/deposits-list.component';
import { EmptyStatePublicationsComponent } from '../../shared/empty-state-publications/empty-state-publications.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { finalize } from 'rxjs/operators';

/**
 * Component responsible for displaying a list of deposits that the user has starred or bookmarked.
 * It fetches the starred deposits from the server and displays them, providing the user with quick access
 * to their favorite or important deposits.
 */
@Component({
  selector: 'app-bookmarked-deposits',
  standalone: true,
  templateUrl: './bookmarked-deposits.component.html',
  styleUrls: ['./bookmarked-deposits.component.scss'],
  imports: [
    MatCardModule,
    MatIconModule,
    MatInputModule,
    TitleCasePipe,
    MatChipsModule,
    ListWrapperComponent,
    MatDividerModule,
    DepositsListComponent,
    EmptyStatePublicationsComponent,
    OverlayLoadingDirective,
  ],
})
export default class BookmarkedDepositsComponent implements OnInit {
  /** An array of deposits that the user has starred. These are populated deposit DTOs */
  starredDeposits: DepositPopulatedDTO[] = [];

  /** A boolean flag indicating whether the deposit data is currently being loaded. */
  depositsLoading = false;

  /**
   * Initializes a new instance of the BookmarkedDepositsComponent with necessary dependency injections.
   *
   * @param {DefaultService} apiService - The API service used to fetch starred deposit data.
   */
  constructor(private apiService: DefaultService) {}

  /**
   * OnInit lifecycle hook that is called after data-bound properties are initialized. Fetches starred
   * deposits from the backend and initializes component state.
   */
  ngOnInit(): void {
    this.depositsLoading = true;
    this.apiService
      .getMyStarredDeposits()
      .pipe(
        finalize(() => {
          this.depositsLoading = false;
        })
      )
      .subscribe(deposits => {
        this.starredDeposits = deposits;
      });
  }
}
