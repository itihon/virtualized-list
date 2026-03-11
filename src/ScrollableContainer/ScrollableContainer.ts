/**
 * @fileoverview Scrollable container encapsulates all DOM parts necessary for virtual scroll
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
  private _contentLayer: DOMConstructor;
  private _scrollAnimation: Animation;
  private _previousPosition = 0;
  private _observer: IntersectionObserver;
  private _currentAnimatedPosition = 0;
  private _animationOptions: KeyframeAnimationOptions = { duration: 32, fill: 'forwards', playbackRate: 4, easing: 'cubic-bezier(0, 0.49, 0.03, 0.42)' };
  private _previousKeyframe: Keyframe = { transform: 'translateY(0)', composite: 'replace', offset: 0 };
  private _nextKeyframe: Keyframe = { transform: 'translateY(0)', composite: 'replace', offset: 1 }; 
  private _previousScrollTop: number = 0;
  private _overscanHeight: number = 0;
  private _eventBus: IEventEmitter<IEventMap>;
  private _scrollHeight = 0;
  private _clientWidth = 0;
  private _clientHeight = 0;

  private _emitOnScroll = () => {
    const previousScrollTop = this._previousScrollTop;
    const scrollTop = this._container.scrollTop;
    const speed = Math.abs(previousScrollTop - scrollTop) >= this._overscanHeight 
      ? 'fast' 
      : 'slow';

    if (previousScrollTop < scrollTop) {
      this._eventBus.emit('onScroll', scrollTop, 'down', speed);
    }
    else if (previousScrollTop > scrollTop) {
      this._eventBus.emit('onScroll', scrollTop, 'up', speed);
    }

    this._previousScrollTop = scrollTop;
    this._observer.observe(this._contentLayer.DOMRoot);
  };

  private _saveCurrentAnimatedPosition: IntersectionObserverCallback = (_, observer) => {
    const contentLayer = this._contentLayer.DOMRoot;

    this._currentAnimatedPosition = extractTYValue(getComputedStyle(contentLayer).transform);
    observer.unobserve(contentLayer);
  };

  private _observeContentLayer = (animation: Animation) => { 
    this._observer.observe(this._contentLayer.DOMRoot); 
    return animation; 
  };

  private _saveCurrentSize: ResizeObserverCallback = () => {
    this._clientWidth = this._container.clientWidth;
    this._clientHeight = this._container.clientHeight;

    this._eventBus.emit('onResize', this._clientWidth, this._clientHeight);
  };

  constructor(container: HTMLElement, eventBus: IEventEmitter<IEventMap>, overscanHeight = 200) {
    this._container = container;
    this._eventBus = eventBus;
    this._overscanHeight = overscanHeight;
    this._scrollHeightFiller = new DOMConstructor(container, [classes.scrollHeightFiller]);
    this._viewportContainer = new DOMConstructor(container, [classes.viewportContainer]);
    this._contentLayer = new DOMConstructor(this._viewportContainer.DOMRoot, [classes.contentLayer]);
    this._container.classList.add(classes.scrollableContainer);
    this._scrollAnimation = this._contentLayer.DOMRoot.animate({ transform: `translateY(0)`});
    this._container.addEventListener('scroll', this._emitOnScroll);
    this._observer = new IntersectionObserver(this._saveCurrentAnimatedPosition, { root: this._container });
    this._observer.observe(this._contentLayer.DOMRoot);
    new ResizeObserver(this._saveCurrentSize).observe(this._container);
  }

  setScrollHeight(scrollHeight: number) {
    this._scrollHeightFiller.setHeight(scrollHeight);
    this._contentLayer.setHeight(scrollHeight);
    this._scrollHeight = scrollHeight;
  }

  getScrollHeight(): number {
    return this._scrollHeight;
  }

  updateContentPosition(offset: number, fromOffset?: number): Promise<Animation> {

    const position = -offset;
  
    let currentPosition: number | null = null;

    if (this._scrollAnimation.playState !== 'finished') {
      // currentPosition = extractTYValue(getComputedStyle(this._contentLayer.DOMRoot).transform);
      currentPosition = this._currentAnimatedPosition;
      this._scrollAnimation.cancel();
    }

    const fromPosition = fromOffset !== undefined 
      ? -fromOffset
      : currentPosition || this._previousPosition;

    this._previousKeyframe.transform = `translateY(${fromPosition}px)`;
    this._nextKeyframe.transform = `translateY(${position}px)`;
    
    this._scrollAnimation = this._contentLayer.DOMRoot.animate(
      [ this._previousKeyframe, this._nextKeyframe ],
      this._animationOptions,
    );

    this._scrollAnimation.currentTime = 1;
    this._previousPosition = position;
    this._currentAnimatedPosition = fromPosition;

    return this._scrollAnimation.finished.then(
      this._observeContentLayer,
      this._observeContentLayer,
    );
  }

  getContentPostion(): number {
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