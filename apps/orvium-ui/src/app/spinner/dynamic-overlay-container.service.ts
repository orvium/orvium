import { Inject, Injectable } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import { Platform } from '@angular/cdk/platform';

@Injectable({
  providedIn: 'root',
})
export class DynamicOverlayContainerService extends OverlayContainer {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  constructor(@Inject(DOCUMENT) document: Document, _platform: Platform) {
    super(document, _platform);
  }

  public setContainerElement(containerElement: HTMLElement): void {
    this._containerElement = containerElement;
  }
}
