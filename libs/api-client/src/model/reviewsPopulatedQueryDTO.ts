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
import { ReviewPopulatedDTO } from './reviewPopulatedDTO';


export interface ReviewsPopulatedQueryDTO { 
    /**
     * the reviews query
     */
    reviews: Array<ReviewPopulatedDTO>;
    /**
     * the reviews query count
     */
    count: number;
    /**
     * the reviews query actions
     */
    actions?: Array<string>;
}

