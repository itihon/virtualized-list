/**
 * @fileoverview Caches an element's layout and scroll metrics for safe reuse without repeated DOM reads.
 * @license MIT
 * @author Alexandr Kalabin
 */

export default class ElementMetricsCache {
  protected _element: HTMLElement;
  private _offsetTop: number = 0;
  private _offsetHeight: number = 0;
  private _scrollTop: number = 0;
  private _scrollHeight: number = 0;
  private _clientWidth: number = 0;
  private _clientHeight: number = 0;

  constructor(element: HTMLElement) {
    this._element = element;
  }

  get scrollTop(): number {
    return this._scrollTop;
  }

  get scrollHeight(): number {
    return this._scrollHeight;
  }

  get clientWidth(): number {
    return this._clientWidth;
  }

  get clientHeight(): number {
    return this._clientHeight;
  }

  get offsetTop(): number {
    return this._offsetTop;
  }

  get offsetHeight(): number {
    return this._offsetHeight;
  }

  refresh() {
    const {
      scrollTop,
      scrollHeight,
      clientWidth,
      clientHeight,
      offsetTop,
      offsetHeight
    } = this._element;

    this._offsetTop = offsetTop;
    this._offsetHeight = offsetHeight;
    this._scrollTop = scrollTop;
    this._scrollHeight = scrollHeight;
    this._clientWidth = clientWidth;
    this._clientHeight = clientHeight;
  }
}
