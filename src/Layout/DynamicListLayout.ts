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
  ScrollDirection,
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

export default class DynamicListLayout {
  private _overscanHeight: number;
  private _eventBus: IEventEmitter<IEventMap> | null = null;
  private _store: IItemStore<IItem> | null = null;
  private _scrollableContainer: ScrollableContainer;
  private _renderedIndexRegistry = new WeakMap<Element, number>();
  private _renderedItemsRegistry = new Map<number, Element>();
  private _minItemHeight = document.documentElement.clientHeight;
  private _maxItemHeight = 0;
  private _previousDirection: ScrollDirection | '' = '';
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

  private _renderRange(startIndex: number, endIndex: number, direction: ScrollDirection) {
    console.log('_renderRange', startIndex, endIndex, direction)
    if (startIndex > endIndex) console.error('_renderRange', startIndex, endIndex, direction);

    const store = this._store;
    const scrollableContainer = this._scrollableContainer;
    const renderedIndeces = this._renderedIndexRegistry;
    const renderedItems = this._renderedItemsRegistry;
    const fragment = document.createDocumentFragment();

    if (!store) return;

    for (let idx = startIndex; idx <= endIndex; idx++) {
      const item = store.getByIndex(idx);

      if (item) {
        const element = item.render(item.data);

        fragment.append(element);
        renderedIndeces.set(element, idx);
        renderedItems.set(idx, element);
      }
    }

    if (direction === 'down') {
      scrollableContainer.appendItem(fragment);
    }
    else if (direction === 'up') {
      scrollableContainer.prependItem(fragment);
    }
  }

