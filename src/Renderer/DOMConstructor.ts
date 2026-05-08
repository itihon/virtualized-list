/**
 * @fileoverview DOMConstructor encapsulates DOM manipulation boilerplate and provides lifecycle hooks.
 * @license MIT
 * @author Alexandr Kalabin
 */

import ElementMetricsCache from "./ElementMetricsCache";

export default class DOMConstructor extends ElementMetricsCache {
  private _parentContainer: HTMLElement;
  private _DOMRoot: HTMLDivElement;

  constructor(parentContainer: HTMLElement, classList: string[], childElement?: HTMLElement) {
    super(childElement ? childElement : document.createElement('div'));

    this._parentContainer = parentContainer;    
    this._DOMRoot = this._element as HTMLDivElement;
    this._DOMRoot.classList.add(...classList);

    if (!childElement) {
      this._parentContainer.appendChild(this._DOMRoot);
    }
  }

  setWidth(width: number) {
    const roundWidth = Math.round(width)
    this._DOMRoot.style.width = `${roundWidth}px`;
  }

  setHeight(height: number) {
    const roundHeight = Math.round(height)
    this._DOMRoot.style.height = `${roundHeight}px`;
  }

  get DOMRoot(): HTMLDivElement {
    return this._DOMRoot;
  }

  get parentContainer(): HTMLElement {
    return this._parentContainer;
  }
}
