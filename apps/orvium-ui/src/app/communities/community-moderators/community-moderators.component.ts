import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommunityModeratorDTO, Track, UserPrivateDTO, UserSummaryDTO } from '@orvium/api';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogConfig } from '@angular/material/dialog';
import { EditModeratorNotificationsDialogComponent } from '../../dialogs/edit-moderator-notifications-dialog/edit-moderator-notifications-dialog.component';
import { AccessDeniedComponent } from '../../shared/access-denied/access-denied.component';
import { TitleCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { DialogService } from '../../dialogs/dialog.service';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { MODERATOR_ROLE_LOV } from '../../model/orvium';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { isNotNullOrUndefined } from '../../shared/shared-functions';
import { ContributorLineComponent } from '../../shared/contributor-line/contributor-line.component';
import { ListWrapperComponent } from '../../shared/list-wrapper/list-wrapper.component';
import { MatDividerModule } from '@angular/material/divider';
import { ProfileService } from '../../profile/profile.service';
import { validateEmail, validateIsNotBlank } from '../../shared/AppCustomValidators';

/**
 * Interface representing the form controls for assigning moderators.
 *
 * @property {FormControl<string>} email - The email address of the moderator to be assigned.
 */
interface AssignModeratorsForm {
  email: FormControl<string>;
}

/**
 * Component responsible for managing community moderators, including assigning, updating, and deleting moderators.
 */
@Component({
  selector: 'app-community-moderators',
  standalone: true,
  templateUrl: './community-moderators.component.html',
  styleUrls: ['./community-moderators.component.scss'],
  imports: [
    AccessDeniedComponent,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    TitleCasePipe,
    MatChipsModule,
    MatTooltipModule,
    RouterLink,
    AvatarDirective,
    MatSelectModule,
    ContributorLineComponent,
    ListWrapperComponent,
    MatDividerModule,
  ],
})
export class CommunityModeratorsComponent implements OnInit {
  /** Template reference for the assign dialog. */
  @ViewChild('assignDialogTemplate') assignDialogTemplate!: TemplateRef<unknown>;

  /** Template reference for the notification options dialog. */
  @ViewChild('notificationOptionsTemplate') notificationOptionsTemplate!: TemplateRef<unknown>;

  /** List of moderators in the community. */
  @Input({ required: true }) moderators: CommunityModeratorDTO[] = [];

  /** Indicates if the user can update the community. */
  @Input() canUpdateCommunity = false;

  /** List of community tracks. */
  @Input({ required: true }) communityTracks!: Track[];

  /** Event emitter for deleting a moderator. */
  @Output() deleteModerator: EventEmitter<string> = new EventEmitter<string>();

  /** Event emitter for adding a moderator. */
  @Output() addModerator: EventEmitter<string> = new EventEmitter<string>();

  /** Event emitter for updating a moderator. */
  @Output() updateModerator: EventEmitter<CommunityModeratorDTO> =
    new EventEmitter<CommunityModeratorDTO>();

  /** List of moderator roles. */
  moderatorRoles = MODERATOR_ROLE_LOV;

  /**  Form group for assigning a moderator. */
  assignModeratorForm = this.formBuilder.nonNullable.group<AssignModeratorsForm>({
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, validateIsNotBlank, validateEmail],
    }),
  });

  /** The profile of the current user. */
  profile?: UserPrivateDTO;

  /**
   * Constructs the CommunityModeratorsComponent.
   * Initializes services necessary for form management, dialog interactions, user profile handling, and navigation.
   *
   * @param {FormBuilder} formBuilder - Service to create form groups and form controls.
   * @param {DialogService} dialogService - Service to manage dialog interactions.
   * @param {ProfileService} profileService - Service to manage user profile information.
   * @param {Router} router - Service for client-side navigation.
   */
  constructor(
    private formBuilder: FormBuilder,
    public dialogService: DialogService,
    private profileService: ProfileService,
    public router: Router
  ) {}

  /**
   * Initializes the component by fetching the user's profile.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      this.profile = profile;
    });
  }

  /**
   * Opens the dialog for assigning a new moderator.
   */
  openAssignModeatorDialog(): void {
    this.dialogService
      .openCustom({
        title: 'Assign moderator',
        content: 'Assign a new moderator by email. The users needs to be registered on Orvium',
        template: this.assignDialogTemplate,
        showActionButtons: false,
      })
      .afterClosed()
      .subscribe();
  }

  /**
   * Opens the dialog for changing notification settings for a moderator.
   *
   * @param {CommunityModeratorDTO} moderator - The moderator whose notification settings are to be changed.
   */
  openChangeNotificationsDialog(moderator: CommunityModeratorDTO): void {
    const dialogConfig = new MatDialogConfig<{
      moderator: CommunityModeratorDTO;
      communityTracks: Track[];
    }>();
    dialogConfig.data = {
      moderator: moderator,
      communityTracks: this.communityTracks,
    };
    const dialogRef = this.dialogService.open(
      EditModeratorNotificationsDialogComponent,
      dialogConfig
    );

    dialogRef
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(data => {
        this.updateModerator.emit(data.moderator);
      });
  }

  /**
   * Changes the role of a moderator and emits the updated moderator information.
   *
   * @param {MatSelectChange} event - The event object containing the new role for the moderator.
   * @param {CommunityModeratorDTO} moderator - The moderator whose role is being changed.
   */
  changeRole(event: MatSelectChange, moderator: CommunityModeratorDTO): void {
    moderator.moderatorRole = event.value;
    this.updateModerator.emit(moderator);
  }

  /**
   * Deletes a moderator after confirmation from the user.
   *
   * @param {UserSummaryDTO} userObjectId - The user summary of the moderator to be deleted.
   */
  delete(userObjectId: UserSummaryDTO): void {
    this.dialogService
      .openConfirm({
        title: 'Delete Moderator',
        content: `Are you sure you want to delete ${userObjectId.firstName} ${userObjectId.lastName} as moderator?`,
        acceptMessage: 'Delete',
      })
      .afterClosed()
      .pipe(isNotNullOrUndefined())
      .subscribe(deleteModerator => {
        if (deleteModerator) {
          this.deleteModerator.emit(userObjectId._id);
        }
      });
  }

  /**
   * Emits an event to add a new moderator using the email provided in the form, then closes the dialog and resets the form.
   */
  addModeratorEvent(): void {
    this.addModerator.emit(this.assignModeratorForm.value.email);
    this.dialogService.closeAll();
    this.assignModeratorForm.reset();
    this.assignModeratorForm.clearValidators();
  }

  /**
   * Open a conversation
   *
   * @param {CommunityModeratorDTO} moderator moderator of the community.
   */
  openConversation(moderator: CommunityModeratorDTO): void {
    const conversationLink = this.profileService.getConversationLink(moderator.user._id);
    void this.router.navigate([conversationLink.routerLink], {
      queryParams: conversationLink.queryParam,
    });
  }
}