  private _removeRange(startIndex: number, endIndex: number): number {
    const itemsToRemove: Element[] = [];
    const renderedIndeces = this._renderedIndexRegistry;
    const renderedItems = this._renderedItemsRegistry;
    let startRange = Infinity;
    let endRange = 0;

    for (let idx = startIndex; idx <= endIndex; idx++) {
      const itemToRemove = renderedItems.get(idx); 

      if (itemToRemove) {
        const { offsetTop, offsetHeight } = itemToRemove as HTMLElement;

        startRange = Math.min(startRange, offsetTop);
        endRange = Math.max(endRange, offsetTop + offsetHeight);

        itemsToRemove.push(itemToRemove);
        renderedItems.delete(idx);
        renderedIndeces.delete(itemToRemove);
      }
    }

    const itemsCount = itemsToRemove.length;

    for (let idx = 0; idx < itemsCount; idx++) {
      itemsToRemove[idx]!.remove();
    }

    console.log('_removeItems startIndex:', startIndex, 'endIndex:', endIndex, 'removedHeight:', endRange > startRange ? endRange - startRange : 0);

    return endRange > startRange ? endRange - startRange : 0;
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

  private _detectScrollAnchorItemOffset(item: Element, direction: ScrollDirection) {
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

  private _getRenderedBoundaryIndex(boundary: 'first' | 'last'): number | undefined {
    const renderedItem = boundary === 'first'
      ? this._scrollableContainer.getFirstItem()
      : boundary === 'last'
        ? this._scrollableContainer.getLastItem()
        : null;

    if (!renderedItem) return;

    return this._renderedIndexRegistry.get(renderedItem);
  }

  private _renderItems = (scrollTop: number, direction: ScrollDirection) => {
    const scrollableContainer = this._scrollableContainer;
    const overscanHeight = this._overscanHeight;

    scrollableContainer.refresh();

    // prevents layout shift in Firefox
    // if (this._previousDirection !== direction) {
    //   scrollableContainer.setTopSpacerHeight(scrollableContainer.getTopSpacerHeight());
    //   scrollableContainer.setBottomSpacerHeight(scrollableContainer.getBottomSpacerHeight());
    //   this._previousDirection = direction;
    //   return;
    // }

    for (const item of scrollableContainer.getItems()) {
      
      // update min and max item height
      this._updateItemHeightBounds(item);

      this._detectScrollAnchorItemOffset(item, direction);
    }

    // calculate index range to be rendered
    const viewportHeight = scrollableContainer.getViewportHeight();
    const halfViewportHeight = viewportHeight / 2;
    const rangeToFill = halfViewportHeight + overscanHeight;
    const middleIndex = this._getItemIndexByScrollTop();
    const firstRenderedIndex = this._getRenderedBoundaryIndex('first');
    const lastRenderedIndex = this._getRenderedBoundaryIndex('last');

    let renderStartIndex = Math.ceil(middleIndex - rangeToFill / this._minItemHeight);
    let renderEndIndex = Math.ceil(middleIndex + rangeToFill / this._minItemHeight);

    let removeStartIndex = firstRenderedIndex;
    let removeEndIndex = lastRenderedIndex;
    let removedHeight = 0;

    if (direction === 'down') {
      const isFastScroll = scrollableContainer.getBottomSpacerTop() < scrollTop;

      if (removeStartIndex !== undefined && lastRenderedIndex !== undefined) {
        removeEndIndex = Math.min(renderStartIndex - 1, lastRenderedIndex);
        renderStartIndex = Math.max(lastRenderedIndex + 1, renderStartIndex);
       
        if (removeStartIndex < removeEndIndex) {
          removedHeight = this._removeRange(removeStartIndex, removeEndIndex);
        }
      }

      if (isFastScroll) {
        console.warn('Fast scroll down.');
        scrollableContainer.setTopSpacerHeight(scrollTop - overscanHeight);
        scrollableContainer.setBottomSpacerHeight('auto');
      }
      else {
        scrollableContainer.setTopSpacerHeight(scrollableContainer.getTopSpacerHeight() + removedHeight);
        scrollableContainer.setBottomSpacerHeight('auto');
      }
    }
    else if (direction === 'up') {
      const isFastScroll = scrollableContainer.getTopSpacerBottom() > scrollTop + viewportHeight;

      if (removeEndIndex !== undefined && firstRenderedIndex !== undefined) {
        removeStartIndex = Math.max(renderEndIndex + 1, firstRenderedIndex);
        renderEndIndex = Math.min(firstRenderedIndex - 1, renderEndIndex);
       
        console.log('remove:', removeStartIndex, removeEndIndex)
        if (removeStartIndex < removeEndIndex) {
          removedHeight = this._removeRange(removeStartIndex, removeEndIndex);
        }
      }
    
      if (isFastScroll) {
        console.warn('Fast scroll up.');
        scrollableContainer.setTopSpacerHeight('auto');
        scrollableContainer.setBottomSpacerHeight(scrollableContainer.getScrollCanvasHeight() - (scrollTop + viewportHeight + overscanHeight));
      }
      else {
        scrollableContainer.setTopSpacerHeight('auto');
        scrollableContainer.setBottomSpacerHeight(scrollableContainer.getBottomSpacerHeight() + removedHeight);
      }
    }

    if (renderStartIndex < renderEndIndex) {
      this._renderRange(renderStartIndex, renderEndIndex, direction);
    }
  };

  private _adjustScrollbarThumb = (viewportTop: number, direction: ScrollDirection) => {
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

  private _getScrollAnchorItemPosition(): number | null {
    const scrollableContainer = this._scrollableContainer;
    const renderedItems = this._renderedItemsRegistry;
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
    const renderedItem1 = renderedItems.get(index1) as HTMLElement | undefined;
    const renderedItem2 = renderedItems.get(index2) as HTMLElement | undefined || renderedItem1;
    const indexFraction = fractionalIndex - index1;

    if (!renderedItem1 || !renderedItem2) {
      console.error('Missing items for interpolation', index1, index2);
      return null;
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

  private _scrollContent = (scrollTop: number, direction: ScrollDirection, scrollDelta: number) => {

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