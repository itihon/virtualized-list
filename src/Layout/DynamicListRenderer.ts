/**
 * @fileoverview DynamicListRenderer renders items with measured offsets.
 * @license MIT
 * @author Alexandr Kalabin
 */

import ScrollableContainer from "../ScrollableContainer/ScrollableContainer";
import DynamicListMeasurer from "./DynamicListMeasurer";
import isRangeIntersecting from "./isRangeIntersecting";
import isStrictlyNestedRange from "./isStrictlyNestedRange";
import type { 
  IItem,
  IItemStore, 
  IEventEmitter,
  IEventMap,
  IMeasurerEvents,
  MeasurementRange,
} from "../types/types";
import getNonNestedRangeDifference from "./getNonNestedRangeDifference";

type DynamicListRendererOptions = {
  container: HTMLElement; 
  eventBus: IEventEmitter<IEventMap>; 
  store: IItemStore<IItem>; 
  overscanHeight: number;
};

export default class DynamicListRenderer {
  private _container: HTMLElement;
  private _measurer: DynamicListMeasurer;
  private _store: IItemStore<IItem>;
  private _overscanHeight: number;
  private _scrollableContainer: ScrollableContainer;
  private _scheduledSetScrollHeight = 0;
  private _renderedItemsRegistry = new Map<number, HTMLElement>();
  private _scheduledToRemove: { start: number | null, end: number | null } = { start: null, end: null };

  private get _renderedRange(): MeasurementRange {
    const scrollableContainer = this._scrollableContainer;
    const firstRenderedElement = scrollableContainer.getFirstItem() as HTMLElement | null;
    const lastRenderedElement = scrollableContainer.getLastItem() as HTMLElement | null;
    const startIndex = Number(firstRenderedElement?.dataset.index) || 0;
    const endIndex = Number(lastRenderedElement?.dataset.index) || 0;
    const startOffset = Number(firstRenderedElement?.dataset.top) || 0;
    const endOffset = Number(lastRenderedElement?.dataset.top) + Number(lastRenderedElement?.dataset.height) || 0;
    const total = endIndex ? endIndex + 1 - startIndex : 0;
    const totalHeight = endOffset - startOffset;

    return {
      startIndex,
      endIndex,
      startOffset,
      endOffset,
      total,
      totalHeight,
    };
  }

  private _assignStyles(element: HTMLElement, width: number, height: number, offsetTop: number) {
    if (element && element.style) {
      Object.assign(element.style, {
        position: 'absolute',
        height: `${height}px`,
        width: `${width}px`,
        top: `${offsetTop}px`,
      });

      element.dataset.top = offsetTop as unknown as string;
      element.dataset.height = height as unknown as string;
    }
  }

  private _getItemIndex(element: HTMLElement): number {
    const itemIndex = Number(element.dataset.index);

    if (Number.isNaN(itemIndex)) throw new Error('Expected item index to be assigned as a data property.');

    return itemIndex;
  }

  // private _findRenderedItemByIndex(absoluteIndex: number): Element | null {
  //   const relativeIndex = absoluteIndex - this._renderedRange.startIndex;
  //   return this._scrollableContainer.getItemByIndex(relativeIndex);
  // }

  private _getCalculatedIndex(edge: 'start' | 'end'): number {
    const minItemHeight = this._measurer.getMinItemHeight();
    const scrollRatio = this._getScrollRatio();
    const clientHeight = this._scrollableContainer.getClientHeight();  
    const indexByScrollTop = this._getItemIndexByScrollTop();
    const overscanHeight = this._overscanHeight;
    const lastIndex = this._store.size - 1;

    console.log('index by scrollTop:', indexByScrollTop);

    if (edge === 'start') {
      const startIndex = indexByScrollTop - (scrollRatio * clientHeight + overscanHeight) / minItemHeight;
      // const startIndex = indexByScrollTop - (scrollRatio * clientHeight + overscanHeight / 2) / minItemHeight;
      return Math.max(Math.floor(startIndex), 0);
    }
    else if (edge === 'end') {
      const endIndex = indexByScrollTop + (clientHeight - scrollRatio * clientHeight + overscanHeight) / minItemHeight;
      // const endIndex = indexByScrollTop + (clientHeight - scrollRatio * clientHeight + overscanHeight / 2) / minItemHeight;
      return Math.min(Math.ceil(endIndex), lastIndex);
    }
    else {
      return 0;
    }
  }

