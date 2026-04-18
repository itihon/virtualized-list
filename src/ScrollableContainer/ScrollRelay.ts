/**
 * @fileoverview Relays DOM scroll events to the shared event bus with position and direction metadata.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { IEventEmitter, IEventMap } from '../types/types';

export default class ScrollRelay {
  private _container: HTMLElement;
  private _previousScrollTop: number = 0;
  private _eventBus: IEventEmitter<IEventMap>;
  private _eventType: 'onScroll' | 'onContentScroll';
  private _ignoreNextScroll = false;

  private _emit = () => {
    if (this._ignoreNextScroll) {
      this._ignoreNextScroll = false;
      return;
    }

    const previousScrollTop = this._previousScrollTop;
    const scrollTop = this._container.scrollTop;

    if (previousScrollTop < scrollTop) {
      this._eventBus.emit(this._eventType, scrollTop, 'down');
    }
    else if (previousScrollTop > scrollTop) {
      this._eventBus.emit(this._eventType, scrollTop, 'up');
    }

    this._previousScrollTop = scrollTop;
  };

  constructor(container: HTMLElement, eventBus: IEventEmitter<IEventMap>, eventType: 'onScroll' | 'onContentScroll') {
    this._container = container;
    this._eventBus = eventBus;
    this._eventType = eventType;

    this._container.addEventListener('scroll', this._emit);
  }

  setScrollTop(scrollTop: number) {
    this._ignoreNextScroll = true;
    this._container.scrollTop = scrollTop;
  }
}
