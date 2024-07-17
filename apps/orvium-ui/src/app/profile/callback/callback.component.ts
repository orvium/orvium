import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../auth/authentication.service';

/**
 * Component responsible for handling the callback after a user is redirected from an authentication or invitation flow.
 * It checks for specific query parameters upon initialization and performs actions based on their presence and values,
 * primarily focusing on the 'inviteToken' for processing user invitations.
 */
@Component({
  selector: 'app-callback',
  standalone: true,
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'],
})
export class CallbackComponent implements OnInit {
  /**
   * Constructs a new instance of CallbackComponent.
   *
   * @param route Provides access to information about a route associated with the component that is loaded in an outlet.
   * @param authenticationService Service used to handle user authentication processes, including logging in with an invite token.
   */
  constructor(
    private route: ActivatedRoute,
    public authenticationService: AuthenticationService
  ) {}

  /**
   * Initializes the component by extracting the 'inviteToken' from the query parameters if available and using it
   * to perform authentication. This method handles the scenario where a user might be returning from an authentication
   * or invitation flow that includes an invite token.
   */
  ngOnInit(): void {
    const inviteToken = this.route.snapshot.queryParamMap.get('inviteToken');

    if (inviteToken) {
      this.authenticationService.login(inviteToken);
    }
  }
}
