import { Test, TestingModule } from '@nestjs/testing';
import { UserDocument } from '../users/user.schema';
import {
  createAdmin,
  createCommunity,
  createUser,
  factoryDepositDocumentDefinition,
  factoryInvite,
  factoryReview,
  factoryTemplate,
} from '../utils/test-data';
import { defaultSanitizeOptions, TemplateController } from './template.controller';
import { TemplateCategory, TemplateDocument } from './template.schema';
import { TemplateService } from './template.service';
import { request } from 'express';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { cleanCollections, MongooseTestingModule } from '../utils/mongoose-testing.module';
import { assertIsDefined } from '../utils/utils';
import { DepositService } from '../deposit/deposit.service';
import { ReviewService } from '../review/review.service';
import { InviteService } from '../invite/invite.service';
import { EmailService } from '../email/email.service';
import { CommunityDocument, SubscriptionType } from '../communities/communities.schema';
import { TemplateCreateDTO } from '../dtos/template/template-create.dto';
import sanitizeHtml from 'sanitize-html';
import {
  emailCommonVariables,
  emailCommunityVariables,
  emailEditorMessageVariables,
  emailInvitationVariables,
  emailPublicationVariables,
  emailReviewVariables,
  emailUserVariables,
} from './model';

describe('TemplateController', () => {
  let controller: TemplateController;
  let templateService: TemplateService;
  let admin: UserDocument;
  let templateDocument1: TemplateDocument;
  let module: TestingModule;
  let community: CommunityDocument;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [MongooseTestingModule.forRoot('TemplateController')],
      controllers: [TemplateController],
      providers: [],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  beforeEach(async () => {
    controller = module.get(TemplateController);
    templateService = module.get(TemplateService);
    const depositService = module.get(DepositService);
    const reviewService = module.get(ReviewService);
    const inviteService = module.get(InviteService);
    await cleanCollections(module);

    admin = await createAdmin(module);

    templateDocument1 = await templateService.templateModel.create(factoryTemplate.build());
    const { community: communityTemp } = await createCommunity(module, {
      community: { subscription: SubscriptionType.premium, codename: 'orvium' },
    });
    community = communityTemp;
    await depositService.create(factoryDepositDocumentDefinition.build());
    await reviewService.create(factoryReview.build());
    await inviteService.create(factoryInvite.build());
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should update a template', async () => {
    const newTemplate = '<p>New template</p>';
    templateDocument1.community = community._id;
    const updatedTemplate = await controller.updateTemplate(
      { user: { sub: admin.userId } } as unknown as typeof request,
      { template: newTemplate },
      templateDocument1._id.toHexString(),
      community._id.toHexString()
    );
    expect(updatedTemplate.template).toEqual('<p>New template</p>');
  });

  it('should upload a template with image and sanitaze then but not remove then', () => {
    const newTemplate =
      '<p><img src="https://orvium.io/img/img1.5d78062bb7395730b4dca5e8548d3d37.jpg"  alt=""/></p>';
    templateDocument1.community = community._id;
    const updatedTemplate = sanitizeHtml(newTemplate, defaultSanitizeOptions);
    expect(updatedTemplate).toEqual(
      '<p><img src="https://orvium.io/img/img1.5d78062bb7395730b4dca5e8548d3d37.jpg" alt="" /></p>'
    );
    expect(sanitizeHtml(newTemplate)).toEqual('<p></p>');
  });

  it('should fail at update a template', async () => {
    const newTemplate = '<p>New template failed {{reason}}</p>';
    templateDocument1.community = community._id;
    await expect(
      controller.updateTemplate(
        { user: { sub: admin.userId } } as unknown as typeof request,
        { template: newTemplate },
        templateDocument1._id.toHexString(),
        ''
      )
    ).rejects.toThrow('The variable(s) "reason" is not defined');
  });

  it('should fail when user not admin', async () => {
    const notAdminUser = await createUser(module);
    await expect(
      controller.getAllTemplates(
        { user: { sub: notAdminUser.userId } } as unknown as typeof request,
        ''
      )
    ).rejects.toThrow(UnauthorizedException);

    const templateCreate: TemplateCreateDTO = {
      name: 'New template',
      template: 'New session',
      community: community._id.toHexString(),
      isCustomizable: false,
      description: 'description',
      title: 'New template title',
      category: TemplateCategory.system,
    };

    await expect(
      controller.createTemplate(
        { user: { sub: notAdminUser.userId } } as unknown as typeof request,
        templateCreate
      )
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      controller.getTemplateByName(
        { user: { sub: notAdminUser.userId } } as unknown as typeof request,
        'confirm-email',
        ''
      )
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      controller.updateTemplate(
        { user: { sub: notAdminUser.userId } } as unknown as typeof request,
        { template: '<p>test</p>' },
        templateDocument1._id.toHexString()
      )
    ).rejects.toThrow(UnauthorizedException);

    await expect(
      controller.tryEmail(
        { user: { sub: notAdminUser.userId } } as unknown as typeof request,
        templateDocument1._id.toHexString(),
        ''
      )
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should tryEmail', async () => {
    const emailService = module.get(EmailService);
    const spy = jest.spyOn(emailService, 'sendMail').mockImplementation();

    await controller.tryEmail(
      { user: { sub: admin.userId } } as unknown as typeof request,
      templateDocument1._id.toHexString()
    );

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should get email template models', () => {
    // This is not testing anything in the controller, just verifying we can access email variables properly
    expect(emailPublicationVariables).toBeDefined();
    expect(emailCommonVariables).toBeDefined();
    expect(emailInvitationVariables).toBeDefined();
    expect(emailReviewVariables).toBeDefined();
    expect(emailUserVariables).toBeDefined();
    expect(emailCommunityVariables).toBeDefined();
    expect(emailEditorMessageVariables).toBeDefined();
  });

  it('should create template', async () => {
    assertIsDefined(community, 'community is not defined');
    const templateCreate: TemplateCreateDTO = {
      name: 'New template',
      template: 'New session',
      community: community._id.toHexString(),
      isCustomizable: false,
      description: 'description',
      title: 'New template title',
      category: TemplateCategory.system,
    };

    const template = await controller.createTemplate(
      { user: { sub: admin.userId } } as unknown as typeof request,
      templateCreate
    );
    expect(template.name).toStrictEqual(templateCreate.name);
  });

  describe('getAllTemplates', () => {
    it('should get list', async () => {
      const spyTemplateService = jest.spyOn(templateService, 'create');
      assertIsDefined(community._id, 'community not defined');
      await controller.createTemplate(
        { user: { sub: admin.userId } } as unknown as typeof request,
        {
          name: templateDocument1.name,
          template: templateDocument1.template,
          title: templateDocument1.title,
          description: templateDocument1.description,
          community: community._id.toHexString(),
          isCustomizable: true,
          category: TemplateCategory.system,
        }
      );
      await controller.getAllTemplates(
        { user: { sub: admin.userId } } as unknown as typeof request,
        community._id.toHexString()
      );
      expect(spyTemplateService).toHaveBeenCalled();
    });

    it('should raise exception when can not find user or not admin', async () => {
      await expect(
        controller.getAllTemplates({ user: { sub: 'xxx' } } as unknown as typeof request)
      ).rejects.toThrow(NotFoundException);
    });

    it('should get all templates', async () => {
      await templateService.templateModel.create(factoryTemplate.build({ community: undefined }));

      const templates = await controller.getAllTemplates({
        user: { sub: admin.userId },
      } as unknown as typeof request);
      expect(templates.length).toBe(1);
    });

    it('should get update template with communityId', async () => {
      const spyTemplateService = jest.spyOn(templateService, 'findOne');
      await controller.updateTemplate(
        { user: { sub: admin.userId } } as unknown as typeof request,
        { template: templateDocument1.template },
        templateDocument1._id.toHexString(),
        community._id.toHexString()
      );
      expect(spyTemplateService).toHaveBeenCalled();
    });

    it('should tryEmail template with communityId', async () => {
      const emailService = module.get(EmailService);
      const spy = jest.spyOn(emailService, 'sendMail').mockImplementation();

      await controller.tryEmail(
        { user: { sub: admin.userId } } as unknown as typeof request,
        templateDocument1._id.toHexString(),
        community._id.toHexString()
      );

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should do copyOf template', async () => {
      assertIsDefined(community, 'community is not defined');

      const template = await controller.copyOfTemplate(
        { user: { sub: admin.userId } } as unknown as typeof request,
        { template: 'new Template', communityId: community._id.toHexString() },
        templateDocument1._id.toHexString()
      );
      expect(template.name).toStrictEqual(templateDocument1.name);
    });

    it('should getTemplateByName with communityId', async () => {
      const templateCreate: TemplateCreateDTO = {
        name: 'confirm-email',
        template: 'New session',
        community: community._id.toHexString(),
        isCustomizable: true,
        description: 'description',
        title: 'New template title',
        category: TemplateCategory.system,
      };

      await controller.createTemplate(
        { user: { sub: admin.userId } } as unknown as typeof request,
        templateCreate
      );

      const template = await controller.getTemplateByName(
        { user: { sub: admin.userId } } as unknown as typeof request,
        'confirm-email',
        community._id.toHexString()
      );

      expect(template).toBeDefined();
    });

    it('should call templateService find', async () => {
      const spyTemplateService = jest.spyOn(templateService, 'find');
      await controller.getAllTemplates({
        user: { sub: admin.userId },
      } as unknown as typeof request);
      expect(spyTemplateService).toHaveBeenCalled();
    });

    it('should raise exception when try find template by a user that not exist', async () => {
      await expect(
        controller.getAllTemplates({ user: { sub: 'xxx' } } as unknown as typeof request)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTemplateByName', () => {
    it('should raise exception when can not find user', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: 'xxx' } } as unknown as typeof request,
          'confirm-email'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should get template by name', async () => {
      const template = await controller.getTemplateByName(
        { user: { sub: admin.userId } } as unknown as typeof request,
        'confirm-email'
      );
      expect(template).toBeDefined();
    });

    it('should get template by name "confirm-email"', async () => {
      const originalTemplate = factoryTemplate.build();
      const template = await controller.getTemplateByName(
        { user: { sub: admin.userId } } as unknown as typeof request,
        'confirm-email'
      );
      assertIsDefined(template);
      expect(template.compiledTemplate).toBe(originalTemplate.template);
    });

    it('should throw error on get "pending-approval-community"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'pending-approval-community',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "chat-message"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'chat-message',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get community-submitted', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'community-submitted',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get community-accepted', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'community-accepted',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "deposit-accepted"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'deposit-accepted',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "pending-approval-deposit"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'pending-approval-deposit',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get deposit-submitted', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'deposit-submitted',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get ithenticate-report-ready', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'ithenticate-report-ready',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "moderator-draft-deposit"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'moderator-draft-deposit',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "moderator-reject-deposit"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'moderator-reject-deposit',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "deposit-submittet"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'deposit-submittet',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "editor-assigned"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'editor-assigned',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "invite"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'invite',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "moderator-assigned"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'moderator-assigned',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "reminder-draft"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'reminder-draft',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "review-accepted"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'review-accepted',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "review-to-draft"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'review-to-draft',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "pending-approval-review"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'pending-approval-review',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "review-created"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'review-created',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "review-invitation-accepted"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'review-invitation-accepted',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "review-invitation-rejected"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'review-invitation-rejected',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "review-invitation-accepted-confirmation"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'review-invitation-accepted-confirmation',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "review-invitation"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'review-invitation',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "review-submitted"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'review-submitted',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "wrong-provider"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'wrong-provider',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error on get "moderator-general-notification"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'moderator-general-notification',
          ''
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should raise exception when can not get "unread-message"', async () => {
      await expect(
        controller.getTemplateByName(
          { user: { sub: admin.userId } } as unknown as typeof request,
          'unread-message'
        )
      ).rejects.toThrow(NotFoundException);
    });
  });
});
