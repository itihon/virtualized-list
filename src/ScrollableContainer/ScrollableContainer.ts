/**
 * @fileoverview Provides the scroll host abstraction used by the virtualized list.
 * Creates and owns the DOM layers (scroll-height filler, viewport, and content layer),
 * tracks container size and scroll state, and emits lifecycle events 
 * for scrolling, resizing.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { IEventEmitter, IEventMap } from '../types/types';
import DOMConstructor from './DOMConstructor';
import classes from './ScrollableContainer.module.css';
import extractTYValue from './extractTYValue';

export default class ScrollableContainer {
  private _container: HTMLElement;
  private _scrollHeightFiller: DOMConstructor;
  private _viewportContainer: DOMConstructor;
  private _scrollCanvas: DOMConstructor;
  private _topSpacer: DOMConstructor;
  private _bottomSpacer: DOMConstructor;
  private _contentLayer: DOMConstructor;
  private _previousScrollTop: number = 0;
  private _overscanHeight: number = 0;
  private _eventBus: IEventEmitter<IEventMap>;
  private _scrollHeight = 0;
  private _clientWidth = 0;
  private _clientHeight = 0;
  private _lastScrollingDirection: 'up' | 'down' | '' = '';

  private _emitOnScroll = () => {
    const previousScrollTop = this._previousScrollTop;
    const scrollTop = this._container.scrollTop;
    const speed = Math.abs(previousScrollTop - scrollTop) >= this._overscanHeight 
      ? 'fast' 
      : 'slow';

    if (previousScrollTop < scrollTop) {
      this._eventBus.emit('onScroll', scrollTop, 'down', speed);
      this._lastScrollingDirection = 'down';
    }
    else if (previousScrollTop > scrollTop) {
      this._eventBus.emit('onScroll', scrollTop, 'up', speed);
      this._lastScrollingDirection = 'up';
    }

    this._previousScrollTop = scrollTop;
  };

  private _saveCurrentSize: ResizeObserverCallback = () => {
    this._clientWidth = this._container.clientWidth;
    this._clientHeight = this._container.clientHeight;

    this._eventBus.emit('onResize', this._clientWidth, this._clientHeight);
  };

  private _setSpacerHeight(spacer: DOMConstructor, height: number | 'auto') {
    if (height === 'auto') {
      spacer.setHeight(0);
      spacer.DOMRoot.style.flexGrow = '1';
    }
    else {
      spacer.setHeight(height);
      spacer.DOMRoot.style.flexGrow = '0';
    }
  }

  constructor(container: HTMLElement, eventBus: IEventEmitter<IEventMap>, overscanHeight = 200) {
    this._container = container;
    this._eventBus = eventBus;
    this._overscanHeight = overscanHeight;
    this._scrollHeightFiller = new DOMConstructor(container, [classes.scrollHeightFiller]);
    this._viewportContainer = new DOMConstructor(container, [classes.viewportContainer]);
    this._scrollCanvas = new DOMConstructor(this._viewportContainer.DOMRoot, [classes.scrollCanvas]);
    this._topSpacer = new DOMConstructor(this._scrollCanvas.DOMRoot, [classes.topSpacer]);
    this._contentLayer = new DOMConstructor(this._scrollCanvas.DOMRoot, [classes.contentLayer]);
    this._bottomSpacer = new DOMConstructor(this._scrollCanvas.DOMRoot, [classes.bottomSpacer]);
    this._container.classList.add(classes.scrollableContainer);
    this._container.addEventListener('scroll', this._emitOnScroll);
    new ResizeObserver(this._saveCurrentSize).observe(this._container);
  }

  getScrollTop(): number {
    return this._container.scrollTop;
    // return this._previousScrollTop;
  }

  setScrollHeight(scrollHeight: number) {
    this._scrollHeightFiller.setHeight(scrollHeight);
    this._scrollHeight = scrollHeight;
  }

  setScrollCanvasHeight(height: number) {
    this._scrollCanvas.setHeight(height);
  }

  getScrollHeight(): number {
    return this._scrollHeight;
  }

  setTopSpacerHeight(height: number | 'auto') {
    this._setSpacerHeight(this._topSpacer, height);
  }

  getTopSpacerHeight(): number {
    return this._topSpacer.DOMRoot.offsetHeight;
  }

  setBottomSpacerHeight(height: number | 'auto') {
    this._setSpacerHeight(this._bottomSpacer, height);
  }

  getBottomSpacerHeight(): number {
    return this._bottomSpacer.DOMRoot.offsetHeight;
  }

  appendItem(item: HTMLElement) {
    this._contentLayer.DOMRoot.appendChild(item);
  }

  prependItem(item: HTMLElement) {
    this._contentLayer.DOMRoot.prepend(item);
  }

  getClientWidth(): number {
    return this._clientWidth;
  }

  getClientHeight(): number {
    return this._clientHeight;
  }

  getFirstItem(): Element | null {
    return this._contentLayer.DOMRoot.firstElementChild;
  }

  getLastItem(): Element | null {
    return this._contentLayer.DOMRoot.lastElementChild;
  }

  clear() {
    const contentLayer = this._contentLayer.DOMRoot;

    while(contentLayer.firstChild) {
      contentLayer.firstChild.remove();
    }
  }
}