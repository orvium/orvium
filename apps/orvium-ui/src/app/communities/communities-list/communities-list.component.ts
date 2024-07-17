import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { CommunityPopulatedDTO, DefaultService } from '@orvium/api';
import { MatButtonModule } from '@angular/material/button';
import { DialogService } from '../../dialogs/dialog.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { isNotNullOrUndefined } from '../../shared/shared-functions';

/**
 * Component for displaying a list of communities. It provides functionalities to interact with the list.
 */
@Component({
  selector: 'app-communities-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatChipsModule, MatListModule, MatButtonModule],
  templateUrl: './communities-list.component.html',
  styleUrls: ['./communities-list.component.scss'],
})
export class CommunitiesListComponent {
  /**
   * List of community objects that this component will render. Each community must be in the format
   * specified by the CommunityPopulatedDTO interface. This is a required input, without which the component
   * will not have any communities to display.
   *
   * @input communities Array of communities to be displayed.
   */
  @Input({ required: true }) communities!: CommunityPopulatedDTO[];

  /**
   * Constructor for the CommunitiesListComponent.
   *
   * @param {DefaultService} apiService - Service used to perform API requests related to chat functionalities
   * @param {AppSnackBarService} snackBar - snackBar service definition.
   * @param {Router} router - Angular's Router service used for navigating among views or routes.
   * @param {DialogService} dialogService - Dialog Service.
   */
  constructor(
    private apiService: DefaultService,
    public snackBarService: AppSnackBarService,
    private router: Router,
    public dialogService: DialogService
  ) {}

  /**
   * Opens a modal dialog to confirm the acceptance of a community. This changes the community's status from
   * “Pending Approval” to “Published,” making it visible to everyone.
   *
   * @param {CommunityPopulatedDTO} community The community object to be accepted.
   */
  openAcceptModal(community: CommunityPopulatedDTO): void {
    this.dialogService
      .openInputDialog({
        title: 'Accept community',
        content:
          'By accepting the community you will change its status from “Pending Approval” to “Published” making ' +
          'the community visible to everyone.',
        acceptMessage: 'Confirm',
        inputLabel: 'feedback',
        useTextarea: true,
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept.action) {
          this.apiService.acceptCommunity({ id: community._id }).subscribe(() => {
            this.snackBarService.info('Community accepted');
            void this.router.navigate(['communities']);
          });
        }
      });
  }
}
