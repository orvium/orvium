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


export interface CreateInstitutionDTO { 
    /**
     * Institution domain
     */
    domain: string;
    /**
     * Institution name
     */
    name: string;
    /**
     * Institution country
     */
    country?: string;
    /**
     * Institution city
     */
    city?: string;
    /**
     * Another way of calling the institution
     */
    synonym?: string;
}

