import {
  assertIsDefined,
  decryptJson,
  encryptJson,
  getMd5Hash,
  getMetaContent,
  pick,
  removeExcessSpaces,
  removeSpecialCharacters,
  sortObjectByKey,
} from './utils';
import { NotFoundException } from '@nestjs/common';

describe('Utils', () => {
  it('should be encrypt and decrypt json', () => {
    const json = { test: 'any value' };
    const encrypted = encryptJson(json);
    const decrypted = decryptJson(encrypted);
    expect(decrypted).toStrictEqual(json);
  });

  it('should generate md5Hash', () => {
    //Hash for 'test' string
    const hash = '098f6bcd4621d373cade4e832627b4f6';
    const generatedHash = getMd5Hash('test');
    expect(generatedHash).toStrictEqual(hash);
  });
  it('should use AssertIsDefined', () => {
    const json = null;
    expect(() => assertIsDefined(json, 'json not found')).toThrow(NotFoundException);
    expect(() => assertIsDefined(json)).toThrow(NotFoundException);
  });

  it('should remove special characters', () => {
    const specialCharacters = '*&filename-%,;without-special_chara cters<>.docx';
    const cleanedString = removeSpecialCharacters(specialCharacters);
    expect(cleanedString).toBe('filename-without-special_characters.docx');
  });

  it('should remove excess of spaces in line', () => {
    const line = 'This   is     a            line with too many         spaces';
    const fixedLine = removeExcessSpaces(line);
    expect(fixedLine).toBe('This is a line with too many spaces');
  });

  it('should remove excess of spaces in paragraph', () => {
    const paragraph =
      'This   is     a    ' + '\n' + '        paragraph with too many' + '\n' + '         spaces';
    const fixedLine = removeExcessSpaces(paragraph);
    expect(fixedLine).toBe('This is a' + '\n' + 'paragraph with too many' + '\n' + 'spaces');
  });

  it('should not remove excess of spaces from undefined', () => {
    const paragraph = undefined;
    const fixedLine = removeExcessSpaces(paragraph);
    expect(fixedLine).toBeUndefined();
  });

  it('should sort object by key', () => {
    const unsorted = { c: 3, b: 2, a: 1 };
    expect(JSON.stringify(sortObjectByKey(unsorted))).toBe(JSON.stringify({ a: 1, b: 2, c: 3 }));
  });

  it('should getMetaContent', () => {
    const html = '<meta name="myname" content="mycontent">';
    expect(getMetaContent(html, 'myname')).toBe('mycontent');
    expect(getMetaContent(html, 'somethingelse')).toBe(null);
  });

  it('should pick properties from object', () => {
    expect(pick({ a: 'value1', b: 'value2' }, 'a')).toStrictEqual({ a: 'value1' });
  });
});
