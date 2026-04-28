/**
 * @fileoverview DynamicListLayout measures unknown items' heights one frame before rendering. Items' heights depend on their content.
 * @license MIT
 * @author Alexandr Kalabin
 */

import type { 
  IItem, 
  IItemStore, 
  IEventEmitter,
  IEventMap,
} from "../types/types";
import ScrollableContainer from "../ScrollableContainer/ScrollableContainer";

type DynamicListLayoutOptions = { overscanHeight: number, container: HTMLElement };

type SchedulerFn = {
  (): void;
  done(cb: () => void): SchedulerFn;
};

function subtractRange(start1: number, end1: number, start2: number, end2: number, direction: 'down' | 'up') {
  // normalization in case start and end are swapped
  const min1 = Math.min(start1, end1);
  const max1 = Math.max(start1, end1);
  const min2 = Math.min(start2, end2);
  const max2 = Math.max(start2, end2);

  let start = 0;
  let end = 0;

  if (direction === 'down') {
    start = Math.max(max1, min2) === max1 ? max1 + 1 : min2;
    end = max2;
  }
  else if (direction === 'up') {
    start = min2;
    end = Math.min(min1, max2) === min1 ? min1 - 1 : max2;
  }

  if (end - start >= 0) {
    return { start, end };
  }

  return null;
}

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

class ItemsRemover {
  private _scrollableContainer: ScrollableContainer;
  private _itemsToRemove: Element[] = [];
  private _removedRangeStart = Infinity;
  private _removedRangeEnd = 0;
  private _overscanHeight: number = 0;
  private _direction: 'down' | 'up' = 'down';

  constructor(scrollableContainer: ScrollableContainer) {
    this._scrollableContainer = scrollableContainer;
  }

  init(direction: 'down' | 'up', overscanHeight: number = 0) {
    this._direction = direction;
    this._overscanHeight = overscanHeight;
    this._itemsToRemove.length = 0;
    this._removedRangeStart = Infinity;
    this._removedRangeEnd = 0;
  }

  check(item: Element) {
    const scrollableContainer = this._scrollableContainer;
    const viewportTop = scrollableContainer.getViewportTop();
    const viewportHeight = scrollableContainer.getViewportHeight();
    const overscanHeight = this._overscanHeight;

    const itemTop = (item as HTMLElement).offsetTop;
    const itemHeight = (item as HTMLElement).offsetHeight;
    const isItemLeftOverscan = this._direction === 'down' 
      ? itemTop + itemHeight < viewportTop - overscanHeight
      : this._direction === 'up'
        ? itemTop > viewportTop + viewportHeight + overscanHeight
        : false;

    if (isItemLeftOverscan) {
      this._removedRangeStart = Math.min(this._removedRangeStart, itemTop);
      this._removedRangeEnd = Math.max(this._removedRangeEnd, itemTop + itemHeight);
      this._itemsToRemove.push(item);
    }
  }

  getRemovedHeight(): number {
    return this._removedRangeEnd - this._removedRangeStart;
  }

  getItems(): Element[] {
    return this._itemsToRemove;
  }
}

export default class DynamicListLayout {
  private _overscanHeight: number;
  private _eventBus: IEventEmitter<IEventMap> | null = null;
  private _store: IItemStore<IItem> | null = null;
  private _scrollableContainer: ScrollableContainer;
  private _itemsRemover: ItemsRemover;
  private _renderedIndexRegistry = new WeakMap<Element, number>();
  private _minItemHeight = document.documentElement.clientHeight;
  private _maxItemHeight = 0;
  private _previousDirection: 'down' | 'up' | '' = '';
  private _scrollAnchorItemOffsetTop = 0;
  private _scrollAnchorItemOffsetHeight = 0;
  private _scrollAnchorItemIndex = 0;

  private _getScrollRatio(offset = 0): number {
    const scrollableContainer = this._scrollableContainer;
    const scrollTop = scrollableContainer.getScrollTop();
    const scrollHeight = scrollableContainer.getScrollHeight(); 
    const clientHeight = scrollableContainer.getClientHeight();
    
    // const scrollRatio = Math.min(Math.max(viewportTop + offset, 0) / Math.min(Math.max(scrollCanvasHeight - viewportHeight, 1), 0), 0) || 0;
    const scrollRatio = Math.max(scrollTop + offset, 0) / (scrollHeight - clientHeight) || 0;
    console.log('scrollRatio:', scrollRatio, 'offset:', offset, scrollTop, scrollHeight, clientHeight);

    return scrollRatio;
  }

