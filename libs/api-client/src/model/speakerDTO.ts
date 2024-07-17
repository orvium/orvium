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


export interface SpeakerDTO { 
    /**
     * User ID of the speaker
     */
    userId?: string;
    /**
     * Speaker first name
     */
    firstName: string;
    /**
     * Speaker last name
     */
    lastName: string;
    /**
     * Speaker nickname generated in the platform
     */
    nickname?: string;
    /**
     * Speaker orcid
     */
    orcid?: string;
    /**
     * Tags related to the speaker
     */
    tags: Array<string>;
    /**
     * Generated gravatar for the speaker with md5hash
     */
    gravatar?: string;
    /**
     * The url of the image put in the profile avatar
     */
    avatar?: string;
    /**
     * An array with the institutions of the speaker
     */
    institutions: Array<string>;
}
