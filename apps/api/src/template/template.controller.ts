import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { TemplateService } from './template.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { assertIsDefined } from '../utils/utils';
import { UserService } from '../users/user.service';
import { ConfirmationEmailEvent } from '../event/events/confirmationEmailEvent';
import { AppEvent } from '../event/event';
import { DepositAcceptedEvent } from '../event/events/depositAcceptedEvent';
import { DepositChangedToPendingApprovalEvent } from '../event/events/depositChangedToPendingApprovalEvent';
import { DepositDraftedByModeratorEvent } from '../event/events/depositDraftedByModerator';
import { DepositRejectedByModeratorEvent } from '../event/events/depositRejectedByModerator';
import { EditorAssignedEvent } from '../event/events/editorAssignedEvent';
import { InvitationEvent } from '../event/events/invitationCreatedEvent';
import { ModeratorAddedToCommunityEvent } from '../event/events/moderatorAddedToCommunityEvent';
import { ReminderDraftDepositEvent } from '../event/events/reminderDraftDeposit';
import { ReviewPublishedConfirmationToReviewerEvent } from '../event/events/reviewPublishedConfirmationToReviewerEvent';
import { ReviewChangedToPendingApprovalEvent } from '../event/events/reviewChangedToPendingApprovalEvent';
import { ReviewPublishedConfirmationToAuthorEvent } from '../event/events/reviewPublishedConfirmationToAuthorEvent';
import { ReviewInvitationAcceptedEvent } from '../event/events/reviewInvitationAcceptedEvent';
import { ReviewInvitationEmailEvent } from '../event/events/reviewInvitationEmailEvent';
import { ReviewSubmittedConfirmationEvent } from '../event/events/reviewSubmittedConfirmationEvent';
import { DepositService, PopulatedDepositDocument } from '../deposit/deposit.service';
import { IThenticateReportReadyEvent } from '../event/events/iThenticateReportReady';
import { ReviewDocumentPopulated, ReviewService } from '../review/review.service';
import { CommunitiesService, CommunityDocumentPopulated } from '../communities/communities.service';
import { TransformerService } from '../transformer/transformer.service';
import { TemplateDTO } from '../dtos/template/template.dto';
import { InviteService } from '../invite/invite.service';
import { ReviewChangedToDraftEvent } from '../event/events/reviewChangedToDraftEvent';
import handlebars from 'handlebars';
import { EmailService } from '../email/email.service';
import { UserDocument } from '../users/user.schema';
import { CommunityChangedToPendingApprovalEvent } from '../event/events/communityChangedToPendingApprovalEvent';
import { CommunitySubmittedEvent } from '../event/events/communitySubmittedEvent';
import { AuthorizationService, COMMUNITY_ACTIONS } from '../authorization/authorization.service';
import { CommunityAcceptedEvent } from '../event/events/communtyAcceptedEvent';
import { Template, TemplateDocument } from './template.schema';
import { TemplateCreateDTO } from '../dtos/template/template-create.dto';
import { TemplateCreateCustomizedDto } from '../dtos/template/template-create-customized.dto';
import { TemplateUpdateDto } from '../dtos/template/template-update.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import sanitizeHtml from 'sanitize-html';
import {
  factoryConversation,
  factoryDepositDocumentDefinition,
  factoryInvite,
  factoryReview,
  factoryUser,
} from '../utils/test-data';
import { AnyKeys, Types } from 'mongoose';
import { ChatMessageReceivedEvent } from '../event/events/chatMessageRecievedEvent';
import { ReviewInvitationRejectedEvent } from '../event/events/reviewInvitationRejectedEvent';
import { ReviewInvitationAcceptedConfirmationEvent } from '../event/events/reviewInvitationAcceptedConfirmationEvent';
import { DepositSubmittedEvent } from '../event/events/depositSubmittedEvent';
import { ConversationsService } from '../conversations/conversations.service';
import { AcceptedFor } from '../deposit/deposit.schema';
import { GeneralNotificationEvent } from '../event/events/GeneralNotificationEvent';
import { SubscriptionType } from '../communities/communities.schema';
import { unreadMessagesReceiveEvent } from '../event/events/unreadMessagesReceivedEvent';

