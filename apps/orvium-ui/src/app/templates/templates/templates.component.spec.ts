import { firstValueFrom, Observable, of } from 'rxjs';
import { TemplatesComponent } from './templates.component';
import { CommunityPrivateDTO, DefaultService, TemplateCategory, TemplateDTO } from '@orvium/api';
import { AppSnackBarService } from '../../services/app-snack-bar.service';
import { assertIsDefined, assertIsObservable } from '../../shared/shared-functions';
import { MockComponent, MockedComponentFixture, MockProvider, MockRender } from 'ng-mocks';
import { Editor, Ui } from 'tinymce';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { factoryCommunityPrivateDTO } from '../../shared/test-data';
import { DialogService } from '../../dialogs/dialog.service';
import { MatDialogRef } from '@angular/material/dialog';
import { InfoToolbarComponent } from '../../shared/info-toolbar/info-toolbar.component';
import { DescriptionLineComponent } from '../../shared/description-line/description-line.component';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { AlertComponent } from '../../shared/alert/alert.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';

describe('TemplatesComponent', () => {
  const templateMock: TemplateDTO = {
    actions: [],
    name: 'confirm-email',
    title: 'Confirmation Email',
    template: 'template',
    _id: '1',
    isCustomizable: true,
    category: TemplateCategory.System,
  };
  const templatesGroupsNoSortedMock: TemplateDTO[] = [
    {
      actions: [],
      name: 'review-submitted',
      title: 'Review Submitted',
      template: 'template',
      _id: '1',
      isCustomizable: true,
      category: TemplateCategory.Review,
    },
    {
      actions: [],
      name: 'review-accepted',
      title: 'Review Accepted',
      template: 'template',
      _id: '2',
      isCustomizable: true,
      category: TemplateCategory.Review,
    },
    {
      actions: [],
      name: 'review-created',
      title: 'Review Created',
      template: 'template',
      _id: '2',
      isCustomizable: true,
      category: TemplateCategory.Review,
    },
  ];
  const templatesGroupsSortedMock: TemplateDTO[] = [
    {
      actions: [],
      name: 'review-accepted',
      title: 'Review Accepted',
      template: 'template',
      _id: '2',
      isCustomizable: true,
      category: TemplateCategory.Review,
    },
    {
      actions: [],
      name: 'review-created',
      title: 'Review Created',
      template: 'template',
      _id: '2',
      isCustomizable: true,
      category: TemplateCategory.Review,
    },
    {
      actions: [],
      name: 'review-submitted',
      title: 'Review Submitted',
      template: 'template',
      _id: '1',
      isCustomizable: true,
      category: TemplateCategory.Review,
    },
  ];
  let community: CommunityPrivateDTO;
  let routeSnapshot: { paramMap: unknown };

  beforeEach(() => {
    community = factoryCommunityPrivateDTO.build({});

    routeSnapshot = {
      paramMap: of(
        convertToParamMap({
          communityId: community._id,
        })
      ),
    };

    TestBed.configureTestingModule({
      imports: [
        TemplatesComponent,
        NoopAnimationsModule,
        MockComponent(InfoToolbarComponent),
        MockComponent(DescriptionLineComponent),
        MockComponent(EditorComponent),
        MockComponent(AlertComponent),
      ],
      providers: [
        MockProvider(DefaultService, {
          getAllTemplates: jest
            .fn()
            .mockReturnValue(of([templateMock, ...templatesGroupsNoSortedMock])),
          getTemplateByName: jest.fn().mockReturnValue(of(templateMock)),
          copyOfTemplate: jest.fn().mockReturnValue(of(templateMock)),
          getCommunity: jest.fn().mockReturnValue(of(community)),
        }),
        MockProvider(AppSnackBarService, {
          info: jest.fn().mockReturnValue(of({})),
        }),
        MockProvider(DialogService, {
          openConfirm: jest.fn().mockReturnValue(of({})),
        }),
        { provide: ActivatedRoute, useValue: routeSnapshot },
      ],
    });
  });

  it('should create', () => {
    const fixture = MockRender(TemplatesComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  //Test added to test a branch that need to have and undefined param communityId
  it('should create with no community', () => {
    routeSnapshot.paramMap = of(
      convertToParamMap({
        communityId: undefined,
      })
    );
    const fixture = MockRender(TemplatesComponent);
    expect(fixture.point.componentInstance).toBeDefined();
    fixture.detectChanges();
    expect(fixture.point.componentInstance).toBeTruthy();
  });

  it('should order email templates list alphabetically', () => {
    const fixture = MockRender(TemplatesComponent);
    fixture.detectChanges();
    expect(fixture.point.componentInstance.templatesGroups[0].templates).toEqual(
      templatesGroupsSortedMock
    );
  });

  it('should save', () => {
    const fixture = MockRender(TemplatesComponent);
    const service = fixture.debugElement.injector.get(DefaultService);
    // @ts-expect-error
    jest.spyOn(service, 'updateTemplate').mockReturnValue(of([templateMock]));
    // @ts-expect-error
    fixture.point.componentInstance.selectTemplate({ value: 'confirm-email' });
    assertIsDefined(fixture.point.componentInstance.selectedTemplate, 'template defined');
    fixture.point.componentInstance.selectedTemplate.template = 'p';
    fixture.point.componentInstance.save();
  });

  it('should send email', () => {
    const fixture = MockRender(TemplatesComponent);
    const service = fixture.debugElement.injector.get(DefaultService);
    // @ts-expect-error
    jest.spyOn(service, 'tryEmail').mockReturnValue(of([templateMock]));
    // @ts-expect-error
    fixture.point.componentInstance.selectTemplate({ value: 'confirm-email' });
    assertIsDefined(fixture.point.componentInstance.selectedTemplate, 'template defined');
    fixture.point.componentInstance.selectedTemplate.template = 'p';
    fixture.point.componentInstance.sendEmail();
  });

  it('should accept selectedTemplate with changes', () => {
    const fixture = MockRender(TemplatesComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.templateForm.markAsDirty();
    // @ts-expect-error eslint-disable-next-line
    fixture.point.componentInstance.selectTemplate({ value: 'confirm-email' });
    expect(fixture.point.componentInstance.selectedTemplate).toEqual(templateMock);
  });

  it('should set selectedTemplate', () => {
    const fixture = MockRender(TemplatesComponent);
    // @ts-expect-error eslint-disable-next-line
    fixture.point.componentInstance.selectTemplate({ value: 'confirm-email' });
    expect(fixture.point.componentInstance.selectedTemplate).toEqual(templateMock);
  });

  it('should reset default email', () => {
    const fixture = MockRender(TemplatesComponent);
    // @ts-expect-error
    fixture.point.componentInstance.selectTemplate({ value: 'confirm-email' });
    assertIsDefined(fixture.point.componentInstance.selectedTemplate, 'template defined');
    fixture.point.componentInstance.selectedTemplate.template = 'p';
    fixture.point.componentInstance.createTemplate();
    fixture.point.componentInstance.resetEmail();
    fixture.point.componentInstance.selectedTemplate.template = 'example';
    fixture.point.componentInstance.createTemplate();
    expect(fixture.point.componentInstance.selectedTemplate.template).toEqual(
      templateMock.template
    );
  });

  it('should edit', () => {
    const fixture = MockRender(TemplatesComponent);
    // @ts-expect-error
    fixture.point.componentInstance.selectTemplate({ value: 'confirm-email' });
    assertIsDefined(fixture.point.componentInstance.selectedTemplate, 'template defined');
    fixture.point.componentInstance.selectedTemplate.template = 'p';
    fixture.point.componentInstance.createTemplate();
    expect(fixture.point.componentInstance.selectedTemplate.template).toEqual(
      templateMock.template
    );
  });

  it('should do on exit', () => {
    const fixture = MockRender(TemplatesComponent);
    const dialogService = TestBed.inject(DialogService);
    jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<ConfirmDialogComponent, boolean>);
    fixture.point.componentInstance.onExit();
  });

  it('should not do on exit', async () => {
    const fixture = MockRender(TemplatesComponent);
    fixture.point.componentInstance.templateForm.markAsDirty();
    await testOnExit(fixture);
  });

  it('should addButtom dynamicvariables', () => {
    const fixture = MockRender(TemplatesComponent);
    const tinyApi = {} as unknown as Ui.Toolbar.ToolbarButtonInstanceApi;
    const editor: Editor = {
      ui: {
        registry: {
          addButton: (name: string, spec: Ui.Toolbar.ToolbarButtonSpec) => {
            spec.onAction(tinyApi);
          },
        },
      },
      windowManager: {
        // eslint-disable-next-line @typescript-eslint/ban-types
        open: (dialogSpec: Ui.Dialog.DialogSpec<{}>) => {
          assertIsDefined(dialogSpec.onSubmit);
          // @ts-expect-error eslint-disable-next-line
          dialogSpec.onSubmit({ close: () => console.log('close dialog') });
        },
      },
    } as unknown as Editor;

    // @ts-expect-error eslint-disable-next-line
    fixture.point.componentInstance.editorOptions.setup(editor);
  });
});

async function testOnExit<
  T extends {
    onExit: () => Observable<boolean> | boolean;
  },
>(fixture: MockedComponentFixture<T>): Promise<void> {
  const dialogService = fixture.point.injector.get(DialogService);

  jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
    afterClosed: () => of(true),
  } as MatDialogRef<ConfirmDialogComponent, boolean>);
  const onExitTrue = fixture.point.componentInstance.onExit();
  assertIsObservable(onExitTrue);
  expect(await firstValueFrom(onExitTrue)).toBe(true);

  jest.spyOn(dialogService, 'openConfirm').mockReturnValue({
    afterClosed: () => of(false),
  } as MatDialogRef<ConfirmDialogComponent, boolean>);
  const onExitFalse = fixture.point.componentInstance.onExit();
  assertIsObservable(onExitFalse);
  expect(await firstValueFrom(onExitFalse)).toBe(false);
}