  private _getScrollRatio(offset = 0): number {
    const scrollableContainer = this._scrollableContainer;
    const scrollTop = scrollableContainer.getScrollTop();
    const scrollHeight = scrollableContainer.getScrollHeight(); 
    const clientHeight = scrollableContainer.getClientHeight();
    return Math.min((Math.max(scrollTop + offset, 0)) / (scrollHeight - clientHeight), 1) || 0;
  }

  // !!! code duplication in DynamicListLayout
  private _getItemIndexByScrollTop(offset = 0) {
    if (!this._container || !this._store) return 0;

    const lastIndex = this._store.size - 1;

    return Math.min(Math.ceil(this._getScrollRatio(offset) * lastIndex), lastIndex);
  }

  private _calculateContentPosition(): number {
    const scrollRatio = this._getScrollRatio();
    const totalItems = this._store.size;

    if (!totalItems) return 0;

    const lastIndex = totalItems - 1;
    const fractionalIndex = totalItems * scrollRatio;
    const index1 = Math.min(Math.floor(fractionalIndex), lastIndex);
    const index2 = Math.min(Math.ceil(fractionalIndex), lastIndex);
    // const renderedItem1 = this._findRenderedItemByIndex(index1) as HTMLElement;
    // const renderedItem2 = (this._findRenderedItemByIndex(index2) || renderedItem1) as HTMLElement;
    const renderedItem1 = this._renderedItemsRegistry.get(index1) as HTMLElement;
    const renderedItem2 = (this._renderedItemsRegistry.get(index2) || renderedItem1) as HTMLElement;
    const indexFraction = fractionalIndex - index1;

    if (!renderedItem1) {
      console.error('Missing items for interpolation', index1, index2);
      return 0;
    };

    const itemTop1 = Number(renderedItem1.dataset.top);
    const itemTop2 = Number(renderedItem2.dataset.top);
    const itemHeight1 = Number(renderedItem1.dataset.height);
    const interpolatedHeight = indexFraction * (itemTop2 - itemTop1) || itemHeight1 * indexFraction;
    const interpolatedTop = itemTop1 + interpolatedHeight;

    const viewportAnchor = this._scrollableContainer.getClientHeight() * scrollRatio;

    const position = interpolatedTop - viewportAnchor;

    return position;
  }

