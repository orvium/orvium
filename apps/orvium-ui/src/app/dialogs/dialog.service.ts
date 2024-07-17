import { Injectable, TemplateRef } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { CustomDialogComponent } from './custom-dialog/custom-dialog.component';
import { AlertDialogComponent } from './alert-dialog/alert-dialog.component';
import { InputDialogComponent, InputDialogResponse } from './input-dialog/input-dialog.component';
import { VideoDialogComponent } from './video-dialog/video-dialog.component';

/**
 * Dialog configuration that includes optional title, content, acceptance message, and icon.
 *
 * @extends {MatDialogConfig}
 * @property {string} [title] - Optional title for the dialog.
 * @property {string} [content] - Optional content text to be displayed in the dialog.
 * @property {string} [acceptMessage] - Optional text for the acceptance (confirm) button.
 * @property {string} [icon] - Optional icon to be displayed in the dialog.
 */
export interface IDialogConfig extends MatDialogConfig {
  title?: string;
  content?: string;
  acceptMessage?: string;
  icon?: string;
}

/**
 * Configuration for confirmation dialogs which includes options to cancel the operation.
 * Used for dialogs that require user confirmation to proceed or cancel.
 *
 * @property {string} [cancelMessage] - Optional text for the cancellation (cancel) button.
 * @property {string} [icon] - Optional icon.
 */
export interface IConfirmConfig extends IDialogConfig {
  cancelMessage?: string;
  icon?: string;
}

/**
 * Configuration for custom dialogs that may include a custom template and optionally show action buttons.
 *
 * @property {boolean} [showActionButtons] - Whether to show action buttons in the dialog.
 * @property {TemplateRef<unknown>} template - Custom template reference for rendering the dialog content.
 * @property {string} [cancelMessage] - Optional text for the cancellation (cancel) button.
 */
export interface ICustomConfig extends IDialogConfig {
  showActionButtons?: boolean;
  template: TemplateRef<unknown>;
  cancelMessage?: string;
}

/**
 * Configuration for dialogs specifically designed to display video content.
 *
 * @property {string} videoUrl - The URL of the video to be played in the dialog.
 * @property {string} videoType - The MIME type of the video, e.g., 'video/mp4' or 'audio/mpeg'.
 */
export interface IVideoConfig extends MatDialogConfig {
  videoUrl: string;
  videoType: 'video/ogg' | 'video/mp4' | 'audio/ogg' | 'audio/mpeg';
}

/**
 * Configuration for dialogs that include an input field, typically used for forms or data entry.
 *
 * @property {string} [cancelMessage] - Optional text for the cancellation (cancel) button.
 * @property {string} [inputLabel] - Label text for the input field.
 * @property {string} [icon] - Optional icon to be displayed next to the input field.
 * @property {boolean} [useTextarea] - Specifies whether the input should use a textarea instead of a standard text field.
 */
export interface IInputConfig extends IDialogConfig {
  cancelMessage?: string;
  inputLabel?: string;
  icon?: string;
  useTextarea?: boolean;
}

/**
 * Service to manage and handle the opening of various dialog components. This service abstracts the
 * complexity of configuring and launching dialogs based on Angular Material's MatDialog service, providing
 * a simplified interface for opening confirm dialogs, input dialogs, alert dialogs, custom dialogs, and video dialogs.
 */
@Injectable({
  providedIn: 'root',
})
export class DialogService {
  /**
   * Creates an instance of DialogService.
   *
   * @param {MatDialog} _dialogService - The Angular Material MatDialog service used to open dialog components.
   */
  constructor(public _dialogService: MatDialog) {}

  /**
   * Opens a generic dialog with a component or template, passing in optional configuration.
   *
   * @param {ComponentType<T> | TemplateRef<T>} component - The component or template to load into the dialog.
   * @param {MatDialogConfig<P>} [config] - Optional configuration for the dialog.
   * @returns {MatDialogRef<T, P>} A reference to the dialog opened.
   */
  public open<T, P>(
    component: ComponentType<T> | TemplateRef<T>,
    config?: MatDialogConfig<P>
  ): MatDialogRef<T, P> {
    return this._dialogService.open(component, config);
  }

  /**
   * Closes all currently opened dialogs.
   */
  public closeAll(): void {
    this._dialogService.closeAll();
  }

  /**
   * Opens a confirmation dialog with custom configurations.
   *
   * @param {IConfirmConfig} config - The configuration for the confirmation dialog.
   * @returns {MatDialogRef<ConfirmDialogComponent, boolean>} A reference to the dialog opened.
   */
  public openConfirm(config: IConfirmConfig): MatDialogRef<ConfirmDialogComponent, boolean> {
    const dialogConfig: MatDialogConfig = this._createConfig(config);
    const dialogRef: MatDialogRef<ConfirmDialogComponent, boolean> = this._dialogService.open(
      ConfirmDialogComponent,
      dialogConfig
    );
    const confirmDialogComponent: ConfirmDialogComponent = dialogRef.componentInstance;
    confirmDialogComponent.title = config.title;
    confirmDialogComponent.content = config.content;
    confirmDialogComponent.icon = config.icon;

    if (config.cancelMessage) {
      confirmDialogComponent.cancelMessage = config.cancelMessage;
    }

    if (config.acceptMessage) {
      confirmDialogComponent.acceptMessage = config.acceptMessage;
    }
    return dialogRef;
  }

