import {
  Overlay,
  OverlayKeyboardDispatcher,
  OverlayOutsideClickDispatcher,
  OverlayPositionBuilder,
  OverlayRef,
  ScrollStrategyOptions,
} from '@angular/cdk/overlay';
import {
  ComponentFactoryResolver,
  Inject,
  Injectable,
  Injector,
  NgZone,
  Renderer2,
  RendererFactory2,
} from '@angular/core';
import { DynamicOverlayContainerService } from './dynamic-overlay-container.service';
import { Directionality } from '@angular/cdk/bidi';
import { DOCUMENT, Location as Location_2 } from '@angular/common';

/**
 * Extends Angular's Overlay to create overlays with a dynamic context, allowing for flexible configuration
 * based on runtime conditions. This class provides methods to set a custom container and create overlays with default settings.
 */
@Injectable({
  providedIn: 'root',
})
export class DynamicOverlay extends Overlay {
  /** Service to manage the overlay container. */
  private readonly _dynamicOverlayContainer: DynamicOverlayContainerService;

  /** Renderer to manipulate overlay container element styles. */
  private renderer: Renderer2;

  /**
   * Creates an instance of DynamicOverlay.
   *
   * @param {ScrollStrategyOptions} scrollStrategies - Pre-defined strategies for handling scrolling.
   * @param {DynamicOverlayContainerService} overlayContainer - Service managing DOM overlay container elements.
   * @param {ComponentFactoryResolver} componentFactoryResolver - Resolves component factories for dynamic component creation.
   * @param {OverlayPositionBuilder} positionBuilder - To build the position strategy based on the overlay's placement.
   * @param {OverlayKeyboardDispatcher} keyboardDispatcher - Dispatches keyboard events to overlays.
   * @param {Injector} injector - Injector for lazy-loaded components.
   * @param {NgZone} ngZone - Angular zone to optimize for performance outside Angular's change detection.
   * @param {Document} document - Reference to the global document object.
   * @param {Directionality} directionality - Provides directionality (LTR/RTL) context.
   * @param {RendererFactory2} rendererFactory - Factory to create a renderer instance.
   * @param {Location_2} location2 - Represents the URL location.
   * @param {OverlayOutsideClickDispatcher} overlayOutsideClickDispatcher - Handles outside click events for overlays.
   */
  constructor(
    scrollStrategies: ScrollStrategyOptions,
    overlayContainer: DynamicOverlayContainerService,
    componentFactoryResolver: ComponentFactoryResolver,
    positionBuilder: OverlayPositionBuilder,
    keyboardDispatcher: OverlayKeyboardDispatcher,
    injector: Injector,
    ngZone: NgZone,
    @Inject(DOCUMENT) document: Document,
    directionality: Directionality,
    rendererFactory: RendererFactory2,
    location2: Location_2,
    overlayOutsideClickDispatcher: OverlayOutsideClickDispatcher
  ) {
    super(
      scrollStrategies,
      overlayContainer,
      componentFactoryResolver,
      positionBuilder,
      keyboardDispatcher,
      injector,
      ngZone,
      document,
      directionality,
      location2,
      overlayOutsideClickDispatcher
    );
    this.renderer = rendererFactory.createRenderer(null, null);

    this._dynamicOverlayContainer = overlayContainer;
  }

  /**
   * Sets the container element for the overlay and applies a CSS transformation.
   *
   * @param {HTMLElement} containerElement - The HTML element to set as the overlay container.
   */
  private setContainerElement(containerElement: HTMLElement): void {
    this.renderer.setStyle(containerElement, 'transform', 'translateZ(0)');
    this._dynamicOverlayContainer.setContainerElement(containerElement);
  }

  /**
   * Creates an overlay with default configuration settings.
   *
   * @param {HTMLElement} containerElement - The container element where the overlay will be attached.
   * @returns {OverlayRef} A reference to the created overlay.
   */
  public createWithDefaultConfig(containerElement: HTMLElement): OverlayRef {
    this.setContainerElement(containerElement);
    return super.create({
      hasBackdrop: true,
      backdropClass: 'overlay-backdrop',
      positionStrategy: this.position().global().centerHorizontally().centerVertically(),
    });
  }
}
