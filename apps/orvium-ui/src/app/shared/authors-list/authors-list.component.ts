import { Component, Input, OnInit } from '@angular/core';
import {
  AuthorDTO,
  DefaultService,
  GetPublicProfileRequestParams,
  UserPrivateDTO,
} from '@orvium/api';
import { AvatarDirective } from '../directives/avatar.directive';
import { NgClass, TitleCasePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SeparatorPipe } from '../custom-pipes/separator.pipe';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { InviteService } from '../../services/invite.service';
import { MatDividerModule } from '@angular/material/divider';
import { ProfileService } from '../../profile/profile.service';
import { finalize } from 'rxjs/operators';
import { DialogService } from '../../dialogs/dialog.service';

/**
 * Component to display a list of authors with optional interactive functionalities like chat and invitation.
 * Each author can be displayed with their avatar, and additional details like credits and tags.
 */
@Component({
  selector: 'app-authors-list',
  standalone: true,
  templateUrl: './authors-list.component.html',
  styleUrls: ['./authors-list.component.scss'],
  imports: [
    AvatarDirective,
    NgClass,
    FontAwesomeModule,
    SeparatorPipe,
    TitleCasePipe,
    MatChipsModule,
    MatIconModule,
    RouterLink,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
  ],
})
export class AuthorsListComponent implements OnInit {
  /**
   * List of authors to display. Each author object may include credits, tags, and a chat link.
   */
  @Input({ required: true }) authors: (Omit<AuthorDTO, 'credit'> & {
    credit?: string[];
    tags?: string[];
    chatLink?: string;
  })[] = [];

  /** Determines whether to show the invitation button for each author. */
  @Input() showInvite = false;

  /** The user's own profile information, fetched to determine interaction capabilities. */
  profile?: UserPrivateDTO;

  /**
   * Constructs the AuthorsListComponent.
   * Initializes services used for author interactions like invitations, conversations, and API communications.
   *
   * @param {InviteService} inviteService - Service to manage invitations.
   * @param {ProfileService} profileService - Service to access user profile information.
   * @param {Router} router - Angular Router to manage navigation.
   * @param {DefaultService} apiService - API service for backend communication.
   * @param {DialogService} dialogService - Service for opening dialog windows.
   */
  constructor(
    private inviteService: InviteService,
    private profileService: ProfileService,
    public router: Router,
    public apiService: DefaultService,
    public dialogService: DialogService
  ) {}

  /**
   * Fetches the user's profile on initialization to enable personalized interactions.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profile => {
      if (profile) {
        this.profile = profile;
      }
    });
  }

  /**
   * Invokes an invitation service to send an invite to an author.
   */
  inviteAuthor(): void {
    this.inviteService.openInviteDialog();
  }

  /**
   * Opens a chat conversation with a specified author if a chat link is available.
   *
   * @param {Omit<AuthorDTO, 'credit'> & { credit?: string[]; tags?: string[]; chatLink?: string }} author -
   * The author with whom to initiate a conversation.
   */
  openConversation(
    author: Omit<AuthorDTO, 'credit'> & {
      credit?: string[];
      tags?: string[];
      chatLink?: string;
    }
  ): void {
    this.apiService
      .getPublicProfile({ nickname: author.nickname } as GetPublicProfileRequestParams)
      .pipe(finalize(() => this.dialogService.closeAll()))
      .subscribe(profile => {
        const conversationLink = this.profileService.getConversationLink(profile._id);
        void this.router.navigate([conversationLink.routerLink], {
          queryParams: conversationLink.queryParam,
        });
      });
  }
}
