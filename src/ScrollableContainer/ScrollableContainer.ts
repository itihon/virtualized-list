/**
 * @fileoverview Provides the scroll host abstraction used by the virtualized list.
 * Creates and owns the DOM layers (scroll-height filler, viewport, and content layer),
 * tracks container size and scroll state, animates vertical content translation, and
 * emits lifecycle events for scrolling, resizing, and items leaving the overscan area.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { IEventEmitter, IEventMap } from '../types/types';
import DOMConstructor from './DOMConstructor';
import classes from './ScrollableContainer.module.css';

export default class ScrollableContainer {
  private _container: HTMLElement;
  private _scrollHeightFiller: DOMConstructor;
  private _topFiller: DOMConstructor;
  private _bottomFiller: DOMConstructor;
  private _contentLayer: DOMConstructor;
  private _currentAnimatedPosition = 0;
  private _observer: IntersectionObserver;
  private _previousScrollTop: number = 0;
  private _overscanHeight: number = 0;
  private _eventBus: IEventEmitter<IEventMap>;
  private _scrollHeight = 0;
  private _clientWidth = 0;
  private _clientHeight = 0;
  private _scrollTopLimit = 0;
  private _scrollBottomLimit = 0;
  private _contentLayerHeight = 0;
  private _contentLayerTop = 0;
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

    this._schedulePostScrollingJob();
  };

  private _doPostScrollingJob: IntersectionObserverCallback = (entries, observer) => {
    const contentLayer = this._contentLayer.DOMRoot;
    const entriesCount = entries.length;
    const itemsOutOfView: HTMLElement[] = [];
    const overscanHeight = this._overscanHeight;
    const halfOverscanHeight = overscanHeight / 2;

    // pick items which went out of view
    for (let i = 0; i < entriesCount; i++) {
      const entry = entries[i]!;

      // if (!(entry.target as HTMLElement).offsetParent) continue; // skip unmounted elements

      if (entry.target.parentElement === contentLayer) {
        const { height, top, bottom } = entry.rootBounds!;
        const scaleFactor = this._clientHeight / height; // WebKit gives unscaled coordinates of rootBounds

        if (this._lastScrollingDirection === 'down') {
          if (entry.boundingClientRect.bottom < top * scaleFactor - halfOverscanHeight) {
            itemsOutOfView.push((entry.target as HTMLElement));
          }
        }
        else if (this._lastScrollingDirection === 'up') {
          if (entry.boundingClientRect.top > bottom * scaleFactor + halfOverscanHeight) {
            itemsOutOfView.push((entry.target as HTMLElement));
          }
        }
      } 
    }

    if (itemsOutOfView.length) {
      this._eventBus.emit('onItemsOutOfView', itemsOutOfView);
    }

    this._calculateContentLayerBounds();
    requestAnimationFrame(this._updateContentLayerBounds);

    observer.disconnect();
  };

  private _schedulePostScrollingJob = () => { 
    const renderedElements = this._contentLayer.DOMRoot.children;
    const renderedElementsCount = renderedElements.length;
    const observer = this._observer;

    for (let i = 0; i < renderedElementsCount; i++) {
      observer.observe(renderedElements.item(i)!);
    }
  };

  private _saveCurrentSize: ResizeObserverCallback = () => {
    this._clientWidth = this._container.clientWidth;
    this._clientHeight = this._container.clientHeight;

    this._eventBus.emit('onResize', this._clientWidth, this._clientHeight);
  };

  private _calculateContentLayerBounds() {
    const contentLayerRoot = this._contentLayer.DOMRoot;
    const { clientHeight } = this._container;
    const contentHeight = contentLayerRoot.scrollHeight;
    const scrollTopLimit = contentHeight - clientHeight;
    const scrollBottomLimit = clientHeight;
   
    this._scrollTopLimit = scrollTopLimit;
    this._scrollBottomLimit = scrollBottomLimit;
    this._contentLayerHeight = contentLayerRoot.scrollHeight;
    this._contentLayerTop = contentLayerRoot.offsetTop;
  }

  private _updateScrollLimit = () => {
    this._contentLayer.DOMRoot.style.setProperty('--scroll-top-limit', `${this._scrollTopLimit}px`);
    this._contentLayer.DOMRoot.style.setProperty('--scroll-bottom-limit', `${this._scrollBottomLimit}px`);
  };

  private _updateContentPosition = (newPosition = this._contentLayerTop) => {
    const scrollHeight = this._scrollHeight;
    const contentLayerHeight = this._contentLayerHeight;

    const minPosition = 0;
    const maxPosition = scrollHeight - contentLayerHeight;
    const position = Math.min(Math.max(newPosition, minPosition), maxPosition);

    this._topFiller.setHeight(position);
    this._bottomFiller.setHeight(scrollHeight - position);
  };

  private _updateContentLayerBounds = () => {
    this._updateScrollLimit();
    this._updateContentPosition();
  };

  constructor(container: HTMLElement, eventBus: IEventEmitter<IEventMap>, overscanHeight = 200) {
    this._container = container;
    this._eventBus = eventBus;
    this._overscanHeight = overscanHeight;
    this._scrollHeightFiller = new DOMConstructor(container, [classes.filler, classes.scrollHeightFiller]);
    this._topFiller = new DOMConstructor(container, [classes.filler]);
    this._contentLayer = new DOMConstructor(container, [classes.contentLayer]);
    this._bottomFiller = new DOMConstructor(container, [classes.filler]);
    this._container.classList.add(classes.scrollableContainer);
    this._container.addEventListener('scroll', this._emitOnScroll);
    this._observer = new IntersectionObserver(this._doPostScrollingJob, { root: this._container });
    new ResizeObserver(this._saveCurrentSize).observe(this._container);
  }

  getScrollTop(): number {
    return this._container.scrollTop;
    // return this._previousScrollTop;
  }

  setScrollHeight(scrollHeight: number) {
    const { scrollTop } = this._container;

    this._scrollHeightFiller.setHeight(scrollHeight);
    this._topFiller.setHeight(scrollTop);
    this._bottomFiller.setHeight(scrollHeight - scrollTop);

    this._scrollHeight = scrollHeight;
  }

  getScrollHeight(): number {
    return this._scrollHeight;
  }

  updateContentPosition(newPosition: number) {
    this._updateContentPosition(newPosition);
  }

  getContentPosition(): number {
    return Math.abs(this._currentAnimatedPosition);
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