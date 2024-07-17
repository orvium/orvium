import { AbstractSecurityStorage } from 'angular-auth-oidc-client';
import { Injectable } from '@angular/core';

/**
 * Provides an implementation of the AbstractSecurityStorage interface for use with OIDC client libraries.
 * This class handles the storage, retrieval, removal, and clearing of data in the browser's local storage.
 */
@Injectable()
export class LocalStorage implements AbstractSecurityStorage {
  /**
   * Retrieves a value from local storage by its key.
   *
   * @param {string} key - The key under which the data is stored in local storage.
   * @returns {string | null} The value associated with the key, or null if the key does not exist.
   */
  read(key: string): string | null {
    return localStorage.getItem(key);
  }

  /**
   * Writes a value to local storage under the specified key.
   *
   * @param {string} key - The key under which the data should be stored.
   * @param {string} value - The data to store under the specified key.
   */
  write(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  /**
   * Removes a specific entry from local storage by its key.
   *
   * @param {string} key - The key corresponding to the data to remove from local storage.
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clears all entries from local storage.
   */
  clear(): void {
    localStorage.clear();
  }
}
