import { Component, OnInit } from '@angular/core';
import {
  ACCEPT_TYPES,
  FileuploadComponent,
  MAX_FILE_SIZE,
} from '../../shared/fileupload/fileupload.component';
import { HttpResponse } from '@angular/common/http';
import {
  CommunityPopulatedDTO,
  DefaultService,
  DepositPopulatedDTO,
  PlatformImageType,
  SignedUrlDTO,
  UserPrivateDTO,
} from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { assertIsDefined } from '../../shared/shared-functions';
import { finalize, lastValueFrom } from 'rxjs';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { AvatarDirective } from '../../shared/directives/avatar.directive';

import { environment } from '../../../environments/environment';
import { MatTabsModule } from '@angular/material/tabs';
import { CommunitiesListComponent } from '../../communities/communities-list/communities-list.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { DepositsListComponent } from '../../deposits/deposits-list/deposits-list.component';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';

/**
 * Represents the administration panel component for managing platform content such as communities,
 * deposits, and uploading images related to the platform.
 */
@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    FileuploadComponent,
    AccessDeniedComponent,
    AvatarDirective,
    OverlayLoadingDirective,
    MatTabsModule,
    CommunitiesListComponent,
    MatExpansionModule,
    DepositsListComponent,
  ],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.scss'],
})
export default class AdminPanelComponent implements OnInit {
  /** Stores the current timestamp to manage refresh and updates. */
  actualTimeStamp = Date.now();

  /** Maximum file size allowed for the logo uploads. */
  defaultLogoMaxFileSize = MAX_FILE_SIZE.KB_50;

  /** Supported file types for upload. */
  ACCEPT_TYPES = ACCEPT_TYPES;

  /** Profile of the currently logged-in user. */
  profile?: UserPrivateDTO;

  /** Indicates if the logged-in user is an administrator. */
  isAdmin = false;

  /** Loading status for publications while data is fetched. */
  publicationsLoading = true;

  /** Enum for managing different platform image types. */
  plaftformImageType = PlatformImageType;

  /** Environment settings utilized within the component. */
  environment = environment;

  /** List of communities waiting for approval. */
  communitiesPendingApproval: CommunityPopulatedDTO[] = [];

  /** List of deposits waiting for approval. */
  depositsPendingApproval: DepositPopulatedDTO[] = [];

  /**
   * Initializes a new instance of the AdminPanelComponent.
   *
   * @param profileService Service to manage user profiles.
   * @param apiService Service to interact with backend APIs.
   * @param snackBarService Service to display snack bar notifications.
   */
  constructor(
    private profileService: ProfileService,
    private apiService: DefaultService,
    private snackBarService: AppSnackBarService
  ) {}

  /**
   * OnInit lifecycle hook to load user profile and fetch pending approvals.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      if (profile) {
        this.profile = profile;
        this.isAdmin = this.profile.roles.includes('admin');
      }
    });

    this.apiService.getCommunitiesPendingApproval().subscribe(communities => {
      this.communitiesPendingApproval = communities;
    });
    this.publicationsLoading = true;
    this.apiService
      .getDepositsPendingApproval()
      .pipe(
        finalize(() => {
          this.publicationsLoading = false;
        })
      )
      .subscribe(deposits => {
        this.depositsPendingApproval = deposits;
      });
  }

  /**
   * Handles file upload confirmation and updates for platform images.
   *
   * @param $event Event containing file upload details.
   * @param platformImage Type of platform image being uploaded.
   */
  async filesUploaded(
    $event: {
      originalEvent: HttpResponse<unknown>;
      files: File[];
      payload: SignedUrlDTO;
    },
    platformImage: PlatformImageType
  ): Promise<void> {
    assertIsDefined(this.profile, 'profile not found');
    await lastValueFrom(
      this.apiService.uploadLogoImageConfirmation({
        platformUploadConfirmation: {
          imageType: platformImage,
          fileMetadata: {
            filename: $event.files[0].name,
            description: $event.files[0].name,
            contentType: $event.files[0].type,
            contentLength: $event.files[0].size,
            tags: ['Admin'],
          },
        },
      })
    );
    /!* Used to force the profile image update *!/;
    this.actualTimeStamp = Date.now();

    this.snackBarService.info('Image uploaded, will take some time to take effect');
  }

  /**
   * Generates a signed URL for uploading a file and initiates the file upload process.
   *
   * @param $event Event containing the file object and form data.
   * @param isMainFile Indicates if the file is the main file for the upload.
   * @param platformFileUpload Component instance handling file uploads.
   * @param platformImage Type of platform image for the file upload.
   */
  async generateSignedUrl(
    $event: { fileObject: File; formData: FormData },
    isMainFile: boolean,
    platformFileUpload: FileuploadComponent,
    platformImage: PlatformImageType
  ): Promise<void> {
    const file = {
      name: $event.fileObject.name,
      type: $event.fileObject.type,
      size: $event.fileObject.size,
      lastModified: $event.fileObject.lastModified,
    };

    const signedUrl = await lastValueFrom(
      this.apiService.uploadLogoImage({
        createPlatformImageDTO: {
          file: file,
          platformImage: platformImage,
        },
      })
    );

    platformFileUpload.uploadFile(signedUrl, $event.fileObject, $event.formData);
  }
}
