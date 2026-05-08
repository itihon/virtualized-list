/**
 * @fileoverview DOMRenderer.
 * @license MIT
 * @author Alexandr Kalabin
 */

import DOMConstructor from './DOMConstructor';
import ScrollableContainer from "./NativeScrollContainer";
import type { IRangeRenderer, ScrollDirection, IItemStore, IItem } from "../types/types";
import classes from './NativeScrollContainer.module.css';

export default class DOMRenderer implements IRangeRenderer {
  private _store: IItemStore<IItem> | null = null;
  private _scrollableContainer: ScrollableContainer;
  private _renderedIndexRegistry = new Map<Element, number>();
  private _renderedItemsRegistry = new Map<number, Element>();

  private _getRenderedBoundaryIndex(boundary: 'first' | 'last'): number | undefined {
    const renderedItem = boundary === 'first'
      ? this._scrollableContainer.getFirstItem()
      : boundary === 'last'
        ? this._scrollableContainer.getLastItem()
        : null;

    if (!renderedItem) return;

    return this.getIndex(renderedItem);
  }

  constructor(container: HTMLElement) {
    const scrollHeightFiller = new DOMConstructor(container, [classes.scrollHeightFiller]);
    const viewportContainer = new DOMConstructor(container, [classes.viewportContainer]);
    const scrollCanvas = new DOMConstructor(viewportContainer.DOMRoot, [classes.scrollCanvas]);
    const topSpacer = new DOMConstructor(scrollCanvas.DOMRoot, [classes.topSpacer]);
    const contentLayer = new DOMConstructor(scrollCanvas.DOMRoot, [classes.contentLayer]);
    const bottomSpacer = new DOMConstructor(scrollCanvas.DOMRoot, [classes.bottomSpacer]);
    
    container.classList.add(classes.scrollableContainer);

    this._scrollableContainer = new ScrollableContainer({ 
      container, 
      scrollHeightFiller, 
      viewportContainer, 
      scrollCanvas, 
      topSpacer, 
      contentLayer, 
      bottomSpacer,
    });
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
       
        if (removeStartIndex < removeEndIndex) {
          removedHeight = this.removeRange(removeStartIndex, removeEndIndex);
        }
      }
    }
    else if (direction === 'up') {
      console.log('SCROLLING UP')

      if (removeEndIndex !== undefined && firstRenderedIndex !== undefined) {
        removeStartIndex = Math.max(renderEndIndex + 1, firstRenderedIndex);
        renderEndIndex = Math.min(firstRenderedIndex - 1, renderEndIndex);
       
        console.log('remove:', removeStartIndex, removeEndIndex)
        if (removeStartIndex < removeEndIndex) {
          removedHeight = this.removeRange(removeStartIndex, removeEndIndex);
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

  removeRange(startIndex: number, endIndex: number): number {
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

  clear() {
    this._scrollableContainer.clear();
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
    /* not needed for direct DOM manipulations */
  }
}