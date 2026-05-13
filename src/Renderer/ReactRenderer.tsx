/**
 * @fileoverview ReactRenderer.
 * @license MIT
 * @author Alexandr Kalabin
 */

import { flushSync } from 'react-dom';
import DOMConstructor from './DOMConstructor';
import ScrollableContainer from "./NativeScrollContainer";
import type { IRangeRenderer, ScrollDirection, IItemStore, IItem, IReactItem } from "../types/types";
import classes from './NativeScrollContainer.module.css';

type ReactRendererOptions = {
  container: HTMLElement;
  scrollHeightFiller: HTMLElement;
  viewportContainer: HTMLElement;
  scrollCanvas: HTMLElement;
  topSpacer: HTMLElement;
  contentLayer: HTMLElement;
  bottomSpacer: HTMLElement;
  itemsSetter: React.Dispatch<React.SetStateAction<React.ReactNode[]>>;
}

interface IReactRenderer {
  commit: () => void;
}

type IndexedRef = React.RefObject<HTMLDivElement | null> & { idx: number };

export default class ReactRenderer implements IRangeRenderer, IReactRenderer {
  private _store: IItemStore<IItem> | null = null;
  private _scrollableContainer: ScrollableContainer;
  private _renderedIndexRegistry = new Map<Element, number>();
  private _renderedItemsRegistry = new Map<number, Element>();
  private _itemsSetter: React.Dispatch<React.SetStateAction<React.ReactNode[]>>;
  private _renderedRangeRefPool = new Map<number, IndexedRef>();
  private _listItems: React.ReactNode[] = [];
  private _flushItems = () => { this._itemsSetter(this._listItems); };

  private _getRenderedBoundaryIndex(boundary: 'first' | 'last'): number | undefined {
    const renderedItem = boundary === 'first'
      ? this._scrollableContainer.getFirstItem()
      : boundary === 'last'
        ? this._scrollableContainer.getLastItem()
        : null;

    if (!renderedItem) return;

    return this.getIndex(renderedItem);
  }

  constructor(opts: ReactRendererOptions) {
    const container = opts.container;
    const scrollHeightFiller = new DOMConstructor(container, [classes.scrollHeightFiller], opts.scrollHeightFiller);
    const viewportContainer = new DOMConstructor(container, [classes.viewportContainer], opts.viewportContainer);
    const scrollCanvas = new DOMConstructor(viewportContainer.DOMRoot, [classes.scrollCanvas], opts.scrollCanvas);
    const topSpacer = new DOMConstructor(scrollCanvas.DOMRoot, [classes.topSpacer], opts.topSpacer);
    const contentLayer = new DOMConstructor(scrollCanvas.DOMRoot, [classes.contentLayer], opts.contentLayer);
    const bottomSpacer = new DOMConstructor(scrollCanvas.DOMRoot, [classes.bottomSpacer], opts.bottomSpacer);
    
    opts.container.classList.add(classes.scrollableContainer);

    this._scrollableContainer = new ScrollableContainer({ 
      container, 
      scrollHeightFiller, 
      viewportContainer, 
      scrollCanvas, 
      topSpacer, 
      contentLayer, 
      bottomSpacer,
    });

    this._itemsSetter = opts.itemsSetter;
  }

  render(startIndex: number, endIndex: number, direction: ScrollDirection): number {
    const firstRenderedIndex = this._getRenderedBoundaryIndex('first');
    const lastRenderedIndex = this._getRenderedBoundaryIndex('last');

    let renderStartIndex = startIndex;
    let renderEndIndex = endIndex;
    let removeStartIndex = firstRenderedIndex;
    let removeEndIndex = lastRenderedIndex;
    let removedHeight = 0;

    if (direction === 'down') {
      console.log('SCROLLING DOWN')

      if (removeStartIndex !== undefined && lastRenderedIndex !== undefined) {
        removeEndIndex = Math.min(renderStartIndex - 1, lastRenderedIndex);
        renderStartIndex = Math.max(lastRenderedIndex + 1, renderStartIndex);
       
        if (removeStartIndex <= removeEndIndex) {
          removedHeight = this.removeRange(removeStartIndex, removeEndIndex, direction);
        }
      }
    }
    else if (direction === 'up') {
      console.log('SCROLLING UP')

      if (removeEndIndex !== undefined && firstRenderedIndex !== undefined) {
        removeStartIndex = Math.max(renderEndIndex + 1, firstRenderedIndex);
        renderEndIndex = Math.min(firstRenderedIndex - 1, renderEndIndex);
       
        if (removeStartIndex <= removeEndIndex) {
          removedHeight = this.removeRange(removeStartIndex, removeEndIndex, direction);
        }
      }
    }

    if (renderStartIndex < renderEndIndex) {
      this.renderRange(renderStartIndex, renderEndIndex, direction);
    }

    return removedHeight;
  }

  renderRange(startIndex: number, endIndex: number, direction: ScrollDirection) {
    console.log('_renderRange', startIndex, endIndex, direction)
    if (startIndex > endIndex) console.error('_renderRange', startIndex, endIndex, direction);

    const store = this._store;
    // const listItems = [];
    const listItems = this._listItems;
    const itemsToAdd: React.ReactNode[] = [];
    const refPool = this._renderedRangeRefPool;

    if (!store) return;

    for (let idx = startIndex; idx <= endIndex; idx++) {
      const item = store.getByIndex(idx) as unknown as IReactItem | undefined;

      if (item) {
        const ListItem = item.render;

        const ref: IndexedRef = refPool.get(idx) || { current: null, idx };

        refPool.set(idx, ref);
        itemsToAdd.push(<ListItem data={item.data} key={idx} ref={ref} index={idx} />);
      }
    }

    this._listItems = direction === 'down' 
      ? listItems.concat(itemsToAdd)
      : direction === 'up'
        ? itemsToAdd.concat(listItems)
        : this._listItems;
  }

  removeRange(startIndex: number, endIndex: number, direction: ScrollDirection): number {
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
      this._listItems = direction === 'down'
        ? this._listItems.slice(removedItemsCount)
        : direction === 'up'
          ? this._listItems.slice(0, -removedItemsCount)
          : this._listItems;
    }

    console.log('_removeItems startIndex:', startIndex, 'endIndex:', endIndex, 'removedHeight:', endRange > startRange ? endRange - startRange : 0, 'removedItemsCount:', removedItemsCount);

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

  attach(store: IItemStore<IItem>) {
    this._store = store;
  }

  flush() {
    flushSync(this._flushItems);
    return Promise.resolve();
  }

  commit() {
    const renderedIndeces = this._renderedIndexRegistry;
    const renderedItems = this._renderedItemsRegistry;
    const renderedRefs = this._renderedRangeRefPool;

    for (const ref of renderedRefs.values()) {
      const { idx, current: element } = ref;

      if (element) {
        renderedIndeces.set(element, idx);
        renderedItems.set(idx, element);
      }
    }

    renderedRefs.clear();
  }
}