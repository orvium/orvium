import Mail from 'nodemailer/lib/mailer';
import { AppNotification } from '../notification/notification.schema';
import { EventDTO, EventType } from './event.schema';
import { AcceptedFor, HistoryLogLine } from '../deposit/deposit.schema';
import { constructUTM } from '../utils/utils';
import { Community } from '../communities/communities.schema';
import { CommunityDocumentPopulated } from '../communities/communities.service';
import { environment } from '../environments/environment';
import { User } from '../users/user.schema';
import { ReviewPopulated } from '../review/review.service';
import { Invite } from '../invite/invite.schema';
import { AnyKeys, Require_id } from 'mongoose';
import { ReviewPopulatedDTO } from '../dtos/review/review-populated.dto';
import { DepositPopulatedDTO } from '../dtos/deposit/deposit-populated.dto';
import {
  IEmailCommon,
  IEmailCommunity,
  IEmailInvitation,
  IEmailPublication,
  IEmailReview,
  IEmailUser,
} from '../template/model';

export abstract class AppEvent {
  abstract internalType: 'system' | 'community';
  abstract type: EventType;
  abstract data: unknown;
  abstract emailTemplateName: string | undefined;

  abstract getEmailTemplate(templateSource: string, strict?: boolean): Mail.Options | undefined;

  abstract getAppNotificationTemplate(userId?: string): AnyKeys<AppNotification> | undefined;

  abstract getPushNotificationTemplate(): unknown;

  abstract getHistoryTemplate(): HistoryLogLine | undefined;

  getEventDTO(): EventDTO {
    return {
      eventType: this.type,
      data: this.data,
    };
  }
}

export abstract class AppSystemEvent extends AppEvent {
  abstract internalType: 'system';
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type AppCommunityEventData = {} & {
  community: Require_id<Community> | Require_id<CommunityDocumentPopulated>;
};

export abstract class AppCommunityEvent extends AppEvent {
  abstract internalType: 'community';
  abstract data: AppCommunityEventData;
}

export function convertToEmailPublication(
  deposit: DepositPopulatedDTO,
  emailTemplateName: string
): IEmailPublication {
  const depositLink = `${environment.publicUrl}/deposits/${deposit._id}/view/?${constructUTM(
    emailTemplateName
  )}`;

  return {
    PUBLICATION_LINK: depositLink,
    PUBLICATION_TITLE: deposit.title,
    PUBLICATION_ABSTRACT: deposit.abstract,
    PUBLICATION_AUTHORS: deposit.authors
      .map(author => `${author.firstName} ${author.lastName}`)
      .join(', '),
    PUBLICATION_KEYWORDS: deposit.keywords.join(', '),
    PUBLICATION_TYPE: deposit.publicationType,
    PUBLICATION_DOI: deposit.doi,
    PUBLICATION_PDF: deposit.pdfUrl,
    PUBLICATION_DISCIPLINES: deposit.disciplines.join(', '),
    PUBLICATION_VERSION: deposit.version.toString(),
    PUBLICATION_TRACK: deposit.track?.title,
    PUBLICATION_ACCEPTED_FOR: deposit.acceptedFor !== AcceptedFor.None ? deposit.acceptedFor : '',
  };
}

export function convertToEmailCommunity(
  community: Require_id<Community>,
  emailTemplateName: string
): IEmailCommunity {
  const communityLink = `${
    environment.publicUrl
  }/communities/${community._id.toHexString()}/view/?${constructUTM(emailTemplateName)}`;
  const moderatorPanelLink = `${
    environment.publicUrl
  }/communities/${community._id.toHexString()}/moderate?${constructUTM(emailTemplateName)}`;

  return {
    COMMUNITY_LINK: communityLink,
    COMMUNITY_MODERATE_LINK: moderatorPanelLink,
    COMMUNITY_LOGO: community.logoURL ?? '',
    COMMUNITY_NAME: community.name,
    COMMUNITY_DESCRIPTION: community.description,
    COMMUNITY_COUNTRY: community.country,
    COMMUNITY_TWITTER: community.twitterURL,
    COMMUNITY_FACEBOOK: community.facebookURL,
    COMMUNITY_WEBSITE: community.websiteURL,
    COMMUNITY_BANNER: community.bannerURL,
    COMMUNITY_GUIDELINES: community.guidelinesURL,
    COMMUNITY_ISSN: community.issn,
  };
}

export function convertToEmailUser(user: Require_id<User>): IEmailUser {
  const userLink = `${environment.publicUrl}/profile/${user.nickname}`;

  return {
    USER_FULLNAME: `${user.firstName} ${user.lastName}`,
    USER_EMAIL: user.email,
    USER_LINK: userLink,
    USER_LINKEDIN: user.linkedin,
    USER_ORCID: user.orcid,
    USER_INSTITUTIONS: user.institutions.join(', '),
  };
}

export function convertToEmailInvitation(invitation: Require_id<Invite>): IEmailInvitation {
  return {
    INVITATION_ADDRESSEE: invitation.addressee,
  };
}

export function convertToEmailReview(
  review: ReviewPopulatedDTO | Require_id<ReviewPopulated>,
  emailTemplateName: string
): IEmailReview {
  const reviewId = typeof review._id === 'string' ? review._id : review._id.toHexString();
  const reviewLink = `${environment.publicUrl}/reviews/${reviewId}/view/?${constructUTM(
    emailTemplateName
  )}`;

  return {
    REVIEW_LINK: reviewLink,
    REVIEW_REVIEWER_NAME: `${review.ownerProfile.firstName} ${review.ownerProfile.lastName}`,
    REVIEW_DECISION: review.decision,
    REVIEW_COMMENTS: review.comments ?? '',
    REVIEW_KIND: review.kind,
  };
}

export function getCommonEmailVariables(emailTemplateName: string): IEmailCommon {
  const orviumLink = `${environment.publicUrl}/?${constructUTM(emailTemplateName)}`;

  return {
    ORVIUM_LINK: orviumLink,
  };
}