/**
 * Default options for sanitizing HTML content to ensure it is safe from cross-site scripting (XSS) attacks.
 * These options extend the default settings provided by the sanitize-html library by allowing additional tags
 * and attributes that are commonly used but still considered safe within the defined constraints.
 */
export const defaultSanitizeOptions = {
  /**
   * An array of allowed HTML tags that extends the default list with iframe and img tags.
   */
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['iframe', 'img']),

  /**
   * An object specifying attributes allowed for certain tags like a, img and iframe
   */
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading', 'style', 'class'],
    iframe: ['src'],
    '*': ['style'],
  },

  /**
   *  A list of hostnames from which iframes can load content, restricting to trusted sources.
   */
  allowedIframeHostnames: ['www.youtube.com'],
};

/**
 * The ReviewController is responsible managing the templates used for notifications, emails etc, within the application
 *
 * @tags templates
 * @controller templates
 */
@ApiTags('templates')
@Controller('templates')
export class TemplateController {
  /**
   * Instantiates a TemplateController object.
   * @param {TemplateService} templateService - Service for managing the templates used for notifications, emails etc
   * @param {UserService} userService - Service for user data management.
   * @param {TransformerService} transformerService - Service for data transformation tasks.
   * @param {CommunitiesService} communitiesService - Service for community data management.
   * @param {DepositService} depositService - Service for deposits data management.
   * @param {ReviewService} reviewService - Service for manage review.
   * @param {InviteService} inviteService - Service for invitations data management.
   * @param {emailService} emailService - Service for emails management.
   * @param {AuthorizationService} authorizationService - Service for handling authorization tasks.
   * @param {ConversationService} conversationService - Service for sessions data management.
   */
  constructor(
    private readonly templateService: TemplateService,
    private readonly userService: UserService,
    private readonly transformerService: TransformerService,
    private readonly communityService: CommunitiesService,
    private readonly depositService: DepositService,
    private readonly reviewService: ReviewService,
    private readonly inviteService: InviteService,
    private readonly emailService: EmailService,
    private readonly authorizationService: AuthorizationService,
    private readonly conversationService: ConversationsService
  ) {}