  private _renderItems: IMeasurerEvents['onItemsReady'] = (range, items) => {
    // iterate over items
    // assign styles to elements
    // append/prepent elements into scrollable container
    // save item entry into item registry
    // recalculate rendered range

    const scrollableContainer = this._scrollableContainer;
    const itemsCount = items.length;
    const getItemIndex = this._getItemIndex;

    items.forEach(({ target }) => {
      const itemIndex = getItemIndex(target as HTMLElement);
      this._renderedItemsRegistry.set(itemIndex, target as HTMLElement);
    });

    this._removeItems();
    const renderedRange = this._renderedRange;

    // render below (slow scrolling down)
    if (range.startIndex === renderedRange.endIndex + 1) {
      const baseOffset = renderedRange.endOffset;

      for (let i = 0; i < itemsCount; i++) {
        const entry = items[i]!;
        const { width, height, top, bottom } = entry.boundingClientRect;
        const element = entry.target as HTMLElement;

        this._assignStyles(element, width, height, baseOffset + top);

        scrollableContainer.appendItem(element);

        console.log('RENDERED DOWN:', element.dataset.index)
      }

      this._updateContentPosition(0, 'down');
    }
    // render above (slow scrolling up)
    else if (range.endIndex === renderedRange.startIndex - 1) {
      const baseOffset = (renderedRange.startOffset - range.totalHeight);

      for (let i = itemsCount - 1; i >= 0; i--) {
        const entry = items[i]!;
        const { width, height, top, bottom } = entry.boundingClientRect;
        const element = entry.target as HTMLElement;

        this._assignStyles(element, width, height, baseOffset + top);

        scrollableContainer.prependItem(element);

        console.log('RENDERED UP:', element.dataset.index)
      }

      this._updateContentPosition(0, 'down');
    }
    // render in place of (fast scrolling, resize or insert/delete)
    else {
      console.warn('render in place of (fast scrolling, resize or insert/delete)', 'range:', range, 'renderedRange:', renderedRange);

      // scrollableContainer.clear();

      const baseOffset = scrollableContainer.getContentPosition();

      for (let i = 0; i < itemsCount; i++) {
        const entry = items[i]!;
        const { width, height, top, bottom } = entry.boundingClientRect;
        const element = entry.target as HTMLElement;

        this._assignStyles(element, width, height, top);

        scrollableContainer.appendItem(element);

        console.log('RENDERED FAST:', element.dataset.index)
      }

      this._scrollableContainer.updateContentPosition(range.startOffset, range.startOffset);
      this._updateContentPosition(0, 'down');
    }

    this._scheduleSetScrollHeight();
    this._scheduleExtraMeasuring();
  };

  private _setScrollHeight = () => {
    const avgItemHeight = (this._measurer.getMinItemHeight() + this._measurer.getMaxItemHeight()) / 2;

    this._scrollableContainer.setScrollHeight(
       avgItemHeight * this._store.size,
    );

    console.log('set scroll height', avgItemHeight, this._store.size)
  };

  private _scheduleSetScrollHeight = () => {
    console.log('scheduling setting scroll height')
    cancelAnimationFrame(this._scheduledSetScrollHeight);
    this._scheduledSetScrollHeight = requestAnimationFrame(this._setScrollHeight);
  }

  private _scheduleOnChangeMeasuring = (index: number) => {
    const startIndex = this._renderedRange.startIndex;
    const endIndex = this._renderedRange.endIndex;

    if (startIndex <= index && index <= endIndex) {
      this._scheduleItemsMeasuring();
      console.log('scheduled on change measuring start:', startIndex, 'end:', endIndex)
    }
  }

  private _scheduleExtraMeasuring = () => {
    if (
      // range.startIndex - 1 !== this._renderedRange.endIndex
      // && 
      // range.endIndex + 1 !== this._renderedRange.startIndex
      // && 
      this._renderedRange.totalHeight < this._scrollableContainer.getClientHeight()
      &&
      this._renderedRange.endIndex < this._store.size - 1 // prevent infinite loop if items in the store are not enough to fill viewport
    ) {
      // this._scheduleVisibleItemsMeasuring();
      this._scheduleItemsMeasuring();
      console.log('scheduled extra measuring');
    }
  }

