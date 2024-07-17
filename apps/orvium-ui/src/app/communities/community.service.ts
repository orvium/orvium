import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  CommunityCreateDto,
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  CommunityDTO,
  DefaultService,
} from '@orvium/api';
import { AppSnackBarService } from '../services/app-snack-bar.service';
import { DialogService } from '../dialogs/dialog.service';
import { isNotNullOrUndefined } from '../shared/shared-functions';

/** Community actions interface
 *
 * @property {boolean} update - update action
 * @property {boolean} moderate - moderate action
 * @property {boolean} submit - submit action
 */
export interface ICommunityActions {
  update: boolean;
  moderate: boolean;
  submit: boolean;
}

/**
 * Service for managing communities within the application. It provides functionalities to determine user
 * permissions for community actions, and to facilitate the creation of communities through dialog interactions.
 */
@Injectable({
  providedIn: 'root',
})
export class CommunityService {
  /**
   * Constructs the CommunityService with necessary dependencies for dialog interaction, API communication,
   * snack bar notifications, and routing.
   *
   * @param {DialogService} dialogService - Service for opening dialogs.
   * @param {DefaultService} apiService - API service for backend communication.
   * @param {AppSnackBarService} snackBar - Service for displaying snack bar notifications.
   * @param {Router} router - Angular Router service for navigation.
   */
  constructor(
    private dialogService: DialogService,
    private apiService: DefaultService,
    public snackBar: AppSnackBarService,
    private router: Router
  ) {
    // nothing to do
  }

  /**
   * Determines the actions a user can perform on a community based on their permissions.
   *
   * @param {CommunityPopulatedDTO | CommunityPrivateDTO} community - The community data transfer object which contains the actions.
   * @returns {ICommunityActions} An object representing whether the user can update, moderate, or submit in the community.
   */
  getCommunityActions(community: CommunityPopulatedDTO | CommunityPrivateDTO): ICommunityActions {
    return {
      update: community.actions.includes('update'),
      moderate: community.actions.includes('moderate'),
      submit: community.actions.includes('submit'),
    };
  }

  /**
   * Opens a dialog to create a new community. On submission, it sends a request to create the community
   * and navigates to the community's edit page if successful. It also handles validation for the community name input.
   */
  createCommunityDialog(): void {
    this.dialogService
      .openInputDialog({
        title: 'Create Community',
        content:
          'To create a new community, first, fill the box below with the name and codename, and click the "Create" button.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Create',
        inputLabel: 'Community Name',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(response => {
        if (response.action) {
          if (response.inputValue) {
            const community: CommunityCreateDto = {
              name: response.inputValue,
              codename: response.inputValue.replace(/\W/g, '').toLowerCase().substring(0, 18),
            };
            this.apiService
              .createCommunity({ communityCreateDto: community })
              .subscribe(response => {
                void this.router.navigate(['communities', response._id, 'edit']);
              });
          } else {
            this.snackBar.error('Community Name should not be empty');
          }
        }
      });
  }
}
