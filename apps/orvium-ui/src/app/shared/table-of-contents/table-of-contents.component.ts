import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  Inject,
  inject,
  Input,
  NgZone,
  OnInit,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { fromEvent } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Represents a section of links in the table of contents.
 */
interface LinkSection {
  name: string;
  links: Link[];
}

/**
 * Represents a link in the table of contents.
 */
interface Link {
  /**  id of the section */
  id: string;

  /** header type h3/h4 */
  type: string;

  /** if the anchor is in view of the page */
  active: boolean;

  /** name of the anchor */
  name: string;

  /** top offset px of the anchor */
  top: number;
}

/**
 * A component that generates a table of contents based on the headers within the provided container.
 */
@Component({
  selector: 'app-table-of-contents',
  standalone: true,
  templateUrl: './table-of-contents.component.html',
  styleUrls: ['./table-of-contents.component.scss'],
  imports: [],
})
export class TableOfContentsComponent implements OnInit, AfterViewInit {
  /** The selector of the container to listen for scroll events on. */
  @Input() container: string | undefined;

  /** The amount of scroll padding to apply to the top of the container. */
  @Input() scrollPaddingTop = '0';

  /** The sections of links in the table of contents. */
  _linkSections: LinkSection[] = [];

  /** All links in the table of contents.  */
  _links: Link[] = [];

  /** The root URL of the current route (without the fragment). */
  _rootUrl = this._router.url.split('#')[0];

  /** The scroll container element or window. */
  private _scrollContainer: HTMLElement | Window | null = null;

  /** The URL fragment to scroll to on initialization. */
  private _urlFragment = '';

  /** The destroy reference for managing subscriptions. */
  private destroyRef = inject(DestroyRef);

  /**
   * Creates an instance of the TableOfContentsComponent.
   *
   * @param _router The Angular Router service.
   * @param _route The ActivatedRoute service for accessing route parameters.
   * @param _element The ElementRef for accessing the component's DOM element.
   * @param _document The Document service for interacting with the DOM.
   * @param _ngZone The NgZone service for running code outside of Angular's zone.
   * @param _changeDetectorRef The ChangeDetectorRef service for marking the component for change detection.
   */
  constructor(
    private _router: Router,
    private _route: ActivatedRoute,
    private _element: ElementRef<HTMLElement>,
    @Inject(DOCUMENT) private _document: Document,
    private _ngZone: NgZone,
    private _changeDetectorRef: ChangeDetectorRef
  ) {
    this._router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        const rootUrl = _router.url.split('#')[0];

        if (rootUrl !== this._rootUrl) {
          this._rootUrl = rootUrl;
        }
      });
    this._route.fragment.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(fragment => {
      if (fragment != null) {
        this._urlFragment = fragment;

        const target = document.getElementById(this._urlFragment);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  /**
   * Angular lifecycle hook that is called after Angular has initialized all data-bound properties.
   */
  ngOnInit(): void {
    // On init, the sidenav content element doesn't yet exist, so it's not possible
    // to subscribe to its scroll event until next tick (when it does exist).
    this._ngZone.runOutsideAngular(() => {
      void Promise.resolve().then(() => {
        this._scrollContainer = this.container
          ? // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
            (this._document.querySelector(this.container) as HTMLElement)
          : window;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this._scrollContainer) {
          if (this._scrollContainer instanceof HTMLElement) {
            this._scrollContainer.style.scrollPaddingTop = this.scrollPaddingTop;
          }

          fromEvent(this._scrollContainer, 'scroll')
            .pipe(debounceTime(10), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.onScroll());
        }
      });
    });
  }

  /**
   * Angular lifecycle hook that is called after Angular has fully initialized the component's view.
   */
  ngAfterViewInit(): void {
    this.updateScrollPosition();
  }

  /**
   * Updates the scroll position to the current URL fragment.
   */
  updateScrollPosition(): void {
    this._document.getElementById(this._urlFragment)?.scrollIntoView();
  }

  /**
   * Resets the header links.
   */
  resetHeaders(): void {
    this._linkSections = [];
    this._links = [];
  }

  /**
   * Adds headers to the table of contents.
   *
   * @param sectionName The name of the section.
   * @param docViewerContent The content element containing the headers.
   * @param sectionIndex The index of the section.
   */
  addHeaders(sectionName: string, docViewerContent: HTMLElement, sectionIndex = 0): void {
    setTimeout(() => {
      const list = docViewerContent.querySelectorAll('h3, h4');
      const links = Array.from(list, header => {
        // remove the 'link' icon name from the inner text
        const name = (header as HTMLElement).innerText.trim().replace(/^link/, '');
        const { top } = header.getBoundingClientRect();

        return {
          name,
          type: header.tagName.toLowerCase(),
          top: top,
          id: header.id,
          active: false,
        };
      });

      this._linkSections[sectionIndex] = { name: sectionName, links };
      this._links.push(...links);
      this._changeDetectorRef.detectChanges();
    }, 1);
  }

  /**
   * Gets the scroll offset of the scroll container.
   *
   * @returns The scroll offset.
   */
  private getScrollOffset(): number {
    const { top } = this._element.nativeElement.getBoundingClientRect();
    const container = this._scrollContainer;

    if (container instanceof HTMLElement) {
      return container.scrollTop + Number(top);
    }

    if (container) {
      return container.scrollY + Number(top);
    }

    return 0;
  }

  /**
   * Handles the scroll event to update the active link in the table of contents.
   */
  public onScroll(): void {
    const scrollOffset = this.getScrollOffset();

    let hasChanged = false;

    for (let i = 0; i < this._links.length; i++) {
      // A link is considered active if the page is scrolled past the
      // anchor without also being scrolled passed the next link.
      const currentLink = this._links[i];
      const nextLink = this._links[i + 1];
      const isActive =
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        scrollOffset >= currentLink.top && (!nextLink || nextLink.top >= scrollOffset);

      if (isActive !== currentLink.active) {
        currentLink.active = isActive;
        hasChanged = true;
      }
    }

    if (hasChanged) {
      // The scroll listener runs outside of the Angular zone so
      // we need to bring it back in only when something has changed.
      this._ngZone.run(() => this._changeDetectorRef.markForCheck());
    }
  }
}
