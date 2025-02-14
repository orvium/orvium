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
import { TemplateCategory } from './templateCategory';


export interface TemplateDTO { 
    category: TemplateCategory;
    /**
     * Template ID
     */
    _id: string;
    /**
     * Email template name
     */
    name: string;
    /**
     * The content of the email template
     */
    template: string;
    /**
     * The content of the email template compilated
     */
    compiledTemplate?: string;
    /**
     * The community ID where the email template belong
     */
    community?: string;
    /**
     * Template actions
     */
    actions: Array<string>;
    /**
     * The description of the template
     */
    description?: string;
    /**
     * Email template title
     */
    title: string;
    /**
     * Check if the email is customizable by the community or a system email
     */
    isCustomizable: boolean;
}



