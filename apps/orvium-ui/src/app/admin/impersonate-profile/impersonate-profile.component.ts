import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserPrivateDTO } from '@orvium/api';
import { ProfileService } from '../../profile/profile.service';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { AlertComponent } from '../../shared/alert/alert.component';
import { DialogService } from '../../dialogs/dialog.service';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { isNotNullOrUndefined } from '../../shared/shared-functions';
import { OverlayLoadingDirective } from '../../spinner/overlay-loading.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { MatDividerModule } from '@angular/material/divider';

/**
 * Component for managing impersonation of user profiles within the platform.
 * Allows administrators to impersonate another user for troubleshooting or administrative purposes.
 */
@Component({
  selector: 'app-impersonate-profile',
  standalone: true,
  templateUrl: './impersonate-profile.component.html',
  styleUrls: ['./impersonate-profile.component.scss'],
  imports: [
    AccessDeniedComponent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    RouterLink,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    AlertComponent,
    AvatarDirective,
    OverlayLoadingDirective,
    ListWrapperComponent,
    ContributorLineComponent,
    MatDividerModule,
  ],
})
export class ImpersonateProfileComponent implements OnInit {
  /** Utility for managing component lifecycle and subscription cleanup. */
  private destroyRef = inject(DestroyRef);

  /** Profile of the currently logged-in user, possibly undefined if not fetched yet. */
  profile?: UserPrivateDTO;

  /** List of user profiles based on search results. */
  profiles: UserPrivateDTO[] = [];

  /** Indicates if the logged-in user has admin privileges. */
  isAdmin = false;

  /** Indicates whether a profile search is currently ongoing. */
  isSearching = false;

  /** Form group for handling user search input. */
  searchFormGroup = new FormGroup({
    search: new FormControl(''),
  });

  /**
   * Initializes a new instance of the ImpersonateProfileComponent.
   *
   * @param profileService Service to manage user profiles.
   * @param dialogService Service to handle modal dialogs.
   */
  constructor(
    private profileService: ProfileService,
    private dialogService: DialogService
  ) {}

  /**
   * OnInit lifecycle hook to load the user's profile and set up search functionalities.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
      if (this.profile) {
        this.isAdmin = this.profile.roles.includes('admin');
      }
    });
    this.searchFormGroup.controls.search.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(searchValue => {
        if (searchValue) {
          this.isSearching = true;
          this.profileService
            .getProfiles({ query: searchValue })
            .pipe(
              finalize(() => {
                this.isSearching = false;
              })
            )
            .subscribe(profiles => (this.profiles = profiles));
        } else {
          this.profiles = [];
        }
      });
  }

  /**
   * Initiates impersonation of a selected user.
   *
   * @param userId The unique identifier of the user to impersonate.
   */
  impersonate(userId: string): void {
    this.dialogService
      .openConfirm({
        title: 'Impersonate User',
        cancelMessage: 'Cancel',
        acceptMessage: 'Impersonate',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(accept => {
        if (accept) {
          this.profileService.updateProfile({ impersonatedUser: userId }).subscribe(() => {
            window.location.reload();
          });
        }
      });
  }
}
