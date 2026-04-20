/**
 * @fileoverview Relays DOM scroll events to the shared event bus with position and direction metadata.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { IEventEmitter, IEventMap } from '../types/types';

export default class ScrollRelay {
  private _container: HTMLElement;
  private _previousScrollTop: number = 0;
  private _previousDirection: 'down' | 'up' = 'down'; // Keeping track of previous scroll direction prevents incorrect direction detection when scrollHeight changes during scrolling.
  private _eventBus: IEventEmitter<IEventMap> | null = null;
  private _eventType: 'onScroll' | 'onContentScroll' | null = null;
  private _ignoreNextScroll = false;

  private _emit = () => {
    if (this._ignoreNextScroll) {
      this._ignoreNextScroll = false;
      return;
    }

    const eventBus = this._eventBus;
    const eventType = this._eventType;
    const previousScrollTop = this._previousScrollTop;
    const scrollTop = this._container.scrollTop;

    if (!eventBus || !eventType) return;

    if (previousScrollTop < scrollTop) {
      const direction = 'down';

      // scrollHeight change protection
      if (this._previousDirection === direction) {
        eventBus.emit(eventType, scrollTop, direction);
      }

      this._previousDirection = direction;
    }
    else if (previousScrollTop > scrollTop) {
      const direction = 'up';

      // scrollHeight change protection
      if (this._previousDirection === direction) {
        eventBus.emit(eventType, scrollTop, direction);
      }

      this._previousDirection = direction;
    }

    this._previousScrollTop = scrollTop;
  };

  constructor(container: HTMLElement) {
    this._container = container;
    this._container.addEventListener('scroll', this._emit);
  }

  setScrollTop(scrollTop: number) {
    this._ignoreNextScroll = true;
    this._container.scrollTop = scrollTop;
  }

  attach(eventBus: IEventEmitter<IEventMap>, eventType: 'onScroll' | 'onContentScroll') {
    this._eventBus = eventBus;
    this._eventType = eventType;
  }
}
