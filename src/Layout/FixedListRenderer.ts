/**
 * @fileoverview FixedListRenderer renders items with pre-calculated offsets and sizes on scroll event.
 * @license MIT
 * @author Alexandr Kalabin
 */

import ScrollableContainer from "../ScrollableContainer/ScrollableContainer";
import isRangeIntersecting from "./isRangeIntersecting";
import type { 
  IFixedItem,
  MeasuredItem,
  IItemStore, 
  IScrollableContainerEvents,
  IEventEmitter,
  IEventMap,
  IMeasurerEvents,
} from "../types/types";

export default class FixedListRenderer {
  private _container: HTMLElement;
  private _store: IItemStore<IFixedItem>;
  private _overscanHeight: number;
  private _scrollableContainer: ScrollableContainer;
  private _renderedItemsRegistry = new WeakMap<Element, MeasuredItem<IFixedItem>>();

  private _assignStyles(element: HTMLElement, item: MeasuredItem<IFixedItem>): HTMLElement {
    if (element && element.style) {
      Object.assign(element.style, {
        position: 'absolute',
        height: `${item.height}px`,
        marginTop: `${item.marginTop}px`,
        marginBottom: `${item.marginBottom}px`,
        top: `${item.offsetTop}px`,
      });
    }

    return element;
  }

  private _renderNext(fromElement?: MeasuredItem<IFixedItem>) {
    let lastItem = fromElement;

    if (lastItem) {
      const necessaryHeight = (this._scrollableContainer.getClientHeight() + this._overscanHeight) - ((lastItem.offsetTop || 0) - this._scrollableContainer.getContentPostion());
      const lastItemOffset = lastItem.offsetTop || 0;
      let accumulatedHeight = 0;

      while (accumulatedHeight < necessaryHeight && (lastItem = this._store.getNext(lastItem))) {
        accumulatedHeight += (lastItem.offsetTop || 0) - lastItemOffset;
        const renderedItem = this._assignStyles(lastItem.render(lastItem.data), lastItem);
        this._renderedItemsRegistry.set(renderedItem, lastItem);
        this._scrollableContainer.appendItem(renderedItem);
      }
    }
  }

  private _renderPrevious(fromElement?: MeasuredItem<IFixedItem>) {
    let lastItem = fromElement;

    if (lastItem) {
      const necessaryHeight = (lastItem.offsetTop || 0) - (this._scrollableContainer.getContentPostion() - this._overscanHeight);
      const lastItemOffset = lastItem.offsetTop || 0;
      let accumulatedHeight = 0;

      while (accumulatedHeight < necessaryHeight && (lastItem = this._store.getPrevious(lastItem))) {
        accumulatedHeight += lastItemOffset - (lastItem.offsetTop || 0);
        const renderedItem = this._assignStyles(lastItem.render(lastItem.data), lastItem);
        this._renderedItemsRegistry.set(renderedItem, lastItem);
        this._scrollableContainer.prependItem(renderedItem);
      }
    }
  }

  private _renderRange(start: number, necessaryHeight: number) {
    let item = this._store.getByOffset(start);

    if (item) {

      let previousItemOffset = item.offsetTop || 0;
      let accumulatedHeight = 0;

      do {
        accumulatedHeight += (item.offsetTop || 0) - previousItemOffset;
        previousItemOffset = (item.offsetTop || 0);
        
        const renderedItem = this._assignStyles(item.render(item.data), item);
        this._renderedItemsRegistry.set(renderedItem, item);
        this._scrollableContainer.appendItem(renderedItem);
      } while (accumulatedHeight < necessaryHeight && (item = this._store.getNext(item)))
    }
  }

