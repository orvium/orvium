import { Injectable } from '@angular/core';
import { isNotNullOrUndefined } from '../shared/shared-functions';
import { DialogService } from '../dialogs/dialog.service';
import { DefaultService, DepositDTO, DepositPopulatedDTO } from '@orvium/api';
import { Observable } from 'rxjs';
import { InputDialogResponse } from '../dialogs/input-dialog/input-dialog.component';
import { filter, finalize, switchMap } from 'rxjs/operators';

/**
 * Service for moderating deposits, which includes handling various states such as pending approval,
 * rejection, merging, drafting, and publishing.
 */
@Injectable({
  providedIn: 'root',
})
export class ModerateDepositsService {
  /**
   * Constructs the service with dependencies on dialog and API services.
   *
   * @param {DialogService} dialogService - Service for opening various types of dialogs (confirmations, inputs).
   * @param {DefaultService} apiService - API service for performing deposit operations like updating or changing statuses.
   */
  constructor(
    private dialogService: DialogService,
    private apiService: DefaultService
  ) {}

  /**
   * Opens a dialog asking the moderator to confirm changing a deposit's status back to pending approval with a reason.
   *
   * @returns {Observable<InputDialogResponse>} An observable containing the user's input and action taken (confirm/cancel).
   */
  openBackToPendingApprovalDialog(): Observable<InputDialogResponse> {
    return this.dialogService
      .openInputDialog({
        title: 'Back to pending approval',
        content: 'You will change the publication status to "Pending approval". Are you sure? ',
        acceptMessage: 'Confirm',
        inputLabel: 'Reason',
        useTextarea: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined());
  }

  /**
   * Completes the process of moving a deposit back to pending approval after confirming through a dialog.
   *
   * @param {DepositDTO} deposit - The deposit to update.
   * @param {boolean} loading - Loading state indicator.
   * @returns {Observable<DepositPopulatedDTO>} An observable containing the updated deposit data.
   */
  openBackToPendingApprovalComplete(
    deposit: DepositDTO,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loading: boolean
  ): Observable<DepositPopulatedDTO> {
    return this.openBackToPendingApprovalDialog().pipe(
      filter(dialogResponse => dialogResponse.action),
      switchMap(dialogResponse => {
        loading = true;
        return this.apiService
          .depositToPendingApproval({
            id: deposit._id,
            moderateDepositPayload: { reason: dialogResponse.inputValue },
          })
          .pipe(
            finalize(() => {
              loading = false;
            })
          );
      })
    );
  }

  /**
   * Opens a modal dialog to confirm the rejection of a publication, requiring a reason for the rejection.
   *
   * @returns {Observable<InputDialogResponse>} An observable containing the user's feedback and action taken.
   */
  openRejectModal(): Observable<InputDialogResponse> {
    return this.dialogService
      .openInputDialog({
        title: 'Reject publication',
        content:
          'By rejecting this publication, the submission will not be published in the community,' +
          ' it would be archived, and the author will not be able to make further changes to this submission.' +
          ' Please use the box below to email the author about the reasons why you decided to reject the publication.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Send',
        inputLabel: 'Feedback',
        useTextarea: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined());
  }

  /**
   * Completes the rejection process for a deposit based on the dialog's input.
   *
   * @param {DepositDTO} deposit - The deposit to reject.
   * @param {boolean} loading - Loading state indicator.
   * @returns {Observable<DepositPopulatedDTO>} An observable containing the updated deposit data.
   */
  openRejectModalComplete(
    deposit: DepositDTO,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loading: boolean
  ): Observable<DepositPopulatedDTO> {
    return this.openRejectModal().pipe(
      filter(dialogResponse => dialogResponse.action),
      switchMap(dialogResponse => {
        loading = true;
        return this.apiService
          .rejectDeposit({
            id: deposit._id,
            moderateDepositPayload: { reason: dialogResponse.inputValue },
          })
          .pipe(
            finalize(() => {
              loading = false;
            })
          );
      })
    );
  }

  /**
   * Opens a confirmation dialog for merging two versions of a publication.
   *
   * @returns {Observable<boolean>} An observable indicating whether the merge was confirmed.
   */
  openMergeModal(): Observable<boolean> {
    return this.dialogService
      .openConfirm({
        title: 'Merge publication',
        content:
          'By using this option the content from version two will overwrite the content' +
          ' from version one. Are you sure you want to merge this publication?',
        acceptMessage: 'Confirm',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined());
  }

  /**
   * Completes the merging process for a deposit if the merge is confirmed in the dialog.
   *
   * @param {DepositDTO} deposit - The deposit to merge.
   * @param {boolean} loading - Loading state indicator.
   * @returns {Observable<DepositPopulatedDTO>} An observable containing the merged deposit data.
   */
  openMergeModalComplete(
    deposit: DepositDTO,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loading: boolean
  ): Observable<DepositPopulatedDTO> {
    return this.openMergeModal().pipe(
      filter(dialogResponse => dialogResponse),
      switchMap(dialogResponse => {
        loading = true;
        return this.apiService
          .mergeRevisions({
            id: deposit._id,
          })
          .pipe(
            finalize(() => {
              loading = false;
            })
          );
      })
    );
  }

  /**
   * Opens a dialog to request changes to a publication, putting it back into draft status.
   *
   * @returns {Observable<InputDialogResponse>} An observable containing the instructions from the moderator and action taken.
   */
  openDraftModal(): Observable<InputDialogResponse> {
    return this.dialogService
      .openInputDialog({
        title: 'Request changes to this publication',
        content:
          'You are requesting the author to make some changes to the publication submitted to fix certain issues.' +
          'The publication will change to DRAFT status, and the author should submit the publication again once the changes are done. ' +
          'Please use the box below give the author some instructions about why you are requesting changes. ',
        cancelMessage: 'Cancel',
        acceptMessage: 'Send',
        inputLabel: 'Instructions',
        useTextarea: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined());
  }

  /**
   * Completes the process of requesting changes, updating the deposit's status to draft based on the dialog's input.
   *
   * @param {DepositDTO} deposit - The deposit to draft.
   * @param {boolean} loading - Loading state indicator.
   * @returns {Observable<DepositPopulatedDTO>} An observable containing the updated deposit data.
   */
  openDraftModalComplete(
    deposit: DepositDTO,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loading: boolean
  ): Observable<DepositPopulatedDTO> {
    return this.openDraftModal().pipe(
      filter(dialogResponse => dialogResponse.action),
      switchMap(dialogResponse => {
        loading = true;
        return this.apiService
          .draftDeposit({
            id: deposit._id,
            moderateDepositPayload: { reason: dialogResponse.inputValue },
          })
          .pipe(
            finalize(() => {
              loading = false;
            })
          );
      })
    );
  }

  /**
   * Publishes a deposit, changing its status accordingly via an API service call.
   *
   * @param {DepositPopulatedDTO | DepositDTO} deposit - The deposit to publish.
   * @returns {Observable<DepositPopulatedDTO>} An observable containing the published deposit data.
   */
  publishDeposit(deposit: DepositPopulatedDTO | DepositDTO): Observable<DepositPopulatedDTO> {
    return this.apiService.publishDeposit({
      id: deposit._id,
    });
  }

  /**
   * Opens a dialog to confirm acceptance of a publication, changing its status from pending to preprint.
   * Returns an observable of the dialog response.
   *
   * @returns {Observable<InputDialogResponse>} An observable containing feedback from the moderator and action taken.
   */
  openAcceptModal(): Observable<InputDialogResponse> {
    return this.dialogService
      .openInputDialog({
        title: 'Accept publication',
        content:
          'By accepting the publication you will change its status from “Pending Approval” to “Preprint” making ' +
          'the article part of this community.',
        acceptMessage: 'Confirm',
        inputLabel: 'feedback',
        useTextarea: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined());
  }

  /**
   * Completes the acceptance process for a deposit based on the dialog's input.
   *
   * @param {DepositDTO} deposit - The deposit to accept.
   * @param {boolean} loading - Loading state indicator.
   * @returns {Observable<DepositPopulatedDTO>} An observable containing the accepted deposit data.
   */
  openAcceptModalComplete(
    deposit: DepositDTO,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loading: boolean
  ): Observable<DepositPopulatedDTO> {
    return this.openAcceptModal().pipe(
      filter(dialogResponse => dialogResponse.action),
      switchMap(dialogResponse => {
        loading = true;
        return this.apiService
          .acceptDeposit({
            id: deposit._id,
            moderateDepositPayload: { reason: dialogResponse.inputValue },
          })
          .pipe(
            finalize(() => {
              loading = false;
            })
          );
      })
    );
  }
}
