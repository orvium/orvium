import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import isURL from 'validator/lib/isURL';

/**
 * Validators info: https://angular.io/guide/form-validation#built-in-validator-functions
 */

/**
 * Validator regular expresion for a DOI
 */
export const DOI_REGEXP = /^[\d.]{4,11}\/[-._;()\/:a-zA-Z0-9]+$/;

/**
 * Validates that the provided email list contains valid email addresses.
 *
 * @param {AbstractControl} control - The control instance containing the value to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if any email is invalid, otherwise null.
 */
export function validateEmails(control: AbstractControl): ValidationErrors | null {
  // eslint-disable-next-line max-len
  const EMAIL_REGEXP =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
  if (!Array.isArray(control.value)) {
    return { email: true };
  }
  for (const item of control.value) {
    if (typeof item !== 'string' || !EMAIL_REGEXP.test(item)) {
      return { email: true };
    }
  }
  return null;
}

/**
 * Validates that the provided value is a valid price format.
 *
 * @param {AbstractControl} control - The control instance containing the price value to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the price is invalid, otherwise null.
 */
export function validatePrice(control: AbstractControl): ValidationErrors | null {
  const PRICE_REGEXP = /^[0-9]+(.[0-9]{1,2})?$/;

  if (control.value === null || control.value === '') {
    return null;
  }

  return PRICE_REGEXP.test(String(control.value)) ? null : { invalidPrice: true };
}

/**
 * Validates that the provided value is a valid email address.
 *
 * @param {AbstractControl} control - The control instance containing the email value to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the email is invalid, otherwise null.
 */
export function validateEmail(control: AbstractControl): ValidationErrors | null {
  // eslint-disable-next-line max-len
  const EMAIL_REGEXP =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  if (control.value === null || control.value === '') {
    return null;
  }
  return typeof control.value === 'string' && EMAIL_REGEXP.test(control.value)
    ? null
    : { invalidEmail: true };
}

/**
 * Validates that the start date is before the end date in a form group.
 *
 * @param {AbstractControl} control - The form group control that contains the dateStart and dateEnd fields.
 * @returns {ValidationErrors | null} An object representing validation errors if the dates are invalid, otherwise null.
 */
export function validateDurationDates(control: AbstractControl): ValidationErrors | null {
  const dateStart = control.get('dateStart');
  const dateEnd = control.get('dateEnd');
  if (
    !dateEnd ||
    !dateStart ||
    !(dateEnd.value instanceof Date) ||
    !(dateStart.value instanceof Date)
  ) {
    return { invalidDates: true };
  }
  return dateEnd.value.getTime() > dateStart.value.getTime() ? null : { invalidDates: true };
}

/**
 * Validates that the provided date is before the current date and time.
 *
 * @param {AbstractControl} control - The control instance containing the date value to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the date is in the future, otherwise null.
 */
export function validateDateBeforeNow(control: AbstractControl): ValidationErrors | null {
  const dateLimit = control.getRawValue();
  const dateNow = new Date();
  if (dateLimit === null) {
    return null;
  }
  return dateLimit > dateNow.getTime() ? null : { invalidDates: true };
}

/**
 * Validates that the provided value is a valid HTTPS URL.
 *
 * @param {AbstractControl} control - The control instance containing the URL value to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the URL is invalid, otherwise null.
 */

export function validateURL(control: AbstractControl): ValidationErrors | null {
  if (control.value === null || control.value === '') {
    return null;
  }
  const HTTP_REGEXP = /http:\/\/(\S+)/;

  if (typeof control.value === 'string' && HTTP_REGEXP.test(control.value)) {
    return { invalidHttp: true };
  }

  return isURL(String(control.value), {
    protocols: ['https'],
    require_valid_protocol: true,
    require_protocol: true,
  })
    ? null
    : { invalidURL: true };
}

/**
 * Validates that the provided LinkedIn URL is valid.
 *
 * @param {AbstractControl} control - The control instance containing the LinkedIn URL to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the LinkedIn URL is invalid, otherwise null.
 */
export function validateLinkedin(control: AbstractControl): ValidationErrors | null {
  const LINKEDIN_REGEXP = /^(https:\/\/)www\.linkedin\.com\/in\/\S+$/;

  if (control.value === null || control.value === '') {
    return null;
  }
  return typeof control.value === 'string' && LINKEDIN_REGEXP.test(control.value)
    ? null
    : { invalidLinkedIn: true };
}

/**
 * Validates that the provided ORCID identifier is valid.
 *
 * @param {AbstractControl} control - The control instance containing the ORCID identifier to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the ORCID is invalid, otherwise null.
 */
export function validateOrcid(control: AbstractControl): ValidationErrors | null {
  const ORCID_REGEXP = /^(https:\/\/)orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

  if (control.value === null || control.value === '') {
    return null;
  }

  return typeof control.value === 'string' && ORCID_REGEXP.test(control.value)
    ? null
    : { invalidORCID: true };
}

/**
 * Validates that the provided value is a valid DOI (Digital Object Identifier).
 *
 * @param {AbstractControl} control - The control instance containing the DOI value to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the DOI is invalid, otherwise null.
 */
export function validateDOI(control: AbstractControl): ValidationErrors | null {
  if (control.value === null || control.value === '') {
    return null;
  }

  return typeof control.value === 'string' && DOI_REGEXP.test(control.value)
    ? null
    : { invalidDOI: true };
}

/**
 * Validates that the provided value is a recognized language code.
 *
 * @param {AbstractControl} control - The control instance containing the language code to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the language code is unrecognized, otherwise null.
 */
