/**
 * @fileoverview Scrollable container encapsulates all DOM parts necessary for virtual scroll
 * @license MIT
 * @author Alexandr Kalabin
 */

import DOMConstructor from './DOMConstructor';
import classes from './ScrollableContainer.module.css';

export default class ScrollableContainer {
  public _container: HTMLElement;
  public _scrollHeightFiller: DOMConstructor;
  public _scrolledPane: DOMConstructor;
  public _viewportContainer: DOMConstructor;

  constructor(container: HTMLElement) {
    this._container = container;
    this._scrollHeightFiller = new DOMConstructor(container, [classes.scrollHeightFiller]);
    this._viewportContainer = new DOMConstructor(container, [classes.viewportContainer]);
    this._scrolledPane = new DOMConstructor(this._viewportContainer.DOMRoot, [classes.scrolledPane]);
    this._container.classList.add(classes.scrollableContainer);
  }

  setScrollHeight(scrollHeight: number) {
    this._scrollHeightFiller.setHeight(scrollHeight);
    this._scrolledPane.setHeight(scrollHeight);
  }
}