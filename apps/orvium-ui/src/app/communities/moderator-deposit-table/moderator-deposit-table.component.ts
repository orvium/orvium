import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import {
  AssignEditorPayload,
  CommunityModeratorDTO,
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  CommunityType,
  DefaultService,
  DepositDTO,
  DepositPopulatedDTO,
  DepositStatus,
  UserPrivateDTO,
} from '@orvium/api';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { MatChipsModule } from '@angular/material/chips';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AutocompleteComponent } from '../../shared/autocomplete/autocomplete.component';
import { DialogService } from '../../dialogs/dialog.service';
import { DEPOSITDECISION_LOV } from '../../model/orvium';
import { AuthorAvatarListComponent } from '../../shared/author-avatar-list/author-avatar-list.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProfileService } from '../../profile/profile.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { ModerateDepositsService } from '../../services/moderate-deposits.service';
import { DoiStatusComponent } from '../../shared/doi-status/doi-status.component';

/**
 * Component for displaying and managing a table of deposits related to a community,
 * with functionality for moderators to take actions such as accept, reject, publish, and merge deposits.
 */
@Component({
  selector: 'app-moderator-deposit-table',
  standalone: true,
  templateUrl: './moderator-deposit-table.component.html',
  styleUrls: ['./moderator-deposit-table.component.scss'],
  imports: [
    MatChipsModule,
    RouterLink,
    DatePipe,
    TitleCasePipe,
    MatButtonModule,
    MatDividerModule,
    AutocompleteComponent,
    MatSelectModule,
    AuthorAvatarListComponent,
    MatMenuModule,
    MatDialogModule,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    OverlayLoadingDirective,
    DoiStatusComponent,
  ],
})
export class ModeratorDepositTableComponent implements OnChanges, OnInit {
  /** Template reference for the decision dialog */
  @ViewChild('decisionDialogTemplate') decisionDialogTemplate!: TemplateRef<unknown>;

  /** Internal storage for deposits */
  _deposits: DepositDTO[] = [];

  /** Input deposits which triggers re-evaluation of the internal deposits state */
  @Input({ required: true }) set deposits(deposits: DepositDTO[]) {
    this._deposits = deposits;
    this.selector.clear();
  }

  /** Community details, either populated or private */
  @Input({ required: true }) community!: CommunityPopulatedDTO | CommunityPrivateDTO;

  /** Array of moderators for the community */
  @Input({ required: true }) moderators: CommunityModeratorDTO[] = [];

  /** Events emitted when a deposit is accepted */
  @Output() accept: EventEmitter<DepositDTO> = new EventEmitter<DepositDTO>();

  /** Events emitted when a deposit is published */
  @Output() publish: EventEmitter<DepositPopulatedDTO> = new EventEmitter<DepositPopulatedDTO>();

  /** Events emitted when a deposit is set to pending approval */
  @Output() pendingApproval: EventEmitter<DepositDTO> = new EventEmitter<DepositDTO>();

  /** Events emitted when deposits are merged */
  @Output() merge: EventEmitter<DepositDTO> = new EventEmitter<DepositDTO>();

  /** Events emitted when deposits are rejected */
  @Output() reject: EventEmitter<DepositDTO> = new EventEmitter<DepositDTO>();

  /** Events emitted when deposits are set as draft */
  @Output() draft: EventEmitter<DepositDTO> = new EventEmitter<DepositDTO>();

  /** Desposit status */
  DepositStatus = DepositStatus;

  /** Provides a list of possible decisions that can be made on deposits such as accept, reject, or mark as pending. */
  depositDecisionLOV = DEPOSITDECISION_LOV;

  /** Enumeration of community types, used to distinguish between different kinds of communities and to potentially filter. */
  communityTypeLOV = CommunityType;

  /** Optional property to store user profile data. */
  profile?: UserPrivateDTO;

  /** Selection model for deposits */
  selector = new SelectionModel<DepositDTO>(true, []);

  /**
   * Constructs the ModeratorDepositTableComponent with essential services for displaying and managing deposits.
   * This constructor sets up services required for user notifications, dialog interactions, API communications,
   * change detection, user profile management, navigation, and specific moderation functionalities.
   *
   * @param {AppSnackBarService} snackBar - Service used to display brief messages in a small popup at the bottom of the screen.
   * @param {DialogService} dialogService - Service for managing dialog interactions, allowing for dynamic presentation of content in modal formats.
   * @param {DefaultService} apiService - Central service for all HTTP requests to the server, critical for fetching and submitting deposit-related data.
   * @param {ChangeDetectorRef} cdr - Service for manually triggering change detection in components, useful in dynamic content updates.
   * @param {ProfileService} profileService - Service that handles fetching and updating the user's profile data.
   * @param {Router} router - Angular's Router service that facilitates navigation from one view to another.
   * @param {ModerateDepositsService} moderateDepositService - Service dedicated to handling moderation-specific tasks.
   */
  constructor(
    private snackBar: AppSnackBarService,
    public dialogService: DialogService,
    public apiService: DefaultService,
    private cdr: ChangeDetectorRef,
    private profileService: ProfileService,
    public router: Router,
    private moderateDepositService: ModerateDepositsService
  ) {}

