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
import ScrollRelay from './ScrollRelay';
import classes from './ScrollableContainer.module.css';

export default class ScrollableContainer {
  private _container: HTMLElement;
  private _scrollHeightFiller: DOMConstructor;
  private _viewportContainer: DOMConstructor;
  private _scrollCanvas: DOMConstructor;
  private _topSpacer: DOMConstructor;
  private _bottomSpacer: DOMConstructor;
  private _contentLayer: DOMConstructor;
  private _eventBus: IEventEmitter<IEventMap> | null = null;
  private _containerScroller: ScrollRelay;
  private _viewportScroller: ScrollRelay;
  private _scrollHeight = 0;
  private _clientWidth = 0;
  private _clientHeight = 0;
  private _viewportWidth = 0;
  private _viewportHeight = 0;

  private _handleResize: ResizeObserverCallback = () => {
    this._clientWidth = this._container.clientWidth;
    this._clientHeight = this._container.clientHeight;
    this._viewportWidth = this._viewportContainer.DOMRoot.clientWidth;
    this._viewportHeight = this._viewportContainer.DOMRoot.clientHeight;

    this._eventBus?.emit('onResize', this._clientWidth, this._clientHeight);
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

  constructor(container: HTMLElement) {
    this._container = container;
    this._scrollHeightFiller = new DOMConstructor(container, [classes.scrollHeightFiller]);
    this._viewportContainer = new DOMConstructor(container, [classes.viewportContainer]);
    this._scrollCanvas = new DOMConstructor(this._viewportContainer.DOMRoot, [classes.scrollCanvas]);
    this._topSpacer = new DOMConstructor(this._scrollCanvas.DOMRoot, [classes.topSpacer]);
    this._contentLayer = new DOMConstructor(this._scrollCanvas.DOMRoot, [classes.contentLayer]);
    this._bottomSpacer = new DOMConstructor(this._scrollCanvas.DOMRoot, [classes.bottomSpacer]);
    this._containerScroller = new ScrollRelay(this._container);
    this._viewportScroller = new ScrollRelay(this._viewportContainer.DOMRoot);

    const resizeObserver = new ResizeObserver(this._handleResize);
    
    resizeObserver.observe(this._container);
    resizeObserver.observe(this._viewportContainer.DOMRoot);

    this._container.classList.add(classes.scrollableContainer);

    this._viewportContainer.DOMRoot.onMounted(() => {
      this._container.scrollTop = 0;
      this._viewportContainer.DOMRoot.scrollTop = 0;
      this.setTopSpacerHeight(0);
      this.setBottomSpacerHeight('auto');
    });
  }

  attach(eventBus: IEventEmitter<IEventMap>) {
    this._eventBus = eventBus;
    this._containerScroller.attach(eventBus, 'onScroll');
    this._viewportScroller.attach(eventBus, 'onContentScroll');
  }

  scroll(top: number) {
    this._viewportContainer.DOMRoot.scroll({ top });
  }

  setScrollTop(scrollTop: number) {
    this._containerScroller.setScrollTop(scrollTop);
  }

  getScrollTop(): number {
    return this._container.scrollTop;
    // return this._previousScrollTop;
  }

  getViewportTop(): number {
    return this._viewportContainer.DOMRoot.scrollTop;
  }

  setScrollHeight(scrollHeight: number) {
    this._scrollHeightFiller.setHeight(scrollHeight);
    this._scrollHeight = scrollHeight;
  }

  getScrollHeight(): number {
    return this._scrollHeight;
  }

  setScrollCanvasHeight(height: number) {
    this._scrollCanvas.setHeight(height);
  }

  getScrollCanvasHeight(): number {
    return this._scrollCanvas.DOMRoot.offsetHeight;
  }

  getTopSpacerBottom(): number {
    return this._topSpacer.DOMRoot.offsetHeight;
  }

  getBottomSpacerTop(): number {
    return this._bottomSpacer.DOMRoot.offsetTop;
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

  appendItem(item: HTMLElement | DocumentFragment) {
    this._contentLayer.DOMRoot.appendChild(item);
  }

  prependItem(item: HTMLElement | DocumentFragment) {
    this._contentLayer.DOMRoot.prepend(item);
  }

  getClientWidth(): number {
    return this._clientWidth;
  }

  getClientHeight(): number {
    return this._clientHeight;
  }
  
  getViewportWidth(): number {
    return this._viewportWidth;
  }

  getViewportHeight(): number {
    return this._viewportHeight;
  }

  getFirstItem(): Element | null {
    return this._contentLayer.DOMRoot.firstElementChild;
  }

  getLastItem(): Element | null {
    return this._contentLayer.DOMRoot.lastElementChild;
  }

  getItems(): HTMLCollection {
    return this._contentLayer.DOMRoot.children;
  }

  clear() {
    const contentLayer = this._contentLayer.DOMRoot;

    while(contentLayer.firstChild) {
      contentLayer.firstChild.remove();
    }
  }
}