  private _scheduleItemsMeasuring = () => {
    /**
     * 1. Rendered range
     * 2. Needed to be rendered range
     * 
     * What contains the first range and does not contain the second should  be removed.
     * What falls into both ranges should be remained.
     * What contains the second range and does not contain the first should be added (appended or prepended depending on scroll direction). 
     */

    const calculatedStartIndex = this._getCalculatedIndex('start');
    const calculatedEndIndex = this._getCalculatedIndex('end');

    const renderedStartIndex = this._renderedRange.startIndex;
    const renderedEndIndex = this._renderedRange.endIndex;

    let removeStartIndex = 0;
    let removeEndIndex = -1; 

    let measureStartIndex = 0;
    let measureEndIndex = -1;

    if (!this._renderedRange.total) {
      this._measurer.measure(0, 0);
    }

    if (
      isStrictlyNestedRange(
        renderedStartIndex, 
        renderedEndIndex, 
        calculatedStartIndex, 
        calculatedEndIndex,
      )
    ) {
      removeStartIndex = renderedStartIndex;
      removeEndIndex = renderedEndIndex;
      measureStartIndex = calculatedStartIndex;
      measureEndIndex = calculatedEndIndex;
    }
    else {
      const { start1, end1, start2, end2 } = getNonNestedRangeDifference(
        renderedStartIndex, 
        renderedEndIndex, 
        calculatedStartIndex, 
        calculatedEndIndex
      );

      removeStartIndex = start1;
      removeEndIndex = end1;
      measureStartIndex = start2;
      measureEndIndex = end2;
    }

    console.log('calculated indeces:', calculatedStartIndex, calculatedEndIndex);
    console.log('rendered indeces:', renderedStartIndex, renderedEndIndex);
    console.log('indeces to measure:', measureStartIndex, measureEndIndex);
    console.log('indeces to remove:', removeStartIndex, removeEndIndex);

    if (measureEndIndex - measureStartIndex >= 0) {
      const { startIndex, endIndex } = this._measurer.getMeasuredRange();

      if (startIndex !== measureStartIndex && endIndex !== measureEndIndex) {
        this._measurer.measure(measureStartIndex, measureEndIndex);
      }
    }
    
    if (removeEndIndex - removeStartIndex >= 0) {
      console.log('scheduled to remove:', removeStartIndex, removeEndIndex)
      this._scheduledToRemove.start = removeStartIndex;
      this._scheduledToRemove.end = removeEndIndex;
    }
  };

  private _updateContentPosition = (position: number, direction: 'up' | 'down') => {
    const minPosition = this._renderedRange.startOffset;
    const maxPosition = Math.abs(this._renderedRange.endOffset - this._scrollableContainer.getClientHeight());
    let newPosition = this._calculateContentPosition();

    if (!(minPosition <= newPosition && newPosition <= maxPosition)) {
      if (direction === 'up'/* && newPosition < minPosition*/) {
        newPosition = minPosition;
        console.warn('min position:', minPosition)
      }
      else if (direction === 'down'/* && newPosition > maxPosition*/) {
        newPosition = maxPosition;
        console.warn('max position:', maxPosition)
      }
    }

    this._scrollableContainer.updateContentPosition(newPosition); 
    console.log('updating content position, min', minPosition, 'new', newPosition, 'max', maxPosition, direction)
  };

  private _removeItems() {
    const itemsToRemove = this._scheduledToRemove;
    const renderedItems = this._renderedItemsRegistry;
    const fromIndex = itemsToRemove.start;
    const toIndex = itemsToRemove.end;

    if (fromIndex === null || toIndex === null) return;

    for (let itemIndex = fromIndex; itemIndex <= toIndex; itemIndex++) {
      // const item = this._findRenderedItemByIndex(itemIndex) as HTMLElement | null;
      const item = renderedItems.get(itemIndex);
      
      if (item) {
        item.remove();
        renderedItems.delete(itemIndex);
        console.log('REMOVED:', itemIndex)
      }
      else {
        // throw new Error(`Can't find rendered item ${itemIndex}.`)
      }
    }

    itemsToRemove.start = null;
    itemsToRemove.end = null;
  }

  constructor({ container, eventBus, store, overscanHeight = 100 }: DynamicListRendererOptions) {
    this._container = container;
    this._store = store;
    this._overscanHeight = overscanHeight;
    this._scrollableContainer = new ScrollableContainer(
      container, 
      eventBus, 
      overscanHeight,
    );
    this._measurer = new DynamicListMeasurer({
      overscanHeight,
      container,
      eventBus,
      store,
    });

    container.scroll({ top: 0 });

    eventBus.on('onScroll', this._scheduleItemsMeasuring);
    eventBus.on('onScroll', this._updateContentPosition);

    eventBus.on('onItemsReady', (...args) => requestAnimationFrame(() => this._renderItems(...args)));

    eventBus.on('onInsert', this._scheduleOnChangeMeasuring);
    eventBus.on('onDelete', this._scheduleOnChangeMeasuring);
  }
}