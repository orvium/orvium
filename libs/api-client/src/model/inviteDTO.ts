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
import { InviteStatus } from './inviteStatus';
import { InviteType } from './inviteType';
import { InvitationDataDTO } from './invitationDataDTO';


export interface InviteDTO { 
    inviteType: InviteType;
    status: InviteStatus;
    /**
     * Invite ID
     */
    _id: string;
    sender: string;
    /**
     * Invitation addressee
     */
    addressee: string;
    /**
     * Invitation create on
     */
    createdOn: Date;
    data: InvitationDataDTO;
    /**
     * Invitation actions
     */
    actions: Array<string>;
    /**
     * Limit date of the invitation
     */
    dateLimit?: Date;
    /**
     * The invitation message send to the reviewer
     */
    message?: string;
}



