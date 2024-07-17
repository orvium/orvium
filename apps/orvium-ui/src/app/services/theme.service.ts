import { effect, Inject, Injectable, Renderer2, RendererFactory2, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Enum for main application themes (light or dark)
 */
export enum THEMES {
  light = 'theme-light',
  dark = 'theme-dark',
}

/**
 * Service to manage and dynamically switch themes in an Angular application. It supports both light and dark mode themes
 * by dynamically loading and unloading CSS files as needed. The service tracks user preferences.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /** A signal containing the current main theme and the dark mode status. */
  theme = signal<THEMES>(THEMES.light);

  /** Renderer2 instance used to manipulate the DOM. */
  private renderer: Renderer2;

  /** Reference to the document head element. */
  private head: HTMLElement;

  /** Array to keep track of dynamically added theme link elements. */
  themeLinks: HTMLElement[] = [];

  /**
   * Constructs the ThemeService.
   *
   * @param {RendererFactory2} rendererFactory - Factory that creates a Renderer2 instance.
   * @param {Document} document - A reference to the DOM's Document object, injected to facilitate DOM manipulations.
   */
  constructor(rendererFactory: RendererFactory2, @Inject(DOCUMENT) document: Document) {
    this.head = document.head;
    this.renderer = rendererFactory.createRenderer(null, null);

    effect(async () => {
      const cssFilename = `${this.theme()}.css`;
      await this.loadCss(cssFilename);
      if (this.themeLinks.length === 2)
        this.renderer.removeChild(this.head, this.themeLinks.shift());
    });
  }

  afterNextRender(): void {
    const storedTheme = localStorage.getItem('theme') as THEMES | null;
    if (storedTheme && Object.values(THEMES).includes(storedTheme)) {
      this.theme.set(storedTheme);
    }
  }

  /**
   * Dynamically loads a CSS file into the document head. Handles the creation and management of link elements for themes.
   *
   * @param {string} filename - The filename of the CSS file to be loaded.
   * @returns {Promise<unknown>} A promise that resolves when the CSS file is loaded.
   */
  private async loadCss(filename: string): Promise<unknown> {
    return new Promise(resolve => {
      const linkEl: HTMLElement = this.renderer.createElement('link');
      this.renderer.setAttribute(linkEl, 'rel', 'stylesheet');
      this.renderer.setAttribute(linkEl, 'type', 'text/css');
      this.renderer.setAttribute(linkEl, 'id', 'theme-css');
      this.renderer.setAttribute(linkEl, 'href', filename);
      this.renderer.setProperty(linkEl, 'onload', resolve);
      const previousLink = this.head.querySelector('#theme-css');
      if (previousLink) {
        this.renderer.insertBefore(this.head, linkEl, previousLink.nextSibling);
      } else {
        this.renderer.appendChild(this.head, linkEl);
      }
      this.themeLinks = [...this.themeLinks, linkEl];
    });
  }
}
