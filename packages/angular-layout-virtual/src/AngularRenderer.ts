/**
 * @fileoverview AngularRenderer.
 * @license MIT
 * @author Alexandr Kalabin
 */

import { ScrollableContainer } from 'layout-virtual';
import type {
  IItem,
  IItemStore,
  IRangeRenderer,
  ScrollDirection,
  VirtualScrollStructure,
} from 'layout-virtual/types';

export interface ListItemProps<T = unknown> {
  data: T;
  index: number;
}

type AngularRendererOptions<T> = {
  itemsSetter: (items: ListItemProps<T>[]) => void;
  itemsFlusher: () => void;
} & VirtualScrollStructure;

export type AngularListItem<T = unknown> = {
  data: T;
  render?: unknown;
};

export default class AngularRenderer<T> implements IRangeRenderer<T> {
  private _store: IItemStore<IItem<T>> | null = null;
  private _scrollableContainer: ScrollableContainer;
  private _renderedIndexRegistry = new Map<Element, number>();
  private _renderedItemsRegistry = new Map<number, Element>();
  private _itemsSetter: (items: ListItemProps<T>[]) => void;
  private _itemsFlusher: () => void;
  private _listItems: ListItemProps<T>[] = [];

  private _getRenderedBoundaryIndex(
    boundary: 'first' | 'last',
  ): number | undefined {
    const renderedItem =
      boundary === 'first'
        ? this._scrollableContainer.getFirstItem()
        : boundary === 'last'
          ? this._scrollableContainer.getLastItem()
          : null;

    if (!renderedItem) return;

    return this.getIndex(renderedItem);
  }

  constructor(opts: AngularRendererOptions<T>) {
    this._scrollableContainer = new ScrollableContainer({ ...opts });
    this._itemsSetter = opts.itemsSetter;
    this._itemsFlusher = opts.itemsFlusher;
  }

  render(
    startIndex: number,
    endIndex: number,
    direction: ScrollDirection,
  ): number {
    const firstRenderedIndex = this._getRenderedBoundaryIndex('first');
    const lastRenderedIndex = this._getRenderedBoundaryIndex('last');

    let renderStartIndex = startIndex;
    let renderEndIndex = endIndex;
    let removeStartIndex = firstRenderedIndex;
    let removeEndIndex = lastRenderedIndex;
    let removedHeight = 0;

    if (direction === 'down') {
      if (removeStartIndex !== undefined && lastRenderedIndex !== undefined) {
        removeEndIndex = Math.min(renderStartIndex - 1, lastRenderedIndex);
        renderStartIndex = Math.max(lastRenderedIndex + 1, renderStartIndex);

        if (removeStartIndex <= removeEndIndex) {
          removedHeight = this.removeRange(
            removeStartIndex,
            removeEndIndex,
            direction,
          );
        }
      }
    } else if (direction === 'up') {
      if (removeEndIndex !== undefined && firstRenderedIndex !== undefined) {
        removeStartIndex = Math.max(renderEndIndex + 1, firstRenderedIndex);
        renderEndIndex = Math.min(firstRenderedIndex - 1, renderEndIndex);

        if (removeStartIndex <= removeEndIndex) {
          removedHeight = this.removeRange(
            removeStartIndex,
            removeEndIndex,
            direction,
          );
        }
      }
    }

    if (renderStartIndex < renderEndIndex) {
      this.renderRange(renderStartIndex, renderEndIndex, direction);
    }

    return removedHeight;
  }

  renderRange(
    startIndex: number,
    endIndex: number,
    direction: ScrollDirection,
  ) {
    const store = this._store;
    const listItems = this._listItems;
    const itemsToAdd: ListItemProps<T>[] = [];

    if (!store) return;

    for (let idx = startIndex; idx <= endIndex; idx++) {
      const item = store.getByIndex(idx) as AngularListItem<T> | undefined;

      if (item) {
        itemsToAdd.push({ data: item.data, index: idx });
      }
    }

    this._listItems =
      direction === 'down'
        ? listItems.concat(itemsToAdd)
        : direction === 'up'
          ? itemsToAdd.concat(listItems)
          : this._listItems;
  }

  removeRange(
    startIndex: number,
    endIndex: number,
    direction: ScrollDirection,
  ): number {
    const renderedIndeces = this._renderedIndexRegistry;
    const renderedItems = this._renderedItemsRegistry;
    let removedItemsCount = 0;
    let startRange = Infinity;
    let endRange = 0;

    for (let idx = startIndex; idx <= endIndex; idx++) {
      const itemToRemove = renderedItems.get(idx);

      if (itemToRemove) {
        const { offsetTop, offsetHeight } = itemToRemove as HTMLElement;

        startRange = Math.min(startRange, offsetTop);
        endRange = Math.max(endRange, offsetTop + offsetHeight);

        renderedItems.delete(idx);
        renderedIndeces.delete(itemToRemove);
        removedItemsCount++;
      }
    }

    if (removedItemsCount) {
      this._listItems =
        direction === 'down'
          ? this._listItems.slice(removedItemsCount)
          : direction === 'up'
            ? this._listItems.slice(0, -removedItemsCount)
            : this._listItems;
    }

    return endRange > startRange ? endRange - startRange : 0;
  }

  clear() {
    this._renderedIndexRegistry.clear();
    this._renderedItemsRegistry.clear();
    this._listItems = [];
    this._itemsSetter(this._listItems);
  }

  getIndex(item: Element): number | undefined {
    return this._renderedIndexRegistry.get(item);
  }

  getItem(index: number): Element | undefined {
    return this._renderedItemsRegistry.get(index);
  }

  get scrollableContainer(): ScrollableContainer {
    return this._scrollableContainer;
  }

  attach(store: IItemStore<IItem<T>>) {
    this._store = store;
  }

  flush() {
    this._itemsSetter(this._listItems);
    this._itemsFlusher();
    return Promise.resolve();
  }

  commit(renderedRefs: Map<number, Element>) {
    console.log('commit', renderedRefs);
    const renderedIndeces = this._renderedIndexRegistry;
    const renderedItems = this._renderedItemsRegistry;

    for (const [idx, element] of renderedRefs.entries()) {
      renderedIndeces.set(element, idx);
      renderedItems.set(idx, element);
    }

    renderedRefs.clear();
  }
}
