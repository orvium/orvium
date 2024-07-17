import { Injectable } from '@angular/core';

/**
 * Provides a service for managing data in the browser's local storage.
 * This service encapsulates common local storage operations such as reading, writing, removing, and clearing items.
 */
@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  /**
   * Reads the value of a given key from local storage.
   *
   * @param {string} key - The key under which the data is stored.
   * @returns {string | null} The data as a string, or null if the key doesn't exist.
   */
  read(key: string): string | null {
    return localStorage.getItem(key);
  }

  /**
   * Writes a value to local storage under the specified key.
   * If the key already exists, the value is updated.
   *
   * @param {string} key - The key under which to store the data.
   * @param {string} value - The data to be stored as a string.
   */
  write(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  /**
   * Removes the specified key and its corresponding data from local storage.
   *
   * @param {string} key - The key of the data to be removed.
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
