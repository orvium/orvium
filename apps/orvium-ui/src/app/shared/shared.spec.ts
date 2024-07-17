import { canOpenOverleaf } from './shared-functions';
import { FormControl } from '@angular/forms';
import {
  validateEmail,
  validateEmails,
  validateLinkedin,
  validateOrcid,
} from './AppCustomValidators';

describe('shared-function', () => {
  const pdfFile = canOpenOverleaf('test.pdf');
  const emails = validateEmails(new FormControl(['test1@example.com', 'test2@example.com']));
  const invalidEmails = validateEmails(new FormControl(['test1@example.com', 'test2example.com']));
  const email = validateEmail(new FormControl('test@example.com'));
  const invalidEmail = validateEmail(new FormControl('testexample.com'));
  const linkedin = validateLinkedin(
    new FormControl('https://www.linkedin.com/in/john-example')
  );
  const invalidLinkedin = validateLinkedin(
    new FormControl('https://www.linkedin.com/john-example')
  );
  const orcid = validateOrcid(new FormControl('https://orcid.org/0000-0000-0000-0000'));
  const invalidOrcid = validateOrcid(new FormControl('https://orcid.org/00-0000'));

  it('is not latex file', () => {
    expect(pdfFile).toBe(null);
  });

  it('should validate emails', () => {
    expect(emails).toBe(null);
  });

  it('should not validate emails', () => {
    expect(invalidEmails).toEqual({ email: true });
  });

  it('should validate email', () => {
    expect(email).toBe(null);
  });

  it('should not validate email', () => {
    expect(invalidEmail).toEqual({ invalidEmail: true });
  });

  it('should validate linkedin', () => {
    expect(linkedin).toBe(null);
  });

  it('should not validate linkedin', () => {
    expect(invalidLinkedin).toEqual({ invalidLinkedIn: true });
  });

  it('should validate OrcidID', () => {
    expect(orcid).toEqual(null);
  });

  it('should not validate OrcidId', () => {
    expect(invalidOrcid).toEqual({ invalidORCID: true });
  });
});