  private _getItemIndexByScrollTop(offset = 0) {
    if (!this._store) return -1;

    const lastIndex = this._store.size - 1;

    return Math.min(Math.round(this._getScrollRatio(offset) * lastIndex), lastIndex);
  }

  private _renderRange(startIndex: number, endIndex: number, direction: 'down' | 'up') {
    console.log('_renderRange', startIndex, endIndex, direction)
    if (startIndex > endIndex) console.error('_renderRange', startIndex, endIndex, direction);

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

    const startIndex = this._getItemIndexByScrollTop();
    const endIndex = startIndex + Math.ceil((viewportHeight + overscanHeight) / this._getAvgItemHeight());

    scrollableContainer.clear();

    this._renderRange(startIndex, endIndex, 'down');
  };

  private _scheduleVisibleItemsUpdate = new RAFScheduler().schedule(this._updateVisibleItems);

  private _addSpareSpace(startIndex: number, endIndex: number) {
    const spareSpace = 1000;
    const store = this._store;
    const scrollableContainer = this._scrollableContainer;

    if (!store) return;

    if (startIndex > 0 && endIndex < store.size - 1) {
      const topSpacerHeight = scrollableContainer.getTopSpacerHeight();
      const bottomSpacerHeight = scrollableContainer.getBottomSpacerHeight(); 

      if (topSpacerHeight < spareSpace || bottomSpacerHeight < spareSpace) {
        console.warn('_addSpareSpace');
      
        scrollableContainer.setViewportTop(scrollableContainer.getViewportTop());
        scrollableContainer.setScrollCanvasHeight(scrollableContainer.getScrollCanvasHeight() + spareSpace);
      }
    }
  }

  private _cutBottomSpacer() {
    const scrollableContainer = this._scrollableContainer;
    const lastItem = scrollableContainer.getLastItem();
    const store = this._store;

    if (!store) return;

    if (lastItem) {
      const lastIndex = this._renderedIndexRegistry.get(lastItem);

      if (lastIndex === store.size - 1) {
        const scrollCanvasHeight = scrollableContainer.getScrollCanvasHeight();
        const bottomSpacerHeight = scrollableContainer.getBottomSpacerHeight();

        scrollableContainer.setBottomSpacerHeight(0);
        scrollableContainer.setScrollCanvasHeight(scrollCanvasHeight - bottomSpacerHeight);
        console.log('cut bottom spacer')
      }
    }
  }

  private _detectScrollAnchorItemOffset(item: Element, direction: 'down' | 'up') {
    const scrollableContainer = this._scrollableContainer;
    const viewportTop = scrollableContainer.getViewportTop();
    const viewportHeight = scrollableContainer.getViewportHeight();
    const offsetAnchor = direction === 'down' 
      ? viewportTop + viewportHeight
      : viewportTop;

    const { offsetTop, offsetHeight } = (item as HTMLElement);
    const itemIndex = this._renderedIndexRegistry.get(item);

    if (itemIndex === undefined) return;

    if (offsetTop <= offsetAnchor && offsetTop + offsetHeight >= offsetAnchor) {
      this._scrollAnchorItemOffsetTop = offsetTop;
      this._scrollAnchorItemOffsetHeight = offsetHeight;
      this._scrollAnchorItemIndex = itemIndex;
    }
  }

  private _getEdgeRenderedIndex(edge: 'first' | 'last'): number | undefined {
    const renderedItem = edge === 'first'
      ? this._scrollableContainer.getFirstItem()
      : edge === 'last'
        ? this._scrollableContainer.getLastItem()
        : null;

    if (!renderedItem) return;

    return this._renderedIndexRegistry.get(renderedItem);
  }

