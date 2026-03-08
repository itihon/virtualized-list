/**
 * @fileoverview FixedListRenderer renders items with pre-calculated offsets and sizes on scroll event.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { 
  IFixedItem,
  MeasuredItem,
  IItemStore, 
  ILifecycleHooks, 
  IRenderer, 
  IVirtualizedListHooks,
} from "../types/types";

export default class FixedListRenderer implements IRenderer {
  private _store: IItemStore<IFixedItem>;
  private _renderedElements: HTMLElement[] = []; // <-- this probably should be a Map()
  private _lastRenderedItem: MeasuredItem<IFixedItem> | null = null;
  private _firstRenderedItem: MeasuredItem<IFixedItem> | null = null;

  private _scrollHook: IVirtualizedListHooks['onScroll'] = (position, direction, speed) => {
    if (direction === 'down') {
      if (speed === 'slow') {
        // - will render one by one
        const lastItem = this._lastRenderedItem;

        if (lastItem) {
          // get range of items following the last rendered item
          this._store.getNext(lastItem);
        }
      }

      if (speed === 'fast') {
        const items = this._store.getByOffset(position);
      }
    }

    if (direction === 'up') {
      if (speed === 'slow') {
        // - will render one by one
        // getFirstRenderedItem() 

      }

      if (speed === 'fast') {

      }
    }
  }

  constructor(hooks: ILifecycleHooks, store: IItemStore<IFixedItem>) {
    this._store = store;
    hooks.on('onScroll', this._scrollHook);
  }

  getRenderedElements() {
    return this._renderedElements;
  }

  getContentPosition() {
    return { offset: 0, from: undefined };
  }
}