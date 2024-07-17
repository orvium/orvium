import { CipherGCMTypes, createCipher, createDecipher, createHash } from 'crypto';
import { environment } from '../environments/environment';
import { NotFoundException } from '@nestjs/common';

const algorithm: CipherGCMTypes = 'aes-192-gcm';

export function encryptJson(value: unknown): string {
  const cipher = createCipher(algorithm, environment.crypto.key as string);
  let buffer = cipher.update(JSON.stringify(value), 'utf8', 'hex');
  buffer += cipher.final('hex');
  const token = buffer.toString();
  return token;
}

export function decryptJson<T>(token: string): T {
  const decipher = createDecipher(algorithm, environment.crypto.key as string);
  const tokenDecoded = decipher.update(token, 'hex', 'utf8');
  // tokenDecoded += decipher.final('utf8');
  return JSON.parse(tokenDecoded) as T;
}

/**
 * Returns the hash generated data provided
 *
 * @returns {string} the hash
 * @param data
 */
export function getMd5Hash(data: string): string {
  return createHash('md5').update(data).digest('hex');
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function hasProperty<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y
): obj is X & Record<Y, unknown> {
  return prop in obj;
}

type NonNullableLegacy<T> = T extends null | undefined ? never : T;

export function assertIsDefined<T>(
  value: T,
  message?: string
): asserts value is NonNullableLegacy<T> {
  if (!value) {
    throw new NotFoundException(message || 'Variable not defined');
  }
}

export function removeSpecialCharacters(string: string): string {
  return string.replace(/[^a-zA-Z0-9\._\-]+/g, '');
}

export function removeExcessSpaces(text?: string): string | undefined {
  if (text) {
    // Remove excess of spaces between words
    text = text.replace(/\x20{2,}/g, ' ');
    // Remove spaces before new line
    text = text.replace(/ [\n+$]/g, '\n');
    // Remove spaces at the beginning of the line
    text = text.replace(/^ +/gm, '');
    return text;
  } else {
    return undefined;
  }
}

export function generateObjectId(): string {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    'xxxxxxxxxxxxxxxx'
      .replace(/[x]/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      })
      .toLowerCase()
  );
}

export function sortObjectByKey<T>(unsorted: Record<string, T>): Record<string, T> {
  return Object.keys(unsorted)
    .sort()
    .reduce((accumulator: Record<string, T>, key) => {
      accumulator[key] = unsorted[key];
      return accumulator;
    }, {});
}

export function constructUTM(campaign: string): string {
  //Example: utm = '?utm_source=notification-emails&amp;utm_medium=email&amp;utm_campaign=[${this.emailTemplateName}]communityLink';
  const utm = `utm_source=orvium&utm_medium=email&utm_campaign=${campaign}`;
  return utm;
}

export function getMetaContent(html: string, name: string): string | null {
  const regex = new RegExp(`<meta name="${name}" content="([^"]*)"`);
  const match = html.match(regex);
  const content = match ? match[1] : null;
  return content;
}

export function addToArrayIf<T>(condition: boolean, ...elements: T[]): T[] {
  return condition ? elements : [];
}

export function pick(obj: unknown, ...props: string[]): unknown {
  return props.reduce(function (result, prop) {
    // @ts-ignore
    result[prop] = obj[prop];
    return result;
  }, {});
}

export const ReviewCLASSNAME = 'Review';
export const DepositCLASSNAME = 'Deposit';
export const ConversationCLASSNAME = 'Conversation';
export const UserCLASSNAME = 'User';
export const CommentaryCLASSNAME = 'Commentary';
export const CommunityCLASSNAME = 'Community';
export const InviteCLASSNAME = 'Invite';
export const SessionCLASSNAME = 'Session';
export const MessageCLASSNAME = 'Message';
export const DoiLogCLASSNAME = 'DoiLog';

export enum CROSSREF_ENDPOINT {
  test = 'https://test.crossref.org/servlet/deposit',
  production = 'https://doi.crossref.org/servlet/deposit',
}
