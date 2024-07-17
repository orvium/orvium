import { Component, Input, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CommunityPopulatedDTO, CreateDepositDTO, DefaultService } from '@orvium/api';
import { extractDOIFromURL } from '../../shared/shared-functions';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { NgTemplateOutlet } from '@angular/common';
import { SpinnerService } from '../../spinner/spinner.service';
import { DialogService } from '../dialog.service';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { MatDialogModule } from '@angular/material/dialog';
import { AlertComponent } from '../../shared/alert/alert.component';
import { validateDOI } from '../../shared/AppCustomValidators';

/**
 * Component for creating a new publication within a community.
 * Allows users to create a publication by entering details manually or by importing with a DOI.
 */
@Component({
  selector: 'app-create-publication-dialog',
  standalone: true,
  templateUrl: './create-publication-dialog.component.html',
  styleUrls: ['./create-publication-dialog.component.scss'],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatTooltipModule,
    MatTabsModule,
    MatInputModule,
    NgTemplateOutlet,
    AvatarDirective,
    MatDialogModule,
    AlertComponent,
  ],
})
export class CreatePublicationDialogComponent implements OnInit {
  /** Optional input for a selected community. If provided, initializes the form with this community selected. */
  @Input() selectedCommunity?: CommunityPopulatedDTO;

  /** Array of communities available for publication as a DTOs */
  communities: CommunityPopulatedDTO[] = [];

  /** Form control for entering the title of the publication. */
  titleFormControl = new FormControl('', [Validators.required]);

  /** Form control for entering the DOI for importing a publication. */
  doiFormControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, validateDOI],
  });

  /** Form control for selecting a community for the publication. Disabled if no communities are loaded. */
  communityFormControl = new FormControl({ value: '', disabled: !this.communities }, [
    Validators.required,
  ]);

  /**
   * Initializes a new instance of the CreatePublicationDialogComponent.
   *
   * @param {Router} router - Router for navigation.
   * @param {SpinnerService} spinnerService - Service to manage the spinner for loading states.
   * @param {SnackBarService} snackBar - Service to display snack bar messages.
   * @param {DefaultService} apiService - API service for backend communication.
   * @param {DialogService} dialogService - Service to manage dialog windows.
   */
  constructor(
    private router: Router,
    public spinnerService: SpinnerService,
    public snackBar: AppSnackBarService,
    private apiService: DefaultService,
    public dialogService: DialogService
  ) {
    this.communityFormControl.valueChanges.subscribe(value => {
      this.selectedCommunity = this.communities.find(community => community._id === value);
    });

    extractDOIFromURL(this.doiFormControl);
  }

  /**
   * Lifecycle hook that is called after Angular has initialized all data-bound properties.
   */
  ngOnInit(): void {
    this.apiService.getCommunities().subscribe(communities => {
      this.communities = communities;
      this.communities.sort((community1, community2) =>
        community1.name.localeCompare(community2.name)
      );
      if (!this.selectedCommunity) {
        const orviumCommunityId = this.communities.find(
          community => community.codename === 'orvium'
        )?._id;
        let defaultCommunityById = 'none';
        const urlSegments = this.router.url.split('/');
        if (
          urlSegments.length === 4 &&
          urlSegments[1] === 'communities' &&
          urlSegments[3] === 'view'
        ) {
          defaultCommunityById = urlSegments[2];
        }
        // Get default orvium community
        this.selectedCommunity = this.communities.find(
          community => community._id === (defaultCommunityById || orviumCommunityId)
        );
      }
      if (this.selectedCommunity) {
        this.communityFormControl.patchValue(this.selectedCommunity._id);
      }
    });
  }

  /**
   * Creates a new deposit based on the provided title and selected community.
   */
  create(): void {
    if (this.titleFormControl.value && this.communityFormControl.value) {
      this.spinnerService.show();
      const deposit: CreateDepositDTO = {
        title: this.titleFormControl.value,
        community: this.communityFormControl.value,
      };
      this.apiService
        .createDeposit({ createDepositDTO: deposit })
        .pipe(
          finalize(() => {
            this.spinnerService.hide();
          })
        )
        .subscribe(response => {
          this.titleFormControl.reset();
          void this.router.navigate(['deposits', response._id, 'edit']);
        });
    } else {
      this.snackBar.error('Please, enter a title for your publication');
    }
    this.close();
  }

  /**
   * Import a new deposit based on the provided importantion mechanims (DOI).
   */
  import(): void {
    if (this.doiFormControl.value && this.communityFormControl.value) {
      this.spinnerService.show();
      this.apiService
        .createWithDOI({
          createDepositWithDoiDTO: {
            community: this.communityFormControl.value,
            doi: this.doiFormControl.value,
          },
        })
        .pipe(
          finalize(() => {
            this.spinnerService.hide();
          })
        )
        .subscribe(response => {
          this.spinnerService.hide();
          void this.router.navigate(['deposits', response._id, 'edit']);
        });
    } else {
      this.snackBar.error('Please, enter a DOI for your publication');
    }
    this.close();
  }

  /**
   * Closes the dialog window.
   */
  close(): void {
    this.dialogService.closeAll();
  }

  /**
   * Opens a video dialog window.
   */
  openVideo(): void {
    this.dialogService.openVideo({
      videoUrl:
        'https://synthesia-ttv-data.s3-eu-west-1.amazonaws.com/video_data/4966ed53-53e9-43c9-92e1-57f8e6feb74b/transfers/target_transfer.mp4',
      videoType: 'video/mp4',
    });
  }
}
