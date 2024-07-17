import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';

import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { InvitationsListComponent } from '../invitations-list/invitations-list.component';
import { DefaultService, InviteQueryDTO, PaginationLimit } from '@orvium/api';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { DepositInvitationListComponent } from '../../deposits/deposit-invitation-list/deposit-invitation-list.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';

/**
 * A component to manage and display user invitations, both received and sent.
 * It allows users to view detailed lists and paginate through their invitations.
 */
@Component({
  selector: 'app-my-invitations',
  standalone: true,
  imports: [
    MatTabsModule,
    InvitationsListComponent,
    DepositInvitationListComponent,
    MatPaginatorModule,
    OverlayLoadingDirective,
  ],
  templateUrl: './my-invitations.component.html',
  styleUrls: ['./my-invitations.component.scss'],
})
export class MyInvitationsComponent implements OnInit, AfterViewInit {
  /** Stores the received invitations along with their total count */
  receivedInvitations: InviteQueryDTO = { invites: [], count: 0 };

  /** Stores the sent invitations along with their total count */
  sentInvitations: InviteQueryDTO = { invites: [], count: 0 };

  /** Boolean to indicate if the component is currently loading sent invites */
  loadingSentInvites = false;

  /** Access to the MatTabGroup for managing tab navigation */
  @ViewChild(MatTabGroup) tabGroup?: MatTabGroup;

  /** Boolean to indicate if the component is currently loading received invites */
  loadingReceivedInvites = false;

  /**
   * Constructs the MyInvitationsComponent with necessary dependencies.
   *
   * @param apiService Service for API calls
   * @param titleService Service for setting the page title
   * @param router Angular Router for navigation
   * @param route ActivatedRoute to access route parameters
   */
  constructor(
    private apiService: DefaultService,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /**
   * Initializes the component by setting the title and fetching both sent and received invitations.
   */
  ngOnInit(): void {
    this.titleService.setTitle('My Invitations');
    this.loadingSentInvites = true;
    this.loadingReceivedInvites = true;
    this.apiService
      .myInvites({
        limit: PaginationLimit._10,
      })
      .pipe(finalize(() => (this.loadingReceivedInvites = false)))
      .subscribe(response => (this.receivedInvitations = response));
    this.apiService
      .mySentInvites({
        limit: PaginationLimit._10,
      })
      .pipe(finalize(() => (this.loadingSentInvites = false)))
      .subscribe(response => (this.sentInvitations = response));
  }

  /**
   * Adjusts the active tab based on the URL fragment after view initialization.
   */
  ngAfterViewInit(): void {
    if (this.route.snapshot.fragment && this.tabGroup) {
      const activeTab = this.tabGroup._tabs.filter(
        tab => tab.textLabel === this.route.snapshot.fragment
      );
      this.tabGroup.selectedIndex = activeTab.pop()?.position ?? 0;
    }
  }

  /**
   * Handles tab changes and updates the URL fragment accordingly.
   *
   * @param $event The tab change event object
   */
  onTabChanged($event: MatTabChangeEvent): void {
    void this.router.navigate([], { fragment: $event.tab.textLabel });
  }

  /**
   * Handles pagination for received invitations.
   *
   * @param $event PageEvent from MatPaginator
   */
  receivedInvitationsPagination($event: PageEvent): void {
    const page = $event.pageIndex;
    const limit = $event.pageSize === 25 ? PaginationLimit._25 : PaginationLimit._10;
    this.loadingReceivedInvites = true;
    this.apiService
      .myInvites({
        page: page,
        limit: limit,
      })
      .pipe(finalize(() => (this.loadingReceivedInvites = false)))
      .subscribe(response => {
        this.receivedInvitations = response;
      });
  }

  /**
   * Handles pagination for sent invitations.
   *
   * @param $event PageEvent from MatPaginator
   */
  sentInvitationsPagination($event: PageEvent): void {
    const page = $event.pageIndex;
    const limit = $event.pageSize === 25 ? PaginationLimit._25 : PaginationLimit._10;
    this.loadingSentInvites = true;
    this.apiService
      .mySentInvites({
        page: page,
        limit: limit,
      })
      .pipe(finalize(() => (this.loadingSentInvites = false)))
      .subscribe(response => {
        this.sentInvitations = response;
      });
  }
}
