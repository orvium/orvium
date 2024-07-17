import { ApplicationRef, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, concat, Observable, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { first, retry, switchMap, tap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  ConversationPopulatedDTO,
  DefaultService,
  UpdateUserDTO,
  UserPrivateDTO,
  UserPublicDTO,
} from '@orvium/api';
import { Params } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

/**
 * Service responsible for managing user profile data and interactions within the application. It handles operations such as
 * fetching and updating profile information, managing conversations, and polling for updates in a user's conversations.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  /** A BehaviorSubject containing the current user's profile data. */
  public profile = new BehaviorSubject<UserPrivateDTO | undefined>(undefined);

  /** A BehaviorSubject indicating whether push notifications are enabled for the user. */
  public pushNotifications = new BehaviorSubject<boolean | undefined>(undefined);

  /** A BehaviorSubject containing an array of the user's conversations. */
  public conversations = new BehaviorSubject<ConversationPopulatedDTO[]>([]);

  /**
   * Constructs the ProfileService with dependencies needed for HTTP requests, application operations,
   * and checking the platform ID.
   *
   * @param {HttpClient} http - The Angular HTTP client service used for making API calls.
   * @param {DefaultService} apiService - API service for backend communication.
   * @param {ApplicationRef} appRef - The Angular application reference to check if the application is stable.
   * @param {string} platformId - A token that indicates the platform ID, used to check if running in a browser.
   */
  constructor(
    private http: HttpClient,
    private apiService: DefaultService,
    private appRef: ApplicationRef,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /**
   * Updates the user's profile with new data and updates the profile BehaviorSubject.
   *
   * @param {UpdateUserDTO} profile - The new profile data to update.
   * @returns {Observable<UserPrivateDTO>} An Observable that emits the updated profile data.
   */
  updateProfile(profile: UpdateUserDTO): Observable<UserPrivateDTO> {
    return this.apiService.updateProfile({ updateUserDTO: profile }).pipe(
      tap(profileUpdated => {
        this.profile.next(profileUpdated);
      })
    );
  }

  /**
   * Returns an Observable of the user's profile data.
   *
   * @returns {Observable<UserPrivateDTO | undefined>} An Observable of the user's profile data.
   */
  getProfile(): Observable<UserPrivateDTO | undefined> {
    return this.profile.asObservable();
  }

  /**
   * Fetches the user's profile data from the API and updates the profile BehaviorSubject.
   *
   * @returns {Observable<UserPrivateDTO>} An Observable that emits the user's profile data.
   */
  getProfileFromApi(): Observable<UserPrivateDTO> {
    let params = new HttpParams();
    const inviteToken = sessionStorage.getItem('inviteToken');
    if (inviteToken) {
      params = params.set('inviteToken', inviteToken);
    }

    return this.http
      .get<UserPrivateDTO>(`${environment.apiEndpoint}/users/profile`, { params })
      .pipe(
        tap(profile => {
          console.log('Profile from API returned');
          this.profile.next(profile);
        })
      );
  }

  /**
   * Fetches the user's conversations from the API and updates the conversations BehaviorSubject.
   *
   * @returns {Observable<ConversationPopulatedDTO[]>} An Observable that emits an array of the user's conversations.
   */
  getConversationsFromApi(): Observable<ConversationPopulatedDTO[]> {
    return this.apiService.getConversations().pipe(
      tap(conversations => {
        conversations.sort((a, b) => {
          if (a.lastMessageDate && b.lastMessageDate) {
            return b.lastMessageDate.getTime() - a.lastMessageDate.getTime();
          }
          if (!b.lastMessageDate && a.lastMessageDate) return -1;
          if (!a.lastMessageDate && b.lastMessageDate) return 1;
          return 0;
        });

        conversations.sort((a, b) => {
          return Number(b.messagesPending) - Number(a.messagesPending);
        });

        this.conversations.next(conversations);
      })
    );
  }

  /**
   * Fetches profiles based on a query parameter.
   *
   * @param {{ query?: string }} params - The parameters to pass to the API query.
   * @returns {Observable<UserPrivateDTO[]>} An Observable that emits an array of user profiles matching the query.
   */
  getProfiles(params: { query?: string }): Observable<UserPrivateDTO[]> {
    const httpParams = new HttpParams().appendAll(params);
    return this.http.get<UserPrivateDTO[]>(`${environment.apiEndpoint}/users/profiles`, {
      params: httpParams,
    });
  }

  /**
   * Confirms a user's email via a code provided by the API.
   *
   * @param {string} code - The confirmation code to send to the API.
   * @returns {Observable<{ message: string; success: boolean }>} An Observable that emits the result of the email confirmation.
   */
  confirmEmail(code: string): Observable<{ message: string; success: boolean }> {
    return this.http.patch<{ message: string; success: boolean }>(
      `${environment.apiEndpoint}/users/confirmEmail`,
      {
        code,
      }
    );
  }

  /**
   * Determines if the user can update their profile based on available actions.
   *
   * @param {UserPrivateDTO | UserPublicDTO} user - The user profile to check for update permission.
   * @returns {boolean} True if the user can update their profile, otherwise false.
   */
  canUpdateUser(user: UserPrivateDTO | UserPublicDTO): boolean {
    for (const action of user.actions) {
      if (action === 'update') {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns a link and query parameters for navigating to a conversation.
   *
   * @param {string} recipientId - The recipient ID to find the conversation.
   * @returns {{ routerLink: string; queryParam: Params }} An object containing the router link and query parameters.
   */
  getConversationLink(recipientId: string): { routerLink: string; queryParam: Params } {
    const conversation = this.conversations.value.find(conversation =>
      conversation.participants.includes(recipientId)
    );
    return conversation
      ? { routerLink: '/chat', queryParam: { conversationId: conversation._id } }
      : { routerLink: '/chat', queryParam: { recipientId: recipientId } };
  }

  /**
   * Initializes polling for conversations when the application is stable.
   */
  initAppConversationsPolling(): void {
    this.getConversationsFromApi().subscribe();
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const appIsStable = this.appRef.isStable.pipe(first(isStable => isStable));
    const conversationsPolling = timer(1000, 100000).pipe(
      switchMap(tick => this.getConversationsFromApi()),
      retry(2),
      tap(conversations => {
        if (JSON.stringify(conversations) !== JSON.stringify(this.conversations.getValue())) {
          this.conversations.next(conversations);
        }
      })
    );

    // We subscribe to these observable in order, and they are resolved sequentially
    // First wait for the app is stable, last get conversations
    concat(appIsStable, conversationsPolling).subscribe();
  }
}
