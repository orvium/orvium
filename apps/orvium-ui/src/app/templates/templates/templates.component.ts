import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import {
  CommunityPopulatedDTO,
  CommunityPrivateDTO,
  DefaultService,
  TemplateDTO,
} from '@orvium/api';
import { assertIsDefined, isNotNullOrUndefined } from '../../shared/shared-functions';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { environment } from '../../../environments/environment';
import { dynamicVariablesDialogData } from './dynamic-variables-dialog-data';
import { EditorOptions, RawEditorOptions, Ui } from 'tinymce';
import { Observable } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OnExit } from '../../shared/guards/exit.guard';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { AlertComponent } from '../../shared/alert/alert.component';
import { DialogService } from '../../dialogs/dialog.service';
import { map } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Interface for the template form
 *
 * @property {FormControl<string>} template - information of the template
 */
interface TemplateForm {
  template: FormControl<string>;
}

/**
 * Component for managing and editing email templates within a community or globally.
 */
@Component({
  selector: 'app-templates',
  standalone: true,
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss'],
  imports: [
    InfoToolbarComponent,
    DescriptionLineComponent,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    EditorComponent,
    AlertComponent,
  ],
})
export class TemplatesComponent implements OnInit, OnExit {
  /** Destruction reference for unsubscribing observables on component destroy. */
  private destroyRef = inject(DestroyRef);

  /** List of available templates loaded from the server as DTOs */
  public templates: TemplateDTO[] = [];

  /**
   * Organized list of templates grouped by categories.
   */
  public templatesGroups: {
    category: string;
    templates: TemplateDTO[];
  }[] = [];

  /** Currently selected template for viewing or editing. */
  public selectedTemplate?: TemplateDTO;

  /** TinyMCE API key loaded from the environment for rich text editing. */
  public tinymceKey = environment.tinymceKey;

  /** Flag to check if the view is an admin view. */
  public isAdminView = true;

  /** The community ID, if the component is used in a community context. */
  communityId = '';

  /**
   * Form for editing the selected template's content.
   */
  templateForm = this.formBuilder.group<TemplateForm>({
    template: new FormControl('', { nonNullable: true }),
  });

  /** The community data, loaded when the component is used in a community context. */
  community?: CommunityPopulatedDTO | CommunityPrivateDTO;

  /**
   * Specification for the dialog used to insert dynamic email variables.
   */
  protected dialogSpec: Ui.Dialog.DialogSpec<Record<string, unknown>> = {
    title: 'Copy the email variable(s) you want to insert',
    size: 'large',
    body: {
      type: 'tabpanel',
      tabs: dynamicVariablesDialogData,
    },
    buttons: [],
    onSubmit: function (api) {
      //TODO: Insert Dynamic Variables Dynamically
      /*  const data = api.getData();
      console.log(data);
      assertIsDefined(data);
      editor.execCommand('mceInsertContent', false, '<p>' + ' data.dynamicVariable' + ' </p>'); */
      api.close();
    },
  };

  /**
   * Options for the TinyMCE editor used in this component.
   */
  public editorOptions: RawEditorOptions = {
    plugins: [
      'lists',
      'table',
      'link',
      'image',
      'code',
      'help',
      'wordcount',
      'fullscreen',
      'media',
      'template',
      'codesample',
    ],
    toolbar: [
      'insertfile a11ycheck undo redo | bold italic underline strikethrough | fullscreen | fontfamily fontsize blocks',
      '| alignleft aligncenter alignright alignjustify | outdent indent | forecolor backcolor | bullist numlist | link image | subscript superscript',
      'dynamicvariables',
    ],
    height: 700,
    setup: editor => {
      editor.ui.registry.addButton('dynamicvariables', {
        text: 'Select email variables',
        onAction: api => {
          editor.windowManager.open(this.dialogSpec);
        },
      });
    },
  };

  /**
   * Constructor to inject dependencies.
   *
   * @param apiService Service for API calls to the backend.
   * @param domSanitizer Service for bypassing Angular's security for certain values.
   * @param snackBar Service for displaying snack bar notifications.
   * @param route Provides access to information about a route associated with the component.
   * @param dialogService Service to manage dialogs.
   * @param formBuilder Service for creating forms.
   */
  constructor(
    private apiService: DefaultService,
    private domSanitizer: DomSanitizer,
    private snackBar: AppSnackBarService,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private formBuilder: FormBuilder
  ) {}

