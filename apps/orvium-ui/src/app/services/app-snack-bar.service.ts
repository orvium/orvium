import { Injectable } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';

/**
 * Provides a service for displaying informational, warning, and error snack bars throughout an application.
 * Utilizes Angular Material's MatSnackBar for presenting simple messages and action buttons to users.
 * This service can be injected into any component or other services within the application.
 */
@Injectable({
  providedIn: 'root',
})
export class AppSnackBarService {
  /**
   * Constructs the service for using MatSnackBar.
   *
   * @param {MatSnackBar} snackBar - The MatSnackBar service provided by Angular Material used to display snack bars.
   */
  constructor(public snackBar: MatSnackBar) {}

  /**
   * Displays an informational snack bar to the user. This is useful for non-critical messages that inform the user of something relevant.
   *
   * @param {string} message - The message text to be displayed on the snack bar.
   * @param {string} [action] - Optional label for the action button on the snack bar.
   * @param {MatSnackBarConfig} [config] - Optional configuration options for the snack bar, such as duration, horizontalPosition, and verticalPosition.
   * @returns {MatSnackBarRef<TextOnlySnackBar>} A reference to the snack bar, which can be used to interact with it programmatically.
   */
  info(
    message: string,
    action?: string,
    config?: MatSnackBarConfig
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, config ?? { panelClass: ['ok-snackbar'] });
  }

  /**
   * Displays a warning snack bar to alert the user of a potential problem or to warn about a necessary action.
   *
   * @param {string} message - The message text to be displayed on the snack bar.
   * @param {string} [action] - Optional label for the action button on the snack bar.
   * @param {MatSnackBarConfig} [config] - Optional configuration options for the snack bar, enhancing its visibility or behavior.
   * @returns {MatSnackBarRef<TextOnlySnackBar>} A reference to the snack bar, allowing further interactions.
   */
  warning(
    message: string,
    action?: string,
    config?: MatSnackBarConfig
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, config ?? { panelClass: ['warning-snackbar'] });
  }

  /**
   * Displays an error snack bar to notify the user of an error that has occurred. This is suitable for more critical alerts where immediate attention or action is required.
   *
   * @param {string} message - The message text to be displayed on the snack bar.
   * @param {string} [action] - Optional label for the action button on the snack bar.
   * @param {MatSnackBarConfig} [config] - Optional configuration options for the snack bar to customize its appearance and behavior.
   * @returns {MatSnackBarRef<TextOnlySnackBar>} A reference to the snack bar, allowing for user interaction or dismissal.
   */
  error(
    message: string,
    action?: string,
    config?: MatSnackBarConfig
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, config ?? { panelClass: ['error-snackbar'] });
  }
}
