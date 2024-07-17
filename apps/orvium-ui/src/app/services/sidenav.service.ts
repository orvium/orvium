import { Injectable, TemplateRef } from '@angular/core';
import { MatDrawerToggleResult, MatSidenav } from '@angular/material/sidenav';
import { BehaviorSubject, delay, of } from 'rxjs';
import { assertIsDefined } from '../shared/shared-functions';
import { take } from 'rxjs/operators';

/**
 * Service for managing side navigation panels within an application. It allows for controlling the state and behavior
 * of both a primary (left) and a secondary (right) sidenav.
 */
@Injectable({ providedIn: 'root' })
export class SidenavService {
  /** BehaviorSubject to handle the state of the sidenav expansion. It emits true when the sidenav is expanded. */
  public sidenavExpandedChange: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);

  /** Optional reference to a TemplateRef for dynamic content in the right sidenav. */
  public rightSideComponent?: TemplateRef<unknown>;

  /** Optional reference to a TemplateRef for additional navigational elements. */
  public extraNavigation?: TemplateRef<unknown>;

  /** Private reference to the primary (left) MatSidenav. */
  private sidenav?: MatSidenav;

  /** Private reference to the secondary (right) MatSidenav. */
  private rightSidenav?: MatSidenav;

  /**
   * Sets the main sidenav instance.
   *
   * @param {MatSidenav} sidenav - The MatSidenav instance to control.
   */
  public setSidenav(sidenav: MatSidenav): void {
    this.sidenav = sidenav;
  }
  /**
   * Sets or clears the TemplateRef for extra navigation elements.
   *
   * @param {TemplateRef<unknown> | undefined} extraNav - The TemplateRef for additional navigation or undefined to clear.
   */
  public setExtraSidenav(extraNav: TemplateRef<unknown> | undefined): void {
    of({})
      .pipe(take(1), delay(0))
      .subscribe(() => {
        this.extraNavigation = extraNav;
      });
  }

  /**
   * Sets the secondary (right) sidenav instance.
   *
   * @param {MatSidenav} rightSidenav - The MatSidenav instance to control.
   */
  public setRightSidenav(rightSidenav: MatSidenav): void {
    this.rightSidenav = rightSidenav;
  }

  /**
   * Returns the main sidenav instance, asserting its existence.
   *
   * @returns {MatSidenav} The MatSidenav instance.
   */
  public getSidenav(): MatSidenav {
    assertIsDefined(this.sidenav, 'Left sidenav not available');
    return this.sidenav;
  }

  /**
   * Opens the main (left) sidenav panel. Asserts that the sidenav instance is defined before attempting to open it.
   *
   * @returns {Promise<MatDrawerToggleResult>} A promise that resolves with the result of the toggle operation.
   */
  public async open(): Promise<MatDrawerToggleResult> {
    assertIsDefined(this.sidenav, 'Left sidenav not available');
    return this.sidenav.open();
  }

  /**
   * Closes the main (left) sidenav panel. Asserts that the sidenav instance is defined before attempting to close it.
   *
   * @returns {Promise<MatDrawerToggleResult>} A promise that resolves with the result of the toggle operation.
   */
  async close(): Promise<MatDrawerToggleResult> {
    assertIsDefined(this.sidenav, 'Left sidenav not available');
    return await this.sidenav.close();
  }

  /**
   * Opens the secondary (right) sidenav panel. Asserts that the sidenav instance is defined before attempting to open it.
   *
   * @returns {Promise<MatDrawerToggleResult>} A promise that resolves with the result of the toggle operation.
   */
  async openRight(): Promise<MatDrawerToggleResult> {
    assertIsDefined(this.rightSidenav, 'Right sidenav not available');
    return await this.rightSidenav.open();
  }

  /**
   * Closes the secondary (right) sidenav panel. Asserts that the sidenav instance is defined before attempting to close it.
   *
   * @returns {Promise<MatDrawerToggleResult>} A promise that resolves with the result of the toggle operation.
   */
  async closeRight(): Promise<MatDrawerToggleResult> {
    assertIsDefined(this.rightSidenav, 'Right sidenav not available');
    return await this.rightSidenav.close();
  }

  /**
   * Toggles the visibility of the main (left) sidenav panel. Asserts that the sidenav instance is defined before toggling.
   * If the sidenav mode is 'over', it ensures the expanded state is set to true before toggling.
   * Otherwise, it toggles the expanded state based on its current value.
   *
   * @returns {Promise<void>} A promise that resolves when the toggle operation is complete.
   */
  async toggle(): Promise<void> {
    assertIsDefined(this.sidenav, 'Left sidenav not available');
    if (this.sidenav.mode === 'over') {
      this.sidenavExpandedChange.next(true);
      await this.sidenav.toggle();
    } else {
      this.sidenavExpandedChange.next(!this.sidenavExpandedChange.getValue());
    }
  }

  /**
   * Toggles the visibility of the secondary (right) sidenav panel. Asserts that the sidenav instance is defined before toggling.
   *
   * @returns {Promise<MatDrawerToggleResult>} A promise that resolves with the result of the toggle operation.
   */
  async toggleRight(): Promise<MatDrawerToggleResult> {
    assertIsDefined(this.rightSidenav, 'Right sidenav not available');
    return await this.rightSidenav.toggle();
  }
}
