import {
  AfterViewInit,
  Component,
  DestroyRef,
  Input,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
} from '@angular/core';
import { MatSidenav, MatSidenavContent, MatSidenavModule } from '@angular/material/sidenav';
import { SidenavService } from '../../services/sidenav.service';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ProfileService } from '../../profile/profile.service';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { UserPrivateDTO } from '@orvium/api';
import { filter } from 'rxjs/operators';
import { InviteService } from '../../services/invite.service';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CreatePublicationDialogComponent } from '../../dialogs/create-publication-dialog/create-publication-dialog.component';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogService } from '../../dialogs/dialog.service';
import { BREAKPOINTS } from '../breakpoints';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Manages the side navigation panels for the application, providing controls for
 * both the left and right side navigation elements and interaction with publication creation.
 */
@Component({
  selector: 'app-side-nav',
  standalone: true,
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  imports: [
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    CreatePublicationDialogComponent,
    MatListModule,
    RouterLinkActive,
    RouterLink,
    MatTooltipModule,
    NgTemplateOutlet,
    RouterOutlet,
    NgClass,
  ],
})
export class SideNavComponent implements OnInit, AfterViewInit {
  /** Holds reference to the left side navigation panel */
  private _leftSidenav?: MatSidenav;

  /** Indicates if the current user has administrative privileges */
  isAdmin = false;

  /**
   * Captures the left sidenav element and provides it to the sidenav service.
   *
   *  @param leftSidenav The left MatSidenav instance
   */
  @ViewChild('sidenav') set leftSidenav(leftSidenav: MatSidenav | undefined) {
    this._leftSidenav = leftSidenav;
    if (leftSidenav) {
      this.sidenavService.setSidenav(leftSidenav);
    }
  }

  /**
   * Getter to access the private `_leftSidenav` property
   *
   * @return {MatSidenav | undefined}  _leftSidenav property
   */
  get leftSidenav(): MatSidenav | undefined {
    return this._leftSidenav;
  }

  /**
   * Captures the right sidenav element and provides it to the sidenav service.
   *
   * @param rightSidenav The right MatSidenav instance
   */
  @ViewChild('rightSidenav') set rightSidenav(rightSidenav: MatSidenav | undefined) {
    if (rightSidenav) {
      this.sidenavService.setRightSidenav(rightSidenav);
    }
  }

  /** Reference to the publication dialog template */
  @ViewChild('createPublicationDialogTemplate')
  createPublicationDialogTemplate!: TemplateRef<unknown>;
  @ViewChild('sidenavContent') private sidenavContentDiv?: MatSidenavContent;

  /** Determines whether the left sidenav is enabled */
  @Input() enableLeftSidenav = false;

  /** Injectable service for managing component lifecycle destruction */
  private destroyRef = inject(DestroyRef);

  /** Tracks if the sidenav is expanded or collapsed */
  isExpanded = true;

  /** Profile information of the currently logged-in user */
  profile?: UserPrivateDTO;

  /** Flag to indicate if the screen size is small (mobile view) */
  smallScreen = false;

  /**
   * Constructs the SideNavComponent with necessary dependencies.
   *
   * @param sidenavService Service to manage sidenav states and interactions.
   * @param snackBar Service to display snack bar notifications.
   * @param inviteService Service to manage invitation dialogs.
   * @param router Angular Router for managing navigation.
   * @param profileService Service to fetch and update user profile data.
   * @param breakpointObserver Service to subscribe to media query changes.
   * @param dialogService Service to manage custom dialog interactions.
   */
  constructor(
    public sidenavService: SidenavService,
    private snackBar: AppSnackBarService,
    private inviteService: InviteService,
    public router: Router,
    private profileService: ProfileService,
    public breakpointObserver: BreakpointObserver,
    public dialogService: DialogService
  ) {}

  /**
   * Initializes the component, setting up subscriptions to manage the sidenav state and user profile updates.
   */
  ngOnInit(): void {
    this.profileService.getProfile().subscribe(profileRefreshed => {
      if (profileRefreshed) {
        this.profile = profileRefreshed;
        this.isAdmin = this.profile.roles.includes('admin');
      }
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: NavigationEnd) => {
        if (this.smallScreen && this.leftSidenav) {
          void this.sidenavService.close();
        }
      });

    this.sidenavService.sidenavExpandedChange.subscribe(value => {
      this.isExpanded = value;
    });
  }

  /**
   * Toggles the right side navigation panel state.
   */
  async toggleRightSidenav(): Promise<void> {
    await this.sidenavService.toggleRight();
  }

  /**
   * Closes all sidenav panels.
   */
  async closeSidenav(): Promise<void> {
    await this.sidenavService.close();
    await this.sidenavService.closeRight();
  }

  /**
   * Opens the invitation dialog.
   */
  openInviteDialog(): void {
    this.inviteService.openInviteDialog();
  }

  /**
   * Initiates the creation of a new publication via a custom dialog.
   */
  create(): void {
    if (!this.profile?.isOnboarded || !!this.profile.emailPendingConfirmation) {
      this.snackBar.info('Complete your profile and confirm your email first');
    } else {
      this.dialogService.openCustom({
        template: this.createPublicationDialogTemplate,
        showActionButtons: false,
      });
    }
  }

  /**
   * Called after each navigation event to ensure the sidenav content starts at the top.
   *
   * @param event Event associated with activation of a component in the router-outlet.
   */
  onActivate(event: Event): void {
    // scroll to top on each router change
    if (this.sidenavContentDiv) {
      this.sidenavContentDiv.scrollTo({ top: 0 });
    }
  }

  /**
   * Additional initialization tasks for after the view has been fully initialized.
   */
  ngAfterViewInit(): void {
    this.breakpointObserver.observe(BREAKPOINTS.MOBILE).subscribe(result => {
      this.smallScreen = result.matches;
    });
  }
}
