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


export interface StripeCheckoutDTO { 
    /**
     * The URL to the Checkout Session. Redirect customers to this URL to take them to Checkout.
     */
    url: string;
    /**
     * List of actions available
     */
    actions: Array<string>;
}

