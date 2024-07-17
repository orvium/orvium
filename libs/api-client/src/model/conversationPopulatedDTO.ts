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
import { MessageDTO } from './messageDTO';
import { UserSummaryDTO } from './userSummaryDTO';


export interface ConversationPopulatedDTO { 
    /**
     * An array of the all information of the conversations participants
     */
    participantsPopulated: Array<UserSummaryDTO>;
    /**
     * Conversation ID
     */
    _id: string;
    /**
     * An array of the IDs of the conversations participants
     */
    participants: Array<string>;
    /**
     * Mark if the last conversation message is pending to read
     */
    messagesPending: boolean;
    /**
     * Last message date
     */
    lastMessageDate?: Date;
    /**
     * An array of the messages of the conversation
     */
    messages: Array<MessageDTO>;
    /**
     * An array of the conversation actions
     */
    actions?: Array<string>;
}
