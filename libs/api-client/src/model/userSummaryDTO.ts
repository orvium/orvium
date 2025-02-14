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


export interface UserSummaryDTO { 
    /**
     * User ID ObjectID
     */
    _id: string;
    /**
     * User ID
     */
    userId: string;
    /**
     * User fist name
     */
    firstName: string;
    /**
     * User last name
     */
    lastName: string;
    /**
     * User nickname
     */
    nickname: string;
    /**
     * User gravatar md5 hash
     */
    gravatar: string;
    /**
     * Institutions of the user
     */
    institutions: Array<string>;
    /**
     * The url of the image put in the profile banner
     */
    bannerURL?: string;
    /**
     * The url of the image put in the profile avatar
     */
    avatar?: string;
}