  /**
   * Initializes the component by subscribing to the user's profile data and setting up other component-specific configurations.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
  }

  /**
   * Detects changes and updates the component accordingly.
   */
  ngOnChanges(): void {
    this.cdr.detectChanges();
  }

  /**
   * Logic to handle accepting deposits.
   * @param {DepositDTO} deposit - The deposit to be accepted.
   */
  acceptDeposit(deposit: DepositDTO): void {
    this.moderateDepositService.openAcceptModalComplete(deposit, true).subscribe(deposit => {
      this.accept.emit(deposit);
    });
  }

  /**
   * Logic to handle publishing deposits.
   * @param {DepositDTO} deposit - The deposit to be published.
   */
  publishDeposit(deposit: DepositDTO): void {
    this.moderateDepositService.publishDeposit(deposit).subscribe(depositPopulated => {
      this.publish.emit(depositPopulated);
    });
  }

  /**
   * Merges the selected deposit into another existing deposit.
   * Opens a modal for completion of the merge process and emits an event upon successful merging.
   *
   * @param {DepositDTO} deposit - The deposit to be merged.
   */
  mergeDeposit(deposit: DepositDTO): void {
    this.moderateDepositService
      .openMergeModalComplete(deposit, true)
      .subscribe(depositPopulated => {
        this.merge.emit(depositPopulated);
      });
  }

  /**
   * Rejects the specified deposit.
   * Opens a modal for completion of the rejection process and emits an event upon successful rejection.
   *
   * @param {DepositDTO} deposit - The deposit to be rejected.
   */
  rejectDeposit(deposit: DepositDTO): void {
    this.moderateDepositService
      .openRejectModalComplete(deposit, true)
      .subscribe(depositPopulated => {
        this.reject.emit(depositPopulated);
      });
  }

  /**
   * Sets the specified deposit back to draft status.
   * Opens a modal for completion of the drafting process and emits an event upon successfully drafting.
   *
   * @param {DepositDTO} deposit - The deposit to be set back to draft.
   */
  draftDeposit(deposit: DepositDTO): void {
    this.moderateDepositService
      .openDraftModalComplete(deposit, true)
      .subscribe(depositPopulated => {
        this.draft.emit(depositPopulated);
      });
  }

  /**
   * Sets the specified deposit back to pending approval.
   * Opens a modal for confirmation and emits an event upon successful change to pending approval.
   *
   * @param {DepositDTO} deposit - The deposit to be set back to pending approval.
   */
  backToPendingApproval(deposit: DepositDTO): void {
    this.moderateDepositService
      .openBackToPendingApprovalComplete(deposit, true)
      .subscribe(depositPopulated => {
        this.pendingApproval.emit(depositPopulated);
      });
  }

  /**
   * Finds a moderator based on the given user ID.
   *
   * @param {string} [userId] - The user ID to search for among the moderators.
   * @returns {CommunityModeratorDTO | undefined} The found moderator or undefined if no match is found.
   */
  findModerator = (userId?: string): CommunityModeratorDTO | undefined => {
    return this.moderators.find(moderator => moderator.user._id === userId);
  };

  /**
   * Assigns a moderator to a deposit.
   * Triggers an API call to update the deposit's assigned editor and displays a notification upon success.
   *
   * @param {CommunityModeratorDTO} moderator - The moderator to assign.
   * @param {DepositDTO} deposit - The deposit to which the moderator is assigned.
   */
  assignModerator(moderator: CommunityModeratorDTO, deposit: DepositDTO): void {
    const mode: AssignEditorPayload = {
      assignee: moderator.user._id,
    };
    this.apiService.assignEditor({ id: deposit._id, assignEditorPayload: mode }).subscribe(() => {
      this.snackBar.info(`Editor ${moderator.user.firstName} assigned to article`);
    });
  }

  /**
   * Removes a moderator from a deposit.
   * Triggers an API call to clear the deposit's assigned editor.
   *
   * @param {DepositDTO} deposit - The deposit from which the moderator is removed.
   */
  removeModerator(deposit: DepositDTO): void {
    this.apiService
      .assignEditor({ id: deposit._id, assignEditorPayload: { assignee: '' } })
      .subscribe();
  }

  /**
   * Applies an editorial decision based on a selection change event.
   * Triggers an API call to assign an editorial decision and updates the deposit in the list upon success.
   *
   * @param {MatSelectChange} event - The selection change event containing the new decision.
   * @param {DepositDTO} deposit - The deposit to which the decision applies.
   * @param {number} index - The index of the deposit in the deposits list.
   */
  selectDecision(event: MatSelectChange, deposit: DepositDTO, index: number): void {
    this.apiService
      .assignEditorialDecision({
        id: deposit._id,
        assignEditorialDecisionPayload: {
          acceptedFor: event.value,
        },
      })
      .subscribe(deposit => {
        this.deposits[index] = deposit;
        this.snackBar.info('Decision confirmed');
      });
  }

  /**
   * Opens a conversation related to a deposit.
   * Navigates to a conversation interface using a dynamically generated route.
   *
   * @param {DepositDTO} deposit - The deposit for which to open the conversation.
   */
  openConversation(deposit: DepositDTO): void {
    const conversationLink = this.profileService.getConversationLink(deposit.creator);
    void this.router.navigate([conversationLink.routerLink], {
      queryParams: conversationLink.queryParam,
    });
  }
}
