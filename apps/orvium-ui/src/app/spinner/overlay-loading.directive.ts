import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';
import { DynamicOverlay } from './dynamic-overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';

/**
 * A directive that toggles a loading overlay on the host element based on the state of a bound property.
 * It uses Angular's Overlay service to create and manage the overlay dynamically.
 */
@Directive({
  standalone: true,
  selector: '[appOverlayLoading]',
})
export class OverlayLoadingDirective implements OnChanges {
  /** An input property that toggles the loading overlay. When set to true, the overlay is displayed. */
  @Input('appOverlayLoading') toggler = false;

  /** A reference to the overlay created by this directive. */
  private overlayRef: OverlayRef;

  /**
   * Constructs an instance of the OverlayLoadingDirective.
   *
   * @param {ElementRef<HTMLElement>} host - A reference to the host element on which the directive is applied.
   * @param {DynamicOverlay} dynamicOverlay - An injected service used to create overlays dynamically.
   */
  constructor(
    private host: ElementRef<HTMLElement>,
    private dynamicOverlay: DynamicOverlay
  ) {
    this.overlayRef = this.dynamicOverlay.createWithDefaultConfig(this.host.nativeElement);
  }

  /**
   * Responds to changes in the input properties of the directive. Specifically, it reacts to changes in the
   * `toggler` property to either show or hide the overlay.
   *
   * @param {SimpleChanges} changes - An object of Angular SimpleChanges that contains the changes made to the input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('toggler')) {
      const toggler = changes['toggler'];
      if (toggler.currentValue) {
        const component = this.overlayRef.attach(new ComponentPortal(LoadingSpinnerComponent));
        component.instance.isButton = this.host.nativeElement.tagName === 'BUTTON';
      } else {
        this.overlayRef.detach();
      }
    }
  }
}
