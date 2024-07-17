import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Editor, NgxEditorModule, Toolbar } from 'ngx-editor';
import { validateHTMLIsNotBlank } from '../../shared/AppCustomValidators';

/**
 * Component for inputting and sending messages in a chat interface. This component features a text editor
 * with various options to compose messages. It emits an event with the message content when the user
 * sends a message.
 */
@Component({
  selector: 'app-chat-input-box',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, NgxEditorModule, ReactiveFormsModule],
  templateUrl: './chat-input-box.component.html',
  styleUrls: ['./chat-input-box.component.scss'],
})
export class ChatInputBoxComponent implements OnDestroy, OnInit {
  /**
   * Event emitter for when a message is sent from the input box. The content of the message is passed as a string.
   *
   * @output messageSent An EventEmitter that emits the message string when a message is sent.
   */
  @Output() messageSent: EventEmitter<string> = new EventEmitter<string>();

  /**
   * FormControl for the message input, including validation to ensure that input is not just blank HTML.
   *
   * @property message A FormControl with validators to ensure non-empty input.
   */
  message = new FormControl('', {
    nonNullable: true,
    validators: [validateHTMLIsNotBlank, Validators.required],
  });

  /**
   * Instance of the Editor from NgxEditor, configured for the chat input box.
   */
  editor!: Editor;

  /**
   * Configuration for the toolbar of the rich text editor, specifying which features are available like
   * bold, italic, links, and lists.
   *
   * @property toolbar Array of toolbar options to include in the rich text editor.
   */
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['ordered_list', 'bullet_list'],
    ['link', 'image'],
  ];

  /**
   * OnInit lifecycle hook to initialize the editor with specific plugins and features, enhancing the chat input experience.
   */
  ngOnInit(): void {
    this.editor = new Editor({
      features: {
        linkOnPaste: true,
        resizeImage: true,
      },
      plugins: [],
    });
  }

  /**
   * OnDestroy lifecycle hook to clean up the editor instance, preventing memory leaks.
   */
  ngOnDestroy(): void {
    this.editor.destroy();
  }

  /**
   * Sends the composed message when the user triggers the send action. It emits the message content and clears the input field.
   */
  sendMessage(): void {
    this.messageSent.emit(this.message.value);
    this.message.setValue('');
  }
}
