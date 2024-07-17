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
import { SpeakerDTO } from './speakerDTO';


export interface SessionUpdateDTO { 
    /**
     * Session title
     */
    title?: string;
    /**
     * The description of the session
     */
    description?: string;
    /**
     * The track timestamp of the session
     */
    newTrackTimestamp?: number;
    /**
     * Speakers of the current session
     */
    speakers?: Array<SpeakerDTO>;
    /**
     * Session start date
     */
    dateStart?: Date;
    /**
     * Session end date
     */
    dateEnd?: Date;
    /**
     * Publications ID related to the session
     */
    deposits?: Array<string>;
}