  /**
   * Initializes the component by fetching templates and setting up the form.
   */
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(paramMap => {
      this.communityId = paramMap.get('communityId') ?? '';
      this.isAdminView = !this.communityId;
      this.apiService
        .getAllTemplates({ communityId: this.communityId })
        .subscribe((templates: TemplateDTO[]) => {
          this.templates = templates;
          const categories = Array.from(new Set(this.templates.map(template => template.category)));
          for (const category of categories.sort()) {
            const categoryTemplates = this.templates.filter(
              template => template.category === category
            );
            assertIsDefined(categoryTemplates);
            this.templatesGroups.push({
              category: category,
              templates: categoryTemplates.sort((a, b) => (a.title < b.title ? -1 : 1)),
            });
          }

          this.templateForm.markAsPristine();
        });
      if (this.communityId) {
        this.apiService.getCommunity({ id: this.communityId }).subscribe(community => {
          this.community = community;
        });
      }
    });
  }

  /**
   * Method to select a template, possibly displaying a confirmation dialog if there are unsaved changes.
   *
   * @param event The selection change event containing the new value.
   */
  public selectTemplate(event: MatSelectChange): void {
    if (this.templateForm.dirty) {
      this.dialogService
        .openConfirm({
          title: 'Change email',
          content:
            'Are you sure you want to change the email template? The selected template changes will be removed,' +
            ' if you wanna kept it click save first.',
          cancelMessage: 'Cancel',
          acceptMessage: 'Accept',
        })
        .afterClosed()
        .pipe(isNotNullOrUndefined())
        .subscribe(accept => {
          if (accept) {
            this.templateChanged(event);
          }
        });
    } else {
      this.templateChanged(event);
    }
  }

  /**
   * Handles changing of the selected template after confirming there are no unsaved changes.
   *
   * @param event The selection change event.
   */
  templateChanged(event: MatSelectChange): void {
    this.apiService
      .getTemplateByName({
        name: String(event.value),
        communityId: this.communityId,
      })
      .subscribe((template: TemplateDTO) => {
        this.selectedTemplate = template;
        this.domSanitizer.bypassSecurityTrustHtml(this.selectedTemplate.template);
        this.templateForm.controls.template.setValue(template.template);
        this.templateForm.controls.template.markAsPristine();
        this.templateForm.controls.template.markAsUntouched();
      });
  }

  /**
   * Sends a test email using the selected template.
   */
  sendEmail(): void {
    assertIsDefined(this.selectedTemplate, 'selected template not found');
    this.apiService
      .tryEmail({ id: this.selectedTemplate._id, communityId: this.communityId })
      .subscribe(response => {
        this.snackBar.info('Email sent successfully');
      });
  }

  /**
   * Resets the selected email template to its default content.
   */
  resetEmail(): void {
    assertIsDefined(this.selectedTemplate, 'email not defined');
    assertIsDefined(this.templates, 'email not defined');
    const template = this.templates.find(template => template.name === this.selectedTemplate?.name);
    assertIsDefined(template, 'Default template not found');
    this.selectedTemplate.template = template.template;
    this.domSanitizer.bypassSecurityTrustHtml(this.selectedTemplate.template);
    this.templateForm.reset({ template: template.template });
    this.templateForm.markAsDirty();
  }

  /**
   * Saves the current state of the selected template to the backend.
   */
  save(): void {
    assertIsDefined(this.selectedTemplate, 'selected template not found');
    this.apiService
      .updateTemplate({
        id: this.selectedTemplate._id,
        templateUpdateDto: {
          template: this.templateForm.controls.template.value,
        },
        communityId: this.communityId,
      })
      .subscribe((template: TemplateDTO) => {
        this.selectedTemplate = template;
        this.templateForm.reset({ template: template.template });
        this.templateForm.markAsPristine();
        this.snackBar.info('Email template saved');
      });
  }

  /**
   * Creates a new custom template based on the currently selected template.
   */
  createTemplate(): void {
    assertIsDefined(this.selectedTemplate, 'template not found');
    assertIsDefined(this.communityId, 'comunity not defined');
    this.apiService
      .copyOfTemplate({
        id: this.selectedTemplate._id,
        templateCreateCustomizedDto: {
          communityId: this.communityId,
          template: this.templateForm.controls.template.value,
        },
      })
      .subscribe((template: TemplateDTO) => {
        this.selectedTemplate = template;
        this.templateForm.reset({ template: template.template });
        this.templateForm.markAsPristine();
        this.snackBar.info('Customized email created');
      });
  }

  /**
   * Ensures that any unsaved changes are prompted to the user before exiting the component.
   *
   * @returns Either an observable resolving to a boolean or a direct boolean value indicating whether to proceed with exiting.
   */
  onExit(): Observable<boolean> | boolean {
    if (this.templateForm.pristine) {
      return true;
    }
    const dialog = this.dialogService
      .openConfirm({
        title: 'Exit edit emails',
        content: 'Are you sure you want to exit? You have unsaved changes that will be lost.',
        cancelMessage: 'Cancel',
        acceptMessage: 'Ok',
      })
      .afterClosed()
      .pipe(map(value => !!value));

    return dialog;
  }
}