  private _renderItems = (scrollTop: number, direction: 'down' | 'up') => {
    const scrollableContainer = this._scrollableContainer;
    const itemsRemover = this._itemsRemover;
    const overscanHeight = this._overscanHeight;

    scrollableContainer.refresh();

    // prevents layout shift in Firefox
    if (this._previousDirection !== direction) {
      scrollableContainer.setTopSpacerHeight(scrollableContainer.getTopSpacerHeight());
      scrollableContainer.setBottomSpacerHeight(scrollableContainer.getBottomSpacerHeight());
      this._previousDirection = direction;
      return;
    }

    itemsRemover.init(direction, overscanHeight);

    for (const item of scrollableContainer.getItems()) {

      // update min and max item height
      this._updateItemHeightBounds(item);

      // find items to be removed
      // calculate removed height
      itemsRemover.check(item);

      this._detectScrollAnchorItemOffset(item, direction);
    }

    // calculate index range to be rendered
    const viewportHeight = scrollableContainer.getViewportHeight();

    if (scrollableContainer.getBottomSpacerTop() < scrollTop || scrollableContainer.getTopSpacerBottom() > scrollTop + viewportHeight) {
      // Fast scroll.

      console.error('Fast scroll.');
      const halfViewportHeight = viewportHeight / 2;
      const rangeToFill = halfViewportHeight + overscanHeight;
      const middleIndex = this._getItemIndexByScrollTop(halfViewportHeight);
      let startIndex = Math.ceil(middleIndex - rangeToFill / this._minItemHeight);
      let endIndex = Math.ceil(middleIndex + rangeToFill / this._minItemHeight);

      if (direction === 'down') {
        const lastRenderedIndex = this._getEdgeRenderedIndex('last');

        if (lastRenderedIndex !== undefined) {
          startIndex = Math.max(lastRenderedIndex + 1, startIndex);
        }

        scrollableContainer.setTopSpacerHeight(scrollTop - overscanHeight);
        scrollableContainer.setBottomSpacerHeight('auto');
      }
      else if (direction === 'up') {
        const firstRenderedIndex = this._getEdgeRenderedIndex('first');

        if (firstRenderedIndex !== undefined) {
          endIndex = Math.min(firstRenderedIndex - 1, endIndex);
        }

        scrollableContainer.setTopSpacerHeight('auto');
        scrollableContainer.setBottomSpacerHeight(scrollableContainer.getScrollCanvasHeight() - (scrollTop + viewportHeight + overscanHeight));
      }

      scrollableContainer.clear();
      this._renderRange(startIndex, endIndex, direction);
    }
    else {
      // Slow scroll, render from the last rendered item up to the overscan edge.

      if (direction === 'down') {
        const startOffset = scrollableContainer.getBottomSpacerTop();
        const endOffset = scrollTop + viewportHeight + overscanHeight;
        const rangeToFill = endOffset - startOffset;
        const lastRenderedIndex = this._getEdgeRenderedIndex('last');
       
        if (rangeToFill > 0 && lastRenderedIndex !== undefined) {
          const startIndex = lastRenderedIndex + 1;
          const endIndex = Math.ceil(startIndex + (rangeToFill) / this._minItemHeight);

          this._renderRange(startIndex, endIndex, direction);
        }

        scrollableContainer.setBottomSpacerHeight('auto');
        scrollableContainer.setTopSpacerHeight(scrollableContainer.getTopSpacerHeight() + itemsRemover.getRemovedHeight());
      }
      else if (direction === 'up') {
        const startOffset = scrollTop - overscanHeight;
        const endOffset = scrollableContainer.getTopSpacerBottom();
        const rangeToFill = endOffset - startOffset;
        const firstRenderedIndex = this._getEdgeRenderedIndex('first');

        if (rangeToFill > 0 && firstRenderedIndex !== undefined) {
          const endIndex = firstRenderedIndex - 1;
          const startIndex = Math.ceil(endIndex - (rangeToFill) / this._minItemHeight);
          
          this._renderRange(startIndex, endIndex, direction);
        }
        
        scrollableContainer.setTopSpacerHeight('auto');
        scrollableContainer.setBottomSpacerHeight(scrollableContainer.getBottomSpacerHeight() + itemsRemover.getRemovedHeight());
      }
      
      // remove items
      for (const item of itemsRemover.getItems()) {
        item.remove();
      }
    }
  };

  private _adjustScrollbarThumb = (viewportTop: number, direction: 'down' | 'up') => {
    const scrollableContainer = this._scrollableContainer;
    // const viewportTop = scrollableContainer.getViewportTop();
    const viewportHeight = scrollableContainer.getViewportHeight();
    const scrollHeight = scrollableContainer.getScrollHeight();
    const clientHeight = scrollableContainer.getClientHeight();
    // const items = scrollableContainer.getItems();
    const offsetAnchor = direction === 'down' 
      ? viewportTop + viewportHeight
      : viewportTop;

    const store = this._store;

    if (!store) return;

    const fraction = (offsetAnchor - this._scrollAnchorItemOffsetTop) / this._scrollAnchorItemOffsetHeight;

    console.log('_adjustScrollbarThumb scroll anchor item index:', this._scrollAnchorItemIndex)

    const indexRatio = (this._scrollAnchorItemIndex + fraction) / (store.size - 1);
    const scrollbarThumbPosition = indexRatio * (scrollHeight - clientHeight);
    
    scrollableContainer.setScrollTop(scrollbarThumbPosition);
  };