export function validateLanguage(control: AbstractControl): ValidationErrors | null {
  const LANGUAGE_REGEXP =
    /^(aa|ab|ae|af|ak|am|an|ar|as|av|ay|az|ba|be|bg|bh|bi|bm|bn|bo|br|bs|ca|ce|ch|co|cr|cs|cu|cv|cy|da|de|dv|dz|ee|el|en|eo|es|et|eu|fa|ff|fi|fj|fo|fr|fy|ga|gd|gl|gn|gu|gv|ha|he|hi|ho|hr|ht|hu|hy|hz|ia|id|ie|ig|ii|ik|io|is|it|iu|ja|jv|ka|kg|ki|kj|kk|kl|km|kn|ko|kr|ks|ku|kv|kw|ky|la|lb|lg|li|ln|lo|lt|lu|lv|mg|mh|mi|mk|ml|mn|mr|ms|mt|my|na|nb|nd|ne|ng|nl|nn|no|nr|nv|ny|oc|oj|om|or|os|pa|pi|pl|ps|pt|qu|rm|rn|ro|ru|rw|sa|sc|sd|se|sg|si|sk|sl|sm|sn|so|sq|sr|ss|st|su|sv|sw|ta|te|tg|th|ti|tk|tl|tn|to|tr|ts|tt|tw|ty|ug|uk|ur|uz|ve|vi|vo|wa|wo|xh|yi|yo|za|zh|zu)$/i;

  if (control.value === null || control.value === '') {
    return null;
  }

  return typeof control.value === 'string' && LANGUAGE_REGEXP.test(control.value)
    ? null
    : { invalidLanguage: true };
}

/**
 * Validates that the provided Twitter URL is valid.
 *
 * @param {AbstractControl} control - The control instance containing the Twitter URL to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the Twitter URL is invalid, otherwise null.
 */
export function validateTwitter(control: AbstractControl): ValidationErrors | null {
  const TWITTER_REGEXP = /http(?:s)?:\/\/(?:www\.)?twitter\.com\/([a-zA-Z0-9_]+)/;

  if (control.value === null || control.value === '') {
    return null;
  }
  return typeof control.value === 'string' && TWITTER_REGEXP.test(control.value)
    ? null
    : { invalidTwitter: true };
}

/**
 * Validates that the provided Facebook URL is valid.
 *
 * @param {AbstractControl} control - The control instance containing the Facebook URL to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the Facebook URL is invalid, otherwise null.
 */
export function validateFacebook(control: AbstractControl): ValidationErrors | null {
  const FACEBOOK_REGEXP = /^(https?:\/\/)?(www\.)?facebook.com\/[a-zA-Z0-9(\.\?)?]/;

  if (control.value === null || control.value === '') {
    return null;
  }
  return typeof control.value === 'string' && FACEBOOK_REGEXP.test(control.value)
    ? null
    : { invalidFacebook: true };
}

/**
 * Validates that the provided GitHub URL is valid.
 *
 * @param {AbstractControl} control - The control instance containing the GitHub URL to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the GitHub URL is invalid, otherwise null.
 */
export function validateGithubURL(control: AbstractControl): ValidationErrors | null {
  const urlRegex = /https:\/\/github\.com\/.+$/i;

  if (control.value === null || control.value === '') {
    return null;
  }

  return typeof control.value === 'string' && urlRegex.test(control.value)
    ? null
    : { invalidUrl: true };
}

/**
 * Validates that the provided string is not blank.
 *
 * @param {AbstractControl} control - The control instance containing the string to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the string is blank, otherwise null.
 */
export function validateIsNotBlank(control: AbstractControl): ValidationErrors | null {
  const NOTBLANK_REGEXP = /.*\S.*/;

  if (control.value === null || control.value === '') {
    return null;
  }
  return typeof control.value === 'string' && NOTBLANK_REGEXP.test(control.value)
    ? null
    : { invalidString: true };
}

/**
 * Validates that the provided HTML content is not blank, ignoring image tags.
 *
 * @param {AbstractControl} control - The control instance containing the HTML content to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the HTML content is blank, otherwise null.
 */
export function validateHTMLIsNotBlank(control: AbstractControl): ValidationErrors | null {
  const div = document.createElement('div');
  div.innerHTML = control.value;
  if (div.innerHTML.includes('<img')) return null;
  if (!div.innerText) return { invalidString: true };
  return div.innerText.trim() === '' ? { invalidString: true } : null;
}

/**
 * Validates that the provided array is not empty.
 *
 * @param {AbstractControl} control - The control instance containing the array to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the array is empty, otherwise null.
 */
export function validateArrayIsNotEmpty(control: AbstractControl): ValidationErrors | null {
  return Array.isArray(control.value) && control.value.length !== 0 ? null : { invalidArray: true };
}

/**
 * Validates that the provided ISSN is valid.
 *
 * @param {AbstractControl} control - The control instance containing the ISSN to validate.
 * @returns {ValidationErrors | null} An object representing validation errors if the ISSN is invalid, otherwise null.
 */

export function validateISSN(control: AbstractControl): { invalidISSN: boolean } | null {
  const ISSN_REGEXP = /^[0-9]{4}-[0-9]{3}[X0-9]$/;

  if (control.value === null || control.value === '') {
    return null;
  }
  return typeof control.value === 'string' && ISSN_REGEXP.test(control.value)
    ? null
    : { invalidISSN: true };
}

/**
 * Validates that the provided value matches a specific word.
 *
 * @param {string} word - The word that the control value must match.
 * @returns {ValidatorFn} A validator function that checks if the control's value matches the given word.
 */
export function validateSameWord(word: string): ValidatorFn {
  return (control: AbstractControl) => {
    return control.value === word ? null : { invalidWord: true };
  };
}
