/**
 * @fileoverview Scrollable container encapsulates all DOM parts necessary for virtual scroll
 * @license MIT
 * @author Alexandr Kalabin
 */

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
  private _animationOptions: KeyframeAnimationOptions = { duration: 4, fill: 'forwards', playbackRate: 1, easing: 'cubic-bezier(0, 0.49, 0.03, 0.42)' };
  private _previousKeyframe: Keyframe = { transform: 'translateY(0)', composite: 'replace', offset: 0 };
  private _nextKeyframe: Keyframe = { transform: 'translateY(0)', composite: 'replace', offset: 1 }; 

  constructor(container: HTMLElement) {
    this._container = container;
    this._scrollHeightFiller = new DOMConstructor(container, [classes.scrollHeightFiller]);
    this._viewportContainer = new DOMConstructor(container, [classes.viewportContainer]);
    this._contentLayer = new DOMConstructor(this._viewportContainer.DOMRoot, [classes.contentLayer]);
    this._container.classList.add(classes.scrollableContainer);
    this._scrollAnimation = this._contentLayer.DOMRoot.animate({ transform: `translateY(0)`});
  }

  setScrollHeight(scrollHeight: number) {
    this._scrollHeightFiller.setHeight(scrollHeight);
    this._contentLayer.setHeight(scrollHeight);
  }

  onScroll(cb: EventListener) {
    this._container.addEventListener('scroll', cb);
  }

  updateContentPosition(offset: number, fromOffset?: number): Promise<Animation> {

    const position = -offset;
  
    let currentPosition: number | null = null;

    if (this._scrollAnimation.playState !== 'finished') {
      currentPosition = extractTYValue(getComputedStyle(this._contentLayer.DOMRoot).transform);
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

    return this._scrollAnimation.finished;
  }

  appendItem(item: HTMLElement) {
    this._contentLayer.DOMRoot.appendChild(item);
  }

  clear() {
    const contentLayer = this._contentLayer.DOMRoot;

    while(contentLayer.firstChild) {
      contentLayer.firstChild.remove();
    }
  }
}