  private _findRenderedItemByIndex(index: number): Element | undefined {
    const renderedItems = this._scrollableContainer.getItems();
    const firstRenderedIndex = this._getEdgeRenderedIndex('first');

    if (firstRenderedIndex === undefined) return undefined;

    return renderedItems[index - firstRenderedIndex];
  }

  private _getScrollAnchorItemPosition(): number {
    const scrollableContainer = this._scrollableContainer;
    const totalItems = this._store?.size || 0;
    
    // scrollableContainer.refresh();

    // const scrollTop = scrollableContainer.getScrollTop();
    // const scrollHeight = scrollableContainer.getScrollHeight();
    const clientHeight = scrollableContainer.getClientHeight();
    // const scrollRatio = scrollTop / (scrollHeight - clientHeight) || 0;
    const scrollRatio = this._getScrollRatio();
    const lastIndex = totalItems - 1;
    const fractionalIndex = totalItems * scrollRatio;
    const index1 = Math.min(Math.floor(fractionalIndex), lastIndex);
    const index2 = Math.min(Math.ceil(fractionalIndex), lastIndex);
    const renderedItem1 = this._findRenderedItemByIndex(index1) as HTMLElement;
    const renderedItem2 = this._findRenderedItemByIndex(index2) as HTMLElement || renderedItem1;
    const indexFraction = fractionalIndex - index1;

    if (!renderedItem1 || !renderedItem2) {
      console.error('Missing items for interpolation', index1, index2);
      return 0;
    };

    const itemTop1 = renderedItem1.offsetTop;
    const itemTop2 = renderedItem2.offsetTop;
    const itemHeight1 = renderedItem1.offsetHeight;
    const interpolatedHeight = indexFraction * (itemTop2 - itemTop1) || itemHeight1 * indexFraction;
    const interpolatedTop = itemTop1 + interpolatedHeight;

    const viewportAnchor = clientHeight * scrollRatio;

    const position = interpolatedTop - viewportAnchor;

    console.log('_getScrollAnchorItemPosition', index1, index2)

    return position;
  }

  private _scrollContent = (scrollTop: number, direction: 'down' | 'up', scrollDelta: number) => {

    const scrollableContainer = this._scrollableContainer;

    // scrollableContainer.refresh();

    const scrollHeight = scrollableContainer.getScrollHeight();
    const clientHeight = scrollableContainer.getClientHeight();
    // const clientHeight = scrollableContainer.getClientHeight();
    const viewportHeight = scrollableContainer.getViewportHeight();
    const scrollCanvasHeight = scrollableContainer.getScrollCanvasHeight();
    const scrollRatio = this._getScrollRatio();
    // const viewportTop = this._getScrollAnchorItemPosition();
    const viewportTop = scrollRatio * (scrollCanvasHeight - viewportHeight);
    // const factor = (scrollCanvasHeight - viewportHeight) / (scrollHeight - clientHeight) || 1;
    // const viewportTop2 = scrollableContainer.getViewportTop() + scrollDelta * factor;

    // console.log('viewportTop:', viewportTop, 'viewportTop2:', viewportTop2);
    // scrollableContainer.scroll(viewportTop);
    scrollableContainer.setViewportTop(viewportTop);
    this._renderItems(viewportTop, direction);

    console.warn('_scrollContent scrollTop:', scrollTop, 'viewportTop:', viewportTop, 'scrollHeight:', scrollHeight, 'scrollCanvasHeight:', scrollCanvasHeight)
  };

  private _updateItemHeightRange = () => {
    const renderedItems = this._scrollableContainer.getItems(); 

    for (const item of renderedItems) {
      this._updateItemHeightBounds(item);
    }
  };
  
  private _scheduleItemHeightRangeUpdate = new RAFScheduler().schedule(this._updateItemHeightRange);

  private _updateItemHeightBounds(item: Element) {
    const itemHeight = (item as HTMLElement).offsetHeight;
    this._minItemHeight = Math.min(this._minItemHeight, itemHeight);
    this._maxItemHeight = Math.max(this._maxItemHeight, itemHeight);
  }

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
    this._itemsRemover = new ItemsRemover(this._scrollableContainer);
    this._overscanHeight = overscanHeight;
  }

  attach(eventBus: IEventEmitter<IEventMap>, store: IItemStore<IItem>) {
    this._eventBus = eventBus;
    this._store = store;
    this._scrollableContainer.attach(this._eventBus);

    const scheduleUpdate = this._scheduleVisibleItemsUpdate
      .done(this._scheduleItemHeightRangeUpdate)
      .done(
        this._scheduleScrollHeightUpdate.done(
          () => this._scrollableContainer.refresh()
        )
      );

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
}