  private _removeItemsOutOfView(direction: 'up' | 'down') {
    if (direction === 'down') {
      let itemFullOffset = 0;
      const contentOffset = this._scrollableContainer.getContentPostion();

      while (itemFullOffset < contentOffset) {
        const firstRenderedElement = this._scrollableContainer.getFirstItem();

        if (firstRenderedElement) {
          const firstItem = this._renderedItemsRegistry.get(firstRenderedElement);

          if (firstItem) {

            itemFullOffset = (firstItem.offsetTop || 0) + (firstItem.height || 0);

            if (itemFullOffset < contentOffset) {
              firstRenderedElement.remove();
            }
          }
        }
      }
    }

    if (direction === 'up') {
      let itemOffset = Infinity;
      const contentOffsetBottom = this._scrollableContainer.getContentPostion() 
        + this._scrollableContainer.getClientHeight() 
        + this._overscanHeight;

      while (itemOffset > contentOffsetBottom) {
        const lastRenderedElement = this._scrollableContainer.getLastItem();

        if (lastRenderedElement) {
          const lastItem = this._renderedItemsRegistry.get(lastRenderedElement);

          if (lastItem) {

            itemOffset = (lastItem.offsetTop || 0);

            if (itemOffset > contentOffsetBottom) {
              lastRenderedElement.remove();
            }
          }
        }
      }
    }
  }

  private _renderItems: IScrollableContainerEvents['onScroll'] = (position, direction, speed) => {
    if (direction === 'down') {
      if (speed === 'slow') {
        const lastRenderedElement = this._scrollableContainer.getLastItem();

        if (lastRenderedElement) {
          const lastItem = this._renderedItemsRegistry.get(lastRenderedElement);

          this._renderNext(lastItem);
        }

        this._removeItemsOutOfView(direction);
        this._scrollableContainer.updateContentPosition(position);
      }

      if (speed === 'fast') {
        this._scrollableContainer.clear();
        this._renderRange(position, this._scrollableContainer.getClientHeight());
        this._scrollableContainer.updateContentPosition(position, position);
      }
    }

    if (direction === 'up') {
      if (speed === 'slow') {
        const firstRenderedElement = this._scrollableContainer.getFirstItem();

        if (firstRenderedElement) {
          const firstItem = this._renderedItemsRegistry.get(firstRenderedElement);

          this._renderPrevious(firstItem);
        }

        this._removeItemsOutOfView(direction);
        this._scrollableContainer.updateContentPosition(position);
      }

      if (speed === 'fast') {
        this._scrollableContainer.clear();
        this._renderRange(position, this._scrollableContainer.getClientHeight());
        this._scrollableContainer.updateContentPosition(position, position);
      }
    }
  }

  private _updateVisibleItems: IMeasurerEvents['onPortionMeasured'] = (range) => {
    const scrollTop = this._container.scrollTop;
    const height = this._scrollableContainer.getClientHeight();

    const willRender = isRangeIntersecting(
      range.startOffset, 
      range.endOffset, 
      scrollTop,
      scrollTop + height
    );

    if (willRender) {
      this._scrollableContainer.clear();
      this._renderRange(scrollTop, scrollTop + height);
    }
  }

  private _updateOnResize = () => {
    const scrollTop = this._container.scrollTop;
    const height = this._scrollableContainer.getClientHeight();
    this._scrollableContainer.clear();
    this._renderRange(scrollTop, scrollTop + height);
  };

  private _setScrollHeight: IMeasurerEvents['onMeasureEnd'] = (range) => {
    this._scrollableContainer.setScrollHeight(range.totalHeight);
  }

  constructor(container: HTMLElement, eventBus: IEventEmitter<IEventMap>, store: IItemStore<IFixedItem>, overscanHeight = 100) {
    this._container = container;
    this._store = store;
    this._overscanHeight = overscanHeight;
    this._scrollableContainer = new ScrollableContainer(container, eventBus, overscanHeight);

    eventBus.on('onScroll', this._renderItems);
    eventBus.on('onPortionMeasured', this._updateVisibleItems);
    eventBus.on('onResize', this._updateOnResize);
    eventBus.on('onMeasureEnd', this._setScrollHeight);
  }
}