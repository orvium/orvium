import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AvatarDirective } from '../../shared/directives/avatar.directive';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ScrollingModule } from '@angular/cdk/scrolling';

/**
 * Email data structure for sending emails.
 *
 * @property {string} subject - The subject line of the email.
 * @property {string} body - The main content/body of the email.
 * @property {string[]} recipients - List of email addresses of the recipients.
 */

export interface EmailData {
  subject: string;
  body: string;
  recipients: string[];
}

/**
 * User information data structure.
 *
 * @property {string} firstName - The first name of the user.
 * @property {string} lastName - The last name of the user.
 * @property {string} email - The email address of the user.
 * @property {string} gravatar - The URL to the user's gravatar image.
 * @property {string} [avatar] - An optional URL to the user's avatar image.
 */
export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
  gravatar: string;
  avatar?: string;
}

/**
 * Form structure for subject input.
 *
 * @property {FormControl<string>} subject - FormControl for email subject input.
 */
interface SubjectForm {
  subject: FormControl<string>;
}

/**
 * A component that allows users to send notifications via email to a list of recipients.
 * Provides text editing capabilities for composing the body of the email.
 */
@Component({
  selector: 'app-send-notifications',
  standalone: true,
  imports: [
    NgxEditorModule,
    ReactiveFormsModule,
    FormsModule,
    AvatarDirective,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ScrollingModule,
  ],
  templateUrl: './send-notifications.component.html',
  styleUrls: ['./send-notifications.component.scss'],
})
export class SendNotificationsComponent implements OnDestroy, OnInit {
  /** A list of recipients who will receive the email. This must be provided for the component to function. */
  @Input({ required: true })
  recipients!: UserInfo[];

  /** Event emitter that outputs the email data once the send action is triggered. */
  @Output() sendEmails = new EventEmitter<EmailData>();

  /**  The body of the email to be sent, which can be formatted using the rich text editor. */
  body = '';

  /** The editor instance used for rich text editing within the component. */
  editor!: Editor;

  /** Defines the toolbar options for the ngx-editor, providing formatting capabilities such as bold, italic, etc. */
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['ordered_list', 'bullet_list'],
    ['link', 'image'],
  ];

  //** Form group for managing the subject of the email, which is a required field. */
  subjectForm = this.formBuilder.group<SubjectForm>({
    subject: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(1)],
    }),
  });

  /**
   * Constructs the SendNotificationsComponent.
   *
   * @param {FormBuilder} formBuilder - Angular FormBuilder service for creating form groups.
   */
  constructor(private formBuilder: FormBuilder) {}

  /**
   * Initializes the component by setting up the text editor and retrieving user preferences.
   */
  ngOnInit(): void {
    this.editor = new Editor({
      attributes: { class: 'min-h-[12rem]' },
      features: {
        linkOnPaste: true,
        resizeImage: true,
      },
      plugins: [],
    });
  }

  /**
   * Cleans up resources used by the component, particularly the text editor to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.editor.destroy();
  }

  /**
   * Sends the composed email to the list of recipients specified.
   * Emits the email data through the `sendEmails` event emitter.
   */
  sendEmail(): void {
    this.sendEmails.emit({
      body: this.body,
      recipients: this.recipients.map(recipient => recipient.email),
      subject: this.subjectForm.getRawValue().subject,
    });
  }

  /**
   * Removes a recipient from the list of recipients.
   *
   * @param {UserInfo} recipient - The recipient to remove.
   */
  remove(recipient: UserInfo): void {
    const index = this.recipients.indexOf(recipient);
    if (index >= 0) {
      this.recipients.splice(index, 1);
    }
  }
}
