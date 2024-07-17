import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import {
  validateArrayIsNotEmpty,
  validateDateBeforeNow,
  validateDOI,
  validateDurationDates,
  validateEmail,
  validateEmails,
  validateFacebook,
  validateGithubURL,
  validateHTMLIsNotBlank,
  validateIsNotBlank,
  validateISSN,
  validateLanguage,
  validateLinkedin,
  validateOrcid,
  validatePrice,
  validateSameWord,
  validateTwitter,
  validateURL,
} from './AppCustomValidators';

describe('AppCustomValidators', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
    });
  });

  it('should validate emails', () => {
    expect(validateEmails(new FormControl('test@example.com'))).toEqual({
      email: true,
    });
  });

  it('should not validate email', () => {
    expect(validateEmail(new FormControl('testexample.com'))).toEqual({
      invalidEmail: true,
    });
  });

  it('should validate blog', () => {
    expect(validateURL(new FormControl('https://www.google.es/'))).toEqual(null);
  });

  it('should not validate blog', () => {
    expect(validateURL(new FormControl('testexample.com'))).toEqual({
      invalidURL: true,
    });
    expect(validateURL(new FormControl('http://www.google.es/'))).toEqual({
      invalidHttp: true,
    });
  });

  it('should validate language', () => {
    expect(validateLanguage(new FormControl('es'))).toEqual(null);
  });

  it('should not validate language', () => {
    expect(validateLanguage(new FormControl('a'))).toEqual({
      invalidLanguage: true,
    });
  });

  it('should validate orcid', () => {
    expect(validateOrcid(new FormControl('https://orcid.org/0000-0000-0000-0000'))).toEqual(null);
    expect(validateOrcid(new FormControl('orcid.org/0000-0000-0000-0000'))).toEqual({
      invalidORCID: true,
    });
    expect(validateOrcid(new FormControl('0000-0000-0000-0000'))).toEqual({
      invalidORCID: true,
    });
    expect(validateOrcid(new FormControl('http://orcid.org/0000-0000-0000-0000'))).toEqual({
      invalidORCID: true,
    });
  });

  it('should validate price', () => {
    expect(validatePrice(new FormControl(null))).toEqual(null);
    expect(validatePrice(new FormControl(''))).toEqual(null);

    expect(validatePrice(new FormControl('350'))).toEqual(null);
    expect(validatePrice(new FormControl('35,56'))).toEqual(null);
    expect(validatePrice(new FormControl('56.6'))).toEqual(null);
    expect(validatePrice(new FormControl('67,676'))).toEqual({
      invalidPrice: true,
    });
    expect(validatePrice(new FormControl('4.676'))).toEqual({
      invalidPrice: true,
    });
  });

  it('should validate twitter', () => {
    expect(validateTwitter(new FormControl('https://twitter.com/orvium'))).toEqual(null);
    expect(validateTwitter(new FormControl('https://twitter-invalid.com/orvium'))).toEqual({
      invalidTwitter: true,
    });
  });

  it('should validate facebook', () => {
    expect(validateFacebook(new FormControl('https://www.facebook.com/orvium.io/'))).toEqual(null);
    expect(
      validateFacebook(new FormControl('https://www.facebook-invalid.com/orvium.io/'))
    ).toEqual({ invalidFacebook: true });
  });

  it('should validate DOI', () => {
    expect(validateDOI(new FormControl(''))).toEqual(null);
    expect(validateDOI(new FormControl('10.24404/6160707e066476000850012f'))).toEqual(null);
    // // TODO fix this valid doi
    // expect(validateDOI(
    //   new FormControl('101109/5.771073'))).toEqual(null);
    expect(validateDOI(new FormControl('10.1109-invalid/5.771073'))).toEqual({
      invalidDOI: true,
    });
  });

  it('should validate github url', () => {
    expect(validateGithubURL(new FormControl('https://github.com/orvium'))).toEqual(null);
    expect(validateGithubURL(new FormControl('https://github-invalid.com/orvium'))).toEqual({
      invalidUrl: true,
    });
  });

  it('should validate linkedin url', () => {
    expect(validateLinkedin(new FormControl('https://www.linkedin.com/in/username/'))).toEqual(
      null
    );
    expect(validateLinkedin(new FormControl('www.linkedin.com/in/username/'))).toEqual({
      invalidLinkedIn: true,
    });
  });

  it('should validate is not blanc', () => {
    expect(validateIsNotBlank(new FormControl('some value'))).toEqual(null);
    expect(validateIsNotBlank(new FormControl('  '))).toEqual({
      invalidString: true,
    });
  });

  it('should validate html is not blanc', () => {
    expect(validateHTMLIsNotBlank(new FormControl('example'))).toEqual({
      invalidString: true,
    });
    expect(validateHTMLIsNotBlank(new FormControl(' '))).toEqual({
      invalidString: true,
    });
    expect(validateHTMLIsNotBlank(new FormControl('<img>'))).toEqual(null);
  });

  it('should validateArrayIsNotEmpty', () => {
    expect(validateArrayIsNotEmpty(new FormControl(['value1']))).toEqual(null);
    expect(validateArrayIsNotEmpty(new FormControl([]))).toEqual({
      invalidArray: true,
    });
  });

  it('should validateISSN', () => {
    expect(validateISSN(new FormControl('1234-1234'))).toEqual(null);
    expect(validateISSN(new FormControl('1234-12345'))).toEqual({
      invalidISSN: true,
    });
  });

  it('should validateDurationDates', () => {
    const date = new Date();

    // This is a cross field validator, if one control is missing or value type is not a Date, the validation should fail
    const incompleteDatesFormGroup = new FormGroup({
      dateStart: new FormControl(date),
    });
    expect(validateDurationDates(incompleteDatesFormGroup)).toEqual({
      invalidDates: true,
    });

    const invalidControlValueFormGroup = new FormGroup({
      dateStart: new FormControl(date),
      dateEnd: new FormControl('string value here'),
    });
    expect(validateDurationDates(invalidControlValueFormGroup)).toEqual({
      invalidDates: true,
    });

    // Equal dates should fail
    const datesForm = new FormGroup({
      dateStart: new FormControl(date),
      dateEnd: new FormControl(date),
    });
    expect(validateDurationDates(datesForm)).toEqual({ invalidDates: true });

    // Date end should be greater than date start
    datesForm.setValue({
      dateStart: date,
      dateEnd: new Date(date.getTime() + 1000),
    });

    expect(validateDurationDates(datesForm)).toEqual(null);
  });

  it('should validateDatesBeforeNow', () => {
    const date1 = new Date(2030, 3, 4, 3, 4, 3);
    const date2 = new Date(2021, 2, 3, 3, 4, 3);
    expect(validateDateBeforeNow(new FormControl(date1))).toEqual(null);
    expect(validateDateBeforeNow(new FormControl(date2))).toEqual({
      invalidDates: true,
    });
  });

  it('should validateSameWord', () => {
    const control = new FormControl('', {
      validators: [validateSameWord('confirm')],
    });
    control.setValue('not confirm');
    expect(control.invalid).toBe(true);
    control.setValue('confirm');
    expect(control.valid).toBe(true);
  });
});