  /**
   * Opens an input dialog where users can submit data, configured with custom options.
   *
   * @param {IInputConfig} config - The configuration for the input dialog.
   * @returns {MatDialogRef<InputDialogComponent, InputDialogResponse>} A reference to the dialog opened.
   */
  public openInputDialog(
    config: IInputConfig
  ): MatDialogRef<InputDialogComponent, InputDialogResponse> {
    const dialogConfig: MatDialogConfig = this._createConfig(config);
    const dialogRef: MatDialogRef<InputDialogComponent, InputDialogResponse> =
      this._dialogService.open<InputDialogComponent, boolean>(InputDialogComponent, dialogConfig);
    const inputDialogComponent: InputDialogComponent = dialogRef.componentInstance;
    inputDialogComponent.title = config.title;
    inputDialogComponent.inputLabel = config.inputLabel;
    inputDialogComponent.content = config.content;
    inputDialogComponent.icon = config.icon;

    if (config.cancelMessage) {
      inputDialogComponent.cancelMessage = config.cancelMessage;
    }

    if (config.acceptMessage) {
      inputDialogComponent.acceptMessage = config.acceptMessage;
    }

    if (config.useTextarea) {
      inputDialogComponent.useTextarea = config.useTextarea;
    }

    return dialogRef;
  }

  /**
   * Opens an alert dialog that displays information to the user, with an optional acceptance button.
   *
   * @param {IDialogConfig} config - The configuration for the alert dialog.
   * @returns {MatDialogRef<AlertDialogComponent, boolean>} A reference to the dialog opened.
   */
  public openAlert(config: IDialogConfig): MatDialogRef<AlertDialogComponent, boolean> {
    const dialogConfig: MatDialogConfig = this._createConfig(config);
    const dialogRef: MatDialogRef<AlertDialogComponent, boolean> = this._dialogService.open(
      AlertDialogComponent,
      dialogConfig
    );
    const alertDialogComponent: AlertDialogComponent = dialogRef.componentInstance;
    alertDialogComponent.title = config.title;
    alertDialogComponent.content = config.content;
    alertDialogComponent.icon = config.icon;

    if (config.acceptMessage) {
      alertDialogComponent.acceptMessage = config.acceptMessage;
    }
    return dialogRef;
  }

  /**
   * Opens a custom dialog that may contain complex layouts or functionality, specified by a template.
   *
   * @param {ICustomConfig} config - The configuration for the custom dialog.
   * @returns {MatDialogRef<CustomDialogComponent, boolean>} A reference to the dialog opened.
   */
  public openCustom(config: ICustomConfig): MatDialogRef<CustomDialogComponent, boolean> {
    const dialogConfig: MatDialogConfig = this._createConfig(config);
    const dialogRef: MatDialogRef<CustomDialogComponent, boolean> = this._dialogService.open(
      CustomDialogComponent,
      dialogConfig
    );
    const customDialogComponent: CustomDialogComponent = dialogRef.componentInstance;
    customDialogComponent.title = config.title;
    customDialogComponent.content = config.content;
    if (config.showActionButtons) {
      customDialogComponent.showActionButtons = config.showActionButtons;
      if (config.acceptMessage) {
        customDialogComponent.acceptMessage = config.acceptMessage;
      }
      if (config.cancelMessage) {
        customDialogComponent.cancelMessage = config.cancelMessage;
      }
      customDialogComponent.icon = config.icon;
    }
    customDialogComponent.template = config.template;
    return dialogRef;
  }

  /**
   * Opens a video dialog that plays a specified video.
   *
   * @param {IVideoConfig} config - The configuration for the video dialog.
   * @returns {MatDialogRef<VideoDialogComponent, boolean>} A reference to the dialog opened.
   */
  public openVideo(config: IVideoConfig): MatDialogRef<VideoDialogComponent, boolean> {
    const dialogConfig: MatDialogConfig = this._createConfig(config);
    const dialogRef: MatDialogRef<VideoDialogComponent, boolean> = this._dialogService.open(
      VideoDialogComponent,
      dialogConfig
    );
    const videoDialogComponent: VideoDialogComponent = dialogRef.componentInstance;
    videoDialogComponent.videoUrl = config.videoUrl;
    videoDialogComponent.videoType = config.videoType;

    return dialogRef;
  }

  /**
   * Internal method to create a standard configuration for dialogs based on provided options.
   *
   * @param {IDialogConfig} config - The base configuration from which to create the dialog configuration.
   * @returns {MatDialogConfig} The created MatDialogConfig object.
   */
  private _createConfig(config: IDialogConfig): MatDialogConfig {
    const dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.width = 'max-content';
    Object.assign(dialogConfig, config);
    return dialogConfig;
  }
}
