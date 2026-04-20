/**
 * @fileoverview DynamicListLayout measures unknown items' heights one frame before rendering. Items' heights depend on their content.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { 
  IDynamicListLayout, 
  IItem, 
  IItemStore, 
  IMeasurerEvents,
  IEventEmitter,
  IEventMap,
} from "../types/types";
import ScrollableContainer from "../ScrollableContainer/ScrollableContainer";
import { scrollableContainer } from "../ScrollableContainer/ScrollableContainer.module.css";

type DynamicListLayoutOptions = { overscanHeight: number, container: HTMLElement };

type SchedulerFn = {
  (): void;
  done(cb: () => void): SchedulerFn;
};

class RAFScheduler {
  private _rAFid: number | null = null;
  private _doneCBs: (() => void)[] = [];
  private _fn = () => {};
  private _call = (cb: () => void) => cb();

  private _wrapper = () => {
    this._fn();
    this._doneCBs.forEach(this._call);
    this._rAFid = null;
  };

  private _scheduler = (() => {
    if (this._rAFid === null) {
      this._rAFid = requestAnimationFrame(this._wrapper);
    }
  }) as SchedulerFn;

  private _done = (cb: () => void) => {
    this._doneCBs.push(cb);
    return this._scheduler;
  };

  constructor() {
    this._scheduler = Object.assign(this._scheduler, { done: this._done });
  }

  schedule = (fn: () => void) => {
    this._fn = fn;
    return this._scheduler;
  };
}

export default class DynamicListLayout implements IDynamicListLayout {
  private _container: HTMLElement;
  private _overscanHeight: number;
  private _eventBus: IEventEmitter<IEventMap> | null = null;
  private _store: IItemStore<IItem> | null = null;
  private _scrollableContainer: ScrollableContainer;
  private _renderedIndexRegistry = new WeakMap<Element, number>();
  private _scheduledUpdate = 0;
  private _minItemHeight = document.documentElement.clientHeight;
  private _maxItemHeight = 0;

  private _getScrollRatio(offset = 0): number {
    const scrollableContainer = this._scrollableContainer;
    const scrollTop = scrollableContainer.getScrollTop();
    const scrollHeight = scrollableContainer.getScrollHeight(); 
    const clientHeight = scrollableContainer.getClientHeight();
    
    const scrollRatio = Math.min(Math.max(scrollTop + offset, 0) / Math.min(Math.max(scrollHeight - clientHeight, 1), 0), 0) || 0;

    console.log('scrollRatio:', scrollRatio, 'offset:', offset);

    return scrollRatio;
  }

  private _getItemIndexByScrollTop(offset = 0) {
    if (!this._store) return -1;

    const lastIndex = this._store.size - 1;

    return Math.min(Math.ceil(this._getScrollRatio(offset) * lastIndex), lastIndex);
  }

  private _updateVisibleItems = () => {
    console.log('_updateVisibleItems')
    const store = this._store;
    const renderedItems = this._renderedIndexRegistry;
    const scrollableContainer = this._scrollableContainer;
    const clientHeight = scrollableContainer.getClientHeight();
    const overscanHeight = this._overscanHeight;

    const startIndex = this._getItemIndexByScrollTop(-overscanHeight);
    const endIndex = startIndex + Math.ceil((clientHeight + overscanHeight * 2) / this._getAvgItemHeight());

    if (!store) return;

    scrollableContainer.clear();
    
    for (let idx = startIndex; idx <= endIndex; idx++) {
      const item = store.getByIndex(idx);

      if (item) {
        const element = item.render(item.data);

        // renderedItems.set(element, idx);
        scrollableContainer.appendItem(element);
      }
    }
  };

  private _scheduleVisibleItemsUpdate = new RAFScheduler().schedule(this._updateVisibleItems);

  private _renderItems = (scrollTop: number, direction: 'down' | 'up') => {

  };

  private _scrollContent = (scrollTop: number, direction: 'down' | 'up') => {

  };

  private _updateItemHeightRange = () => {
    const renderedItems = this._scrollableContainer.getItems(); 

    for (const item of renderedItems) {
      const itemHeight = (item as HTMLElement).offsetHeight;
      this._minItemHeight = Math.min(this._minItemHeight, itemHeight);
      this._maxItemHeight = Math.max(this._maxItemHeight, itemHeight);
    }

    console.log('_updateItemHeightRange minItemHeight:', this._minItemHeight, 'maxItemHeight:', this._maxItemHeight)
  };
  
  private _scheduleItemHeightRangeUpdate = new RAFScheduler().schedule(this._updateItemHeightRange);

  private _getAvgItemHeight() {
    return (this._minItemHeight + this._maxItemHeight) / 2;
  }

  private _updateScrollHeight = () => {
    const avgItemHeight = this._getAvgItemHeight();
    const scrollHeight = avgItemHeight * (this._store?.size || 0);
    this._scrollableContainer.setScrollHeight(scrollHeight);

    console.log('_updateScrollHeight, minItemHeight:', this._minItemHeight, 'maxItemHeight:', this._maxItemHeight, 'avgHeight:', avgItemHeight, 'scrollHeight:', scrollHeight)
  };

  private _scheduleScrollHeightUpdate = new RAFScheduler().schedule(this._updateScrollHeight);

  constructor({ overscanHeight = 100, container }: DynamicListLayoutOptions) {
    this._scrollableContainer = new ScrollableContainer(container);
    this._overscanHeight = overscanHeight;
    this._container = container;
  }

  attach(eventBus: IEventEmitter<IEventMap>, store: IItemStore<IItem>) {
    this._eventBus = eventBus;
    this._store = store;
    this._scrollableContainer.attach(this._eventBus);

    const scheduleUpdate = this._scheduleVisibleItemsUpdate
      .done(this._scheduleItemHeightRangeUpdate)
      .done(this._scheduleScrollHeightUpdate);

    this._eventBus.on('onInsert', scheduleUpdate);
    this._eventBus.on('onDelete', scheduleUpdate);
    this._eventBus.on('onResize', scheduleUpdate);

    this._eventBus.on('onContentScroll', this._renderItems);
    this._eventBus.on('onScroll', this._scrollContent);

    console.log('attached')
  } 

  detach() {
  }

  // remove the following methods
  onMeasureStart(cb: IMeasurerEvents['onMeasureStart']) {
    this._eventBus?.on('onMeasureStart', cb);
  }

  onMeasureEnd(cb: IMeasurerEvents['onMeasureEnd']) {
    this._eventBus?.on('onMeasureEnd', cb);
  }

  onPortionMeasured(cb: IMeasurerEvents['onPortionMeasured']) {
    this._eventBus?.on('onPortionMeasured', cb);
  }

  onItemsReady(cb: IMeasurerEvents['onItemsReady']) {
    this._eventBus?.on('onItemsReady', cb);
  }
}