  /**
   * GET - Retrieves a list of all available email templates. This method supports optional filtering by community ID.
   * If no community ID is provided, it lists default templates, assuming the user has admin rights. If a community ID is provided,
   * it checks if the user has the right permissions for that community, and only premium communities can customize email templates.
   *
   * @param {Request} req - The HTTP request object.
   * @param {string} [communityId] - Optional community ID to filter templates that are customizable for a specific community.
   * @returns {Promise<TemplateDTO[]>} A promise that resolves to an array of template data transfer objects.
   * @throws {UnauthorizedException} If the user is not an admin or does not have permission to access community-specific templates.
   */
  @ApiOperation({ summary: 'List templates' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'communityId', required: false })
  @UseGuards(AuthGuard(['jwt']))
  @Get('')
  async getAllTemplates(
    @Req() req: Request,
    @Query('communityId') communityId?: string
  ): Promise<TemplateDTO[]> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    let templates = await this.templateService.find({ community: undefined });
    if (!communityId) {
      if (!user.roles.includes('admin')) {
        throw new UnauthorizedException();
      }
    } else {
      const ability = await this.authorizationService.defineAbilityFor(user);
      const community = await this.communityService.findById(communityId);
      assertIsDefined(community, 'Community not found');
      if (community.subscription !== SubscriptionType.premium)
        throw new UnauthorizedException('Only premium communities can customize emails');
      this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);
      templates = await this.templateService.find({ isCustomizable: true, community: undefined });
    }

    return this.transformerService.toDTO(templates, TemplateDTO);
  }

  /**
   * POST - Creates a new email template in the system. Only users with admin roles can create templates.
   * The new template can be associated with a specific community if provided and marked as customizable.
   *
   * @param {Request} req - The HTTP request object containing the user context.
   * @param {TemplateCreateDTO} newTemplate - The data transfer object containing the details of the new template.
   * @returns {Promise<TemplateDTO>} A promise that resolves to the newly created template data transfer object.
   * @throws {UnauthorizedException} If the user attempting the operation does not have admin privileges.
   */
  @ApiOperation({ summary: 'Create a template' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(['jwt']))
  @Post('')
  async createTemplate(
    @Req() req: Request,
    @Body() newTemplate: TemplateCreateDTO
  ): Promise<TemplateDTO> {
    const user = await this.userService.getLoggedUser(req);

    if (!user?.roles.includes('admin')) {
      throw new UnauthorizedException();
    }

    // Replace encoded variable values
    newTemplate.template = newTemplate.template.replace(/%7D%7D/g, '}}');
    newTemplate.template = newTemplate.template.replace(/%7B%7B/g, '{{');

    const query: AnyKeys<Template> = {
      title: newTemplate.title,
      description: newTemplate.description,
      name: newTemplate.name,
      template: sanitizeHtml(newTemplate.template, defaultSanitizeOptions),
      isCustomizable: newTemplate.isCustomizable,
      community: newTemplate.community,
      category: newTemplate.category,
    };
    const template = await this.templateService.create(query);
    return this.transformerService.toDTO(template, TemplateDTO);
  }

  /**
   * POST - Creates a copy of an existing template, allowing communities to customize default templates for their specific needs.
   * This feature is available only to premium communities, which can customize email templates.
   *
   * @param {Request} req - The HTTP request object.
   * @param {TemplateCreateCustomizedDto} payload - The data transfer object containing the details of the template to be customized.
   * @param {string} id - The ID of the template to be copied.
   * @throws {UnauthorizedException} If the community is not premium or if the user does not have the appropriate permissions.
   * @returns {Promise<TemplateDTO>} A promise that resolves to the newly created template data transfer object.
   */
  @ApiOperation({ summary: 'Create a template copy' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard(['jwt']))
  @Post(':id([0-9a-f]{24})/makeCopy')
  async copyOfTemplate(
    @Req() req: Request,
    @Body() payload: TemplateCreateCustomizedDto,
    @Param('id') id: string
  ): Promise<TemplateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const ability = await this.authorizationService.defineAbilityFor(user);
    const community = await this.communityService.findById(payload.communityId);
    assertIsDefined(community, 'Community not found');
    if (community.subscription !== SubscriptionType.premium)
      throw new UnauthorizedException('Only premium communities can customize emails');
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    const newTemplate = await this.templateService.findOne({ _id: id });
    assertIsDefined(newTemplate, 'template is not defined');
    const query: AnyKeys<Template> = {
      title: newTemplate.title,
      description: newTemplate.description,
      name: newTemplate.name,
      template: payload.template,
      isCustomizable: newTemplate.isCustomizable,
      community: community._id,
      category: newTemplate.category,
    };
    const template = await this.templateService.create(query);
    return this.transformerService.toDTO(template, TemplateDTO);
  }

  async checkCommunity(
    user: UserDocument,
    communityId?: string
  ): Promise<CommunityDocumentPopulated> {
    let community: CommunityDocumentPopulated;
    if (!communityId) {
      if (!user.roles.includes('admin')) {
        throw new UnauthorizedException();
      }
      const communityFiltered = await this.communityService.findOneByFilter({ codename: 'orvium' });
      assertIsDefined(communityFiltered, 'Community not found');
      community = communityFiltered;
    } else {
      const ability = await this.authorizationService.defineAbilityFor(user);
      assertIsDefined(communityId, 'community not found');
      const communityFiltered = await this.communityService.findById(communityId);
      assertIsDefined(communityFiltered, 'Community not found');
      community = communityFiltered;
      this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);
    }
    return community;
  }

  /**
   * PATCH - Sends a test email using the selected template to the current user's email address. This allows users, particularly
   * community administrators, to preview how an email template will look when sent. This method can help ensure that
   * email content appears as expected before sending it out to a broader audience.
   *
   * @param {Request} req - The HTTP request object containing the current user's session and authentication information.
   * @param {string} id - The ID of the email template to be used for sending the test email.
   * @param {string} [communityId] - Optional; the ID of the community associated with the email template.
   * @throws {UnauthorizedException} - Throws if the user has no permissions or if the template or community cannot be accessed.
   * @returns {Promise<void>} - A promise resolving to nothing upon successful sending of the email.
   */
  @ApiOperation({ summary: 'Send test email' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'communityId', required: false })
  @UseGuards(AuthGuard(['jwt']))
  @Patch(':id([0-9a-f]{24})/sendEmail')
  async tryEmail(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('communityId') communityId?: string
  ): Promise<void> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');
    const community = await this.checkCommunity(user, communityId);

    const template = await this.templateService.findOne({ _id: id });
    const ability = await this.authorizationService.defineAbilityFor(user);
    assertIsDefined(template, 'template is not defined');
    const event = this.getFakeEvent(template.name, user, community);
    const emailTemplate = event.getEmailTemplate(template.template);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    await this.emailService.sendMail({
      ...emailTemplate,
      to: user.email,
    });
  }

  /**
   * PATCH - Updates an existing email template. This method allows for the modification of template details such as content
   * and configuration. It is typically used by community administrators to ensure that email communications reflect current
   * needs and branding guidelines.
   *
   * @param {Request} req - The HTTP request object, providing context such as the user's session and authentication status.
   * @param {TemplateUpdateDto} payload - The data transfer object containing the new values for the template properties.
   * @param {string} id - The identifier of the template to be updated.
   * @param {string} [communityId] - Optional; the identifier of the community associated with the template.
   * @throws {UnauthorizedException} - If the user has no permissions to update, or if the community does not allow customization.
   * @throws {NotFoundException} - If the template or the community specified by `id` or `communityId` does not exist.
   * @throws {BadRequestException} - If the updated template content does not pass validation checks, such as undefined variables.
   * @returns {Promise<TemplateDTO>} - A promise resolving to the updated template data transfer object.
   */
  @ApiOperation({ summary: 'Update a template' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'communityId', required: false })
  @UseGuards(AuthGuard(['jwt']))
  @Patch(':id([0-9a-f]{24})')
  async updateTemplate(
    @Req() req: Request,
    @Body() payload: TemplateUpdateDto,
    @Param('id') id: string,
    @Query('communityId') communityId?: string
  ): Promise<TemplateDTO> {
    const user = await this.userService.getLoggedUser(req);
    const ability = await this.authorizationService.defineAbilityFor(user);
    assertIsDefined(user, 'User not found');
    const template = await this.templateService.findOne({ _id: id });
    assertIsDefined(template, 'template is not defined');
    const community = await this.checkCommunity(user, communityId);
    this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);

    // Replace encoded variable values
    payload.template = payload.template.replace(/%7D%7D/g, '}}');
    payload.template = payload.template.replace(/%7B%7B/g, '{{');

    template.template = sanitizeHtml(payload.template, defaultSanitizeOptions);

    try {
      const event = this.getFakeEvent(template.name, user, community);
      event.getEmailTemplate(template.template, true);
    } catch (e) {
      if (e instanceof Error) {
        Logger.debug(e.message);
        //Example: "decision" not defined in [object Object] -11:6 -> return ["decision",decision]
        const failingVariableName = /"([^"]*)"|'([^']*)'/.exec(e.message);
        assertIsDefined(failingVariableName, `Template compilation error: ${e.message}`);
        const errorMessage = `The variable(s) ${failingVariableName[0]} is not defined`;
        throw new BadRequestException(errorMessage);
      } else {
        throw new BadRequestException('Template compilation error');
      }
    }

    handlebars.compile(template.template);
    const newTemplate = await template.save();

    return this.transformerService.toDTO(newTemplate, TemplateDTO);
  }

  /**
   * GET - Retrieves an email template by its name and optionally by community ID. This method allows users
   * to access both default and community-specific templates. Admins can access all templates, while community
   * managers can only access templates within their communities.
   *
   * @param {Request} req - The HTTP request object, providing context such as the user's session and authentication status.
   * @param {string} name - The name of the template to retrieve. This corresponds to a unique identifier for the template within the system.
   * @param {string} [communityId] - Optional; the identifier of the community for which the template is requested.
   * @throws {UnauthorizedException} - If the user lacks the necessary permissions to access the requested template.
   * @throws {NotFoundException} - If the specified template or community does not exist.
   * @returns {Promise<TemplateDTO>} - A promise that resolves to the template data transfer object, which includes the template details.
   */
  @ApiOperation({ summary: 'Retrieve template' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'communityId', required: false })
  @UseGuards(AuthGuard(['jwt']))
  @Get(':name')
  async getTemplateByName(
    @Req() req: Request,
    @Param('name') name: string,
    @Query('communityId') communityId?: string
  ): Promise<TemplateDTO> {
    const user = await this.userService.getLoggedUser(req);
    assertIsDefined(user, 'User not found');

    const community = await this.checkCommunity(user, communityId);

    const event = this.getFakeEvent(name, user, community);
    let templateSource: TemplateDocument | null;

    if (!communityId) {
      // Check admin templates
      if (!user.roles.includes('admin')) {
        throw new UnauthorizedException();
      }
      templateSource = await this.templateService.findOne({ name: event.emailTemplateName });
    } else {
      // Check custom community templates
      templateSource = await this.templateService.findOne({
        name: event.emailTemplateName,
        community: communityId,
        isCustomizable: true,
      });
      if (!templateSource) {
        templateSource = await this.templateService.findOne({
          name: event.emailTemplateName,
          isCustomizable: true,
        });
      }
      const ability = await this.authorizationService.defineAbilityFor(user);
      assertIsDefined(communityId, 'Community id not defined');
      const community = await this.communityService.findById(communityId);
      assertIsDefined(community, 'Community not found');
      this.authorizationService.canDo(ability, COMMUNITY_ACTIONS.update, community);
    }
    assertIsDefined(templateSource, 'Email template defined but not found in database');
    const compiledTemplate = event.getEmailTemplate(templateSource.template);

    return this.transformerService.toDTO(
      // @ts-expect-error
      {
        ...templateSource.toJSON(),
        compiledTemplate: compiledTemplate?.html,
      },
      TemplateDTO
    );
  }

  /**
   * HELPER - Creates a fake event object based on a specified event name. This method is used to simulate
   * various events within the system to facilitate the testing of email templates and other event-driven functionalities.
   * It generates a contextual event with appropriate dummy data that mimics real-world scenarios for the specified
   * event type.
   *
   * @param {string} name - The name of the event type to simulate. This corresponds to predefined keys that map to specific event constructors.
   * @param {UserDocument} user - The user document associated with the event, representing the logged-in user or a user involved in the event.
   * @param {CommunityDocumentPopulated} community - The community document where the event is taking place.
   * @returns {AppEvent} - The generated event object populated with fake data, ready to be used for template rendering or other testing purposes.
   * @throws {AssertionError} - If the event name provided does not correspond to any known event type or if any object is not defined.
   */
  getFakeEvent(name: string, user: UserDocument, community: CommunityDocumentPopulated): AppEvent {
    let event: AppEvent | undefined;

    //FakeUser
    const fakeUser = new this.userService.userModel(factoryUser.build());
    fakeUser._id = new Types.ObjectId();

    //FakeDeposit
    const deposit = new this.depositService.depositModel(factoryDepositDocumentDefinition.build());
    deposit._id = new Types.ObjectId();
    const depositPopulated = deposit as unknown as PopulatedDepositDocument;
    depositPopulated.ownerProfile = user;
    depositPopulated.authors = [{ ...fakeUser, credit: [] }];
    depositPopulated.acceptedFor = AcceptedFor.Presentation;
    assertIsDefined(deposit);

    //FakeReview
    //const review = await this.reviewService.findOne({});
    const review = new this.reviewService.reviewModel(factoryReview.build());
    review._id = new Types.ObjectId();
    const reviewPopulated = review as unknown as ReviewDocumentPopulated;
    reviewPopulated.depositPopulated = deposit;
    reviewPopulated.ownerProfile = user;
    assertIsDefined(review);

    //FakeInvitation
    //const invitation = await this.inviteService.findOne({});
    const invitation = new this.inviteService.inviteModel(factoryInvite.build());
    invitation._id = new Types.ObjectId();
    const invitationPopulated = invitation;
    assertIsDefined(invitation);

    //FakeConversation
    const conversation = new this.conversationService.conversationModel(
      factoryConversation.build()
    );
    conversation._id = new Types.ObjectId();
    assertIsDefined(conversation);

    //fakeReasons
    const fakeReasonDepositToDraft =
      'We would like to invite you to revise the paper and resubmit it for further review. Thank you.';
    const fakeReasonDepositToReject =
      'Following careful consideration by a group of expert reviewers, I regret to inform you that we are unable to accept your submission. Thank you.';
    const fakeReasonReviewToDraft =
      'We would like to invite you to revise the review and resubmit it for further review. Thank you.';

    switch (name) {
      //[community]
      case 'community-accepted':
        event = new CommunityAcceptedEvent({ user: user.toJSON(), community: community.toJSON() });
        break;
      case 'community-submitted':
        event = new CommunitySubmittedEvent({ user: user.toJSON(), community: community.toJSON() });
        break;
      case 'deposit-accepted':
        event = new DepositAcceptedEvent({
          user: user.toJSON(),
          community: community.toJSON(),
          deposit: depositPopulated.toJSON(),
        });
        break;
      case 'deposit-submitted':
        event = new DepositSubmittedEvent({
          user: user.toJSON(),
          community: community.toJSON(),
          deposit: depositPopulated.toJSON(),
        });
        break;
      case 'moderator-draft-deposit': //TODO
        event = new DepositDraftedByModeratorEvent({
          user: user.toJSON(),
          community: community.toJSON(),
          deposit: depositPopulated.toJSON(),
          reason: fakeReasonDepositToDraft,
        });
        break;
      case 'moderator-reject-deposit': //TODO
        event = new DepositRejectedByModeratorEvent({
          user: user.toJSON(),
          community: community.toJSON(),
          deposit: depositPopulated.toJSON(),
          reason: fakeReasonDepositToReject,
        });
        break;
      case 'pending-approval-deposit':
        event = new DepositChangedToPendingApprovalEvent({
          deposit: depositPopulated.toJSON(),
          community: community.toJSON(),
        });
        break;
      case 'editor-assigned':
        event = new EditorAssignedEvent({
          user: user.toJSON(),
          community: community.toJSON(),
          deposit: depositPopulated.toJSON(),
        });
        break;
      case 'moderator-assigned':
        event = new ModeratorAddedToCommunityEvent({
          user: user.toJSON(),
          community: community.toJSON(),
        });
        break;
      case 'review-accepted':
        event = new ReviewPublishedConfirmationToReviewerEvent({
          deposit: depositPopulated.toJSON(),
          user: user.toJSON(),
          review: reviewPopulated.toJSON(),
          community: community.toJSON(),
        });
        break;
      case 'review-to-draft':
        event = new ReviewChangedToDraftEvent({
          user: user.toJSON(),
          community: community.toJSON(),
          review: reviewPopulated.toJSON(),
          deposit: depositPopulated.toJSON(),
          reason: fakeReasonReviewToDraft,
        });
        break;
      case 'pending-approval-review':
        event = new ReviewChangedToPendingApprovalEvent({
          deposit: depositPopulated.toJSON(),
          review: reviewPopulated.toJSON(),
          community: community.toJSON(),
        });
        break;
      case 'review-created':
        event = new ReviewPublishedConfirmationToAuthorEvent({
          deposit: depositPopulated.toJSON(),
          review: reviewPopulated.toJSON(),
          community: community.toJSON(),
        });
        break;
      case 'review-invitation-accepted':
        event = new ReviewInvitationAcceptedEvent({
          sender: user.toJSON(),
          reviewer: user.toJSON(),
          deposit: depositPopulated.toJSON(),
          community: community.toJSON(),
          invitation: invitationPopulated.toJSON(),
        });
        break;
      case 'review-invitation-rejected':
        event = new ReviewInvitationRejectedEvent({
          sender: user.toJSON(),
          reviewer: user.toJSON(),
          deposit: depositPopulated.toJSON(),
          community: community.toJSON(),
          invitation: invitationPopulated.toJSON(),
        });
        break;
      case 'review-invitation-accepted-confirmation':
        event = new ReviewInvitationAcceptedConfirmationEvent({
          sender: user.toJSON(),
          reviewer: user.toJSON(),
          deposit: depositPopulated.toJSON(),
          community: community.toJSON(),
          invitation: invitation.toJSON(),
        });
        break;
      case 'review-invitation':
        event = new ReviewInvitationEmailEvent({
          sender: user.toJSON(),
          deposit: depositPopulated.toJSON(),
          destinationEmail: 'email@example.com',
          invite: invitationPopulated.toJSON(),
          community: community.toJSON(),
          destinationName: 'Marie Curie',
        });
        break;
      case 'review-submitted':
        event = new ReviewSubmittedConfirmationEvent({
          deposit: depositPopulated.toJSON(),
          review: reviewPopulated.toJSON(),
          user: user.toJSON(),
          community: community.toJSON(),
        });
        break;
      case 'confirm-email':
        event = new ConfirmationEmailEvent({ code: '123456', email: 'example@example.com' });
        break;
      case 'invite':
        event = new InvitationEvent({ sender: user.toJSON(), emails: ['email@example.com'] });
        break;
      case 'ithenticate-report-ready':
        event = new IThenticateReportReadyEvent({
          deposit: depositPopulated.toJSON(),
          submitter: user.toJSON(),
        });
        break;
      case 'pending-approval-community':
        event = new CommunityChangedToPendingApprovalEvent({
          user: user.toJSON(),
          community: community.toJSON(),
        });
        break;
      case 'chat-message':
        event = new ChatMessageReceivedEvent({
          user: user.toJSON(),
          recipientUser: user.toJSON(),
          conversation: conversation.toJSON(),
        });
        break;
      case 'moderator-general-notification':
        event = new GeneralNotificationEvent({
          community: community.toJSON(),
          sender: user.toJSON(),
          subject: 'Example subject',
          message: 'Example email body',
          recipients: ['example@example.com'],
        });
        break;
      case 'unread-message':
        event = new unreadMessagesReceiveEvent({
          recipientUser: user.toJSON(),
          user: user.toJSON(),
          conversation: conversation.toJSON(),
        });
        break;
      //Old templates:
      case 'reminder-draft':
        event = new ReminderDraftDepositEvent({
          user: user.toJSON(),
          deposit: depositPopulated.toJSON(),
        });
        break;
    }

    assertIsDefined(event, 'template is not associated with any event');

    return event;
  }
}
