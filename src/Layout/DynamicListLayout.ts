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
  private _overscanHeight: number;
  private _eventBus: IEventEmitter<IEventMap> | null = null;
  private _store: IItemStore<IItem> | null = null;
  private _scrollableContainer: ScrollableContainer;
  private _renderedIndexRegistry = new WeakMap<Element, number>();
  private _minItemHeight = document.documentElement.clientHeight;
  private _maxItemHeight = 0;
  private _previousDirection: 'down' | 'up' = 'down';
  private _ignoreThumbAdjustment = false;

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

  private _renderRange(startIndex: number, endIndex: number, direction: 'down' | 'up') {
    console.log('_renderRange', startIndex, endIndex)
    const store = this._store;
    const scrollableContainer = this._scrollableContainer;
    const renderedItems = this._renderedIndexRegistry;
    const fragment = document.createDocumentFragment();

    if (!store) return;

    for (let idx = startIndex; idx <= endIndex; idx++) {
      const item = store.getByIndex(idx);

      if (item) {
        const element = item.render(item.data);

        // scrollableContainer.appendItem(element);
        fragment.append(element);
        renderedItems.set(element, idx);
      }
    }

    if (direction === 'down') {
      scrollableContainer.appendItem(fragment);
    }
    else if (direction === 'up') {
      scrollableContainer.prependItem(fragment);
    }
  }

  private _updateVisibleItems = () => {
    console.log('_updateVisibleItems')
    const scrollableContainer = this._scrollableContainer;
    const viewportHeight = scrollableContainer.getViewportHeight();
    const overscanHeight = this._overscanHeight;

    const startIndex = this._getItemIndexByScrollTop(-overscanHeight);
    const endIndex = startIndex + Math.ceil((viewportHeight + overscanHeight * 2) / this._getAvgItemHeight());

    scrollableContainer.setTopSpacerHeight(scrollableContainer.getViewportTop());
    scrollableContainer.setBottomSpacerHeight('auto');
    scrollableContainer.clear();

    this._renderRange(startIndex, endIndex, 'down');
  };

  private _scheduleVisibleItemsUpdate = new RAFScheduler().schedule(this._updateVisibleItems);

  private _getItemsToBeRemoved(direction: 'down' | 'up') {
    const scrollableContainer = this._scrollableContainer;
    const viewportTop = scrollableContainer.getViewportTop();
    const viewportHeight = scrollableContainer.getViewportHeight();
    const overscanHeight = this._overscanHeight;
    const items = scrollableContainer.getItems();
    const itemsToRemove: Element[] = [];

    let removedRangeStart = Infinity;
    let removedRangeEnd = 0;

    for (const item of items) {
      const itemTop = (item as HTMLElement).offsetTop;
      const itemHeight = (item as HTMLElement).offsetHeight;
      const isItemLeftOverscan = direction === 'down' 
        ? itemTop + itemHeight < viewportTop - overscanHeight
        : direction === 'up'
          ? itemTop > viewportTop + viewportHeight + overscanHeight
          : false;

      if (isItemLeftOverscan) {
        removedRangeStart = Math.min(removedRangeStart, itemTop);
        removedRangeEnd = Math.max(removedRangeEnd, itemTop + itemHeight);
        itemsToRemove.push(item);
      }
    }

    const removedHeight = removedRangeEnd - removedRangeStart;

    return { itemsToRemove, removedHeight };
  }

  private _renderItems = (scrollTop: number, direction: 'down' | 'up') => {
    const scrollableContainer = this._scrollableContainer;
    const renderedItems = this._renderedIndexRegistry;
    const viewportTop = scrollableContainer.getViewportTop();
    const viewportHeight = scrollableContainer.getViewportHeight();
    const bottomSpacerTop = scrollableContainer.getBottomSpacerTop();
    const topSpacerBottom = scrollableContainer.getTopSpacerBottom();
    const overscanHeight = this._overscanHeight;
    const { itemsToRemove, removedHeight } = this._getItemsToBeRemoved(direction);

    // prevents layout shift in firefox
    if (this._previousDirection !== direction) {
      scrollableContainer.setTopSpacerHeight(scrollableContainer.getTopSpacerHeight());
      scrollableContainer.setBottomSpacerHeight(scrollableContainer.getBottomSpacerHeight());
      this._previousDirection = direction;
      return;
    }

    if (direction === 'down') {
      const isFastScrolling =  bottomSpacerTop < viewportTop + viewportHeight / 2;

      if (isFastScrolling) {
        console.error('fast scroll down');
      }
      else {
        const isOverscanReached =  bottomSpacerTop < viewportTop + viewportHeight + overscanHeight;
        const lastItem = scrollableContainer.getLastItem();
        
        scrollableContainer.setTopSpacerHeight(scrollableContainer.getTopSpacerHeight() + removedHeight);
        scrollableContainer.setBottomSpacerHeight('auto');

        // add items
        if (lastItem && isOverscanReached) {
          const lastIndex = renderedItems.get(lastItem);

          if (lastIndex !== undefined) {
            const startIndex = lastIndex + 1;
            const endIndex = startIndex + Math.ceil(overscanHeight / this._minItemHeight);

            this._renderRange(startIndex, endIndex, direction);
          }
        }
      }
    }
    else if (direction === 'up') {
      const isFastScrolling = topSpacerBottom > viewportTop + viewportHeight / 2;

      if (isFastScrolling) {
        console.error('fast scroll up');
      }
      else {
        const isOverscanReached = topSpacerBottom > viewportTop - overscanHeight;
        const firstItem = scrollableContainer.getFirstItem();
        
        scrollableContainer.setBottomSpacerHeight(scrollableContainer.getBottomSpacerHeight() + removedHeight);
        scrollableContainer.setTopSpacerHeight('auto');

        // add items
        if (firstItem && isOverscanReached) {
          const firstIndex = renderedItems.get(firstItem);

          if (firstIndex !== undefined) {
            const endIndex = firstIndex - 1;
            const startIndex = endIndex - Math.ceil(overscanHeight / this._minItemHeight);

            this._renderRange(startIndex, endIndex, direction);
          }
        }
      }
    }

    for (const item of itemsToRemove) {
      item.remove();
      renderedItems.delete(item);
    }
  };

  private _adjustScrollbarThumb = (_: number, direction: 'down' | 'up') => {
    if (this._ignoreThumbAdjustment) {
      this._ignoreThumbAdjustment = false;
      return;
    }

    const scrollableContainer = this._scrollableContainer;
    const viewportTop = scrollableContainer.getViewportTop();
    const viewportHeight = scrollableContainer.getViewportHeight();
    const scrollHeight = scrollableContainer.getScrollHeight();
    const clientHeight = scrollableContainer.getClientHeight();
    const items = scrollableContainer.getItems();
    const offsetAnchor = direction === 'down' 
      ? viewportTop + viewportHeight
      : viewportTop;

    const store = this._store;

    if (!store) return;

    for (const item of items) {
      const { offsetTop, offsetHeight } = (item as HTMLElement);

      if (offsetTop <= offsetAnchor && offsetTop + offsetHeight >= offsetAnchor) {
        const itemIndex = this._renderedIndexRegistry.get(item);
        const fraction = (offsetAnchor - offsetTop) / offsetHeight;

        if (itemIndex !== undefined) {
          const indexRatio = (itemIndex + fraction) / (store.size - 1);
          const scrollTop = indexRatio * (scrollHeight - clientHeight);
          
          scrollableContainer.setScrollTop(scrollTop);
        }
      }
    }
  };

  private _scrollContent = (scrollTop: number, direction: 'down' | 'up') => {
    console.warn('_scrollContent')

    const scrollableContainer = this._scrollableContainer;
    const scrollHeight = scrollableContainer.getScrollHeight();
    const clientHeight = scrollableContainer.getClientHeight();
    const viewportHeight = scrollableContainer.getViewportHeight();
    const scrollCanvasHeight = scrollableContainer.getScrollCanvasHeight();
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);
    const viewportTop = scrollRatio * (scrollCanvasHeight - viewportHeight);

    scrollableContainer.scroll(viewportTop);

    this._ignoreThumbAdjustment = true;
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
    this._scrollableContainer.setScrollCanvasHeight(scrollHeight);

    console.log('_updateScrollHeight, minItemHeight:', this._minItemHeight, 'maxItemHeight:', this._maxItemHeight, 'avgHeight:', avgItemHeight, 'scrollHeight:', scrollHeight)
  };

  private _scheduleScrollHeightUpdate = new RAFScheduler().schedule(this._updateScrollHeight);

  constructor({ overscanHeight = 100, container }: DynamicListLayoutOptions) {
    this._scrollableContainer = new ScrollableContainer(container);
    this._overscanHeight = overscanHeight;
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

    this._eventBus.on('onContentScroll', this._adjustScrollbarThumb);
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