import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

const PRIMARY_SPINNER = 'primary';

@Injectable({
  providedIn: 'root',
})
export class SpinnerService {
  /**
   * Spinner observable
   *
   * @memberof NgxSpinnerService
   */
  private spinnerRef: OverlayRef = this.cdkSpinnerCreate();

  /**
   * Creates an instance of NgxSpinnerService.
   * @memberof NgxSpinnerService
   */
  constructor(private overlay: Overlay) {}

  private cdkSpinnerCreate(): OverlayRef {
    return this.overlay.create({
      hasBackdrop: true,
      backdropClass: 'dark-backdrop',
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
    });
  }

  /**
   * To show spinner
   *
   * @memberof NgxSpinnerService
   */
  show(name: string = PRIMARY_SPINNER): void {
    this.spinnerRef.attach(new ComponentPortal(LoadingSpinnerComponent));
  }

  /**
   * To hide spinner
   *
   * @memberof NgxSpinnerService
   */
  hide(name: string = PRIMARY_SPINNER, debounce = 10): void {
    setTimeout(() => {
      this.spinnerRef.detach();
    }, debounce);
  }
}
