import { Injectable } from '@angular/core';
import { DepositPopulatedDTO } from '@orvium/api';

/**
 * Service to manage permissions for actions within the application. Provides methods to determine
 * whether a user can perform specific actions such as updating, deleting, reviewing, and more, based on the
 * permissions associated with the deposit.
 */
@Injectable({
  providedIn: 'root',
})
export class DepositsService {
  /**
   * Checks if the 'update' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if the update action is permitted, otherwise false.
   */
  canUpdateDeposit(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'update') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 'updateCommunity' action is allowed for a given deposit.
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if updating the community is permitted, otherwise false.
   */
  canUpdateCommunity(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'updateCommunity') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 'delete' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if the delete action is permitted, otherwise false.
   */
  canDeleteDeposit(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'delete') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 'review' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if reviewing the deposit is permitted, otherwise false.
   */
  canReviewDeposit(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'review') {
        return true;
      }
    }
    return false;
  }
  /**
   * Checks if the 'createComment' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if creating a comment is permitted, otherwise false.
   */
  canCreateCommentDeposit(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'createComment') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 'edit' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if editing the deposit is permitted, otherwise false.
   */
  canEditDeposit(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'edit') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 'moderate' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if moderating the deposit is permitted, otherwise false.
   */
  canModerateDeposit(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'moderate') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 'read' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if reading the deposit is permitted, otherwise false.
   */
  canReadDeposit(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'read') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 'inviteReviewers' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if inviting reviewers is permitted, otherwise false.
   */
  canInviteReviewers(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'inviteReviewers') {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if the 'createVersion' action is allowed for a given deposit.
   *
   * @param {DepositPopulatedDTO} deposit - The deposit object containing actions.
   * @returns {boolean} True if creating a new version of the deposit is permitted, otherwise false.
   */
  canCreateVersion(deposit: DepositPopulatedDTO): boolean {
    for (const action of deposit.actions) {
      if (action === 'createVersion') {
        return true;
      }
    }
    return false;
  }
}
