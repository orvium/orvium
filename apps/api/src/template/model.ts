export interface IEmailUser {
  USER_FULLNAME: string;
  USER_EMAIL?: string;
  USER_LINKEDIN?: string;
  USER_LINK: string;
  USER_ORCID?: string;
  USER_INSTITUTIONS: string;
}

export interface IEmailPublication {
  PUBLICATION_LINK: string;
  PUBLICATION_TITLE: string;
  PUBLICATION_ABSTRACT: string;
  PUBLICATION_AUTHORS: string;
  PUBLICATION_KEYWORDS: string;
  PUBLICATION_TYPE: string;
  PUBLICATION_DOI?: string;
  PUBLICATION_PDF?: string;
  PUBLICATION_DISCIPLINES: string;
  PUBLICATION_VERSION: string;
  PUBLICATION_TRACK?: string;
  PUBLICATION_ACCEPTED_FOR: string;
}

export interface IEmailCommunity {
  COMMUNITY_LINK: string;
  COMMUNITY_MODERATE_LINK: string;
  COMMUNITY_LOGO: string;
  COMMUNITY_NAME: string;
  COMMUNITY_DESCRIPTION?: string;
  COMMUNITY_COUNTRY?: string;
  COMMUNITY_TWITTER?: string;
  COMMUNITY_FACEBOOK?: string;
  COMMUNITY_WEBSITE?: string;
  COMMUNITY_BANNER?: string;
  COMMUNITY_GUIDELINES?: string;
  COMMUNITY_ISSN?: string;
}

export interface IEmailReview {
  REVIEW_LINK: string;
  REVIEW_REVIEWER_NAME: string;
  REVIEW_DECISION: string;
  REVIEW_COMMENTS: string;
  REVIEW_KIND: string;
}

export interface IEmailEditorMessage {
  EDITOR_MESSAGE?: string;
}

export interface IEmailCommon {
  ORVIUM_LINK: string;
}

export interface IEmailInvitation {
  INVITATION_ADDRESSEE: string;
}

export type EmailVariables<T> = { [P in keyof T]: { name: string; description: string } };

export const emailInvitationVariables: EmailVariables<IEmailInvitation> = {
  INVITATION_ADDRESSEE: {
    name: 'Invitation email',
    description: 'Email to invite for a review',
  },
};

export const emailCommonVariables: EmailVariables<IEmailCommon> = {
  ORVIUM_LINK: {
    name: 'Orvium link',
    description: 'Link to Orvium platform',
  },
};

export const emailUserVariables: EmailVariables<IEmailUser> = {
  USER_FULLNAME: {
    name: 'Name',
    description: 'The name of the user who will receive the email',
  },
  USER_EMAIL: {
    name: 'Email',
    description: 'The email of the user who will receive the email',
  },
  USER_LINKEDIN: {
    name: 'LinkedIn',
    description: 'User LinkedIn',
  },
  USER_LINK: {
    name: 'Link',
    description: 'User link',
  },
  USER_ORCID: {
    name: 'ORCID',
    description: 'User ORCID',
  },
  USER_INSTITUTIONS: {
    name: 'Institutions',
    description: 'User institutions',
  },
};

export const emailReviewVariables: EmailVariables<IEmailReview> = {
  REVIEW_REVIEWER_NAME: {
    name: 'Reviewer name',
    description: 'The reviewer name',
  },
  REVIEW_COMMENTS: {
    name: 'Review comment',
    description: 'The comment made by the reviewer of the publication in the review',
  },
  REVIEW_DECISION: {
    name: 'Decision',
    description:
      'The reviewer decision on the review. Possible values are "Accepted", "Minor revision", "Major revision"',
  },
  REVIEW_LINK: {
    name: 'Link',
    description: 'Review link',
  },
  REVIEW_KIND: {
    name: 'Review kind',
    description: 'Displays if it is a "Peer Review" or "Copy Editing"',
  },
};

export const emailEditorMessageVariables: EmailVariables<IEmailEditorMessage> = {
  EDITOR_MESSAGE: {
    name: 'Message',
    description:
      'This message is sent by the editor to provide additional details about why is requesting changes',
  },
};

export const emailCommunityVariables: EmailVariables<IEmailCommunity> = {
  COMMUNITY_LOGO: {
    name: 'Logo',
    description: 'Community logo',
  },
  COMMUNITY_NAME: {
    name: 'Name',
    description: 'Community name',
  },
  COMMUNITY_LINK: {
    name: 'Link',
    description: 'Community link',
  },
  COMMUNITY_MODERATE_LINK: {
    name: 'Moderate link',
    description: 'Community moderate link',
  },
  COMMUNITY_DESCRIPTION: {
    name: 'Description',
    description: 'Community description',
  },
  COMMUNITY_COUNTRY: {
    name: 'Country',
    description: 'Community country',
  },
  COMMUNITY_TWITTER: {
    name: 'Twitter',
    description: 'Community twitter',
  },
  COMMUNITY_FACEBOOK: {
    name: 'Facebook',
    description: 'Community facebook',
  },
  COMMUNITY_WEBSITE: {
    name: 'Website',
    description: 'Community website',
  },
  COMMUNITY_BANNER: {
    name: 'Banner',
    description: 'Community banner',
  },
  COMMUNITY_GUIDELINES: {
    name: 'Guidelines',
    description: 'Community guideline',
  },
  COMMUNITY_ISSN: {
    name: 'ISSN',
    description: 'Community issn',
  },
};

export const emailPublicationVariables: EmailVariables<IEmailPublication> = {
  PUBLICATION_TITLE: {
    name: 'Title',
    description: 'Publication title',
  },
  PUBLICATION_ABSTRACT: {
    name: 'Abstract',
    description: 'Publication abstract',
  },
  PUBLICATION_KEYWORDS: {
    name: 'Keywords',
    description: 'Publication keywords',
  },
  PUBLICATION_AUTHORS: {
    name: 'Authors',
    description: 'List of publication authors separated by comma',
  },
  PUBLICATION_DOI: {
    name: 'DOI',
    description: 'Publication DOI',
  },
  PUBLICATION_DISCIPLINES: {
    name: 'Disciplines',
    description: 'List of publication disciplines separated by comma',
  },
  PUBLICATION_PDF: {
    name: 'PDF',
    description: 'Publication PDF',
  },
  PUBLICATION_TRACK: {
    name: 'Track',
    description: 'Publication track. Available only for conferences.',
  },
  PUBLICATION_TYPE: {
    name: 'Type',
    description: 'Publication type',
  },
  PUBLICATION_VERSION: {
    name: 'Version',
    description: 'Publication version',
  },
  PUBLICATION_LINK: {
    name: 'Link',
    description: 'Publication link',
  },
  PUBLICATION_ACCEPTED_FOR: {
    name: 'Accepted For',
    description:
      'Displays if the publication is accepted for poster or presentation (available only for conference abstracts)',
  },
};
