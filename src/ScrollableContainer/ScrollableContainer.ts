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
  private _scrolledPane: DOMConstructor;
  private _viewportContainer: DOMConstructor;
  private _scrollAnimation: Animation;
  private _previousPosition = 0;

  constructor(container: HTMLElement) {
    this._container = container;
    this._scrollHeightFiller = new DOMConstructor(container, [classes.scrollHeightFiller]);
    this._viewportContainer = new DOMConstructor(container, [classes.viewportContainer]);
    this._scrolledPane = new DOMConstructor(this._viewportContainer.DOMRoot, [classes.scrolledPane]);
    this._container.classList.add(classes.scrollableContainer);
    this._scrollAnimation = this._scrolledPane.DOMRoot.animate({ transform: `translateY(0)`}, { fill: 'forwards' });
  }

  setScrollHeight(scrollHeight: number) {
    this._scrollHeightFiller.setHeight(scrollHeight);
    this._scrolledPane.setHeight(scrollHeight);
  }

  onScroll(cb: EventListener) {
    this._container.addEventListener('scroll', cb);
  }

  moveScrolledPane(position: number) {

    const duration = 4;
    const easing = 'cubic-bezier(0.33, 0.66, 0.66, 1)';
  
    let currentPosition: number | null = null;

    if (this._scrollAnimation.playState !== 'finished') {
      currentPosition = extractTYValue(getComputedStyle(this._scrolledPane.DOMRoot).transform);
      this._scrollAnimation.cancel();
    }
    
    this._scrollAnimation = this._scrolledPane.DOMRoot.animate(
      [
        { transform: `translateY(${currentPosition || this._previousPosition}px)`, composite: 'replace', offset: 0 }, 
        { transform: `translateY(${position}px)`, composite: 'replace', offset: 1 }, 
      ],
      { duration, fill: 'forwards', playbackRate: 1, easing },
    );

    this._scrollAnimation.currentTime = 1;
    this._previousPosition = position;
  }

  appendItem(item: HTMLElement) {
    this._scrolledPane.DOMRoot.appendChild(item);
  }
}