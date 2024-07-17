/**
 * Orvium API
 *  This is the OpenAPI 3.0 specification for the Orvium REST API.  Some useful links:  - [Orvium website](https://orvium.io) 
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { DoiStatus } from './doiStatus';
import { IThenticate } from './iThenticate';
import { Reference } from './reference';
import { PublicationType } from './publicationType';
import { FileMetadata } from './fileMetadata';
import { AcceptedFor } from './acceptedFor';
import { AuthorDTO } from './authorDTO';
import { DepositStatus } from './depositStatus';
import { HistoryLogLine } from './historyLogLine';
import { AccessRight } from './accessRight';
import { BibtexReferences } from './bibtexReferences';
import { ExtraMetadata } from './extraMetadata';
import { ReviewType } from './reviewType';


export interface DepositDTO { 
    publicationType: PublicationType;
    accessRight: AccessRight;
    status: DepositStatus;
    reviewType: ReviewType;
    acceptedFor: AcceptedFor;
    /**
     * List of blockchain transaction associated with this publication
     */
    transactions?: { [key: string]: any; };
    doiStatus?: DoiStatus;
    /**
     * Publication ID
     */
    _id: string;
    /**
     * Publication creator ID
     */
    creator: string;
    /**
     * Editor ID assigned to the publication
     */
    assignee?: string;
    nickname: string;
    /**
     * Publication title
     */
    title: string;
    /**
     * Publication abstract
     */
    abstract: string;
    /**
     * Submission date
     */
    submissionDate?: string;
    /**
     * Publication date
     */
    publicationDate?: string;
    /**
     * List of peer reviews ID associated with this publication
     */
    peerReviews: Array<string>;
    /**
     * List of authors of the publication
     */
    authors: Array<AuthorDTO>;
    publicationFile?: FileMetadata;
    /**
     * List of optional extra publication files metadata
     */
    files: Array<FileMetadata>;
    /**
     * Extra information required by journals and conferences
     */
    extraMetadata: ExtraMetadata;
    /**
     * Submitter gravatar
     */
    gravatar?: string;
    /**
     * The url of the image put in the profile avatar
     */
    avatar?: string;
    /**
     * List of keywords for the publication
     */
    keywords: Array<string>;
    /**
     * Keccak256 hash of the main publication file. Keccak256 is a cryptographic function built into solidity. Can be used for cryptographic signature with a small size.
     */
    keccak256?: string;
    /**
     * DOI of the publication
     */
    doi?: string;
    /**
     * The url of the publication in the platform
     */
    url?: string;
    /**
     * The url for the pdf of the publication. This pdf might have been automatically generated.
     */
    pdfUrl?: string;
    /**
     * List of disciplines associated to the publication
     */
    disciplines: Array<string>;
    /**
     * List of references of the publication
     */
    references: Array<Reference>;
    /**
     * List of bibtex references of the publication
     */
    bibtexReferences: Array<BibtexReferences>;
    /**
     * Date of the creation of the publication
     */
    createdOn?: Date;
    /**
     * Version number of the publication
     */
    version: number;
    /**
     * Community ID where the publication have been submitted
     */
    community: string;
    /**
     * Html extracted automatically for the main publication file
     */
    html?: string;
    /**
     * List of images extracted automatically for the main publication file
     */
    images: Array<string>;
    /**
     * This flag enables the creation of peer reviews for this publication
     */
    canBeReviewed: boolean;
    /**
     * Deposit option to give permission to author to invite reviewers
     */
    canAuthorInviteReviewers: boolean;
    /**
     * The url of the associated git repository
     */
    gitRepository?: string;
    /**
     * List of actions available
     */
    actions: Array<string>;
    /**
     * The ID of this publication in the openAire platform
     */
    openAireIdentifier?: string;
    /**
     * The number of views of the publication
     */
    views: number;
    /**
     * A flag that check if you\'re viewing in the last version of the publication
     */
    isLatestVersion: boolean;
    /**
     * The track timestamp of the publication
     */
    newTrackTimestamp?: number;
    /**
     * List of the actions made in the publication
     */
    history: Array<HistoryLogLine>;
    iThenticate?: IThenticate;
}



